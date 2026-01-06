import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function UserGuideScreen() {
  const router = useRouter();

  const sections = [
    {
      icon: 'camera' as const,
      title: 'Taking Photos',
      content: [
        'Ensure good lighting conditions for clear images',
        'Hold your phone steady and focus on the cacao pods',
        'Try to capture the entire pod in the frame',
        'Avoid shadows and glare that might obscure pod details',
        'Multiple pods in one image are supported',
      ],
    },
    {
      icon: 'analytics' as const,
      title: 'Analyzing Pods',
      content: [
        'Tap "Take Photo" to capture a new image or "Choose from Gallery" to select existing photos',
        'The AI will automatically detect and segment cacao pods',
        'Each pod is analyzed for yield characteristics including size, color, and ripeness',
        'Analysis typically takes 2-5 seconds depending on image complexity',
        'Results show individual pod details and overall yield estimate',
      ],
    },
    {
      icon: 'bar-chart' as const,
      title: 'Understanding Yield Categories',
      content: [
        'High Yield (Green): Pods show optimal characteristics for high bean yield - mature size, good color, healthy appearance',
        'Medium Yield (Orange): Pods with average characteristics - may be slightly immature or have minor defects',
        'Low Yield (Red): Pods that are too young, diseased, damaged, or otherwise suboptimal for harvest',
        'The overall yield score averages all detected pods in the image',
      ],
    },
    {
      icon: 'information-circle' as const,
      title: 'Pod Detection Details',
      content: [
        'The segmentation model uses YOLOv8n for fast and accurate pod detection',
        'Confidence scores indicate detection reliability (higher is better)',
        'Bounding boxes show where pods were detected',
        'The yield estimation model uses self-supervised learning (SimCLR) trained on thousands of cacao pod images',
        'Model works on-device or via backend API for flexibility',
      ],
    },
    {
      icon: 'time' as const,
      title: 'Using History',
      content: [
        'All analyses are automatically saved to your history (if enabled in settings)',
        'View past analyses with timestamps and yield results',
        'Tap any history item to view full details',
        'Clear history anytime using the "Clear" button',
        'History is stored locally on your device',
      ],
    },
    {
      icon: 'settings' as const,
      title: 'Settings & Privacy',
      content: [
        'Toggle "Save Analysis History" to control whether analyses are stored',
        'GPU Acceleration (when available) speeds up processing',
        'Debug Mode shows technical details for troubleshooting',
        'All data is processed locally or via your configured backend',
        'No data is sent to third parties',
      ],
    },
    {
      icon: 'bulb' as const,
      title: 'Tips for Best Results',
      content: [
        'Clean the camera lens before taking photos',
        'Take photos in natural daylight when possible',
        'Capture pods at eye level rather than from extreme angles',
        'For large plantations, take multiple photos in different areas',
        'Compare results over time to track pod development',
        'Use the same lighting conditions for consistent comparisons',
      ],
    },
    {
      icon: 'warning' as const,
      title: 'Troubleshooting',
      content: [
        'If no pods are detected: Ensure pods are clearly visible and well-lit',
        'If analysis is slow: Check your internet connection (for API mode) or restart the app',
        'If app crashes: Clear app cache and ensure you have the latest version',
        'If results seem inaccurate: Try different lighting or camera angles',
        'Backend connection issues: Verify the API URL in settings matches your backend server',
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#10b981" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Guide</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.intro}>
          <Ionicons name="book" size={48} color="#10b981" />
          <Text style={styles.introTitle}>Welcome to Cacao Yield Estimator</Text>
          <Text style={styles.introText}>
            This app uses advanced AI to analyze cacao pods and estimate yield potential.
            Follow this guide to get the most out of the app.
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name={section.icon} size={24} color="#10b981" />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.sectionContent}>
              {section.content.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Ionicons name="heart" size={20} color="#ef4444" />
          <Text style={styles.footerText}>
            Empowering cacao farmers with AI technology
          </Text>
        </View>

        <View style={styles.contact}>
          <Text style={styles.contactTitle}>Need More Help?</Text>
          <Text style={styles.contactText}>
            For technical support or questions, please refer to the Help & Support section in Settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  intro: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  sectionContent: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  contact: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});
