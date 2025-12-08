from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import io
import base64
import os
import torch

app = Flask(__name__)
CORS(app)

# Load the trained YOLOv8 model
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'models', 'best.pt')
model = YOLO(MODEL_PATH)

# Force CPU mode and optimize for speed
model.model.eval()  # Set to evaluation mode
torch.set_num_threads(2)  # Limit threads for free tier
print(f"Model loaded successfully! Using YOLOv8 - Model type: {model.model.__class__.__name__}")

# Class names mapping
CLASS_NAMES = {
    0: 'healthy',
    1: 'phytophthora',
    2: 'monilia'
}

@app.route('/api/detect', methods=['POST'])
def detect():
    try:
        # Get image from request
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        
        # Read image
        image_bytes = image_file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Resize image to smaller size for faster CPU inference
        # Max dimension of 416 pixels (instead of 640) for speed
        height, width = img.shape[:2]
        max_dim = 416
        if max(height, width) > max_dim:
            scale = max_dim / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            img = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_LINEAR)
        
        # Store original dimensions
        orig_height, orig_width = height, width
        
        # Run inference with optimized settings for CPU
        results = model(
            img, 
            conf=0.25,      # Confidence threshold
            iou=0.45,       # NMS IoU threshold  
            imgsz=416,      # Smaller image size for speed
            half=False,     # No FP16 on CPU
            device='cpu',   # Explicitly use CPU
            verbose=False   # Reduce logging overhead
        )
        
        # Process results
        detections = []
        if len(results) > 0 and len(results[0].boxes) > 0:
            for box in results[0].boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                class_name = CLASS_NAMES.get(class_id, 'unknown')
                
                detections.append({
                    'class': class_name,
                    'confidence': confidence,
                    'bbox': box.xyxy[0].tolist()
                })
        
        # Get the detection with highest confidence
        if detections:
            best_detection = max(detections, key=lambda x: x['confidence'])
            return jsonify({
                'class': best_detection['class'],
                'confidence': best_detection['confidence'],
                'all_detections': detections,
                'image_width': orig_width,
                'image_height': orig_height
            })
        else:
            return jsonify({
                'class': 'healthy',
                'confidence': 0.5,
                'all_detections': [],
                'image_width': orig_width,
                'image_height': orig_height
            })
    
    except Exception as e:
        print(f"Error during detection: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
