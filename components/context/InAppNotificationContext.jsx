import React, { createContext, useState, useContext, useCallback } from 'react';

const InAppNotificationContext = createContext();

export const useInAppNotification = () => {
  const context = useContext(InAppNotificationContext);
  if (!context) {
    throw new Error('useInAppNotification debe ser usado dentro de InAppNotificationProvider');
  }
  return context;
};

// Estado global compartido
let globalState = {
  promotionModal: null,
  bannerNotification: null,
  isBannerVisible: false,
  actionCards: [],
};

// Listeners para sincronizar con React
const listeners = new Set();

const notifyListeners = () => {
  console.log('🔄 Estado global actualizado, sincronizando con React:', globalState);
  listeners.forEach(listener => listener(globalState));
};

export const InAppNotificationProvider = ({ children }) => {
  console.log('🎯 InAppNotificationProvider montado');
  
  const [state, setState] = useState(globalState);

  React.useEffect(() => {
    const listener = (newState) => {
      setState({ ...newState });
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // ========== PROMOTION MODAL ==========
  const showPromotionModal = useCallback((notification) => {
    console.log('🎉 [Global State] showPromotionModal llamado:', notification);
    globalState.promotionModal = notification;
    notifyListeners();
  }, []);

  const dismissPromotionModal = useCallback(() => {
    console.log('❌ [Global State] dismissPromotionModal llamado');
    globalState.promotionModal = null;
    notifyListeners();
  }, []);

  // ========== SIMPLE TOAST (BANNER) ==========
  const showInAppNotification = useCallback((notification) => {
    console.log('🔔 [Global State] showBanner llamado:', notification);
    
    // Si hay un modal promocional activo, no mostrar el banner
    if (globalState.promotionModal) {
      console.log('⚠️ [Global State] Modal promocional activo, banner ignorado');
      return;
    }

    globalState.bannerNotification = notification;
    globalState.isBannerVisible = true;
    notifyListeners();

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      console.log('⏱️ [Global State] Banner auto-ocultándose');
      globalState.isBannerVisible = false;
      setTimeout(() => {
        globalState.bannerNotification = null;
        notifyListeners();
      }, 300);
    }, 5000);
  }, []);

  const dismissBanner = useCallback(() => {
    console.log('❌ [Global State] dismissBanner llamado');
    globalState.isBannerVisible = false;
    setTimeout(() => {
      globalState.bannerNotification = null;
      notifyListeners();
    }, 300);
  }, []);

  // ========== ACTION REQUIRED CARDS ==========
  const showActionRequiredCard = useCallback((notification) => {
    console.log('🔴 [Global State] addActionCard llamado:', notification);
    
    const notificationId = notification.notificationId || notification.data?.notificationId || notification.id;
    
    const exists = globalState.actionCards.some(card => card.id === notificationId);
    
    if (!exists) {
      const newCard = {
        id: notificationId,
        ...notification,
      };
      
      globalState.actionCards = [...globalState.actionCards, newCard];
      console.log('➕ [Global State] Tarjeta añadida:', notificationId);
      notifyListeners();
    } else {
      console.log('ℹ️ [Global State] Tarjeta ya existe:', notificationId);
    }
  }, []);

  const dismissActionCard = useCallback((cardId) => {
    console.log('❌ [Global State] removeActionCard llamado:', cardId);
    globalState.actionCards = globalState.actionCards.filter(card => card.id !== cardId);
    notifyListeners();
  }, []);

  console.log('📊 Estado actual - Banner visible:', state.isBannerVisible, 'Tarjetas activas:', state.actionCards.length, 'Promo modal:', !!state.promotionModal);

  return (
    <InAppNotificationContext.Provider
      value={{
        // Promotion Modal
        promotionModal: state.promotionModal,
        showPromotionModal,
        dismissPromotionModal,
        
        // Simple Toast (Banner)
        bannerNotification: state.bannerNotification,
        isBannerVisible: state.isBannerVisible,
        showInAppNotification,
        dismissBanner,
        
        // Action Cards
        actionCards: state.actionCards,
        showActionRequiredCard,
        dismissActionCard,
      }}
    >
      {children}
    </InAppNotificationContext.Provider>
  );
};