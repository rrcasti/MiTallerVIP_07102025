//components/health/DashboardSection.jsx con esto:

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Save,
  Plus,
  Brain,
  Calendar,
  Zap,
  X
} from 'lucide-react-native';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../firebase/config'; // Asegúrate que auth está aquí
import { calculateUpcomingServices } from './maintenanceSchedule';
import AIInsights from './AIInsights'; // Asegúrate que la ruta sea correcta

export default function DashboardSection({
  healthData,
  primaryVehicle,
  // mode, // Esta prop 'mode' no parece usarse aquí, considera si es necesaria
  onDataUpdate,
  onPointsEarned
}) {
  // --- LOG 1: Ver props recibidas ---
  console.log("DashboardSection - Props Recibidas -> healthData:", healthData, "primaryVehicle ID:", primaryVehicle?.id);

  const [editingKm, setEditingKm] = useState(false);
  const [newKm, setNewKm] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null); // Estado para guardar el resultado del análisis mock
  const [loadingAI, setLoadingAI] = useState(false); // Estado para el botón de análisis IA
  const [kmHistory, setKmHistory] = useState([]); // Estado local para el historial de KM
  const [trips, setTrips] = useState([]); // Estado local para los viajes

  // Carga kmHistory y trips específicos de este vehículo al montar o si cambia el vehículo
  useEffect(() => {
    if (primaryVehicle?.id) {
      // Solo carga si hay un ID de vehículo
      loadVehicleSpecificData();
    } else {
      // Si no hay vehículo (o se quita), limpiar los datos locales
      console.log("DashboardSection - No primaryVehicle ID, limpiando kmHistory y trips.");
      setKmHistory([]);
      setTrips([]);
    }
  }, [primaryVehicle]); // Dependencia clave: primaryVehicle

  // Función para cargar datos que *solo* usa DashboardSection (historial, viajes)
  const loadVehicleSpecificData = async () => {
    // No necesitamos loguear UID aquí si ya se hace en HealthScreen
    // console.log("DashboardSection - UID en cliente:", auth.currentUser?.uid);
    if (!primaryVehicle?.id) {
        console.warn("DashboardSection - loadVehicleSpecificData llamado sin ID.");
        return; // Guarda por si acaso
    }

    console.log("DashboardSection - Cargando kmHistory y trips para:", primaryVehicle.id);
    try {
      const healthRef = doc(db, 'vehicleHealth', primaryVehicle.id);
      const healthSnap = await getDoc(healthRef);

      if (healthSnap.exists()) {
        const data = healthSnap.data();
        console.log("DashboardSection - Datos encontrados, seteando kmHistory y trips.");
        setKmHistory(data.kmHistory || []);
        setTrips(data.trips || []);
      } else {
         console.log("DashboardSection - No se encontró healthDoc para cargar kmHistory/trips.");
         setKmHistory([]);
         setTrips([]);
      }
    } catch (error) {
      console.error('DashboardSection - Error loading local vehicle data (kmHistory/trips):', error);
      // Resetear estados en caso de error
      setKmHistory([]);
      setTrips([]);
    }
  };

  const handleSaveKm = async () => {
    const kmValue = parseInt(newKm);

    if (!newKm || isNaN(kmValue)) { // Verificar newKm en lugar de kmValue aquí
      Alert.alert('Error', 'Ingresa un kilometraje numérico válido');
      return;
    }

    // Usar el healthData recibido como prop, que debería ser el más actualizado
    const currentKm = healthData?.totalKm; // Usar optional chaining

    // Verificar si currentKm es válido antes de comparar
    if (currentKm === undefined || currentKm === null) {
       Alert.alert('Error', 'No se pudo obtener el kilometraje actual. Intenta recargar.');
       return;
    }

    if (kmValue < currentKm) {
      Alert.alert('Error', `El nuevo kilometraje (${kmValue.toLocaleString()}) debe ser mayor al actual (${currentKm.toLocaleString()} km).`);
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const kmDiff = kmValue - currentKm; // Diferencia respecto al último guardado

      // 1. Importar servicio de vehículos
      const { updateVehicle } = await import('../../services/vehicleService');

      // 2. Actualizar el VEHÍCULO (mileage y currentKm)
      await updateVehicle(primaryVehicle.id, {
        mileage: kmValue, // ✅ Campo principal
        // currentKm: kmValue, // ✅ Mantener sincronizado (Comentado según tu lógica)
        lastKmUpdate: now,
      });

      // 3. Actualizar healthData
      const healthRef = doc(db, 'vehicleHealth', primaryVehicle.id);
      await updateDoc(healthRef, {
        currentKm: kmValue, // Mantener sincronizado aquí también
        lastUpdate: now,
        kmHistory: arrayUnion({ // Añadir al historial
          km: kmValue,
          date: now,
          diff: kmDiff > 0 ? kmDiff : 0, // Guardar diferencia si es positiva
          source: 'manual_update',
        }),
      });

      console.log('✅ KM actualizado en vehicle.mileage y health:', kmValue);

      Alert.alert(
        '✅ Actualizado',
        `Kilometraje actualizado a ${kmValue.toLocaleString()} km`
      );

      setEditingKm(false);
      setNewKm('');

      if (onDataUpdate) onDataUpdate();
      loadVehicleSpecificData(); // Recargamos datos locales
      if (onPointsEarned) onPointsEarned(5, 'actualizar kilometraje');
    } catch (error) {
      console.error('Error saving km:', error);
      Alert.alert('Error', 'No se pudo actualizar');
    }
    setSaving(false);
  };

  // 🤖 ANÁLISIS PROFUNDO DE IA (REAL)
  const handleDeepAnalysis = async () => {
     // Añadir validación: No analizar si healthData no está listo
     if (!healthData || healthData.totalKm === undefined) {
        Alert.alert("Datos incompletos", "Espera a que carguen los datos del vehículo para analizar.");
        return;
      }

    setLoadingAI(true);

    try {
      // Calcular estadísticas de conducción
      const drivingStats = calculateDrivingStats(trips);
      const kmPerMonth = calculateKmPerMonth(kmHistory);
      // 👇 CORRECCIÓN: Añadir fallback defensivo para lastServices
      const upcomingServices = calculateUpcomingServices(healthData.totalKm, healthData.lastServices || {});
      const urgentServices = upcomingServices.filter(s => s.is_overdue || s.is_warning);

      // Simulación de respuesta (REEMPLAZA CON TU API REAL)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockAnalysis = {
        overall_health: `Tu ${primaryVehicle.brand} ${primaryVehicle.model} con ${healthData.totalKm.toLocaleString()} km está en condiciones ${healthData.healthScore >= 80 ? 'buenas' : 'aceptables'}. ${drivingStats.totalHarshBrakes > 10 ? 'Sin embargo, detectamos un patrón de frenadas bruscas frecuentes que puede acelerar el desgaste.' : 'El estilo de conducción es moderado.'}`,

        recommendations: [
          drivingStats.totalHarshBrakes > 10
            ? `🔴 Reducir frenadas bruscas (${drivingStats.totalHarshBrakes} detectadas). Aumenta distancia de seguridad.`
            : '✅ Mantén tu estilo de conducción actual',

          kmPerMonth > 2000
            ? `📏 Alto kilometraje mensual (${kmPerMonth} km/mes). Adelanta servicios de aceite.`
            : '✅ Kilometraje mensual normal',

          urgentServices.length > 0
            ? `⚠️ Tienes ${urgentServices.length} servicio(s) pendiente(s) - atiéndelos pronto`
            : '✅ Mantenimientos al día'
        ],

        risk_alerts: urgentServices
          .filter(s => s.is_overdue)
          .map(s => `${s.name} está VENCIDO hace ${Math.abs(s.km_until_service)} km`),

        driving_impact: {
          harsh_brakes: drivingStats.totalHarshBrakes,
          harsh_accel: drivingStats.totalHarshAccel,
          brake_wear: drivingStats.totalHarshBrakes > 10 ? '+30%' : 'Normal',
          clutch_wear: drivingStats.totalHarshAccel > 10 ? '+25%' : 'Normal',
        }
      };

      setAiAnalysis(mockAnalysis);

      if (onPointsEarned) {
        onPointsEarned(25, 'análisis de IA');
      }

    } catch (error) {
      console.error('Error en análisis:', error);
      Alert.alert('Error', 'No se pudo completar el análisis');
    }

    setLoadingAI(false);
  };

  const calculateDrivingStats = (tripsData) => {
    // 👇 CORRECCIÓN: Añadida verificación defensiva para 'undefined' o 'null'
    if (!tripsData || tripsData.length === 0) {
      return {
        totalHarshBrakes: 0,
        totalHarshAccel: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        totalIdleTime: 0,
      };
    }

    // El resto de tu lógica original
    return {
      totalHarshBrakes: tripsData.reduce((sum, t) => sum + (t.harshBrakes || 0), 0),
      totalHarshAccel: tripsData.reduce((sum, t) => sum + (t.harshAccelerations || 0), 0),
      avgSpeed: Math.round(
        tripsData.reduce((sum, t) => sum + (t.avgSpeed || 0), 0) / tripsData.length
      ),
      maxSpeed: Math.max(0, ...tripsData.map(t => t.maxSpeed || 0)), // Añadido 0 para evitar -Infinity
      totalIdleTime: tripsData.reduce((sum, t) => sum + (t.idleTime || 0), 0),
    };
  };

  const calculateKmPerMonth = (history) => {
    // 👇 CORRECCIÓN: Añadida verificación defensiva para 'undefined' o 'null'
    if (!history || history.length < 2) return 0;
    
    // El resto de tu lógica original
    const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    const kmDiff = (last.km || 0) - (first.km || 0); // Fallback defensivo
    const timeDiff = new Date(last.date).getTime() - new Date(first.date).getTime(); // getTime() es más seguro
    
    if (timeDiff <= 0) return 0; // Evitar división por cero
    
    const monthsDiff = timeDiff / (1000 * 60 * 60 * 24 * 30.44); // Promedio días mes
    
    return monthsDiff < 1 ? Math.round(kmDiff) : Math.round(kmDiff / monthsDiff);
  };

  // --- Cálculos para el Render ---
  // 👇 CORRECCIÓN: Añadidos fallbacks defensivos (??) para evitar errores si healthData es null/undefined
  const currentTotalKm = healthData?.totalKm ?? 0;
  const currentHealthScore = healthData?.healthScore ?? 85; // Fallback a 85
  const lastServicesData = healthData?.lastServices ?? {}; // Fallback a objeto vacío

  // Ahora las funciones se llaman con valores seguros
  const upcomingServices = calculateUpcomingServices(currentTotalKm, lastServicesData);
  const urgentServices = upcomingServices.filter(s => s.is_overdue || s.is_warning).slice(0, 3);
  const healthColor = currentHealthScore >= 90 ? '#10b981' : currentHealthScore >= 70 ? '#fbbf24' : '#ef4444';
  
  // Estas usan estados locales (kmHistory, trips) que se inicializan como [], por lo que son seguras.
  const kmPerMonth = calculateKmPerMonth(kmHistory);
  const drivingStats = calculateDrivingStats(trips);

  // --- LOG 2: Verificar healthData justo antes del return ---
  console.log("DashboardSection - healthData ANTES DE RENDER:", healthData);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Activity size={24} color="#00d9ff" />
        <Text style={styles.title}>Health Dashboard</Text>
      </View>

      {/* Health Score Gauge - ARRIBA */}
      <View style={styles.gaugeContainer}>
        <View style={[styles.gauge, { borderColor: healthColor }]}>
          <Text style={[styles.gaugeValue, { color: healthColor }]}>
            {/* 👇 CORRECCIÓN: Usar currentHealthScore que ya tiene fallback */}
            {currentHealthScore}%
          </Text>
          <Text style={styles.gaugeLabel}>Health Score</Text>
        </View>
      </View>

      {/* Kilometraje Card */}
      <View style={styles.kmCard}>
        <View style={styles.kmHeader}>
          <Text style={styles.kmTitle}>📍 Kilometraje Actual</Text>
          {/* 👇 CORRECCIÓN: Usar healthData !== null para saber si ya cargó */}
          {healthData !== null && !editingKm && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditingKm(true);
                setNewKm(currentTotalKm.toString()); // Usar valor actual calculado
              }}
            >
              <Plus size={16} color="#00d9ff" />
              <Text style={styles.editButtonText}>Actualizar</Text>
            </TouchableOpacity>
          )}
        </View>

        {editingKm ? (
          <View style={styles.kmEditContainer}>
            <TextInput
              style={styles.kmInput}
              value={newKm}
              onChangeText={setNewKm}
              keyboardType="number-pad"
              placeholder="Ingresa kilometraje"
              placeholderTextColor="#64748b"
            />
            <View style={styles.kmEditButtons}>
              <TouchableOpacity
                style={[styles.kmButton, styles.kmButtonCancel]}
                onPress={() => { setEditingKm(false); setNewKm(''); }}
              >
                <Text style={styles.kmButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.kmButton, styles.kmButtonSave, saving && styles.kmButtonDisabled]}
                onPress={handleSaveKm}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" /> // Color blanco para el spinner
                ) : (
                  <Save size={16} color="#fff" /> // Color blanco para el icono
                )}
                <Text style={[styles.kmButtonSaveText, {color: '#fff'}]}> {/* Color blanco para el texto */}
                  {saving ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.kmValue}>
              {/* 👇 CORRECCIÓN: Usar currentTotalKm que ya tiene fallback */}
              {currentTotalKm.toLocaleString()} km
            </Text>
            
            {kmPerMonth > 0 && (
              <View style={styles.kmStats}>
                <View style={styles.kmStat}>
                  <TrendingUp size={16} color="#10b981" />
                  <Text style={styles.kmStatText}>
                    ~{kmPerMonth.toLocaleString()} km/mes
                  </Text>
                </View>
                <Text style={styles.kmStatLabel}>
                  {kmHistory.length} actualizaciones | {trips.length} viajes grabados
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 🤖 BOTÓN DE ANÁLISIS CON IA - DESTACADO */}
      {/* 👇 CORRECCIÓN: Usar healthData !== null para saber si ya cargó */}
      {healthData !== null && (
        <TouchableOpacity
          style={[styles.aiAnalysisButton, loadingAI && styles.kmButtonDisabled]} // Aplicar estilo disabled
          onPress={handleDeepAnalysis}
          disabled={loadingAI}
          activeOpacity={0.8}
        >
          <View style={styles.aiButtonGlow}>
            {loadingAI ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Brain size={24} color="#fff" />
            )}
          </View>
          <View style={styles.aiButtonContent}>
            <Text style={styles.aiButtonTitle}>
              {loadingAI ? 'Analizando...' : '🤖 Analizar Patrones con IA'}
            </Text>
            <Text style={styles.aiButtonSubtitle}>
              {loadingAI
                ? 'La IA está evaluando tu vehículo...'
                : 'Análisis completo de conducción y desgaste'}
            </Text>
          </View>
          {!loadingAI && (
            <Zap size={20} color="#fff" />
          )}
        </TouchableOpacity>
      )}

      {/* Análisis de IA (si existe) */}
      {aiAnalysis && (
        <View style={styles.aiResultsContainer}>
          <View style={styles.aiHeader}>
            <Brain size={24} color="#6366f1" />
            <Text style={styles.aiHeaderTitle}>Análisis Completo de IA</Text>
            <TouchableOpacity onPress={() => setAiAnalysis(null)}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.aiSection}>
            <Text style={styles.aiSectionTitle}>📋 Estado General</Text>
            <Text style={styles.aiText}>{aiAnalysis.overall_health}</Text>
          </View>

          {aiAnalysis.recommendations.length > 0 && (
            <View style={styles.aiSection}>
              <Text style={styles.aiSectionTitle}>💡 Recomendaciones</Text>
              {aiAnalysis.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          {aiAnalysis.risk_alerts && aiAnalysis.risk_alerts.length > 0 && (
            <View style={[styles.aiSection, styles.criticalSection]}>
              <View style={styles.aiSectionHeader}>
                <AlertTriangle size={20} color="#ef4444" />
                <Text style={[styles.aiSectionTitle, { color: '#ef4444' }]}>
                  Alertas Críticas
                </Text>
              </View>
              {aiAnalysis.risk_alerts.map((alert, index) => (
                <View key={index} style={styles.alertItem}>
                  <Text style={styles.alertText}>⚠️ {alert}</Text>
                </View>
              ))}
            </View>
          )}

          {aiAnalysis.driving_impact && (
            <View style={styles.aiSection}>
              <Text style={styles.aiSectionTitle}>🎯 Impacto de tu Conducción</Text>
              <View style={styles.impactGrid}>
                <View style={styles.impactItem}>
                  <Text style={styles.impactLabel}>Desgaste Frenos</Text>
                  <Text style={[
                    styles.impactValue,
                    aiAnalysis.driving_impact.brake_wear !== 'Normal' && styles.impactWarning
                  ]}>
                    {aiAnalysis.driving_impact.brake_wear}
                  </Text>
                </View>
                <View style={styles.impactItem}>
                  <Text style={styles.impactLabel}>Desgaste Clutch</Text>
                  <Text style={[
                    styles.impactValue,
                    aiAnalysis.driving_impact.clutch_wear !== 'Normal' && styles.impactWarning
                  ]}>
                    {aiAnalysis.driving_impact.clutch_wear}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* TABLA DE PATRONES DE CONDUCCIÓN */}
      {trips.length > 0 && (
        <View style={styles.patternsCard}>
          <Text style={styles.patternsTitle}>📊 Patrones de Conducción Detectados</Text>
          <Text style={styles.patternsSubtitle}>Análisis de {trips.length} viajes</Text>

          {/* Tabla */}
          <View style={styles.patternsTable}>
            {/* Row 1: Frenadas Bruscas */}
            {drivingStats.totalHarshBrakes > 0 && (
              <View style={styles.patternRow}>
                <View style={styles.patternLeft}>
                  <Text style={styles.patternIcon}>🔴</Text>
                  <View style={styles.patternInfo}>
                    <Text style={styles.patternTitle}>Frenadas bruscas frecuentes</Text>
                    <Text style={styles.patternFreq}>{drivingStats.totalHarshBrakes} detectadas</Text>
                  </View>
                </View>
                <View style={styles.patternRight}>
                  <Text style={styles.patternComponent}>Pastillas de freno</Text>
                  <View style={styles.wearBadge}>
                    <Text style={styles.wearText}>+30%</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Row 2: Aceleraciones Agresivas */}
            {drivingStats.totalHarshAccel > 0 && (
              <View style={styles.patternRow}>
                <View style={styles.patternLeft}>
                  <Text style={styles.patternIcon}>⚡</Text>
                  <View style={styles.patternInfo}>
                    <Text style={styles.patternTitle}>Aceleraciones agresivas</Text>
                    <Text style={styles.patternFreq}>{drivingStats.totalHarshAccel} detectadas</Text>
                  </View>
                </View>
                <View style={styles.patternRight}>
                  <Text style={styles.patternComponent}>Clutch/transmisión</Text>
                  <View style={styles.wearBadge}>
                    <Text style={styles.wearText}>+25%</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Row 3: Alta Velocidad */}
            {drivingStats.avgSpeed > 80 && (
              <View style={styles.patternRow}>
                <View style={styles.patternLeft}>
                  <Text style={styles.patternIcon}>🏎️</Text>
                  <View style={styles.patternInfo}>
                    <Text style={styles.patternTitle}>Velocidad promedio alta</Text>
                    <Text style={styles.patternFreq}>{drivingStats.avgSpeed} km/h promedio</Text>
                  </View>
                </View>
                <View style={styles.patternRight}>
                  <Text style={styles.patternComponent}>Motor/neumáticos</Text>
                  <View style={styles.wearBadge}>
                    <Text style={styles.wearText}>+20%</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Row 4: Ralentí */}
            {drivingStats.totalIdleTime > 300 && (
              <View style={styles.patternRow}>
                <View style={styles.patternLeft}>
                  <Text style={styles.patternIcon}>⏱️</Text>
                  <View style={styles.patternInfo}>
                    <Text style={styles.patternTitle}>Mucho tiempo en ralentí</Text>
                    <Text style={styles.patternFreq}>{Math.round(drivingStats.totalIdleTime / 60)} min acumulados</Text>
                  </View>
                </View>
                <View style={styles.patternRight}>
                  <Text style={styles.patternComponent}>Batería/bujías</Text>
                  <View style={styles.wearBadge}>
                    <Text style={styles.wearText}>+15%</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.patternsFooter}>
            <AlertTriangle size={16} color="#fbbf24" />
            <Text style={styles.patternsFooterText}>
              Estos patrones aumentan el desgaste de componentes
            </Text>
          </View>
        </View>
      )}

      {/* --- LOG 3: Verificar healthData ANTES de la condición de AIInsights --- */}
      {console.log("DashboardSection - Verificando healthData para AIInsights:", healthData?.totalKm)}

      {/* --- RENDERIZADO CONDICIONAL DE AIInsights --- */}
      {/* 👇 CORRECCIÓN: Usar healthData !== null y healthData.totalKm !== undefined */}
      {healthData && healthData.totalKm !== undefined ? (
        <AIInsights
          healthData={healthData}
          // mode={'gps'} // 'mode' no está definido como prop, quitarlo o pasarlo desde HealthScreen
          vehicleInfo={primaryVehicle} // Pasar info del vehículo
          onRequestDeepAnalysis={handleDeepAnalysis} // Pasar si AIInsights la necesita
        />
      ) : (
        // Mostrar indicador si healthData no está lista
        <View style={styles.loadingAiContainer}>
          <ActivityIndicator size="small" color="#9b59b6" />
          <Text style={styles.loadingAiText}>Cargando Análisis IA...</Text>
        </View>
      )}


      {/* Preview de próximos servicios */}
      {/* 👇 CORRECCIÓN: Usar healthData !== null para saber si ya cargó */}
      {healthData && urgentServices.length > 0 && (
        <View style={styles.servicesPreview}>
          <Text style={styles.servicesTitle}>⚠️ Servicios Urgentes</Text>
          {urgentServices.map(service => (
            <View key={service.id} style={styles.serviceItem}>
              <View style={[
                styles.serviceIndicator,
                { backgroundColor: service.is_overdue ? '#ef4444' : '#fbbf24' }
              ]} />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceKm}>
                  {service.is_overdue
                    ? `VENCIDO hace ${Math.abs(service.km_until_service).toLocaleString()} km`
                    : `Faltan ${service.km_until_service.toLocaleString()} km`
                  }
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
} // Fin del componente DashboardSection

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // 👇 CORRECCIÓN: Añadir paddingHorizontal aquí si el ScrollView es el contenedor principal de la pestaña
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    // paddingHorizontal: 16, // Quitado si ya está en 'container'
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e2e8f0', // Ajustado a un blanco más suave
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gauge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b', // Fondo un poco más claro para el gauge
  },
  gaugeValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  gaugeLabel: {
    fontSize: 12,
    color: '#94a3b8', // Gris claro
    marginTop: 4,
    textTransform: 'uppercase', // Estilo adicional
  },
  kmCard: {
    backgroundColor: '#1e293b', // Fondo de tarjeta
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155', // Borde sutil
  },
  kmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  kmTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e2e8f0', // Blanco/Gris claro
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#334155', // Fondo botón
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00d9ff', // Color acento
  },
  kmValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d9ff', // Color acento
    marginBottom: 12,
  },
  kmStats: {
    gap: 6,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  kmStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kmStatText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981', // Verde para indicar tendencia
  },
  kmStatLabel: {
    fontSize: 13,
    color: '#94a3b8', // Gris claro
  },
  kmEditContainer: {
    gap: 12,
  },
  kmInput: {
    backgroundColor: '#0f172a', // Fondo más oscuro para input
    borderWidth: 1, // Cambiado a 1
    borderColor: '#334155', // Borde más sutil
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0', // Blanco/Gris claro
  },
  kmEditButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  kmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  kmButtonCancel: {
    backgroundColor: '#334155', // Gris oscuro
  },
  kmButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8', // Gris claro
  },
  kmButtonSave: {
    backgroundColor: '#00d9ff', // Azul acento
  },
  kmButtonDisabled: { // Estilo para botones deshabilitados
    opacity: 0.6,
  },
  kmButtonSaveText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a', // Texto oscuro para contraste
  },
  // --- Estilos IA ---
  aiAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#6366f1',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonGlow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#818cf8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiButtonContent: {
    flex: 1,
  },
  aiButtonTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  aiButtonSubtitle: {
    fontSize: 13,
    color: '#e0e7ff',
  },
  aiResultsContainer: {
    backgroundColor: '#1e293b', // Fondo tarjeta
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1, // Cambiado borde a 1
    borderColor: '#334155', // Borde sutil
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155', // Separador
  },
  aiHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0', // Blanco/Gris claro
    flex: 1,
  },
  aiSection: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#0f172a', // Fondo más oscuro
    borderRadius: 12,
  },
  aiSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // marginBottom: 12, // Quitado margen si el título ya lo tiene
  },
  aiSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e2e8f0', // Blanco/Gris claro
    marginBottom: 12,
  },
  aiText: {
    fontSize: 14,
    color: '#cbd5e1', // Gris más claro
    lineHeight: 22,
  },
  recommendationItem: {
    marginBottom: 8,
    paddingVertical: 6, // Reducido padding
    // backgroundColor: '#1e293b', // Quitado fondo extra si está dentro de aiSection
    // borderRadius: 8,
  },
  recommendationText: {
    fontSize: 13,
    color: '#94a3b8', // Gris claro
    lineHeight: 20,
  },
  criticalSection: {
    borderWidth: 1, // Cambiado borde a 1
    borderColor: '#ef4444', // Rojo para crítico
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Fondo rojo translúcido
  },
  alertItem: {
    marginBottom: 8,
  },
  alertText: {
    fontSize: 13,
    color: '#fca5a5', // Rojo claro
    lineHeight: 20,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  impactItem: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1e293b', // Fondo tarjeta
    borderRadius: 8,
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 11,
    color: '#94a3b8', // Gris claro
    marginBottom: 6,
    textTransform: 'uppercase', // Estilo
  },
  impactValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981', // Verde por defecto
  },
  impactWarning: {
    color: '#ef4444', // Rojo si hay advertencia
  },
  // --- Estilos Patrones ---
  patternsCard: {
    backgroundColor: '#1e293b', // Fondo tarjeta
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1, // Cambiado borde a 1
    borderColor: '#334155', // Borde sutil
  },
  patternsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0', // Blanco/Gris claro
    marginBottom: 4,
  },
  patternsSubtitle: {
    fontSize: 13,
    color: '#94a3b8', // Gris claro
    marginBottom: 16,
  },
  patternsTable: {
    gap: 12,
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a', // Fondo más oscuro
    padding: 12,
    borderRadius: 12,
    // borderLeftWidth: 4, // Quitado borde izquierdo por defecto
    // borderLeftColor: '#ef4444',
  },
  patternLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8, // Añadir espacio
  },
  patternIcon: {
    fontSize: 18, // Reducido tamaño
  },
  patternInfo: {
    flex: 1,
  },
  patternTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0', // Blanco/Gris claro
    marginBottom: 2,
  },
  patternFreq: {
    fontSize: 12,
    color: '#64748b', // Gris medio
  },
  patternRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  patternComponent: {
    fontSize: 12,
    color: '#94a3b8', // Gris claro
  },
  wearBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)', // Fondo rojo translúcido
    paddingHorizontal: 8, // Ajustado padding
    paddingVertical: 3, // Ajustado padding
    borderRadius: 6,
  },
  wearText: {
    fontSize: 12, // Reducido tamaño
    fontWeight: 'bold',
    color: '#fca5a5', // Rojo claro
  },
  patternsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#334155', // Fondo gris oscuro
    borderRadius: 8,
  },
  patternsFooterText: {
    fontSize: 12,
    color: '#fbbf24', // Ambar
    flex: 1,
  },
  // --- Estilos Servicios Preview ---
  servicesPreview: {
    backgroundColor: '#1e293b', // Fondo tarjeta
    padding: 16,
    borderRadius: 16,
    marginTop: 8, // Reducido margen
    borderWidth: 1,
    borderColor: '#334155', // Borde sutil
  },
  servicesTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e2e8f0', // Blanco/Gris claro
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  serviceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0', // Blanco/Gris claro
    marginBottom: 2,
  },
  serviceKm: {
    fontSize: 12,
    color: '#94a3b8', // Gris claro
  },
  // --- NUEVOS ESTILOS PARA CARGA DE IA ---
  loadingAiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    marginTop: 16, // Espacio antes del indicador
    backgroundColor: '#1e293b', // Fondo tarjeta
    borderRadius: 12,
  },
  loadingAiText: {
    color: '#94a3b8', // Gris claro
    fontSize: 13,
  },
});