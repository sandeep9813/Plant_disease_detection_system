from fastapi import APIRouter

from models.disease import ChatRequest
from services.app_services import chatbot_service

router = APIRouter()


@router.post("/chat")
async def chat(request: ChatRequest):
    return chatbot_service.answer(request)


@router.get("/guides")
async def get_guides():
    return chatbot_service.list_guides()

