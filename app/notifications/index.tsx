// RUTA: app/notifications/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useInAppNotification } from '../../components/context/InAppNotificationContext';
import { useNotificationCount } from '../../components/context/NotificationCountContext'; // ✅ NUEVO
import { collection, query, where, getDocs, orderBy, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Bell, Trash2, ArrowLeft } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import NotificationItem from '../../components/notifications/NotificationItem';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showPromotionModal } = useInAppNotification();
  const { setTotalCount } = useNotificationCount(); // ✅ OBTENER setTotalCount del contexto
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Cargar notificaciones desde Firestore
  const loadNotifications = async () => {
    if (!user?.uid) {
      console.warn('⚠️ Usuario no autenticado');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('📬 Cargando notificaciones para:', user.uid);

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      const notifList = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
      }));

      setNotifications(notifList);
      
      // ✅ NUEVO: Publicar el conteo total de notificaciones al contexto global
      setTotalCount(notifList.length);
      
      console.log(`✅ ${notifList.length} notificaciones cargadas`);
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Marcar TODAS las notificaciones como leídas al enfocar la pantalla
  const markAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) {
        console.log('ℹ️ No hay notificaciones sin leer');
        return;
      }

      console.log(`📖 Marcando ${unreadNotifications.length} notificaciones como leídas...`);

      const batch = writeBatch(db);

      unreadNotifications.forEach(notification => {
        const notifRef = doc(db, 'notifications', notification.id);
        batch.update(notifRef, { read: true });
      });

      await batch.commit();

      console.log('✅ Todas las notificaciones marcadas como leídas');

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('❌ Error marcando notificaciones como leídas:', error);
    }
  };

  // ✅ Efecto para marcar como leídas cuando se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      console.log('🔔 Pantalla de notificaciones enfocada');
      markAllAsRead();
    }, [notifications])
  );

  // ✅ Cargar notificaciones al montar
  useEffect(() => {
    loadNotifications();
  }, [user]);

  // ✅ Refresh manual
  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  // ✅ Manejar el press de una notificación usando PromotionModal para imágenes
  const handleNotificationPress = async (notification) => {
    console.log('👆 Notificación presionada:', notification.type, notification.id);

    const { type, relatedId, fileUrl, imageUrl, title, data } = notification;
    const notificationData = data || {};

    // Navegación según el tipo de notificación
    switch (type) {
      case 'promotion':
        console.log('🎉 Mostrando PromotionModal para imagen promocional');
        const promoImageUrl = fileUrl || imageUrl || notificationData.imageUrl || notificationData.fileUrl;
        if (promoImageUrl) {
          const promotionNotification = {
            title: title || 'Promoción Especial',
            body: notification.body || notification.message || '',
            data: {
              type: 'promotion',
              imageUrl: promoImageUrl,
              fileUrl: promoImageUrl,
            },
          };
          showPromotionModal(promotionNotification);
        } else {
          console.warn('⚠️ Notificación de promoción sin URL de imagen');
          router.push('/(tabs)');
        }
        break;

      case 'budget_approval':
      case 'invoice_approval':
        console.log('➡️ Navegando a aprobación de documentos');
        if (relatedId) {
          router.push(`/documents/approval?documentId=${relatedId}`);
        } else {
          router.push('/documents');
        }
        break;

      case 'service_update':
      case 'vehicle_ready':
        console.log('➡️ Navegando a servicios/reparaciones');
        if (relatedId) {
          router.push(`/(tabs)/repairs?repairId=${relatedId}`);
        } else {
          router.push('/(tabs)/repairs');
        }
        break;

      case 'new_message':
        console.log('➡️ Navegando al chat');
        router.push('/chat');
        break;

      case 'tow_assigned':
        console.log('➡️ Navegando a solicitud de grúa');
        router.push('/emergency/towRequest');
        break;

      default:
        console.log('➡️ Navegando a notificaciones generales');
        router.push('/(tabs)/notifications');
        break;
    }
  };

  // ✅ Eliminar una notificación específica
  const handleDeleteNotification = async (notificationId) => {
    try {
      console.log('🗑️ Eliminando notificación:', notificationId);
      
      await deleteDoc(doc(db, 'notifications', notificationId));
      
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        // ✅ NUEVO: Actualizar el conteo después de eliminar
        setTotalCount(updated.length);
        return updated;
      });
      
      console.log('✅ Notificación eliminada');
    } catch (error) {
      console.error('❌ Error eliminando notificación:', error);
      Alert.alert('Error', 'No se pudo eliminar la notificación');
    }
  };

  // ✅ Borrar todas las notificaciones
  const handleDeleteAll = () => {
    Alert.alert(
      'Eliminar Todo',
      '¿Estás seguro de que quieres eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Eliminando todas las notificaciones...');
              
              const batch = writeBatch(db);
              
              notifications.forEach(notification => {
                const notifRef = doc(db, 'notifications', notification.id);
                batch.delete(notifRef);
              });
              
              await batch.commit();
              
              setNotifications([]);
              
              // ✅ NUEVO: Actualizar el conteo a 0 después de eliminar todas
              setTotalCount(0);
              
              console.log('✅ Todas las notificaciones eliminadas');
            } catch (error) {
              console.error('❌ Error eliminando notificaciones:', error);
              Alert.alert('Error', 'No se pudieron eliminar las notificaciones');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FBBF24" />
          <Text style={styles.loadingText}>Cargando notificaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color="#E2E8F0" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Bell size={24} color="#FBBF24" />
            <Text style={styles.headerTitle}>Notificaciones</Text>
            {/* ✅ NUEVO: Mostrar el conteo en el header también */}
            {notifications.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{notifications.length}</Text>
              </View>
            )}
          </View>

          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleDeleteAll}
              style={styles.deleteAllButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de Notificaciones */}
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color="#475569" />
            <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
            <Text style={styles.emptySubtitle}>
              Aquí aparecerán tus actualizaciones y mensajes importantes
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FBBF24"
                colors={['#FBBF24']}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onDelete={handleDeleteNotification}
                onPress={handleNotificationPress}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteAllButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
});