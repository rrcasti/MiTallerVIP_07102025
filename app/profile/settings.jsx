// Ruta: app/profile/settings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform, ActivityIndicator
  // 🚫 ScrollView NO es necesario
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Bell, BellOff, Settings, AlertCircle, CheckCircle } from 'lucide-react-native';
import { Stack } from 'expo-router'; // Importar Stack para configurar el header

// Paleta de colores (ajusta según tu app)
const PALETTE = {
  background: '#0f172a',
  cardBackground: '#1e293b',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  accent: '#00d9ff', // Azul para acciones
  success: '#10b981', // Verde
  warning: '#fbbf24', // Ambar
  danger: '#ef4444', // Rojo
  highlight: '#4A5568',
};

const NotificationSettingsScreen = () => {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Función para verificar permisos ---
  const checkPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      console.log('Estado actual del permiso:', status);
    } catch (error) {
      console.error("Error verificando permisos:", error);
      Alert.alert("Error", "No se pudo verificar el estado de los permisos.");
      setPermissionStatus('denied');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar permisos al cargar la pantalla
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // --- Función para solicitar permisos ---
  const requestPermissions = async () => {
    if (permissionStatus !== 'undetermined') {
      if (permissionStatus === 'denied') {
          Alert.alert(
              "Permisos Denegados",
              "Para activar las notificaciones, debes habilitarlas desde la configuración de tu dispositivo.",
              [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Abrir Configuración", onPress: () => Linking.openSettings() }
              ]
          );
      }
      return;
    }

    setIsLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        Alert.alert("¡Listo!", "Las notificaciones han sido activadas.");
        // Aquí se podría llamar a la función para registrar el token
        // registerForPushNotificationsAsync(user.uid);
      } else {
        Alert.alert("Permiso No Otorgado", "No has permitido las notificaciones.");
      }
    } catch (error) {
      console.error("Error solicitando permisos:", error);
      Alert.alert("Error", "No se pudo solicitar el permiso de notificación.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Función para abrir la configuración del sistema ---
  const openAppSettings = () => {
    Linking.openSettings();
  };

  // --- Función para renderizar el ESTADO del permiso ---
  const renderStatusInfo = () => {
    if (isLoading || permissionStatus === null) {
      return <ActivityIndicator color={PALETTE.accent} style={styles.statusIndicator} />;
    }

    switch (permissionStatus) {
      case 'granted':
        return (
          <View style={[styles.statusContainer, styles.statusContainerGranted]}>
            <CheckCircle size={20} color={PALETTE.success} />
            <Text style={[styles.statusText, { color: PALETTE.success }]}>
              Notificaciones Activadas
            </Text>
          </View>
        );
      case 'denied':
        return (
          <View style={[styles.statusContainer, styles.statusContainerDenied]}>
            <AlertCircle size={20} color={PALETTE.danger} />
            <Text style={[styles.statusText, { color: PALETTE.danger }]}>
              Notificaciones Desactivadas (Denegadas)
            </Text>
          </View>
        );
      case 'undetermined':
        return (
          <View style={[styles.statusContainer, styles.statusContainerUndetermined]}>
            <BellOff size={20} color={PALETTE.warning} />
            <Text style={[styles.statusText, { color: PALETTE.warning }]}>
              Permiso Pendiente
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  // --- Función para renderizar el BOTÓN de acción ---
  const renderActionButton = () => {
    if (isLoading || permissionStatus === null) {
      return null; // No mostrar botón mientras carga
    }

    if (permissionStatus === 'undetermined') {
      return (
        <TouchableOpacity style={styles.actionButton} onPress={requestPermissions} disabled={isLoading}>
          <Bell size={18} color={PALETTE.background} />
          <Text style={styles.actionButtonText}>Activar Notificaciones</Text>
        </TouchableOpacity>
      );
    }

    if (permissionStatus === 'denied') {
      return (
        <TouchableOpacity style={[styles.actionButton, styles.settingsButton]} onPress={openAppSettings}>
          <Settings size={18} color={PALETTE.textPrimary} />
          <Text style={[styles.actionButtonText, styles.settingsButtonText]}>Abrir Configuración del Sistema</Text>
        </TouchableOpacity>
      );
    }

    // Si está 'granted'
    return (
       <TouchableOpacity style={[styles.actionButton, styles.settingsButton]} onPress={openAppSettings}>
          <Settings size={18} color={PALETTE.textPrimary} />
          <Text style={[styles.actionButtonText, styles.settingsButtonText]}>Gestionar en Configuración</Text>
        </TouchableOpacity>
    );
  };

  // --- RENDER PRINCIPAL ---
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {/* Configura el Header */}
      <Stack.Screen options={{
          headerShown: true,
          title: 'Notificaciones',
          headerStyle: { backgroundColor: PALETTE.cardBackground },
          headerTintColor: PALETTE.textPrimary,
          headerTitleStyle: { fontWeight: 'bold' },
          headerShadowVisible: false,
      }} />

      {/* Usamos View en lugar de ScrollView */}
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Permiso de Notificaciones Push</Text>
          <Text style={styles.cardDescription}>
            Permite que Mi Taller VIP te envíe alertas importantes sobre tus vehículos,
            mensajes nuevos y recordatorios de mantenimiento.
          </Text>

          {/* 👇 CORRECCIÓN: LLAMAR A LAS FUNCIONES 👇 */}
          {renderStatusInfo()}

          <View style={styles.buttonContainer}>
             {renderActionButton()}
          </View>
          {/* 👆 FIN DE LA CORRECCIÓN 👆 */}

        </View>

        {/* Aquí puedes añadir más tarjetas de configuración en el futuro */}
        
      </View>
    </SafeAreaView>
  );
};

// --- ESTILOS ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  container: {
    padding: 20,
    flex: 1, // Ocupa el espacio disponible
  },
  card: {
    backgroundColor: PALETTE.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.textPrimary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: PALETTE.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusIndicator: {
    marginVertical: 12,
  },
  buttonContainer: {
      marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: PALETTE.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: PALETTE.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: PALETTE.highlight,
  },
  settingsButtonText: {
    color: PALETTE.textPrimary,
  },
  statusContainerGranted: { borderColor: PALETTE.success, backgroundColor: `${PALETTE.success}1A` },
  statusContainerDenied: { borderColor: PALETTE.danger, backgroundColor: `${PALETTE.danger}1A` },
  statusContainerUndetermined: { borderColor: PALETTE.warning, backgroundColor: `${PALETTE.warning}1A` },
});

export default NotificationSettingsScreen;