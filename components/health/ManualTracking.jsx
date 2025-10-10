import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Edit3, X, Check, Sparkles, Camera } from 'lucide-react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as ImagePicker from 'expo-image-picker';
import { callGeminiAPI } from '../../services/geminiService';
import { generateMaintenancePrompt } from './maintenanceSchedule';

export default function ManualTracking({ healthData, vehicleId, onUpdate, onAIAnalysis }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKm, setTempKm] = useState('');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanningOdometer, setScanningOdometer] = useState(false);

  const handleStartEdit = () => {
    setIsEditing(true);
    setTempKm(healthData.totalKm.toString());
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempKm('');
  };

  const handleSave = async () => {
    const newKm = parseInt(tempKm) || 0;

    if (newKm < 0) {
      Alert.alert('Error', 'Los kilómetros no pueden ser negativos');
      return;
    }

    if (newKm < healthData.totalKm) {
      Alert.alert(
        'Confirmación',
        `Estás ingresando menos kilómetros (${newKm.toLocaleString()}) que los actuales (${healthData.totalKm.toLocaleString()}).\n\n¿Estás seguro?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => saveKilometers(newKm) }
        ]
      );
      return;
    }

    await saveKilometers(newKm);
  };

  const saveKilometers = async (newKm) => {
    setSaving(true);
    
    try {
      console.log('💾 Guardando kilómetros:', newKm);

      const kmDifference = newKm - healthData.totalKm;
      const newKmThisMonth = Math.max(0, healthData.kmThisMonth + kmDifference);

      await updateDoc(doc(db, 'vehicleHealth', vehicleId), {
        currentKm: newKm,
        kmThisMonth: newKmThisMonth,
        lastUpdate: new Date().toISOString(),
      });

      console.log('✅ Kilómetros guardados exitosamente');

      setIsEditing(false);
      setTempKm('');
      
      if (onUpdate) {
        onUpdate();
      }

      Alert.alert('Éxito', `Kilómetros actualizados: ${newKm.toLocaleString()} km`);

    } catch (error) {
      console.error('❌ Error guardando kilómetros:', error);
      Alert.alert('Error', 'No se pudieron guardar los kilómetros. Intenta nuevamente.');
    }
    
    setSaving(false);
  };

  // 🤖 ANALIZAR CON IA - CON CALENDARIO Y CONCEPTOS DE DESGASTE
  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    
    try {
      console.log('🤖 Iniciando análisis con IA...');

      // Obtener historial de servicios
      const healthDoc = await getDoc(doc(db, 'vehicleHealth', vehicleId));
      const lastServices = healthDoc.data()?.lastServices || {};

      const daysSinceUpdate = healthData.lastUpdate 
        ? Math.floor((new Date() - new Date(healthData.lastUpdate)) / (1000 * 60 * 60 * 24))
        : 999;

      // Generar prompt con calendario de mantenimiento
      const maintenanceInfo = generateMaintenancePrompt(healthData.totalKm, lastServices);

      const prompt = `
Eres un mecánico experto certificado. Analiza la salud del vehículo:

📊 DATOS ACTUALES:
- Kilometraje: ${healthData.totalKm.toLocaleString()} km
- Días sin actualizar: ${daysSinceUpdate}
- Km este mes: ${healthData.kmThisMonth.toLocaleString()} km
- Health score previo: ${healthData.healthScore || 85}/100

${maintenanceInfo}

🎯 INSTRUCCIONES DE ANÁLISIS:

1. HEALTH SCORE (0-100):
   - Servicios vencidos críticos (failure_prevention): -30 puntos cada uno
   - Servicios vencidos normales (wear): -10 puntos cada uno
   - Servicios en warning: -5 puntos cada uno
   - Kilometraje alto sin mantenimiento: -15 puntos
   
2. PRIORIZAR RECOMENDACIONES:
   a) PRIMERO: Servicios vencidos de "failure_prevention" (URGENTE - evitan fallas catastróficas)
   b) SEGUNDO: Servicios vencidos de "wear" (Importante - desgaste normal)
   c) TERCERO: Servicios en zona warning
   d) CUARTO: Mantenimiento preventivo general

3. ALERTAS CRÍTICAS:
   - Solo generar alertas para servicios vencidos de categoría "failure_prevention"
   - Explicar las consecuencias de no atenderlos (fallas, daños mayores)

4. STATUS:
   - "excellent" (90-100): Todo al día, buen mantenimiento
   - "good" (70-89): Algunos servicios próximos pero manejable
   - "fair" (50-69): Servicios vencidos o varios próximos
   - "poor" (0-49): Servicios críticos vencidos, riesgo de fallas

Responde en JSON (sin markdown ni texto extra):
{
  "health_score": número 0-100,
  "status": "excellent" | "good" | "fair" | "poor",
  "recommendations": [
    "1. [URGENTE] Servicio crítico vencido...",
    "2. [IMPORTANTE] Desgaste normal a atender...",
    "3. [PREVENTIVO] Próximo mantenimiento..."
  ],
  "alerts": [
    "⚠️ CRÍTICO: Servicio X vencido - Riesgo de falla catastrófica"
  ],
  "next_maintenance": {
    "service": "nombre del servicio más urgente",
    "km": kilómetros hasta/desde ese servicio (negativo si vencido),
    "urgency": "low" | "medium" | "high"
  }
}
      `.trim();

      const systemInstruction = `Eres un mecánico automotriz certificado experto en diagnóstico predictivo.
Entiendes perfectamente la diferencia entre DESGASTE NORMAL (inevitable, mantenimiento regular) y FALLAS/DEFECTOS (prematuros, evitables con mantenimiento).
Priorizas la seguridad del conductor y la prevención de fallas costosas.
Respondes en español de forma clara y profesional.`;

      const response = await callGeminiAPI(prompt, systemInstruction);
      const analysis = JSON.parse(response);

      console.log('✅ Análisis recibido:', analysis);

      // Guardar análisis en Firestore
      await updateDoc(doc(db, 'vehicleHealth', vehicleId), {
        healthScore: analysis.health_score,
        lastAIAnalysis: new Date().toISOString(),
        aiRecommendations: analysis.recommendations,
        aiAlerts: analysis.alerts,
      });

      // Notificar al componente padre
      if (onAIAnalysis) {
        onAIAnalysis(analysis);
      }

      const alertsText = analysis.alerts && analysis.alerts.length > 0 
        ? `\n\n${analysis.alerts[0]}` 
        : '';

      Alert.alert(
        '✅ Análisis Completado',
        `Salud: ${analysis.health_score}/100 (${analysis.status.toUpperCase()})\n\n${analysis.recommendations[0]}${alertsText}`,
        [{ text: 'Ver Detalles', onPress: () => onUpdate() }]
      );

    } catch (error) {
      console.error('❌ Error en análisis:', error);
      Alert.alert('Error', 'No se pudo completar el análisis. Intenta nuevamente.');
    }
    
    setAnalyzing(false);
  };

  // 📸 ESCANEAR ODÓMETRO CON FOTO
  const handleScanOdometer = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a la cámara.');
        return;
      }

      setScanningOdometer(true);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        const prompt = "Extrae el número de kilómetros del odómetro. Responde SOLO el número sin texto adicional.";
        const systemInstruction = "Eres experto en OCR de odómetros vehiculares.";

        console.log('🖼️ Enviando imagen a Gemini...');
        
        // Convertir URI a base64
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64data = reader.result.split(',')[1];
          
          try {
            const geminiResponse = await callGeminiAPI(
              prompt, 
              systemInstruction, 
              base64data, 
              'image/jpeg'
            );
            
            let extractedKm = parseInt(geminiResponse.replace(/[^0-9]/g, ''));

            if (isNaN(extractedKm) || extractedKm === 0) {
              Alert.alert('Error', 'No pudimos leer el odómetro. Intenta de nuevo o ingresa manualmente.');
              setTempKm('');
            } else {
              setTempKm(extractedKm.toString());
              Alert.alert('✅ Escaneo Exitoso', `Se detectaron ${extractedKm.toLocaleString()} km.`);
            }
          } catch (error) {
            console.error('❌ Error procesando imagen:', error);
            Alert.alert('Error', 'No se pudo procesar la imagen.');
          } finally {
            setScanningOdometer(false);
          }
        };
        
        reader.readAsDataURL(blob);
      } else {
        setScanningOdometer(false);
      }
    } catch (error) {
      console.error('❌ Error escaneando odómetro:', error);
      Alert.alert('Error', 'No se pudo escanear el odómetro.');
      setScanningOdometer(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Edit3 size={20} color="#00d9ff" />
          <Text style={styles.title}>Actualización Manual</Text>
        </View>
      </View>

      <View style={styles.card}>
        {!isEditing ? (
          <>
            <View style={styles.kmDisplay}>
              <Text style={styles.kmValue}>
                {healthData.totalKm.toLocaleString('es-CL')}
              </Text>
              <Text style={styles.kmUnit}>km</Text>
            </View>

            <Text style={styles.lastUpdate}>
              Última actualización: {new Date(healthData.lastUpdate).toLocaleDateString('es-CL')}
            </Text>

            <TouchableOpacity
              style={styles.editButton}
              onPress={handleStartEdit}
            >
              <Edit3 size={18} color="#fff" />
              <Text style={styles.editButtonText}>Actualizar Kilómetros</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.editContainer}>
            <Text style={styles.editLabel}>Ingresa los kilómetros actuales:</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={tempKm}
                onChangeText={setTempKm}
                keyboardType="numeric"
                placeholder="Ej: 85000"
                placeholderTextColor="#64748B"
                editable={!saving && !scanningOdometer}
                autoFocus
              />
              <Text style={styles.inputUnit}>km</Text>
              <TouchableOpacity
                style={styles.scanOdometerButton}
                onPress={handleScanOdometer}
                disabled={scanningOdometer || saving}
              >
                {scanningOdometer ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <Camera size={20} color="#0F172A" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={saving || scanningOdometer}
              >
                <X size={18} color="#64748B" />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={saving || scanningOdometer}
              >
                {saving ? (
                  <Text style={styles.saveButtonText}>Guardando...</Text>
                ) : (
                  <>
                    <Check size={18} color="#0F172A" />
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {tempKm && parseInt(tempKm) >= 0 && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Vista previa:</Text>
                <Text style={styles.previewValue}>
                  {parseInt(tempKm).toLocaleString('es-CL')} km
                </Text>
                {parseInt(tempKm) > healthData.totalKm && (
                  <Text style={styles.previewDiff}>
                    +{(parseInt(tempKm) - healthData.totalKm).toLocaleString('es-CL')} km
                  </Text>
                )}
                {parseInt(tempKm) < healthData.totalKm && (
                  <Text style={styles.previewNegativeDiff}>
                    {(parseInt(tempKm) - healthData.totalKm).toLocaleString('es-CL')} km
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* BOTÓN DE ANÁLISIS IA - VISIBLE SIEMPRE */}
      <TouchableOpacity
        style={styles.aiAnalysisButton}
        onPress={handleAIAnalysis}
        disabled={analyzing}
      >
        {analyzing ? (
          <>
            <ActivityIndicator color="#0F172A" size="small" />
            <Text style={styles.aiAnalysisButtonText}>Analizando...</Text>
          </>
        ) : (
          <>
            <Sparkles size={18} color="#0F172A" />
            <Text style={styles.aiAnalysisButtonText}>Análisis Predictivo de IA</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 La IA diferencia entre desgaste normal (mantenimiento regular) y fallas/defectos (problemas prematuros).
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00d9ff33',
  },
  kmDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kmValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00d9ff',
  },
  kmUnit: {
    fontSize: 20,
    color: '#94A3B8',
    marginLeft: 8,
  },
  lastUpdate: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#00d9ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  editButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editContainer: {
    gap: 16,
  },
  editLabel: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00d9ff',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    paddingVertical: 16,
  },
  inputUnit: {
    fontSize: 18,
    color: '#64748B',
    marginLeft: 8,
  },
  scanOdometerButton: {
    backgroundColor: '#00d9ff',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#00d9ff',
  },
  saveButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: 'bold',
  },
  preview: {
    backgroundColor: '#00d9ff11',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00d9ff33',
  },
  previewLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d9ff',
  },
  previewDiff: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 4,
  },
  previewNegativeDiff: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  aiAnalysisButton: {
    backgroundColor: '#00d9ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  aiAnalysisButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00d9ff',
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
});