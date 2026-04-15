"""
Path2Class — YOLO Model Export Script
Exports the trained model to ONNX for both server and client-side deployment.

Usage:
    python export_model.py
    python export_model.py --model ../models/best_campus.pt --format onnx --imgsz 320
"""

import argparse
from pathlib import Path

from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="Export YOLOv8 model")
    parser.add_argument("--model", type=str,
                        default=str(Path(__file__).parent.parent / "models" / "best_campus.pt"),
                        help="Path to trained model")
    parser.add_argument("--format", type=str, default="onnx",
                        choices=["onnx", "torchscript", "tflite"],
                        help="Export format")
    parser.add_argument("--imgsz", type=int, default=640,
                        help="Input image size for export")
    parser.add_argument("--simplify", action="store_true", default=True,
                        help="Simplify ONNX model")
    return parser.parse_args()


def main():
    args = parse_args()

    print(f"Loading model: {args.model}")
    model = YOLO(args.model)

    print(f"Exporting to {args.format} with imgsz={args.imgsz}...")
    export_path = model.export(
        format=args.format,
        imgsz=args.imgsz,
        simplify=args.simplify,
    )

    print(f"\nModel exported to: {export_path}")

    # Also export a lightweight version for client-side (320px)
    if args.imgsz != 320 and args.format == "onnx":
        print("\nExporting lightweight version (320px) for client-side...")
        light_path = model.export(
            format=args.format,
            imgsz=320,
            simplify=True,
        )
        print(f"Lightweight model exported to: {light_path}")

    print("\nDone.")


if __name__ == "__main__":
    main()
