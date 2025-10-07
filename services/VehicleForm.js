import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { ArrowLeft, Save, Car } from "lucide-react-native";

// CAMBIO 1: Este componente ahora es más "tonto". Solo recibe props y reporta datos.
// Se quitan las importaciones de firebase y router, ya no las necesita.
export default function VehicleForm({ onSave, onCancel, loading, initialData, isEditMode }) {

  // CAMBIO 2: El estado inicial se establece a partir de 'initialData' si existe.
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: "",
    license_plate: "",
    color: "",
    vin: "",
    engine_type: "",
    displacement: "",
    recommended_oil: "",
    tire_pressure: "",
    modifications: "",
    custom_notes: ""
  });

  // CAMBIO 3: Un useEffect que rellena el formulario cuando los datos iniciales están listos.
  useEffect(() => {
    if (initialData) {
      // Nos aseguramos de que todos los campos sean strings para evitar errores en los TextInput
      const initialStrings = Object.entries(initialData).reduce((acc, [key, value]) => {
        acc[key] = String(value || '');
        return acc;
      }, {});
      setFormData(initialStrings);
    }
  }, [initialData]);


  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateYear = (yearStr) => {
    // ... (la función de validación no cambia)
    const yearNum = parseInt(yearStr);
    const currentYear = new Date().getFullYear();
    if (!yearNum || yearNum < 1900 || yearNum > currentYear) {
      return false;
    }
    return true;
  };

  // CAMBIO 4: 'handleSubmit' ahora solo valida y llama a 'onSave' con los datos.
  // Ya no se comunica directamente con Firebase.
  const handleSubmit = () => {
    if (loading) return;

    if (!formData.brand.trim() || !formData.model.trim() || !formData.year.trim() || !formData.license_plate.trim()) {
      Alert.alert("Error", "Por favor completa los campos obligatorios.");
      return;
    }
    if (!validateYear(formData.year)) {
      Alert.alert("Error", `El año debe ser un número entre 1900 y ${new Date().getFullYear()}.`);
      return;
    }

    // Llama a la función 'onSave' del padre, pasándole los datos limpios.
    onSave({
      ...formData,
      year: parseInt(formData.year),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} disabled={loading}>
          <ArrowLeft size={24} color="#ea580c" />
        </TouchableOpacity>
        <View style={{ marginLeft: 12 }}>
          {/* CAMBIO 5: El título ahora depende de la prop 'isEditMode' */}
          <Text style={styles.title}>{isEditMode ? "Editar Vehículo" : "Agregar Vehículo"}</Text>
          <Text style={styles.subtitle}>{isEditMode ? "Actualiza los datos" : "Registra tu vehículo"}</Text>
        </View>
      </View>

      {/* El resto del formulario (TextInput, etc.) no necesita grandes cambios */}
      {/* ... (tu código JSX para los inputs va aquí) ... */}
      <View style={styles.card}>
        <View style={styles.cardHeader}><Car size={20} color="#ea580c" /><Text style={styles.cardTitle}>Datos Básicos</Text></View>
        <View style={styles.cardContent}>
          <View style={styles.row}>
            <View style={styles.inputContainer}><Text style={styles.label}>Marca *</Text><TextInput style={styles.input} value={formData.brand} onChangeText={(text) => handleChange("brand", text)} placeholder="Toyota, Ford, etc." autoCapitalize="words" editable={!loading} /></View>
            <View style={styles.inputContainer}><Text style={styles.label}>Modelo *</Text><TextInput style={styles.input} value={formData.model} onChangeText={(text) => handleChange("model", text)} placeholder="Corolla, Focus, etc." autoCapitalize="words" editable={!loading} /></View>
          </View>
          <View style={styles.row}>
            <View style={styles.inputContainer}><Text style={styles.label}>Año *</Text><TextInput style={styles.input} value={formData.year} onChangeText={(text) => handleChange("year", text.replace(/[^0-9]/g, ""))} placeholder="2023" keyboardType="numeric" maxLength={4} editable={!loading} /></View>
            <View style={styles.inputContainer}><Text style={styles.label}>Patente *</Text><TextInput style={styles.input} value={formData.license_plate} onChangeText={(text) => handleChange("license_plate", text.toUpperCase())} placeholder="ABC123" autoCapitalize="characters" maxLength={10} editable={!loading} /></View>
          </View>
          <View style={styles.inputContainer}><Text style={styles.label}>Color</Text><TextInput style={styles.input} value={formData.color} onChangeText={(text) => handleChange("color", text)} placeholder="Blanco, Negro, Rojo, etc." autoCapitalize="words" editable={!loading} /></View>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>Especificaciones Técnicas</Text></View>
        <View style={styles.cardContent}>
          <View style={styles.inputContainer}><Text style={styles.label}>Número de Chasis (VIN)</Text><TextInput style={styles.input} value={formData.vin} onChangeText={(text) => handleChange("vin", text.toUpperCase())} placeholder="Ej: 1HGBH41JXMN109186" autoCapitalize="characters" editable={!loading} /></View>
          <View style={styles.row}>
            <View style={styles.inputContainer}><Text style={styles.label}>Tipo de Motor</Text><TextInput style={styles.input} value={formData.engine_type} onChangeText={(text) => handleChange("engine_type", text)} placeholder="1.6L Turbo, V6, etc." editable={!loading} /></View>
            <View style={styles.inputContainer}><Text style={styles.label}>Cilindrada</Text><TextInput style={styles.input} value={formData.displacement} onChangeText={(text) => handleChange("displacement", text)} placeholder="1600cc, 2.0L, etc." editable={!loading} /></View>
          </View>
          <View style={styles.row}>
            <View style={styles.inputContainer}><Text style={styles.label}>Aceite Recomendado</Text><TextInput style={styles.input} value={formData.recommended_oil} onChangeText={(text) => handleChange("recommended_oil", text)} placeholder="5W-30, 10W-40, etc." editable={!loading} /></View>
            <View style={styles.inputContainer}><Text style={styles.label}>Presión de Neumáticos</Text><TextInput style={styles.input} value={formData.tire_pressure} onChangeText={(text) => handleChange("tire_pressure", text)} placeholder="32 PSI, 2.2 BAR, etc." editable={!loading} /></View>
          </View>
          <View style={styles.inputContainer}><Text style={styles.label}>Modificaciones</Text><TextInput style={[styles.input, { height: 80 }]} value={formData.modifications} onChangeText={(text) => handleChange("modifications", text)} placeholder="Describe cualquier modificación realizada..." multiline numberOfLines={3} editable={!loading} /></View>
          <View style={styles.inputContainer}><Text style={styles.label}>Notas Técnicas Personalizadas</Text><TextInput style={[styles.input, { height: 80 }]} value={formData.custom_notes} onChangeText={(text) => handleChange("custom_notes", text)} placeholder="Cualquier información técnica adicional..." multiline numberOfLines={3} editable={!loading} /></View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={onCancel} style={[styles.button, styles.outlineButton]} disabled={loading}>
          <Text style={[styles.buttonText, styles.outlineButtonText]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.primaryButton]} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save size={18} color="white" />
              {/* CAMBIO 6: El texto del botón ahora depende de la prop 'isEditMode' */}
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>{isEditMode ? "Actualizar" : "Guardar"}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Tus estilos se mantienen exactamente iguales
const styles = StyleSheet.create({ container: { padding: 16, backgroundColor: "#f8fafc", paddingBottom: 40, }, header: { flexDirection: "row", alignItems: "center", marginBottom: 24, }, title: { fontSize: 24, fontWeight: "bold", color: "#1e293b", }, subtitle: { fontSize: 14, color: "#64748b", }, card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 24, padding: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 2, }, cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, }, cardTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 8, color: "#ea580c", }, cardContent: { gap: 12, }, row: { flexDirection: "row", justifyContent: "space-between", gap: 12, }, inputContainer: { flex: 1, marginBottom: 12, }, label: { marginBottom: 4, color: "#64748b", fontSize: 14, }, input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: "#1e293b", backgroundColor: "#f8fafc", }, buttonRow: { flexDirection: "row", gap: 12, justifyContent: "space-between", }, button: { flex: 1, paddingVertical: 14, borderRadius: 8, flexDirection: "row", justifyContent: "center", alignItems: "center", }, primaryButton: { backgroundColor: "#ea580c", }, outlineButton: { borderWidth: 1, borderColor: "#ea580c", }, buttonText: { color: "white", fontWeight: "bold", fontSize: 16, }, outlineButtonText: { color: "#ea580c", }, });