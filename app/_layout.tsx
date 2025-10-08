import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { Stack } from 'expo-router';
import { TouchableOpacity, Platform, Alert } from 'react-native';
import { Edit } from 'lucide-react-native';
import { VehicleProvider } from '../context/VehicleContext';

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

const InitialLayout = () => {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === '(tabs)';

    const isAllowedRoute =
      pathname.startsWith('/vehicles/') ||
      pathname.startsWith('/requests/') || // ✅ Línea agregada
      pathname === '/profile' ||
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
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="vehicles/VehiclesForm" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="vehicles/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="FileViewer" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="requests/ServiceRequest" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <InitialLayout />
      </VehicleProvider>
    </AuthProvider>
  );
}
