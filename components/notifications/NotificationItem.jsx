// RUTA: components/notifications/NotificationItem.jsx

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { 
  Sparkles, 
  FileText, 
  Wrench, 
  MessageCircle, 
  Bell, 
  ChevronDown, 
  ChevronUp,
  Trash2,
  CheckCircle,
  Truck,
} from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationItem({ notification, onDelete, onPress }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const swipeableRef = useRef(null);

  // ✅ Obtener ícono según el tipo de notificación
  const getIcon = () => {
    const { type } = notification;
    const iconSize = 24;
    const iconColor = '#FBBF24';

    switch(type) {
      case 'promotion':
      case 'custom_admin':
        return <Sparkles size={iconSize} color={iconColor} />;
      case 'budget_approval':
      case 'invoice_approval':
        return <FileText size={iconSize} color={iconColor} />;
      case 'service_update':
      case 'vehicle_ready':
        return <CheckCircle size={iconSize} color="#10B981" />;
      case 'parts_arrived':
        return <Wrench size={iconSize} color="#3B82F6" />;
      case 'new_message':
        return <MessageCircle size={iconSize} color="#8B5CF6" />;
      case 'tow_assigned':
        return <Truck size={iconSize} color="#F59E0B" />;
      default:
        return <Bell size={iconSize} color={iconColor} />;
    }
  };

  // ✅ MODIFICADO: Usar onPress del padre si existe, sino fallback a lógica interna
  const handlePress = () => {
    // Si el padre provee un onPress, usarlo (caso desde NotificationsScreen)
    if (onPress) {
      console.log('🎯 Usando onPress del padre');
      onPress(notification);
      return;
    }

    // Fallback: lógica interna original (por si se usa en otro lugar sin onPress)
    console.log('⚠️ Usando lógica interna de NotificationItem (fallback)');
    const { type, fileUrl, relatedId, actionUrl } = notification;

    // Si tiene adjunto, navegar al visor de archivos
    if (fileUrl) {
      router.push({
        pathname: '/FileViewer',
        params: { url: fileUrl }
      });
      return;
    }

    // Navegación según el tipo
    switch(type) {
      case 'budget_approval':
      case 'invoice_approval':
      case 'vehicle_ready':
        if (relatedId) {
          router.push(`/documents?documentId=${relatedId}`);
        } else {
          router.push('/documents');
        }
        break;
      case 'tow_assigned':
        router.push('/emergency/towRequest');
        break;
      case 'new_message':
        router.push('/(tabs)/chat');
        break;
      case 'service_update':
      case 'parts_arrived':
        router.push('/activity');
        break;
      case 'promotion':
        if (actionUrl) {
          router.push(actionUrl);
        } else {
          router.push('/documents');
        }
        break;
      default:
        router.push('/(tabs)');
        break;
    }
  };

  // ✅ Renderizar el botón de eliminar al deslizar
  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete(notification.id);
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Trash2 size={24} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // ✅ Formatear tiempo relativo
  const getTimeAgo = () => {
    if (!notification.createdAt) return 'Hace un momento';
    
    try {
      return formatDistanceToNow(notification.createdAt, {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return 'Hace un momento';
    }
  };

  return (
    <Swipeable
      ref__={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      overshootRight={false}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.notificationCard}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {/* Punto de no leído */}
          {!notification.read && (
            <View style={styles.unreadDot} />
          )}

          {/* Contenido principal */}
          <View style={styles.mainContent}>
            {/* Ícono y header */}
            <View style={styles.headerRow}>
              <View style={styles.iconContainer}>
                {getIcon()}
              </View>
              
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={isExpanded ? undefined : 2}>
                  {notification.title || 'Notificación'}
                </Text>
                <Text style={styles.timeText}>{getTimeAgo()}</Text>
              </View>

              {/* Botón de expandir */}
              <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                style={styles.expandButton}
              >
                {isExpanded ? (
                  <ChevronUp size={20} color="#94A3B8" />
                ) : (
                  <ChevronDown size={20} color="#94A3B8" />
                )}
              </TouchableOpacity>
            </View>

            {/* Mensaje/Body */}
            {notification.body && (
              <Text
                style={styles.bodyText}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {notification.body}
              </Text>
            )}

            {/* Contenido expandido adicional */}
            {isExpanded && notification.message && notification.message !== notification.body && (
              <Text style={styles.messageText}>
                {notification.message}
              </Text>
            )}

            {/* Badge de tipo */}
            {isExpanded && notification.type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {notification.type.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  notificationCard: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)', // slate-700/50
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FBBF24',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    zIndex: 10,
  },
  mainContent: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  expandButton: {
    padding: 4,
  },
  bodyText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  messageText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FBBF24',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
});