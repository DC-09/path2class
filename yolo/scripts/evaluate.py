"""
Path2Class — YOLO Evaluation Script
Evaluates the trained model on the test split and prints metrics.

Usage:
    python evaluate.py
    python evaluate.py --model ../models/best_campus.pt --split test
"""

import argparse
from pathlib import Path

from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate YOLOv8 on campus dataset")
    parser.add_argument("--model", type=str,
                        default=str(Path(__file__).parent.parent / "models" / "best_campus.pt"),
                        help="Path to trained model")
    parser.add_argument("--data", type=str,
                        default=str(Path(__file__).parent.parent / "config" / "campus_dataset.yaml"),
                        help="Path to dataset YAML config")
    parser.add_argument("--split", type=str, default="test",
                        choices=["val", "test"],
                        help="Dataset split to evaluate on")
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--conf", type=float, default=0.5)
    return parser.parse_args()


def main():
    args = parse_args()

    print(f"Loading model: {args.model}")
    model = YOLO(args.model)

    print(f"Evaluating on '{args.split}' split...")
    metrics = model.val(
        data=args.data,
        split=args.split,
        imgsz=args.imgsz,
        conf=args.conf,
    )

    print("\n=== Evaluation Results ===")
    print(f"mAP@0.5:      {metrics.box.map50:.4f}")
    print(f"mAP@0.5:0.95: {metrics.box.map:.4f}")
    print(f"Precision:     {metrics.box.mp:.4f}")
    print(f"Recall:        {metrics.box.mr:.4f}")

    # Per-class breakdown
    class_names = model.names
    print("\n--- Per-class mAP@0.5 ---")
    if hasattr(metrics.box, "ap50") and metrics.box.ap50 is not None:
        for i, ap in enumerate(metrics.box.ap50):
            name = class_names.get(i, f"class_{i}")
            print(f"  {name:25s} {ap:.4f}")

    print("\nDone.")


if __name__ == "__main__":
    main()
