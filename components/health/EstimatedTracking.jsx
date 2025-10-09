// RUTA: components/health/EstimatedTracking.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, TrendingUp } from 'lucide-react-native';
import CircularGauge from './CircularGauge';
import AIInsights from './AIInsights';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function EstimatedTracking({ healthData, onSwitchToManual }) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(800)}>
        <View style={styles.warningCard}>
          <AlertCircle size={24} color="#ffa500" />
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>Datos Limitados</Text>
            <Text style={styles.warningDescription}>
              Estimación basada en promedios estadísticos
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(200).duration(800)}
        style={styles.scoreContainer}
      >
        <LinearGradient
          colors={['#1a1a2e', '#0f0f1a']}
          style={styles.scoreCard}
        >
          <CircularGauge
            value={healthData.healthScore || 50}
            maxValue={100}
            size={180}
            strokeWidth={18}
            label="Estimado"
          />
          
          <Text style={styles.confidenceText}>
            Confianza: 40%
          </Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(800)}>
        <View style={styles.improvementCard}>
          <LinearGradient
            colors={['#00d9ff22', '#00d9ff11']}
            style={styles.improvementGradient}
          >
            <TrendingUp size={32} color="#00d9ff" />
            <Text style={styles.improvementTitle}>
              Mejora tu tracking
            </Text>
            <Text style={styles.improvementText}>
              Ingresa tus kilómetros manualmente para obtener análisis más precisos
            </Text>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={onSwitchToManual}
            >
              <Text style={styles.switchButtonText}>Ingresar Kilómetros</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(800)}>
        <AIInsights healthData={healthData} mode="estimated" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffa50022',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffa50033',
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffa500',
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 14,
    color: '#999',
  },
  scoreContainer: {
    marginBottom: 20,
  },
  scoreCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  confidenceText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ffa500',
    fontWeight: '600',
  },
  improvementCard: {
    marginBottom: 20,
  },
  improvementGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d9ff33',
  },
  improvementTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  improvementText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  switchButton: {
    backgroundColor: '#00d9ff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});