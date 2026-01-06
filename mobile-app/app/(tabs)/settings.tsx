import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [enableGPU, setEnableGPU] = React.useState(true);
  const [saveHistory, setSaveHistory] = React.useState(true);
  const [debugMode, setDebugMode] = React.useState(false);

  // Load settings on mount
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('saveHistory');
      if (saved !== null) {
        setSaveHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveHistoryToggle = async (value: boolean) => {
    setSaveHistory(value);
    try {
      await AsyncStorage.setItem('saveHistory', JSON.stringify(value));
      console.log('💾 Save history setting updated:', value);
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="flash" size={24} color="#10b981" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable GPU Acceleration</Text>
                <Text style={styles.settingDescription}>
                  Faster inference on supported devices
                </Text>
              </View>
            </View>
            <Switch
              value={enableGPU}
              onValueChange={setEnableGPU}
              trackColor={{ false: '#475569', true: '#10b981' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="bug" size={24} color="#f59e0b" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Debug Mode</Text>
                <Text style={styles.settingDescription}>
                  Show inference metrics and logs
                </Text>
              </View>
            </View>
            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
              trackColor={{ false: '#475569', true: '#10b981' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="save" size={24} color="#3b82f6" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Save Analysis History</Text>
                <Text style={styles.settingDescription}>
                  Keep record of analyzed pods
                </Text>
              </View>
            </View>
            <Switch
              value={saveHistory}
              onValueChange={handleSaveHistoryToggle}
              trackColor={{ false: '#475569', true: '#10b981' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Model Version</Text>
              <Text style={styles.infoValue}>YOLOv8n + MobileNetV3</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Training Dataset</Text>
              <Text style={styles.infoValue}>Roboflow Cacao v5</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/user-guide')}>
            <Ionicons name="book" size={20} color="#10b981" />
            <Text style={styles.linkText}>User Guide</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton}>
            <Ionicons name="help-circle" size={20} color="#10b981" />
            <Text style={styles.linkText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton}>
            <Ionicons name="document-text" size={20} color="#10b981" />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with ❤️ for cacao farmers
          </Text>
          <Text style={styles.footerSubtext}>
            Self-supervised AI for yield estimation
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
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#94a3b8',
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
});
