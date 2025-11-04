// Ruta: app/services/detail.jsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore'; // Importar Firestore
import { db } from '../../firebase/config'; // Asegúrate de que la ruta a tu config de Firebase sea correcta
import { Wrench, Car, Calendar, DollarSign, Clock, Camera } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ServiceDetailScreen = () => {
  const router = useRouter();
  const { repairId, serviceRequestId } = useLocalSearchParams();
  const [serviceData, setServiceData] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (repairId || serviceRequestId) {
      fetchServiceDetails();
    } else {
      setLoading(false);
    }
  }, [repairId, serviceRequestId]);

  const fetchServiceDetails = async () => {
    try {
      let serviceRef;
      let collectionName;

      if (repairId) {
        collectionName = 'reparaciones'; // O el nombre de tu colección de Reparaciones
        serviceRef = doc(db, collectionName, repairId);
      } else if (serviceRequestId) {
        collectionName = 'serviceRequests'; // O el nombre de tu colección de ServiceRequests
        serviceRef = doc(db, collectionName, serviceRequestId);
      } else {
        Alert.alert("Error", "No se proporcionó ID de reparación o solicitud.");
        setLoading(false);
        return;
      }

      const serviceSnap = await getDoc(serviceRef);

      if (serviceSnap.exists()) {
        const data = { id: serviceSnap.id, ...serviceSnap.data() };
        setServiceData(data);

        // Si tienes vehicle_id, intenta cargar los datos del vehículo
        const vehicleId = data.vehicle_id || data.vehicleInfo?.id; // Considera ambos campos
        if (vehicleId) {
          const vehicleRef = doc(db, 'vehicles', vehicleId); // O el nombre de tu colección de Vehículos
          const vehicleSnap = await getDoc(vehicleRef);
          if (vehicleSnap.exists()) {
            setVehicleData({ id: vehicleSnap.id, ...vehicleSnap.data() });
          }
        }
      } else {
        Alert.alert("Error", "Servicio/Reparación no encontrado.");
      }
    } catch (error) {
      console.error("Error fetching service details:", error);
      Alert.alert("Error", "No se pudo cargar los detalles del servicio.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#00d9ff" style={styles.loading} />
      </SafeAreaView>
    );
  }

  if (!serviceData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen options={{ title: "Detalles de Servicio", headerBackTitleVisible: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar los detalles del servicio o no existe.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ingresado':
      case 'pendiente':
      case 'revisando':
        return '#FBBF24'; // Amarillo
      case 'en_reparacion':
      case 'en_proceso':
      case 'diagnostico':
      case 'repuestos_solicitados':
      case 'presupuesto_enviado':
        return '#3B82F6'; // Azul
      case 'listo_retiro':
      case 'completado':
      case 'finalizado':
        return '#10B981'; // Verde
      case 'cancelada':
      case 'rechazado':
        return '#EF4444'; // Rojo
      default:
        return '#64748B'; // Gris
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ingresado': return 'Ingresado';
      case 'pendiente': return 'Pendiente';
      case 'revisando': return 'Revisando';
      case 'diagnostico': return 'Diagnóstico';
      case 'presupuesto_enviado': return 'Presupuesto Enviado';
      case 'esperando_aprobacion': return 'Esperando Aprobación';
      case 'repuestos_solicitados': return 'Repuestos Solicitados';
      case 'en_reparacion': return 'En Reparación';
      case 'pruebas_finales': return 'Pruebas Finales';
      case 'listo_retiro': return 'Listo para Retirar';
      case 'finalizado': return 'Finalizado';
      case 'completado': return 'Completado';
      case 'cancelada': return 'Cancelada';
      case 'rechazado': return 'Rechazado';
      default: return status || 'Desconocido';
    }
  };

  const photos = serviceData.photos || serviceData.progress_photos || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: "Detalles del Servicio", headerBackTitleVisible: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(serviceData.status) }]}>
            <Text style={styles.statusText}>{getStatusText(serviceData.status)}</Text>
          </View>

          <Text style={styles.title}>{serviceData.description || 'Servicio sin descripción'}</Text>

          {vehicleData && (
            <View style={styles.infoRow}>
              <Car size={20} color="#64748B" />
              <Text style={styles.infoText}>{vehicleData.brand} {vehicleData.model} ({vehicleData.license_plate})</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Calendar size={20} color="#64748B" />
            <Text style={styles.infoText}>
              Fecha de Solicitud: {new Date(serviceData.createdAt?.seconds * 1000 || serviceData.created_date).toLocaleDateString('es-ES')}
            </Text>
          </View>

          {serviceData.estimated_completion && (
            <View style={styles.infoRow}>
              <Clock size={20} color="#64748B" />
              <Text style={styles.infoText}>
                Finalización Estimada: {new Date(serviceData.estimated_completion).toLocaleDateString('es-ES')}
              </Text>
            </View>
          )}

          {serviceData.total_cost && (
            <View style={styles.infoRow}>
              <DollarSign size={20} color="#64748B" />
              <Text style={styles.infoText}>Costo Total: ${serviceData.total_cost.toLocaleString()}</Text>
            </View>
          )}

          {serviceData.admin_notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>Notas del Taller:</Text>
              <Text style={styles.notesText}>{serviceData.admin_notes}</Text>
            </View>
          )}

          {photos.length > 0 && (
            <View style={styles.photosContainer}>
              <Text style={styles.photosTitle}>Fotos de Progreso:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {photos.map((photoUrl, index) => (
                  <Image key={index} source={{ uri: photoUrl }} style={styles.progressImage} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoText: {
    fontSize: 16,
    color: '#cbd5e1',
    marginLeft: 10,
  },
  notesContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#334155',
    borderRadius: 10,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  photosContainer: {
    marginTop: 20,
  },
  photosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  photoScroll: {
    // Estilos para el ScrollView horizontal
  },
  progressImage: {
    width: width * 0.3, // 30% del ancho de la pantalla
    height: width * 0.3,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#334155',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#00d9ff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
});

export default ServiceDetailScreen;