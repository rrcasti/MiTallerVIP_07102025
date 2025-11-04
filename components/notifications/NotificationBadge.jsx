import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNotificationCount } from '../context/NotificationCountContext';

export default function NotificationBadge({ size = 24, color = '#94A3B8' }) {
  const { totalCount, isInitialized } = useNotificationCount();
  
  console.log('🔔 NotificationBadge render - totalCount:', totalCount, 'isInitialized:', isInitialized);

  // No mostrar badge hasta que se inicialice
  const shouldShowBadge = isInitialized && totalCount > 0;

  return (
    <View style={styles.container}>
      <Bell size={size} color={color} />
      {shouldShowBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalCount > 99 ? '99+' : totalCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});