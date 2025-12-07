# 🍫 Cocoa Disease Detection

*Real-time AI-powered detection of cocoa pod diseases using YOLOv8*

## Overview

A full-stack web application for detecting diseases in cocoa pods using deep learning. Features real-time camera detection with bounding boxes, file uploads, and instant analysis.

**Detects 3 classes:**
- ✅ **Healthy** pods
- 🦠 **Monilia** (Frosty pod rot)  
- ⚠️ **Phytophthora** (Black pod disease)

## ✨ Features

- 📸 **Live Camera Detection**: Real-time detection with bounding boxes at 10-20 FPS
- 📦 **Bounding Boxes**: Visual boxes around detected pods with labels
- 📁 **File Upload**: Upload and analyze images from your device
- 🖱️ **Drag & Drop**: Simple drag-and-drop interface
- 🎯 **Multiple Detections**: Shows all detected diseases in one image
- 📊 **Confidence Scores**: Displays detection confidence percentage
- 🎨 **Modern UI**: Beautiful interface with dark mode support
- ⚡ **Fast Inference**: ~50-100ms per image

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16 with TypeScript
- Tailwind CSS
- Shadcn UI Components
- Canvas API for bounding boxes

**Backend:**
- Flask (Python REST API)
- YOLOv8 (Ultralytics)
- OpenCV for image processing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Trained YOLOv8 model (`best.pt` in `public/models/`)

### Installation

1. **Clone and setup**
```bash
git clone <your-repo-url>
cd cocoa-disease-detection
./setup.sh
```

2. **Start both servers**
```bash
./start.sh
```
Or manually in separate terminals:
```bash
# Terminal 1 - API Server
source venv/bin/activate
python3 api/detect.py

# Terminal 2 - Web App
npm run dev
```

3. **Open browser** at http://localhost:3000

## 📖 Usage

### Live Detection (Recommended)
1. Click **"Use Camera"** button
2. Allow camera permissions
3. Click **"Start Live Detection"**
4. Point camera at cocoa pods
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
   - Structure: `train/`, `val/`, `test/` with `images/` and `labels/`

2. **Open training notebook:**
   - Upload `cocoa_disease_yolov8_colab.ipynb` to Google Colab
   - Enable T4 GPU: Runtime → Change runtime type → GPU

3. **Run all cells:**
   - Training: ~30-60 minutes
   - Model saved: `MyDrive/cocoa-disease-detection/yolov8_training/weights/best.pt`

4. **Download `best.pt`** and place in `public/models/`

**Expected Performance:** mAP50 > 0.70

## 📁 Project Structure

```
cocoa-disease-detection/
├── api/
│   └── detect.py              # Flask API for YOLOv8 inference
├── app/
│   ├── page.tsx               # Main page
│   └── layout.tsx             # App layout
├── components/
│   └── cacao-detector.tsx     # Detection component with camera
├── public/
│   └── models/
│       └── best.pt            # Trained YOLOv8 model
├── cocoa_disease_yolov8_colab.ipynb  # Training notebook
├── convert_supervisely_to_yolo.py    # Dataset conversion
├── requirements.txt           # Python dependencies
├── package.json               # Node dependencies
├── setup.sh                   # Setup script
└── start.sh                   # Start both servers
```

## 📊 API Endpoints

**POST** `/api/detect`
- Request: `multipart/form-data` with `image` file
- Response:
```json
{
  "class": "phytophthora",
  "confidence": 0.87,
  "all_detections": [
    {
      "class": "phytophthora",
      "confidence": 0.87,
      "bbox": [x1, y1, x2, y2]
    }
  ]
}
```

**GET** `/api/health`
- Response: `{"status": "ok", "model_loaded": true}`

## 🐛 Troubleshooting

**Port 5001 already in use:**
```bash
lsof -ti:5001 | xargs kill -9
```

**Camera shows black screen:**
- Refresh page
- Check camera permissions in browser
- Try different browser (Chrome/Safari)

**API connection error:**
- Ensure Python server running on port 5001
- Check `http://localhost:5001/api/health`
- Restart: `source venv/bin/activate && python3 api/detect.py`

**Model not loading:**
- Verify `public/models/best.pt` exists
- Check file size (~6MB)

## 📚 Documentation

- **README.md** (this file) - Main documentation
- **USAGE.md** - Detailed usage guide with troubleshooting
- **LIVE_DETECTION.md** - Live detection feature documentation

## 🙏 Acknowledgments

- Dataset: [DatasetNinja - Cocoa Diseases](https://datasetninja.com/cocoa-diseases)
- YOLOv8: [Ultralytics](https://github.com/ultralytics/ultralytics)
- UI Components: [Shadcn UI](https://ui.shadcn.com/)

---

**For detailed usage instructions, see [USAGE.md](USAGE.md)**