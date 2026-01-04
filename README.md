# � Cacao Yield Estimator

*AI-powered estimation of cacao pod yield potential using self-supervised learning*

## Overview

A full-stack mobile and web application for estimating cacao pod yield potential using deep learning. This system enables farmers, buyers, and cooperatives to make data-driven harvesting decisions without destructive pod opening.

**Estimates yield in 3 categories:**
- 📈 **High Yield** - Pods with high bean count potential
- 📊 **Medium Yield** - Average expected bean count
- 📉 **Low Yield** - Lower bean count expected

## ✨ Features

- 📱 **Mobile App**: React Native Expo app for iOS and Android
- 📸 **Real-time Camera**: Point and shoot for instant yield analysis
- 🤖 **YOLOv8 Segmentation**: Accurate pod detection and isolation
- 🧠 **Self-Supervised Learning**: MobileNetV3 with SimCLR (no labels needed)
- 📊 **Relative Ranking**: Siamese network for yield comparison
- 🎯 **Multi-pod Analysis**: Analyze multiple pods in one image
- 💾 **History Tracking**: Save and review past assessments
- ⚡ **Offline Mode**: Works without internet connection
- 🎨 **Modern UI**: Beautiful interface with dark mode support

## 🛠️ Tech Stack

**Mobile App:**
- React Native with Expo
- TypeScript
- Expo Camera & Image Picker
- ONNX Runtime for inference

**Backend API:**
- Flask (Python REST API)
- YOLOv8 Segmentation (Ultralytics)
- PyTorch for inference
- OpenCV for image processing

**Training:**
- Google Colab with GPU
- YOLOv8n-seg model
- MobileNetV3 + SimCLR
- Siamese ranking network

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.8+
- Expo CLI (`npm install -g expo-cli`)
- Google Colab (for training)

### 1. Train Models (Google Colab)

**Step 1: Train YOLOv8 Segmentation**
\`\`\`bash
# Open train_cacao_segmentation_yolov8.ipynb in Colab
# Add your Roboflow API key: YOUR_API_KEY_HERE
# Run all cells
# Download: cacao_segmentation_best.pt
\`\`\`

**Step 2: Train Yield Estimation Model**
\`\`\`bash
# Open train_yield_estimation_simclr.ipynb in Colab
# Upload segmentation model from step 1
# Run all cells
# Download: complete_yield_model.pt and yield_ranking_model.onnx
\`\`\`

### 2. Setup Mobile App

\`\`\`bash
# Clone repository
git clone <your-repo-url>
cd cocoa-disease-detection

# Install mobile app dependencies
cd mobile-app
npm install

# Add trained models to assets
mkdir -p assets/models
# Copy your trained .onnx models here

# Start Expo development server
npx expo start
# Scan QR code with Expo Go app
\`\`\`

**Detailed Setup**: See [MOBILE_APP_SETUP.md](./MOBILE_APP_SETUP.md)

### 3. Run Backend API (Optional)

\`\`\`bash
pip install flask flask-cors ultralytics opencv-python pillow torch
cd api
python detect.py
# API runs on http://localhost:5001
\`\`\`

## 📖 Usage

### Mobile App
1. Open Expo Go app on your phone
2. Scan QR code from terminal
3. Allow camera and storage permissions
4. **Take Photo** or **Choose from Gallery**
5. View yield estimation results
6. Save to history for tracking

### API Usage
\`\`\`bash
curl -X POST -F "image=@pod.jpg" \\
  http://localhost:5001/api/estimate-yield
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "overall_yield": "High",
  "pod_count": 3,
  "pods": [
    {
      "pod_id": 0,
      "yield_category": "High",
      "confidence": 0.92,
      "yield_score": 0.85
    }
  ]
}
\`\`\`
5. See real-time bounding boxes and results

### Static Image Upload
1. Click **"Upload Image"** or drag and drop
2. Select cocoa pod image
3. Click **"Analyze Image"**
4. View bounding boxes and all detected diseases

## 🧠 Model Training

**Dataset:** 312 images, 1,591 annotations (healthy, phytophthora, monilia)

1. **Upload dataset to Google Drive:**
   - Path: `MyDrive/cocoa-disease-detection/dataset/`
   - Structure: `train/`, `val/`, `test/` with `images/` and `labels/`## 🎓 How It Works

### Training Pipeline

1. **YOLOv8 Segmentation Training**
   - Upload `train_cacao_segmentation_yolov8.ipynb` to Colab
   - Enable T4/A100 GPU
   - Connect Roboflow dataset
   - Training: ~1-2 hours
   - Download: `cacao_segmentation_best.pt`

2. **MobileNetV3 + SimCLR Training**
   - Upload `train_yield_estimation_simclr.ipynb` to Colab
   - Extract pod crops using segmentation model
   - Self-supervised feature learning (no labels!)
   - Training: ~2-3 hours
   - Download: `complete_yield_model.pt`

3. **Deployment**
   - Convert models to ONNX format
   - Copy to mobile app assets
   - Deploy via Expo EAS

## 📁 Project Structure

\`\`\`
cocoa-disease-detection/
├── api/
│   └── detect.py                          # Yield estimation API
├── mobile-app/                             # React Native app
│   ├── app/                               # Expo Router screens
│   ├── assets/models/                     # AI models (.onnx)
│   ├── package.json
│   └── app.json
├── train_cacao_segmentation_yolov8.ipynb  # Training notebook 1
├── train_yield_estimation_simclr.ipynb    # Training notebook 2
├── public/models/                          # Trained models (.pt)
├── MOBILE_APP_SETUP.md                     # Setup instructions
├── README.md
└── requirements.txt
\`\`\`

## 📊 API Endpoints

**POST** `/api/estimate-yield`
- Request: `multipart/form-data` with `image` file
- Response:
\`\`\`json
{
  "success": true,
  "overall_yield": "High",
  "pod_count": 3,
  "pods": [
    {
      "pod_id": 0,
      "yield_category": "High",
      "confidence": 0.92,
      "yield_score": 0.85,
      "bbox": [x1, y1, x2, y2],
      "morphology": {
        "area": 45000,
        "aspect_ratio": 1.52,
        "perimeter": 850
      }
    }
  ]
}
\`\`\`

**GET** `/api/health`
- Response: `{"status": "ok", "segmentation_model_loaded": true, "service": "Cacao Yield Estimator API"}`

## 🐛 Troubleshooting

See [MOBILE_APP_SETUP.md](./MOBILE_APP_SETUP.md#troubleshooting) for detailed solutions.

**Quick Fixes:**
- Models not loading: Check `assets/models/` directory
- Camera not working: Grant permissions in phone settings
- Slow inference: Use quantized models, reduce resolution
- App crashes: Clear cache `npx expo start -c`

## 📚 Documentation

- **Mobile App Setup**: [MOBILE_APP_SETUP.md](./MOBILE_APP_SETUP.md)
- **Training Guide**: See notebooks for detailed comments
- **API Documentation**: Check `/api/detect.py` for endpoint details
- **Dataset**: [Roboflow Cacao Dataset](https://universe.roboflow.com/cariesdetectionproject/cacao-uf6rm)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **YOLOv8** by Ultralytics
- **MobileNetV3** architecture by Google
- **SimCLR** self-supervised learning framework
- **Roboflow** for dataset hosting
- **Expo** team for mobile framework
- Cacao farmers worldwide for inspiration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/cacao-yield-estimator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/cacao-yield-estimator/discussions)
- **Email**: support@cacaoyield.app

## 🎯 Roadmap

- [x] YOLOv8 segmentation training notebook
- [x] SimCLR yield estimation training notebook
- [x] Mobile app MVP (React Native Expo)
- [x] Backend API for yield estimation
- [ ] Cloud sync for assessment history
- [ ] Multi-language support (Spanish, Portuguese, French)
- [ ] Farmer feedback integration system
- [ ] Advanced analytics dashboard
- [ ] Integration with farm management systems
- [ ] Real-time collaborative features

## 📊 Citation

If you use this system in research, please cite:

\`\`\`bibtex
@software{cacao_yield_estimator_2026,
  title={Cacao Pod Yield Estimation using Self-Supervised Learning},
  author={Your Name},
  year={2026},
  publisher={GitHub},
  url={https://github.com/yourusername/cacao-yield-estimator}
}
\`\`\`

---

**Made with ❤️ for cacao farmers worldwide**

*Empowering sustainable cacao production through AI*

- **README.md** (this file) - Main documentation
- **USAGE.md** - Detailed usage guide with troubleshooting
- **LIVE_DETECTION.md** - Live detection feature documentation

## 🙏 Acknowledgments

- Dataset: [DatasetNinja - Cocoa Diseases](https://datasetninja.com/cocoa-diseases)
- YOLOv8: [Ultralytics](https://github.com/ultralytics/ultralytics)
- UI Components: [Shadcn UI](https://ui.shadcn.com/)

---

**For detailed usage instructions, see [USAGE.md](USAGE.md)**
