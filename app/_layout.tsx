import React, { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { Stack } from 'expo-router';
import { Alert, Platform, AppState } from 'react-native';
import { VehicleProvider } from '../context/VehicleContext.jsx';
import { MembershipProvider } from '../context/MembershipContext';
import { HealthTrackingProvider } from '../context/HealthTrackingContext';
import { CartProvider } from '../context/CartContext';
import { InAppNotificationProvider, useInAppNotification } from '../components/context/InAppNotificationContext.jsx';
import { NotificationCountProvider } from '../components/context/NotificationCountContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Asegúrate de que esto esté correctamente importado si lo necesitas
import PromotionModal from '../components/ui/PromotionModal';
import SimpleToast from '../components/ui/SimpleToast';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { savePushToken } from '../services/userService';

// ✅ Configuración del handler FUERA del componente
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const appState = AppState.currentState;
    const notificationType = notification.request.content.data?.type;
    
    console.log('handleNotification: AppState=' + appState + ', ShouldShowSystemNotification=' + (appState !== 'active'));
    
    return {
      shouldShowAlert: appState !== 'active',
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

// ✅ Función auxiliar FUERA del componente
async function registerForPushNotificationsAsync(userUid) {
  console.log('🔔 Iniciando registro de push token para usuario:', userUid);
  
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('⚠️ Solicitando permisos de notificación...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('❌ Permiso de notificación denegado');
      return;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      })).data;

      console.log("✅ Expo Push Token obtenido:", token);
      
      if (userUid && token) {
        await savePushToken(userUid, token);
        console.log("✅ Push Token guardado para el usuario:", userUid);
      }
    } catch (e) {
      console.error("❌ Error obteniendo el Expo Push Token:", e);
      return;
    }
  } else {
    console.log("⚠️ Debe usar un dispositivo físico para recibir notificaciones push.");
  }

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log("✅ Canal 'default' de Android configurado");
    } catch (e) {
      console.error("❌ Error configurando canal de Android:", e);
    }
  }

  return token;
}

// ✅ Componente INTERNO que maneja notificaciones y navegación
function AppLayout({ children }) {
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  
  const { 
    promotionModal,
    dismissPromotionModal,
    bannerNotification,
    isBannerVisible,
    dismissBanner,
    showInAppNotification, 
    showActionRequiredCard, 
    showPromotionModal,
  } = useInAppNotification();

  const notificationListener = useRef();
  const responseListener = useRef();

  // Efecto de navegación por autenticación
  useEffect(() => {
    console.log('🔐 Auth State - User:', user?.email, 'Segments:', segments);
    
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      console.log('➡️ Redirigiendo a login (no hay usuario)');
      router.replace('/login');
    } else if (user && inAuthGroup) {
      console.log('➡️ Redirigiendo a tabs (usuario autenticado)');
      router.replace('/(tabs)');
    }
  }, [user, segments]);

  // Efecto para registrar push token cuando hay usuario
  useEffect(() => {
    if (user?.uid) {
      console.log('👤 Usuario autenticado, registrando push token...');
      registerForPushNotificationsAsync(user.uid);
    }
  }, [user]);

  // Efecto para configurar listeners de notificaciones
  useEffect(() => {
    console.log('🎧 Configurando listeners de notificaciones...');

    // Listener para notificaciones recibidas mientras la app está en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notificación recibida (foreground):', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });

      const notificationData = notification.request.content.data || {};
      const notificationType = notificationData.type;
      const appState = AppState.currentState;

      console.log('🔍 Tipo:', notificationType, 'AppState:', appState);

      const fullNotification = {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notificationData,
        notificationId: notification.request.identifier,
        type: notificationType,
        id: notification.request.identifier,
      };

      // ===== PROMOCIONES CON IMAGEN (MODAL DE PANTALLA COMPLETA) =====
      if (notificationType === 'promotion') {
        const hasImage = notificationData.imageUrl || notificationData.fileUrl;
        if (hasImage) {
          console.log('🎉 PROMOCIÓN CON IMAGEN -> showPromotionModal');
          showPromotionModal(fullNotification);
          return;
        }
      }

      // ===== ACCIONES REQUERIDAS (SE RENDERIZAN EN DASHBOARD) =====
      const actionRequiredTypes = ['budget_approval', 'invoice_approval', 'vehicle_ready', 'tow_assigned'];
      if (actionRequiredTypes.includes(notificationType)) {
        console.log('🔴 ACCIÓN REQUERIDA -> showActionRequiredCard');
        showActionRequiredCard(fullNotification);
        return;
      }

      // ===== NOTIFICACIONES OPERATIVAS (BANNER FLOTANTE) =====
      console.log('🔔 GENERAL -> showInAppNotification');
      showInAppNotification(fullNotification);
    });

    // Listener para cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuario tocó una notificación:', {
        notification: response.notification.request.content,
        actionIdentifier: response.actionIdentifier,
      });

      const data = response.notification.request.content.data || {};
      const notificationType = data.type;

      console.log('🎯 Navegando según tipo:', notificationType);

      // ===== NAVEGACIÓN ESPECÍFICA SEGÚN TIPO =====
      switch (notificationType) {
        case 'budget_approval':
        case 'invoice_approval':
        case 'vehicle_ready':
          console.log('➡️ Navegando a documentos');
          if (data.relatedId) {
            router.push(`/documents?documentId=${data.relatedId}`);
          } else {
            router.push('/documents');
          }
          break;
        case 'tow_assigned':
          console.log('➡️ Navegando a grúa');
          router.push('/emergency/towRequest');
          break;
        case 'promotion':
          // ✅ MODIFICACIÓN APLICADA AQUÍ PARA NAVEGAR CORRECTAMENTE AL FILEVIEWER
          console.log('➡️ Navegando a FileViewer para mostrar imagen promocional');
          const imageUrl = data.imageUrl || data.fileUrl; // Las notificaciones promocionales suelen tener 'imageUrl' o 'fileUrl' en sus datos
          if (imageUrl) {
            router.push({
              pathname: '/FileViewer',
              params: {
                url: imageUrl,
                type: 'image', // Asumimos que las promociones son imágenes
                title: response.notification.request.content.title // Opcional: pasar el título
              }
            });
          } else {
            console.warn('⚠️ Notificación de promoción sin URL de imagen, redirigiendo a dashboard.');
            router.push('/(tabs)'); // Fallback si no hay URL de imagen
          }
          break;
        case 'service_update':
        case 'parts_arrived':
          console.log('➡️ Navegando a actividad');
          router.push('/activity');
          break;
        case 'new_message':
          console.log('➡️ Navegando al chat');
          router.push('/chat');
          break;
        default:
          console.log('➡️ Navegando a tabs (default)');
          router.push('/(tabs)');
          break;
      }
    });

    // ✅ Cleanup CORRECTO usando .remove()
    return () => {
      console.log('🧹 Limpiando listeners de notificaciones');
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [showInAppNotification, showActionRequiredCard, showPromotionModal, router]);

  return (
    <>
      {children}
      
      {/* ✅ Modal de Promoción - GLOBAL - Prioridad MÁXIMA */}
      <PromotionModal
        isVisible={!!promotionModal}
        imageUrl={promotionModal?.data?.imageUrl || promotionModal?.data?.fileUrl}
        onDismiss={dismissPromotionModal}
      />
      
      {/* ✅ Simple Toast - Banner Flotante para Notificaciones Operativas */}
      <SimpleToast
        isVisible={isBannerVisible}
        notification={bannerNotification}
        onDismiss={dismissBanner}
      />
    </>
  );
}

// ✅ Componente raíz
export default function RootLayout() {
  console.log('🚀 RootLayout montado');
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AuthProvider>
      <VehicleProvider>
        <MembershipProvider>
          <HealthTrackingProvider>
            <CartProvider>
             <NotificationCountProvider>
               <InAppNotificationProvider>
                 <AppLayout>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="health" options={{ headerShown: false }} />
                    <Stack.Screen name="memberships" options={{ headerShown: false }} />
                    <Stack.Screen name="documents/index" options={{ headerShown: false }} />
                    <Stack.Screen name="emergency/towRequest" options={{ headerShown: false }} />
                    <Stack.Screen name="profile/index" options={{ headerShown: false }} />
                    <Stack.Screen name="profile/settings" options={{ headerShown: false }} />
                    <Stack.Screen name="promotions/view" options={{ headerShown: false }} />
                    <Stack.Screen name="requests/ServiceRequest" options={{ headerShown: false }} />
                    <Stack.Screen name="store/cart" options={{ headerShown: false }} />
                    <Stack.Screen name="vehicles/VehiclesForm" options={{ headerShown: false }} />
                    <Stack.Screen name="vehicles/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="vehicles/new" options={{ headerShown: false }} />
                    <Stack.Screen name="activity/index" options={{ headerShown: false }} />
                    <Stack.Screen name="FileViewer" options={{ headerShown: false }} />
                    <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
                  </Stack>
                </AppLayout>
              </InAppNotificationProvider>
             </NotificationCountProvider>
            </CartProvider>
          </HealthTrackingProvider>
        </MembershipProvider>
      </VehicleProvider>
    </AuthProvider>
    </GestureHandlerRootView>
  );
}