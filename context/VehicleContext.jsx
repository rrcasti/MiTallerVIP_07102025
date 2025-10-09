// RUTA: /context/VehicleContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getVehiclesForUser } from '../services/vehicleService';
import { auth } from '../firebase/config';

// 1. Creación del contexto
const VehicleContext = createContext();

// 2. Creación del Proveedor (Provider)
export const VehicleProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar los vehículos del usuario
  const loadVehicles = useCallback(async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const userVehicles = await getVehiclesForUser(auth.currentUser.uid);
      setVehicles(userVehicles);
    } catch (error) {
      console.error("Error al cargar los vehículos desde el contexto:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ARREGLADO: Efecto que carga los vehículos la primera vez
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadVehicles();
      } else {
        setVehicles([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // ✅ VACÍO - Solo se ejecuta una vez

  // 3. Provee el estado y las funciones a los componentes hijos
  const value = {
    vehicles,
    loading,
    loadVehicles,
    totalVehicles: vehicles.length,
  };

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
};

// 4. Hook personalizado para usar el contexto fácilmente
export const useVehicles = () => {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles debe ser usado dentro de un VehicleProvider');
  }
  return context;
};