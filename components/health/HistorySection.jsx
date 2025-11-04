// RUTA: components/health/HistorySection.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { 
  FileText, 
  Share2, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Award,
  DollarSign,
  Clock,
  Package
} from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * COMPONENTE: HistorySection
 * 
 * Historial certificado de mantenimiento
 * - Timeline visual de servicios
 * - Compartir resumen
 * - Estadísticas de valor agregado
 */
export default function HistorySection({ vehicle, healthData }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalServices: 0,
    totalInvested: 0,
    avgServiceInterval: 0,
    lastServiceDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [vehicle?.id]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const healthDoc = await getDoc(doc(db, 'vehicleHealth', vehicle?.id));
      
      if (healthDoc.exists()) {
        const data = healthDoc.data();
        const maintenanceHistory = data.maintenanceHistory || [];
        
        // Ordenar por fecha (más reciente primero)
        const sorted = [...maintenanceHistory].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        setHistory(sorted);
        calculateStats(sorted);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
    setLoading(false);
  };

  const calculateStats = (historyData) => {
    if (historyData.length === 0) {
      return;
    }

    const totalServices = historyData.length;
    const lastServiceDate = historyData[0]?.date;

    // Promedio de intervalos
    let avgServiceInterval = 0;
    if (historyData.length > 1) {
      const intervals = [];
      for (let i = 0; i < historyData.length - 1; i++) {
        const kmDiff = Math.abs(historyData[i].km - historyData[i + 1].km);
        intervals.push(kmDiff);
      }
      avgServiceInterval = Math.round(
        intervals.reduce((a, b) => a + b, 0) / intervals.length
      );
    }

    // Costos estimados por servicio (CLP)
    const serviceCosts = {
      oil_change: 45000,
      air_filter: 25000,
      brake_pads: 120000,
      battery_check: 15000,
      general_inspection: 35000,
      timing_belt: 250000,
      transmission_oil: 80000,
      coolant: 40000,
      cabin_filter: 20000,
      brake_fluid: 35000,
      shock_absorbers: 180000,
      tire_rotation: 15000,
      wheel_alignment: 45000,
    };

    const totalInvested = historyData.reduce((sum, service) => {
      return sum + (serviceCosts[service.service_id] || 30000);
    }, 0);

    setStats({
      totalServices,
      totalInvested,
      avgServiceInterval,
      lastServiceDate,
    });
  };

  const handleShare = async () => {
    try {
      const message = `🚗 Historial Certificado de Mantenimiento

Vehículo: ${vehicle?.brand} ${vehicle?.model}
Patente: ${vehicle?.license_plate}

📊 Estadísticas:
✅ ${stats.totalServices} servicios registrados
💰 Inversión total: $${stats.totalInvested.toLocaleString('es-CL')}
📏 Promedio entre servicios: ${stats.avgServiceInterval.toLocaleString()} km

🔧 Últimos Servicios:
${history.slice(0, 5).map(s => 
  `• ${s.service_name} - ${s.km.toLocaleString()} km`
).join('\n')}

✨ Historial certificado con Mi Taller VIP`;

      await Share.share({
        message,
        title: 'Historial de Mantenimiento Certificado',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getServiceIcon = (serviceId) => {
    const icons = {
      oil_change: '🛢️',
      air_filter: '🌬️',
      cabin_filter: '❄️',
      brake_pads: '🔴',
      brake_fluid: '🩸',
      timing_belt: '⚙️',
      transmission_oil: '🔧',
      coolant: '💧',
      shock_absorbers: '🔩',
      tire_rotation: '🔄',
      wheel_alignment: '📐',
      battery_check: '🔋',
      general_inspection: '🔍',
    };
    return icons[serviceId] || '🔧';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <FileText size={24} color="#00d9ff" />
        <Text style={styles.title}>Historial Certificado</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
          <CheckCircle size={20} color="#10b981" />
          <Text style={styles.statValue}>{stats.totalServices}</Text>
          <Text style={styles.statLabel}>Servicios Registrados</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#fbbf24' }]}>
          <DollarSign size={20} color="#fbbf24" />
          <Text style={styles.statValue}>
            ${(stats.totalInvested / 1000).toFixed(0)}k
          </Text>
          <Text style={styles.statLabel}>Inversión Total</Text>
        </View>
      </View>

      {stats.avgServiceInterval > 0 && (
        <View style={styles.intervalCard}>
          <TrendingUp size={20} color="#00d9ff" />
          <View style={styles.intervalInfo}>
            <Text style={styles.intervalValue}>
              {stats.avgServiceInterval.toLocaleString()} km
            </Text>
            <Text style={styles.intervalLabel}>
              Promedio entre servicios
            </Text>
          </View>
        </View>
      )}

      {/* Botón Compartir */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        activeOpacity={0.7}
      >
        <Share2 size={20} color="#fff" />
        <Text style={styles.shareButtonText}>Compartir Historial</Text>
      </TouchableOpacity>

      {/* Timeline de Servicios */}
      <View style={styles.timelineContainer}>
        <Text style={styles.timelineTitle}>📋 Historial Completo</Text>
        
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color="#64748b" />
            <Text style={styles.emptyText}>No hay servicios registrados</Text>
            <Text style={styles.emptySubtext}>
              Los servicios que registres aparecerán aquí
            </Text>
          </View>
        ) : (
          history.map((service, index) => (
            <View key={index} style={styles.timelineItem}>
              {/* Línea vertical */}
              {index < history.length - 1 && (
                <View style={styles.timelineLine} />
              )}
              
              {/* Punto */}
              <View style={styles.timelineDot} />
              
              {/* Contenido */}
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineIcon}>
                    {getServiceIcon(service.service_id)}
                  </Text>
                  <View style={styles.timelineHeaderText}>
                    <Text style={styles.timelineServiceName}>
                      {service.service_name}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {formatDate(service.date)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.timelineDetails}>
                  <View style={styles.timelineDetail}>
                    <Clock size={14} color="#64748b" />
                    <Text style={styles.timelineDetailText}>
                      {service.km.toLocaleString()} km
                    </Text>
                  </View>
                  <View style={styles.timelineDetail}>
                    <Calendar size={14} color="#64748b" />
                    <Text style={styles.timelineDetailText}>
                      Próximo: {service.next_service_km.toLocaleString()} km
                    </Text>
                  </View>
                </View>

                {/* Categoría */}
                <View style={[
                  styles.categoryBadge,
                  service.category === 'failure_prevention' && styles.categoryPreventive,
                  service.category === 'wear' && styles.categoryWear,
                ]}>
                  <Text style={styles.categoryText}>
                    {service.category === 'failure_prevention' ? '🛡️ Preventivo' : 
                     service.category === 'wear' ? '🔧 Desgaste' : '✨ General'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Valor Agregado */}
      {stats.totalServices > 0 && (
        <View style={styles.valueCard}>
          <Award size={24} color="#fbbf24" />
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>💰 Valor Agregado</Text>
            <Text style={styles.valueText}>
              Un historial certificado puede aumentar el valor de reventa hasta un{' '}
              <Text style={styles.valueHighlight}>15%</Text>
            </Text>
            <Text style={styles.valueEstimate}>
              Estimado: +${Math.round(stats.totalInvested * 0.15).toLocaleString('es-CL')}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#141b3d',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#1e2749',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  intervalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#141b3d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00d9ff',
  },
  intervalInfo: {
    flex: 1,
  },
  intervalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00d9ff',
  },
  intervalLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  // Botón compartir
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#00d9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Timeline
  timelineContainer: {
    backgroundColor: '#141b3d',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e2749',
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 32,
    marginBottom: 24,
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 24,
    bottom: -24,
    width: 2,
    backgroundColor: '#1e2749',
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00d9ff',
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  timelineContent: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e2749',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  timelineIcon: {
    fontSize: 24,
  },
  timelineHeaderText: {
    flex: 1,
  },
  timelineServiceName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  timelineDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  timelineDetails: {
    gap: 8,
    marginBottom: 12,
  },
  timelineDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineDetailText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPreventive: {
    backgroundColor: '#6366f1',
  },
  categoryWear: {
    backgroundColor: '#f59e0b',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  // Valor agregado
  valueCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#141b3d',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 8,
  },
  valueHighlight: {
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  valueEstimate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
});