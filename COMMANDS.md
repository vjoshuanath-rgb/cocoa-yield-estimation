# 🚀 Quick Commands Reference

Quick access to all important commands for the Cacao Yield Estimator project.

## 📱 Mobile App Commands

### Development
```bash
# Start development server
cd mobile-app && npx expo start

# iOS Simulator (Mac only)
cd mobile-app && npx expo start --ios

# Android Emulator
cd mobile-app && npx expo start --android

# Web browser (limited features)
cd mobile-app && npx expo start --web

# Clear cache
cd mobile-app && npx expo start -c

# Install dependencies
cd mobile-app && npm install
```

### Production Builds
```bash
# iOS production build
cd mobile-app && eas build --platform ios --profile production

# Android production build
cd mobile-app && eas build --platform android --profile production

# Submit to App Store
cd mobile-app && eas submit --platform ios

# Submit to Play Store
cd mobile-app && eas submit --platform android
```

### Testing
```bash
# Run tests
cd mobile-app && npm test

# Lint code
cd mobile-app && npm run lint
```

## 🔬 Training Commands (Google Colab)

### Open Notebooks
```bash
# Upload to Google Colab:
# 1. train_cacao_segmentation_yolov8.ipynb
# 2. train_yield_estimation_simclr.ipynb

# Or run locally:
jupyter notebook train_cacao_segmentation_yolov8.ipynb
```

### Model Management
```bash
# Create models directory
mkdir -p mobile-app/assets/models
mkdir -p public/models

# Copy trained models
cp ~/Downloads/cacao_segmentation_best.onnx mobile-app/assets/models/
cp ~/Downloads/yield_ranking_model.onnx mobile-app/assets/models/
cp ~/Downloads/cacao_segmentation_best.pt public/models/
```

## 🖥️ Backend API Commands

### Development
```bash
# Install dependencies
pip install flask flask-cors ultralytics opencv-python pillow torch

# Run API server
cd api && python detect.py

# Run on custom port
cd api && PORT=8000 python detect.py
```

### Testing
```bash
# Health check
curl http://localhost:5001/api/health

# Test yield estimation
curl -X POST -F "image=@test_pod.jpg" http://localhost:5001/api/estimate-yield

# Pretty print JSON
curl -X POST -F "image=@test_pod.jpg" http://localhost:5001/api/estimate-yield | jq .
```

## 🛠️ Setup Commands

### First Time Setup
```bash
# Clone repository
git clone <your-repo-url>
cd cocoa-disease-detection

# Install Node dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Setup mobile app
cd mobile-app
npm install
cd ..
```

### Environment Setup
```bash
# Create virtual environment (Python)
python -m venv venv
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows

# Install Expo CLI globally
npm install -g expo-cli eas-cli
```

## 📦 Package Management

### Node.js
```bash
# Install package
npm install <package-name>

# Install dev dependency
npm install --save-dev <package-name>

# Update packages
npm update

# Check for outdated packages
npm outdated
```

### Python
```bash
# Install package
pip install <package-name>

# Install from requirements
pip install -r requirements.txt

# Freeze dependencies
pip freeze > requirements.txt

# Upgrade package
pip install --upgrade <package-name>
```

## 🧹 Cleanup Commands

### Clear Caches
```bash
# Node modules and caches
rm -rf node_modules
rm -rf mobile-app/node_modules
rm -rf .next
npm install

# Expo cache
cd mobile-app
rm -rf .expo
npx expo start -c

# Python cache
find . -type d -name "__pycache__" -exec rm -r {} +
find . -type f -name "*.pyc" -delete
```

## 🐛 Debugging Commands

### Check Versions
```bash
# Node.js and npm
node --version
npm --version

# Python and pip
python --version
pip --version

# Expo CLI
expo --version

# Check Expo doctor
cd mobile-app && npx expo doctor
```

### Process Management
```bash
# Kill process on port
lsof -ti:5001 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :5001  # Windows

# List running Node processes
ps aux | grep node

# List Expo processes
ps aux | grep expo
```

### Logs
```bash
# Expo logs
cd mobile-app && npx expo start --clear

# Python API logs
cd api && python detect.py 2>&1 | tee api.log

# iOS simulator logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Expo"'

# Android logs
adb logcat | grep -i expo
```

## 📊 Git Commands

### Basic Workflow
```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "Add yield estimation feature"

# Push
git push origin main

# Pull latest
git pull origin main
```

### Branching
```bash
# Create new branch
git checkout -b feature/mobile-app

# Switch branch
git checkout main

# Merge branch
git merge feature/mobile-app

# Delete branch
git branch -d feature/mobile-app
```

## 📱 Device Commands

### iOS
```bash
# List simulators
xcrun simctl list devices

# Open simulator
open -a Simulator

# Reset simulator
xcrun simctl erase all
```

### Android
```bash
# List devices
adb devices

# Install APK
adb install app.apk

# Reverse port (for localhost API)
adb reverse tcp:5001 tcp:5001

# Open emulator
emulator -avd <emulator-name>
```

## 🔧 Configuration

### Environment Variables
```bash
# Create .env file
cd mobile-app
cat > .env << EOF
EXPO_PUBLIC_API_URL=http://your-api-url.com
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EOF
```

## 📦 Model Conversion

### ONNX Export
```python
# In Python/Colab
from ultralytics import YOLO
model = YOLO('best.pt')
model.export(format='onnx', imgsz=640)
```

### TorchScript Export
```python
model.export(format='torchscript', imgsz=640)
```

## 🎯 Quick Troubleshooting

```bash
# Problem: Expo not starting
npx expo start -c
rm -rf node_modules && npm install

# Problem: Models not found
ls -lh mobile-app/assets/models/
ls -lh public/models/

# Problem: Port already in use
lsof -ti:5001 | xargs kill -9

# Problem: Cache issues
watchman watch-del-all
rm -rf node_modules
rm -rf $TMPDIR/react-*
npm cache clean --force
npm install
```

## 📚 Useful Aliases (Add to ~/.bashrc or ~/.zshrc)

```bash
# Project shortcuts
alias cacao='cd ~/path/to/cocoa-disease-detection'
alias mobileapp='cd ~/path/to/cocoa-disease-detection/mobile-app'
alias startapp='cd ~/path/to/cocoa-disease-detection/mobile-app && npx expo start'
alias startapi='cd ~/path/to/cocoa-disease-detection/api && python detect.py'

# Cleanup
alias cleannode='rm -rf node_modules && npm install'
alias cleanexpo='rm -rf .expo && npx expo start -c'

# Testing
alias testapi='curl http://localhost:5001/api/health'
```

---

## 📖 More Resources

- Full Setup Guide: `MOBILE_APP_SETUP.md`
- Getting Started: `GETTING_STARTED.md`
- Main README: `README.md`

---

**Pro Tip**: Bookmark this file for quick access to common commands! 🔖
