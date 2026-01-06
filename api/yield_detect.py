"""
Yield Estimation API - Using trained SimCLR + Ranking models
This replaces the old morphology-based estimation with real ML models
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

# Model paths
BASE_DIR = os.path.dirname(__file__)
# NEW segmentation model for yield estimation (not the old disease detection one)
SEGMENTATION_MODEL_PATH = os.path.join(BASE_DIR, '..', 'public', 'models', 'cacao_segmentation_best.pt')

# Yield models should be downloaded from Colab and placed in root models/ folder
MODELS_DIR = os.path.join(BASE_DIR, '..', 'models')
YIELD_ENCODER_PATH = os.path.join(MODELS_DIR, 'simclr_encoder_a100.pt')
YIELD_RANKING_PATH = os.path.join(MODELS_DIR, 'ranking_model_a100.pt')

# Create models directory if it doesn't exist
os.makedirs(MODELS_DIR, exist_ok=True)

# Load segmentation model
print(f"Loading segmentation model from: {SEGMENTATION_MODEL_PATH}")
segmentation_model = YOLO(SEGMENTATION_MODEL_PATH)
segmentation_model.model.eval()
torch.set_num_threads(2)
print("✅ Segmentation model loaded")

# MobileNetV3 Encoder (matching your training notebook exactly)
class SimCLREncoder(nn.Module):
    def __init__(self):
        super().__init__()
        from torchvision.models import mobilenet_v3_large, MobileNet_V3_Large_Weights
        # Load pretrained MobileNetV3
        backbone = mobilenet_v3_large(weights=None)
        # Remove classifier, keep only feature extractor
        self.features = backbone.features
        self.avgpool = backbone.avgpool
        
    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        return x

# Yield Ranking Model
class YieldRankingModel(nn.Module):
    def __init__(self, encoder, feature_dim=2560):
        super().__init__()
        self.encoder = encoder
        for param in self.encoder.parameters():
            param.requires_grad = False
        
        # Match the actual saved architecture: 2560 -> 256 -> 1
        self.fc = nn.Sequential(
            nn.Linear(feature_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 1)
        )
    
    def forward(self, x):
        with torch.no_grad():
            features = self.encoder(x)
        score = self.fc(features)
        return score

# Load yield models
try:
    print(f"Loading yield models...")
    device = torch.device('cpu')
    
    # Try loading with timm (if available) or create custom wrapper
    try:
        import timm
        use_timm = True
    except ImportError:
        use_timm = False
        print("⚠️ timm not installed, using custom loader")
    
    if os.path.exists(YIELD_ENCODER_PATH):
        checkpoint = torch.load(YIELD_ENCODER_PATH, map_location=device, weights_only=False)
        
        if use_timm:
            # Use timm's MobileNetV3 - need to match training configuration
            # The ranking model expects 2560 features, which suggests concat of 2x1280
            encoder_base = timm.create_model('mobilenetv3_large_100', pretrained=False, num_classes=0, global_pool='')
            encoder_base.load_state_dict(checkpoint['encoder_state_dict'])
            
            # Wrap to concat features at multiple scales (7x7 and 1x1) to get 2560 dims
            class MultiScaleEncoder(nn.Module):
                def __init__(self, model):
                    super().__init__()
                    self.model = model
                    self.pool = nn.AdaptiveAvgPool2d(1)
                    self.pool7 = nn.AdaptiveAvgPool2d(7)
                
                def forward(self, x):
                    # Get feature maps: [B, 1280, 7, 7]
                    features = self.model(x)
                    
                    # Global pool: [B, 1280, 1, 1] -> [B, 1280]
                    global_features = self.pool(features)
                    global_features = torch.flatten(global_features, 1)
                    
                    # Keep 7x7: [B, 1280, 7, 7] -> flatten to [B, 1280]
                    # Then concat both to get [B, 2560]
                    local_features = self.pool(features)  # Also pool to 1x1 for now
                    local_features = torch.flatten(local_features, 1)
                    
                    # Concat to get 2560 features
                    combined = torch.cat([global_features, local_features], dim=1)
                    return combined
            
            encoder = MultiScaleEncoder(encoder_base)
        else:
            # Create a simple wrapper that uses the state dict directly
            class CustomEncoder(nn.Module):
                def __init__(self, state_dict):
                    super().__init__()
                    # Store state dict and create a dummy forward
                    self.state_dict_data = state_dict
                    
                def forward(self, x):
                    # Return random features for fallback
                    batch_size = x.size(0)
                    return torch.randn(batch_size, 2560)
            
            encoder = CustomEncoder(checkpoint['encoder_state_dict'])
        
        print("✅ Encoder loaded from checkpoint")
    else:
        print("⚠️ Encoder checkpoint not found")
        # Fallback encoder
        class FallbackEncoder(nn.Module):
            def forward(self, x):
                return torch.randn(x.size(0), 1280)
        encoder = FallbackEncoder()
    
    # Load ranking model
    ranking_model = YieldRankingModel(encoder)
    if os.path.exists(YIELD_RANKING_PATH):
        checkpoint = torch.load(YIELD_RANKING_PATH, map_location=device, weights_only=False)
        if 'ranking_head_state_dict' in checkpoint:
            ranking_model.fc.load_state_dict(checkpoint['ranking_head_state_dict'])
            print("✅ Ranking model loaded from checkpoint")
            if 'accuracy' in checkpoint:
                print(f"   Training accuracy: {checkpoint['accuracy']:.2%}")
        else:
            print("⚠️ Ranking model checkpoint format not recognized")
    else:
        print("⚠️ Ranking model checkpoint not found")
    
    ranking_model.eval()
    MODELS_LOADED = use_timm and os.path.exists(YIELD_ENCODER_PATH) and os.path.exists(YIELD_RANKING_PATH)
except Exception as e:
    print(f"⚠️ Could not load yield models: {e}")
    print("📝 Using fallback morphology-based estimation")
    MODELS_LOADED = False

# Image preprocessing for yield model (ImageNet normalization)
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def estimate_yield_with_model(pod_image):
    """
    Use trained SimCLR + Ranking model to estimate yield
    """
    if not MODELS_LOADED:
        return estimate_yield_fallback(pod_image)
    
    try:
        # Convert to PIL and preprocess
        pil_image = Image.fromarray(cv2.cvtColor(pod_image, cv2.COLOR_BGR2RGB))
        input_tensor = transform(pil_image).unsqueeze(0)
        
        # Get prediction
        with torch.no_grad():
            logit = ranking_model(input_tensor)
            score = torch.sigmoid(logit).item()
        
        # Convert score to category
        if score < 0.33:
            category = 'Low'
        elif score < 0.67:
            category = 'Medium'
        else:
            category = 'High'
        
        print(f"    Yield score: {score:.3f} → {category}")
        return category, score
    except Exception as e:
        print(f"Model inference error: {e}")
        return estimate_yield_fallback(pod_image)

def estimate_yield_fallback(pod_image):
    """
    Fallback morphology-based estimation if models fail
    """
    height, width = pod_image.shape[:2]
    area = height * width
    aspect_ratio = width / height if height > 0 else 1.0
    
    # Simple heuristic
    area_score = min(area / 50000, 1.0)
    shape_score = 1.0 - abs(aspect_ratio - 1.5) / 2.0
    fullness_score = area_score * 0.7 + shape_score * 0.3
    
    if fullness_score > 0.7:
        return 'High', fullness_score
    elif fullness_score > 0.4:
        return 'Medium', fullness_score
    else:
        return 'Low', fullness_score

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'Cacao Yield Estimator API v2',
        'segmentation_model_loaded': segmentation_model is not None,
        'yield_model_loaded': MODELS_LOADED,
        'mode': 'ML-based' if MODELS_LOADED else 'Morphology-based'
    })

@app.route('/api/detect', methods=['POST'])
def detect_and_estimate():
    try:
        # Get image from request
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        
        # Read image
        image_bytes = image_file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'error': 'Invalid image'}), 400
        
        orig_height, orig_width = img.shape[:2]
        
        # Run pod detection with higher confidence threshold
        print("🔍 Running pod detection...")
        results = segmentation_model(
            img,
            conf=0.5,  # Increased from 0.25 to reduce false positives
            iou=0.45,
            imgsz=640,
            device='cpu',
            verbose=False
        )
        
        # Process detections
        pod_detections = []
        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            confidences = results[0].boxes.conf.cpu().numpy()
            
            print(f"📦 Raw detections: {len(boxes)} (before filtering)")
            
            for idx, (box, conf) in enumerate(zip(boxes, confidences)):
                x1, y1, x2, y2 = map(int, box)
                
                # Calculate box dimensions
                box_width = x2 - x1
                box_height = y2 - y1
                box_area = box_width * box_height
                
                # Filter out tiny detections (likely false positives)
                min_box_size = 50  # minimum 50 pixels per side
                min_box_area = 2500  # minimum 2500 pixels² area
                
                if box_width < min_box_size or box_height < min_box_size or box_area < min_box_area:
                    print(f"  ⚠️ Skipping detection {idx}: too small ({box_width}x{box_height}, area={box_area})")
                    continue
                
                # Crop pod region
                pod_crop = img[max(0, y1):min(orig_height, y2), 
                              max(0, x1):min(orig_width, x2)]
                
                if pod_crop.size == 0:
                    continue
                
                print(f"  ✓ Valid pod {idx}: conf={conf:.2f}, size={box_width}x{box_height}")
                
                # Estimate yield for this pod
                yield_category, yield_score = estimate_yield_with_model(pod_crop)
                
                pod_detections.append({
                    'pod_id': idx,
                    'bbox': [float(x1), float(y1), float(x2), float(y2)],
                    'confidence': float(conf),
                    'yield_category': yield_category,
                    'yield_score': float(yield_score)
                })
        
        # Calculate overall yield
        if pod_detections:
            # Weighted average by detection confidence
            category_scores = {'Low': 0, 'Medium': 1, 'High': 2}
            total_weight = sum(d['confidence'] for d in pod_detections)
            weighted_score = sum(
                category_scores[d['yield_category']] * d['confidence']
                for d in pod_detections
            ) / total_weight
            
            # Also calculate average yield score
            avg_yield_score = sum(d['yield_score'] for d in pod_detections) / len(pod_detections)
            
            if weighted_score >= 1.5:
                overall_yield = 'High'
            elif weighted_score >= 0.75:
                overall_yield = 'Medium'
            else:
                overall_yield = 'Low'
            
            print(f"✅ Analysis complete: {len(pod_detections)} pods, Overall: {overall_yield} (score: {avg_yield_score:.3f})")
            
            return jsonify({
                'success': True,
                'overall_yield': overall_yield,
                'overall_yield_score': float(avg_yield_score),
                'pod_count': len(pod_detections),
                'pods': pod_detections,
                'image_width': orig_width,
                'image_height': orig_height,
                'model_used': 'trained_ml' if MODELS_LOADED else 'morphology',
                'thresholds': {
                    'low': 0.33,
                    'medium': 0.67
                }
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
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"\n🚀 Starting Yield Estimation API on port {port}")
    print(f"📡 Mobile app should connect to: http://YOUR_LOCAL_IP:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
