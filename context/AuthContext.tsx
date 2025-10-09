// RUTA: app/context/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { getUserProfile } from '../services/profileService';

interface AuthContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
  isProfileVerified: boolean; // Estado de verificación de perfil
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isProfileVerified: false,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileVerified, setIsProfileVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        
        try {
          // Cargar el perfil del usuario para verificar si está completo
          const profileData = await getUserProfile(authenticatedUser.uid);
          // Verificamos si los datos obligatorios existen (por ejemplo, nombre y teléfono)
          const hasRequiredData = !!profileData?.full_name && !!profileData?.phone;
          setIsProfileVerified(hasRequiredData);
        } catch (e) {
          console.error("Error al obtener el perfil del usuario:", e);
          setIsProfileVerified(false);
        }
      } else {
        setUser(null);
        setIsProfileVerified(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FBBF24" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isProfileVerified }}>
      {children}
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});