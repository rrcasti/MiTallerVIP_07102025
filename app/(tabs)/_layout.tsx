// app/(tabs)/_layout.tsx

import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Car, ShoppingBag, Bell, MessageCircle, Truck } from 'lucide-react-native';
import { Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// ✅ Import del context y banner
import { useInAppNotification } from '../../components/context/InAppNotificationContext';

export default function TabLayout() {
  const activeColor = '#FBBF24';
  const inactiveColor = '#64748B';
  
  // ✅ Hook para navegación
  const router = useRouter();

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
            router.push('/emergency/towRequest');  
          },
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ]
    );
  };

  // ✅ Contexto de notificaciones
  const { bannerVisible, notification } = useInAppNotification();

  return (
    <>
      {/* ═══ TABS ORIGINALES ═══ */}
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
      
      {/* ═══ Banner de notificación ═══ */}
      {bannerVisible && notification && (
        <InAppNotificationBanner notification={notification} />
      )}

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
    position: 'absolute',
    right: 20,
    bottom: 105,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#DC2626',
  },
});
