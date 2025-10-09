// ============================================
// CONTEXTO DE SALUD DEL VEHÍCULO
// Este archivo maneja todo el tracking inteligente
// ============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

// ============================================
// TIPOS DE DATOS (TypeScript)
// Define qué información vamos a manejar
// ============================================

// Información de una "foto" del GPS
interface LocationSnapshot {
  latitude: number;      // Latitud (posición norte-sur)
  longitude: number;     // Longitud (posición este-oeste)
  timestamp: Date;       // Cuándo se tomó la foto
  accuracy: number;      // Qué tan precisa es (en metros)
}

// Datos de salud del vehículo
interface HealthData {
  totalKm: number;              // Total de kilómetros desde que empezó a usar la app
  kmThisMonth: number;          // Kilómetros este mes
  avgKmPerMonth: number;        // Promedio mensual
  healthScore: number;          // Puntaje 0-100
  lastSnapshot: LocationSnapshot | null;  // Última foto tomada
  nextOilChange: number;        // Cuántos km faltan para cambio de aceite
}

// ============================================
// CREAR EL CONTEXTO
// Es como crear una "caja mágica" que comparte
// información con toda la app
// ============================================

const HealthTrackingContext = createContext<{
  healthData: HealthData;
  takeSnapshot: () => Promise<void>;
  isLoading: boolean;
}>({
  healthData: {
    totalKm: 0,
    kmThisMonth: 0,
    avgKmPerMonth: 0,
    healthScore: 100,
    lastSnapshot: null,
    nextOilChange: 5000,
  },
  takeSnapshot: async () => {},
  isLoading: false,
});

// Hook para usar el contexto fácilmente
export const useHealthTracking = () => useContext(HealthTrackingContext);

// ============================================
// PROVIDER - El componente principal
// ============================================

export function HealthTrackingProvider({ children }: { children: React.ReactNode }) {
  // ===== ESTADOS =====
  // Variables que cambian con el tiempo
  
  const { user } = useAuth(); // Obtener usuario actual
  
  const [healthData, setHealthData] = useState<HealthData>({
    totalKm: 0,
    kmThisMonth: 0,
    avgKmPerMonth: 0,
    healthScore: 100,
    lastSnapshot: null,
    nextOilChange: 5000,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // ===== EFECTO 1: Pedir permisos al iniciar =====
  useEffect(() => {
    checkPermissions();
  }, []);

  // ===== EFECTO 2: Tomar snapshot cuando entre el usuario =====
  useEffect(() => {
    if (user && hasPermission) {
      console.log('👤 Usuario detectado, tomando snapshot...');
      takeSnapshot();
    }
  }, [user, hasPermission]);

  // ============================================
  // FUNCIÓN 1: Verificar permisos de GPS
  // ============================================
  
  const checkPermissions = async () => {
    try {
      console.log('🔐 Verificando permisos de ubicación...');
      
      // Ver si ya tenemos permiso
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'granted') {
        console.log('✅ Permisos ya otorgados');
        setHasPermission(true);
      } else {
        console.log('📱 Pidiendo permisos al usuario...');
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        setHasPermission(newStatus === 'granted');
        
        if (newStatus === 'granted') {
          console.log('✅ Usuario otorgó permisos');
        } else {
          console.log('❌ Usuario denegó permisos');
        }
      }
    } catch (error) {
      console.error('❌ Error al verificar permisos:', error);
    }
  };

  // ============================================
  // FUNCIÓN 2: Tomar "foto" del GPS
  // ============================================
  
 

const takeSnapshot = async () => {
// Si no hay usuario o no hay permisos, salir
if (!user || !hasPermission || isLoading) {
  console.log('⏸️ Snapshot cancelado (sin usuario o permisos)');
  return;
}

// NUEVA VALIDACIÓN: Verificar que user.uid existe
if (!user.uid) {
  console.log('⏸️ Snapshot cancelado (user.uid no disponible aún)');
  return;
}

console.log('✅ Usuario UID verificado:', user.uid);

    setIsLoading(true);
    
    try {
      console.log('📸 Tomando snapshot de ubicación...');
      
      // Obtener ubicación actual del GPS
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('📍 Ubicación obtenida:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      // Crear objeto con la información
      const snapshot: LocationSnapshot = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date(),
        accuracy: location.coords.accuracy || 0,
      };

      // Obtener el snapshot anterior (si existe)
      const lastSnapshotData = await getLastSnapshot(user.uid);

      let distanceKm = 0;

      // Si hay snapshot anterior, calcular cuántos km recorrió
      if (lastSnapshotData) {
        distanceKm = calculateDistance(
          lastSnapshotData.latitude,
          lastSnapshotData.longitude,
          snapshot.latitude,
          snapshot.longitude
        );

        console.log(`🚗 Distancia recorrida: ${distanceKm.toFixed(2)} km`);

        // Solo guardar si se movió más de 100 metros (evitar ruido del GPS)
        if (distanceKm < 0.1) {
          console.log('⏸️ No hay movimiento significativo, snapshot ignorado');
          setIsLoading(false);
          return;
        }
      } else {
        console.log('🆕 Primer snapshot del usuario');
      }

      // Guardar en Firebase
      await saveSnapshot(user.uid, snapshot, distanceKm);

      // Actualizar datos locales
      await loadHealthData();

      console.log('✅ Snapshot guardado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al tomar snapshot:', error);
    }
    
    setIsLoading(false);
  };

  // ============================================
  // FUNCIÓN 3: Obtener el último snapshot
  // ============================================
  
  const getLastSnapshot = async (userId: string): Promise<LocationSnapshot | null> => {
    try {
      const q = query(
        collection(db, 'health_snapshots'),
        where('user_id', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const data = snapshot.docs[0].data();
      
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp.toDate(),
        accuracy: data.accuracy,
      };
    } catch (error) {
      console.error('Error obteniendo último snapshot:', error);
      return null;
    }
  };

  // ============================================
  // FUNCIÓN 4: Guardar snapshot en Firebase
  // ============================================
  
  const saveSnapshot = async (
    userId: string,
    snapshot: LocationSnapshot,
    distanceKm: number
  ) => {
    await addDoc(collection(db, 'health_snapshots'), {
      user_id: userId,
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      accuracy: snapshot.accuracy,
      distance_km: distanceKm,
      timestamp: snapshot.timestamp,
      app_version: '1.0.0',
    });
  };

  // ============================================
  // FUNCIÓN 5: Calcular distancia entre 2 puntos
  // Usa la fórmula matemática "Haversine"
  // ============================================
  
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radio de la Tierra en kilómetros
    
    // Convertir grados a radianes
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distancia en kilómetros
  };

  // ============================================
  // FUNCIÓN 6: Cargar datos de salud
  // ============================================
  
  const loadHealthData = async () => {
    if (!user || !user.uid) {
      console.log('⏸️ loadHealthData: user.uid no disponible');
      return;
    }

    try {
      // Obtener todos los snapshots del usuario
      const q = query(
        collection(db, 'health_snapshots'),
        where('user_id', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('ℹ️ No hay datos de salud aún');
        return;
      }

      // Calcular total de kilómetros
      let totalKm = 0;
      snapshot.docs.forEach(doc => {
        totalKm += doc.data().distance_km || 0;
      });

      // Calcular kilómetros de este mes
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      let kmThisMonth = 0;
      snapshot.docs.forEach(doc => {
        const docDate = doc.data().timestamp.toDate();
        if (docDate >= firstDayOfMonth) {
          kmThisMonth += doc.data().distance_km || 0;
        }
      });

      // Calcular promedio mensual (simplificado)
      const firstSnapshotDate = snapshot.docs[snapshot.docs.length - 1].data().timestamp.toDate();
      const monthsSinceStart = Math.max(
        1,
        (now.getTime() - firstSnapshotDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const avgKmPerMonth = totalKm / monthsSinceStart;

      // Calcular Health Score (simplificado por ahora)
      const healthScore = Math.min(100, Math.max(0, 100 - (totalKm / 1000)));

      // Kilómetros hasta próximo cambio de aceite
      const nextOilChange = Math.max(0, 5000 - (totalKm % 5000));

      // Actualizar estado
      setHealthData({
        totalKm,
        kmThisMonth,
        avgKmPerMonth,
        healthScore,
        lastSnapshot: null, // Lo actualizaremos después
        nextOilChange,
      });

      console.log('📊 Datos de salud actualizados:', {
        totalKm: totalKm.toFixed(2),
        kmThisMonth: kmThisMonth.toFixed(2),
        avgKmPerMonth: avgKmPerMonth.toFixed(2),
        healthScore: healthScore.toFixed(0),
      });

    } catch (error) {
      console.error('Error cargando datos de salud:', error);
    }
  };

  // ============================================
  // RETORNAR EL PROVIDER
  // Esto hace que el contexto esté disponible
  // ============================================
  
  return (
    <HealthTrackingContext.Provider
      value={{
        healthData,
        takeSnapshot,
        isLoading,
      }}
    >
      {children}
    </HealthTrackingContext.Provider>
  );
}