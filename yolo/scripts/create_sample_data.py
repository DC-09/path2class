"""
Path2Class — Sample Data Creator
Generates a few synthetic placeholder images and labels so you can
test the training pipeline before collecting real campus data.

Usage:
    python create_sample_data.py
"""

import os
import random
from pathlib import Path

import numpy as np

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Install Pillow: pip install Pillow")
    exit(1)

# Directories
BASE_DIR = Path(__file__).parent.parent / "datasets" / "campus"
SPLITS = ["train", "val", "test"]
SPLIT_COUNTS = {"train": 20, "val": 6, "test": 4}

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

ROOM_LABELS = ["0.01", "0.02", "1.01", "1.12", "1.18", "2.01", "2.14", "3.02", "3.07"]
BUILDING_LABELS = ["Edificio A", "Edificio B"]
LANDMARK_LABELS = ["Caffetteria", "Distributore", "Bacheca"]

# Colors for synthetic objects
COLORS = {
    "sign_room_number": (200, 200, 240),
    "sign_building_name": (180, 220, 180),
    "direction_arrow": (255, 220, 100),
    "entrance_door": (160, 120, 80),
    "elevator_door": (180, 180, 190),
    "staircase": (140, 140, 140),
    "ramp": (170, 170, 100),
    "path2class_qr": (255, 255, 255),
    "campus_landmark": (220, 180, 160),
}


def create_synthetic_image(img_w=640, img_h=480, num_objects=None):
    """Create a synthetic image with random colored rectangles representing campus objects."""
    # Random background (corridor-like)
    bg_color = (
        random.randint(180, 230),
        random.randint(180, 220),
        random.randint(170, 210),
    )
    img = Image.new("RGB", (img_w, img_h), bg_color)
    draw = ImageDraw.Draw(img)

    # Add some corridor-like lines
    for _ in range(random.randint(2, 5)):
        y = random.randint(0, img_h)
        draw.line([(0, y), (img_w, y)], fill=(150, 150, 150), width=1)

    if num_objects is None:
        num_objects = random.randint(1, 3)

    labels = []

    for _ in range(num_objects):
        class_id = random.randint(0, len(CLASS_NAMES) - 1)
        class_name = CLASS_NAMES[class_id]

        # Random bbox (ensure minimum size)
        bw = random.randint(60, 200)
        bh = random.randint(40, 150)
        bx = random.randint(0, max(0, img_w - bw))
        by = random.randint(0, max(0, img_h - bh))

        color = COLORS[class_name]
        draw.rectangle([bx, by, bx + bw, by + bh], fill=color, outline=(50, 50, 50), width=2)

        # Add text label on the rectangle
        text = ""
        if class_name == "sign_room_number":
            text = f"Aula {random.choice(ROOM_LABELS)}"
        elif class_name == "sign_building_name":
            text = random.choice(BUILDING_LABELS)
        elif class_name == "direction_arrow":
            text = random.choice(["->", "<-", "^"])
        elif class_name == "path2class_qr":
            text = "[QR]"
        elif class_name == "campus_landmark":
            text = random.choice(LANDMARK_LABELS)

        if text:
            try:
                draw.text((bx + 5, by + 5), text, fill=(30, 30, 30))
            except Exception:
                pass

        # YOLO format: class_id x_center y_center width height (normalized)
        x_center = (bx + bw / 2) / img_w
        y_center = (by + bh / 2) / img_h
        w_norm = bw / img_w
        h_norm = bh / img_h

        labels.append(f"{class_id} {x_center:.6f} {y_center:.6f} {w_norm:.6f} {h_norm:.6f}")

    return img, labels


def main():
    print("Creating sample dataset for Path2Class YOLO training pipeline...\n")

    total = 0
    for split in SPLITS:
        img_dir = BASE_DIR / "images" / split
        lbl_dir = BASE_DIR / "labels" / split
        img_dir.mkdir(parents=True, exist_ok=True)
        lbl_dir.mkdir(parents=True, exist_ok=True)

        count = SPLIT_COUNTS[split]
        for i in range(count):
            img, labels = create_synthetic_image()

            img_path = img_dir / f"sample_{split}_{i:04d}.jpg"
            lbl_path = lbl_dir / f"sample_{split}_{i:04d}.txt"

            img.save(img_path, "JPEG", quality=85)
            with open(lbl_path, "w") as f:
                f.write("\n".join(labels))

            total += 1

        print(f"  {split}: {count} images created in {img_dir}")

    print(f"\nTotal: {total} synthetic samples created.")
    print("These are PLACEHOLDER images for pipeline testing.")
    print("Replace with real campus photos for actual training.")


if __name__ == "__main__":
    main()
