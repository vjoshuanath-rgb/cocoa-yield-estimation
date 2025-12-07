"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import {
  Upload,
  Leaf,
  AlertTriangle,
  Bug,
  ImageIcon,
  X,
  Camera,
  RefreshCw,
  Info,
  Zap,
  Shield,
  ChevronDown,
  Scan,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type DiseaseClass = "healthy" | "monilia" | "phytophthora" | null

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
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    boxColor: "#059669",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-emerald-600",
    description: "This cocoa pod appears healthy with no visible signs of disease. Continue regular monitoring.",
  },
  monilia: {
    label: "Monilia",
    icon: Bug,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    boxColor: "#d97706",
    gradientFrom: "from-amber-500",
    gradientTo: "to-amber-600",
    description: "Moniliasis (frosty pod rot) detected. This fungal disease causes white spore masses and pod rot.",
  },
  phytophthora: {
    label: "Phytophthora",
    icon: AlertTriangle,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    boxColor: "#dc2626",
    gradientFrom: "from-red-500",
    gradientTo: "to-red-600",
    description: "Phytophthora (black pod disease) detected. A serious infection causing progressive pod blackening.",
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
          height: { ideal: 720 },
        },
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

  useEffect(() => {
    if (stream && videoRef.current && isCameraMode) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch((err) => {
        console.error("Error playing video:", err)
      })
    }
  }, [stream, isCameraMode])

  const stopCamera = useCallback(() => {
    setIsLiveDetection(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
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
        stream.getTracks().forEach((track) => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [stream])

  const drawBoundingBoxes = (
    detections: Detection[],
    canvasElement: HTMLCanvasElement,
    sourceWidth: number,
    sourceHeight: number,
    clearFirst = true,
  ) => {
    const ctx = canvasElement.getContext("2d")
    if (!ctx) return

    const scaleX = canvasElement.width / sourceWidth
    const scaleY = canvasElement.height / sourceHeight

    if (clearFirst) {
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
    }

    detections.forEach((detection) => {
      if (!detection.bbox || detection.bbox.length < 4) return

      const [x1, y1, x2, y2] = detection.bbox

      const scaledX1 = x1 * scaleX
      const scaledY1 = y1 * scaleY
      const scaledX2 = x2 * scaleX
      const scaledY2 = y2 * scaleY
      const width = scaledX2 - scaledX1
      const height = scaledY2 - scaledY1

      const color = detection.class ? diseaseInfo[detection.class].boxColor : "#ffffff"

      ctx.strokeStyle = color
      ctx.lineWidth = 4
      ctx.strokeRect(scaledX1, scaledY1, width, height)

      const label = `${detection.class} ${(detection.confidence * 100).toFixed(0)}%`
      ctx.font = "bold 18px Arial"
      const textMetrics = ctx.measureText(label)
      const textWidth = textMetrics.width
      const textHeight = 24

      ctx.fillStyle = color
      ctx.fillRect(scaledX1, scaledY1 - textHeight - 4, textWidth + 12, textHeight + 4)

      ctx.fillStyle = "#ffffff"
      ctx.fillText(label, scaledX1 + 6, scaledY1 - 8)
    })
  }

  const captureFrameAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current || !isLiveDetection) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current

    const videoRect = video.getBoundingClientRect()
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    if (videoWidth === 0 || videoHeight === 0 || videoRect.width === 0 || videoRect.height === 0) {
      if (isLiveDetection) {
        animationFrameRef.current = requestAnimationFrame(captureFrameAndDetect)
      }
      return
    }

    canvas.width = videoWidth
    canvas.height = videoHeight

    overlayCanvas.width = videoRect.width
    overlayCanvas.height = videoRect.height
    overlayCanvas.style.width = videoRect.width + "px"
    overlayCanvas.style.height = videoRect.height + "px"

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, videoWidth, videoHeight)

    canvas.toBlob(
      async (blob) => {
        if (!blob) return

        try {
          const formData = new FormData()
          formData.append("image", blob, "frame.jpg")

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        const apiResponse = await fetch(`${apiUrl}/api/detect`, {
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
              image_height: data.image_height,
            })

            if (data.all_detections && data.all_detections.length > 0) {
              setBoundingBoxes(data.all_detections)
            } else {
              setBoundingBoxes([])
            }

            const now = performance.now()
            if (lastFrameTimeRef.current) {
              const delta = now - lastFrameTimeRef.current
              setFps(Math.round(1000 / delta))
            }
            lastFrameTimeRef.current = now
          }
        } catch (error) {
          console.error("Live detection error:", error)
        }

        if (isLiveDetection) {
          animationFrameRef.current = requestAnimationFrame(captureFrameAndDetect)
        }
      },
      "image/jpeg",
      0.8,
    )
  }

  const toggleLiveDetection = () => {
    if (isLiveDetection) {
      setIsLiveDetection(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setBoundingBoxes([])
      setResult(null)
      setFps(0)
    } else {
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
      const imageToAnalyze = originalImage || image
      const response = await fetch(imageToAnalyze)
      const blob = await response.blob()

      const formData = new FormData()
      formData.append('image', blob, 'image.jpg')
      
      // Call the detection API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const apiResponse = await fetch(`${apiUrl}/api/detect`, {
        method: 'POST',
        body: formData,
      })

      if (!apiResponse.ok) {
        throw new Error("Detection failed")
      }

      const data = await apiResponse.json()

      setResult({
        class: data.class as DiseaseClass,
        confidence: data.confidence,
        all_detections: data.all_detections,
        image_width: data.image_width,
        image_height: data.image_height,
      })

      if (
        data.all_detections &&
        data.all_detections.length > 0 &&
        data.image_width &&
        data.image_height &&
        originalImage
      ) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            drawBoundingBoxes(data.all_detections, canvas, data.image_width, data.image_height, false)
            setImage(canvas.toDataURL("image/jpeg"))
          }
        }
        img.src = originalImage
      }
    } catch (error) {
      console.error("Error during detection:", error)
      alert("Failed to analyze image. Make sure the Python API server is running.")
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
    <div className="min-h-screen bg-background organic-pattern">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-8 md:py-12 relative">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Logo Mark */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full animate-pulse-slow" />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Leaf className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-3 text-balance">
              Cacao Disease Detection
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              AI-powered analysis for early detection of Monilia, Phytophthora, and healthy cocoa pods
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-border w-full">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm text-muted-foreground">YOLOv8 Neural Network</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm text-muted-foreground">312 Training Images</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm text-muted-foreground">3 Disease Classes</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Model Info Accordion */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full mb-8 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-accent" />
            <span className="font-medium text-foreground">About the Detection Model</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform ${showInfo ? "rotate-180" : ""}`}
          />
        </button>

        {showInfo && (
          <div className="mb-8 p-6 rounded-xl border border-border bg-card animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Training Dataset</h3>
                  <p className="text-sm text-muted-foreground">
                    312 high-resolution images from Colombian cacao farms with 1,591 annotated disease instances
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Model Architecture</h3>
                  <p className="text-sm text-muted-foreground">
                    YOLOv8 object detection trained on Google Colab with T4 GPU acceleration
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Detection Classes</h3>
                  <p className="text-sm text-muted-foreground">
                    Healthy pods, Monilia (frosty pod rot), and Phytophthora (black pod disease)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disease Classes Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(["healthy", "monilia", "phytophthora"] as const).map((type) => {
            const info = diseaseInfo[type]
            const Icon = info.icon
            const isActive = result?.class === type || result?.all_detections?.some((d) => d.class === type)
            return (
              <div
                key={type}
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 ${
                  isActive
                    ? `${info.borderColor} ${info.bgColor} shadow-lg scale-[1.02]`
                    : "border-border bg-card hover:border-border hover:shadow-md"
                }`}
              >
                {isActive && (
                  <div
                    className={`absolute top-3 right-3 w-2 h-2 rounded-full ${info.boxColor === "#059669" ? "bg-emerald-500" : info.boxColor === "#d97706" ? "bg-amber-500" : "bg-red-500"} animate-pulse`}
                  />
                )}
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 p-3 rounded-xl ${isActive ? "bg-card shadow-sm" : "bg-secondary"}`}>
                    <Icon className={`w-6 h-6 ${info.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold mb-1 ${info.color}`}>{info.label}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{info.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload/Camera Panel */}
          <Card className="border-border shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ImageIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Image Input</CardTitle>
                  <CardDescription>Upload a photo or use live camera detection</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!image && !isCameraMode ? (
                <div className="space-y-4">
                  <label
                    className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? "border-accent bg-accent/5 scale-[0.99]"
                        : "border-border hover:border-accent/50 hover:bg-secondary/30"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div
                        className={`p-4 rounded-2xl mb-4 transition-colors ${isDragging ? "bg-accent/10" : "bg-secondary"}`}
                      >
                        <Upload className={`w-10 h-10 ${isDragging ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                      <p className="text-base font-medium text-foreground mb-1">Drop your image here</p>
                      <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                      <span className="px-3 py-1 rounded-full bg-secondary text-xs text-muted-foreground">
                        PNG, JPG up to 10MB
                      </span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                  </label>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-border" />
                    <span className="mx-4 text-xs text-muted-foreground uppercase tracking-wider">or</span>
                    <div className="flex-grow border-t border-border" />
                  </div>

                  <Button
                    onClick={startCamera}
                    variant="outline"
                    className="w-full h-14 border-2 border-dashed border-accent/50 text-accent hover:bg-accent/5 hover:border-accent bg-transparent"
                  >
                    <Camera className="w-5 h-5 mr-3" />
                    Open Camera for Live Detection
                  </Button>
                </div>
              ) : isCameraMode ? (
                <div className="space-y-4">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-foreground/5 ring-1 ring-border">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                    {/* Live Detection Bounding Boxes SVG Overlay */}
                    {isLiveDetection &&
                      result &&
                      boundingBoxes.length > 0 &&
                      result.image_width &&
                      result.image_height &&
                      videoRef.current && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          {boundingBoxes.map((detection, index) => {
                            if (
                              !detection.bbox ||
                              detection.bbox.length < 4 ||
                              !videoRef.current ||
                              !result.image_width ||
                              !result.image_height
                            )
                              return null

                            const videoRect = videoRef.current.getBoundingClientRect()
                            const scaleX = videoRect.width / result.image_width
                            const scaleY = videoRect.height / result.image_height

                            const [x1, y1, x2, y2] = detection.bbox
                            const x = x1 * scaleX
                            const y = y1 * scaleY
                            const width = (x2 - x1) * scaleX
                            const height = (y2 - y1) * scaleY

                            const color = detection.class ? diseaseInfo[detection.class].boxColor : "#ffffff"
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
                                  strokeWidth="3"
                                  rx="4"
                                />
                                <rect x={x} y={y - 26} width={label.length * 9 + 16} height="24" fill={color} rx="4" />
                                <text
                                  x={x + 8}
                                  y={y - 8}
                                  fill="white"
                                  fontSize="13"
                                  fontWeight="600"
                                  fontFamily="system-ui"
                                >
                                  {label}
                                </text>
                              </g>
                            )
                          })}
                        </svg>
                      )}

                    <canvas ref={overlayCanvasRef} className="hidden" />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Live Detection Status Overlay */}
                    {isLiveDetection && (
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/90 backdrop-blur-sm">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs font-medium text-primary-foreground">LIVE</span>
                        </div>
                        {result && (
                          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-foreground/90 backdrop-blur-sm">
                            {result.class &&
                              (() => {
                                const info = diseaseInfo[result.class]
                                return (
                                  <span className="text-xs font-semibold text-primary-foreground">
                                    {info.label}: {(result.confidence * 100).toFixed(0)}%
                                  </span>
                                )
                              })()}
                            <span className="text-xs text-primary-foreground/70">{fps} FPS</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={toggleLiveDetection}
                      className={`flex-1 h-12 font-medium ${
                        isLiveDetection
                          ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          : "bg-accent hover:bg-accent/90 text-accent-foreground"
                      }`}
                    >
                      {isLiveDetection ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Stop Detection
                        </>
                      ) : (
                        <>
                          <Scan className="w-4 h-4 mr-2" />
                          Start Live Detection
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      variant="outline"
                      disabled={isLiveDetection}
                      className="h-12 px-6 bg-transparent"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture
                    </Button>
                    <Button onClick={stopCamera} variant="outline" className="h-12 bg-transparent">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-secondary ring-1 ring-border">
                    <img
                      src={image || "/placeholder.svg"}
                      alt="Uploaded cocoa pod"
                      className="w-full h-full object-contain"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 border-3 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm font-medium text-primary-foreground">Analyzing image...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {!result && (
                      <Button
                        onClick={analyzeImage}
                        disabled={isAnalyzing}
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Scan className="w-4 h-4 mr-2" />
                            Analyze Image
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="outline" onClick={clearImage} className="h-12 bg-transparent">
                      {result ? <RefreshCw className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
                      {result ? "New Analysis" : "Clear"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="border-border shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Bug className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Detection Results</CardTitle>
                  <CardDescription>AI analysis and recommendations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {result && result.all_detections && result.all_detections.length > 0 ? (
                <div className="space-y-5">
                  {/* Summary Card */}
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">
                        {result.all_detections.length === 1
                          ? "1 Detection"
                          : `${result.all_detections.length} Detections`}
                      </h3>
                      <span className="px-2 py-1 rounded-md bg-accent/20 text-xs font-medium text-accent">
                        Analysis Complete
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Found {result.all_detections.length} cocoa pod{result.all_detections.length > 1 ? "s" : ""} in the
                      image
                    </p>
                  </div>

                  {/* Detection List */}
                  <div className="space-y-3">
                    {result.all_detections
                      .sort((a, b) => b.confidence - a.confidence)
                      .map((detection, index) => {
                        const detectionInfo = detection.class ? diseaseInfo[detection.class] : null
                        if (!detectionInfo) return null
                        const Icon = detectionInfo.icon
                        return (
                          <div
                            key={index}
                            className={`p-4 rounded-xl border-2 ${detectionInfo.borderColor} ${detectionInfo.bgColor} transition-all hover:shadow-md`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-card rounded-xl shadow-sm">
                                <Icon className={`w-6 h-6 ${detectionInfo.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className={`font-semibold ${detectionInfo.color}`}>{detectionInfo.label}</h4>
                                  <span className={`text-sm font-bold ${detectionInfo.color}`}>
                                    {(detection.confidence * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-card overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${detection.confidence * 100}%`,
                                      backgroundColor: detectionInfo.boxColor,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  {/* Recommendations */}
                  {result.all_detections.some((d) => d.class !== "healthy") && (
                    <div className="p-4 rounded-xl bg-secondary border border-border">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-accent" />
                        Recommended Actions
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                          Remove and safely dispose of infected pods
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                          Apply recommended fungicide treatment
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                          Improve air circulation and drainage
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                          Monitor surrounding plants closely
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                  <div className="p-5 rounded-2xl bg-secondary mb-5">
                    <Scan className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">No Analysis Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {isAnalyzing
                      ? "Processing your image with the AI model..."
                      : "Upload an image or use camera detection to analyze cocoa pods for diseases"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-accent" />
              <span>Powered by YOLOv8 Neural Network</span>
            </div>
            <p>Colombian Cocoa Dataset • 312 images • 1,591 annotations</p>
            <p className="text-xs">For research purposes. Consult experts for treatment.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
