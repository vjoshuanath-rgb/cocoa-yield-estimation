import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HistoryItem {
  id: string;
  timestamp: number;
  imageUri: string;
  overallYield: 'Low' | 'Medium' | 'High';
  podCount: number;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('analysisHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('analysisHistory');
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const getYieldColor = (category: string) => {
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

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity style={styles.card}>
      <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
          <View
            style={[
              styles.yieldBadge,
              { backgroundColor: getYieldColor(item.overallYield) },
            ]}>
            <Text style={styles.yieldText}>{item.overallYield}</Text>
          </View>
        </View>
        <Text style={styles.podCount}>
          <Ionicons name="leaf" size={14} color="#94a3b8" /> {item.podCount}{' '}
          pod(s) detected
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
            <Ionicons name="trash" size={20} color="#ef4444" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#475569" />
          <Text style={styles.emptyText}>No analysis history yet</Text>
          <Text style={styles.emptySubtext}>
            Your analyzed pods will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  thumbnail: {
    width: 100,
    height: 100,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  date: {
    fontSize: 14,
    color: '#94a3b8',
  },
  yieldBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yieldText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  podCount: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
});
