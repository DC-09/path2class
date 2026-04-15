"""
Path2Class — YOLO Training Script
Fine-tunes YOLOv8n on the campus dataset.

Usage:
    python train.py
    python train.py --model yolov8s.pt --epochs 150 --batch 8
"""

import argparse
from pathlib import Path

from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="Train YOLOv8 on Path2Class campus dataset")
    parser.add_argument("--model", type=str, default="yolov8n.pt",
                        help="Pretrained model to start from (default: yolov8n.pt)")
    parser.add_argument("--data", type=str, default=str(Path(__file__).parent.parent / "config" / "campus_dataset.yaml"),
                        help="Path to dataset YAML config")
    parser.add_argument("--epochs", type=int, default=120,
                        help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16,
                        help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640,
                        help="Input image size")
    parser.add_argument("--patience", type=int, default=20,
                        help="Early stopping patience")
    parser.add_argument("--device", type=str, default="",
                        help="Device: '', '0', 'cpu', etc.")
    parser.add_argument("--name", type=str, default="path2class_campus",
                        help="Run name for saving results")
    return parser.parse_args()


def main():
    args = parse_args()

    print(f"Loading model: {args.model}")
    model = YOLO(args.model)

    print(f"Starting training on dataset: {args.data}")
    print(f"  Epochs: {args.epochs}")
    print(f"  Batch:  {args.batch}")
    print(f"  ImgSz:  {args.imgsz}")
    print()

    results = model.train(
        data=args.data,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        patience=args.patience,
        device=args.device if args.device else None,

        # Optimizer
        lr0=0.01,
        lrf=0.001,
        optimizer="AdamW",

        # Augmentation
        augment=True,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10.0,
        translate=0.1,
        scale=0.5,
        fliplr=0.5,
        flipud=0.0,
        mosaic=1.0,

        # Output
        project=str(Path(__file__).parent.parent.parent / "runs" / "train"),
        name=args.name,
        exist_ok=True,
    )

    # Print key metrics
    print("\n=== Training Complete ===")
    print(f"Best model saved at: {results.save_dir / 'weights' / 'best.pt'}")

    # Copy best model to yolo/models/
    best_src = results.save_dir / "weights" / "best.pt"
    best_dst = Path(__file__).parent.parent / "models" / "best_campus.pt"
    if best_src.exists():
        import shutil
        shutil.copy2(best_src, best_dst)
        print(f"Best model copied to: {best_dst}")


if __name__ == "__main__":
    main()
