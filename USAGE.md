# 🚀 Quick Start Guide

## Running the Application

Your cocoa disease detection system is ready! Here's how to use it:

### Option 1: One-Command Start (Recommended)
```bash
./start.sh
```
This starts both the API server and web app simultaneously.

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - API Server:**
```bash
source venv/bin/activate
python3 api/detect.py
```

**Terminal 2 - Web App:**
```bash
npm run dev
```

### Access the App
Open your browser and navigate to:
- **Web App**: http://localhost:3000
- **API Health**: http://localhost:5001/api/health

---

## 📸 How to Use

### Method 1: Camera Detection
1. Click the **"Use Camera"** button
2. Grant camera permissions when prompted
3. Position a cocoa pod in view
4. Click **"Capture Photo"**
5. Click **"Analyze Image"** to detect disease
6. View results with confidence score

### Method 2: Upload Image
1. Click **"Upload Image"** button
2. Select a cocoa pod image from your device
3. Click **"Analyze Image"**
4. View detection results

### Method 3: Drag & Drop
1. Drag an image file from your computer
2. Drop it onto the upload area
3. Click **"Analyze Image"**
4. View results

---

## 📊 Understanding Results

The app will show:
- **Disease Class**: Healthy, Monilia, or Phytophthora
- **Confidence**: Percentage confidence of detection
- **Description**: Information about the detected condition

**Confidence Levels:**
- 🟢 **>80%**: High confidence - reliable detection
- 🟡 **60-80%**: Medium confidence - likely correct
- 🔴 **<60%**: Low confidence - verify with another image

---

## ⚠️ Troubleshooting

### Camera Not Working
- **Check permissions**: Allow camera access in browser settings
- **Try different browser**: Chrome/Safari recommended
- **HTTPS required**: Camera only works on localhost or HTTPS

### API Connection Error
- **Check API server**: Make sure it's running on port 5001
- **Check terminal**: Look for errors in the API server terminal
- **Restart servers**: Stop and restart both servers

### "Port Already in Use"
- **Port 5001 busy**: Kill the process using port 5001
  ```bash
  lsof -ti:5001 | xargs kill -9
  ```
- **Port 3000 busy**: Kill the process using port 3000
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

### Model Not Loading
- **Check model file**: Ensure `public/models/best.pt` exists
- **Verify size**: Model should be ~6MB
- **Reinstall dependencies**:
  ```bash
  source venv/bin/activate
  pip install -r requirements.txt
  ```

---

## 🎯 Tips for Best Results

### Taking Photos
- ✅ Good lighting (natural daylight preferred)
- ✅ Focus on the cocoa pod
- ✅ Avoid blurry images
- ✅ Fill frame with the pod
- ❌ Avoid shadows or backlight
- ❌ Don't include too many pods in one image

### Image Quality
- **Minimum**: 300x300 pixels
- **Recommended**: 640x640 pixels or higher
- **Format**: JPG, PNG, WebP
- **File size**: < 10MB

---

## 📁 Project Structure

```
cocoa-disease-detection/
├── api/
│   └── detect.py              # Flask API server
├── app/
│   ├── page.tsx               # Main page
│   └── layout.tsx             # App layout
├── components/
│   └── cacao-detector.tsx     # Detection component
├── public/
│   └── models/
│       └── best.pt            # YOLOv8 model (6MB)
├── setup.sh                   # Installation script
├── start.sh                   # Start both servers
└── requirements.txt           # Python deps
```

---

## 🔄 Updating the Model

If you retrain the model:

1. **Download** new `best.pt` from Google Colab
2. **Replace** the file in `public/models/best.pt`
3. **Restart** the API server
4. **Test** with sample images

---

## 📈 Performance

- **Inference Speed**: 100-300ms per image
- **Model Size**: ~6MB
- **Accuracy**: mAP50 > 0.70
- **GPU**: Not required (CPU inference)

---

## 🆘 Need Help?

Check the main [README.md](README.md) for:
- Detailed setup instructions
- Model training guide
- API documentation
- Advanced troubleshooting

---

## ✅ Checklist

Before using the app, make sure:
- [x] Ran `./setup.sh` successfully
- [x] `best.pt` model exists in `public/models/`
- [x] API server running on port 5001
- [x] Web app running on port 3000
- [x] Browser allows camera access (if using camera)

**Everything ready?** Open http://localhost:3000 and start detecting! 🍫
