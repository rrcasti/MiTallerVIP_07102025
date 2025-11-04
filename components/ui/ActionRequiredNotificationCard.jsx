import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native'; // Importar Animated
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, FileText, Truck, X, ChevronRight } from 'lucide-react-native';

const ActionRequiredCard = ({ notification, onDismiss, index = 0 }) => { // index para offset si hay varias
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Animación para aparecer desde abajo
  const slideAnim = React.useRef(new Animated.Value(200)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  console.log('🔴 ActionRequiredCard renderizado:', notification);

  if (!notification) {
    return null;
  }

  const { title, body, data } = notification;
  const { type, priority, relatedId } = data || {};

  // Determinar el ícono según el tipo
  const getIcon = () => {
    switch(type) {
      case 'budget_approval':
      case 'invoice_approval':
        return <FileText size={28} color="#EF4444" />;
      case 'tow_assigned':
        return <Truck size={28} color="#F59E0B" />;
      default:
        return <AlertCircle size={28} color="#EF4444" />;
    }
  };

  // Determinar el texto del botón de acción
  const getActionText = () => {
    switch(type) {
      case 'budget_approval':
        return 'Revisar Presupuesto';
      case 'invoice_approval':
        return 'Revisar Factura';
      case 'tow_assigned':
        return 'Ver Detalles de Grúa';
      default:
        return 'Ver Detalles';
    }
  };

  // Manejar la acción principal
  const handleAction = () => {
    console.log('✅ Acción principal del card:', type, relatedId);

    try {
      switch(type) {
        case 'budget_approval':
        case 'invoice_approval':
          if (relatedId) {
            router.push(`/documents/approval?documentId=${relatedId}`);
          } else {
            router.push('/documents');
          }
          break;
        case 'tow_assigned':
          router.push('/emergency/towRequest');
          break;
        default:
          router.push('/(tabs)/notifications'); // O a una pantalla de notificaciones general
          break;
      }
    } catch (error) {
      console.error('❌ Error al navegar desde ActionRequiredCard:', error);
    }

    // Cerrar la tarjeta después de navegar
    onDismiss();
  };

  return (
    <Animated.View style={[
        styles.container, 
        { 
          bottom: insets.bottom + 20 + (index * 150), // Offset si hay múltiples tarjetas
          transform: [{ translateY: slideAnim }] 
        }
    ]}>
      <View style={styles.card}>
        {/* Header con icono y título */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>
              {title || 'Acción Requerida'}
            </Text>
            {priority === 'high' && ( // Cambiado de 'critical' para que se muestre con 'high'
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENTE</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              console.log('❌ ActionRequiredCard cerrado manualmente');
              onDismiss();
            }}
            style={styles.closeButton}
          >
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Cuerpo del mensaje */}
        <Text style={styles.body} numberOfLines={3}>
          {body || ''}
        </Text>

        {/* Botón de acción */}
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
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9998, // ✅ Asegurar que esté por debajo de modals, pero por encima de contenido
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
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