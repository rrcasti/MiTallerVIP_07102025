// RUTA: components/health/MaintenanceSection.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Wrench, Calendar, TrendingUp } from 'lucide-react-native';
import MaintenanceLogger from './MaintenanceLogger';
import ServiceTracker from './ServiceTracker';

/**
 * COMPONENTE: MaintenanceSection
 * 
 * Vista principal de mantenimiento con 2 tabs:
 * 1. REGISTRAR - MaintenanceLogger
 * 2. PRÓXIMOS - ServiceTracker
 */
export default function MaintenanceSection({ 
  vehicle, 
  healthData, 
  onPointsEarned, 
  onDataUpdate 
}) {
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'upcoming'

  const handleServiceLogged = () => {
    // Cuando registra un servicio:
    // 1. Otorgar puntos
    if (onPointsEarned) {
      onPointsEarned(15, 'registrar servicio');
    }
    
    // 2. Recargar datos
    if (onDataUpdate) {
      onDataUpdate();
    }

    // 3. Cambiar a tab "Próximos" para ver el resultado
    setTimeout(() => {
      setActiveTab('upcoming');
    }, 1500);
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Wrench size={24} color="#00d9ff" />
        <Text style={styles.title}>Mantenimiento</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'register' && styles.tabActive
          ]}
          onPress={() => setActiveTab('register')}
          activeOpacity={0.7}
        >
          <Wrench 
            size={18} 
            color={activeTab === 'register' ? '#00d9ff' : '#64748b'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'register' && styles.tabTextActive
          ]}>
            Registrar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'upcoming' && styles.tabActive
          ]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.7}
        >
          <Calendar 
            size={18} 
            color={activeTab === 'upcoming' ? '#00d9ff' : '#64748b'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'upcoming' && styles.tabTextActive
          ]}>
            Próximos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'register' ? (
          <View style={styles.tabPanel}>
            <MaintenanceLogger
              vehicleId={vehicle?.id}
              currentKm={healthData.totalKm || 0}
              onServiceLogged={handleServiceLogged}
            />
          </View>
        ) : (
          <View style={styles.tabPanel}>
            <ServiceTracker
              vehicleId={vehicle?.id}
              currentKm={healthData.totalKm || 0}
            />
          </View>
        )}
      </View>

      {/* Footer motivacional */}
      <View style={styles.footer}>
        <View style={styles.footerCard}>
          <TrendingUp size={20} color="#10b981" />
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>
              🎯 Objetivo: Salud Perfecta
            </Text>
            <Text style={styles.footerText}>
              Mantén todos los servicios al día y tu vehículo mantendrá su valor
            </Text>
          </View>
        </View>

        {/* Stats de progreso */}
        <View style={styles.progressStats}>
          <View style={styles.progressItem}>
            <Text style={styles.progressNumber}>
              {healthData.healthScore || 85}%
            </Text>
            <Text style={styles.progressLabel}>Health Score</Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressItem}>
            <Text style={styles.progressNumber}>
              {healthData.totalKm?.toLocaleString() || '0'} km
            </Text>
            <Text style={styles.progressLabel}>Recorridos</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    borderColor: '#00d9ff',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#00d9ff',
  },
  tabContent: {
    flex: 1,
    minHeight: 400,
  },
  tabPanel: {
    flex: 1,
  },
  footer: {
    marginTop: 32,
    gap: 16,
  },
  footerCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  footerTextContainer: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  progressStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  progressDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
});