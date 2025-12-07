"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, Leaf, AlertTriangle, Bug, ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type DiseaseClass = "healthy" | "monilia" | "phytophthora" | null

interface DetectionResult {
  class: DiseaseClass
  confidence: number
}

const diseaseInfo = {
  healthy: {
    label: "Healthy",
    icon: Leaf,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    description: "This cocoa pod appears to be healthy with no signs of disease.",
  },
  monilia: {
    label: "Monilia",
    icon: Bug,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    description:
      "Moniliasis (frosty pod rot) detected. This fungal disease causes pod rot and can significantly reduce yield.",
  },
  phytophthora: {
    label: "Phytophthora",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    description:
      "Phytophthora (black pod disease) detected. This is a serious fungal infection that causes pod blackening and decay.",
  },
}

export function CacaoDetector() {
  const [image, setImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)

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
      setImage(e.target?.result as string)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  const analyzeImage = async () => {
    setIsAnalyzing(true)
    // Simulating ML model inference - replace with actual model API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock result - in production, this would come from your ML model
    const classes: DiseaseClass[] = ["healthy", "monilia", "phytophthora"]
    const randomClass = classes[Math.floor(Math.random() * classes.length)]
    const confidence = 0.7 + Math.random() * 0.25

    setResult({
      class: randomClass,
      confidence,
    })
    setIsAnalyzing(false)
  }

  const clearImage = () => {
    setImage(null)
    setResult(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-amber-100 rounded-full">
            <Leaf className="w-8 h-8 text-amber-700" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Cacao Disease Detector</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Upload an image of a cocoa pod to detect Monilia, Phytophthora, or verify it&apos;s healthy using machine
          learning.
        </p>
      </div>

      {/* Disease Classes Info */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {(["healthy", "monilia", "phytophthora"] as const).map((type) => {
          const info = diseaseInfo[type]
          const Icon = info.icon
          return (
            <div key={type} className={`p-3 rounded-lg border ${info.bgColor} ${info.borderColor}`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${info.color}`} />
                <span className={`text-sm font-medium ${info.color}`}>{info.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Upload Image</CardTitle>
          <CardDescription>Drag and drop or click to select a cocoa pod image</CardDescription>
        </CardHeader>
        <CardContent>
          {!image ? (
            <label
              className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragging ? "border-amber-500 bg-amber-50" : "border-border hover:border-amber-400 hover:bg-muted/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG or JPEG</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
            </label>
          ) : (
            <div className="relative">
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                <img
                  src={image || "/placeholder.svg"}
                  alt="Uploaded cocoa pod"
                  className="w-full h-full object-contain"
                />
              </div>
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearImage}
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analyze Button */}
      {image && !result && (
        <div className="flex justify-center mb-6">
          <Button
            onClick={analyzeImage}
            disabled={isAnalyzing}
            size="lg"
            className="bg-amber-600 hover:bg-amber-700 text-white"
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
        </div>
      )}

      {/* Results */}
      {result && result.class && (
        <Card className={`${diseaseInfo[result.class].borderColor} border-2`}>
          <CardHeader className={diseaseInfo[result.class].bgColor}>
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = diseaseInfo[result.class].icon
                return <Icon className={`w-6 h-6 ${diseaseInfo[result.class].color}`} />
              })()}
              <div>
                <CardTitle className={diseaseInfo[result.class].color}>
                  {diseaseInfo[result.class].label} Detected
                </CardTitle>
                <CardDescription>Confidence: {(result.confidence * 100).toFixed(1)}%</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-muted-foreground">{diseaseInfo[result.class].description}</p>
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    result.class === "healthy"
                      ? "bg-emerald-500"
                      : result.class === "monilia"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>
            <Button variant="outline" onClick={clearImage} className="mt-4 bg-transparent">
              Analyze Another Image
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Based on the Cocoa Diseases (YOLOv4) dataset from Colombia</p>
        <p className="mt-1">312 images · 3 classes · Monilia, Phytophthora & Healthy</p>
      </footer>
    </div>
  )
}
