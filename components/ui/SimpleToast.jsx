import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, AlertCircle, FileText, Sparkles, X } from 'lucide-react-native';

const SimpleToast = ({ isVisible, notification, onDismiss }) => {
  const insets = useSafeAreaInsets();
  
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      console.log('🔔 SimpleToast: Mostrando');
      
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: insets.top + 10,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -200,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, insets.top]);

  if (!notification || !isVisible) {
    return null;
  }

  const { title, body, data } = notification;
  const { type, priority } = data || {};

  const getIcon = () => {
    switch(type) {
      case 'service_update':
        return <Bell size={24} color="#10B981" />;
      case 'parts_arrived':
        return <AlertCircle size={24} color="#3B82F6" />;
      default:
        return <Bell size={24} color="#FFFFFF" />;
    }
  };

  const getBannerColor = () => {
    if (priority === 'critical' || priority === 'high') {
      return 'rgba(239, 68, 68, 0.95)';
    }
    return 'rgba(15, 23, 42, 0.95)';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <View
        style={[
          styles.toast,
          { backgroundColor: getBannerColor() }
        ]}
      >
        {(priority === 'critical' || priority === 'high') && (
          <View style={styles.priorityIndicator} />
        )}

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {title || 'Nueva Notificación'}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {body || ''}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onDismiss}
            style={styles.closeButton}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toast: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#EF4444',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  body: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
});

export default SimpleToast;