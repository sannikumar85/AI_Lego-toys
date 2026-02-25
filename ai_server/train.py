"""
YOLOv8 Toy Parts Training Script
===================================
Run: python train.py

Expects dataset/ with:
  dataset/head/*.jpg
  dataset/arm/*.jpg
  dataset/wheel/*.jpg
  dataset/body/*.jpg
  dataset/full_toys/*.jpg
  dataset/labels/{head,arm,wheel,body}/*.txt  (YOLO format)
"""

import os, yaml, shutil
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATASET_PATH = Path(os.getenv('DATASET_PATH', '../dataset'))
EPOCHS       = int(os.getenv('EPOCHS', 50))
BATCH_SIZE   = int(os.getenv('BATCH_SIZE', 16))
IMG_SIZE     = int(os.getenv('IMG_SIZE', 640))

CLASSES = ['head', 'arm', 'wheel', 'body', 'accessory']

def build_yaml_config():
    """Create the YOLOv8 dataset YAML config."""
    config = {
        'path': str(DATASET_PATH.resolve()),
        'train': 'images/train',
        'val':   'images/val',
        'nc':    len(CLASSES),
        'names': CLASSES,
    }
    out = Path('dataset.yaml')
    with open(out, 'w') as f:
        yaml.dump(config, f, default_flow_style=False)
    print(f"✅ Dataset config written to {out}")
    return out

def train():
    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌ ultralytics not installed. Run: pip install ultralytics")
        return

    yaml_path = build_yaml_config()
    model = YOLO('yolov8n.pt')  # Start from nano pretrained

    print(f"\n🚀 Starting YOLOv8 training:")
    print(f"   epochs={EPOCHS}, batch={BATCH_SIZE}, imgsz={IMG_SIZE}")
    print(f"   dataset={yaml_path}\n")

    results = model.train(
        data=str(yaml_path),
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        name='toy_detector',
        project='runs/detect',
        patience=15,
        save=True,
        plots=True,
    )

    # Copy best model to models/
    best = Path('runs/detect/toy_detector/weights/best.pt')
    dest = Path(__file__).parent / 'models' / 'toy_detector.pt'
    dest.parent.mkdir(exist_ok=True)
    if best.exists():
        shutil.copy(best, dest)
        print(f"\n✅ Best model saved to: {dest}")
    else:
        print(f"\n⚠️ Training complete but best.pt not found at {best}")

if __name__ == '__main__':
    train()
