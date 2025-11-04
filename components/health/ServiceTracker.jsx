// RUTA: components/health/ServiceTracker.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AlertCircle, Calendar, TrendingUp, CheckCircle } from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { calculateUpcomingServices } from './maintenanceSchedule';

/**
 * COMPONENTE: ServiceTracker
 * 
 * Muestra los próximos mantenimientos usando calculateUpcomingServices()
 * - VENCIDOS (rojo) - es_overdue
 * - PRÓXIMOS (amarillo) - is_warning  
 * - PROGRAMADOS (verde) - scheduled
 */
export default function ServiceTracker({ vehicleId, currentKm }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, [vehicleId, currentKm]);

  const loadServices = async () => {
    setLoading(true);
    try {
      // Obtener servicios anteriores
      const healthDoc = await getDoc(doc(db, 'vehicleHealth', vehicleId));
      const lastServices = healthDoc.exists() ? healthDoc.data().lastServices || {} : {};

      // Calcular próximos servicios (tu función existente)
      const upcoming = calculateUpcomingServices(currentKm, lastServices);
      
      // Mostrar solo los 6 más importantes
      setServices(upcoming.slice(0, 6));

      console.log('📊 Servicios calculados:', upcoming.length);
    } catch (error) {
      console.error('Error loading services:', error);
    }
    setLoading(false);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: '#fee2e2',
          border: '#ef4444',
          text: '#991b1b',
          label: 'URGENTE',
          icon: AlertCircle,
        };
      case 'soon':
        return {
          bg: '#fef3c7',
          border: '#f59e0b',
          text: '#92400e',
          label: 'PRÓXIMO',
          icon: TrendingUp,
        };
      default:
        return {
          bg: '#d1fae5',
          border: '#10b981',
          text: '#065f46',
          label: 'PROGRAMADO',
          icon: Calendar,
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Calculando servicios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Calendar size={20} color="#00d9ff" />
        <Text style={styles.title}>Próximos Mantenimientos</Text>
      </View>

      {/* Stats rápidas */}
      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Text style={styles.statNumber}>
            {services.filter(s => s.is_overdue).length}
          </Text>
          <Text style={styles.statLabel}>Vencidos</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statNumber}>
            {services.filter(s => s.is_warning && !s.is_overdue).length}
          </Text>
          <Text style={styles.statLabel}>Próximos</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statNumber}>
            {services.filter(s => !s.is_warning && !s.is_overdue).length}
          </Text>
          <Text style={styles.statLabel}>Programados</Text>
        </View>
      </View>

      {/* Lista de servicios */}
      <ScrollView 
        style={styles.servicesList}
        showsVerticalScrollIndicator={false}
      >
        {services.map((service) => {
          const priority = getPriorityColor(service.priority);
          const Icon = priority.icon;

          return (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                { borderLeftColor: priority.border, borderLeftWidth: 4 }
              ]}
              activeOpacity={0.7}
            >
              {/* Icono del servicio */}
              <View style={styles.serviceIcon}>
                <Text style={styles.serviceEmoji}>
                  {getServiceIcon(service.id)}
                </Text>
              </View>

              {/* Info del servicio */}
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                
                <View style={styles.serviceDetails}>
                  {service.is_overdue ? (
                    <Text style={[styles.serviceKm, { color: '#ef4444' }]}>
                      ⚠️ Vencido hace {service.km_until_service.toLocaleString()} km
                    </Text>
                  ) : (
                    <Text style={styles.serviceKm}>
                      En {service.km_until_service.toLocaleString()} km
                    </Text>
                  )}
                  
                  {service.last_service_km > 0 && (
                    <Text style={styles.serviceLastDone}>
                      Último: {service.last_service_km.toLocaleString()} km
                    </Text>
                  )}
                </View>

                {/* Categoría del servicio */}
                <View style={styles.categoryContainer}>
                  <Text style={[styles.categoryBadge, getCategoryStyle(service.category)]}>
                    {getCategoryLabel(service.category)}
                  </Text>
                </View>
              </View>

              {/* Badge de prioridad */}
              <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
                <Icon size={14} color={priority.text} />
                <Text style={[styles.priorityText, { color: priority.text }]}>
                  {priority.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer motivacional */}
      {services.length > 0 && (
        <View style={styles.footer}>
          <CheckCircle size={16} color="#10b981" />
          <Text style={styles.footerText}>
            Mantén tu auto al día y{' '}
            <Text style={styles.footerHighlight}>prevé fallas costosas</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

// Helpers para categorías
function getCategoryLabel(category) {
  const labels = {
    wear: 'Desgaste Normal',
    failure_prevention: 'Prevención de Fallas',
    preventive: 'Preventivo',
  };
  return labels[category] || category;
}

function getCategoryStyle(category) {
  const styles = {
    wear: { backgroundColor: '#dbeafe', color: '#1e40af' },
    failure_prevention: { backgroundColor: '#fee2e2', color: '#991b1b' },
    preventive: { backgroundColor: '#d1fae5', color: '#065f46' },
  };
  return styles[category] || {};
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBadge: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  servicesList: {
    flex: 1,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceEmoji: {
    fontSize: 24,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  serviceDetails: {
    gap: 4,
  },
  serviceKm: {
    fontSize: 14,
    color: '#94a3b8',
  },
  serviceLastDone: {
    fontSize: 12,
    color: '#64748b',
  },
  categoryContainer: {
    marginTop: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
  },
  footerHighlight: {
    fontWeight: '600',
    color: '#10b981',
  },
});