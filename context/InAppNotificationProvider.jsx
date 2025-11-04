import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import InAppNotificationBanner from '../ui/InAppNotificationBanner'; // ajusta la ruta a donde tengas el banner

const InAppNotificationContext = createContext();

export const useInAppNotification = () => useContext(InAppNotificationContext);

export const InAppNotificationProvider = ({ children }) => {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  const showInAppNotification = useCallback((notification) => {
    console.log('🔔 showInAppNotification llamado:', notification);
    setCurrentNotification(notification);
    setBannerVisible(true);
    // Auto ocultar después de 5 segundos
    setTimeout(() => {
      setBannerVisible(false);
      setCurrentNotification(null);
    }, 5000);
  }, []);

  const hideNotification = useCallback(() => {
    setBannerVisible(false);
    setTimeout(() => setCurrentNotification(null), 300);
  }, []);

  useEffect(() => {
    console.log('🎯 InAppNotificationProvider montado');
    console.log('📊 Estado actual - Banner visible:', bannerVisible, 'Notificación:', !!currentNotification);
  }, [bannerVisible, currentNotification]);

  return (
    <InAppNotificationContext.Provider
      value={{
        showInAppNotification,
        hideNotification,
      }}
    >
      {children}

      {/* 🚀 Portal visual que va sobre TODO el árbol */}
      <Modal
        visible={bannerVisible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <InAppNotificationBanner
            isVisible={bannerVisible}
            notification={currentNotification}
            onDismiss={hideNotification}
          />
        </View>
      </Modal>
    </InAppNotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    pointerEvents: 'box-none', // Permite interactuar con lo de abajo
  },
});

export default InAppNotificationProvider;
