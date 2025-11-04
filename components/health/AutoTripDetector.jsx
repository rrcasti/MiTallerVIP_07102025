import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Modal,
  ScrollView 
} from 'react-native';
import * as Location from 'expo-location';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  Car, 
  Zap, 
  Circle, 
  MapPin, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react-native';

/**
 * 🚗 DETECTOR AUTOMÁTICO DE VIAJES (SOLO GPS)
 * Sin acelerómetro - detecta por velocidad GPS
 */
export default function AutoTripDetector({ vehicleId, onTripUpdate }) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [tripSummary, setTripSummary] = useState(null);

  const locationSubscription = useRef(null);
  const monitoringSubscription = useRef(null);
  const previousLocation = useRef(null);
  const stoppedCounter = useRef(0);
  const previousSpeed = useRef(0);

  useEffect(() => {
    console.log('🔍 Iniciando detector GPS...');
    startAutoDetection();

    return () => {
      stopAllTracking();
    };
  }, []);

  const startAutoDetection = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso GPS Requerido',
        'Necesitamos GPS para detectar viajes'
      );
      return;
    }

    console.log('✅ GPS activo, monitoreando...');

    try {
      monitoringSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          checkForMovement(location);
        }
      );
    } catch (error) {
      console.error('Error iniciando GPS:', error);
    }
  };

  const checkForMovement = (location) => {
    const currentSpeed = (location.coords.speed || 0) * 3.6;
    
    if (currentSpeed > 10 && !isTracking) {
      console.log('🚗 Movimiento detectado (velocidad > 10 km/h)');
      startTripAutomatically(location);
    }
  };

  const startTripAutomatically = async (initialLocation) => {
    if (isTracking) return;

    console.log('🚗 ¡VIAJE INICIADO!');
    setIsTracking(true);
    stoppedCounter.current = 0;
    previousSpeed.current = 0;
    previousLocation.current = initialLocation;

    const newTrip = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      distance: 0,
      maxSpeed: 0,
      avgSpeed: 0,
      harshBrakes: 0,
      harshAccelerations: 0,
      idleTime: 0,
      speedReadings: [],
      locations: [{
        lat: initialLocation.coords.latitude,
        lng: initialLocation.coords.longitude,
        speed: (initialLocation.coords.speed || 0) * 3.6,
        timestamp: new Date().toISOString(),
      }],
    };

    setCurrentTrip(newTrip);
    setDistance(0);

    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (location) => {
          processLocation(location);
        }
      );
    } catch (error) {
      console.error('Error tracking:', error);
      setIsTracking(false);
    }
  };

  const processLocation = (location) => {
    const currentSpeed = (location.coords.speed || 0) * 3.6;
    setSpeed(currentSpeed);

    const speedDiff = currentSpeed - previousSpeed.current;
    
    if (speedDiff < -15 && currentSpeed > 0 && currentTrip) {
      setCurrentTrip(prev => ({
        ...prev,
        harshBrakes: prev.harshBrakes + 1,
      }));
      console.log('🔴 Frenada brusca!');
    }
    
    if (speedDiff > 15 && currentTrip) {
      setCurrentTrip(prev => ({
        ...prev,
        harshAccelerations: prev.harshAccelerations + 1,
      }));
      console.log('⚡ Aceleración agresiva!');
    }

    if (previousLocation.current && currentTrip) {
      const distanceIncrement = calculateDistance(
        previousLocation.current.coords.latitude,
        previousLocation.current.coords.longitude,
        location.coords.latitude,
        location.coords.longitude
      );

      setCurrentTrip(prev => {
        const newDistance = prev.distance + distanceIncrement;
        const newSpeedReadings = [...prev.speedReadings, currentSpeed];
        const newLocations = [...prev.locations, {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          speed: currentSpeed,
          timestamp: new Date().toISOString(),
        }];

        return {
          ...prev,
          distance: newDistance,
          maxSpeed: Math.max(prev.maxSpeed, currentSpeed),
          speedReadings: newSpeedReadings,
          avgSpeed: newSpeedReadings.reduce((a, b) => a + b, 0) / newSpeedReadings.length,
          locations: newLocations,
        };
      });

      setDistance(prev => prev + distanceIncrement);
    }

    if (currentSpeed < 5) {
      stoppedCounter.current += 1;
      
      if (stoppedCounter.current >= 300) { // 5 minutos
        console.log('⏹️ Vehículo detenido por 5+ min, finalizando viaje');
        finalizeTripAutomatically();
      }
    } else {
      stoppedCounter.current = 0;
    }

    previousLocation.current = location;
    previousSpeed.current = currentSpeed;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const finalizeTripAutomatically = async () => {
    if (!currentTrip || !isTracking) return;
  
    console.log('🏁 Finalizando viaje automáticamente...');
    
    const endTime = new Date().toISOString();
    const duration = (new Date(endTime) - new Date(currentTrip.startTime)) / 1000 / 60;
    const avgSpeedCalc = currentTrip.speedReadings.length > 0
      ? currentTrip.speedReadings.reduce((a, b) => a + b, 0) / currentTrip.speedReadings.length
      : 0;
  
    const finalTrip = {
      ...currentTrip,
      endTime,
      duration: Math.round(duration),
      distance: parseFloat(distance.toFixed(2)),
      avgSpeed: parseFloat(avgSpeedCalc.toFixed(1)),
    };
  
    try {
      // 1. Importar el servicio de vehículos
      const { getVehicleById, updateVehicle } = await import('../../services/vehicleService');
      
      // 2. Obtener el vehículo REAL
      const realVehicle = await getVehicleById(vehicleId);
      
      if (!realVehicle) {
        console.error('❌ No se encontró el vehículo');
        return;
      }
      
      // 3. Obtener KM REAL actual (mileage es tu campo principal)
      const currentKm = realVehicle.mileage || realVehicle.currentKm || 0;
      const newTotalKm = currentKm + distance; // ✅ SUMAR distancia recorrida
      
      console.log('📊 Actualizando kilometraje del vehículo:');
      console.log('  - Mileage anterior:', currentKm);
      console.log('  - KM recorridos (viaje):', distance.toFixed(2));
      console.log('  - Mileage nuevo:', newTotalKm.toFixed(2));
  
      // 4. Actualizar el VEHÍCULO (ambos campos: mileage y currentKm)
      await updateVehicle(vehicleId, {
        mileage: newTotalKm, // ✅ Campo principal
        currentKm: newTotalKm, // ✅ Mantener sincronizado
        lastKmUpdate: new Date().toISOString(),
      });
  
      // 5. Actualizar healthData también
      const healthRef = doc(db, 'vehicleHealth', vehicleId);
      const healthSnap = await getDoc(healthRef);
      
      if (healthSnap.exists()) {
        const currentData = healthSnap.data();
        
        await updateDoc(healthRef, {
          currentKm: newTotalKm, // ✅ MISMO valor
          lastUpdate: new Date().toISOString(),
          trips: arrayUnion(finalTrip),
          totalDistance: (currentData.totalDistance || 0) + distance,
          lastTripDate: endTime,
          lastTripDistance: distance,
        });
      }
  
      console.log('✅ Kilometraje actualizado: mileage y health sincronizados');
  
      setTripSummary(finalTrip);
      setShowSummary(true);
  
      if (onTripUpdate) {
        onTripUpdate();
      }
    } catch (error) {
      console.error('❌ Error saving trip:', error);
      Alert.alert('Error', 'No se pudo guardar el viaje');
    }
  
    stopAllTracking();
    setIsTracking(false);
    setCurrentTrip(null);
    setDistance(0);
    stoppedCounter.current = 0;
  };

  const stopAllTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (monitoringSubscription.current) {
      monitoringSubscription.current.remove();
      monitoringSubscription.current = null;
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  };

  return (
    <View style={styles.container}>
      {/* Estado del Detector */}
      <View style={[
        styles.statusCard,
        isTracking ? styles.statusActive : styles.statusIdle
      ]}>
        <View style={styles.statusHeader}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isTracking ? '#10b981' : '#64748b' }
          ]} />
          <Text style={styles.statusTitle}>
            {isTracking ? '🚗 Viaje en curso' : '📡 Esperando movimiento...'}
          </Text>
        </View>

        {isTracking && currentTrip && (
          <View style={styles.tripStats}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Velocidad</Text>
                <Text style={styles.statValue}>{Math.round(speed)} km/h</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Distancia</Text>
                <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Frenadas 🔴</Text>
                <Text style={styles.statValue}>{currentTrip.harshBrakes}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Aceleraciones ⚡</Text>
                <Text style={styles.statValue}>{currentTrip.harshAccelerations}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.finishButton}
              onPress={finalizeTripAutomatically}
            >
              <CheckCircle size={18} color="#fff" />
              <Text style={styles.finishButtonText}>Finalizar Viaje</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal de Resumen */}
      <Modal
        visible={showSummary}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <CheckCircle size={32} color="#10b981" />
              <Text style={styles.modalTitle}>¡Viaje Completado!</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSummary(false)}
              >
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.summaryContent}>
              {tripSummary && (
                <>
                  <View style={styles.summaryRow}>
                    <MapPin size={20} color="#00d9ff" />
                    <Text style={styles.summaryLabel}>Distancia Total</Text>
                    <Text style={styles.summaryValue}>
                      {tripSummary.distance.toFixed(2)} km
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Clock size={20} color="#00d9ff" />
                    <Text style={styles.summaryLabel}>Duración</Text>
                    <Text style={styles.summaryValue}>
                      {formatDuration(tripSummary.duration)}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <TrendingUp size={20} color="#00d9ff" />
                    <Text style={styles.summaryLabel}>Vel. Máxima</Text>
                    <Text style={styles.summaryValue}>
                      {Math.round(tripSummary.maxSpeed)} km/h
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Zap size={20} color="#00d9ff" />
                    <Text style={styles.summaryLabel}>Vel. Promedio</Text>
                    <Text style={styles.summaryValue}>
                      {Math.round(tripSummary.avgSpeed)} km/h
                    </Text>
                  </View>

                  {(tripSummary.harshBrakes > 0 || tripSummary.harshAccelerations > 0) && (
                    <View style={styles.alertsSection}>
                      <Text style={styles.alertsTitle}>Patrones Detectados</Text>
                      {tripSummary.harshBrakes > 0 && (
                        <View style={styles.alertRow}>
                          <Text style={styles.alertIcon}>🔴</Text>
                          <Text style={styles.alertText}>
                            {tripSummary.harshBrakes} frenada(s) brusca(s)
                          </Text>
                        </View>
                      )}
                      {tripSummary.harshAccelerations > 0 && (
                        <View style={styles.alertRow}>
                          <Text style={styles.alertIcon}>⚡</Text>
                          <Text style={styles.alertText}>
                            {tripSummary.harshAccelerations} aceleración(es) agresiva(s)
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.successFooter}>
                    <Text style={styles.successText}>
                      ✅ Kilometraje actualizado correctamente
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setShowSummary(false)}
            >
              <Text style={styles.confirmButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  statusIdle: {
    backgroundColor: '#141b3d',
    borderColor: '#1e2749',
  },
  statusActive: {
    backgroundColor: '#0f2e1e',
    borderColor: '#10b981',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  tripStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00d9ff',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  finishButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#141b3d',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  summaryContent: {
    maxHeight: 400,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2749',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  alertsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#1e1b1b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    fontSize: 13,
    color: '#fca5a5',
  },
  successFooter: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0f2e1e',
    borderRadius: 8,
  },
  successText: {
    fontSize: 13,
    color: '#10b981',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#00d9ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});