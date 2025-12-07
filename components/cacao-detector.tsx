"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Upload, Leaf, AlertTriangle, Bug, ImageIcon, X, Camera, RefreshCw, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type DiseaseClass = "healthy" | "monilia" | "phytophthora" | null

interface BoundingBox {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface Detection {
  class: DiseaseClass
  confidence: number
  bbox: number[]
}

interface DetectionResult {
  class: DiseaseClass
  confidence: number
  all_detections?: Detection[]
  image_width?: number
  image_height?: number
}

const diseaseInfo = {
  healthy: {
    label: "Healthy",
    icon: Leaf,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    boxColor: "#10b981",
    description: "This cocoa pod appears to be healthy with no signs of disease.",
  },
  monilia: {
    label: "Monilia",
    icon: Bug,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    boxColor: "#f59e0b",
    description:
      "Moniliasis (frosty pod rot) detected. This fungal disease causes pod rot and can significantly reduce yield.",
  },
  phytophthora: {
    label: "Phytophthora",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    boxColor: "#ef4444",
    description:
      "Phytophthora (black pod disease) detected. This is a serious fungal infection that causes pod blackening and decay.",
  },
}

export function CacaoDetector() {
  const [image, setImage] = useState<string | null>(null)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [isCameraMode, setIsCameraMode] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [isLiveDetection, setIsLiveDetection] = useState(false)
  const [fps, setFps] = useState(0)
  const [boundingBoxes, setBoundingBoxes] = useState<Detection[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      processImage(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }

  const processImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      setImage(imageData)
      setOriginalImage(imageData)
      setResult(null)
      setIsCameraMode(false)
    }
    reader.readAsDataURL(file)
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      setStream(mediaStream)
      setIsCameraMode(true)
      setImage(null)
      setResult(null)
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }

  // Effect to attach stream to video element
  useEffect(() => {
    if (stream && videoRef.current && isCameraMode) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err)
      })
    }
  }, [stream, isCameraMode])

  const stopCamera = useCallback(() => {
    // Stop live detection first
    setIsLiveDetection(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    setIsCameraMode(false)
    setResult(null)
    setFps(0)
  }, [stream])

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL("image/jpeg")
        setOriginalImage(imageData)
        setImage(imageData)
        stopCamera()
      }
    }
  }

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [stream])

  const drawBoundingBoxes = (detections: Detection[], canvasElement: HTMLCanvasElement, sourceWidth: number, sourceHeight: number, clearFirst = true) => {
    const ctx = canvasElement.getContext('2d')
    if (!ctx) return

    // Calculate scale factors
    const scaleX = canvasElement.width / sourceWidth
    const scaleY = canvasElement.height / sourceHeight

    // Clear previous boxes
    if (clearFirst) {
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
    }

    // Draw each detection
    detections.forEach((detection) => {
      if (!detection.bbox || detection.bbox.length < 4) return

      const [x1, y1, x2, y2] = detection.bbox
      
      // Scale coordinates to canvas size
      const scaledX1 = x1 * scaleX
      const scaledY1 = y1 * scaleY
      const scaledX2 = x2 * scaleX
      const scaledY2 = y2 * scaleY
      const width = scaledX2 - scaledX1
      const height = scaledY2 - scaledY1

      // Get color based on class
      const color = detection.class ? diseaseInfo[detection.class].boxColor : '#ffffff'

      // Draw bounding box with thicker line for visibility
      ctx.strokeStyle = color
      ctx.lineWidth = 4
      ctx.strokeRect(scaledX1, scaledY1, width, height)

      // Draw filled background for label
      const label = `${detection.class} ${(detection.confidence * 100).toFixed(0)}%`
      ctx.font = 'bold 18px Arial'
      const textMetrics = ctx.measureText(label)
      const textWidth = textMetrics.width
      const textHeight = 24

      ctx.fillStyle = color
      ctx.fillRect(scaledX1, scaledY1 - textHeight - 4, textWidth + 12, textHeight + 4)

      // Draw label text
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, scaledX1 + 6, scaledY1 - 8)
    })
  }

  const captureFrameAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current || !isLiveDetection) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current

    // Get video's actual rendered dimensions
    const videoRect = video.getBoundingClientRect()
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight
    
    if (videoWidth === 0 || videoHeight === 0 || videoRect.width === 0 || videoRect.height === 0) {
      // Video not ready yet, try again
      if (isLiveDetection) {
        animationFrameRef.current = requestAnimationFrame(captureFrameAndDetect)
      }
      return
    }

    // Set processing canvas to video's intrinsic dimensions
    canvas.width = videoWidth
    canvas.height = videoHeight
    
    // Set overlay canvas to match video element's displayed size exactly
    overlayCanvas.width = videoRect.width
    overlayCanvas.height = videoRect.height
    overlayCanvas.style.width = videoRect.width + 'px'
    overlayCanvas.style.height = videoRect.height + 'px'

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw current video frame at full resolution for API
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight)

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return

      try {
        const formData = new FormData()
        formData.append('image', blob, 'frame.jpg')

        const apiResponse = await fetch('http://localhost:5001/api/detect', {
          method: 'POST',
          body: formData,
        })

        if (apiResponse.ok) {
          const data = await apiResponse.json()
          setResult({
            class: data.class as DiseaseClass,
            confidence: data.confidence,
            all_detections: data.all_detections,
            image_width: data.image_width,
            image_height: data.image_height
          })

          // Store bounding boxes for rendering
          if (data.all_detections && data.all_detections.length > 0) {
            setBoundingBoxes(data.all_detections)
          } else {
            setBoundingBoxes([])
          }

          // Calculate FPS
          const now = performance.now()
          if (lastFrameTimeRef.current) {
            const delta = now - lastFrameTimeRef.current
            setFps(Math.round(1000 / delta))
          }
          lastFrameTimeRef.current = now
        }
      } catch (error) {
        console.error('Live detection error:', error)
      }

      // Continue live detection
      if (isLiveDetection) {
        animationFrameRef.current = requestAnimationFrame(captureFrameAndDetect)
      }
    }, 'image/jpeg', 0.8)
  }

  const toggleLiveDetection = () => {
    if (isLiveDetection) {
      // Stop live detection
      setIsLiveDetection(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setBoundingBoxes([])
      setResult(null)
      setFps(0)
    } else {
      // Start live detection
      setIsLiveDetection(true)
      captureFrameAndDetect()
    }
  }

  useEffect(() => {
    if (isLiveDetection) {
      captureFrameAndDetect()
    }
  }, [isLiveDetection])

  const analyzeImage = async () => {
    if (!image) return
    
    setIsAnalyzing(true)
    try {
      // Use original image for analysis
      const imageToAnalyze = originalImage || image
      const response = await fetch(imageToAnalyze)
      const blob = await response.blob()
      
      // Create form data
      const formData = new FormData()
      formData.append('image', blob, 'image.jpg')
      
      // Call the detection API
      const apiResponse = await fetch('http://localhost:5001/api/detect', {
        method: 'POST',
        body: formData,
      })
      
      if (!apiResponse.ok) {
        throw new Error('Detection failed')
      }
      
      const data = await apiResponse.json()
      
      setResult({
        class: data.class as DiseaseClass,
        confidence: data.confidence,
        all_detections: data.all_detections,
        image_width: data.image_width,
        image_height: data.image_height
      })

      // Draw bounding boxes on static image
      if (data.all_detections && data.all_detections.length > 0 && data.image_width && data.image_height && originalImage) {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            // Draw the original image first
            ctx.drawImage(img, 0, 0)
            // Then draw bounding boxes on top (don't clear)
            drawBoundingBoxes(data.all_detections, canvas, data.image_width, data.image_height, false)
            setImage(canvas.toDataURL('image/jpeg'))
          }
        }
        img.src = originalImage
      }
    } catch (error) {
      console.error('Error during detection:', error)
      alert('Failed to analyze image. Make sure the Python API server is running.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearImage = () => {
    setImage(null)
    setOriginalImage(null)
    setResult(null)
    stopCamera()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-700 to-emerald-700 bg-clip-text text-transparent mb-3">
            Cocoa Disease Detector
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            AI-powered detection for Monilia, Phytophthora, and healthy cocoa pods using YOLOv8
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInfo(!showInfo)}
            className="mt-2"
          >
            <Info className="w-4 h-4 mr-2" />
            {showInfo ? "Hide Info" : "About the Model"}
          </Button>
        </div>

        {/* Info Panel */}
        {showInfo && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Dataset</h3>
                  <p className="text-muted-foreground">312 images from Colombia with 1,591 labeled objects</p>
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Model</h3>
                  <p className="text-muted-foreground">YOLOv8 trained on Google Colab with T4 GPU</p>
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Classes</h3>
                  <p className="text-muted-foreground">Healthy, Monilia (frosty pod), Phytophthora (black pod)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disease Classes Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(["healthy", "monilia", "phytophthora"] as const).map((type) => {
            const info = diseaseInfo[type]
            const Icon = info.icon
            return (
              <Card key={type} className={`border-2 ${info.borderColor} hover:shadow-lg transition-shadow`}>
                <CardContent className={`p-4 ${info.bgColor}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/50`}>
                      <Icon className={`w-6 h-6 ${info.color}`} />
                    </div>
                    <div>
                      <span className={`text-base font-semibold ${info.color}`}>{info.label}</span>
                      <p className="text-xs text-muted-foreground mt-1">{info.description.slice(0, 60)}...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload/Camera Area */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Capture Image
              </CardTitle>
              <CardDescription>Upload a photo or use your camera to detect diseases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!image && !isCameraMode ? (
                <>
                  <label
                    className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      isDragging 
                        ? "border-amber-500 bg-amber-50 scale-105" 
                        : "border-border hover:border-amber-400 hover:bg-amber-50/50"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 mb-4 text-amber-500" />
                      <p className="mb-2 text-sm text-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max 10MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                  </label>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button
                    onClick={startCamera}
                    variant="outline"
                    className="w-full h-12 border-2 border-amber-500 text-amber-700 hover:bg-amber-50"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Use Camera
                  </Button>
                </>
              ) : isCameraMode ? (
                <div className="space-y-4">
                  <div className="relative w-full h-96 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
                    />
                    {/* SVG overlay for bounding boxes */}
                    {isLiveDetection && result && boundingBoxes.length > 0 && result.image_width && result.image_height && videoRef.current && (
                      <svg
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: videoRef.current.getBoundingClientRect().width,
                          height: videoRef.current.getBoundingClientRect().height,
                          pointerEvents: 'none',
                        }}
                      >
                        {boundingBoxes.map((detection, index) => {
                          if (!detection.bbox || detection.bbox.length < 4 || !videoRef.current) return null
                          
                          const videoRect = videoRef.current.getBoundingClientRect()
                          const scaleX = videoRect.width / (result.image_width || 1)
                          const scaleY = videoRect.height / (result.image_height || 1)
                          
                          const [x1, y1, x2, y2] = detection.bbox
                          const x = x1 * scaleX
                          const y = y1 * scaleY
                          const width = (x2 - x1) * scaleX
                          const height = (y2 - y1) * scaleY
                          
                          const color = detection.class ? diseaseInfo[detection.class].boxColor : '#ffffff'
                          const label = `${detection.class} ${(detection.confidence * 100).toFixed(0)}%`
                          
                          return (
                            <g key={index}>
                              <rect
                                x={x}
                                y={y}
                                width={width}
                                height={height}
                                fill="none"
                                stroke={color}
                                strokeWidth="4"
                              />
                              <rect
                                x={x}
                                y={y - 28}
                                width={label.length * 10 + 16}
                                height="28"
                                fill={color}
                              />
                              <text
                                x={x + 8}
                                y={y - 8}
                                fill="white"
                                fontSize="16"
                                fontWeight="bold"
                                fontFamily="Arial"
                              >
                                {label}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    )}
                    <canvas 
                      ref={overlayCanvasRef}
                      style={{ display: 'none' }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    
                    {/* Live Detection Overlay */}
                    {isLiveDetection && result && (
                      <div className="absolute top-2 left-2 right-2 bg-black/75 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {result.class && (() => {
                              const info = diseaseInfo[result.class]
                              const Icon = info.icon
                              return (
                                <>
                                  <Icon className={`w-5 h-5 ${info.color}`} />
                                  <span className="text-white font-semibold">{info.label}</span>
                                </>
                              )
                            })()}
                          </div>
                          <div className="text-right">
                            <div className="text-white text-sm font-medium">
                              {(result.confidence * 100).toFixed(1)}%
                            </div>
                            <div className="text-white/60 text-xs">{fps} FPS</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={toggleLiveDetection}
                      className={`flex-1 ${
                        isLiveDetection 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isLiveDetection ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Stop Live Detection
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Start Live Detection
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      variant="outline"
                      disabled={isLiveDetection}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted shadow-inner">
                    <img
                      src={image || "/placeholder.svg"}
                      alt="Uploaded cocoa pod"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    {!result && (
                      <Button
                        onClick={analyzeImage}
                        disabled={isAnalyzing}
                        className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Analyze Image
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={clearImage}
                    >
                      {result ? <RefreshCw className="w-4 h-4 mr-2" /> : <X className="w-4 h-4" />}
                      {result ? "New Analysis" : ""}
                    </Button>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>

          {/* Results Area */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Detection Results
              </CardTitle>
              <CardDescription>AI analysis will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {result && result.all_detections && result.all_detections.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary header */}
                  <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-1">
                      {result.all_detections.length === 1 
                        ? '1 Detection Found' 
                        : `${result.all_detections.length} Detections Found`}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Analyzed image and found {result.all_detections.length} cocoa pod{result.all_detections.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* All detections list */}
                  <div className="space-y-2">
                    {result.all_detections
                      .sort((a, b) => b.confidence - a.confidence)
                      .map((detection, index) => {
                        const detectionInfo = detection.class ? diseaseInfo[detection.class] : null
                        if (!detectionInfo) return null
                        const Icon = detectionInfo.icon
                        return (
                          <div 
                            key={index}
                            className={`p-4 rounded-lg border-2 ${detectionInfo.borderColor} ${detectionInfo.bgColor}`}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div className="p-2 bg-white rounded-full shadow-sm">
                                <Icon className={`w-6 h-6 ${detectionInfo.color}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className={`font-bold text-lg ${detectionInfo.color}`}>
                                    {detectionInfo.label}
                                  </h4>
                                  <span className="text-sm font-semibold text-muted-foreground">
                                    {(detection.confidence * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full bg-white/50 rounded-full h-2 mb-2">
                                  <div
                                    className={`h-2 rounded-full transition-all`}
                                    style={{ 
                                      width: `${detection.confidence * 100}%`,
                                      backgroundColor: detectionInfo.boxColor
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {detectionInfo.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  {/* Recommended actions if any diseased pods found */}
                  {result.all_detections.some(d => d.class !== "healthy") && (
                    <div className="bg-white/50 p-4 rounded-lg border border-white">
                      <h4 className="font-semibold text-sm mb-2">Recommended Actions:</h4>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>• Remove and destroy infected pods</li>
                        <li>• Apply appropriate fungicides</li>
                        <li>• Improve ventilation and drainage</li>
                        <li>• Monitor nearby plants regularly</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {isAnalyzing ? "Analyzing your image..." : "Upload or capture an image to start detection"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground space-y-2">
          <p className="flex items-center justify-center gap-2">
            <Leaf className="w-4 h-4 text-amber-600" />
            Powered by YOLOv8 Neural Network
          </p>
          <p>Dataset: Cocoa Diseases (Colombia) • 312 images • 1,591 annotations • 3 disease classes</p>
          <p className="text-xs">For research and educational purposes. Consult agricultural experts for treatment.</p>
        </footer>
      </div>
    </div>
  )
}
