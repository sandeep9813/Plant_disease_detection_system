import json
import base64
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageFilter
import io
from contextlib import asynccontextmanager
from pathlib import Path

# Global placeholders for model and knowledge base
model = None
knowledge_base = {}
BASE_DIR = Path(__file__).resolve().parent
LOW_CONFIDENCE_THRESHOLD = 60.0

# Class mapping from the model's 38 output indices (standard alphabetical order of PlantVillage subdirectories)
# to the corresponding keys in our knowledge base.
CLASS_NAMES = [
    "Apple - Apple Scab",                        # Index 0: Apple___Apple_scab
    "Apple - Black Rot",                         # Index 1: Apple___Black_rot
    "Apple - Cedar Apple Rust",                  # Index 2: Apple___Cedar_apple_rust
    "Apple - Healthy",                           # Index 3: Apple___healthy
    "Blueberry - Healthy",                       # Index 4: Blueberry___healthy
    "Cherry - Powdery Mildew",                   # Index 5: Cherry___Powdery_mildew
    "Cherry - Healthy",                          # Index 6: Cherry___healthy
    "Corn (Maize) - Cercospora Leaf Spot",       # Index 7: Corn___Cercospora_leaf_spot Gray_leaf_spot
    "Corn (Maize) - Common Rust",                # Index 8: Corn___Common_rust
    "Corn (Maize) - Northern Leaf Blight",       # Index 9: Corn___Northern_Leaf_Blight
    "Corn (Maize) - Healthy",                    # Index 10: Corn___healthy
    "Grape - Black Rot",                         # Index 11: Grape___Black_rot
    "Grape - Esca (Black Measles)",              # Index 12: Grape___Esca_(Black_Measles)
    "Grape - Leaf Blight",                       # Index 13: Grape___Leaf_blight_(Isariopsis_Leaf_Spot)
    "Grape - Healthy",                           # Index 14: Grape___healthy
    "Orange - Haunglongbing (Citrus Greening)",  # Index 15: Orange___Haunglongbing_(Citrus_greening)
    "Peach - Bacterial Spot",                    # Index 16: Peach___Bacterial_spot
    "Peach - Healthy",                           # Index 17: Peach___healthy
    "Bell Pepper - Bacterial Spot",              # Index 18: Pepper,_bell___Bacterial_spot
    "Bell Pepper - Healthy",                     # Index 19: Pepper,_bell___healthy
    "Potato - Early Blight",                     # Index 20: Potato___Early_blight
    "Potato - Late Blight",                      # Index 21: Potato___Late_blight
    "Potato - Healthy",                          # Index 22: Potato___healthy
    "Raspberry - Healthy",                       # Index 23: Raspberry___healthy
    "Soybean - Healthy",                         # Index 24: Soybean___healthy
    "Squash - Powdery Mildew",                   # Index 25: Squash___Powdery_mildew
    "Strawberry - Leaf Scorch",                  # Index 26: Strawberry___Leaf_scorch
    "Strawberry - Healthy",                      # Index 27: Strawberry___healthy
    "Tomato - Bacterial Spot",                   # Index 28: Tomato___Bacterial_spot
    "Tomato - Early Blight",                     # Index 29: Tomato___Early_blight
    "Tomato - Late Blight",                      # Index 30: Tomato___Late_blight
    "Tomato - Leaf Mold",                        # Index 31: Tomato___Leaf_mold
    "Tomato - Septoria Leaf Spot",               # Index 32: Tomato___Septoria_leaf_spot
    "Tomato - Spider Mites (Two-Spotted Spider Mite)", # Index 33: Tomato___Spider_mites Two-spotted_spider_mite
    "Tomato - Target Spot",                      # Index 34: Tomato___Target_Spot
    "Tomato - Yellow Leaf Curl Virus",           # Index 35: Tomato___Tomato_Yellow_Leaf_Curl_Virus
    "Tomato - Tomato Mosaic Virus",              # Index 36: Tomato___Tomato_mosaic_virus
    "Tomato - Healthy"                           # Index 37: Tomato___healthy
]

# Lifespan manager to load assets once on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, knowledge_base
    
    # 1. Load the Keras CNN Model
    model_path = BASE_DIR / "trained_plant_disease_model.keras"
    if model_path.exists():
        print(f"Loading Keras model from {model_path}...")
        model = tf.keras.models.load_model(model_path)
        output_classes = model.output_shape[-1]
        if output_classes != len(CLASS_NAMES):
            raise RuntimeError(
                f"Model outputs {output_classes} classes, but CLASS_NAMES has {len(CLASS_NAMES)} labels."
            )
        print("Model loaded successfully.")
    else:
        print(f"Warning: Model file not found at {model_path}.")
        
    # 2. Load the JSON Knowledge Base
    kb_path = BASE_DIR / "knowledge_base.json"
    if kb_path.exists():
        print(f"Loading knowledge base from {kb_path}...")
        with open(kb_path, "r", encoding="utf-8") as f:
            knowledge_base = json.load(f)
        print(f"Loaded {len(knowledge_base)} items from knowledge base.")
    else:
        print(f"Warning: Knowledge base file not found at {kb_path}.")
        
    yield
    # Shutdown logic
    print("Shutting down backend...")

app = FastAPI(
    title="PlantGuard AI Backend",
    description="FastAPI backend serving Plant Disease Detection and AI Chat advice.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for easy local workspace testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema for Chat endpoint
class ChatRequest(BaseModel):
    message: str
    history: list = []

def has_nepali_text(message):
    return any("\u0900" <= char <= "\u097f" for char in message)

def get_confidence_message(confidence):
    if confidence < LOW_CONFIDENCE_THRESHOLD:
        return (
            "The model is not very confident. Try another clear leaf photo with good lighting, "
            "or use the top predictions as possibilities instead of a final diagnosis."
        )
    return "The model has enough confidence for a primary diagnosis."

def generate_gradcam_overlay(image, img_array, class_index):
    def build_overlay_from_heatmap(heatmap_values):
        heatmap_image = Image.fromarray(np.uint8(255 * heatmap_values)).resize(image.size, Image.Resampling.BILINEAR)
        heatmap_array = np.array(heatmap_image, dtype=np.float32) / 255.0
        
        original = np.array(image, dtype=np.float32)
        overlay = original.copy()
        overlay[:, :, 0] = np.clip(overlay[:, :, 0] + heatmap_array * 130, 0, 255)
        overlay[:, :, 1] = np.clip(overlay[:, :, 1] * (1 - heatmap_array * 0.35), 0, 255)
        overlay[:, :, 2] = np.clip(overlay[:, :, 2] * (1 - heatmap_array * 0.45), 0, 255)
        
        blended = Image.blend(image, Image.fromarray(np.uint8(overlay)), alpha=0.45)
        buffer = io.BytesIO()
        blended.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"
    
    def build_visual_fallback():
        edges = image.convert("L").filter(ImageFilter.FIND_EDGES)
        edge_array = np.array(edges, dtype=np.float32)
        max_edge = edge_array.max()
        if max_edge == 0:
            return None
        return build_overlay_from_heatmap(edge_array / max_edge)
    
    conv_layers = [layer for layer in model.layers if isinstance(layer, tf.keras.layers.Conv2D)]
    if not conv_layers:
        return build_visual_fallback()
    
    last_conv_layer = conv_layers[-1]
    grad_model = tf.keras.models.Model(
        model.inputs,
        [last_conv_layer.output, model.outputs[0]]
    )
    
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        class_channel = predictions[:, class_index]
        
    grads = tape.gradient(class_channel, conv_outputs)
    if grads is None:
        return build_visual_fallback()
        
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_outputs = conv_outputs[0]
    heatmap = tf.reduce_sum(conv_outputs * pooled_grads, axis=-1)
    heatmap = tf.maximum(heatmap, 0)
    max_value = tf.reduce_max(heatmap)
    if float(max_value) == 0.0:
        return build_visual_fallback()
        
    heatmap = (heatmap / max_value).numpy()
    return build_overlay_from_heatmap(heatmap)

def build_supported_crops_text():
    return (
        "Apple, Blueberry, Cherry, Corn (Maize), Grape, Orange, Peach, "
        "Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato"
    )

def get_general_plant_answer(message_clean, query_words):
    if has_nepali_text(message_clean):
        if any(word in message_clean for word in ["रोग", "बिरुवा", "बाली"]):
            if any(word in message_clean for word in ["के हो", "भनेको", "अर्थ"]):
                return (
                    "**बिरुवाको रोग**\n\n"
                    "बिरुवाको रोग भनेको बिरुवाको सामान्य वृद्धि, पात, डाँठ, जरा, फूल वा फलमा असर पार्ने अवस्था हो। "
                    "यो फंगस, ब्याक्टेरिया, भाइरस, किराको क्षति, धेरै चिस्यान, खराब माटो वा पोषणको कमीका कारण हुन सक्छ।\n\n"
                    "**सामान्य लक्षणहरू**\n"
                    "- पातमा पहेंलो, खैरो वा कालो दाग\n"
                    "- पात बटारिनु, ओइलाउनु वा झर्नु\n"
                    "- सेतो धुलो जस्तो तह, ढुसी वा कुहिने समस्या\n"
                    "- बोट सानो रहनु वा फल राम्रो नलाग्नु\n\n"
                    "**पहिलो काम**\n"
                    "संक्रमित पात हटाउनुहोस्, पात भिज्ने गरी पानी नहाल्नुहोस्, हावा चल्ने ठाउँ मिलाउनुहोस्, र समस्या फैलिँदैछ कि छैन हेर्नुहोस्।"
                )
            if any(word in message_clean for word in ["रोकथाम", "बचाउने", "जोगाउने", "रोक्ने"]):
                return (
                    "**बिरुवाको रोग रोकथाम**\n\n"
                    "- पानी पातमा होइन, जराको नजिक हाल्नुहोस्\n"
                    "- बिरुवाबीच पर्याप्त दूरी राख्नुहोस्\n"
                    "- झरेका वा संक्रमित पात हटाउनुहोस्\n"
                    "- औजार सफा राख्नुहोस्\n"
                    "- सकेसम्म बाली चक्र अपनाउनुहोस्\n"
                    "- धेरै पानी जम्न नदिनुहोस्\n\n"
                    "**राम्रो बानी**\n"
                    "पातको तल्लो भाग नियमित हेर्नुहोस्, धेरै रोग र किराको सुरुवाती संकेत त्यहीँ देखिन्छ।"
                )
            if any(word in message_clean for word in ["उपचार", "ठिक", "निको", "नियन्त्रण"]):
                return (
                    "**सामान्य उपचार**\n\n"
                    "- धेरै संक्रमित पात वा फल हटाउनुहोस्\n"
                    "- पानी हाल्दा पात भिज्न नदिनुहोस्\n"
                    "- हावा चल्ने बनाउन बाक्लो हाँगा छाँट्नुहोस्\n"
                    "- आवश्यक भए नीम तेल, कपर, सल्फर वा उपयुक्त जैविक फंगिसाइड प्रयोग गर्नुहोस्\n"
                    "- रोग धेरै फैलिएको छ भने रोगअनुसारको औषधि प्रयोग गर्नुहोस्\n\n"
                    "**नोट**\n"
                    "ठ्याक्कै उपचार रोगअनुसार फरक हुन्छ। तपाईंले \"tomato early blight को उपचार\" जस्तो सोध्न सक्नुहुन्छ।"
                )
            if any(word in message_clean for word in ["लक्षण", "चिन्ने", "पहिचान"]):
                return (
                    "**सामान्य लक्षणहरू**\n\n"
                    "- पातमा दाग, पहेंलोपन वा कालोपन\n"
                    "- पात बटारिनु, सुक्नु वा झर्नु\n"
                    "- सेतो ढुसी, खिया जस्तो दाग वा कुहिने भाग\n"
                    "- बोटको वृद्धि रोकिनु\n"
                    "- फलमा दाग, फाट्ने वा कुहिने समस्या\n\n"
                    "**छिटो जाँच**\n"
                    "एउटा पातबाट धेरै पात वा अर्को बोटमा फैलिँदैछ भने रोग हुन सक्ने सम्भावना बढी हुन्छ।"
                )
    
    asks_about_disease = (
        "disease" in query_words
        or "diseases" in query_words
        or "infection" in query_words
        or "infections" in query_words
    )
    asks_about_plants = "plant" in query_words or "plants" in query_words or "crop" in query_words or "crops" in query_words
    
    if asks_about_plants and asks_about_disease and any(term in message_clean for term in ["what is", "what are", "define", "meaning"]):
        return (
            "**Plant Disease**\n\n"
            "A plant disease is a condition that stops a plant from growing normally or staying healthy. "
            "It may affect leaves, stems, roots, flowers, or fruit.\n\n"
            "**Common Causes**\n"
            "- Fungi, bacteria, viruses, and nematodes\n"
            "- Poor soil drainage or overwatering\n"
            "- Nutrient deficiency or excess fertilizer\n"
            "- Pest damage that opens wounds for infection\n"
            "- Humid weather, weak airflow, and infected plant debris\n\n"
            "**Common Signs**\n"
            "- Spots, blight, mold, rust, or powdery patches on leaves\n"
            "- Yellowing, curling, wilting, or stunted growth\n"
            "- Rotting roots, stems, fruit, or flowers\n"
            "- Unusual patterns such as mosaics, rings, or streaks\n\n"
            "**What To Do First**\n"
            "Remove badly affected leaves, avoid overhead watering, improve airflow, and keep the plant separate if infection may spread."
        )
    
    if asks_about_disease and any(word in query_words for word in ["cause", "causes", "causing", "why"]):
        return (
            "**Causes Of Plant Disease**\n\n"
            "Plant diseases usually happen when a harmful organism, a weak plant, and favorable weather meet at the same time.\n\n"
            "**Main Causes**\n"
            "- Fungal spores growing in wet or humid conditions\n"
            "- Bacteria entering through wounds, splashing water, or infected tools\n"
            "- Viruses spread by insects such as aphids, whiteflies, or leafhoppers\n"
            "- Soil problems such as poor drainage, low nutrients, or wrong pH\n"
            "- Reusing infected soil, pots, seeds, or plant debris\n\n"
            "**Prevention**\n"
            "Use clean tools, water near the soil, remove infected leaves, rotate crops, and choose healthy seeds or seedlings."
        )
    
    if any(word in query_words for word in ["prevent", "prevention", "avoid", "stop", "protect"]):
        return (
            "**Preventing Plant Diseases**\n\n"
            "- Water at the base of the plant instead of wetting leaves\n"
            "- Keep enough spacing between plants for airflow\n"
            "- Remove fallen leaves and infected plant parts\n"
            "- Use clean tools and wash hands after handling diseased plants\n"
            "- Rotate crops each season when possible\n"
            "- Avoid overwatering and improve soil drainage\n"
            "- Inspect plants often so problems are caught early\n\n"
            "**Best Habit**\n"
            "Check the underside of leaves every few days. Many diseases and pests show early signs there first."
        )
    
    if any(word in query_words for word in ["symptom", "symptoms", "sign", "signs", "identify", "recognize"]):
        return (
            "**Common Plant Disease Symptoms**\n\n"
            "- Yellow or brown spots on leaves\n"
            "- White powder, fuzzy mold, rust-colored patches, or dark lesions\n"
            "- Leaf curling, wilting, drying, or early leaf drop\n"
            "- Soft, black, or watery rot on roots, stems, or fruit\n"
            "- Stunted growth or poor flowering and fruiting\n"
            "- Mosaic patterns, streaks, or distorted new leaves\n\n"
            "**Quick Check**\n"
            "If symptoms spread from one leaf to many leaves, or from one plant to nearby plants, treat it as a possible disease."
        )
    
    if any(word in query_words for word in ["treat", "treatment", "cure", "control", "fix"]):
        return (
            "**General Plant Disease Treatment**\n\n"
            "- Remove and destroy badly infected leaves or fruit\n"
            "- Keep leaves dry by watering at soil level\n"
            "- Improve airflow by pruning crowded growth\n"
            "- Use organic options like neem oil, sulfur, copper, or biofungicides when suitable\n"
            "- For severe infections, use a disease-specific fungicide or bactericide\n"
            "- Do not compost infected plant material unless your compost gets hot enough\n\n"
            "**Important**\n"
            "Treatment depends on the exact disease. You can ask me about a specific crop, like \"How do I treat tomato early blight?\""
        )
    
    if "fungal" in query_words or "fungus" in query_words or "fungi" in query_words:
        return (
            "**Fungal Plant Diseases**\n\n"
            "Fungal diseases are among the most common plant problems. They often spread through spores and become worse in humid, wet, or crowded conditions.\n\n"
            "**Examples**\n"
            "- Powdery mildew\n"
            "- Early blight and late blight\n"
            "- Rusts and leaf spots\n"
            "- Fruit rots and root rots\n\n"
            "**Basic Control**\n"
            "Improve airflow, avoid wet leaves, remove infected debris, and use sulfur, copper, neem oil, or a recommended fungicide when needed."
        )
    
    if "bacterial" in query_words or "bacteria" in query_words:
        return (
            "**Bacterial Plant Diseases**\n\n"
            "Bacterial diseases often enter through wounds or natural openings in the plant. They can spread through splashing water, infected tools, insects, and contaminated seeds.\n\n"
            "**Common Signs**\n"
            "- Water-soaked spots\n"
            "- Leaf spots with yellow halos\n"
            "- Oozing, soft rot, or wilting\n\n"
            "**Basic Control**\n"
            "Remove infected parts, avoid overhead watering, sanitize tools, and use copper-based sprays when appropriate."
        )
    
    if "viral" in query_words or "virus" in query_words or "viruses" in query_words:
        return (
            "**Viral Plant Diseases**\n\n"
            "Viral diseases cannot usually be cured once a plant is infected. They are commonly spread by insects, infected seeds, cuttings, or contaminated tools.\n\n"
            "**Common Signs**\n"
            "- Mosaic or mottled leaf patterns\n"
            "- Leaf curling or distortion\n"
            "- Stunted growth\n"
            "- Poor fruit development\n\n"
            "**Basic Control**\n"
            "Remove badly infected plants, control insect vectors, sanitize tools, and use disease-free seeds or seedlings."
        )
    
    if any(term in message_clean for term in ["what can you do", "help me with", "what do you support", "supported crops"]):
        return (
            "**PlantGuard AI Help**\n\n"
            "I can answer general plant health questions and give disease-specific guidance for supported crops.\n\n"
            "**Supported Crops**\n"
            f"{build_supported_crops_text()}.\n\n"
            "**Try Asking**\n"
            "- What is plant disease?\n"
            "- What causes plant diseases?\n"
            "- How can I prevent plant diseases?\n"
            "- What are symptoms of fungal disease?\n"
            "- How do I treat tomato early blight?"
        )
    
    return None

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "model_loaded": model is not None,
        "knowledge_base_loaded": len(knowledge_base) > 0,
        "supported_classes_count": len(CLASS_NAMES)
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Accepts an uploaded plant leaf image.
    Preprocesses it to the model input size, runs Keras model prediction,
    and returns top diagnosis and top 3 possibilities.
    """
    if not model:
        raise HTTPException(status_code=503, detail="Plant classification model is not loaded.")
        
    # Check if file has an image type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="The uploaded file must be an image.")
        
    try:
        # Read file into memory and load via PIL
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Resize to model input size (128, 128)
        image = image.resize((128, 128))
        
        # Convert to numpy array. This model was trained on raw 0-255 pixel values,
        # so do not divide by 255 here.
        img_array = np.array(image, dtype=np.float32)
        
        # Expand dimensions to add batch dimension (1, 128, 128, 3)
        img_array = np.expand_dims(img_array, axis=0)
        
        # Perform prediction
        predictions = model.predict(img_array)[0]
        
        # Sort predictions by confidence in descending order
        top_indices = np.argsort(predictions)[::-1]
        
        # Construct prediction result schema
        top_1_idx = top_indices[0]
        primary_class = CLASS_NAMES[top_1_idx]
        primary_confidence = float(predictions[top_1_idx] * 100)
        is_uncertain = primary_confidence < LOW_CONFIDENCE_THRESHOLD
        heatmap = None
        try:
            heatmap = generate_gradcam_overlay(image, img_array, int(top_1_idx))
        except Exception as heatmap_error:
            print(f"Heatmap warning: {str(heatmap_error)}")
        
        # Fetch top 3 matches
        top_3 = []
        for idx in top_indices[:3]:
            top_3.append({
                "class_name": CLASS_NAMES[idx],
                "confidence": float(predictions[idx] * 100)
            })
            
        return {
            "prediction": primary_class,
            "confidence": primary_confidence,
            "top_3": top_3,
            "is_uncertain": is_uncertain,
            "confidence_message": get_confidence_message(primary_confidence),
            "heatmap": heatmap
        }
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Processes chatbot query. Searches the knowledge base keys for matches.
    If matched, returns formatted plant disease symptoms, treatments, and youtube link.
    If unmatched, suggestions or a generic welcome response are returned.
    """
    message_clean = request.message.lower().strip()
    
    # Clean message symbols
    message_words_clean = message_clean
    for sym in [".", ",", "?", "!", "-", "(", ")", "_", "/"]:
        message_words_clean = message_words_clean.replace(sym, " ")
    query_words = set(message_words_clean.split())
    
    # 1. Look for matching plant disease names in the message
    matched_class = None
    best_score = -1.0
    
    for class_name in CLASS_NAMES:
        # Split "Apple - Apple Scab" into "Apple" (crop) and "Apple Scab" (disease)
        parts = class_name.split(" - ")
        if len(parts) != 2:
            continue
        crop_part, disease_part = parts[0].lower(), parts[1].lower()
        
        # Standardize parts
        crop_clean = crop_part.replace("(maize)", "").replace("bell", "").strip()
        disease_clean = disease_part.strip()
        
        crop_words = set(crop_clean.split())
        disease_words = set(disease_clean.split())
        
        # Check how many disease words are present in the query
        matched_disease_words = sum(1 for w in disease_words if w in query_words)
        disease_ratio = matched_disease_words / len(disease_words) if disease_words else 0.0
        
        # Check if the crop name is mentioned in the query
        crop_matched = any(w in query_words for w in crop_words)
        
        # Overlap score calculation
        score = disease_ratio
        if crop_matched:
            score += 0.5
            
        # Boost if the full disease name sequence appears directly in the query
        if disease_clean in message_clean:
            score += 1.0
            
        # Heavy penalty for mismatches on "healthy" status
        if "healthy" in disease_words and "healthy" not in query_words:
            score -= 2.0
        if "healthy" not in disease_words and "healthy" in query_words:
            score -= 1.0
            
        # Keep track of the highest scoring class
        if score > best_score:
            best_score = score
            matched_class = class_name
            
    # 2. If a specific class is matched with high confidence (score >= 1.0), retrieve details
    if matched_class and best_score >= 1.0 and matched_class in knowledge_base:
        info = knowledge_base[matched_class]
        
        # Form list of symptoms
        symptoms_str = "\n".join([f"- {s}" for s in info.get("symptoms", [])])
        
        # Build structured markdown matching the React component parsing rule
        response_text = (
            f"**{info.get('name', matched_class)}**\n\n"
            f"**Symptoms**\n"
            f"{symptoms_str}\n\n"
            f"**Causes**\n"
            f"{info.get('causes', 'No details available.')}\n\n"
            f"**Treatment**\n"
            f"{info.get('treatment', 'No details available.')}\n\n"
            f"**Prevention**\n"
            f"{info.get('prevention', 'No details available.')}\n\n"
            f"**Immediate Action**\n"
            f"{info.get('immediate_action', 'No details available.')}\n\n"
            f"Watch Treatment Guide: {info.get('youtube_link', 'https://www.youtube.com')}"
        )
        return {
            "response": response_text,
            "matched_class": matched_class
        }
    
    # 3. Answer general plant-health questions that do not name a specific disease.
    general_response = get_general_plant_answer(message_clean, query_words)
    if general_response:
        return {
            "response": general_response,
            "matched_class": None
        }
        
    # 4. If no exact class matches, look for general crop names
    crop_keywords = [
        "apple", "blueberry", "cherry", "corn", "maize", "grape", 
        "orange", "peach", "pepper", "potato", "raspberry", 
        "soybean", "squash", "strawberry", "tomato"
    ]
    found_crops = [crop for crop in crop_keywords if crop in message_clean]
    
    if found_crops:
        # Gather matching classes for the mentioned crops
        suggestions = []
        for crop in found_crops:
            # Map standard inputs like "pepper" to match "Bell Pepper" keys
            mapped = crop
            for class_name in CLASS_NAMES:
                if mapped in class_name.lower():
                    suggestions.append(f"- {class_name}")
                    
        if suggestions:
            suggestions_str = "\n".join(suggestions)
            response_text = (
                f"It looks like you are asking about **{', '.join([c.capitalize() for c in found_crops])}**.\n"
                f"I found the following conditions for this crop in my knowledge base:\n\n"
                f"{suggestions_str}\n\n"
                f"Please specify which condition you would like help with (for example: *\"Tell me about {suggestions[0].replace('- ', '') if suggestions else 'Tomato Early Blight'}\"*)."
            )
            return {
                "response": response_text,
                "matched_class": None
            }

    # 5. Fallback greeting
    response_text = (
        "Hello! I am **PlantGuard AI**, your virtual agronomist. I help diagnose "
        "and treat plant diseases using our local database. How can I help you today?\n\n"
        "**Supported Crops**\n"
        f"I support: {build_supported_crops_text()}.\n\n"
        "Try asking a general question like *\"What is plant disease?\"* or a specific condition like *\"How do I treat Early Blight in Potatoes?\"*"
    )
    
    
    return {
        "response": response_text,
        "matched_class": None
    }
    
# treatment guide 
@app.get("/guides")
async def get_guides():
    guides = []

    for key, value in knowledge_base.items():
        crop, disease = key.split(" - ", 1)

        guides.append({
            "crop": crop,
            "disease": disease,
            "symptoms": value.get("symptoms", []),
            "immediateAction": value.get("immediate_action", ""),
            "treatment": value.get("treatment", ""),
            "prevention": value.get("prevention", ""),
            "youtubeLink": value.get("youtube_link", "")
        })

    return guides

