import React, { createContext, useState, useContext } from 'react';

const NotificationCountContext = createContext();

export const useNotificationCount = () => {
  const context = useContext(NotificationCountContext);
  if (!context) {
    throw new Error('useNotificationCount debe ser usado dentro de NotificationCountProvider');
  }
  return context;
};

export const NotificationCountProvider = ({ children }) => {
    const [totalCount, setTotalCount] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
  
    console.log('📊 NotificationCountContext - Total:', totalCount, 'Initialized:', isInitialized);
  
    const updateTotalCount = (count) => {
      console.log('🔔 Actualizando contador de notificaciones:', count);
      setTotalCount(count);
      setIsInitialized(true);
    };
  
    return (
      <NotificationCountContext.Provider
        value={{
          totalCount,
          setTotalCount: updateTotalCount,
          isInitialized,
        }}
      >
        {children}
      </NotificationCountContext.Provider>
    );
  };