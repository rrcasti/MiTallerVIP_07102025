// Ruta: app/profile/index.jsx
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Platform, Keyboard,
} from 'react-native';
import {
  User, Phone, MapPin, Mail, LogOut, Save, Edit, Home, Settings
} from 'lucide-react-native';
import { auth } from '../../firebase/config';
import { getUserProfile, saveUserProfile } from '../../services/profileService';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============================================================================
// ESTADO INICIAL DEL PERFIL
// ============================================================================
const initialProfileState = {
  full_name: '',
  phone: '',
  address: '',
  city: '',
  emergency_contact: '',
  email: '',
};

// ============================================================================
// COMPONENTE MEMOIZADO: CAMPO NO EDITABLE
// ============================================================================
const InfoDisplay = memo(({ icon: Icon, label, value }) => {
  console.log("🔄 InfoDisplay render:", label);
  return (
    <View style={styles.infoRow}>
      {Icon && <Icon size={20} color="#64748B" style={styles.icon} />}
      <View style={styles.infoContent}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'No especificado'}</Text>
      </View>
    </View>
  );
});

// ============================================================================
// COMPONENTE MEMOIZADO: CAMPO EDITABLE
// ============================================================================
const EditableField = memo(({
  icon: Icon,
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
  required = false,
  isEditing,
  loading
}) => {
  console.log("🔄 EditableField render:", label, "isEditing:", isEditing);
  return (
    <View style={styles.infoRow}>
      {Icon && <Icon size={20} color="#64748B" style={styles.icon} />}
      <View style={styles.infoContent}>
        <Text style={styles.label}>
          {label}{required && <Text style={styles.required}> *</Text>}
        </Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, multiline && styles.inputMultiline]}
            value={value || ''}
            onChangeText={onChangeText}
            placeholder={`Ingresa ${label.toLowerCase()}`}
            placeholderTextColor="#475569"
            keyboardType={keyboardType}
            returnKeyType={multiline ? "default" : "done"}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            textAlignVertical={multiline ? "top" : "center"}
            blurOnSubmit={!multiline}
            editable={!loading}
          />
        ) : (
          <Text style={styles.value}>{value || 'No especificado'}</Text>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value &&
         prevProps.isEditing === nextProps.isEditing &&
         prevProps.loading === nextProps.loading;
});


// ============================================================================
// COMPONENTE MEMOIZADO: FORMULARIO COMPLETO
// ============================================================================
const ProfileForm = memo(({ initialData, onSave, loading }) => {
  console.log("🟢 ProfileForm render (solo debe aparecer 1 vez)");

  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = () => {
    if (!formData.full_name?.trim()) {
      Alert.alert("Campo Requerido", "Por favor, ingresa tu Nombre Completo.");
      return;
    }
    if (!formData.phone?.trim()) {
      Alert.alert("Campo Requerido", "Por favor, ingresa tu Teléfono.");
      return;
    }
    onSave(formData);
  };

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Datos Personales</Text>

        <InfoDisplay
          icon={Mail}
          label="Email"
          value={formData.email}
        />

        <EditableField
          icon={User}
          label="Nombre Completo"
          value={formData.full_name}
          onChangeText={(value) => handleChange('full_name', value)}
          required={true}
          isEditing={true}
          loading={loading}
        />

        <EditableField
          icon={Phone}
          label="Teléfono"
          value={formData.phone}
          onChangeText={(value) => handleChange('phone', value)}
          keyboardType="phone-pad"
          required={true}
          isEditing={true}
          loading={loading}
        />

        <EditableField
          icon={MapPin}
          label="Dirección"
          value={formData.address}
          onChangeText={(value) => handleChange('address', value)}
          multiline={true}
          isEditing={true}
          loading={loading}
        />

        <EditableField
          icon={Home}
          label="Ciudad"
          value={formData.city}
          onChangeText={(value) => handleChange('city', value)}
          isEditing={true}
          loading={loading}
        />

        <EditableField
          icon={Phone}
          label="Contacto de Emergencia"
          value={formData.emergency_contact}
          onChangeText={(value) => handleChange('emergency_contact', value)}
          keyboardType="phone-pad"
          isEditing={true}
          loading={loading}
        />
      </View>

      <Text style={styles.requiredNote}>* Campos obligatorios</Text>

      {/* Botón Guardar Cambios */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#1E293B" /> // Color oscuro para el spinner
        ) : (
          // 👇 CORRECCIÓN: AÑADIDO EL TEXTO Y EL ICONO 👇
          <>
            <Save size={20} color="#1E293B" />
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </>
          // 👆 FIN DE LA CORRECCIÓN 👆
        )}
      </TouchableOpacity>
    </>
  );
});

// ============================================================================
// COMPONENTE MEMOIZADO: VISTA DE SOLO LECTURA
// ============================================================================
const ProfileView = memo(({ data, onEdit }) => {
  console.log("🟢 ProfileView render");

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Datos Personales</Text>

        <InfoDisplay icon={Mail} label="Email" value={data.email} />
        <InfoDisplay icon={User} label="Nombre Completo" value={data.full_name} />
        <InfoDisplay icon={Phone} label="Teléfono" value={data.phone} />
        <InfoDisplay icon={MapPin} label="Dirección" value={data.address} />
        <InfoDisplay icon={Home} label="Ciudad" value={data.city} />
        <InfoDisplay icon={Phone} label="Contacto de Emergencia" value={data.emergency_contact} />
      </View>

      {/* Botón Editar Perfil */}
      <TouchableOpacity style={styles.editButtonLarge} onPress={onEdit} activeOpacity={0.7}>
        <Edit size={20} color="#1E293B" />
        <Text style={styles.editButtonLargeText}>Editar Perfil</Text>
      </TouchableOpacity>
    </>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [profile, setProfile] = useState(initialProfileState);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const hasLoadedProfile = useRef(false);
  const userIdRef = useRef(null);

  console.log("🔴 ProfileScreen RE-RENDER", { isEditing, loading });

  useEffect(() => {
    if (!isAuthLoading && user && user.uid !== userIdRef.current) {
      userIdRef.current = user.uid;
      if (!hasLoadedProfile.current) {
        hasLoadedProfile.current = true;
        loadProfileData();
      }
    }
    return () => {
      if (user && user.uid !== userIdRef.current) {
        hasLoadedProfile.current = false;
      }
    }
  }, [isAuthLoading, user?.uid]);

  const loadProfileData = async () => {
    if (!user) return;
    setLoading(true);
    console.log("ProfileScreen: Iniciando carga de perfil para:", user.uid);
    try {
      const profileData = await getUserProfile(user.uid);
      if (profileData) {
        console.log("ProfileScreen: Perfil encontrado");
        const loadedData = {
          email: user.email || '',
          full_name: profileData.displayName || profileData.full_name || user.displayName || '',
          phone: profileData.phoneNumber || '',
          address: profileData.address || '',
          city: profileData.city || '',
          emergency_contact: profileData.emergencyContact || '',
        };
        setProfile(loadedData);
        setIsEditing(false);
        setIsNewUser(false);
      } else {
        console.log("ProfileScreen: Perfil NO encontrado - nuevo usuario");
        const initialData = {
          email: user.email || '', 
          full_name: user.displayName || '', 
          phone: '',
          address: '', 
          city: '', 
          emergency_contact: '',
        };
        setProfile(initialData);
        setIsNewUser(true);
        setIsEditing(true);
        Alert.alert("¡Bienvenido!", "Por favor, completa tus datos personales.", [{ text: "Entendido" }]);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      Alert.alert("Error", "No se pudo cargar tu perfil.");
      hasLoadedProfile.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    setLoading(true);

    const dataToSave = {
      displayName: formData.full_name?.trim() || '',
      full_name: formData.full_name?.trim() || '', // Guardar ambos
      phoneNumber: formData.phone?.trim() || '',
      address: formData.address?.trim() || '',
      city: formData.city?.trim() || '',
      emergencyContact: formData.emergency_contact?.trim() || '',
      isProfileComplete: true,
    };

    try {
      const success = await saveUserProfile(user.uid, dataToSave, isNewUser);
      if (success) {
        setProfile({
          email: profile.email, // Mantener email
          full_name: dataToSave.displayName,
          phone: dataToSave.phoneNumber,
          address: dataToSave.address,
          city: dataToSave.city,
          emergency_contact: dataToSave.emergencyContact,
        });
        Alert.alert("¡Éxito!", "Tu perfil ha sido actualizado.");
        setIsEditing(false);
        if (isNewUser) setIsNewUser(false);
      } else {
        Alert.alert("Error", "No se pudieron guardar los cambios.");
      }
    } catch (error) {
      console.error("Error guardando:", error);
      Alert.alert("Error", error.message || "Hubo un problema al guardar.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert( "Cerrar Sesión", "¿Estás seguro?",
      [ { text: "Cancelar", style: "cancel" },
        { text: "Cerrar Sesión", style: "destructive",
          onPress: async () => {
            try { await auth.signOut(); }
            catch (error) { console.error("Error al cerrar sesión:", error); }
          }
        }
      ]
    );
  };

  const goToSettings = () => {
    console.log("Navegando a /profile/settings...");
    router.push('/profile/settings');
  };

  if (isAuthLoading) { return ( <View style={styles.centeredContainer}><ActivityIndicator size="large" color="#FBBF24" /><Text style={styles.loadingText}>Verificando sesión...</Text></View> ); }
  if (!user) { return ( <View style={styles.centeredContainer}><Text style={styles.loadingText}>Usuario no encontrado.</Text></View> ); }
  if (loading && !isEditing) { return ( <View style={styles.centeredContainer}><ActivityIndicator size="large" color="#FBBF24" /><Text style={styles.loadingText}>Cargando perfil...</Text></View> ); }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isNewUser ? "Completa tu Registro" : "Mi Perfil"}
          </Text>
        </View>

        {isEditing ? (
          <ProfileForm
            initialData={profile}
            onSave={handleSave}
            loading={loading}
          />
        ) : (
          <ProfileView
            data={profile}
            onEdit={() => setIsEditing(true)}
          />
        )}

        <TouchableOpacity
          style={[styles.settingsButton, loading && styles.buttonDisabled]}
          onPress={goToSettings}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Settings size={20} color="#94a3b8" />
          <Text style={styles.settingsButtonText}>Configuración</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, loading && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={loading}
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// ESTILOS
// ============================================================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 50 },
  centeredContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#0F172A',
    padding: 20,
  },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 16 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#E2E8F0' },
  card: { backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FBBF24', marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 16 },
  icon: { marginRight: 16, marginTop: 4, flexShrink: 0 },
  infoContent: { flex: 1 },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: '500' },
  required: { color: '#DC2626' },
  value: { fontSize: 16, color: '#E2E8F0', fontWeight: '500', minHeight: 24 },
  input: { backgroundColor: '#0F172A', color: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 6, fontSize: 16, borderWidth: 1, borderColor: '#475569', minHeight: 44 },
  inputMultiline: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  requiredNote: { color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginBottom: 20, marginTop: -8 },
  saveButton: { backgroundColor: '#FBBF24', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  saveButtonText: { color: '#1E293B', fontWeight: 'bold', fontSize: 16 },
  editButtonLarge: { backgroundColor: '#FBBF24', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  editButtonLargeText: { color: '#1E293B', fontWeight: 'bold', fontSize: 16 },
  settingsButton: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E293B', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  settingsButtonText: { color: '#E2E8F0', fontSize: 16, fontWeight: '600', flex: 1 },
  chevron: { color: '#64748B', fontSize: 24, fontWeight: '300' },
  logoutButton: { backgroundColor: 'transparent', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#DC2626' },
  logoutButtonText: { color: '#DC2626', fontWeight: 'bold', fontSize: 16 },
  buttonDisabled: { opacity: 0.5 },
});