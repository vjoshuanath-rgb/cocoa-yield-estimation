# Model Integration Status

## ✅ Completed

1. **ONNX Models**: Both models are present in `assets/models/`:
   - `cacao_segmentation_best.onnx` - YOLOv8 for pod detection
   - `yield_ranking_model_a100.onnx` - MobileNetV3 for yield estimation

2. **Model Loading**: `modelService.ts` properly loads both ONNX models using `onnxruntime-react-native`

3. **UI Integration**: Main screen (`app/(tabs)/index.tsx`) integrated with:
   - Model loading on app startup
   - Real-time detection feedback
   - Error handling for model failures
   - Visual results display

4. **Image Preprocessing**: Using `expo-image-manipulator` for:
   - Resizing images to 640x640 (YOLOv8)
   - Cropping detected pods
   - Resizing crops to 224x224 (MobileNetV3)

## ⚠️ Current Limitations

### Critical: Image Decoding Not Implemented

The current implementation has **placeholder image preprocessing**:

```typescript
// Current: Random data (lines 70-79 in modelService.ts)
for (let i = 0; i < data.length; i++) {
  data[i] = Math.random(); // ❌ NOT REAL IMAGE DATA
}
```

**What's needed**:
1. Decode base64/JPEG → raw RGB pixel array
2. Normalize pixels: `pixel_value / 255.0`
3. Convert to CHW format (Channels, Height, Width)
4. Apply ImageNet normalization for yield model

### Recommended Solutions

#### Option 1: Use react-native-fast-image + canvas (Best for Production)
```bash
npm install @react-native-community/image-editor react-native-canvas
```

#### Option 2: Use Web API in Expo (Easier, but web-only initially)
```typescript
// Can use Image API available in Expo SDK 50+
import { Image } from 'expo-image';
```

#### Option 3: Call Backend API (Simplest for MVP)
```typescript
// Send image to your API at /api/detect.py
const response = await fetch('YOUR_API/detect', {
  method: 'POST',
  body: formData
});
```

## 🔧 Quick Fix: Use Backend API

For immediate functionality, modify `modelService.ts`:

```typescript
export async function detectAndEstimateYield(imageUri: string) {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const response = await fetch('YOUR_API_URL/api/detect', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}
```

## 📊 Model Architecture

### YOLOv8 Segmentation Model
- **Input**: `[1, 3, 640, 640]` float32
- **Output**: `[1, 84, 8400]` float32
  - First 4 channels: bounding box (x_center, y_center, width, height)
  - Next 80 channels: class probabilities
- **Post-processing**: NMS (IoU threshold 0.45)

### Yield Ranking Model  
- **Input**: `[1, 1280]` float32 (MobileNetV3 features)
- **Output**: `[1, 1]` float32 (logit value)
- **Categories**: 
  - Low: score < 0.33
  - Medium: 0.33 ≤ score < 0.67
  - High: score ≥ 0.67

## 🚀 Next Steps

1. **Implement proper image decoding** (choose from options above)
2. **Test with real cocoa pod images**
3. **Validate detection accuracy**
4. **Optimize inference speed** (consider model quantization)
5. **Add offline caching** for model outputs
6. **Implement history tracking** (currently placeholder in history.tsx)

## 📝 Testing

To test the current implementation:

```bash
cd mobile-app
npm start
# Press 'i' for iOS or 'a' for Android
```

The app will:
- Load models on startup (✅ works)
- Accept camera/gallery images (✅ works)
- Run inference (⚠️ placeholder data)
- Display results (✅ works)

## 🐛 Known Issues

1. **Random detections**: Since image data is random, detections will be random
2. **Performance**: Image preprocessing may be slow without proper optimization
3. **Memory**: Large images may cause OOM on low-end devices
4. **Model outputs**: Need validation with real data to ensure correct parsing

## 💡 Production Checklist

- [ ] Implement real image decoding
- [ ] Add model warm-up on app start
- [ ] Implement result caching
- [ ] Add telemetry for model performance
- [ ] Handle edge cases (no pods, multiple classes, etc.)
- [ ] Add confidence threshold UI control
- [ ] Implement batch processing for multiple images
- [ ] Add export functionality for results
- [ ] Optimize bundle size (consider dynamic model loading)

---

**Status**: 🟡 Functional framework, needs image decoding for production use
**Updated**: January 6, 2026
