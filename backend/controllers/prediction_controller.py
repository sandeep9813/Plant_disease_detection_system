from fastapi import APIRouter, File, UploadFile

from services.app_services import prediction_service

router = APIRouter()


@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    return await prediction_service.predict(file)

