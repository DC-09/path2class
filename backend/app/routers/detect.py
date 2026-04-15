from fastapi import APIRouter, UploadFile

from models.detection import DetectionResponse
from services.yolo_service import get_yolo_service

router = APIRouter(prefix="/api", tags=["detection"])


@router.post("/detect", response_model=DetectionResponse)
async def detect_objects(image: UploadFile, session_id: str = ""):
    contents = await image.read()
    yolo = get_yolo_service()
    result = yolo.detect(contents)

    return DetectionResponse(
        detections=result["detections"],
        inference_time_ms=result["inference_time_ms"],
        image_size=result["image_size"],
    )
