import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import {
  User, Phone, MapPin, Mail, LogOut, Save, Edit, Home, Crown, Car
} from 'lucide-react-native';
import { auth } from '../firebase/config';
import { getUserProfile, saveUserProfile } from '../services/profileService';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const initialProfileState = {
  full_name: '',
  phone: '',
  address: '',
  city: '',
  emergency_contact: '',
  email: '',
  displayName: '',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (user) {
      console.log("Usuario actual:", user);
    }
  }, [user]);

  const [profile, setProfile] = useState(initialProfileState);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [editedData, setEditedData] = useState({});

  const fetchProfile = useCallback(async () => {
    if (isAuthLoading || !user || isEditing) return;

    setLoading(true);
    const profileData = await getUserProfile(user.uid);

    if (profileData) {
      const loadedData = {
        email: user.email || '',
        full_name: profileData.displayName || profileData.full_name || user.displayName || '',
        phone: profileData.phoneNumber || '',
        address: profileData.address || '',
        city: profileData.city || '',
        emergency_contact: profileData.emergencyContact || '',
      };

      setProfile(loadedData);
      setEditedData(loadedData);
      setIsEditing(false);
    } else {
      const initialData = {
        email: user.email || '',
        full_name: user.displayName || '',
        phone: '', address: '', city: '', emergency_contact: '',
      };

      setProfile(initialData);
      setEditedData(initialData);
      setIsNewUser(true);
      setIsEditing(true);
      Alert.alert(
        "¡Bienvenido!",
        "Completa tus datos personales. ¡Es obligatorio para usar la app!"
      );
    }

    setLoading(false);
  }, [user, isAuthLoading]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editedData.full_name?.trim() || !editedData.phone?.trim()) {
      Alert.alert("Error", "Nombre Completo y Teléfono son obligatorios.");
      return;
    }

    setLoading(true);

    const dataToSave = {
      displayName: editedData.full_name?.trim() || '',
      email: user.email || '',
      phoneNumber: editedData.phone?.trim() || '',
      address: editedData.address?.trim() || '',
      city: editedData.city?.trim() || '',
      emergencyContact: editedData.emergency_contact?.trim() || '',
    };

    const success = await saveUserProfile(user.uid, dataToSave, isNewUser);

    if (success) {
      setProfile(prev => ({ ...prev, ...editedData }));
      Alert.alert("Éxito", "Datos guardados correctamente.");
      setIsEditing(false);
      if (isNewUser) {
        setIsNewUser(false);
      }
    } else {
      Alert.alert("Error", "Hubo un problema al guardar los datos.");
    }

    setLoading(false);
  };

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        // Redirección manejada por _layout
      })
      .catch(error => {
        console.error("Error al cerrar sesión:", error);
        Alert.alert("Error", "No se pudo cerrar la sesión.");
      });
  };

  if (isAuthLoading || !user || loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#FBBF24" />
        <Text style={styles.loadingText}>Cargando Perfil...</Text>
      </View>
    );
  }

  const InfoDisplay = ({ icon: Icon, label, value }) => (
    <View style={styles.infoRow}>
      {!!Icon && typeof Icon === 'function' && (
        <Icon size={20} color="#64748B" style={styles.icon} />
      )}
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  const EditableField = ({ icon: Icon, label, fieldName, keyboardType = 'default' }) => {
    const displayValue = isEditing ? editedData[fieldName] : profile[fieldName];

    return (
      <View style={styles.infoRow}>
        {!!Icon && typeof Icon === 'function' && (
          <Icon size={20} color="#64748B" style={styles.icon} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={displayValue || ''}
              onChangeText={(text) => handleChange(fieldName, text)}
              placeholder={`Ingresa tu ${label.toLowerCase()}`}
              keyboardType={keyboardType}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          ) : (
            <Text style={styles.value}>{profile[fieldName] || 'N/A'}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{isNewUser ? "Completa tu Registro" : "Mi Perfil"}</Text>
                {isEditing ? (
                  <TouchableOpacity style={styles.editButton} onPress={handleSave} disabled={loading}>
                    <Save size={20} color="#1E293B" />
                    <Text style={styles.editButtonText}>Guardar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                    <Edit size={20} color="#1E293B" />
                    <Text style={styles.editButtonText}>Editar Perfil</Text>
                  </TouchableOpacity>
                )}
              </View>

              {user.profile?.isAdmin && (
                <TouchableOpacity style={styles.adminCard} onPress={() => router.push('/AdminDashboard')}>
                  <Car size={24} color="#1E293B" />
                  <Text style={styles.adminText}>Panel de Administración</Text>
                </TouchableOpacity>
              )}

              {!isNewUser && (
                <View style={styles.membershipCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.membershipTitle}>Membresía VIP Elite</Text>
                    <Crown size={24} color="#1E293B" />
                  </View>
                  <Text style={styles.membershipSubtitle}>Válida hasta 13/09/2026</Text>
                </View>
              )}

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Datos del Cliente</Text>

                <InfoDisplay icon={Mail} label="Email (No Editable)" value={user.email} />
                <EditableField icon={User} label="Nombre Completo" fieldName="full_name" />
                <EditableField icon={Phone} label="Teléfono" fieldName="phone" keyboardType="phone-pad" />
                <EditableField icon={MapPin} label="Dirección" fieldName="address" />
                <EditableField icon={Home} label="Ciudad" fieldName="city" />
                <EditableField icon={Phone} label="Contacto de Emergencia" fieldName="emergency_contact" keyboardType="phone-pad" />
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
                <LogOut size={20} color="#DC2626" />
                <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20, paddingBottom: 100 },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { color: '#94A3B8', marginTop: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  editButton: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: { color: '#1E293B', fontWeight: 'bold', marginLeft: 8 },
  adminCard: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  adminText: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  membershipCard: {
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  membershipTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  membershipSubtitle: { fontSize: 14, color: '#475569' },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FBBF24',
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 12
  },
  icon: { marginRight: 12 },
  label: { fontSize: 12, color: '#64748B' },
  value: { fontSize: 16, color: '#FFFFFF', marginTop: 2, fontWeight: '500' },
  input: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    fontSize: 16,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#1E293B',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
