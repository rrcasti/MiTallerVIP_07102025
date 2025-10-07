// RUTA: app/vehicles/[id].jsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
// CAMBIO: Se añade 'getUserById' a la importación
import { getVehicleById, deleteVehicle, getUserById } from '../../services/vehicleService';
import { Car, Wrench, ArrowLeft, Edit, Calendar as CalendarIcon, Droplets, Gauge, FileText, Settings } from 'lucide-react-native';

const InfoRow = ({ label, value, icon: Icon }) => (
  <View style={styles.infoRow}>
    {Icon && <Icon size={16} color="#64748b" style={{ marginRight: 8 }} />}
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || 'N/A'}</Text>
  </View>
);

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const vehicleData = await getVehicleById(id);
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
  }, [id]);

  const handleEdit = () => {
    router.push(`/vehicles/VehiclesForm?vehicleId=${id}`);
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
              const success = await deleteVehicle(id);
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
    console.log('Solicitar servicio para el vehículo:', id);
    Alert.alert("Próximamente", "Esta función te permitirá solicitar un servicio para este vehículo.");
  };

  const handleViewHistory = () => {
    console.log('Ver historial para el vehículo:', id);
    Alert.alert("Próximamente", "Esta función mostrará el historial de servicios de este vehículo.");
  };

  if (loading) { return <ActivityIndicator style={styles.centered} size="large" color="#ea580c" />; }
  if (error) { return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>; }
  if (!vehicle) { return null; }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{vehicle.brand} {vehicle.model}</Text>
          <Text style={styles.headerSubtitle}>{vehicle.license_plate}</Text>
        </View>
        <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
          <Edit size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}><Car size={20} color="#ea580c" /> Información General</Text>
          <InfoRow label="Marca y Modelo" value={`${vehicle.brand} ${vehicle.model}`} />
          <InfoRow label="Año" value={vehicle.year} />
          <InfoRow label="Patente" value={vehicle.license_plate} />
          <InfoRow label="Color" value={vehicle.color} />
          <View style={styles.dateRow}>
            <CalendarIcon size={16} color="#64748b" />
            <Text style={styles.dateText}>
              Dueño registrado el {owner?.createdAt?.seconds ? new Date(owner.createdAt.seconds * 1000).toLocaleDateString('es-ES') : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}><Wrench size={20} color="#3b82f6" /> Especificaciones Técnicas</Text>
          <InfoRow label="VIN" value={vehicle.vin} icon={FileText} />
          <InfoRow label="Tipo de Motor" value={vehicle.engine_type} icon={Wrench} />
          <InfoRow label="Cilindrada" value={vehicle.displacement} icon={Settings} />
          <InfoRow label="Aceite Recomendado" value={vehicle.recommended_oil} icon={Droplets} />
          <InfoRow label="Presión Neumáticos" value={vehicle.tire_pressure} icon={Gauge} />
        </View>

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', },
  headerButton: { padding: 8 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 16, color: '#64748b', textTransform: 'uppercase' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#334155', flexDirection: 'row', alignItems: 'center', },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', },
  infoLabel: { flex: 1, fontSize: 16, color: '#64748b' },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  dateRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, marginTop: 4 },
  dateText: { marginLeft: 8, color: '#64748b' },
  actionButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 20, },
  button: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', },
  outlineButton: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', },
  outlineButtonText: { color: '#334155', fontWeight: 'bold', },
  solidButton: { backgroundColor: '#ea580c', },
  solidButtonText: { color: '#fff', fontWeight: 'bold', },
  errorText: { color: 'red', fontSize: 18 },
  deleteButton: { marginTop: 20, alignItems: 'center', padding: 10, },
  deleteButtonText: { color: '#dc2626', fontWeight: 'bold', },
});