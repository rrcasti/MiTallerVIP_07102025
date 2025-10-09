// RUTA: components/health/AutoTracking.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, TrendingUp, Droplet, Calendar, Sparkles } from 'lucide-react-native';
import CircularGauge from './CircularGauge';
import AIInsights from './AIInsights';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AutoTracking({ healthData }) {
  const [showAI, setShowAI] = useState(false);

  return (
    <View style={styles.container}>
      {/* Health Score principal */}
      <Animated.View 
        entering={FadeInDown.duration(800).springify()}
        style={styles.scoreContainer}
      >
        <LinearGradient
          colors={['#1a1a2e', '#0f0f1a']}
          style={styles.scoreCard}
        >
          <CircularGauge
            value={healthData.healthScore}
            maxValue={100}
            size={220}
            strokeWidth={24}
            label="Health Score"
          />
          
          <View style={styles.scoreDetails}>
            <ScoreDetail
              icon={<Zap size={20} color="#00d9ff" />}
              label="Estado"
              value={getHealthStatus(healthData.healthScore)}
              color="#00d9ff"
            />
            <View style={styles.divider} />
            <ScoreDetail
              icon={<TrendingUp size={20} color="#00ff88" />}
              label="Tendencia"
              value="Estable"
              color="#00ff88"
            />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View 
        entering={FadeInDown.delay(200).duration(800)}
        style={styles.statsGrid}
      >
        <StatCard
          title="KM Totales"
          value={healthData.totalKm.toLocaleString()}
          subtitle="Desde inicio"
          icon={<TrendingUp size={24} color="#00d9ff" />}
          gradient={['#00d9ff22', '#00d9ff11']}
        />
        <StatCard
          title="Este Mes"
          value={healthData.kmThisMonth.toLocaleString()}
          subtitle={`Prom: ${healthData.avgKmPerMonth}`}
          icon={<Calendar size={24} color="#00ff88" />}
          gradient={['#00ff8822', '#00ff8811']}
        />
      </Animated.View>

      {/* Próximo mantenimiento */}
      <Animated.View 
        entering={FadeInDown.delay(400).duration(800)}
        style={styles.maintenanceCard}
      >
        <LinearGradient
          colors={['#ffa50022', '#ffa50011']}
          style={styles.maintenanceGradient}
        >
          <View style={styles.maintenanceHeader}>
            <Droplet size={28} color="#ffa500" />
            <Text style={styles.maintenanceTitle}>Cambio de Aceite</Text>
          </View>
          
          <View style={styles.maintenanceProgress}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(healthData.nextOilChange / 5000) * 100}%`,
                    backgroundColor: healthData.nextOilChange < 1000 ? '#ff4444' : '#00d9ff'
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {healthData.nextOilChange} km restantes
            </Text>
          </View>
          
          {healthData.nextOilChange < 1000 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertText}>⚠️ Programar pronto</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* AI Insights */}
      <Animated.View 
        entering={FadeInDown.delay(600).duration(800)}
      >
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => setShowAI(!showAI)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#9b59b6', '#8e44ad']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiButtonGradient}
          >
            <Sparkles size={20} color="#fff" />
            <Text style={styles.aiButtonText}>
              {showAI ? 'Ocultar' : 'Ver'} Análisis IA
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {showAI && (
          <AIInsights 
            healthData={healthData}
            mode="gps"
          />
        )}
      </Animated.View>
    </View>
  );
}

function StatCard({ title, value, subtitle, icon, gradient }) {
  return (
    <LinearGradient
      colors={gradient}
      style={styles.statCard}
    >
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

function ScoreDetail({ icon, label, value, color }) {
  return (
    <View style={styles.scoreDetail}>
      {icon}
      <Text style={styles.scoreDetailLabel}>{label}</Text>
      <Text style={[styles.scoreDetailValue, { color }]}>{value}</Text>
    </View>
  );
}

function getHealthStatus(score) {
  if (score >= 90) return 'Excelente';
  if (score >= 70) return 'Bueno';
  if (score >= 50) return 'Regular';
  return 'Atención';
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
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
  scoreDetails: {
    flexDirection: 'row',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333',
    width: '100%',
  },
  scoreDetail: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  scoreDetailLabel: {
    fontSize: 12,
    color: '#999',
  },
  scoreDetailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    backgroundColor: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -1,
  },
  statTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  maintenanceCard: {
    marginBottom: 20,
  },
  maintenanceGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffa50033',
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  maintenanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  maintenanceProgress: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#999',
  },
  alertBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ff444422',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  alertText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: '600',
  },
  aiButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});