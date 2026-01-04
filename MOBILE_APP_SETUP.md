# 📱 Mobile App Setup Guide

Complete step-by-step instructions to run the Cacao Yield Estimator mobile app on your device.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running on iOS](#running-on-ios)
4. [Running on Android](#running-on-android)
5. [Model Setup](#model-setup)
6. [Troubleshooting](#troubleshooting)
7. [Building for Production](#building-for-production)

---

## 1. Prerequisites

### Required Software

- **Node.js**: Version 18.0 or higher
  - Download: https://nodejs.org/
  - Verify: `node --version`

- **npm or pnpm**: Package manager
  - npm comes with Node.js
  - pnpm: `npm install -g pnpm`

- **Expo CLI**: Mobile development framework
  ```bash
  npm install -g expo-cli
  ```

- **Git**: Version control
  - Download: https://git-scm.com/

### For iOS Development (Mac only)

- **Xcode**: Latest version from App Store
- **iOS Simulator**: Installed with Xcode
- **CocoaPods**: `sudo gem install cocoapods`

### For Android Development

- **Android Studio**: Download from https://developer.android.com/studio
- **Android SDK**: Installed via Android Studio
- **Android Emulator**: Created in Android Studio

### For Device Testing

- **iOS**: Install Expo Go from App Store
- **Android**: Install Expo Go from Play Store

---

## 2. Installation

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd cocoa-disease-detection
```

### Step 2: Install Dependencies

```bash
cd mobile-app
npm install
# or if using pnpm
pnpm install
```

This will install all required packages including:
- React Native
- Expo SDK
- Camera and image picker modules
- AI/ML libraries
- Navigation components

### Step 3: Verify Installation

```bash
npx expo doctor
```

This checks for common issues. Fix any warnings before proceeding.

---

## 3. Running on iOS

### Option A: Using Expo Go (Easiest - No Mac Required)

1. **Install Expo Go on your iPhone**
   - Open App Store
   - Search for "Expo Go"
   - Install the app

2. **Start the development server**
   ```bash
   cd mobile-app
   npx expo start
   ```

3. **Scan the QR code**
   - Open Camera app on iPhone
   - Point at the QR code in terminal
   - Tap the notification to open in Expo Go

### Option B: Using iOS Simulator (Mac Only)

1. **Open Xcode** (at least once to accept license)

2. **Start with iOS flag**
   ```bash
   cd mobile-app
   npx expo start --ios
   ```

3. **The simulator will automatically launch**

### Option C: Using Development Build (Advanced)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure build**
   ```bash
   eas build:configure
   ```

4. **Create development build**
   ```bash
   eas build --profile development --platform ios
   ```

5. **Install on device via TestFlight**

---

## 4. Running on Android

### Option A: Using Expo Go (Easiest)

1. **Install Expo Go on your Android phone**
   - Open Play Store
   - Search for "Expo Go"
   - Install the app

2. **Start the development server**
   ```bash
   cd mobile-app
   npx expo start
   ```

3. **Scan the QR code**
   - Open Expo Go app
   - Tap "Scan QR code"
   - Point camera at QR code in terminal

### Option B: Using Android Emulator

1. **Open Android Studio**

2. **Create an emulator** (if not already created)
   - Tools → Device Manager
   - Click "Create Virtual Device"
   - Select a device (e.g., Pixel 6)
   - Select system image (API 33 recommended)
   - Finish setup

3. **Start the emulator**
   - Open Device Manager
   - Click play button next to your emulator

4. **Run the app**
   ```bash
   cd mobile-app
   npx expo start --android
   ```

### Option C: Using Physical Android Device

1. **Enable Developer Options**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → System → Developer Options

2. **Enable USB Debugging**
   - In Developer Options, enable "USB Debugging"

3. **Connect via USB**
   ```bash
   adb devices
   # Should show your device
   ```

4. **Run the app**
   ```bash
   cd mobile-app
   npx expo start --android
   ```

---

## 5. Model Setup

### Step 1: Train Models

Complete the Jupyter notebooks in Google Colab:

1. **Train YOLOv8 Segmentation Model**
   - Open `train_cacao_segmentation_yolov8.ipynb` in Colab
   - Follow instructions to train
   - Download `cacao_segmentation_best.pt`

2. **Train MobileNetV3 + SimCLR Model**
   - Open `train_yield_estimation_simclr.ipynb` in Colab
   - Follow instructions to train
   - Download `complete_yield_model.pt`

### Step 2: Convert Models to Mobile Format

```bash
# Convert to ONNX (already done in notebooks)
# Models will be in .onnx format
```

### Step 3: Add Models to App

1. **Create models directory**
   ```bash
   mkdir -p mobile-app/assets/models
   ```

2. **Copy trained models**
   ```bash
   cp /path/to/cacao_segmentation_best.onnx mobile-app/assets/models/
   cp /path/to/yield_ranking_model.onnx mobile-app/assets/models/
   ```

3. **Verify model files**
   ```bash
   ls -lh mobile-app/assets/models/
   # Should show .onnx files
   ```

### Step 4: Configure Model Paths

Edit `mobile-app/constants/Config.ts`:

```typescript
export const Config = {
  SEGMENTATION_MODEL: 'cacao_segmentation_best.onnx',
  YIELD_MODEL: 'yield_ranking_model.onnx',
  INPUT_SIZE: 640,
  CONFIDENCE_THRESHOLD: 0.25,
};
```

---

## 6. Troubleshooting

### Common Issues

#### Issue: "Metro bundler" errors

**Solution:**
```bash
# Clear cache
npx expo start -c

# Or clear everything
rm -rf node_modules
npm install
npx expo start -c
```

#### Issue: Camera not working

**Solution:**
- Check permissions in phone settings
- Restart the app
- Use physical device (simulators have limited camera)

#### Issue: Models not loading

**Solution:**
- Verify model files are in `mobile-app/assets/models/`
- Check file sizes (should be 10-50MB)
- Clear app data and reinstall

#### Issue: "Unable to resolve module"

**Solution:**
```bash
# Install missing dependencies
npm install

# Reset Metro bundler
npx expo start -c
```

#### Issue: Android build fails

**Solution:**
```bash
# Check Java version
java -version
# Should be Java 11 or higher

# Update Android SDK
# Open Android Studio → SDK Manager → Install latest
```

#### Issue: iOS simulator won't start

**Solution:**
```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Restart Xcode
```

### Performance Issues

#### Slow inference on device

**Solutions:**
1. **Use quantized models** (smaller, faster)
2. **Reduce image resolution** in settings
3. **Enable GPU acceleration** in settings
4. **Close other apps** to free memory

#### App crashes

**Solutions:**
1. **Check device memory** (need 2GB+ free)
2. **Update Expo SDK** to latest version
3. **Check console logs** for errors
4. **Reduce batch size** in inference code

---

## 7. Building for Production

### iOS Production Build

1. **Create Apple Developer Account**
   - Sign up at https://developer.apple.com/
   - Cost: $99/year

2. **Configure app.json**
   ```json
   {
     "ios": {
       "bundleIdentifier": "com.yourcompany.cacaoyield",
       "buildNumber": "1.0.0"
     }
   }
   ```

3. **Build for App Store**
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```

### Android Production Build

1. **Create Google Play Developer Account**
   - Sign up at https://play.google.com/console
   - Cost: $25 one-time

2. **Configure app.json**
   ```json
   {
     "android": {
       "package": "com.yourcompany.cacaoyield",
       "versionCode": 1
     }
   }
   ```

3. **Build AAB for Play Store**
   ```bash
   eas build --platform android --profile production
   ```

4. **Submit to Play Store**
   ```bash
   eas submit --platform android
   ```

### Local Builds (Advanced)

#### iOS (Mac only)

```bash
# Generate native project
npx expo prebuild --platform ios

# Open in Xcode
open ios/CacaoYieldEstimator.xcworkspace

# Build in Xcode:
# Product → Archive → Distribute App
```

#### Android

```bash
# Generate native project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 8. Testing Checklist

Before releasing, test:

- [ ] Camera functionality
- [ ] Image picker from gallery
- [ ] Model inference accuracy
- [ ] Results display correctly
- [ ] History saves properly
- [ ] Settings persist
- [ ] Works offline
- [ ] Handles errors gracefully
- [ ] Performance on low-end devices
- [ ] Battery usage is reasonable

---

## 9. Next Steps

After successful setup:

1. **Test with real cacao pods** in field conditions
2. **Collect feedback** from farmers
3. **Fine-tune models** based on feedback
4. **Add localization** for multiple languages
5. **Implement cloud sync** (optional)
6. **Add analytics** to track usage
7. **Create user documentation**

---

## 10. Support

### Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **YOLOv8 Docs**: https://docs.ultralytics.com/
- **Stack Overflow**: Tag questions with `expo`, `react-native`

### Getting Help

1. **Check console logs** for error messages
2. **Search GitHub issues** for similar problems
3. **Ask in Expo Discord**: https://chat.expo.dev/
4. **Post on Stack Overflow** with relevant tags

---

## 🎉 Success!

You should now have a working Cacao Yield Estimator app running on your device!

**Quick Start Commands:**

```bash
# iOS
cd mobile-app && npx expo start --ios

# Android
cd mobile-app && npx expo start --android

# Expo Go
cd mobile-app && npx expo start
```

---

**Made with ❤️ for cacao farmers worldwide**
