import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Asset } from 'expo-asset';

let segmentationSession: InferenceSession | null = null;
let yieldSession: InferenceSession | null = null;

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  class_id: number;
}

interface Detection {
  bbox: number[];
  confidence: number;
  yieldCategory: 'Low' | 'Medium' | 'High';
}

/**
 * Load ONNX models from assets
 */
export async function loadModels(): Promise<void> {
  try {
    // Load segmentation model
    const segmentationAsset = Asset.fromModule(
      require('../assets/models/cacao_segmentation_best.onnx')
    );
    await segmentationAsset.downloadAsync();
    
    if (!segmentationAsset.localUri) {
      throw new Error('Failed to load segmentation model');
    }

    segmentationSession = await InferenceSession.create(
      segmentationAsset.localUri
    );
    console.log('✅ Segmentation model loaded');

    // Load yield ranking model
    const yieldAsset = Asset.fromModule(
      require('../assets/models/yield_ranking_model_a100.onnx')
    );
    await yieldAsset.downloadAsync();
    
    if (!yieldAsset.localUri) {
      throw new Error('Failed to load yield model');
    }

    yieldSession = await InferenceSession.create(yieldAsset.localUri);
    console.log('✅ Yield ranking model loaded');
  } catch (error) {
    console.error('Error loading models:', error);
    throw error;
  }
}

/**
 * Preprocess image for YOLOv8 inference
 */
async function preprocessImageForYOLO(
  imageUri: string
): Promise<{ tensor: Tensor; originalWidth: number; originalHeight: number }> {
  try {
    // Resize image to 640x640 for YOLOv8
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 640, height: 640 } }],
      { format: ImageManipulator.SaveFormat.JPEG }
    );

    // Read the resized image as base64
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: 'base64',
    });

    // Decode base64 to pixel data
    // Note: In a production app, you'd use a proper image decoding library
    // For now, we'll create normalized random data as a placeholder
    // TODO: Implement proper base64 → RGB pixel array decoding
    
    const imageSize = 640;
    const data = new Float32Array(3 * imageSize * imageSize);
    
    // Placeholder: Fill with random normalized values
    // In production, decode base64, extract RGB, normalize to [0,1]
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random(); // Should be: pixel_value / 255.0
    }
    
    const tensor = new Tensor('float32', data, [1, 3, imageSize, imageSize]);
    
    return {
      tensor,
      originalWidth: 640,
      originalHeight: 640,
    };
  } catch (error) {
    console.error('Image preprocessing error:', error);
    throw error;
  }
}

/**
 * Non-maximum suppression to filter overlapping boxes
 */
function nonMaxSuppression(
  boxes: Box[],
  iouThreshold: number = 0.45
): Box[] {
  // Sort by confidence
  const sorted = boxes.sort((a, b) => b.confidence - a.confidence);
  const keep: Box[] = [];

  while (sorted.length > 0) {
    const current = sorted.shift()!;
    keep.push(current);

    const remaining: Box[] = [];
    for (const box of sorted) {
      const iou = calculateIoU(current, box);
      if (iou < iouThreshold) {
        remaining.push(box);
      }
    }
    sorted.length = 0;
    sorted.push(...remaining);
  }

  return keep;
}

/**
 * Calculate Intersection over Union
 */
function calculateIoU(box1: Box, box2: Box): number {
  const x1 = Math.max(box1.x1, box2.x1);
  const y1 = Math.max(box1.y1, box2.y1);
  const x2 = Math.min(box1.x2, box2.x2);
  const y2 = Math.min(box1.y2, box2.y2);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const box1Area = (box1.x2 - box1.x1) * (box1.y2 - box1.y1);
  const box2Area = (box2.x2 - box2.x1) * (box2.y2 - box2.y1);
  const union = box1Area + box2Area - intersection;

  return intersection / union;
}

/**
 * Postprocess YOLOv8 output
 */
function postprocessYOLO(
  output: Tensor,
  originalWidth: number,
  originalHeight: number,
  confThreshold: number = 0.25
): Box[] {
  const data = output.data as Float32Array;
  const boxes: Box[] = [];

  // YOLOv8 output format: [1, 84, 8400]
  // First 4 values are box coordinates (x_center, y_center, width, height)
  // Next 80 values are class probabilities
  
  const numPredictions = 8400;
  const numClasses = 80;

  for (let i = 0; i < numPredictions; i++) {
    // Get box coordinates
    const x_center = data[i];
    const y_center = data[numPredictions + i];
    const width = data[2 * numPredictions + i];
    const height = data[3 * numPredictions + i];

    // Get max class score
    let maxScore = 0;
    let maxClass = 0;
    for (let c = 0; c < numClasses; c++) {
      const score = data[(4 + c) * numPredictions + i];
      if (score > maxScore) {
        maxScore = score;
        maxClass = c;
      }
    }

    // Filter by confidence threshold
    if (maxScore >= confThreshold) {
      const x1 = (x_center - width / 2) * originalWidth / 640;
      const y1 = (y_center - height / 2) * originalHeight / 640;
      const x2 = (x_center + width / 2) * originalWidth / 640;
      const y2 = (y_center + height / 2) * originalHeight / 640;

      boxes.push({
        x1,
        y1,
        x2,
        y2,
        confidence: maxScore,
        class_id: maxClass,
      });
    }
  }

  return nonMaxSuppression(boxes);
}

/**
 * Extract pod features for yield estimation
 */
async function extractPodFeatures(
  imageUri: string,
  bbox: number[]
): Promise<Float32Array> {
  try {
    // Calculate crop dimensions
    const [x1, y1, x2, y2] = bbox;
    const width = x2 - x1;
    const height = y2 - y1;

    // Crop the pod region
    const cropResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX: Math.max(0, x1),
            originY: Math.max(0, y1),
            width: Math.max(1, width),
            height: Math.max(1, height),
          },
        },
        { resize: { width: 224, height: 224 } }, // MobileNetV3 input size
      ],
      { format: ImageManipulator.SaveFormat.JPEG }
    );

    // Read cropped image
    const base64 = await FileSystem.readAsStringAsync(cropResult.uri, {
      encoding: 'base64',
    });

    // Placeholder: In production, decode and normalize with ImageNet stats
    // mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
    const features = new Float32Array(1280); // MobileNetV3 Large output
    for (let i = 0; i < features.length; i++) {
      features[i] = Math.random() * 2 - 1; // [-1, 1] range
    }
    
    return features;
  } catch (error) {
    console.error('Feature extraction error:', error);
    // Return default features on error
    return new Float32Array(1280);
  }
}

/**
 * Estimate yield category for a pod
 */
async function estimateYield(features: Float32Array): Promise<'Low' | 'Medium' | 'High'> {
  if (!yieldSession) {
    throw new Error('Yield model not loaded');
  }

  // Create tensor from features [1, 1280]
  const featureTensor = new Tensor('float32', features, [1, 1280]);

  // Run inference
  const feeds = { input: featureTensor };
  const results = await yieldSession.run(feeds);

  // Get output (logit value)
  const output = results.output.data as Float32Array;
  const score = 1 / (1 + Math.exp(-output[0])); // Sigmoid

  // Convert continuous score to category
  if (score < 0.33) {
    return 'Low';
  } else if (score < 0.67) {
    return 'Medium';
  } else {
    return 'High';
  }
}

/**
 * Main detection function - analyzes image and returns yield estimates
 */
export async function detectAndEstimateYield(
  imageUri: string
): Promise<{ detections: Detection[]; overallYield: 'Low' | 'Medium' | 'High' }> {
  if (!segmentationSession || !yieldSession) {
    throw new Error('Models not loaded. Call loadModels() first.');
  }

  try {
    // Step 1: Detect pods using YOLOv8
    console.log('🔍 Running pod detection...');
    const { tensor, originalWidth, originalHeight } = await preprocessImageForYOLO(
      imageUri
    );

    const feeds = { images: tensor };
    const outputs = await segmentationSession.run(feeds);
    const boxes = postprocessYOLO(
      outputs.output0,
      originalWidth,
      originalHeight
    );

    console.log(`Found ${boxes.length} pods`);

    // Step 2: Estimate yield for each pod
    console.log('📊 Estimating yield for each pod...');
    const detections: Detection[] = [];
    const yieldScores: number[] = [];

    for (const box of boxes) {
      const features = await extractPodFeatures(imageUri, [
        box.x1,
        box.y1,
        box.x2,
        box.y2,
      ]);
      const yieldCategory = await estimateYield(features);

      detections.push({
        bbox: [box.x1, box.y1, box.x2, box.y2],
        confidence: box.confidence,
        yieldCategory,
      });

      // Convert category to score for averaging
      const score = yieldCategory === 'High' ? 2 : yieldCategory === 'Medium' ? 1 : 0;
      yieldScores.push(score);
    }

    // Step 3: Calculate overall yield
    const avgScore =
      yieldScores.reduce((a, b) => a + b, 0) / yieldScores.length;
    const overallYield =
      avgScore >= 1.5 ? 'High' : avgScore >= 0.75 ? 'Medium' : 'Low';

    return { detections, overallYield };
  } catch (error) {
    console.error('Detection error:', error);
    throw error;
  }
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded(): boolean {
  return segmentationSession !== null && yieldSession !== null;
}
