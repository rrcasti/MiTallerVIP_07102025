// ✅ Estado global FUERA de React (persiste aunque los componentes se desmonten)
let globalState = {
    bannerNotification: null,
    isBannerVisible: false,
    actionCards: [],
    promotionModal: null, // ✅ NUEVO
  };
  
  let listeners = [];
  
  // ✅ Funciones para modificar el estado global
  export const notificationState = {
    // Obtener el estado actual
    getState: () => globalState,
  
    // Actualizar el estado y notificar a los listeners (React components)
    setState: (newState) => {
      globalState = { ...globalState, ...newState };
      listeners.forEach(listener => listener(globalState));
    },
  
    // Suscribirse a cambios de estado (usado por el Provider)
    subscribe: (listener) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter(l => l !== listener);
      };
    },
  
    // Acciones específicas
    showBanner: (notification) => {
      console.log('🔔 [Global State] showBanner llamado:', notification);
      notificationState.setState({
        bannerNotification: notification,
        isBannerVisible: true,
      });
    },
  
    hideBanner: () => {
      console.log('❌ [Global State] hideBanner llamado');
      notificationState.setState({
        isBannerVisible: false,
      });
      setTimeout(() => {
        notificationState.setState({ bannerNotification: null });
      }, 300);
    },
  
    addActionCard: (notification) => {
      console.log('🔴 [Global State] addActionCard llamado:', notification);
      const notificationId = notification.notificationId || notification.data?.notificationId || notification.id;
      
      const currentCards = notificationState.getState().actionCards;
      const exists = currentCards.some(card => card.id === notificationId);
      
      if (!exists) {
        const newCard = { id: notificationId, ...notification };
        notificationState.setState({
          actionCards: [...currentCards, newCard],
        });
        console.log('➕ [Global State] Tarjeta añadida:', newCard.id);
      } else {
        console.log('ℹ️ [Global State] Tarjeta ya existe:', notificationId);
      }
    },
  
    removeActionCard: (cardId) => {
      console.log('❌ [Global State] removeActionCard llamado:', cardId);
      const currentCards = notificationState.getState().actionCards;
      notificationState.setState({
        actionCards: currentCards.filter(card => card.id !== cardId),
      });
    },
  
    // ✅ NUEVO: Mostrar modal de promoción
    showPromotionModal: (notification) => {
      console.log('🎉 [Global State] showPromotionModal llamado:', notification);
      notificationState.setState({
        promotionModal: notification,
      });
    },
  
    // ✅ NUEVO: Ocultar modal de promoción
    hidePromotionModal: () => {
      console.log('❌ [Global State] hidePromotionModal llamado');
      notificationState.setState({
        promotionModal: null,
      });
    },
  };