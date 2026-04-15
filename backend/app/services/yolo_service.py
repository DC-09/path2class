"""
YOLO detection service.
Wraps Ultralytics YOLO model for inference on camera frames.
Falls back to a mock when the model file is not available (development mode).
"""

import time
import logging
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

from config import settings

logger = logging.getLogger(__name__)

# Class names must match campus_dataset.yaml
CLASS_NAMES = [
    "sign_room_number",
    "sign_building_name",
    "direction_arrow",
    "entrance_door",
    "elevator_door",
    "staircase",
    "ramp",
    "path2class_qr",
    "campus_landmark",
]


class YOLOService:
    def __init__(self):
        self.model = None
        self.is_mock = True
        self._load_model()

    def _load_model(self):
        model_path = Path(settings.yolo_model_path)
        if model_path.exists():
            try:
                from ultralytics import YOLO
                self.model = YOLO(str(model_path))
                self.is_mock = False
                logger.info(f"YOLO model loaded from {model_path}")
            except Exception as e:
                logger.warning(f"Failed to load YOLO model: {e}. Using mock mode.")
        else:
            logger.info(
                f"YOLO model not found at {model_path}. "
                "Running in MOCK mode — detection will return empty results. "
                "Train your model and place it at the configured path to enable real detection."
            )

    def detect(self, image_bytes: bytes) -> dict:
        """
        Run detection on a JPEG image.
        Returns: {"detections": [...], "inference_time_ms": float, "image_size": [w, h]}
        """
        # Decode image
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"detections": [], "inference_time_ms": 0, "image_size": [0, 0]}

        h, w = frame.shape[:2]

        if self.is_mock:
            return self._mock_detect(w, h)

        return self._real_detect(frame, w, h)

    def _real_detect(self, frame: np.ndarray, w: int, h: int) -> dict:
        start = time.time()
        results = self.model(
            frame,
            conf=settings.yolo_confidence_threshold,
            iou=settings.yolo_iou_threshold,
        )
        elapsed = (time.time() - start) * 1000

        detections = []
        for box in results[0].boxes:
            class_id = int(box.cls[0])
            detections.append({
                "class_id": class_id,
                "class_name": CLASS_NAMES[class_id] if class_id < len(CLASS_NAMES) else "unknown",
                "confidence": round(float(box.conf[0]), 3),
                "bbox": {
                    "x1": int(box.xyxy[0][0]),
                    "y1": int(box.xyxy[0][1]),
                    "x2": int(box.xyxy[0][2]),
                    "y2": int(box.xyxy[0][3]),
                },
            })

        return {
            "detections": detections,
            "inference_time_ms": round(elapsed, 1),
            "image_size": [w, h],
        }

    def _mock_detect(self, w: int, h: int) -> dict:
        """Return empty detections in mock mode."""
        return {
            "detections": [],
            "inference_time_ms": 0.0,
            "image_size": [w, h],
        }


# Singleton
_yolo_service: Optional[YOLOService] = None


def get_yolo_service() -> YOLOService:
    global _yolo_service
    if _yolo_service is None:
        _yolo_service = YOLOService()
    return _yolo_service
