// Ruta: app/emergency/towRequest.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

// ✅ CORRECCIÓN: Desde app/emergency/ necesitas subir 2 niveles (..)
import { useAuth } from '../../context/AuthContext';              // ← CORRECTO para emergency/
import { useVehicles } from '../../context/VehicleContext';       // ← CORRECTO para emergency/
import { createTowRequest } from '../../services/towRequestService';  // ← CORRECTO para emergency/

import { 
  Truck, 
  MapPin, 
  AlertTriangle, 
  Phone, 
  Car, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  FileText 
} from 'lucide-react-native';

const PALETTE = {
  background: '#1A202C',
  cardBackground: '#2D3748',
  accent: '#F7B500',
  textPrimary: '#EDF2F7',
  textSecondary: '#A0AEC0',
  error: '#E53E3E',
  success: '#34D399',
  warning: '#FBBF24',
};

export default function TowRequestScreen() {

  console.log('🚛 [TowRequest] Componente montado');
  
  try {
    const router = useRouter();
    console.log('✅ [TowRequest] Router OK');
    
    const { user } = useAuth();
    console.log('✅ [TowRequest] Auth OK, usuario:', user?.email || 'null');
    
    const { vehicles } = useVehicles();
    console.log('✅ [TowRequest] Vehicles OK, cantidad:', vehicles?.length || 0);
    
    // ... resto del código
  } catch (error) {
    console.error('❌ [TowRequest] Error:', error);
  }

  const router = useRouter();
  const { user } = useAuth();
  const { vehicles } = useVehicles();

  const [formData, setFormData] = useState({ 
    vehicle_id: '', 
    description: '', 
    phone_contact: user?.phone || '' 
  });
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLocationError('');
    setLocation(null);

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Permiso de ubicación denegado. Actívalo en la configuración de tu dispositivo.');
      return;
    }

    try {
      const position = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });
      const { latitude, longitude } = position.coords;

      const reverseGeocode = await Location.reverseGeocodeAsync({ 
        latitude, 
        longitude 
      });
      
      const address = reverseGeocode[0] 
        ? `${reverseGeocode[0].street || ''} ${reverseGeocode[0].streetNumber || ''}, ${reverseGeocode[0].city || ''}`.trim()
        : `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
      
      setLocation({ lat: latitude, lng: longitude, address });
    } catch (error) {
      setLocationError('No pudimos obtener tu ubicación. Verifica tu señal GPS.');
      console.error('Error obteniendo ubicación:', error);
    }
  };

  const handleSubmit = async () => {
    if (!location || !formData.vehicle_id || !formData.phone_contact) {
      Alert.alert(
        "Datos incompletos", 
        "Por favor, selecciona un vehículo y confirma tu teléfono de contacto."
      );
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createTowRequest({ ...formData, location });
      setRequestSent(true);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo enviar la solicitud");
      console.error('Error enviando solicitud:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (requestSent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <CheckCircle color={PALETTE.success} size={64} />
          <Text style={styles.mainTitle}>¡Solicitud Enviada!</Text>
          <Text style={styles.subtitle}>
            Nuestro equipo se pondrá en contacto al {formData.phone_contact} en los próximos minutos.
          </Text>
          
          <View style={styles.etaCard}>
            <Clock color={PALETTE.textPrimary} size={20} />
            <Text style={styles.etaText}>
              Tiempo estimado de llegada: 15-25 minutos
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.ctaButton, {backgroundColor: PALETTE.cardBackground}]} 
            onPress={() => router.back()}
          >
            <Text style={[styles.ctaButtonText, {color: PALETTE.textPrimary}]}>
              Volver al Inicio
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#CBD5E1" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Solicitar Grúa</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <View style={[styles.emergencyAlert, {backgroundColor: '#4A2525'}]}>
          <AlertTriangle color={PALETTE.error} size={24} />
          <Text style={styles.alertText}>
            Si estás en una situación de peligro, llama al 911 inmediatamente.
          </Text>
        </View>

        <View style={[
          styles.card, 
          location ? styles.cardSuccess : 
          locationError ? styles.cardError : 
          styles.cardWarning
        ]}>
          <View style={styles.cardHeader}>
            <MapPin 
              color={location ? PALETTE.success : locationError ? PALETTE.error : PALETTE.warning} 
              size={22} 
            />
            <Text style={[
              styles.cardTitle, 
              {color: location ? PALETTE.success : locationError ? PALETTE.error : PALETTE.warning}
            ]}>
              {location ? 'Ubicación Detectada' : 
               locationError ? 'Error de Ubicación' : 
               'Obteniendo Ubicación...'}
            </Text>
          </View>
          
          <Text style={styles.addressText}>
            {location ? location.address : 
             locationError || 
             'Por favor, activa y permite el acceso a tu GPS.'}
          </Text>
          
          {locationError && (
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={getCurrentLocation}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Car color={PALETTE.textPrimary} size={22} />
            <Text style={styles.cardTitle}>Vehículo a Remolcar</Text>
          </View>
          
          <View style={styles.selectContainer}>
            {vehicles && vehicles.length > 0 ? (
              vehicles.map(v => (
                <TouchableOpacity 
                  key={v.id} 
                  style={[
                    styles.selectOption, 
                    formData.vehicle_id === v.id && styles.selectOptionActive
                  ]}
                  onPress={() => handleChange('vehicle_id', v.id)}
                >
                  <Text style={[
                    styles.selectOptionText,
                    formData.vehicle_id === v.id && {color: PALETTE.background}
                  ]}>
                    {v.brand} {v.model} - {v.licensePlate || v.license_plate}
                  </Text>
                  {formData.vehicle_id === v.id && (
                    <CheckCircle size={16} color={PALETTE.background} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.placeholderText}>
                No tienes vehículos registrados.
              </Text>
            )}
          </View>

          <View style={[styles.cardHeader, {marginTop: 20}]}>
            <Phone color={PALETTE.textPrimary} size={22} />
            <Text style={styles.cardTitle}>Teléfono de Contacto *</Text>
          </View>
          <TextInput 
            style={styles.textInput} 
            value={formData.phone_contact} 
            onChangeText={(text) => handleChange('phone_contact', text)} 
            keyboardType="phone-pad"
            placeholder="+56 9 1234 5678"
            placeholderTextColor={PALETTE.textSecondary}
          />
        
          <View style={[styles.cardHeader, {marginTop: 20}]}>
            <FileText color={PALETTE.textPrimary} size={22} />
            <Text style={styles.cardTitle}>Descripción del Problema (Opcional)</Text>
          </View>
          <TextInput 
            style={styles.textArea} 
            multiline 
            numberOfLines={4}
            placeholder="Ej: El auto no arranca, creo que es la batería." 
            placeholderTextColor={PALETTE.textSecondary} 
            value={formData.description} 
            onChangeText={(text) => handleChange('description', text)} 
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.ctaButton, 
            {backgroundColor: PALETTE.error}, 
            (!location || isSubmitting || !formData.vehicle_id || !formData.phone_contact) && 
            styles.ctaButtonDisabled
          ]} 
          onPress={handleSubmit} 
          disabled={!location || isSubmitting || !formData.vehicle_id || !formData.phone_contact}
        >
          {isSubmitting ? (
            <ActivityIndicator color={PALETTE.textPrimary} />
          ) : (
            <>
              <Truck color={PALETTE.textPrimary} size={20} />
              <Text style={[styles.ctaButtonText, {color: PALETTE.textPrimary}]}>
                Solicitar Grúa Ahora
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.background },
  container: { padding: 24, paddingBottom: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: PALETTE.textPrimary },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: PALETTE.textPrimary, textAlign: 'center', marginTop: 16 },
  subtitle: { fontSize: 16, color: PALETTE.textSecondary, textAlign: 'center', marginTop: 8, marginHorizontal: 20 },
  emergencyAlert: { flexDirection: 'row', backgroundColor: '#4A2525', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  alertText: { color: PALETTE.textSecondary, flex: 1, marginLeft: 12, lineHeight: 20 },
  card: { backgroundColor: PALETTE.cardBackground, borderRadius: 16, padding: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: PALETTE.textPrimary, marginLeft: 12 },
  cardWarning: { borderColor: PALETTE.warning, borderWidth: 2 },
  cardSuccess: { borderColor: PALETTE.success, borderWidth: 2 },
  cardError: { borderColor: PALETTE.error, borderWidth: 2 },
  addressText: { color: PALETTE.textSecondary, fontSize: 16, lineHeight: 22 },
  retryButton: { marginTop: 16, backgroundColor: PALETTE.background, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: PALETTE.accent, textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  textInput: { fontSize: 16, color: PALETTE.textPrimary, padding: 16, backgroundColor: PALETTE.background, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  textArea: { fontSize: 16, color: PALETTE.textPrimary, padding: 16, height: 100, textAlignVertical: 'top', backgroundColor: PALETTE.background, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  ctaButton: { flexDirection: 'row', backgroundColor: PALETTE.accent, borderRadius: 12, paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  ctaButtonText: { color: PALETTE.background, fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
  ctaButtonDisabled: { opacity: 0.5 },
  etaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.cardBackground, padding: 16, borderRadius: 12, marginVertical: 20, borderWidth: 1, borderColor: PALETTE.success },
  etaText: { color: PALETTE.textPrimary, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  selectContainer: { backgroundColor: PALETTE.background, borderRadius: 10, padding: 4, marginTop: 10 },
  selectOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  selectOptionActive: { backgroundColor: PALETTE.accent, borderRadius: 8, borderBottomWidth: 0, marginBottom: 4 },
  selectOptionText: { color: PALETTE.textPrimary, fontSize: 16, fontWeight: '500' },
  placeholderText: { color: PALETTE.textSecondary, fontSize: 16, padding: 10, textAlign: 'center' },
});