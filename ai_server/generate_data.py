"""
Synthetic Toy Parts Dataset Generator
======================================
Generates simple but varied toy-part images + YOLO labels.
Run: python generate_data.py

Creates:
  dataset/images/train/  ~200 images
  dataset/images/val/    ~40 images
  dataset/labels/train/  YOLO format .txt
  dataset/labels/val/    YOLO format .txt
  dataset.yaml
"""

import os, random, math
from pathlib import Path
import numpy as np

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'Pillow'])
    from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).parent.parent
DATASET = ROOT / 'dataset'
IMG_SIZE = 416

CLASSES = ['head', 'arm', 'wheel', 'body', 'accessory']
CLASS_IDX = {c: i for i, c in enumerate(CLASSES)}

# Color palettes per part
PALETTES = {
    'head':      [(255,180,120),(220,150,80),(255,200,160),(200,100,60),(255,230,200)],
    'body':      [(80,120,200),(60,100,180),(100,140,220),(50,80,160),(120,160,240)],
    'arm':       [(120,200,120),(80,160,80),(140,220,100),(60,140,60),(160,240,140)],
    'wheel':     [(60,60,60),(80,80,80),(40,40,40),(100,100,100),(120,120,120)],
    'accessory': [(220,180,60),(200,150,40),(240,200,80),(180,130,30),(255,220,100)],
}

ACCENT = {
    'head':      (180,100,50),
    'body':      (30,60,140),
    'arm':       (40,120,40),
    'wheel':     (200,200,200),
    'accessory': (150,100,20),
}


def rand_bg():
    """Random pastel background."""
    r = random.randint(200,240); g = random.randint(200,240); b = random.randint(200,240)
    return (r, g, b)


def draw_head(draw, x1, y1, x2, y2, color, accent):
    cx, cy = (x1+x2)//2, (y1+y2)//2
    rx, ry = (x2-x1)//2, (y2-y1)//2
    draw.ellipse([x1, y1, x2, y2], fill=color, outline=accent, width=3)
    # Eyes
    ew = max(6, rx//5); eh = max(4, ry//6)
    draw.ellipse([cx-rx//3-ew, cy-ry//4-eh, cx-rx//3+ew, cy-ry//4+eh], fill=accent)
    draw.ellipse([cx+rx//3-ew, cy-ry//4-eh, cx+rx//3+ew, cy-ry//4+eh], fill=accent)
    # Smile
    draw.arc([cx-rx//3, cy+ry//6, cx+rx//3, cy+ry//2], start=0, end=180, fill=accent, width=3)


def draw_body(draw, x1, y1, x2, y2, color, accent):
    draw.rounded_rectangle([x1,y1,x2,y2], radius=12, fill=color, outline=accent, width=3)
    cx = (x1+x2)//2
    mw = (x2-x1)//4; mh = (y2-y1)//8
    draw.ellipse([cx-mw, y1+(y2-y1)//3-mh, cx+mw, y1+(y2-y1)//3+mh], fill=accent)


def draw_arm(draw, x1, y1, x2, y2, color, accent):
    # Arm = elongated rounded rect
    draw.rounded_rectangle([x1,y1,x2,y2], radius=8, fill=color, outline=accent, width=3)
    # joint circles
    cx, w = (x1+x2)//2, (x2-x1)//4
    draw.ellipse([cx-w, y1-w, cx+w, y1+w], fill=accent)
    draw.ellipse([cx-w, y2-w, cx+w, y2+w], fill=accent)


def draw_wheel(draw, x1, y1, x2, y2, color, accent):
    draw.ellipse([x1,y1,x2,y2], fill=color, outline=accent, width=4)
    cx, cy = (x1+x2)//2, (y1+y2)//2
    r = (x2-x1)//2
    # spokes
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        sx, sy = int(cx + r*0.3*math.cos(rad)), int(cy + r*0.3*math.sin(rad))
        ex, ey = int(cx + r*0.85*math.cos(rad)), int(cy + r*0.85*math.sin(rad))
        draw.line([sx,sy,ex,ey], fill=accent, width=3)
    draw.ellipse([cx-r//5, cy-r//5, cx+r//5, cy+r//5], fill=accent)


def draw_accessory(draw, x1, y1, x2, y2, color, accent):
    cx, cy = (x1+x2)//2, (y1+y2)//2
    # Star shape
    pts = []
    outer = min((x2-x1),(y2-y1))//2
    inner = outer//2
    for i in range(10):
        angle = math.radians(i*36 - 90)
        r = outer if i%2==0 else inner
        pts.append((cx + r*math.cos(angle), cy + r*math.sin(angle)))
    draw.polygon(pts, fill=color, outline=accent)


DRAWERS = {
    'head': draw_head, 'body': draw_body, 'arm': draw_arm,
    'wheel': draw_wheel, 'accessory': draw_accessory,
}


def random_box(size=IMG_SIZE, min_frac=0.25, max_frac=0.65):
    """Return a random bounding box (x1,y1,x2,y2)."""
    w = random.randint(int(size*min_frac), int(size*max_frac))
    h = random.randint(int(size*min_frac), int(size*max_frac))
    x1 = random.randint(10, size - w - 10)
    y1 = random.randint(10, size - h - 10)
    return x1, y1, x1+w, y1+h


def to_yolo(box, img_size=IMG_SIZE):
    x1,y1,x2,y2 = box
    cx = ((x1+x2)/2) / img_size
    cy = ((y1+y2)/2) / img_size
    bw = (x2-x1) / img_size
    bh = (y2-y1) / img_size
    return cx, cy, bw, bh


def make_image(parts_to_draw: list[str]):
    """Create one synthetic image with the given list of parts."""
    img = Image.new('RGB', (IMG_SIZE, IMG_SIZE), rand_bg())
    draw = ImageDraw.Draw(img)
    boxes = []
    labels = []

    for part in parts_to_draw:
        col = random.choice(PALETTES[part])
        acc = ACCENT[part]
        # Try up to 5 times to place without too much overlap
        for _ in range(5):
            box = random_box()
            # Simple overlap check
            overlap = False
            for b in boxes:
                ix = max(0, min(box[2],b[2]) - max(box[0],b[0]))
                iy = max(0, min(box[3],b[3]) - max(box[1],b[1]))
                if ix*iy > 0.3*(box[2]-box[0])*(box[3]-box[1]):
                    overlap = True; break
            if not overlap:
                break
        DRAWERS[part](draw, *box, col, acc)
        boxes.append(box)
        labels.append(part)

    # Slight blur for realism
    img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0, 0.8)))
    return img, boxes, labels


def generate(n_train=250, n_val=50):
    for split, n in [('train', n_train), ('val', n_val)]:
        img_dir = DATASET / 'images' / split
        lbl_dir = DATASET / 'labels' / split
        img_dir.mkdir(parents=True, exist_ok=True)
        lbl_dir.mkdir(parents=True, exist_ok=True)

        for i in range(n):
            # Randomly pick 1-3 parts per image
            k = random.randint(1, 3)
            parts = random.choices(CLASSES, k=k)

            img, boxes, labels = make_image(parts)
            stem = f"{split}_{i:04d}"
            img.save(str(img_dir / f"{stem}.jpg"), 'JPEG', quality=90)

            with open(lbl_dir / f"{stem}.txt", 'w') as f:
                for lbl, box in zip(labels, boxes):
                    cx, cy, bw, bh = to_yolo(box)
                    f.write(f"{CLASS_IDX[lbl]} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}\n")

            if (i+1) % 50 == 0:
                print(f"  {split}: {i+1}/{n} images generated")

    # Write dataset.yaml
    yaml_content = f"""path: {str(DATASET.resolve()).replace(chr(92), '/')}
train: images/train
val: images/val
nc: {len(CLASSES)}
names: {CLASSES}
"""
    (ROOT / 'ai_server' / 'dataset.yaml').write_text(yaml_content)
    (ROOT / 'dataset.yaml').write_text(yaml_content)
    print(f"\n✅ dataset.yaml written")
    print(f"✅ Done! {n_train} train + {n_val} val images in {DATASET}")


if __name__ == '__main__':
    print("🎨 Generating synthetic toy dataset...")
    generate()
