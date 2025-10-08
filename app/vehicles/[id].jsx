// RUTA: app/vehicles/[id].jsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVehicleById, deleteVehicle, getUserById } from '../../services/vehicleService';
import { Car, Wrench, ArrowLeft, Edit, Calendar as CalendarIcon, Droplets, Gauge, FileText, Settings } from 'lucide-react-native';

const InfoRow = ({ label, value, icon: Icon }) => (
  <View style={styles.infoRow}>
    {Icon && <Icon size={16} color="#64748b" style={{ marginRight: 8 }} />}
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || 'N/A'}</Text>
  </View>
);

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const { id: vehicleId } = useLocalSearchParams();
  const [vehicle, setVehicle] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vehicleId) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const vehicleData = await getVehicleById(vehicleId);
        if (vehicleData) {
          setVehicle(vehicleData);
          if (vehicleData.userId) {
            const ownerData = await getUserById(vehicleData.userId);
            setOwner(ownerData);
          }
        } else {
          setError('No se encontró el vehículo.');
        }
      } catch (err) {
        setError('Error al cargar los datos.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [vehicleId]);

  const handleEdit = () => {
    router.push(`/vehicles/VehiclesForm?vehicleId=${vehicleId}`);
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Vehículo",
      "¿Estás seguro de que quieres eliminar este vehículo? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              const success = await deleteVehicle(vehicleId);
              if (success) {
                Alert.alert("Éxito", "Vehículo eliminado correctamente.");
                router.back();
              } else {
                Alert.alert("Error", "No se pudo eliminar el vehículo.");
              }
            } catch (err) {
              Alert.alert("Error", "Ocurrió un error al intentar eliminar.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleRequestService = () => {
    Alert.alert("Próximamente", "Esta función te permitirá solicitar un servicio para este vehículo.");
  };

  const handleViewHistory = () => {
    Alert.alert("Próximamente", "Esta función mostrará el historial de servicios de este vehículo.");
  };

  if (loading) { return <ActivityIndicator style={styles.centered} size="large" color="#ea580c" />; }
  if (error) { return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>; }
  if (!vehicle) { return null; }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{vehicle.make || 'Vehículo'} {vehicle.model}</Text>
          <Text style={styles.headerSubtitle}>{vehicle.license_plate}</Text>
        </View>
        <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
          <Edit size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Sección de Foto e Información General (Contenedor Principal) */}
        <View style={styles.primaryInfoCard}>
          {/* FOTO DEL VEHÍCULO */}
          {vehicle.imageUrl ? (
            <Image source={{ uri: vehicle.imageUrl }} style={styles.vehiclePhoto} />
          ) : (
            <View style={styles.vehiclePhotoPlaceholder}>
              <Car size={64} color="#fff" />
              <Text style={styles.photoPlaceholderText}>Sin foto</Text>
            </View>
          )}

          {/* INFORMACIÓN GENERAL DEBAJO DE LA FOTO */}
          <View style={styles.generalInfoSection}>
            <View style={styles.cardHeader}>
              <Car size={20} color="#ea580c" />
              <Text style={styles.cardTitle}>Información General</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Marca y Modelo</Text>
              <Text style={styles.infoValue}>{vehicle.make} {vehicle.model}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Año</Text>
              <Text style={styles.infoValue}>{vehicle.year}</Text>
            </View>
            {/* AQUÍ SE MUESTRA EL KILOMETRAJE */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kilometraje</Text>
              <Text style={styles.infoValue}>{vehicle.mileage ? `${vehicle.mileage} Km` : 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patente</Text>
              <Text style={styles.infoValue}>{vehicle.license_plate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color</Text>
              <Text style={styles.infoValue}>{vehicle.color}</Text>
            </View>
          </View>
        </View>

        {/* Especificaciones Técnicas (Segundo Contenedor) */}
        <View style={styles.specsCard}>
          <View style={styles.cardHeader}>
            <Wrench size={20} color="#3b82f6" />
            <Text style={styles.cardTitle}>Especificaciones Técnicas</Text>
          </View>
          <View style={styles.specsContent}>
            <InfoRow label="VIN" value={vehicle.vin} icon={FileText} />
            <InfoRow label="Tipo de Motor" value={vehicle.engine_type} icon={Wrench} />
            <InfoRow label="Cilindrada" value={vehicle.displacement} icon={Settings} />
            <InfoRow label="Aceite Recomendado" value={vehicle.recommended_oil} icon={Droplets} />
            <InfoRow label="Presión Neumáticos" value={vehicle.tire_pressure} icon={Gauge} />
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity onPress={handleViewHistory} style={[styles.button, styles.outlineButton]}>
            <Text style={styles.outlineButtonText}>Ver Historial</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRequestService} style={[styles.button, styles.solidButton]}>
            <Text style={styles.solidButtonText}>Solicitar Servicio</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Eliminar Vehículo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  errorText: { color: 'red', fontSize: 18 },

  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#1e293b',
    borderBottomWidth: 1, 
    borderBottomColor: '#334155',
  },
  headerButton: { padding: 8 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', textTransform: 'uppercase' },
  
  primaryInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4
  },
  generalInfoSection: {
    padding: 20,
  },
  specsCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 20, 
    elevation: 2, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 1 }, 
    shadowRadius: 4 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8, color: '#334155' },
  
  vehiclePhoto: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  vehiclePhotoPlaceholder: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { flex: 1, fontSize: 16, color: '#64748b' },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  dateRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, marginTop: 4 },
  dateText: { marginLeft: 8, color: '#64748b' },

  actionButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 20 },
  button: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  outlineButton: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  outlineButtonText: { color: '#334155', fontWeight: 'bold' },
  solidButton: { backgroundColor: '#ea580c' },
  solidButtonText: { color: '#fff', fontWeight: 'bold' },
  deleteButton: { marginTop: 20, alignItems: 'center', padding: 10 },
  deleteButtonText: { color: '#dc2626', fontWeight: 'bold' },
});