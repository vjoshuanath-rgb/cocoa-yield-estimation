# 📱 Cacao Yield Estimation Mobile App

Quick guide to run the mobile app for cacao pod yield detection.

---

## 📋 Prerequisites

- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Phone and computer on **same WiFi network**

---

## 🚀 Installation

```bash
cd mobile-app
npm install
```

---

## 🏃 Step-by-Step: Running the App

### Step 1: Get Your Computer's IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for: `inet 192.168.1.X`

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address"

**Your IP:** Write down `192.168.1.X` (example: `192.168.1.6`)

---

### Step 2: Update Mobile App IP Address

Edit `services/apiService.ts` line 20:
```typescript
const API_BASE_URL = 'http://192.168.1.6:5001';  // ← Change to YOUR IP
```

Save the file.

---

### Step 3: Start Backend Server

Open Terminal 1:
```bash
cd /Users/wedemeyer/cocoa-disease-detection
python3 api/yield_detect.py
```

Wait for:
```
✅ Segmentation model loaded
✅ Encoder loaded from checkpoint
🚀 Starting Yield Estimation API on port 5001
```

**Leave this terminal running!**

---

### Step 4: Start Mobile App

Open Terminal 2:
```bash
cd /Users/wedemeyer/cocoa-disease-detection/mobile-app
npm start
```

You'll see a QR code.

---

### Step 5: Connect Your Phone

**Requirements:**
- Phone on **same WiFi** as computer
- **Expo Go** app installed

**iPhone:**
1. Open Camera app
2. Point at QR code
3. Tap notification → Opens in Expo Go

**Android:**
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Point at QR code

**OR type URL manually:** `exp://192.168.1.X:8081` (your computer's IP)

---

### Step 6: Test the App

1. App loads on phone
2. Tap **"Take Photo"** or **"Choose from Gallery"**
3. Select/take image of cacao pods
4. Wait for AI analysis
5. See results with yield scores!

---

## 🔄 Running on Multiple Devices

All devices scan the **same QR code**. Each connects independently to the backend.

---

## 🛠️ Troubleshooting

**"Unable to resolve host"**
- Phone and computer on same WiFi? ✓
- IP in `apiService.ts` correct? ✓
- Try: `http://192.168.1.X:5001/api/health` in phone browser

**"Overall yield score: undefined"**
- Restart backend (Ctrl+C, run `python3 api/yield_detect.py` again)
- Reload app (press `r` in Expo terminal)

**Can't scan QR code?**
- Press `t` in Expo terminal for tunnel mode (works on any network, slower)

---

## 🔧 Quick Reload After Code Changes

- Shake phone → Tap "Reload"
- OR press `r` in Expo terminal
