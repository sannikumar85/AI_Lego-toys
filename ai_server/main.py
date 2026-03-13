"""
AI Toy Builder – FastAPI Server
================================
YOLOv8-based toy part detection with OpenCV annotation.
Falls back to a smart mock when no trained model is available.
"""

import os, io, uuid, time, json
from pathlib import Path
from typing import List

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

# ── Config ─────────────────────────────────────────────────────────────────────
MODEL_PATH     = os.getenv('YOLO_MODEL_PATH', 'models/toy_detector.pt')
CONF_THRESHOLD = float(os.getenv('YOLO_CONFIDENCE_THRESHOLD', 0.25))
IOU_THRESHOLD  = float(os.getenv('YOLO_IOU_THRESHOLD', 0.45))
UPLOAD_DIR     = Path(__file__).parent.parent / (os.getenv('UPLOAD_DIR', 'uploads'))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ── Toy part detection colors (BGR for OpenCV) ─────────────────────────────────
PART_COLORS = {
    'head':      (130, 99, 255),
    'body':      (99, 200, 255),
    'arm':       (70, 220, 120),
    'wheel':     (50, 200, 255),
    'accessory': (200, 180, 50),
    'unknown':   (180, 130, 255),
}

# ── Toy reconstruction map with 3D assembly data ──────────────────────────────
TOY_MAP = [
    { 
        'required': {'head', 'body', 'arm'}, 
        'name': 'Action Figure',
        'description': 'A classic humanoid action figure with articulated arms and head.',
        'assembly_complexity': 'medium',
        'expected_parts': ['head', 'body', 'arm', 'arm'],
        'assembly_time': 4,
        'part_positions': {
            'head': [0, 2.2, 0], 'body': [0, 0, 0],
            'leftArm': [-1.2, 0.5, 0], 'rightArm': [1.2, 0.5, 0]
        }
    },
    { 
        'required': {'head', 'body'}, 
        'name': 'Simple Doll',
        'description': 'A basic doll with head and torso.',
        'assembly_complexity': 'simple',
        'expected_parts': ['head', 'body'],
        'assembly_time': 2,
        'part_positions': {
            'head': [0, 1.8, 0], 'body': [0, 0, 0]
        }
    },
    { 
        'required': {'wheel', 'body'}, 
        'name': 'Toy Car / Vehicle',
        'description': 'A wheeled toy vehicle with body frame.',
        'assembly_complexity': 'medium',
        'expected_parts': ['body', 'wheel', 'wheel'],
        'assembly_time': 3,
        'part_positions': {
            'body': [0, -0.5, 0],
            'leftWheel': [-1, -0.8, 0], 'rightWheel': [1, -0.8, 0]
        }
    },
    { 
        'required': {'wheel'}, 
        'name': 'Wheel Component',
        'description': 'A standalone wheel part, likely from a vehicle.',
        'assembly_complexity': 'simple',
        'expected_parts': ['wheel'],
        'assembly_time': 1,
        'part_positions': {'wheel': [0, 0, 0]}
    },
    { 
        'required': {'head'}, 
        'name': 'Toy Head',
        'description': 'A detached toy head, possibly from a doll or figure.',
        'assembly_complexity': 'simple',
        'expected_parts': ['head'],
        'assembly_time': 1,
        'part_positions': {'head': [0, 0, 0]}
    },
    { 'required': {'arm'},                 'name': 'Toy Arm',
      'description': 'An arm appendage, typically from an action figure.' },
    { 'required': {'body'},                'name': 'Toy Body',
      'description': 'Main body frame of an unidentified toy.' },
    { 'required': set(),                   'name': 'Unknown Toy',
      'description': 'Could not determine toy type from detected parts.' },
]

def predict_toy(detected_labels: list[str]) -> dict:
    label_set = set(detected_labels)
    best = None
    best_overlap = -1
    for entry in TOY_MAP:
        required = entry['required']
        if not required:
            if best is None:
                best = entry
            continue
        overlap = len(required & label_set)
        if required.issubset(label_set) and overlap > best_overlap:
            best_overlap = overlap
            best = entry
    toy = best or TOY_MAP[-1]
    # Confidence = fraction of required parts matched
    req = toy.get('required', set())
    conf = (len(req & label_set) / max(len(req), 1)) if req else 0.5
    return { 
        'name': toy['name'], 
        'confidence': round(conf, 3), 
        'description': toy['description'],
        'assembly_complexity': toy.get('assembly_complexity', 'simple'),
        'assembly_time': toy.get('assembly_time', 1),
        'expected_parts': toy.get('expected_parts', []),
        'part_positions': toy.get('part_positions', {})
    }

def analyze_missing_parts(detected_labels: list[str], predicted_toy: dict) -> dict:
    """Analyze which parts are missing for complete toy assembly."""
    detected_counts = {}
    for label in detected_labels:
        detected_counts[label] = detected_counts.get(label, 0) + 1
    
    expected_parts = predicted_toy.get('expected_parts', [])
    expected_counts = {}
    for part in expected_parts:
        expected_counts[part] = expected_counts.get(part, 0) + 1
    
    missing_parts = []
    for part, needed in expected_counts.items():
        detected = detected_counts.get(part, 0)
        if detected < needed:
            for i in range(needed - detected):
                missing_parts.append(part)
    
    assembly_completeness = max(0, 1 - len(missing_parts) / max(len(expected_parts), 1))
    
    return {
        'missing_parts': missing_parts,
        'detected_counts': detected_counts,
        'expected_counts': expected_counts,
        'assembly_completeness': round(assembly_completeness, 3),
        'total_expected': len(expected_parts),
        'total_detected': len(detected_labels)
    }

def calculate_3d_positions(detections: list[dict], predicted_toy: dict) -> dict:
    """Calculate 3D assembly positions based on 2D detections."""
    positions = predicted_toy.get('part_positions', {})
    
    # Group detections by type
    part_groups = {}
    for detection in detections:
        label = detection['label']
        if label not in part_groups:
            part_groups[label] = []
        part_groups[label].append(detection)
    
    # Calculate positions for parts with multiple instances (arms, wheels)
    calculated_positions = {}
    
    for part_type, part_detections in part_groups.items():
        if part_type == 'arm' and len(part_detections) >= 1:
            calculated_positions['leftArm'] = positions.get('leftArm', [-1.2, 0.5, 0])
            if len(part_detections) >= 2:
                calculated_positions['rightArm'] = positions.get('rightArm', [1.2, 0.5, 0])
        elif part_type == 'wheel' and len(part_detections) >= 1:
            calculated_positions['leftWheel'] = positions.get('leftWheel', [-1, -0.8, 0])
            if len(part_detections) >= 2:
                calculated_positions['rightWheel'] = positions.get('rightWheel', [1, -0.8, 0])
        else:
            # Single instance parts
            if part_type in positions:
                calculated_positions[part_type] = positions[part_type]
    
    return calculated_positions

def get_assembly_sequence(detections: list[dict], predicted_toy: dict) -> list[dict]:
    """Generate step-by-step assembly sequence."""
    sequence = []
    detected_labels = [d['label'] for d in detections]
    
    # Assembly order priority
    assembly_order = ['body', 'head', 'arm', 'wheel', 'accessory']
    
    step = 0
    for part_type in assembly_order:
        if part_type in detected_labels:
            if part_type == 'arm':
                # Add arms separately
                arm_count = detected_labels.count('arm')
                if arm_count >= 1:
                    sequence.append({
                        'step': step,
                        'part': 'leftArm',
                        'action': 'attach',
                        'delay': step * 1.5
                    })
                    step += 1
                if arm_count >= 2:
                    sequence.append({
                        'step': step,
                        'part': 'rightArm', 
                        'action': 'attach',
                        'delay': step * 1.5
                    })
                    step += 1
            elif part_type == 'wheel':
                # Add wheels separately
                wheel_count = detected_labels.count('wheel')
                if wheel_count >= 1:
                    sequence.append({
                        'step': step,
                        'part': 'leftWheel',
                        'action': 'attach',
                        'delay': step * 1.5
                    })
                    step += 1
                if wheel_count >= 2:
                    sequence.append({
                        'step': step,
                        'part': 'rightWheel',
                        'action': 'attach', 
                        'delay': step * 1.5
                    })
                    step += 1
            else:
                # Single parts
                sequence.append({
                    'step': step,
                    'part': part_type,
                    'action': 'attach',
                    'delay': step * 1.5
                })
                step += 1
    
    return sequence

# ── Load YOLO model (lazy, once) ───────────────────────────────────────────────
_model = None

def get_model():
    global _model
    if _model is not None:
        return _model
    try:
        from ultralytics import YOLO
        model_file = Path(MODEL_PATH)
        if model_file.exists():
            print(f"✅ Loading custom YOLO model: {model_file}")
            _model = YOLO(str(model_file))
        else:
            fallback = os.getenv('YOLO_FALLBACK_WEIGHTS', 'yolov8n.pt')
            print(f"⚠️  Custom model not found. Loading COCO fallback: {fallback}")
            _model = YOLO(fallback)
        return _model
    except Exception as e:
        print(f"❌ YOLO load failed: {e}")
        return None

# ── COCO class → toy part mapping ──────────────────────────────────────────────
COCO_TOY_MAP = {
    'person': 'body', 'car': 'wheel', 'truck': 'wheel',
    'bicycle': 'wheel', 'motorcycle': 'wheel',
    'ball': 'accessory', 'cup': 'body', 'bottle': 'body',
    'clock': 'accessory', 'scissors': 'arm',
    
    # Custom newly trained Lego class mappings:
    'lego': 'body',
    'x1-y1-z2': 'accessory',
    'x1-y2-z1': 'head',
    'x1-y2-z2': 'head',
    'x1-y2-z2-chamfer': 'head',
    'x1-y3-z2': 'body',
    'x1-y3-z2-fillet': 'body',
    'x1-y4-z1': 'arm',
    'x1-y4-z2': 'arm',
    'x2-y2-z2': 'body',
    'x2-y2-z2-fillet': 'wheel',
}

def run_yolo_detection(image_path: str) -> list[dict]:
    model = get_model()
    if model is None:
        return _mock_detect()
    try:
        results = model(image_path, conf=CONF_THRESHOLD, iou=IOU_THRESHOLD, verbose=False)
        detections = []
        for r in results:
            for box in r.boxes:
                cls_name = r.names[int(box.cls[0])].lower()
                label = COCO_TOY_MAP.get(cls_name, cls_name)
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
                detections.append({
                    'label': label,
                    'confidence': round(float(box.conf[0]), 4),
                    'bbox': [x1, y1, x2, y2],
                })
        return detections if detections else _mock_detect()
    except Exception as e:
        print(f"YOLO inference error: {e}")
        return _mock_detect()

def _mock_detect() -> list[dict]:
    """Simulate detections for demo when model/image can't produce results."""
    import random
    parts = [
        {'label': 'head', 'confidence': round(random.uniform(0.82, 0.97), 3), 'bbox': [40, 15, 200, 175]},
        {'label': 'body', 'confidence': round(random.uniform(0.80, 0.95), 3), 'bbox': [25, 175, 250, 400]},
        {'label': 'arm',  'confidence': round(random.uniform(0.72, 0.90), 3), 'bbox': [250, 180, 330, 340]},
        {'label': 'arm',  'confidence': round(random.uniform(0.70, 0.88), 3), 'bbox': [0,   180, 60,  340]},
    ]
    n = random.randint(2, 4)
    return random.sample(parts, n)

def annotate_image(image_path: str, detections: list[dict]) -> str:
    """Draw bounding boxes on image, save to uploads, return filename."""
    img = cv2.imread(image_path)
    if img is None:
        img = np.zeros((480, 640, 3), dtype=np.uint8)

    for det in detections:
        label = det.get('label', 'unknown')
        conf  = det.get('confidence', 0)
        bbox  = det.get('bbox')
        if not bbox or len(bbox) < 4:
            continue
        x1, y1, x2, y2 = bbox
        color = PART_COLORS.get(label, PART_COLORS['unknown'])

        # Box
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        # Label background
        txt = f"{label} {int(conf * 100)}%"
        (tw, th), _ = cv2.getTextSize(txt, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(img, (x1, max(y1 - th - 8, 0)), (x1 + tw + 6, y1), color, -1)
        cv2.putText(img, txt, (x1 + 3, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

    out_name = f"annotated-{uuid.uuid4().hex[:8]}.jpg"
    out_path = UPLOAD_DIR / out_name
    cv2.imwrite(str(out_path), img)
    return out_name

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(title="AI Toy Builder – AI Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "service": "AI Toy Builder – Detection Server"}

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model is not None}

@app.post("/detect")
async def detect(images: List[UploadFile] = File(...)):
    if not images:
        raise HTTPException(status_code=400, detail="No images provided")

    start = time.time()
    all_detections = []
    annotated_images = []

    for img_file in images:
        # Save original
        orig_name = f"orig-{uuid.uuid4().hex[:8]}{Path(img_file.filename).suffix or '.jpg'}"
        orig_path = UPLOAD_DIR / orig_name
        content = await img_file.read()
        with open(orig_path, 'wb') as f:
            f.write(content)

        # Detect
        detections = run_yolo_detection(str(orig_path))
        all_detections.extend(detections)

        # Annotate
        annotated = annotate_image(str(orig_path), detections)
        annotated_images.append(annotated)

    # Summarize
    labels = [d['label'] for d in all_detections]
    confidence_summary = {}
    for l in labels:
        confidence_summary[l] = confidence_summary.get(l, 0) + 1

    predicted_toy = predict_toy(labels)
    
    # 3D Assembly Analysis
    missing_analysis = analyze_missing_parts(labels, predicted_toy)
    positions_3d = calculate_3d_positions(all_detections, predicted_toy)
    assembly_sequence = get_assembly_sequence(all_detections, predicted_toy)
    
    elapsed = round(time.time() - start, 3)

    return {
        "detections": all_detections,
        "annotated_images": annotated_images,
        "predicted_toy": predicted_toy,
        "confidence_summary": confidence_summary,
        "processing_time": elapsed,
        # 3D Assembly Data
        "assembly_3d": {
            "missing_parts": missing_analysis,
            "positions": positions_3d,
            "sequence": assembly_sequence,
            "total_steps": len(assembly_sequence),
            "estimated_assembly_time": predicted_toy.get('assembly_time', 1) * len(assembly_sequence)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("AI_HOST", "0.0.0.0"),
        port=int(os.getenv("AI_PORT", 8000)),
        reload=os.getenv("AI_RELOAD", "true").lower() == "true",
    )
