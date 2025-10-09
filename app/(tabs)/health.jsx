// RUTA: app/(tabs)/health.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthTracking } from '../../context/HealthTrackingContext';
import { Activity, Camera, TrendingUp } from 'lucide-react-native';
import * as Location from 'expo-location';
import AutoTracking from '../../components/health/AutoTracking';
import ManualTracking from '../../components/health/ManualTracking';
import EstimatedTracking from '../../components/health/EstimatedTracking';
import PermissionOnboarding from '../../components/health/PermissionOnboarding';

export default function HealthDashboard() {
  const { healthData, isLoading } = useHealthTracking();
  const [trackingMode, setTrackingMode] = useState('checking'); // 'gps', 'manual', 'estimated', 'checking', 'onboarding'
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkTrackingMode();
  }, []);

  const checkTrackingMode = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status === 'granted') {
      setHasPermission(true);
      setTrackingMode('gps');
    } else {
      // Verificar si tiene datos manuales guardados
      const hasManualData = healthData.totalKm > 0;
      
      if (hasManualData) {
        setTrackingMode('manual');
      } else {
        setTrackingMode('onboarding'); // Mostrar pantalla de bienvenida
      }
    }
  };

  const handleEnableGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      setHasPermission(true);
      setTrackingMode('gps');
    } else {
      Alert.alert(
        'Permisos denegados',
        '¿Prefieres ingresar los kilómetros manualmente?',
        [
          { text: 'Sí, ingreso manual', onPress: () => setTrackingMode('manual') },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  const handleSkipToManual = () => {
    setTrackingMode('manual');
  };

  if (trackingMode === 'checking') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
        <Text style={styles.loadingText}>Inicializando Health Check...</Text>
      </View>
    );
  }

  if (trackingMode === 'onboarding') {
    return (
      <PermissionOnboarding
        onEnableGPS={handleEnableGPS}
        onSkipToManual={handleSkipToManual}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Premium */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Health Check</Text>
            <TouchableOpacity style={styles.modeButton}>
              <Activity size={20} color="#00d9ff" />
              <Text style={styles.modeText}>
                {trackingMode === 'gps' ? 'AUTO' : 
                 trackingMode === 'manual' ? 'MANUAL' : 'EST.'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            Sistema Inteligente de Monitoreo
          </Text>
        </View>

        {/* Renderizar según modo */}
        {trackingMode === 'gps' && (
          <AutoTracking healthData={healthData} />
        )}

        {trackingMode === 'manual' && (
          <ManualTracking 
            healthData={healthData}
            onSwitchToGPS={handleEnableGPS}
          />
        )}

        {trackingMode === 'estimated' && (
          <EstimatedTracking 
            healthData={healthData}
            onSwitchToManual={() => setTrackingMode('manual')}
          />
        )}

        {/* Botón para cambiar modo */}
        <View style={styles.switchModeContainer}>
          <Text style={styles.switchModeLabel}>Modo de tracking:</Text>
          <View style={styles.switchModeButtons}>
            {!hasPermission && (
              <TouchableOpacity
                style={[
                  styles.switchButton,
                  trackingMode === 'gps' && styles.switchButtonActive
                ]}
                onPress={handleEnableGPS}
              >
                <Text style={styles.switchButtonText}>GPS Auto</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.switchButton,
                trackingMode === 'manual' && styles.switchButtonActive
              ]}
              onPress={() => setTrackingMode('manual')}
            >
              <Text style={styles.switchButtonText}>Manual</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00d9ff',
  },
  modeText: {
    color: '#00d9ff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  switchModeContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  switchModeLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 12,
  },
  switchModeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#00d9ff22',
    borderColor: '#00d9ff',
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});