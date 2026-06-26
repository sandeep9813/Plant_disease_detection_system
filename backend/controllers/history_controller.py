from fastapi import APIRouter

from services.app_services import history_service

router = APIRouter(prefix="/history")


@router.get("")
async def get_history():
    return history_service.list_history()


@router.post("")
async def add_history(item: dict):
    return history_service.add_history(item)


@router.delete("")
async def clear_history():
    return history_service.clear_history()
