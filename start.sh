#!/bin/bash

echo "🍫 Starting Cocoa Disease Detection System"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run ./setup.sh first"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $API_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Python API server
echo "🐍 Starting Python API server on port 5001..."
source venv/bin/activate
python3 api/detect.py &
API_PID=$!

# Wait for API to start
sleep 3

# Start Next.js dev server
echo "⚛️  Starting Next.js dev server on port 3000..."
npm run dev &
WEB_PID=$!

echo ""
echo "✅ Both servers are running!"
echo ""
echo "📱 Open http://localhost:3000 in your browser"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
wait
