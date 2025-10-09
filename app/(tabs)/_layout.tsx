// app/(tabs)/_layout.tsx

import React, { useEffect } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Home, Car, ShoppingBag, Bell, MessageCircle, Truck } from 'lucide-react-native';
import { Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const activeColor = '#FBBF24';
  const inactiveColor = '#64748B';
  
  // ✅ Hook para navegación
  const router = useRouter();

  /*
  const { isProfileVerified, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isProfileVerified && pathname !== '/profile') {
      Alert.alert(
        "Completa tu perfil",
        "Debes completar tus datos personales para acceder a todas las funciones de la app.",
        [
          {
            text: "Ir a mi perfil",
            onPress: () => router.push('/profile'),
          },
          {
            text: "Cancelar",
            style: "cancel",
          },
        ]
      );
    }
  }, [isProfileVerified, isLoading, pathname, router]);
  */

  // ✅ Función para manejar solicitud de grúa
  const handleTowRequest = () => {
    Alert.alert(
      "🚛 Servicio de Grúa",
      "¿Necesitas asistencia de emergencia?",
      [
        {
          text: "Sí, solicitar grúa",
          onPress: () => {
            console.log('🚛 Navegando a solicitud de grúa...');
            // ✅ CAMBIO: Sin guión
            router.push('/emergency/towRequest');  // ← ANTES: '/tow-request'
          },
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ]
    );
  };

  return (
    <>
      {/* ═══ TABS ORIGINALES (Sin cambios) ═══ */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0F172A',
            borderTopColor: '#334155',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="vehicles"
          options={{
            title: 'Mi Garage',
            tabBarIcon: ({ color }) => <Car size={24} color={color} />,
          }}
        />
        
        <Tabs.Screen
          name="store"
          options={{
            title: 'Tienda VIP',
            tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="activity" 
          options={{
            title: 'Actividad',
            tabBarIcon: ({ color }) => <Bell size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat" 
          options={{
            title: 'Mi Chat',
            tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
          }}
        />
      </Tabs>
      
      {/* ═══ BOTÓN FLOTANTE DE EMERGENCIA ═══ */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={handleTowRequest}
        activeOpacity={0.8}
      >
        <Truck size={28} color="white" />
      </TouchableOpacity>
    </>
  );
}

// ═══ ESTILOS DEL BOTÓN FLOTANTE ═══
const styles = StyleSheet.create({
  emergencyButton: {
    // Posicionamiento
    position: 'absolute',
    right: 20,
    bottom: 80,
    
    // Tamaño
    width: 60,
    height: 60,
    borderRadius: 30,
    
    // Color
    backgroundColor: '#EF4444',
    
    // Centrado
    justifyContent: 'center',
    alignItems: 'center',
    
    // Sombra iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    
    // Sombra Android
    elevation: 8,
    
    // Borde
    borderWidth: 3,
    borderColor: '#DC2626',
  },
});