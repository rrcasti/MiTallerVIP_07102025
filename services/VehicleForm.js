// RUTA: app/vehicles/VehiclesForm.jsx

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Car, Wrench } from 'lucide-react-native';
// Importamos todas las funciones del servicio que necesitamos
import { getVehicleById, addVehicle, updateVehicle } from '../../services/vehicleService';

export default function VehiclesForm() {
  const router = useRouter();
  // Hook para leer el 'vehicleId' de la URL (ej: ?vehicleId=123)
  const { vehicleId } = useLocalSearchParams();
  
  const isEditMode = !!vehicleId; // True si estamos en modo edición

  const [formData, setFormData] = useState({
    brand: "", model: "", year: "", license_plate: "", color: "",
    vin: "", engine_type: "", displacement: "", recommended_oil: "",
    tire_pressure: "", modifications: "", custom_notes: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(isEditMode); // Muestra carga si estamos en modo edición

  // Este useEffect se encarga de cargar los datos del vehículo si estamos en modo edición
  useEffect(() => {
    if (isEditMode) {
      const loadVehicle = async () => {
        const vehicleData = await getVehicleById(vehicleId);
        if (vehicleData) {
          // Convertimos todos los valores a string para los TextInput
          const initialStrings = Object.entries(vehicleData).reduce((acc, [key, value]) => {
            acc[key] = String(value || '');
            return acc;
          }, {});
          setFormData(initialStrings);
        } else {
          Alert.alert("Error", "No se encontraron los datos del vehículo a editar.");
          router.back();
        }
        setIsFetchingData(false);
      };
      loadVehicle();
    }
  }, [vehicleId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!formData.brand.trim() || !formData.model.trim() || !formData.year.trim() || !formData.license_plate.trim()) {
      Alert.alert("Error", "Por favor completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        year: parseInt(formData.year) || 0,
      };

      if (isEditMode) {
        await updateVehicle(vehicleId, dataToSave);
        Alert.alert("Éxito", "Vehículo actualizado correctamente.");
      } else {
        await addVehicle(dataToSave);
        Alert.alert("Éxito", "Vehículo agregado correctamente.");
      }
      router.back();
    } catch (error) {
      console.error("Error guardando vehículo:", error);
      Alert.alert("Error", "Ocurrió un problema al guardar el vehículo.");
    } finally {
      setLoading(false);
    }
  };

  if (isFetchingData) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} disabled={loading}>
            <ArrowLeft size={24} color="#ea580c" />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.title}>{isEditMode ? "Editar Vehículo" : "Agregar Vehículo"}</Text>
            <Text style={styles.subtitle}>{isEditMode ? "Actualiza los datos" : "Registra tu vehículo"}</Text>
          </View>
        </View>

        {/* Formulario (Datos Básicos) */}
        <View style={styles.card}>
            <View style={styles.cardHeader}><Car size={20} color="#ea580c" /><Text style={styles.cardTitle}>Datos Básicos</Text></View>
            <View style={styles.cardContent}>
              {/* Campos del formulario... */}
              <Text style={styles.label}>Marca *</Text>
              <TextInput style={styles.input} value={formData.brand} onChangeText={(text) => handleChange("brand", text)} placeholder="Toyota, Ford, etc."/>
              <Text style={styles.label}>Modelo *</Text>
              <TextInput style={styles.input} value={formData.model} onChangeText={(text) => handleChange("model", text)} placeholder="Corolla, Focus, etc."/>
              <Text style={styles.label}>Año *</Text>
              <TextInput style={styles.input} value={formData.year} onChangeText={(text) => handleChange("year", text.replace(/[^0-9]/g, ""))} keyboardType="numeric" maxLength={4}/>
              <Text style={styles.label}>Patente *</Text>
              <TextInput style={styles.input} value={formData.license_plate} onChangeText={(text) => handleChange("license_plate", text.toUpperCase())} autoCapitalize="characters"/>
              <Text style={styles.label}>Color</Text>
              <TextInput style={styles.input} value={formData.color} onChangeText={(text) => handleChange("color", text)}/>
            </View>
        </View>
        
        {/* Formulario (Especificaciones Técnicas) */}
        {/* --- CÓDIGO NUEVO (COMPLETO) --- */}
<View style={styles.card}>
  <View style={styles.cardHeader}><Wrench size={20} color="#3b82f6" /><Text style={styles.cardTitle}>Especificaciones Técnicas</Text></View>
  <View style={styles.cardContent}>
    <Text style={styles.label}>Número de Chasis (VIN)</Text>
    <TextInput style={styles.input} value={formData.vin} onChangeText={(text) => handleChange("vin", text.toUpperCase())} autoCapitalize="characters" editable={!loading} />

    <Text style={styles.label}>Tipo de Motor</Text>
    <TextInput style={styles.input} value={formData.engine_type} onChangeText={(text) => handleChange("engine_type", text)} editable={!loading} />

    <Text style={styles.label}>Cilindrada</Text>
    <TextInput style={styles.input} value={formData.displacement} onChangeText={(text) => handleChange("displacement", text)} editable={!loading} />

    <Text style={styles.label}>Aceite Recomendado</Text>
    <TextInput style={styles.input} value={formData.recommended_oil} onChangeText={(text) => handleChange("recommended_oil", text)} editable={!loading} />

    <Text style={styles.label}>Presión de Neumáticos</Text>
    <TextInput style={styles.input} value={formData.tire_pressure} onChangeText={(text) => handleChange("tire_pressure", text)} editable={!loading} />

    <Text style={styles.label}>Modificaciones</Text>
    <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={formData.modifications} onChangeText={(text) => handleChange("modifications", text)} multiline editable={!loading} />

    <Text style={styles.label}>Notas Técnicas</Text>
    <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={formData.custom_notes} onChangeText={(text) => handleChange("custom_notes", text)} multiline editable={!loading} />
  </View>
</View>

        {/* Botones */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.button, styles.outlineButton]} disabled={loading}>
            <Text style={[styles.buttonText, styles.outlineButtonText]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.primaryButton]} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <><Save size={18} color="white" /><Text style={[styles.buttonText, { marginLeft: 8 }]}>{isEditMode ? "Actualizar" : "Guardar"}</Text></>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f8fafc", paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  subtitle: { fontSize: 14, color: "#64748b" },
  card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 24, padding: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 8, color: "#ea580c" },
  cardContent: { gap: 12 },
  label: { marginBottom: 4, color: "#64748b", fontSize: 14 },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: "#1e293b", backgroundColor: "#f8fafc" },
  buttonRow: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  button: { flex: 1, paddingVertical: 14, borderRadius: 8, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  primaryButton: { backgroundColor: "#ea580c" },
  outlineButton: { borderWidth: 1, borderColor: "#ea580c" },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  outlineButtonText: { color: "#ea580c" },
});