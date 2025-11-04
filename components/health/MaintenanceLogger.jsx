// RUTA: components/health/MaintenanceLogger.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Check, Droplet, Wind, Disc, Battery, Wrench, Sparkles } from 'lucide-react-native';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MAINTENANCE_INTERVALS } from './maintenanceSchedule';

/**
 * COMPONENTE: MaintenanceLogger
 * 
 * Permite registrar servicios realizados con 1 CLICK
 * Integrado con tu maintenanceSchedule.js existente
 */
export default function MaintenanceLogger({ vehicleId, currentKm, onServiceLogged }) {
  const [saving, setSaving] = useState(null);
  const [totalServices, setTotalServices] = useState(0);

  // Servicios más comunes para registro rápido
  const quickServices = [
    { 
      id: 'oil_change', 
      ...MAINTENANCE_INTERVALS.oil_change,
      icon: Droplet,
      color: '#00d9ff',
    },
    { 
      id: 'air_filter', 
      ...MAINTENANCE_INTERVALS.air_filter,
      icon: Wind,
      color: '#10b981',
    },
    { 
      id: 'brake_pads', 
      ...MAINTENANCE_INTERVALS.brake_pads,
      icon: Disc,
      color: '#f59e0b',
    },
    { 
      id: 'battery_check', 
      ...MAINTENANCE_INTERVALS.battery_check,
      icon: Battery,
      color: '#8b5cf6',
    },
    { 
      id: 'general_inspection', 
      ...MAINTENANCE_INTERVALS.general_inspection,
      icon: Wrench,
      color: '#ec4899',
    },
  ];

  const handleLogService = async (service) => {
    setSaving(service.id);

    try {
      console.log(`📝 Registrando servicio: ${service.name}`);

      const now = new Date().toISOString();
      const serviceRecord = {
        service_id: service.id,
        service_name: service.name,
        km: currentKm,
        date: now,
        next_service_km: currentKm + service.interval_km,
        category: service.category,
        urgency: service.urgency,
      };

      // Guardar en Firebase
      const healthRef = doc(db, 'vehicleHealth', vehicleId);
      
      // Obtener documento actual
      const healthDoc = await getDoc(healthRef);
      const currentData = healthDoc.exists() ? healthDoc.data() : {};
      const currentDiamonds = currentData.diamonds || 0;

      await updateDoc(healthRef, {
        [`lastServices.${service.id}`]: currentKm,
        maintenanceHistory: arrayUnion(serviceRecord),
        lastUpdate: now,
        totalServicesLogged: (currentData.totalServicesLogged || 0) + 1,
        diamonds: currentDiamonds + 15, // +15 diamantes por servicio
      });

      console.log('✅ Servicio registrado exitosamente');

      // Mensaje personalizado según categoría
      let categoryMessage = '';
      if (service.category === 'failure_prevention') {
        categoryMessage = '🛡️ Este servicio PREVIENE fallas costosas. ¡Excelente decisión!';
      } else if (service.category === 'wear') {
        categoryMessage = '🔧 Mantenimiento de desgaste normal completado.';
      } else {
        categoryMessage = '✨ Servicio preventivo registrado.';
      }

      Alert.alert(
        '✅ ¡Registrado!',
        `${service.name} registrado a los ${currentKm.toLocaleString()} km.\n\n${categoryMessage}\n\n💎 +15 Diamantes ganados!\n\nPróximo servicio: ${(currentKm + service.interval_km).toLocaleString()} km`,
        [{ text: 'Entendido' }]
      );

      // Actualizar contador local
      setTotalServices(prev => (prev || 0) + 1);

      // Notificar al componente padre
      if (onServiceLogged) {
        onServiceLogged();
      }

    } catch (error) {
      console.error('❌ Error registrando servicio:', error);
      Alert.alert('Error', 'No se pudo registrar el servicio. Intenta nuevamente.');
    }

    setSaving(null);
  };

  // Cargar total de servicios al montar
  React.useEffect(() => {
    const loadServiceCount = async () => {
      try {
        const healthDoc = await getDoc(doc(db, 'vehicleHealth', vehicleId));
        if (healthDoc.exists()) {
          setTotalServices(healthDoc.data().totalServicesLogged || 0);
        }
      } catch (error) {
        console.error('Error loading service count:', error);
      }
    };

    loadServiceCount();
  }, [vehicleId]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Check size={20} color="#00d9ff" />
          <Text style={styles.title}>Registrar Mantenimiento</Text>
        </View>
        <View style={styles.badge}>
          <Sparkles size={14} color="#fbbf24" />
          <Text style={styles.badgeText}>{totalServices || 0}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Toca el servicio que acabas de realizar
      </Text>

      {/* Motivación */}
      {totalServices < 3 && (
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            💡 <Text style={styles.motivationBold}>Consejo Pro:</Text> Con {3 - totalServices} registros más, 
            podremos predecir tu próximo mantenimiento con 95% de precisión
          </Text>
        </View>
      )}

      {totalServices >= 3 && (
        <View style={[styles.motivationCard, styles.motivationSuccess]}>
          <Text style={styles.motivationText}>
            🎉 ¡Excelente! Ya tenemos suficientes datos para análisis predictivos precisos
          </Text>
        </View>
      )}

      {/* Botones de servicios */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.servicesScroll}
        contentContainerStyle={styles.servicesContent}
      >
        {quickServices.map(service => {
          const Icon = service.icon;
          const isSaving = saving === service.id;
          const isCritical = service.category === 'failure_prevention';

          return (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceButton,
                { borderColor: service.color },
                isCritical && styles.serviceButtonCritical
              ]}
              onPress={() => handleLogService(service)}
              disabled={isSaving}
            >
              {isCritical && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalBadgeText}>CRÍTICO</Text>
                </View>
              )}
              
              <View style={[styles.serviceIcon, { backgroundColor: `${service.color}20` }]}>
                <Icon size={24} color={service.color} />
              </View>
              
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceInterval}>c/ {service.interval_km.toLocaleString()} km</Text>
              
              {isSaving && (
                <View style={styles.savingOverlay}>
                  <Text style={styles.savingText}>Guardando...</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Info */}
      <Text style={styles.infoText}>
        📊 La app guarda automáticamente la fecha y kilometraje actual
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00d9ff33',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fbbf2420',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 14,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 12,
  },
  motivationCard: {
    backgroundColor: '#1e40af20',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  motivationSuccess: {
    backgroundColor: '#10b98120',
    borderLeftColor: '#10b981',
  },
  motivationText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  motivationBold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  servicesScroll: {
    marginBottom: 12,
  },
  servicesContent: {
    gap: 12,
    paddingRight: 16,
  },
  serviceButton: {
    width: 120,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  serviceButtonCritical: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  criticalBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  criticalBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceInterval: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172Aee',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    color: '#00d9ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});