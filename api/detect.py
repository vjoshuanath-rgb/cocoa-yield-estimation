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

# Load the trained YOLOv8 segmentation model
SEGMENTATION_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'models', 'cacao_segmentation_best.pt')
segmentation_model = YOLO(SEGMENTATION_MODEL_PATH)

# Force CPU mode and optimize for speed
segmentation_model.model.eval()  # Set to evaluation mode
torch.set_num_threads(2)  # Limit threads for deployment
print(f"Segmentation model loaded successfully! Using YOLOv8 - Model type: {segmentation_model.model.__class__.__name__}")

# Load yield estimation model (placeholder - implement based on trained model)
YIELD_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'models', 'yield_ranking_model.pt')

# Yield categories
YIELD_CATEGORIES = ['Low', 'Medium', 'High']

def estimate_yield_from_morphology(mask_area, aspect_ratio, perimeter):
    """
    Estimate yield category based on pod morphology
    This is a heuristic approach - replace with trained model for production
    """
    # Normalize features
    area_score = min(mask_area / 50000, 1.0)  # Larger pods = more yield
    shape_score = 1.0 - abs(aspect_ratio - 1.5) / 2.0  # Optimal aspect ratio around 1.5
    fullness_score = area_score * 0.7 + shape_score * 0.3
    
    # Classify into categories
    if fullness_score > 0.7:
        return 'High', fullness_score
    elif fullness_score > 0.4:
        return 'Medium', fullness_score
    else:
        return 'Low', fullness_score

@app.route('/api/estimate-yield', methods=['POST'])
def estimate_yield():
    try:
        # Get image from request
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        
        # Read image
        image_bytes = image_file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Store original dimensions
        orig_height, orig_width = img.shape[:2]
        
        # Run segmentation inference
        results = segmentation_model(
            img, 
            conf=0.25,      # Confidence threshold
            iou=0.7,        # Higher IoU for segmentation
            imgsz=640,      # Standard size for segmentation
            half=False,     # No FP16 on CPU
            device='cpu',   # Explicitly use CPU
            verbose=False   # Reduce logging overhead
        )
        
        # Process results
        pod_detections = []
        if len(results) > 0 and results[0].masks is not None:
            masks = results[0].masks.data.cpu().numpy()
            boxes = results[0].boxes.xyxy.cpu().numpy()
            confidences = results[0].boxes.conf.cpu().numpy()
            
            for idx, (mask, box, conf) in enumerate(zip(masks, boxes, confidences)):
                x1, y1, x2, y2 = box
                
                # Calculate morphological features
                mask_resized = cv2.resize(mask, (orig_width, orig_height))
                mask_area = np.sum(mask_resized > 0.5)
                
                # Calculate aspect ratio
                width = x2 - x1
                height = y2 - y1
                aspect_ratio = width / height if height > 0 else 1.0
                
                # Calculate perimeter
                contours, _ = cv2.findContours(
                    (mask_resized > 0.5).astype(np.uint8),
                    cv2.RETR_EXTERNAL,
                    cv2.CHAIN_APPROX_SIMPLE
                )
                perimeter = cv2.arcLength(contours[0], True) if contours else 0
                
                # Estimate yield
                yield_category, yield_score = estimate_yield_from_morphology(
                    mask_area, aspect_ratio, perimeter
                )
                
                pod_detections.append({
                    'pod_id': idx,
                    'bbox': [float(x1), float(y1), float(x2), float(y2)],
                    'confidence': float(conf),
                    'yield_category': yield_category,
                    'yield_score': float(yield_score),
                    'morphology': {
                        'area': float(mask_area),
                        'aspect_ratio': float(aspect_ratio),
                        'perimeter': float(perimeter)
                    }
                })
        
        # Calculate overall yield
        if pod_detections:
            # Weighted average by confidence
            total_weight = sum(d['confidence'] for d in pod_detections)
            category_scores = {'Low': 0, 'Medium': 1, 'High': 2}
            weighted_score = sum(
                category_scores[d['yield_category']] * d['confidence']
                for d in pod_detections
            ) / total_weight
            
            # Convert back to category
            if weighted_score >= 1.5:
                overall_yield = 'High'
            elif weighted_score >= 0.8:
                overall_yield = 'Medium'
            else:
                overall_yield = 'Low'
            
            return jsonify({
                'success': True,
                'overall_yield': overall_yield,
                'pod_count': len(pod_detections),
                'pods': pod_detections,
                'image_width': orig_width,
                'image_height': orig_height
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No cacao pods detected',
                'overall_yield': None,
                'pod_count': 0,
                'pods': [],
                'image_width': orig_width,
                'image_height': orig_height
            })
    
    except Exception as e:
        print(f"Error during yield estimation: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Legacy endpoint for backward compatibility
@app.route('/api/detect', methods=['POST'])
def detect():
    return estimate_yield()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok', 
        'segmentation_model_loaded': segmentation_model is not None,
        'service': 'Cacao Yield Estimator API'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
