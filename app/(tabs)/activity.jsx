import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Sparkles, Wrench } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useVehicles } from '../../context/VehicleContext';
import { useNotificationCount } from '../../components/context/NotificationCountContext';

// Servicios
import { analyzeVehicleWithAI, buildVehicleContext } from '../../services/aiAnalysisService';
import { loadUserActivity, subscribeToServiceRequests } from '../../services/activityService';
import { getVehicleById } from '../../services/vehicleService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Componentes
import CriticalCard from '../../components/activity/CriticalCard';
import PreventiveCard from '../../components/activity/PreventiveCard';
import EducationalCard from '../../components/activity/EducationalCard';
import EmptyStateEducation from '../../components/activity/EmptyStateEducation';
import ServiceRequestCard from '../../components/activity/ServiceRequestCard';

/**
 * PANTALLA: Mi Actividad
 * 
 * Sistema inteligente con IA que:
 * 1. Analiza el estado del vehículo
 * 2. Prioriza lo crítico vs lo preventivo
 * 3. Genera contenido educativo cuando no hay urgencias
 * 4. "Siembra semillas" de marketing preventivo
 * 5. 🆕 Actualiza serviceRequests en TIEMPO REAL
 */
export default function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { vehicles } = useVehicles();
  const { totalCount } = useNotificationCount(); // ✅ USAR totalCount DEL CONTEXTO
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [primaryVehicle, setPrimaryVehicle] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [userActivity, setUserActivity] = useState(null);

  // 🆕 Ref para guardar la función unsubscribe del listener
  const unsubscribeRef = useRef(null);

  // Cargar vehículo principal
  useEffect(() => {
    if (vehicles.length > 0) {
      console.log('🚗 Vehículo principal:', vehicles[0]);
      setPrimaryVehicle(vehicles[0]);
    }
  }, [vehicles]);

  // 🆕 LISTENER EN TIEMPO REAL para serviceRequests
  useEffect(() => {
    if (!user) return;

    console.log('🔴 [REAL-TIME] Configurando listener de serviceRequests...');

    // Iniciar el listener
    const unsubscribe = subscribeToServiceRequests(user.uid, (updatedRequests) => {
      console.log(`✅ [REAL-TIME] Recibidas ${updatedRequests.length} solicitudes actualizadas`);
      
      // Actualizar solo las serviceRequests en userActivity
      setUserActivity(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          serviceRequests: updatedRequests,
          totalPending: (prev.notifications?.length || 0) + 
                       (prev.pendingDocuments?.length || 0) + 
                       updatedRequests.filter(s => s.status === 'pendiente').length
        };
      });
    });

    // Guardar función unsubscribe
    unsubscribeRef.current = unsubscribe;

    // Limpiar listener cuando el componente se desmonta
    return () => {
      console.log('🔴 [REAL-TIME] Desconectando listener...');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user]);

  // Recargar cuando la pantalla está enfocada
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Pantalla Mi Actividad enfocada - Recargando datos...');
      loadAllData();
    }, [primaryVehicle, user])
  );

  /**
   * Carga todos los datos necesarios
   */
  const loadAllData = async () => {
    if (!user || !primaryVehicle) {
      console.log('⚠️ No hay usuario o vehículo');
      setLoading(false);
      return;
    }

    try {
      console.log('📊 Iniciando carga de datos para Mi Actividad...');

      // 1. Cargar health data del vehículo
      const healthRef = doc(db, 'vehicleHealth', primaryVehicle.id);
      const healthDoc = await getDoc(healthRef);
      const health = healthDoc.exists() ? healthDoc.data() : null;
      setHealthData(health);

      // 2. Cargar actividad del usuario (notificaciones, documentos, mensajes)
      const activity = await loadUserActivity(user.uid, user.email);
      setUserActivity(activity);

      // ✅ NO TOCAR EL CONTADOR - Lo maneja la página de Notificaciones

      // 3. Obtener vehículo real de Firebase
      const realVehicle = await getVehicleById(primaryVehicle.id);

      // 4. Construir contexto completo
      const context = buildVehicleContext(realVehicle, health, []);

      // 5. Analizar con IA
      console.log('🤖 Enviando a análisis con IA...');
      const analysis = await analyzeVehicleWithAI(context);
      setAiAnalysis(analysis);

      console.log('✅ Análisis completado:', analysis.summary);

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }

    setLoading(false);
  };

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d9ff" />
          <Text style={styles.loadingText}>Analizando tu vehículo con IA...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Separar items por categoría
  const criticalItems = aiAnalysis?.items.filter(i => i.category === 'critical') || [];
  const preventiveItems = aiAnalysis?.items.filter(i => i.category === 'preventive') || [];
  const educationalItems = aiAnalysis?.items.filter(i => i.category === 'educational') || [];

  const totalPending = criticalItems.length + preventiveItems.length + (userActivity?.totalPending || 0);

  // Si no hay nada que mostrar → Estado educativo
  const showEmptyState = criticalItems.length === 0 && 
                         preventiveItems.length === 0 && 
                         totalPending === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d9ff"
            colors={['#00d9ff']}
          />
        }
      >
        {/* Header con summary de IA */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Mi Actividad</Text>
            
            {/* Contenedor de íconos en el header */}
            <View style={styles.headerIcons}>
              {totalPending > 0 && (
                <View style={styles.badge}>
                  <Bell size={16} color="#fff" />
                  <Text style={styles.badgeText}>{totalPending}</Text>
                </View>
              )}
              
              {/* ✅ Botón de notificaciones con contador del CONTEXTO */}
              <TouchableOpacity
                onPress={() => router.push('/notifications')}
                style={styles.notificationButton}
              >
                <Bell size={24} color="#00d9ff" />
                {totalCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {totalCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {aiAnalysis?.summary && (
            <View style={styles.summaryCard}>
              <Sparkles size={20} color="#00d9ff" style={{ marginRight: 8 }} />
              <Text style={styles.summaryText}>{aiAnalysis.summary}</Text>
            </View>
          )}
        </View>

        {/* Estado vacío educativo */}
        {showEmptyState && (
          <EmptyStateEducation items={educationalItems} />
        )}

        {/* Items críticos (siempre primero) */}
        {criticalItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🚨 Atención Urgente</Text>
              <Text style={styles.sectionSubtitle}>Requiere acción inmediata</Text>
            </View>
            {criticalItems.map((item, index) => (
              <CriticalCard key={index} item={item} />
            ))}
          </View>
        )}

        {/* 🆕 SOLICITUDES DE SERVICIO CON ACTUALIZACIÓN EN TIEMPO REAL */}
        {userActivity?.serviceRequests && 
         userActivity.serviceRequests.filter(r => r.status !== 'cancelado').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Wrench size={24} color="#00d9ff" />
                <Text style={styles.sectionTitle}>
                  Mis Solicitudes ({userActivity.serviceRequests.filter(r => r.status !== 'cancelado').length})
                </Text>
              </View>
              <Text style={styles.sectionSubtitle}>🔴 Actualizadas en tiempo real</Text>
            </View>
            {userActivity.serviceRequests
              .filter(r => r.status !== 'cancelado')
              .map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  onUpdate={loadAllData}
                />
              ))}
          </View>
        )}

        {/* Items preventivos */}
        {preventiveItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🛡️ Mantenimiento Preventivo</Text>
              <Text style={styles.sectionSubtitle}>Recomendaciones para tu vehículo</Text>
            </View>
            {preventiveItems.map((item, index) => (
              <PreventiveCard key={index} item={item} />
            ))}
          </View>
        )}

        {/* Contenido educativo (solo si hay otras cosas) */}
        {!showEmptyState && educationalItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💡 Tips y Consejos</Text>
              <Text style={styles.sectionSubtitle}>Para cuidar mejor tu vehículo</Text>
            </View>
            {educationalItems.slice(0, 2).map((item, index) => (
              <EducationalCard key={index} item={item} />
            ))}
          </View>
        )}

        {/* 🆕 HISTORIAL CANCELADO */}
        {userActivity?.serviceRequests && 
         userActivity.serviceRequests.filter(r => r.status === 'cancelado').length > 0 && (
          <View style={[styles.section, styles.historySection]}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.historyIconContainer}>
                  <Wrench size={20} color="#666" />
                </View>
                <View>
                  <Text style={styles.historySectionTitle}>
                    Historial Cancelado
                  </Text>
                  <Text style={styles.historyCount}>
                    {userActivity.serviceRequests.filter(r => r.status === 'cancelado').length} solicitud(es)
                  </Text>
                </View>
              </View>
            </View>
            {userActivity.serviceRequests
              .filter(r => r.status === 'cancelado')
              .sort((a, b) => new Date(b.cancelledAt || b.createdAt) - new Date(a.cancelledAt || a.createdAt))
              .map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  onUpdate={loadAllData}
                />
              ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
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
    borderColor: '#0a0e27',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00d9ff',
  },
  summaryText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  historySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  historyCount: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});