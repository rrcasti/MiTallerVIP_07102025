import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Save, Car, Wrench, Plus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
// Importamos todas las funciones del servicio que necesitamos
import { getVehicleById, addVehicle, updateVehicle } from "../../services/vehicleService";
import { uploadImageToFirebase } from "../../services/firebaseService"; // Importamos el servicio de subida de imágenes
import { auth } from "../../firebase/config";

const pickImageAsync = async (setImage) => {
  let result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    quality: 0.5,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    aspect: [4, 3],
    selectionLimit: 1,
  });

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  } else {
    Alert.alert("¡Atención!", "No seleccionaste ninguna imagen.");
  }
};

export default function VehiclesForm() {
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams();
  const isEditMode = !!vehicleId;

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
    custom_notes: "",
    imageUrl: null,
    mileage: "", // <-- Agregamos el campo de kilometraje
  });

  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      const loadVehicle = async () => {
        const vehicleData = await getVehicleById(vehicleId);
        if (vehicleData) {
          const initialStrings = Object.entries(vehicleData).reduce((acc, [key, value]) => {
            acc[key] = String(value || "");
            return acc;
          }, {});
          setFormData({
            ...initialStrings,
            imageUrl: vehicleData.imageUrl || null,
            mileage: String(vehicleData.mileage) || "", // <-- Cargamos el kilometraje si existe
          });
        } else {
          Alert.alert("Error", "No se encontraron los datos del vehículo a editar.");
          router.back();
        }
        setIsFetchingData(false);
      };
      loadVehicle();
    }
  }, [vehicleId, isEditMode]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!formData.brand.trim() || !formData.model.trim() || !formData.year.trim() || !formData.license_plate.trim()) {
      Alert.alert("Error", "Por favor completa los campos obligatorios.");
      return;
    }

    setLoading(true);

    let imageUrl = formData.imageUrl;
    if (imageUrl && imageUrl.startsWith("file://")) {
      try {
        imageUrl = await uploadImageToFirebase(imageUrl, `vehicles/${auth.currentUser.uid}/${Date.now()}`);
      } catch (uploadError) {
        Alert.alert("Error", "No se pudo subir la imagen del vehículo. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }
    }

    try {
      const dataToSave = {
        ...formData,
        year: parseInt(formData.year) || 0,
        imageUrl: imageUrl,
        mileage: parseInt(formData.mileage) || 0, // <-- Guardamos el kilometraje como número
        userId: auth.currentUser.uid,
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

        <View style={styles.imageSection}>
          <Text style={styles.imageLabel}>Foto del Vehículo (Opcional)</Text>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={() => pickImageAsync((uri) => handleChange('imageUrl', uri))}
            disabled={loading}
          >
            {formData.imageUrl ? (
              <Image source={{ uri: formData.imageUrl }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Plus size={30} color="#64748b" />
                <Text style={styles.imageButtonText}>Añadir Foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Car size={20} color="#ea580c" />
            <Text style={styles.cardTitle}>Datos Básicos</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Marca *</Text>
                <TextInput style={styles.input} value={formData.brand} onChangeText={(text) => handleChange("brand", text)} placeholder="Toyota, Ford, etc."/>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Modelo *</Text>
                <TextInput style={styles.input} value={formData.model} onChangeText={(text) => handleChange("model", text)} placeholder="Corolla, Focus, etc."/>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Año *</Text>
                <TextInput style={styles.input} value={formData.year} onChangeText={(text) => handleChange("year", text.replace(/[^0-9]/g, ""))} keyboardType="numeric" maxLength={4}/>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Patente *</Text>
                <TextInput style={styles.input} value={formData.license_plate} onChangeText={(text) => handleChange("license_plate", text.toUpperCase())} autoCapitalize="characters"/>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Color</Text>
                <TextInput style={styles.input} value={formData.color} onChangeText={(text) => handleChange("color", text)}/>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Kilometraje (Km)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mileage}
                  onChangeText={(text) => handleChange("mileage", text.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Wrench size={20} color="#3b82f6" />
            <Text style={styles.cardTitle}>Especificaciones Técnicas</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.label}>Número de Chasis (VIN)</Text>
            <TextInput style={styles.input} value={formData.vin} onChangeText={(text) => handleChange("vin", text.toUpperCase())} autoCapitalize="characters" editable={!loading} />
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tipo de Motor</Text>
                <TextInput style={styles.input} value={formData.engine_type} onChangeText={(text) => handleChange("engine_type", text)} editable={!loading} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Cilindrada</Text>
                <TextInput style={styles.input} value={formData.displacement} onChangeText={(text) => handleChange("displacement", text)} editable={!loading} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Aceite Recomendado</Text>
                <TextInput style={styles.input} value={formData.recommended_oil} onChangeText={(text) => handleChange("recommended_oil", text)} editable={!loading} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Presión de Neumáticos</Text>
                <TextInput style={styles.input} value={formData.tire_pressure} onChangeText={(text) => handleChange("tire_pressure", text)} editable={!loading} />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Modificaciones</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={formData.modifications} onChangeText={(text) => handleChange("modifications", text)} multiline editable={!loading} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Notas Técnicas</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={formData.custom_notes} onChangeText={(text) => handleChange("custom_notes", text)} multiline editable={!loading} />
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.button, styles.outlineButton]} disabled={loading}>
          <Text style={[styles.buttonText, styles.outlineButtonText]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.primaryButton]} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save size={18} color="white" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>{isEditMode ? "Actualizar" : "Guardar"}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f8fafc", paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  subtitle: { fontSize: 14, color: "#64748b" },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 10,
  },
  imageButton: {
    width: 200,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#94a3b8',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 5,
  },
  card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 24, padding: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 8, color: "#ea580c" },
  cardContent: { gap: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12, },
  inputContainer: { flex: 1, marginBottom: 12 },
  label: { marginBottom: 4, color: "#64748b", fontSize: 14 },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: "#1e293b", backgroundColor: "#f8fafc" },
  buttonRow: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  button: { flex: 1, paddingVertical: 14, borderRadius: 8, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  primaryButton: { backgroundColor: "#ea580c" },
  outlineButton: { borderWidth: 1, borderColor: "#ea580c" },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  outlineButtonText: { color: "#ea580c" },
});