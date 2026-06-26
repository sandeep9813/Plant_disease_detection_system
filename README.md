# Plant Disease Detection System

A complete full-stack application for detecting plant diseases using EfficientNet and providing treatment advice via an AI chatbot.

## Tech Stack
- **Backend:** FastAPI, TensorFlow/Keras
- **Frontend:** React, TypeScript, Tailwind CSS, Lucide React, Framer Motion

## Features
1. **Disease Detection:** Upload leaf images and get predictions for 38 different classes.
2. **PlantGuard AI Chatbot:** Structured information about symptoms, causes, and treatments.
3. **History:** Keep track of your past scans locally.
4. **Nature-Focused UI:** Modern, clean, and responsive "Eco-Emerald" theme.

## Prerequisites
- Python 3.8+
- Node.js 16+
- `efficientnet_b4.keras` model file placed in `backend/trained_model/`

## Setup & Run

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The backend will run on `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`.

## 38 Supported Classes
- Apple: Apple Scab, Black Rot, Cedar Apple Rust, Healthy
- Bell Pepper: Bacterial Spot, Healthy
- Cherry: Healthy, Powdery Mildew
- Corn (Maize): Cercospora Leaf Spot, Common Rust, Healthy, Northern Leaf Blight
- Grape: Black Rot, Esca (Black Measles), Healthy, Leaf Blight
- Peach: Bacterial Spot, Healthy
- Potato: Early Blight, Healthy, Late Blight
- Strawberry: Healthy, Leaf Scorch
- Tomato: Bacterial Spot, Early Blight, Healthy, Late Blight, Septoria Leaf Spot, Yellow Leaf Curl Virus

## Project Structure
- `/backend`: FastAPI source code organized into controllers, services, models, AI helpers, storage, and knowledge base files.
- `/frontend`: React application source code.
