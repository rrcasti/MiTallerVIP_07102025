// En app/(tabs)/_layout.tsx

import React, { useEffect } from 'react'; // <-- IMPORTAR useEffect
import { Tabs, useRouter, usePathname } from 'expo-router'; // <-- AGREGAR useRouter y usePathname
import { Home, Car, ShoppingBag, Bell, MessageCircle } from 'lucide-react-native';
import { Alert } from 'react-native'; // <-- IMPORTAR Alert
import { useAuth } from '../../context/AuthContext'; // <-- IMPORTAR useAuth

export default function TabLayout() {
  const activeColor = '#FBBF24'; // Amarillo/Naranja para la pestaña activa
  const inactiveColor = '#64748B'; // Gris para las inactivas
/*
  const { isProfileVerified, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // --- LÓGICA DE INTERCEPCIÓN DE PERFIL (AÑADIDA) ---
  useEffect(() => {
    // Si la autenticación o la verificación del perfil están en curso, no hacemos nada.
    if (isLoading) {
      return;
    }

    // 1. Verificamos si el perfil NO está verificado.
    // 2. Nos aseguramos de que la ruta actual no sea ya la de perfil, para evitar bucles de alerta.
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
  // --- FIN DE LA LÓGICA DE INTERCEPCIÓN ---
*/

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false, // Ocultamos el header por defecto
        tabBarStyle: {
          backgroundColor: '#0F172A', // Fondo oscuro para la barra
          borderTopColor: '#334155', // Línea superior sutil
        },
      }}
    >
      <Tabs.Screen
        name="index" // Corresponde a index.tsx
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vehicles" // Corresponde a vehicles.jsx
        options={{
          title: 'Mi Garage',
          tabBarIcon: ({ color }) => <Car size={24} color={color} />,
        }}
      />
      
      {/* 👇 PESTAÑAS NUEVAS ACTIVADAS 👇 */}
      <Tabs.Screen
        name="store" // Corresponde a store.tsx
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
  );
}