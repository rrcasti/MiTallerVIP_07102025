// RUTA: app/health.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Edit3, TrendingUp, Activity, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import CircularGauge from '../components/health/CircularGauge';
import ManualTracking from '../components/health/ManualTracking';
import AIInsights from '../components/health/AIInsights';

export default function HealthScreen() {
  const { user } = useAuth();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const [mode, setMode] = useState('manual');
  const [loading, setLoading] = useState(true);
  const [primaryVehicle, setPrimaryVehicle] = useState(null);
  const [healthData, setHealthData] = useState({
    totalKm: 0,
    kmThisMonth: 0,
    healthScore: 85,
    lastUpdate: new Date().toISOString(),
  });

  useEffect(() => {
    if (vehicles.length > 0) {
      console.log('🚗 Vehículo detectado:', vehicles[0]);
      setPrimaryVehicle(vehicles[0]);
    }
  }, [vehicles]);

  useEffect(() => {
    if (primaryVehicle?.id) {
      loadHealthData();
    }
  }, [primaryVehicle]);

  const loadHealthData = async () => {
    if (!primaryVehicle?.id) return;

    setLoading(true);
    try {
      console.log('📊 Cargando health data para:', primaryVehicle.id);
      
      const healthDoc = await getDoc(
        doc(db, 'vehicleHealth', primaryVehicle.id)
      );

      if (healthDoc.exists()) {
        const data = healthDoc.data();
        console.log('✅ Health data encontrado:', data);
        setHealthData({
          totalKm: data.currentKm || 0,
          kmThisMonth: data.kmThisMonth || 0,
          healthScore: data.healthScore || 85,
          lastUpdate: data.lastUpdate || new Date().toISOString(),
        });
        setMode(data.trackingMode || 'manual');
      } else {
        console.log('📝 Creando nuevo documento de health...');
        await setDoc(doc(db, 'vehicleHealth', primaryVehicle.id), {
          currentKm: primaryVehicle.currentKm || 0,
          kmThisMonth: 0,
          healthScore: 85,
          trackingMode: 'manual',
          lastUpdate: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('❌ Error loading health data:', error);
    }
    setLoading(false);
  };

  const handleModeChange = async (newMode) => {
    setMode(newMode);
    
    if (primaryVehicle?.id) {
      try {
        await updateDoc(doc(db, 'vehicleHealth', primaryVehicle.id), {
          trackingMode: newMode,
          lastUpdate: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error updating mode:', error);
      }
    }
  };

  if (vehiclesLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d9ff" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!primaryVehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Activity size={64} color="#666" />
          <Text style={styles.emptyTitle}>No hay vehículo registrado</Text>
          <Text style={styles.emptyText}>
            Agrega un vehículo para comenzar a trackear su salud
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/vehicles/new')}
          >
            <Text style={styles.emptyButtonText}>Agregar Vehículo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Health</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {`${primaryVehicle.brand} ${primaryVehicle.model}`}
          </Text>
          <Text style={styles.vehiclePlate}>{primaryVehicle.license_plate}</Text>
        </View>

        <View style={styles.gaugeContainer}>
          <CircularGauge 
            value={healthData.healthScore}  
            max={100}
            size={200}
          />
        </View>

        <View style={styles.modeSelector}>
          <Text style={styles.modeSelectorTitle}>Modo de Tracking</Text>
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'gps' && styles.modeButtonActive]}
              onPress={() => handleModeChange('gps')}
            >
              <MapPin size={20} color={mode === 'gps' ? '#00d9ff' : '#64748B'} />
              <Text style={[styles.modeButtonText, mode === 'gps' && styles.modeButtonTextActive]}>
                GPS Auto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
              onPress={() => handleModeChange('manual')}
            >
              <Edit3 size={20} color={mode === 'manual' ? '#00d9ff' : '#64748B'} />
              <Text style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextActive]}>
                Manual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, mode === 'estimated' && styles.modeButtonActive]}
              onPress={() => handleModeChange('estimated')}
            >
              <TrendingUp size={20} color={mode === 'estimated' ? '#00d9ff' : '#64748B'} />
              <Text style={[styles.modeButtonText, mode === 'estimated' && styles.modeButtonTextActive]}>
                Estimado
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{healthData.totalKm.toLocaleString()}</Text>
            <Text style={styles.statLabel}>km Totales</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{healthData.kmThisMonth.toLocaleString()}</Text>
            <Text style={styles.statLabel}>km este Mes</Text>
          </View>
        </View>

        {mode === 'manual' && (
          <ManualTracking 
            healthData={healthData}
            vehicleId={primaryVehicle.id}
            onUpdate={loadHealthData}
          />
        )}

        <AIInsights 
          vehicleData={primaryVehicle}
          healthData={healthData}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#00d9ff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  vehicleInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  vehicleName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 16,
    color: '#94A3B8',
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  modeSelector: {
    marginBottom: 24,
  },
  modeSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#00d9ff22',
    borderColor: '#00d9ff',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modeButtonTextActive: {
    color: '#00d9ff',
  },
});