// app/(tabs)/vehicles.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Plus, Car } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getVehiclesForUser } from '../../services/vehicleService';
import { auth } from '../../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';

const VehicleCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{item.make} {item.model}</Text>
      <Text style={styles.cardYear}>{item.year}</Text>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardLabel}>Patente</Text>
      <Text style={styles.cardValue}>{item.license_plate}</Text>
    </View>
  </TouchableOpacity>
);

const EmptyState = ({ onAddPress }) => (
  <View style={styles.centeredContent}>
    <Car size={64} color="#94a3b8" />
    <Text style={styles.emptyTitle}>Tu garage está vacío</Text>
    <Text style={styles.emptySubtitle}>Agrega tu primer vehículo para empezar.</Text>
    <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
      <Plus size={18} color="#fff" />
      <Text style={styles.addButtonText}>Agregar mi primer vehículo</Text>
    </TouchableOpacity>
  </View>
);

export default function MiGarageScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadVehicles = useCallback(async (user) => {
    try {
      setLoading(true);
      const userVehicles = await getVehiclesForUser(user.uid);
      setVehicles(userVehicles);
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
      setError("No se pudieron cargar los vehículos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadVehicles(user);
      } else {
        setLoading(false);
        setVehicles([]);
        setError("Inicia sesión para ver tus vehículos.");
      }
    });
    return () => unsubscribe();
  }, [loadVehicles]);

  const handleAddVehicle = () => {
    router.push('/vehicles/VehiclesForm');
  };

  if (loading) {
    return (
      <View style={styles.centeredContent}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={styles.infoText}>Cargando tu Garage...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContent}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (vehicles.length === 0) {
    return <EmptyState onAddPress={handleAddVehicle} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} 
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mi Garage</Text>
            <Text style={styles.headerSubtitle}>Gestiona tus vehículos</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddVehicle}>
            <Plus size={18} color="#fff" />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Vehículos */}
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VehicleCard 
              item={item} 
              onPress={() => router.push(`/vehicles/${item.id}`)} 
            />
          )}
          contentContainerStyle={styles.listContainer}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  infoText: { marginTop: 10, fontSize: 16, color: '#475569' },
  errorText: { fontSize: 16, color: '#dc2626', textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 14, color: '#64748b' },
  addButton: { backgroundColor: '#ea580c', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  listContainer: { paddingVertical: 10 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  cardYear: { fontSize: 14, color: '#64748b' },
  cardBody: { padding: 16 },
  cardLabel: { fontSize: 12, color: '#94a3b8' },
  cardValue: { fontSize: 16, fontWeight: '500', color: '#334155' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 24 },
});
