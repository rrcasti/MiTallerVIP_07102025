// RUTA: components/health/AIInsights.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Brain, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react-native';
import { callGeminiAPI } from '../../services/geminiService';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function AIInsights({ healthData, mode, vehicleInfo }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ VALIDACIÓN AGREGADA: Solo analizar si healthData existe
    if (healthData && healthData.totalKm !== undefined) {
      fetchAIAnalysis();
    } else {
      console.warn('⚠️ AIInsights: healthData no disponible aún, esperando...');
      setLoading(false);
    }
  }, [healthData]);

  const fetchAIAnalysis = async () => {
    // ✅ VALIDACIÓN AGREGADA: Verificar datos antes de analizar
    if (!healthData || healthData.totalKm === undefined) {
      console.warn('⚠️ No se puede analizar sin healthData válido');
      setLoading(false);
      return;
    }

    try {
      const prompt = generatePrompt(healthData, mode, vehicleInfo);
      
      const response = await callGeminiAPI(
        prompt,
        `Responde ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json) con esta estructura exacta:
{
  "health_score": número del 0 al 100,
  "status": "excellent" o "good" o "attention" o "urgent",
  "recommendations": ["texto1", "texto2", "texto3"],
  "alerts": [
    {"type": "tipo", "message": "mensaje", "priority": "alta/media/baja"}
  ],
  "next_maintenance": {
    "service": "nombre del servicio",
    "km": número,
    "urgency": "high" o "medium" o "low"
  }
}`
      );

      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      setInsights(parsed);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setInsights({
        health_score: 85,
        status: 'good',
        recommendations: ['Mantén el ritmo de mantenimiento', 'Revisa presión de neumáticos mensualmente'],
        alerts: [],
        next_maintenance: {
          service: 'Cambio de aceite',
          km: 5000,
          urgency: 'medium'
        }
      });
    }
    setLoading(false);
  };

  // ✅ VALIDACIÓN AGREGADA: Mostrar estado de espera si no hay datos
  if (!healthData || healthData.totalKm === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <Brain size={24} color="#9b59b6" />
        <Text style={styles.loadingText}>Esperando datos del vehículo...</Text>
      </View>
    );
  }

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
      <View style={styles.card}>
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
      </View>
    </Animated.View>
  );
}

function generatePrompt(healthData, mode, vehicleInfo) {
  // ✅ VALIDACIÓN AGREGADA: Valores por defecto si faltan datos
  const totalKm = healthData?.totalKm || 0;
  const kmThisMonth = healthData?.kmThisMonth || 0;
  const avgKmPerMonth = healthData?.avgKmPerMonth || 0;
  const nextOilChange = healthData?.nextOilChange || 5000;
  const daysOld = healthData?.daysOld || 0;

  if (mode === 'gps') {
    return `
Analiza la salud de este vehículo con datos GPS reales:
- KM totales: ${totalKm}
- KM este mes: ${kmThisMonth}
- Promedio mensual: ${avgKmPerMonth}
- Próximo cambio aceite: ${nextOilChange} km

Proporciona:
1. Evaluación del health_score (0-100)
2. Status general (excellent/good/attention/urgent)
3. Alertas prioritarias si corresponde
4. Recomendaciones personalizadas
5. Próximo mantenimiento sugerido

Sé específico y práctico.
    `;
  }

  return `
Estima la salud del vehículo con datos limitados:
${vehicleInfo ? `- Vehículo: ${vehicleInfo.brand} ${vehicleInfo.model} ${vehicleInfo.year}` : ''}
- Último km registrado: ${totalKm}
- Días sin actualizar: ${daysOld}

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
    backgroundColor: '#9b59b611',
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