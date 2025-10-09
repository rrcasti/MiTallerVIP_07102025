// Ruta: app/_layout.tsx
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { Stack, Slot } from 'expo-router';
import { Alert, Platform, TouchableOpacity } from 'react-native';
import { Edit } from 'lucide-react-native';
import { VehicleProvider } from '../context/VehicleContext';
import { MembershipProvider } from '../context/MembershipContext';

// --- NUEVAS IMPORTACIONES PARA NOTIFICACIONES ---
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { savePushToken } from '../services/userService';

// --- LÓGICA PARA PEDIR PERMISOS Y OBTENER EL TOKEN ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(userUid) {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Permiso denegado', 'No se pudo obtener el token para notificaciones push.');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token);
    if (userUid) {
      await savePushToken(userUid, token);
    }
  } else {
    Alert.alert("Debe usar un dispositivo físico para recibir notificaciones push.");
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

const AppLayout = () => {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === '(tabs)';

    const isAllowedRoute =
      pathname.startsWith('/vehicles/') ||
      pathname.startsWith('/requests/') ||
      pathname === '/profile' ||
      pathname === '/memberships' ||
      // ✅ CAMBIO 1: Sin guión
      pathname.startsWith('/emergency/') ||   // ← ANTES: '/tow-request'
      inTabsGroup;

    if (user && !isAllowedRoute) {
      router.replace('/(tabs)');
    } else if (!user && isAllowedRoute) {
      router.replace('/login');
    }
  }, [user, isLoading, segments, pathname, router]);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync(user.uid);
    }
  }, [user]);

  return (
    <Stack>
      {/* Tabs principales */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      
      {/* Vehículos */}
      <Stack.Screen 
        name="vehicles/VehiclesForm" 
        options={{ 
          headerShown: false, 
          presentation: 'modal' 
        }} 
      />
      <Stack.Screen 
        name="vehicles/[id]" 
        options={{ headerShown: false }} 
      />
      
      {/* Archivos y utilidades */}
      <Stack.Screen 
        name="FileViewer" 
        options={{ 
          headerShown: false, 
          presentation: 'modal' 
        }} 
      />
      
      {/* Perfil y autenticación */}
      <Stack.Screen 
        name="profile" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false }} 
      />
      
      {/* Solicitudes de servicio */}
      <Stack.Screen 
        name="requests/ServiceRequest" 
        options={{ 
          headerShown: false, 
          presentation: 'modal' 
        }} 
      />
      
      {/* Chat */}
      <Stack.Screen 
        name="chat" 
        options={{ headerShown: false }} 
      />
      
      {/* ✅ CAMBIO 2: Grúa sin guión + mejor configuración */}
      <Stack.Screen 
        name="towRequest"  // ← ANTES: "tow-request"
        options={{ 
          presentation: 'modal',
          headerShown: false,
          // ✅ AGREGADO: Animación suave
          animation: 'slide_from_bottom',
        }} 
      />
      
      {/* Membresías */}
      <Stack.Screen 
        name="memberships" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <MembershipProvider>
          <AppLayout />
        </MembershipProvider>
      </VehicleProvider>
    </AuthProvider>
  );
}