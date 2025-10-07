
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { Stack } from 'expo-router';
import { TouchableOpacity, Platform, Alert } from 'react-native'; // <-- Se añade Platform y Alert
import { Edit } from 'lucide-react-native';

// --- NUEVAS IMPORTACIONES PARA NOTIFICACIONES ---
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { savePushToken } from '../services/userService'; // <-- El nuevo servicio que creamos

// --- LÓGICA PARA PEDIR PERMISOS Y OBTENER EL TOKEN ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
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


const InitialLayout = () => {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  // useEffect para la redirección (sin cambios)
  useEffect(() => {
    if (isLoading) return;
  const inTabsGroup = segments[0] === '(tabs)';
  const isAllowedRoute = pathname.startsWith('/vehicles/') || pathname === '/profile' || inTabsGroup;
  
  if (user && !isAllowedRoute) {
    router.replace('/(tabs)');
  } else if (!user && isAllowedRoute) {
    router.replace('/login');
  }
  }, [user, isLoading, segments, pathname]);

  // --- NUEVO useEffect PARA LAS NOTIFICACIONES ---
  useEffect(() => {
    // Si no hay usuario, no hacemos nada.
    if (!user) return;

    // Cuando el usuario inicia sesión, registramos su token.
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        // Guardamos el token en Firestore
        savePushToken(user.uid, token);
      }
    });
  }, [user]); // Este efecto se ejecuta solo cuando el 'user' cambia.

  return (
    <Stack>
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="vehicles/VehiclesForm" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="vehicles/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="FileViewer" options={{ headerShown: false, presentation: 'modal', }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}