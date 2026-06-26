from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controllers.chatbot_controller import router as chatbot_router
from controllers.history_controller import router as history_router
from controllers.prediction_controller import router as prediction_router
from services.app_services import app_services


@asynccontextmanager
async def lifespan(app: FastAPI):
    app_services.startup()
    yield
    app_services.shutdown()


app = FastAPI(
    title="PlantGuard AI Backend",
    description="FastAPI backend serving Plant Disease Detection and AI Chat advice.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prediction_router)
app.include_router(chatbot_router)
app.include_router(history_router)


@app.get("/")
async def root():
    return app_services.health()
