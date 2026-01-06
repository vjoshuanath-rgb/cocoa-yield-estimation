# Backend Setup - Yield Estimation API

## Current Status

✅ **Segmentation Model**: Already available at `public/models/best.pt`  
⚠️ **Yield Models**: Need to download from Colab training

## Required Models

The backend needs these PyTorch (.pt) files:

```
cocoa-disease-detection/
├── public/models/
│   └── best.pt                     ✅ Already exists (segmentation)
│
└── models/                         📁 Create this folder
    ├── simclr_encoder_a100.pt      ⬇️ Download from Colab
    └── ranking_model_a100.pt       ⬇️ Download from Colab
```

## Download Models from Colab

In your Colab notebook ([train_yield_estimation_simclr_a100.ipynb](../train_yield_estimation_simclr_a100.ipynb)):

### Cell 31: Create Model Info
```python
# Run this cell to create metadata
```

### Cell 32: Download Models
```python
# This will download all models to your Downloads folder
```

Then move them:
```bash
cd /Users/wedemeyer/cocoa-disease-detection
mkdir -p models

# Move from Downloads
mv ~/Downloads/simclr_encoder_a100.pt models/
mv ~/Downloads/ranking_model_a100.pt models/
```

## Start the Backend

```bash
cd /Users/wedemeyer/cocoa-disease-detection
python api/yield_detect.py
```

Output should show:
```
✅ Segmentation model loaded
✅ Encoder loaded from checkpoint
✅ Ranking model loaded from checkpoint
🚀 Starting Yield Estimation API on port 5001
```

## If Models Not Found

The backend will **still work** using fallback morphology-based estimation (less accurate but functional).

To use the trained ML models, you MUST download them from Colab.

## Mobile App Connection

The mobile app is already configured to connect to:
- **URL**: `http://192.168.1.6:5001`
- **Endpoint**: `/api/detect`

Make sure:
1. Backend is running (`python api/yield_detect.py`)
2. Phone/simulator on same WiFi network as computer
3. Computer firewall allows port 5001

## Test the API

```bash
# Check if running
curl http://192.168.1.6:5001/api/health

# Should return:
{
  "status": "ok",
  "service": "Cacao Yield Estimator API v2",
  "segmentation_model_loaded": true,
  "yield_model_loaded": true,  # false if models not downloaded
  "mode": "ML-based"            # or "Morphology-based"
}
```

## Architecture

```
Mobile App (Phone)
    ↓ HTTP POST with image
Backend API (Computer at 192.168.1.6:5001)
    ↓ Load models
1. YOLOv8 (best.pt) → Detect pods
2. SimCLR Encoder (simclr_encoder_a100.pt) → Extract features  
3. Ranking Model (ranking_model_a100.pt) → Estimate yield
    ↓ Return JSON
Mobile App displays results
```
