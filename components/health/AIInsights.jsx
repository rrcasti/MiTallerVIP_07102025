// RUTA: components/health/AIInsights.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react-native';
import { base44 } from '../../api/base44Client';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function AIInsights({ healthData, mode, vehicleInfo }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIAnalysis();
  }, [healthData]);

  const fetchAIAnalysis = async () => {
    try {
      const prompt = generatePrompt(healthData, mode, vehicleInfo);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            health_score: { type: "number" },
            status: { 
              type: "string",
              enum: ["excellent", "good", "attention", "urgent"]
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  message: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            next_maintenance: {
              type: "object",
              properties: {
                service: { type: "string" },
                km: { type: "number" },
                urgency: { type: "string" }
              }
            }
          }
        }
      });

      setInsights(response);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9b59b6" />
        <Text style={styles.loadingText}>Analizando con IA...</Text>
      </View>
    );
  }

  if (!insights) return null;

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
      <LinearGradient
        colors={['#9b59b622', '#8e44ad11']}
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.header}>
          <Brain size={24} color="#9b59b6" />
          <Text style={styles.title}>Análisis Inteligente</Text>
        </View>

        {/* Status */}
        <View style={[styles.statusBadge, styles[`status_${insights.status}`]]}>
          <Text style={styles.statusText}>
            {getStatusLabel(insights.status)}
          </Text>
        </View>

        {/* Alerts */}
        {insights.alerts && insights.alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Alertas</Text>
            {insights.alerts.map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <AlertTriangle size={16} color="#ffa500" />
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Recomendaciones</Text>
            {insights.recommendations.map((rec, index) => (
              <View key={index} style={styles.recItem}>
                <CheckCircle size={16} color="#00ff88" />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Next Maintenance */}
        {insights.next_maintenance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Próximo Servicio</Text>
            <View style={styles.maintenanceBox}>
              <Text style={styles.maintenanceService}>
                {insights.next_maintenance.service}
              </Text>
              <Text style={styles.maintenanceKm}>
                En {insights.next_maintenance.km} km
              </Text>
              <View style={[
                styles.urgencyBadge,
                styles[`urgency_${insights.next_maintenance.urgency}`]
              ]}>
                <Text style={styles.urgencyText}>
                  {insights.next_maintenance.urgency}
                </Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function generatePrompt(healthData, mode, vehicleInfo) {
  if (mode === 'gps') {
    return `
Analiza la salud de este vehículo con datos GPS reales:
- KM totales: ${healthData.totalKm}
- KM este mes: ${healthData.kmThisMonth}
- Promedio mensual: ${healthData.avgKmPerMonth}
- Próximo cambio aceite: ${healthData.nextOilChange} km

Proporciona:
1. Evaluación del health_score (0-100)
2. Status general (excellent/good/attention/urgent)
3. Alertas prioritarias si corresponde
4. Recomendaciones personalizadas
5. Próximo mantenimiento sugerido

Sé específico y práctico.
    `;
  }

  // Modo manual/estimado
  return `
Estima la salud del vehículo con datos limitados:
${vehicleInfo ? `- Vehículo: ${vehicleInfo.brand} ${vehicleInfo.model} ${vehicleInfo.year}` : ''}
- Último km registrado: ${healthData.totalKm}
- Días sin actualizar: ${healthData.daysOld || 0}

Proporciona estimación CONSERVADORA incluyendo:
1. Health score estimado
2. Recomendaciones generales
3. Sugerencias para mejorar el tracking

Menciona la limitación de datos y sugiere activar GPS.
  `;
}

function getStatusLabel(status) {
  const labels = {
    excellent: '🟢 Excelente',
    good: '🟡 Bueno',
    attention: '🟠 Requiere Atención',
    urgent: '🔴 Urgente'
  };
  return labels[status] || status;
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9b59b6',
    fontSize: 14,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#9b59b633',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  status_excellent: {
    backgroundColor: '#00ff8822',
  },
  status_good: {
    backgroundColor: '#00d9ff22',
  },
  status_attention: {
    backgroundColor: '#ffa50022',
  },
  status_urgent: {
    backgroundColor: '#ff444422',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffa50011',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  alertText: {
    flex: 1,
    color: '#ffa500',
    fontSize: 14,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00ff8811',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  recText: {
    flex: 1,
    color: '#00ff88',
    fontSize: 14,
  },
  maintenanceBox: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
  },
  maintenanceService: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  maintenanceKm: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  urgencyBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  urgency_high: {
    backgroundColor: '#ff444422',
  },
  urgency_medium: {
    backgroundColor: '#ffa50022',
  },
  urgency_low: {
    backgroundColor: '#00d9ff22',
  },
  urgencyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});