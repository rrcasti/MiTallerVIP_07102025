//components/health/DrivingAnalyzer.jsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Zap
} from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * COMPONENTE: DrivingAnalyzer
 * 
 * Muestra la TABLA DE PATRONES y su impacto en desgaste
 */
export default function DrivingAnalyzer({ vehicleId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeTrips();
  }, [vehicleId]);

  const analyzeTrips = async () => {
    setLoading(true);
    try {
      const healthRef = doc(db, 'vehicleHealth', vehicleId);
      const healthSnap = await getDoc(healthRef);

      if (healthSnap.exists()) {
        const data = healthSnap.data();
        const trips = data.trips || [];

        // Analizar patrones
        const patterns = calculatePatterns(trips);
        setAnalysis(patterns);
      }
    } catch (error) {
      console.error('Error analyzing trips:', error);
    }
    setLoading(false);
  };

  const calculatePatterns = (trips) => {
    if (trips.length === 0) {
      return {
        patterns: [],
        overallScore: 100,
      };
    }

    // Calcular totales
    const totalTrips = trips.length;
    const totalHarshBrakes = trips.reduce((sum, t) => sum + (t.harshBrakes || 0), 0);
    const totalHarshAccel = trips.reduce((sum, t) => sum + (t.harshAccelerations || 0), 0);
    const avgSpeed = trips.reduce((sum, t) => sum + (t.avgSpeed || 0), 0) / totalTrips;
    const maxSpeedEver = Math.max(...trips.map(t => t.maxSpeed || 0));
    const totalIdleTime = trips.reduce((sum, t) => sum + (t.idleTime || 0), 0);

    // Detectar patrones
    const patterns = [];

    // PATRÓN 1: Frenadas bruscas
    const avgHarshBrakes = totalHarshBrakes / totalTrips;
    if (avgHarshBrakes > 2) {
      patterns.push({
        id: 'harsh_brakes',
        title: 'Frenadas bruscas frecuentes',
        component: 'Pastillas de freno',
        wear: '+30%',
        severity: 'high',
        frequency: avgHarshBrakes.toFixed(1) + ' por viaje',
        recommendation: 'Mantén mayor distancia de seguridad y anticipa las frenadas',
      });
    }

    // PATRÓN 2: Aceleraciones agresivas
    const avgHarshAccel = totalHarshAccel / totalTrips;
    if (avgHarshAccel > 2) {
      patterns.push({
        id: 'harsh_accel',
        title: 'Aceleraciones agresivas',
        component: 'Clutch/transmisión',
        wear: '+25%',
        severity: 'high',
        frequency: avgHarshAccel.toFixed(1) + ' por viaje',
        recommendation: 'Acelera gradualmente para prolongar vida del clutch',
      });
    }

    // PATRÓN 3: Alta velocidad
    if (avgSpeed > 80 || maxSpeedEver > 120) {
      patterns.push({
        id: 'high_speed',
        title: 'Velocidad promedio >120 km/h',
        component: 'Motor/neumáticos',
        wear: '+20%',
        severity: 'medium',
        frequency: `Máx: ${Math.round(maxSpeedEver)} km/h`,
        recommendation: 'Reduce velocidad para mejorar consumo y reducir desgaste',
      });
    }

    // PATRÓN 4: Mucho ralentí
    const avgIdleMinutes = (totalIdleTime / 60) / totalTrips;
    if (avgIdleMinutes > 5) {
      patterns.push({
        id: 'idle_time',
        title: 'Mucho tiempo en ralentí',
        component: 'Batería/bujías',
        wear: '+15%',
        severity: 'low',
        frequency: `${avgIdleMinutes.toFixed(1)} min por viaje`,
        recommendation: 'Apaga el motor en esperas prolongadas',
      });
    }

    // PATRÓN 5: Detectar subidas (si hay datos de altitud)
    // TODO: Implementar cuando tengamos datos de altitud

    // Calcular score general
    let score = 100;
    patterns.forEach(p => {
      if (p.severity === 'high') score -= 15;
      else if (p.severity === 'medium') score -= 10;
      else score -= 5;
    });

    return {
      patterns,
      overallScore: Math.max(score, 0),
      totalTrips,
      avgSpeed: Math.round(avgSpeed),
      maxSpeed: Math.round(maxSpeedEver),
    };
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return {
          bg: '#fee2e2',
          border: '#ef4444',
          text: '#991b1b',
          icon: AlertTriangle,
        };
      case 'medium':
        return {
          bg: '#fef3c7',
          border: '#f59e0b',
          text: '#92400e',
          icon: Activity,
        };
      default:
        return {
          bg: '#dbeafe',
          border: '#3b82f6',
          text: '#1e40af',
          icon: CheckCircle,
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Analizando patrones...</Text>
      </View>
    );
  }

  if (!analysis || analysis.patterns.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Zap size={48} color="#64748b" />
        <Text style={styles.emptyTitle}>No hay datos suficientes</Text>
        <Text style={styles.emptyText}>
          Registra algunos viajes para ver análisis de tu conducción
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Score general */}
      <View style={styles.scoreCard}>
        <TrendingUp size={24} color="#10b981" />
        <View style={styles.scoreContent}>
          <Text style={styles.scoreTitle}>Score de Conducción</Text>
          <Text style={[
            styles.scoreValue,
            { color: analysis.overallScore >= 80 ? '#10b981' : '#f59e0b' }
          ]}>
            {analysis.overallScore}/100
          </Text>
        </View>
        <Text style={styles.scoreLabel}>
          {analysis.overallScore >= 80 ? '✅ Excelente' : '⚠️ Puede mejorar'}
        </Text>
      </View>

      {/* Stats rápidas */}
      <View style={styles.statsRow}>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{analysis.totalTrips}</Text>
          <Text style={styles.miniStatLabel}>Viajes</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{analysis.avgSpeed} km/h</Text>
          <Text style={styles.miniStatLabel}>Promedio</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{analysis.maxSpeed} km/h</Text>
          <Text style={styles.miniStatLabel}>Máxima</Text>
        </View>
      </View>

      {/* TABLA DE PATRONES */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>📊 Patrones Detectados</Text>
          <Text style={styles.tableSubtitle}>Impacto en desgaste de componentes</Text>
        </View>

        {analysis.patterns.map((pattern) => {
          const severity = getSeverityColor(pattern.severity);
          const Icon = severity.icon;

          return (
            <View 
              key={pattern.id}
              style={[
                styles.patternCard,
                { borderLeftColor: severity.border, borderLeftWidth: 4 }
              ]}
            >
              {/* Header del patrón */}
              <View style={styles.patternHeader}>
                <View style={[styles.severityBadge, { backgroundColor: severity.bg }]}>
                  <Icon size={16} color={severity.text} />
                </View>
                <View style={styles.patternTitleContainer}>
                  <Text style={styles.patternTitle}>{pattern.title}</Text>
                  <Text style={styles.patternFrequency}>{pattern.frequency}</Text>
                </View>
              </View>

              {/* Info del componente */}
              <View style={styles.componentRow}>
                <View style={styles.componentInfo}>
                  <Text style={styles.componentLabel}>Componente afectado:</Text>
                  <Text style={styles.componentName}>🔧 {pattern.component}</Text>
                </View>
                <View style={[styles.wearBadge, { backgroundColor: severity.bg }]}>
                  <Text style={[styles.wearText, { color: severity.text }]}>
                    {pattern.wear}
                  </Text>
                </View>
              </View>

              {/* Recomendación */}
              <View style={styles.recommendationBox}>
                <Text style={styles.recommendationLabel}>💡 Recomendación:</Text>
                <Text style={styles.recommendationText}>{pattern.recommendation}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Resumen de impacto */}
      <View style={styles.impactSummary}>
        <Text style={styles.impactTitle}>⚠️ Impacto Total Estimado</Text>
        <Text style={styles.impactText}>
          Tu estilo de conducción está generando un desgaste{' '}
          <Text style={styles.impactHighlight}>
            {analysis.patterns.length > 2 ? 'ALTO' : 'MODERADO'}
          </Text>
          {' '}en {analysis.patterns.length} componente(s).
        </Text>
        <Text style={styles.impactAdvice}>
          Mejorando estos patrones puedes extender la vida útil de tu vehículo hasta un 40%.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  scoreContent: {
    flex: 1,
  },
  scoreTitle: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  miniStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  miniStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  miniStatLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  tableContainer: {
    gap: 12,
  },
  tableHeader: {
    marginBottom: 8,
  },
  tableTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tableSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
  },
  patternCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  severityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternTitleContainer: {
    flex: 1,
  },
  patternTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  patternFrequency: {
    color: '#94a3b8',
    fontSize: 12,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  componentInfo: {
    flex: 1,
  },
  componentLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
  componentName: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  wearBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  wearText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  recommendationLabel: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  impactSummary: {
    marginTop: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  impactTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  impactText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  impactHighlight: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  impactAdvice: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});