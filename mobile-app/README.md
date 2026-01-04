# Cacao Yield Estimator Mobile App

A React Native Expo mobile application for estimating cacao pod yield potential using AI.

## 📱 Features

- **Real-time Camera Detection**: Point your camera at cacao pods for instant yield estimation
- **Photo Upload**: Analyze photos from your gallery
- **Yield Categories**: Get pods classified as Low, Medium, or High yield potential
- **Offline Support**: Run AI models directly on device (no internet required)
- **Multi-pod Detection**: Analyze multiple pods in a single image
- **Farm Management**: Track and save your pod assessments

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Physical device for best performance (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cocoa-disease-detection
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Install Expo CLI globally** (if not already installed)
   ```bash
   npm install -g expo-cli
   ```

4. **Download trained models**
   - Place `cacao_segmentation_best.pt` in `mobile-app/assets/models/`
   - Place `complete_yield_model.pt` in `mobile-app/assets/models/`
   
   Models can be downloaded from the training notebooks or your Google Drive after training.

### Running the App

#### Option 1: Expo Go (Quickest)

1. **Start the development server**
   ```bash
   cd mobile-app
   npx expo start
   ```

2. **Scan the QR code**
   - iOS: Use Camera app to scan QR code
   - Android: Use Expo Go app to scan QR code

3. **Install Expo Go**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

#### Option 2: iOS Simulator (Mac only)

```bash
cd mobile-app
npx expo start --ios
```

#### Option 3: Android Emulator

```bash
cd mobile-app
npx expo start --android
```

## 📦 Building for Production

### iOS (requires Mac)

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

4. **Build for iOS**
   ```bash
   eas build --platform ios
   ```

### Android

1. **Build APK**
   ```bash
   eas build --platform android --profile preview
   ```

2. **Build AAB for Play Store**
   ```bash
   eas build --platform android --profile production
   ```

## 🏗️ Project Structure

```
mobile-app/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home/Camera screen
│   │   ├── history.tsx    # Assessment history
│   │   └── settings.tsx   # App settings
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 screen
├── components/            # Reusable components
│   ├── Camera.tsx         # Camera component
│   ├── YieldDetector.tsx  # Yield detection logic
│   └── ResultCard.tsx     # Results display
├── services/              # Business logic
│   ├── model.ts           # AI model inference
│   └── storage.ts         # Local storage
├── assets/                # Static assets
│   ├── models/            # AI models
│   └── images/            # Images
├── constants/             # App constants
│   ├── Colors.ts          # Theme colors
│   └── Config.ts          # App configuration
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 🔧 Development

### Environment Variables

Create a `.env` file in the `mobile-app/` directory:

```env
EXPO_PUBLIC_API_URL=http://your-api-url.com
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

### Debug Mode

Enable debug mode in the app settings to see:
- Inference time
- Confidence scores
- Model version
- Device info

## 📚 Model Information

### YOLOv8 Segmentation
- **Purpose**: Detect and segment cacao pods from images
- **Input**: RGB images (any size, resized to 640x640)
- **Output**: Pod masks and bounding boxes

### MobileNetV3 + SimCLR
- **Purpose**: Extract pod features for yield estimation
- **Training**: Self-supervised learning (no labels required)
- **Output**: Feature vectors (1280 dimensions)

### Siamese Ranking Network
- **Purpose**: Compare pods and predict relative yield
- **Output**: Yield category (Low/Medium/High)

## 🎯 Performance Optimization

- **Model Quantization**: Models are quantized for mobile devices
- **Lazy Loading**: Models loaded only when needed
- **Image Preprocessing**: Optimized for mobile cameras
- **Batch Processing**: Multiple pods processed efficiently

## 🐛 Troubleshooting

### App crashes on startup
- Check that model files are in `assets/models/`
- Verify model file sizes (should be < 50MB each)
- Clear Expo cache: `npx expo start -c`

### Camera not working
- Check permissions in app settings
- Restart the app
- Try on a physical device (simulators have limited camera support)

### Slow inference
- Use a physical device instead of simulator
- Reduce image resolution in settings
- Enable GPU acceleration if available

### "Metro bundler" errors
- Clear cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (18+ required)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Email: support@cacaoyield.app
- Documentation: [Wiki](https://github.com/your-repo/wiki)

## 🎓 Citations

If you use this system in research, please cite:

```bibtex
@software{cacao_yield_estimator,
  title={Cacao Pod Yield Estimation using Self-Supervised Learning},
  author={Your Name},
  year={2026},
  url={https://github.com/your-repo}
}
```

## 🙏 Acknowledgments

- YOLOv8 by Ultralytics
- MobileNetV3 architecture
- SimCLR self-supervised learning framework
- Roboflow for dataset hosting
- Expo team for mobile framework
