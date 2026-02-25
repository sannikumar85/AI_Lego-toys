"""
Fast YOLOv8 Training Script (20 epochs, nano model)
Run: python fast_train.py
"""
import os, shutil
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

YAML = Path(__file__).parent / 'dataset.yaml'
EPOCHS = 20      # Fast training for demo
BATCH  = 8
IMGSZ  = 416
DEVICE = 'cpu'   # Change to 0 for GPU

def train():
    try:
        from ultralytics import YOLO
    except ImportError:
        import subprocess, sys
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'ultralytics'])
        from ultralytics import YOLO

    if not YAML.exists():
        print(f"❌ dataset.yaml not found at {YAML}")
        print("   Run generate_data.py first.")
        return

    model = YOLO('yolov8n.pt')  # nano = fastest
    print(f"\n🚀 Training YOLOv8n for {EPOCHS} epochs on synthetic toy data...")
    print(f"   YAML: {YAML}")
    print(f"   Device: {DEVICE}\n")

    results = model.train(
        data=str(YAML),
        epochs=EPOCHS,
        imgsz=IMGSZ,
        batch=BATCH,
        device=DEVICE,
        name='toy_fast',
        project='runs',
        patience=10,
        save=True,
        plots=False,
        verbose=False,
    )

    best = Path('runs/toy_fast/weights/best.pt')
    dest = Path(__file__).parent.parent / 'models' / 'toy_detector.pt'
    dest.parent.mkdir(exist_ok=True)
    if best.exists():
        shutil.copy(best, dest)
        print(f"\n✅ Model saved → {dest}")
    else:
        # try alternate path
        for pt in Path('runs').rglob('best.pt'):
            shutil.copy(pt, dest)
            print(f"\n✅ Model saved → {dest}")
            break
        else:
            print("\n⚠️  best.pt not found, AI server will use mock detection.")

if __name__ == '__main__':
    train()
