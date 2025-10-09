// RUTA: components/health/ManualTracking.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Edit3, Save, MapPin } from 'lucide-react-native';
import CircularGauge from './CircularGauge';
import AIInsights from './AIInsights';
import * as ImagePicker from 'expo-image-picker';
import { base44 } from '../../api/base44Client';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ManualTracking({ healthData, onSwitchToGPS }) {
  const [editing, setEditing] = useState(false);
  const [newKm, setNewKm] = useState(healthData.totalKm.toString());
  const [uploading, setUploading] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const handleSaveKm = () => {
    const km = parseInt(newKm);
    if (isNaN(km) || km < 0) {
      Alert.alert('Error', 'Ingresa un valor válido');
      return;
    }

    // Aquí guardarías en Firebase
    Alert.alert('Guardado', `Kilómetros actualizados: ${km}`);
    setEditing(false);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      await extractKmFromPhoto(result.assets[0].uri);
    }
  };

  const extractKmFromPhoto = async (uri) => {
    setUploading(true);
    try {
      // Subir imagen
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: uri
      });

      // Extraer km con IA
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `
Analiza esta foto del odómetro/tablero del vehículo.
Extrae SOLO el número de kilómetros mostrado.
Si no puedes leer claramente, devuelve confidence bajo.
        `,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            kilometers: { type: "number" },
            confidence: { type: "number" },
            readable: { type: "boolean" }
          }
        }
      });

      if (response.readable && response.confidence > 70) {
        setNewKm(response.kilometers.toString());
        Alert.alert(
          'Lectura exitosa',
          `Se detectaron ${response.kilometers} km\n¿Es correcto?`,
          [
            { text: 'Sí, guardar', onPress: () => handleSaveKm() },
            { text: 'Editar', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(
          'No se pudo leer',
          'La imagen no es clara. Por favor ingresa manualmente.'
        );
      }
    } catch (error) {
      console.error('Error extracting km:', error);
      Alert.alert('Error', 'No se pudo procesar la imagen');
    }
    setUploading(false);
  };

  return (
    <View style={styles.container}>
      {/* Health Score */}
      <Animated.View 
        entering={FadeInDown.duration(800)}
        style={styles.scoreContainer}
      >
        <LinearGradient
          colors={['#1a1a2e', '#0f0f1a']}
          style={styles.scoreCard}
        >
          <CircularGauge
            value={healthData.healthScore}
            maxValue={100}
            size={200}
            strokeWidth={20}
            label="Health Score"
          />
          
          <View style={styles.estimatedBadge}>
            <Text style={styles.estimatedText}>📊 Basado en datos manuales</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* KM Input */}
      <Animated.View 
        entering={FadeInDown.delay(200).duration(800)}
        style={styles.inputCard}
      >
        <LinearGradient
          colors={['#00d9ff22', '#00d9ff11']}
          style={styles.inputGradient}
        >
          <Text style={styles.inputLabel}>Kilómetros Actuales</Text>
          
          {editing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.input}
                value={newKm}
                onChangeText={setNewKm}
                keyboardType="numeric"
                placeholder="Ej: 45000"
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveKm}
              >
                <Save size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.displayContainer}>
              <Text style={styles.kmValue}>
                {healthData.totalKm.toLocaleString()} km
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Edit3 size={20} color="#00d9ff" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleTakePhoto}
              disabled={uploading}
            >
              <Camera size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {uploading ? 'Procesando...' : 'Foto del Odómetro'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gpsButton}
              onPress={onSwitchToGPS}
            >
              <MapPin size={20} color="#00ff88" />
              <Text style={styles.buttonText}>Activar GPS</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats */}
      <Animated.View 
        entering={FadeInDown.delay(400).duration(800)}
        style={styles.statsContainer}
      >
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Este mes</Text>
          <Text style={styles.statValue}>{healthData.kmThisMonth}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Promedio</Text>
          <Text style={styles.statValue}>{healthData.avgKmPerMonth}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Próximo servicio</Text>
          <Text style={styles.statValue}>{healthData.nextOilChange} km</Text>
        </View>
      </Animated.View>

      {/* AI Insights */}
      <Animated.View entering={FadeInDown.delay(600).duration(800)}>
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => setShowAI(!showAI)}
        >
          <Text style={styles.aiButtonText}>
            {showAI ? 'Ocultar' : 'Ver'} Análisis IA
          </Text>
        </TouchableOpacity>

        {showAI && <AIInsights healthData={healthData} mode="manual" />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  scoreContainer: {
    marginBottom: 20,
  },
  scoreCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  estimatedBadge: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffa50022',
    borderRadius: 12,
  },
  estimatedText: {
    color: '#ffa500',
    fontSize: 12,
    fontWeight: '600',
  },
  inputCard: {
    marginBottom: 20,
  },
  inputGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00d9ff33',
  },
  inputLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  editContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#00d9ff',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  kmValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    gap: 12,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9b59b6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  aiButton: {
    backgroundColor: '#9b59b6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});