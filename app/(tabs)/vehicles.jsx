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
  ImageBackground,
  Image
} from 'react-native';
import { Plus, Car, Trash, Wrench, Drop, Gauge } from 'lucide-react-native'; 
import { useRouter } from 'expo-router';
import { deleteVehicle } from '../../services/vehicleService';
import { auth } from '../../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVehicles } from '../../context/VehicleContext';

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
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.make} {item.model}</Text>
          <Text style={styles.cardYear}>{item.year}</Text>
        </View>
        <TouchableOpacity onPress={onDeletePress} style={styles.deleteButton}>
          <Trash size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardContent}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: borderColor + '20' }]}>
            <Car size={40} color={borderColor} />
          </View>
        )}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Patente</Text>
            <Text style={styles.detailValue}>{item.license_plate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Color</Text>
            <Text style={styles.detailValue}>{item.color ? item.color : 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kilometraje</Text>
            <Text style={styles.detailValue}>{item.mileage ? `${item.mileage} Km` : 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.iconText}>
              <Wrench size={16} color="#64748b" />
              <Text style={styles.detailValue}>{item.engine_type ? item.engine_type : 'N/A'}</Text>
            </View>
            <View style={styles.iconText}>
              <Gauge size={16} color="#64748b" />
              <Text style={styles.detailValue}>{item.displacement ? item.displacement : 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const EmptyState = ({ onAddPress }) => (
  <View style={styles.emptyContainer}>
    <Car size={64} color="#94a3b8" />
    <Text style={styles.emptyTitle}>Sin Vehículos</Text>
    <Text style={styles.emptySubtitle}>Agrega tu primer vehículo para comenzar</Text>
    <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
      <Plus size={18} color="#fff" />
      <Text style={styles.addButtonText}>Agregar Vehículo</Text>
    </TouchableOpacity>
  </View>
);

export default function MiGarageScreen() {
  const router = useRouter();
  const { vehicles, loading, loadVehicles } = useVehicles();
  const handleAddVehicle = () => { router.push('/vehicles/VehiclesForm'); };

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
              loadVehicles();
            } catch (err) {
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
          onRefresh={loadVehicles}
          refreshing={loading}
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
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardYear: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 5,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 15,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  cardImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetails: {
    flex: 1,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});