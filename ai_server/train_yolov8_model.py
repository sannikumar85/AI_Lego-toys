import json
import os
import shutil
from pathlib import Path
import yaml

# =============================================
# STEP 1: Convert COCO to YOLO (skip if already done)
# =============================================
base_dir = os.path.abspath('dataset')
yolo_dir = os.path.abspath('dataset_yolo')

if os.path.exists(os.path.join(yolo_dir, 'images', 'train')) and len(os.listdir(os.path.join(yolo_dir, 'images', 'train'))) > 100:
    print("Dataset already converted! Skipping conversion step...")
else:
    print("Step 1: Converting COCO JSON to YOLO format...")
    classes_found = {}
    
    for split in ['train', 'valid', 'test']:
        os.makedirs(os.path.join(yolo_dir, 'images', split), exist_ok=True)
        os.makedirs(os.path.join(yolo_dir, 'labels', split), exist_ok=True)
        
        json_path = os.path.join(base_dir, split, '_annotations.coco.json')
        if not os.path.exists(json_path):
            print(f"  Skipping {split} - no annotations found.")
            continue
        
        with open(json_path, 'r') as f:
            data = json.load(f)
            
        images = {img['id']: img for img in data['images']}
        for index, cat in enumerate(data['categories']):
            classes_found[index] = cat['name']
        
        for ann in data['annotations']:
            img_id = ann['image_id']
            cat_id = ann['category_id']
            bbox = ann['bbox']
            img_info = images[img_id]
            img_w, img_h = img_info['width'], img_info['height']
            
            x_center = (bbox[0] + bbox[2] / 2) / img_w
            y_center = (bbox[1] + bbox[3] / 2) / img_h
            width = bbox[2] / img_w
            height = bbox[3] / img_h
            
            label_txt = f"{cat_id} {x_center} {y_center} {width} {height}\n"
            label_path = os.path.join(yolo_dir, 'labels', split, Path(img_info['file_name']).stem + '.txt')
            with open(label_path, 'a') as lf:
                lf.write(label_txt)
                
        for img in data['images']:
            src_img = os.path.join(base_dir, split, img['file_name'])
            dst_img = os.path.join(yolo_dir, 'images', split, img['file_name'])
            if os.path.exists(src_img) and not os.path.exists(dst_img):
                shutil.copy(src_img, dst_img)

    print(f"  Conversion complete! Classes: {classes_found}")

    # Generate YAML
    names_list = [classes_found[i] for i in range(len(classes_found))]
    dataset_yaml = {
        'path': yolo_dir,
        'train': 'images/train',
        'val': 'images/valid',
        'test': 'images/test',
        'nc': len(names_list),
        'names': names_list
    }
    with open('dataset_yolo.yaml', 'w') as f:
        yaml.dump(dataset_yaml, f)
    print("  Generated dataset_yolo.yaml!")

# =============================================
# STEP 2: Optimized Training
# =============================================
import torch
from ultralytics import YOLO

# Auto-detect GPU
use_gpu = torch.cuda.is_available()
device = 0 if use_gpu else 'cpu'
print(f"\nDevice: {'GPU - ' + torch.cuda.get_device_name(0) if use_gpu else 'CPU'}")

# Optimized settings for speed + accuracy balance
# - imgsz=416: Smaller image = much faster training, still accurate for lego detection
# - batch=16 on CPU is fine (no VRAM limit), processes more images per step
# - workers=4: More parallel data loading threads
# - optimizer=SGD: Fastest optimizer for CPU training
# - cos_lr=True: Cosine annealing learning rate for better accuracy
# - patience=10: Early stopping if no improvement for 10 epochs (saves time!)

model = YOLO('yolov8n.pt')

print("\nStarting optimized training...")
print("  Epochs: 50 | Batch: 16 | Image Size: 416")
print("  Early stopping enabled (patience=10)")
print(f"  Estimated time: {'~2 hrs (GPU)' if use_gpu else '~6-8 hrs (CPU, reduced from 20+ hrs)'}\n")

results = model.train(
    data='dataset_yolo.yaml',
    epochs=50,
    batch=16,          # CPU has no VRAM limit, can handle batch=16
    imgsz=416,         # Smaller input = 2x faster than 640, still very accurate
    device=device,
    workers=4,         # More parallel data loading
    optimizer='SGD',   # Fastest optimizer
    cos_lr=True,       # Better accuracy with cosine LR schedule
    patience=10,       # Stop early if model stops improving
    cache=True,        # Cache images in RAM for faster loading
    amp=False,         # No mixed precision on CPU
    verbose=True
)

print("\n Training Complete!")
print(f" Best model saved at: {results.save_dir}/weights/best.pt")
