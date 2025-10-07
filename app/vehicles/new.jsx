// app/vehicles/new.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function NewVehicle() {
  const router = useRouter();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [license_plate, setLicense_plate] = useState('');

  const handleSave = () => {
    // Aquí podrías guardar en la base de datos, por ahora solo alertamos y volvemos atrás
    if (!make || !model || !year || !license_plate) {
      Alert.alert('Completa todos los campos');
      return;
    }
    Alert.alert('Vehículo guardado', `Marca: ${make}, Modelo: ${model}`);
    router.back(); // Vuelve a la pantalla anterior
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Nuevo vehículo</Text>
      <TextInput
        style={styles.input}
        placeholder="Marca"
        value={make}
        onChangeText={setMake}
      />
      <TextInput
        style={styles.input}
        placeholder="Modelo"
        value={model}
        onChangeText={setModel}
      />
      <TextInput
        style={styles.input}
        placeholder="Año"
        value={year}
        onChangeText={setYear}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Patente"
        value={license_plate}
        onChangeText={setLicense_plate}
      />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#ea580c',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
