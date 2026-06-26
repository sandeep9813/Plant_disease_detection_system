from pydantic import BaseModel


class TopPrediction(BaseModel):
    class_name: str
    confidence: float


class PredictionResult(BaseModel):
    prediction: str
    confidence: float
    top_3: list[TopPrediction]
    is_uncertain: bool
    confidence_message: str
    heatmap: str | None = None


class PredictionHistoryItem(BaseModel):
    id: int
    date: str
    prediction: str
    confidence: float
    preview: str | None = None
    is_uncertain: bool = False
    confidence_message: str | None = None
    heatmap: str | None = None
    top_3: list[TopPrediction] = []

