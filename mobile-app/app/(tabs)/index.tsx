import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

type YieldCategory = 'Low' | 'Medium' | 'High' | null;

interface Detection {
  bbox: number[];
  confidence: number;
  yieldCategory: YieldCategory;
}

export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [overallYield, setOverallYield] = useState<YieldCategory>(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (uri: string) => {
    setIsAnalyzing(true);
    setDetections([]);
    setOverallYield(null);

    try {
      // TODO: Implement actual model inference
      // This is a placeholder - you'll need to implement ONNX runtime or TensorFlow.js
      
      // Simulate API call or local inference
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock results
      const mockDetections: Detection[] = [
        {
          bbox: [100, 100, 300, 300],
          confidence: 0.92,
          yieldCategory: 'High',
        },
        {
          bbox: [350, 150, 500, 320],
          confidence: 0.85,
          yieldCategory: 'Medium',
        },
      ];

      setDetections(mockDetections);
      setOverallYield('High');
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getYieldColor = (category: YieldCategory) => {
    switch (category) {
      case 'High':
        return '#10b981';
      case 'Medium':
        return '#f59e0b';
      case 'Low':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getYieldIcon = (category: YieldCategory) => {
    switch (category) {
      case 'High':
        return 'trending-up';
      case 'Medium':
        return 'remove';
      case 'Low':
        return 'trending-down';
      default:
        return 'help';
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={64} color="#6b7280" />
        <Text style={styles.permissionText}>
          Camera permission is required to analyze pods
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Cacao Yield Estimator</Text>
        <Text style={styles.subtitle}>
          Analyze cacao pods to estimate yield potential
        </Text>

        {!imageUri && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={takePicture}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={pickImage}>
              <Ionicons name="images" size={24} color="#10b981" />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {imageUri && (
          <View style={styles.resultContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />

            {isAnalyzing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Analyzing pods...</Text>
              </View>
            )}

            {!isAnalyzing && detections.length > 0 && (
              <View style={styles.resultsPanel}>
                <View
                  style={[
                    styles.overallYield,
                    { backgroundColor: getYieldColor(overallYield) },
                  ]}>
                  <Ionicons
                    name={getYieldIcon(overallYield)}
                    size={32}
                    color="#fff"
                  />
                  <Text style={styles.overallYieldText}>
                    Overall: {overallYield} Yield
                  </Text>
                </View>

                <Text style={styles.detectionsTitle}>
                  Detected Pods: {detections.length}
                </Text>

                {detections.map((detection, index) => (
                  <View key={index} style={styles.detectionCard}>
                    <View style={styles.detectionHeader}>
                      <Text style={styles.detectionNumber}>Pod {index + 1}</Text>
                      <View
                        style={[
                          styles.yieldBadge,
                          { backgroundColor: getYieldColor(detection.yieldCategory) },
                        ]}>
                        <Ionicons
                          name={getYieldIcon(detection.yieldCategory)}
                          size={16}
                          color="#fff"
                        />
                        <Text style={styles.yieldBadgeText}>
                          {detection.yieldCategory}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.confidence}>
                      Confidence: {(detection.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, styles.newAnalysisButton]}
              onPress={() => {
                setImageUri(null);
                setDetections([]);
                setOverallYield(null);
              }}>
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.buttonText}>New Analysis</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#3b82f6" />
          <Text style={styles.infoText}>
            Point your camera at cacao pods or select an existing photo. The AI
            will analyze pod characteristics and estimate yield potential.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  permissionText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
  },
  actionContainer: {
    gap: 16,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  newAnalysisButton: {
    backgroundColor: '#3b82f6',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#10b981',
  },
  resultContainer: {
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  resultsPanel: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  overallYield: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  overallYieldText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  detectionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  detectionCard: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detectionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  yieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  yieldBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  confidence: {
    fontSize: 14,
    color: '#94a3b8',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#dbeafe',
    lineHeight: 20,
  },
});
