// RUTA: app/(tabs)/vehicles.jsx
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
  Alert,
  Image,
} from 'react-native';
import { Plus, Car, Trash } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getVehiclesForUser, deleteVehicle } from '../../services/vehicleService';
import { auth } from '../../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';

// El componente de la tarjeta de vehículo
const VehicleCard = ({ item, onPress, onDeletePress }) => {
  const getBorderColor = (id) => {
    const colors = ['#f97316', '#10b981', '#3b82f6', '#ef4444'];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  const borderColor = getBorderColor(item.id);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.vehicleImage} />
        ) : (
          <View style={styles.iconContainer}>
            <Car size={32} color={borderColor} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{item.make} {item.model}</Text>
          <Text style={styles.cardSubtitle}>{item.license_plate}</Text>
        </View>
        <View style={styles.cardActions}>
          <Text style={styles.cardYear}>{item.year}</Text>
          <TouchableOpacity onPress={onDeletePress} style={styles.deleteButton}>
            <Trash size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// El componente para el estado vacío
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

// El componente principal de la pantalla
export default function MiGarageScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadVehicles = useCallback(async (user) => {
    try {
      const userVehicles = await getVehiclesForUser(user.uid);
      setVehicles(userVehicles);
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
      setError("No se pudieron cargar los vehículos.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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

  const handleDeleteVehicle = (vehicleId) => {
    Alert.alert(
      "Eliminar Vehículo",
      "¿Estás seguro de que quieres eliminar este vehículo? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVehicle(vehicleId);
              loadVehicles(auth.currentUser);
            } catch (err) {
              console.error("Error al eliminar el vehículo:", err);
              Alert.alert("Error", "No se pudo eliminar el vehículo. Inténtalo de nuevo.");
            }
          },
        },
      ]
    );
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

        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VehicleCard
              item={item}
              onPress={() => router.push(`/vehicles/${item.id}`)}
              onDeletePress={() => handleDeleteVehicle(item.id)}
            />
          )}
          onRefresh={() => {
            setIsRefreshing(true);
            loadVehicles(auth.currentUser);
          }}
          refreshing={isRefreshing}
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
  
  // Estilos de la tarjeta mejorados
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    borderLeftWidth: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 15,
  },
  vehicleImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardYear: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 5,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 24 },
});