//components/health/TripTracker.jsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Play, Square, MapPin, Clock } from 'lucide-react-native';
import * as Location from 'expo-location';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * COMPONENTE: TripTracker
 * 
 * Graba viajes automáticamente:
 * - Velocidad instantánea
 * - Distancia recorrida
 * - Aceleraciones/frenadas
 * - Tiempo en ralentí
 * - Patrones de conducción
 */
export default function TripTracker({ vehicleId, onTripComplete }) {
  const [tracking, setTracking] = useState(false);
  const [tripData, setTripData] = useState({
    startTime: null,
    endTime: null,
    distance: 0,
    maxSpeed: 0,
    avgSpeed: 0,
    harshBrakes: 0,
    harshAccelerations: 0,
    idleTime: 0,
    speedReadings: [],
    locations: [],
  });
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Variables para cálculos
  let locationSubscription = null;
  let previousSpeed = 0;
  let previousLocation = null;
  let idleTimeCounter = 0;

  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Timer para tiempo transcurrido
  useEffect(() => {
    let interval;
    if (tracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [tracking]);

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Denegado', 'Necesitamos acceso al GPS para grabar el viaje');
      return false;
    }
    return true;
  };

  const startTrip = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setTracking(true);
    setElapsedTime(0);
    setTripData({
      startTime: new Date().toISOString(),
      endTime: null,
      distance: 0,
      maxSpeed: 0,
      avgSpeed: 0,
      harshBrakes: 0,
      harshAccelerations: 0,
      idleTime: 0,
      speedReadings: [],
      locations: [],
    });

    console.log('🚗 Viaje iniciado');

    // Suscribirse a actualizaciones de ubicación
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000, // Actualizar cada segundo
        distanceInterval: 1, // O cada metro
      },
      (location) => {
        processLocationUpdate(location);
      }
    );
  };

  const processLocationUpdate = (location) => {
    const speed = location.coords.speed || 0; // m/s
    const speedKmh = speed * 3.6; // Convertir a km/h

    setCurrentSpeed(speedKmh);

    // Calcular aceleración
    const acceleration = speed - previousSpeed; // m/s²

    // Detectar frenada brusca
    if (acceleration < -3) { // Desaceleración mayor a 3 m/s²
      setTripData(prev => ({
        ...prev,
        harshBrakes: prev.harshBrakes + 1,
      }));
      console.log('🔴 Frenada brusca detectada!');
    }

    // Detectar aceleración agresiva
    if (acceleration > 3) {
      setTripData(prev => ({
        ...prev,
        harshAccelerations: prev.harshAccelerations + 1,
      }));
      console.log('⚡ Aceleración agresiva detectada!');
    }

    // Detectar ralentí (velocidad < 5 km/h)
    if (speedKmh < 5) {
      idleTimeCounter++;
    } else {
      if (idleTimeCounter > 0) {
        setTripData(prev => ({
          ...prev,
          idleTime: prev.idleTime + idleTimeCounter,
        }));
        idleTimeCounter = 0;
      }
    }

    // Calcular distancia recorrida
    if (previousLocation) {
      const distance = calculateDistance(
        previousLocation.coords.latitude,
        previousLocation.coords.longitude,
        location.coords.latitude,
        location.coords.longitude
      );

      setTripData(prev => ({
        ...prev,
        distance: prev.distance + distance,
        maxSpeed: Math.max(prev.maxSpeed, speedKmh),
        speedReadings: [...prev.speedReadings, speedKmh],
        locations: [...prev.locations, {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          speed: speedKmh,
          timestamp: new Date().toISOString(),
        }],
      }));
    }

    previousSpeed = speed;
    previousLocation = location;
  };

  // Fórmula de Haversine para calcular distancia entre 2 puntos GPS
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
  };

  const stopTrip = async () => {
    if (locationSubscription) {
      locationSubscription.remove();
    }

    const endTime = new Date().toISOString();
    const avgSpeed = tripData.speedReadings.length > 0
      ? tripData.speedReadings.reduce((a, b) => a + b, 0) / tripData.speedReadings.length
      : 0;

    const finalTripData = {
      ...tripData,
      endTime,
      avgSpeed: Math.round(avgSpeed),
      duration: elapsedTime,
    };

    setTripData(finalTripData);
    setTracking(false);

    console.log('🏁 Viaje finalizado:', finalTripData);

    // Guardar en Firebase
    await saveTripToFirebase(finalTripData);

    // Callback
    if (onTripComplete) {
      onTripComplete(finalTripData);
    }

    // Mostrar resumen
    showTripSummary(finalTripData);
  };

  const saveTripToFirebase = async (trip) => {
    try {
      const healthRef = doc(db, 'vehicleHealth', vehicleId);
      
      await updateDoc(healthRef, {
        trips: arrayUnion(trip),
        totalDistance: (await getDoc(healthRef)).data().totalDistance + trip.distance || trip.distance,
        lastTripDate: trip.endTime,
      });

      console.log('✅ Viaje guardado en Firebase');
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const showTripSummary = (trip) => {
    const minutes = Math.floor(trip.duration / 60);
    const seconds = trip.duration % 60;

    Alert.alert(
      '🏁 Viaje Finalizado',
      `📊 Resumen:
      
🛣️ Distancia: ${trip.distance.toFixed(2)} km
⏱️ Duración: ${minutes}m ${seconds}s
⚡ Velocidad promedio: ${trip.avgSpeed} km/h
🚀 Velocidad máxima: ${Math.round(trip.maxSpeed)} km/h

⚠️ Eventos:
• Frenadas bruscas: ${trip.harshBrakes}
• Aceleraciones agresivas: ${trip.harshAccelerations}
• Tiempo en ralentí: ${Math.floor(trip.idleTime / 60)}m

${getDrivingScore(trip) >= 80 ? '✅ ¡Excelente conducción!' : '⚠️ Intenta conducir más suave'}`,
      [{ text: 'OK' }]
    );
  };

  const getDrivingScore = (trip) => {
    let score = 100;
    
    // Penalizar frenadas bruscas
    score -= trip.harshBrakes * 5;
    
    // Penalizar aceleraciones agresivas
    score -= trip.harshAccelerations * 5;
    
    // Penalizar exceso de velocidad
    if (trip.maxSpeed > 120) {
      score -= 10;
    }
    
    // Penalizar mucho tiempo en ralentí
    if (trip.idleTime > 300) { // Más de 5 minutos
      score -= 10;
    }

    return Math.max(score, 0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {!tracking ? (
        <TouchableOpacity
          style={styles.startButton}
          onPress={startTrip}
          activeOpacity={0.8}
        >
          <Play size={32} color="#fff" fill="#fff" />
          <Text style={styles.startButtonText}>Iniciar Viaje</Text>
          <Text style={styles.startButtonSubtext}>
            Registra tu conducción
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.trackingContainer}>
          <View style={styles.trackingHeader}>
            <View style={styles.recordingBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>GRABANDO</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Clock size={20} color="#00d9ff" />
              <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
              <Text style={styles.statLabel}>Tiempo</Text>
            </View>

            <View style={styles.statCard}>
              <MapPin size={20} color="#10b981" />
              <Text style={styles.statValue}>
                {tripData.distance.toFixed(1)} km
              </Text>
              <Text style={styles.statLabel}>Distancia</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.speedIcon}>⚡</Text>
              <Text style={styles.statValue}>
                {Math.round(currentSpeed)} km/h
              </Text>
              <Text style={styles.statLabel}>Velocidad</Text>
            </View>
          </View>

          <View style={styles.eventsCard}>
            <Text style={styles.eventsTitle}>Eventos Detectados:</Text>
            <View style={styles.eventsList}>
              <View style={styles.eventItem}>
                <Text style={styles.eventIcon}>🔴</Text>
                <Text style={styles.eventText}>
                  Frenadas bruscas: {tripData.harshBrakes}
                </Text>
              </View>
              <View style={styles.eventItem}>
                <Text style={styles.eventIcon}>⚡</Text>
                <Text style={styles.eventText}>
                  Aceleraciones: {tripData.harshAccelerations}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopTrip}
            activeOpacity={0.8}
          >
            <Square size={24} color="#fff" fill="#fff" />
            <Text style={styles.stopButtonText}>Finalizar Viaje</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  startButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  startButtonSubtext: {
    color: '#d1fae5',
    fontSize: 14,
  },
  trackingContainer: {
    gap: 16,
  },
  trackingHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  recordingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  speedIcon: {
    fontSize: 20,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  eventsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
  },
  eventsTitle: {
    color: '#fbbf24',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventsList: {
    gap: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventIcon: {
    fontSize: 16,
  },
  eventText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});