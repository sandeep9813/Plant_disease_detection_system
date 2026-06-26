from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str
    history: list = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str
    matched_class: str | None = None


class DiseaseGuide(BaseModel):
    crop: str
    disease: str
    symptoms: list[str]
    immediateAction: str
    treatment: str
    prevention: str
    youtubeLink: str

