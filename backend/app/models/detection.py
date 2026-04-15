from pydantic import BaseModel


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class Detection(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox


class DetectionResponse(BaseModel):
    detections: list[Detection]
    inference_time_ms: float
    image_size: list[int]
