import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, FileText, Truck, CheckCircle, ChevronRight } from 'lucide-react-native';

const ActionRequiredCard = ({ notification, onDismiss }) => {
  const router = useRouter();
  
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  console.log('✅ ActionRequiredCard renderizado para:', notification.title);

  if (!notification) {
    return null;
  }

  const { title, body, data } = notification;
  const { type, priority, relatedId } = data || {};

  const getIcon = () => {
    switch(type) {
      case 'budget_approval':
      case 'invoice_approval':
        return <FileText size={28} color="#EF4444" />;
      case 'vehicle_ready':
        return <CheckCircle size={28} color="#10B981" />;
      case 'tow_assigned':
        return <Truck size={28} color="#F59E0B" />;
      default:
        return <AlertCircle size={28} color="#EF4444" />;
    }
  };

  const getActionText = () => {
    switch(type) {
      case 'budget_approval':
        return 'Revisar Presupuesto';
      case 'invoice_approval':
        return 'Revisar Factura';
      case 'vehicle_ready':
        return 'Ver Detalles';
      case 'tow_assigned':
        return 'Ver Grúa';
      default:
        return 'Ver Detalles';
    }
  };

  const handleAction = () => {
    console.log('✅ Acción principal del card:', type, relatedId);

    try {
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
        default:
          router.push('/(tabs)');
          break;
      }
    } catch (error) {
      console.error('❌ Error al navegar desde ActionRequiredCard:', error);
    }

    onDismiss();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>
              {title || 'Acción Requerida'}
            </Text>
            {priority === 'critical' && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENTE</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.body} numberOfLines={3}>
          {body || ''}
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            {getActionText()}
          </Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  urgentBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: '#64748B',
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
});

export default ActionRequiredCard;