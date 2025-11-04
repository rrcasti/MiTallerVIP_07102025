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
import { 
  ArrowLeft, 
  LayoutDashboard,
  Wrench,
  Award,
  FileText,
  Zap
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Importar componentes existentes
import DashboardSection from '../components/health/DashboardSection';
import MaintenanceSection from '../components/health/MaintenanceSection';
import RewardsSection from '../components/health/RewardsSection';
import HistorySection from '../components/health/HistorySection';

// Importar NUEVOS componentes
import TripTracker from '../components/health/TripTracker';
import DrivingAnalyzer from '../components/health/DrivingAnalyzer';
import AutoTripDetector from '../components/health/AutoTripDetector';

export default function HealthScreen() {
  const { user } = useAuth();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [primaryVehicle, setPrimaryVehicle] = useState(null);
  const [healthData, setHealthData] = useState({
    totalKm: 0,
    kmThisMonth: 0,
    healthScore: 85,
    lastUpdate: new Date().toISOString(),
    diamonds: 0,
    totalServicesLogged: 0,
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
    if (!primaryVehicle?.id) {
        console.warn("loadHealthData llamado sin primaryVehicle.id");
        return; // Salir si no hay ID
    }

    setLoading(true); // Siempre iniciar carga
    let finalHealthData = null; // Variable para guardar los datos a setear

    try {
      console.log('📊 Cargando health data para:', primaryVehicle.id);

      // Usar import estático si es posible, o manejar error del dinámico
      let getVehicleById;
      try {
          const vehicleService = await import('../services/vehicleService');
          getVehicleById = vehicleService.getVehicleById;
      } catch (importError) {
          console.error('❌ Error importando vehicleService:', importError);
          throw new Error("Error interno al cargar datos del vehículo."); // Lanzar error para el catch principal
      }

      const realVehicle = await getVehicleById(primaryVehicle.id);

      if (!realVehicle) {
        console.error('❌ No se encontró el vehículo en Firebase con ID:', primaryVehicle.id);
        throw new Error("No se encontró el vehículo asociado."); // Lanzar error
      }

      const realKm = realVehicle.mileage || realVehicle.currentKm || 0;
      console.log('🚗 KM REAL del vehículo (mileage):', realKm);

      const healthRef = doc(db, 'vehicleHealth', primaryVehicle.id);
      const healthDoc = await getDoc(healthRef);

      if (healthDoc.exists()) {
        const data = healthDoc.data();
        const healthKm = data.currentKm || 0;
        console.log('📊 Health data encontrado');
        const syncedKm = Math.max(healthKm, realKm);

        if (syncedKm !== healthKm) {
          console.log('🔄 Sincronizando KM con vehicle.mileage:', syncedKm);
          await updateDoc(healthRef, {
            currentKm: syncedKm,
            lastUpdate: new Date().toISOString(),
          });
           // Preparamos los datos finales con el KM sincronizado
           finalHealthData = {
             ...data, // Mantenemos otros datos existentes
             totalKm: syncedKm, // <- ¡El valor clave!
             lastUpdate: new Date().toISOString(),
             // Aseguramos valores por defecto
             kmThisMonth: data.kmThisMonth || 0,
             healthScore: data.healthScore || 85,
             diamonds: data.diamonds || 0,
             totalServicesLogged: data.totalServicesLogged || 0,
             lastServices: data.lastServices || {},
             maintenanceHistory: data.maintenanceHistory || [],
             trips: data.trips || [],
             kmHistory: data.kmHistory || [],
           };
        } else {
             // Preparamos los datos finales usando los datos existentes
             finalHealthData = {
                 totalKm: syncedKm, // <- ¡El valor clave!
                 kmThisMonth: data.kmThisMonth || 0,
                 healthScore: data.healthScore || 85,
                 lastUpdate: data.lastUpdate || new Date().toISOString(),
                 diamonds: data.diamonds || 0,
                 totalServicesLogged: data.totalServicesLogged || 0,
                 lastServices: data.lastServices || {},
                 maintenanceHistory: data.maintenanceHistory || [],
                 trips: data.trips || [],
                 kmHistory: data.kmHistory || [],
             };
        }

      } else {
        // --- Crear Documento (Sin Recursión) ---
        console.log('📝 Creando nuevo health data con mileage del vehículo:', realKm);
        const initialKm = realKm;
        const newHealthData = { // Definimos el objeto completo a crear
          currentKm: initialKm,
          kmThisMonth: 0,
          healthScore: 85,
          trackingMode: 'manual',
          lastUpdate: new Date().toISOString(),
          diamonds: 0,
          totalServicesLogged: 0,
          lastServices: {},
          maintenanceHistory: [],
          trips: [],
          totalDistance: 0,
          kmHistory: [{ km: initialKm, date: new Date().toISOString(), source: 'initial_from_vehicle_mileage' }],
        };
        await setDoc(healthRef, newHealthData);
        console.log("✅ Nuevo healthDoc creado.");

        // Preparamos los datos finales usando los datos iniciales
        finalHealthData = {
            totalKm: initialKm, // <- ¡El valor clave!
            kmThisMonth: 0,
            healthScore: 85,
            lastUpdate: newHealthData.lastUpdate,
            diamonds: 0,
            totalServicesLogged: 0,
            lastServices: {},
            maintenanceHistory: [],
            trips: [],
            kmHistory: newHealthData.kmHistory,
        };
      }

      // Solo actualizamos el estado si obtuvimos datos válidos
      if (finalHealthData) {
        setHealthData(finalHealthData);
        console.log("✅ Estado healthData actualizado, totalKm:", finalHealthData.totalKm);
      } else {
         // Esto no debería pasar si la lógica es correcta, pero por si acaso
         throw new Error("No se pudieron determinar los datos finales de salud.");
      }

    } catch (error) {
      console.error('❌ Error crítico en loadHealthData:', error);
      // Podrías setear un estado de error aquí para mostrar en la UI
      // setErrorState(error.message);
      setHealthData(null); // Poner healthData a null si falla la carga indica error
    } finally {
        setLoading(false); // Siempre terminar la carga
    }
  };

  const handleDataUpdate = () => {
    console.log('🔄 Recargando datos...');
    loadHealthData();
  };

  const handlePointsEarned = async (points, reason) => {
    console.log(`💎 +${points} diamantes por: ${reason}`);
    
    try {
      const healthRef = doc(db, 'vehicleHealth', primaryVehicle.id);
      const healthDoc = await getDoc(healthRef);
      
      if (healthDoc.exists()) {
        const currentDiamonds = healthDoc.data().diamonds || 0;
        await updateDoc(healthRef, {
          diamonds: currentDiamonds + points,
          lastUpdate: new Date().toISOString(),
        });
        
        setHealthData(prev => ({
          ...prev,
          diamonds: currentDiamonds + points,
        }));
      }
    } catch (error) {
      console.error('Error updating diamonds:', error);
    }
  };

  const handleTripComplete = (tripData) => {
    console.log('🏁 Viaje completado:', tripData);
    handlePointsEarned(10, 'completar viaje');
    handleDataUpdate();
  };

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      color: '#00d9ff' 
    },
    { 
      id: 'maintenance', 
      label: 'Mantenimiento', 
      icon: Wrench,
      color: '#10b981' 
    },
    { 
      id: 'driving', 
      label: 'Conducción', 
      icon: Zap,
      color: '#f59e0b',
      badge: 'NUEVO'
    },
    { 
      id: 'rewards', 
      label: 'Recompensas', 
      icon: Award,
      color: '#fbbf24' 
    },
    { 
      id: 'history', 
      label: 'Historial', 
      icon: FileText,
      color: '#8b5cf6' 
    },
  ];

  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color="#00d9ff" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </SafeAreaView>
    );
  }

  if (!primaryVehicle) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['left', 'right', 'bottom']}>
        <Text style={styles.emptyText}>No tienes vehículos registrados</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push('/vehicles')}
        >
          <Text style={styles.emptyButtonText}>Agregar Vehículo</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header - SIN padding top extra */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Vehicle Health</Text>
          <Text style={styles.headerSubtitle}>
            {primaryVehicle.brand} {primaryVehicle.model}
          </Text>
        </View>
        <View style={styles.diamondsContainer}>
          <Text style={styles.diamondsText}>💎 {healthData.diamonds}</Text>
        </View>
      </View>

      {/* Tabs - Reducido tamaño */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isActive && { backgroundColor: `${tab.color}20`, borderColor: tab.color }
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Icon 
                size={16} 
                color={isActive ? tab.color : '#64748b'} 
              />
              <Text style={[
                styles.tabText,
                isActive && { color: tab.color }
              ]}>
                {tab.label}
              </Text>
              {tab.badge && (
                <View style={styles.badgeNew}>
                  <Text style={styles.badgeNewText}>{tab.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'dashboard' && (
          <DashboardSection
            healthData={healthData}
            primaryVehicle={primaryVehicle}
            onDataUpdate={handleDataUpdate}
            onPointsEarned={handlePointsEarned}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceSection
            vehicle={primaryVehicle}
            healthData={healthData}
            onPointsEarned={handlePointsEarned}
            onDataUpdate={handleDataUpdate}
          />
        )}

        {activeTab === 'driving' && (
          <ScrollView 
            style={styles.drivingContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.drivingHeader}>
              <Zap size={22} color="#f59e0b" />
              <Text style={styles.drivingTitle}>Análisis de Conducción</Text>
            </View>

            <View style={styles.drivingBanner}>
              <Text style={styles.drivingBannerText}>
                ⚡ Graba tus viajes para ver análisis detallado de tu conducción
              </Text>
            </View>
            
            <View style={styles.analyzerSection}>
               <Text style={styles.analyzerTitle}>
                 📍 Detección Automática de Viajes
               </Text>
               <AutoTripDetector
                 vehicleId={primaryVehicle?.id}
                 onTripUpdate={handleDataUpdate}
               />
            </View>

            <TripTracker
              vehicleId={primaryVehicle.id}
              onTripComplete={handleTripComplete}
            />

            <View style={styles.analyzerSection}>
              <Text style={styles.analyzerTitle}>
                📊 Patrones de Conducción Detectados
              </Text>
              <DrivingAnalyzer vehicleId={primaryVehicle.id} />
            </View>
          </ScrollView>
        )}

{activeTab === 'rewards' && (
  // 👇 CORREGIR ESTA LÍNEA 👇
  <RewardsSection
    vehicleId={primaryVehicle?.id} // <-- Pasar el ID del vehículo
    // healthData={healthData} // Opcional: Podrías pasarle healthData si lo necesita
  />
  // 👆 FIN DE LA CORRECCIÓN 👆
)}

        {activeTab === 'history' && (
          <HistorySection
            vehicle={primaryVehicle}
            healthData={healthData}
            onPointsEarned={handlePointsEarned}
            onDataUpdate={handleDataUpdate}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#00d9ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2749',
    backgroundColor: '#0f172a',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  diamondsContainer: {
    backgroundColor: '#141b3d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#00d9ff',
  },
  diamondsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabsScroll: {
    maxHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2749',
    backgroundColor: '#0f172a',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#141b3d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e2749',
    marginRight: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  badgeNew: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 3,
  },
  badgeNewText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  drivingContainer: {
    flex: 1,
    padding: 16,
  },
  drivingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  drivingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  drivingBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  drivingBannerText: {
    color: '#fbbf24',
    fontSize: 13,
    lineHeight: 18,
  },
  analyzerSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  analyzerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
});