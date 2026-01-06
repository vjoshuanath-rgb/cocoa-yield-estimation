# Mobile App Setup Guide

## Quick Start

The mobile app now uses the **backend API** for detection instead of local ONNX inference (which requires complex native setup in Expo).

### Step 1: Start the Backend API

```bash
# From project root
cd /Users/wedemeyer/cocoa-disease-detection

# Install Python dependencies (if not already done)
pip install -r requirements.txt

# Start the Flask API server
python api/detect.py
```

The server will start on **http://localhost:5001**

### Step 2: Update API URL for Mobile Device Testing

If testing on a physical device (iPhone/Android), you need to use your computer's local IP address instead of `localhost`:

1. Find your computer's IP address:
   ```bash
   # macOS
   ipconfig getifaddr en0
   
   # Or check System Settings > Network
   ```

2. Update [services/apiService.ts](services/apiService.ts) line 8:
   ```typescript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5001';
   // Example: 'http://192.168.1.100:5001'
   ```

### Step 3: Start the Mobile App

```bash
cd mobile-app
npm start

# Then choose:
# - Press 'i' for iOS simulator (localhost works)
# - Press 'a' for Android emulator (localhost works)
# - Scan QR code for physical device (need IP address)
```

## Architecture

```
Mobile App (React Native/Expo)
    ↓ HTTP Request with image
Backend API (Flask on port 5001)
    ↓ Loads models
YOLOv8 Segmentation Model (best.pt)
    ↓ Detects pods
Yield Estimation Logic
    ↓ Returns JSON
Mobile App displays results
```

## API Endpoints

### Health Check
```bash
GET http://localhost:5001/api/health

Response:
{
  "status": "ok",
  "segmentation_model_loaded": true,
  "service": "Cacao Yield Estimator API"
}
```

### Detect & Estimate Yield
```bash
POST http://localhost:5001/api/detect
Content-Type: multipart/form-data

Body: image file

Response:
{
  "success": true,
  "overall_yield": "High",
  "pod_count": 3,
  "pods": [
    {
      "pod_id": 0,
      "bbox": [100, 150, 300, 400],
      "confidence": 0.92,
      "yield_category": "High",
      "yield_score": 0.85
    }
  ]
}
```

## Troubleshooting

### "Cannot connect to backend API"

1. Check backend is running: `curl http://localhost:5001/api/health`
2. If testing on physical device, make sure:
   - Phone and computer on same WiFi network
   - Using computer's IP address (not localhost)
   - Firewall allows port 5001

### "No cacao pods detected"

- Make sure image contains visible cacao pods
- Try different lighting/angles
- Check backend logs for errors

### Build errors

If you still see ONNX-related errors:
```bash
# Clear cache and restart
rm -rf node_modules/.cache
npm start -- --clear
```

## Future: Local ONNX Inference

To use local ONNX models (better for offline use):

1. Need to eject from Expo or use EAS custom build
2. Install native dependencies properly
3. Configure proper image preprocessing
4. See [MODEL_INTEGRATION_STATUS.md](MODEL_INTEGRATION_STATUS.md) for details

For now, the API approach is simpler and works immediately!

## File Structure

```
mobile-app/
├── app/
│   └── (tabs)/
│       ├── index.tsx          # Main detection screen
│       ├── history.tsx         # History (placeholder)
│       └── settings.tsx        # Settings (placeholder)
├── services/
│   ├── apiService.ts          # ✅ Currently used
│   └── modelService.ts        # ⚠️ For future local inference
├── assets/
│   └── models/
│       ├── cacao_segmentation_best.onnx
│       └── yield_ranking_model_a100.onnx
└── package.json
```
