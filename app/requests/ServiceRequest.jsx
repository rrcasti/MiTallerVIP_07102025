import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput,
  ActivityIndicator, LayoutAnimation, UIManager, Platform, KeyboardAvoidingView,
  Modal,
} from 'react-native';

import { Calendar } from 'react-native-calendars';
import { db, auth } from '../../firebase/config';
import { Car, Wrench, Calendar as CalendarIcon, ChevronDown, FileText, CheckCircle } from 'lucide-react-native';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ConciergeServiceForm() {
  const [userData, setUserData] = useState(null);
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]); // <-- LÍNEA CORREGIDA
  const [preferredDate, setPreferredDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVehiclePickerVisible, setIsVehiclePickerVisible] = useState(false);
  const [isCalendarVisible, setCalendarVisible] = useState(false);

  const serviceTiles = [
    { id: 'mantenimiento_preventivo', title: 'Mantenimiento Preventivo', description: 'Revisión general programada para tu vehículo.' },
    { id: 'reparacion_mecanica', title: 'Reparación Mecánica', description: 'Solución a problemas de motor, transmisión, etc.' },
    { id: 'diagnostico', title: 'Diagnóstico Computarizado', description: 'Escaneo de fallas y testigos del tablero.' },
    { id: 'cambio_aceite', title: 'Cambio de Aceite y Filtros', description: 'Servicio de lubricación completo.' },
    { id: 'frenos', title: 'Sistema de Frenos', description: 'Revisión y cambio de pastillas, discos y líquido.' },
    { id: 'neumaticos', title: 'Neumáticos', description: 'Cambio, rotación, alineación y balanceo.' },
    { id: 'alineacion_balanceo', title: 'Alineación y Balanceo', description: 'Corrección de la geometría y equilibrio de ruedas.' },
    { id: 'suspension', title: 'Sistema de Suspensión', description: 'Revisión de amortiguadores y componentes.' },
    { id: 'aire_acondicionado', title: 'Aire Acondicionado', description: 'Mantenimiento, recarga de gas y reparaciones.' },
    { id: 'sistema_electrico', title: 'Sistema Eléctrico', description: 'Diagnóstico de batería, alternador y fallas eléctricas.' },
    { id: 'chapa_pintura', title: 'Chapa y Pintura', description: 'Reparaciones de carrocería y pintura profesional.' },
    { id: 'lavado_detailing', title: 'Lavado y Detailing', description: 'Limpieza profunda y tratamiento estético para tu auto.' },
    { id: 'revision_tecnica', title: 'Revisión Técnica', description: 'Preparación y gestión de la VTV/RTO.' },
    { id: 'instalacion_accesorios', title: 'Instalación de Accesorios', description: 'Equipos de audio, alarmas, sensores y más.' },
    { id: 'venta_vehiculo', title: 'Quiero Vender mi Vehículo', description: 'Servicio de consignación y asesoría para la venta.' },
    { id: 'cotizacion_seguro', title: 'Cotización de Seguro', description: 'Asesoramiento para encontrar el mejor seguro.' },
    { id: 'otro', title: 'Otro Servicio', description: 'Describe tu necesidad en la sección de detalles.' },
  ];
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) setUserData(userDocSnap.data());

          const vehiclesQuery = query(collection(db, 'vehicles'), where("userId", "==", user.uid));
          const vehiclesSnapshot = await getDocs(vehiclesQuery);
          const vehiclesList = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUserVehicles(vehiclesList);

        } catch (error) {
          console.error("Error al cargar datos del usuario:", error);
          Alert.alert("Error", "No se pudieron cargar sus datos.");
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("No hay usuario autenticado.");
        setUserData(null);
        setUserVehicles([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleVehiclePicker = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsVehiclePickerVisible(!isVehiclePickerVisible);
  };
  
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    toggleVehiclePicker();
  };

  const handleSelectService = (serviceTitle) => {
    setSelectedServices((prev) =>
      prev.includes(serviceTitle)
        ? prev.filter((s) => s !== serviceTitle)
        : [...prev, serviceTitle]
    );
  };

  const handleDayPress = (day) => {
    setPreferredDate(day.dateString);
    setCalendarVisible(false);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !userData) {
      Alert.alert('Error', 'No se han podido cargar los datos del usuario.');
      return;
    }
    if (!selectedVehicle || selectedServices.length === 0 || !description) {
      Alert.alert('Campos incompletos', 'Por favor, complete todos los pasos del formulario.');
      return;
    }
    try {
      setIsSubmitting(true);
      const uploadedPhotos = []; 
      const serviceOrderData = {
        customerInfo: { userId: user.uid, name: userData.name || 'N/A', lastName: userData.displayName || 'N/A', phone: userData.phoneNumber || 'N/A' },
        vehicleInfo: selectedVehicle,
        services: selectedServices,
        description: description,
        preferredDate: preferredDate,
        photos: uploadedPhotos,
        status: 'pendiente',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'serviceRequests'), serviceOrderData);
      Alert.alert('✅ Solicitud Enviada', 'Su pedido ha sido registrado.');
      setSelectedVehicle(null);
      setSelectedServices([]);
      setDescription('');
      setPreferredDate('');
      setPhotos([]);
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
      Alert.alert('Error', 'Hubo un problema al enviar su solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PALETTE.accent} />
        <Text style={styles.loadingText}>Preparando su consulta...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: PALETTE.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Modal
        animationType="fade"
        transparent={true}
        visible={isCalendarVisible}
        onRequestClose={() => setCalendarVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCalendarVisible(false)}>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={{ [preferredDate]: { selected: true, selectedColor: PALETTE.accent, disableTouchEvent: true } }}
              theme={calendarTheme}
              minDate={new Date().toISOString().split('T')[0]}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.mainTitle}>Solicitar Servicio</Text>
        <Text style={styles.subtitle}>Complete los siguientes pasos para agendar su cita.</Text>
        
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeader} onPress={toggleVehiclePicker}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Car color={selectedVehicle ? PALETTE.accent : PALETTE.textPrimary} size={22} />
              <Text style={styles.cardTitle}>Su Vehículo</Text>
            </View>
            <ChevronDown color={PALETTE.textSecondary} size={22} rotation={isVehiclePickerVisible ? 180 : 0} />
          </TouchableOpacity>
          {selectedVehicle && !isVehiclePickerVisible && (
              <Text style={styles.vehicleSelectedText}>{`${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.license_plate})`}</Text>
          )}
          {isVehiclePickerVisible && (
            <View>
              {userVehicles.map((vehicle) => (
                <TouchableOpacity key={vehicle.id} style={styles.vehicleOption} onPress={() => handleSelectVehicle(vehicle)}>
                  <View>
                      <Text style={styles.vehicleOptionBrand}>{`${vehicle.brand} ${vehicle.model}`}</Text>
                      <Text style={styles.vehicleOptionPlate}>{vehicle.license_plate}</Text>
                  </View>
                  {selectedVehicle?.id === vehicle.id && <CheckCircle color={PALETTE.accent} size={22} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Wrench color={PALETTE.textPrimary} size={22} />
                <Text style={styles.cardTitle}>Servicio Requerido</Text>
                {selectedServices.length > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectedServices.length}</Text>
                </View>
                )}
            </View>
            <Text style={styles.cardSubtitle}>
                Seleccione todos los servicios que su vehículo necesita.
            </Text>

            {/* CAMBIO: Mapeo con descripción */}
            {serviceTiles.map((service) => {
                const isSelected = selectedServices.includes(service.title);
                return (
                <TouchableOpacity
                    key={service.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectService(service.title)}
                    style={[styles.serviceItem, isSelected && styles.serviceItemSelected]}
                >
                    <View style={[styles.checkboxFake, isSelected && styles.checkboxFakeSelected]}>
                        {isSelected && <CheckCircle size={16} color={PALETTE.background} />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.serviceItemTitle}>{service.title}</Text>
                        <Text style={styles.serviceItemDescription}>{service.description}</Text>
                    </View>
                </TouchableOpacity>
                );
            })}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
              <FileText color={PALETTE.textPrimary} size={22} />
              <Text style={styles.cardTitle}>Detalles Adicionales</Text>
          </View>
          <TextInput
              style={styles.textArea}
              placeholder="Describa el inconveniente o requerimiento..."
              multiline
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={PALETTE.textSecondary}
          />
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
              <CalendarIcon color={PALETTE.textPrimary} size={22} />
              <Text style={styles.cardTitle}>Su Disponibilidad</Text>
          </View>
          <TouchableOpacity onPress={() => setCalendarVisible(true)}>
            <View style={styles.dateInput}>
              <Text style={preferredDate ? styles.dateText : styles.datePlaceholder}>
                {preferredDate ? new Date(preferredDate + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Seleccionar una fecha'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}>
          {isSubmitting 
            ? <ActivityIndicator color={PALETTE.background} /> 
            : <Text style={styles.submitButtonText}>Confirmar Solicitud</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PALETTE = {
  background: '#1A202C',
  cardBackground: '#2D3748',
  accent: '#F7B500',
  textPrimary: '#EDF2F7',
  textSecondary: '#A0AEC0',
};

const calendarTheme = {
    backgroundColor: PALETTE.cardBackground,
    calendarBackground: PALETTE.cardBackground,
    textSectionTitleColor: PALETTE.textSecondary,
    selectedDayBackgroundColor: PALETTE.accent,
    selectedDayTextColor: PALETTE.background,
    todayTextColor: PALETTE.accent,
    dayTextColor: PALETTE.textPrimary,
    textDisabledColor: '#4A5568',
    arrowColor: PALETTE.accent,
    monthTextColor: PALETTE.textPrimary,
    textDayFontWeight: '300',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '300',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: PALETTE.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: PALETTE.textSecondary, marginBottom: 32, lineHeight: 24 },
  card: { backgroundColor: PALETTE.cardBackground, borderRadius: 16, padding: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: PALETTE.textPrimary, marginLeft: 12 },
  loadingText: { color: PALETTE.textSecondary, marginTop: 12, fontSize: 16 },
  
  vehicleSelectedText: { fontSize: 16, color: PALETTE.accent, fontWeight: '500', marginTop: -10, marginBottom: 10 },
  vehicleOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#4A5568' },
  vehicleOptionBrand: { fontSize: 16, color: PALETTE.textPrimary, fontWeight: '500' },
  vehicleOptionPlate: { fontSize: 14, color: PALETTE.textSecondary },

  cardSubtitle: { fontSize: 15, color: PALETTE.textSecondary, marginBottom: 20, lineHeight: 22 },
  serviceItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#4A5568', backgroundColor: PALETTE.background, marginBottom: 12 },
  serviceItemSelected: { borderColor: PALETTE.accent, backgroundColor: 'rgba(247, 181, 0, 0.1)' },
  checkboxFake: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: PALETTE.textSecondary, marginRight: 16, marginTop: 2, justifyContent: 'center', alignItems: 'center' },
  checkboxFakeSelected: { backgroundColor: PALETTE.accent, borderColor: PALETTE.accent },
  serviceItemTitle: { fontSize: 16, color: PALETTE.textPrimary, fontWeight: '600' },
  
  // CAMBIO: Nuevo estilo para la descripción
  serviceItemDescription: {
    fontSize: 14,
    color: PALETTE.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },

  badge: { backgroundColor: PALETTE.accent, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: PALETTE.background, fontWeight: 'bold', fontSize: 12 },
  
  textArea: { fontSize: 16, color: PALETTE.textPrimary, padding: 16, height: 120, textAlignVertical: 'top', backgroundColor: PALETTE.background, borderRadius: 10 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.8)' },
  calendarContainer: { width: '90%', borderRadius: 16, overflow: 'hidden' },
  dateInput: { fontSize: 16, padding: 16, backgroundColor: PALETTE.background, borderRadius: 10 },
  dateText: { color: PALETTE.textPrimary, fontSize: 16 },
  datePlaceholder: { color: PALETTE.textSecondary, fontSize: 16 },
  
  submitButton: { backgroundColor: PALETTE.accent, padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 40 },
  submitButtonDisabled: { backgroundColor: '#555' },
  submitButtonText: { color: PALETTE.background, fontSize: 18, fontWeight: 'bold' },
});