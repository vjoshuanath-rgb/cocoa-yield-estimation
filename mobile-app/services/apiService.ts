/**
 * API Service - Communicates with backend for model inference
 * This is a simpler alternative to local ONNX inference
 */

interface Detection {
  bbox: number[];
  confidence: number;
  yieldCategory: 'Low' | 'Medium' | 'High';
  yieldScore: number;
}

interface DetectionResult {
  detections: Detection[];
  overallYield: 'Low' | 'Medium' | 'High';
  overallYieldScore?: number;
}

// Set your backend API URL here
// IMPORTANT: When using Expo, DO NOT use 'localhost'!
// Use your computer's actual IP address on the local network
const API_BASE_URL = 'http://192.168.1.6:5001';

let isInitialized = false;
let useMockData = false;

/**
 * Initialize the API service (check backend availability)
 */
export async function loadModels(): Promise<void> {
  try {
    console.log(`🔌 Connecting to backend at ${API_BASE_URL}...`);
    
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout for faster failure
    });

    if (!response.ok) {
      throw new Error('Backend returned error status');
    }

    const data = await response.json();
    console.log('✅ Backend connected:', data);
    
    isInitialized = true;
    useMockData = false;
  } catch (error) {
    console.warn('⚠️ Backend not available, using mock data mode');
    console.warn('Error:', error);
    
    // Instead of failing, use mock data mode
    isInitialized = true;
    useMockData = true;
    
    // Show helpful message
    console.log(`
📱 To connect to real backend:
1. Start backend: python api/detect.py
2.// If using mock data, return simulated results
  if (useMockData) {
    console.log('🎭 Using mock data (backend not connected)');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      detections: [
        {
          bbox: [120, 180, 380, 520],
          confidence: 0.89,
          yieldCategory: 'High',
          yieldScore: 0.78,
        },
        {
          bbox: [400, 200, 600, 480],
          confidence: 0.82,
          yieldCategory: 'Medium',
          yieldScore: 0.52,
        },
        {
          bbox: [100, 550, 320, 800],
          confidence: 0.76,
          yieldCategory: 'Medium',
          yieldScore: 0.45,
        },
      ],
      overallYield: 'High',
    };
  }

   Backend should run at: ${API_BASE_URL}
3. Make sure phone/simulator on same WiFi as computer
    `);
  }
}

/**
 * Detect pods and estimate yield using backend API
 */
export async function detectAndEstimateYield(
  imageUri: string
): Promise<DetectionResult> {
  if (!isInitialized) {
    throw new Error('API not initialized. Call loadModels() first.');
  }

  try {
    // Create form data with image
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    
    // Backend expects 'image' field
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename,
    } as any);

    // Send to backend
    const response = await fetch(`${API_BASE_URL}/api/detect`, {
      method: 'POST',
      body: formData as any,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: any = await response.json();

    // Check if no pods were detected
    if (!result.success || result.pod_count === 0) {
      throw new Error(result.message || 'No cacao pods detected or visible in the image');
    }

    // Transform backend response to expected format
    // Backend returns 'pods' array, transform to 'detections'
    const detections: Detection[] = (result.pods || []).map((pod: any) => ({
      bbox: pod.bbox,
      confidence: pod.confidence,
      yieldCategory: pod.yield_category,
      yieldScore: pod.yield_score,
    }));
    
    const overallYield = result.overall_yield || calculateOverallYield(detections);
    const overallYieldScore = result.overall_yield_score;

    console.log('API Response - Overall Yield Score:', overallYieldScore);

    return {
      detections,
      overallYield,
      overallYieldScore: overallYieldScore,
    };
  } catch (error) {
    console.error('Detection API error:', error);
    throw error;
  }
}

/**
 * Calculate overall yield from detections
 */
function calculateOverallYield(
  detections: Detection[]
): 'Low' | 'Medium' | 'High' {
  if (detections.length === 0) {
    return 'Low';
  }

  const scores = detections.map((d) => {
    switch (d.yieldCategory) {
      case 'High':
        return 2;
      case 'Medium':
        return 1;
      case 'Low':
        return 0;
      default:
        return 0;
    }
  });

  const avgScore: number = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;

  if (avgScore >= 1.5) {
    return 'High';
  } else if (avgScore >= 0.75) {
    return 'Medium';
  } else {
    return 'Low';
  }
}

/**
 * Check if models/API is ready
 */
export function areModelsLoaded(): boolean {
  return isInitialized;
}

/**
 * Update API base URL (for settings)
 */
export function setApiBaseUrl(url: string): void {
  // Remove trailing slash
  const cleanUrl = url.replace(/\/$/, '');
  
  // Validate URL format
  try {
    new URL(cleanUrl);
    // Update API_BASE_URL if needed (would need to make it mutable)
    console.log(`API URL would be set to: ${cleanUrl}`);
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}
