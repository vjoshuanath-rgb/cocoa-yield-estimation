#!/bin/bash
# Download model file if it doesn't exist or is corrupted

MODEL_PATH="public/models/best.pt"
MODEL_URL="https://github.com/vjoshuanath-rgb/cocoa-disease-detection/releases/download/v1.0/best.pt"

# Create directory if it doesn't exist
mkdir -p public/models

# Check if model exists and has reasonable size
if [ -f "$MODEL_PATH" ]; then
    SIZE=$(stat -f%z "$MODEL_PATH" 2>/dev/null || stat -c%s "$MODEL_PATH" 2>/dev/null)
    if [ "$SIZE" -gt 1000000 ]; then
        echo "Model file exists and appears valid (${SIZE} bytes)"
        exit 0
    fi
    echo "Model file appears corrupted (only ${SIZE} bytes), redownloading..."
    rm "$MODEL_PATH"
fi

# Download from GitHub release or use the committed file
echo "Model file not found, checking repository..."
if [ ! -f "$MODEL_PATH" ]; then
    echo "ERROR: Model file missing from repository!"
    echo "Please upload best.pt to GitHub Releases or ensure it's committed"
    exit 1
fi
