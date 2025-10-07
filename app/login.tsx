// RUTA: app/login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { auth } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Por favor, completa ambos campos.');
      return;
    }
    setLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        // CORRECCIÓN: Se agrega la alerta para notificar al usuario del éxito del registro.
        // La navegación al Dashboard ocurrirá automáticamente gracias al AuthContext.
        Alert.alert('¡Registro Exitoso!', `Bienvenido, ${userCredential.user.email}`);
      })
      .catch(error => {
        console.log('Error Firebase Registro:', error.code, error.message); 
        let message = 'Ocurrió un error. Intenta de nuevo.';
        if (error.code === 'auth/email-already-in-use') {
          message = 'El correo electrónico ya está en uso.';
        } else if (error.code === 'auth/weak-password') {
          message = 'La contraseña debe tener al menos 6 caracteres.';
        }
        Alert.alert('Error de Registro', message);
      })
      .finally(() => setLoading(false));
  };

  const handleLogin = () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Por favor, completa ambos campos.');
      return;
    }
    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        // Login exitoso. No se necesita alerta.
        // El AuthContext y el _layout se encargarán de la redirección automática.
      })
      .catch(error => {
        console.log('Error Firebase Login:', error.code, error.message);
        Alert.alert('Error de Login', 'El email o la contraseña son incorrectos.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
              <Image
                source={{ uri: 'https://img.icons8.com/plasticine/200/car-service.png' }}
                style={styles.logo}
              />
              <Text style={styles.title}>Mi Taller VIP</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña (mín. 6 caracteres)"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#FBBF24" style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.buttons}>
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={handleRegister}>
                  <Text style={[styles.buttonText, styles.buttonOutlineText]}>Crear Cuenta Nueva</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#0F172A',
    },
    keyboardAvoidingContainer: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'space-around',
      padding: 20,
    },
    header: {
      alignItems: 'center',
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FBBF24',
      textAlign: 'center',
    },
    form: {
      width: '100%',
    },
    input: {
      backgroundColor: '#1E293B',
      color: '#FFFFFF',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 8,
      fontSize: 16,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: '#334155',
    },
    buttons: {
      width: '100%',
    },
    button: {
      backgroundColor: '#FBBF24',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: '#1E293B',
      fontWeight: 'bold',
      fontSize: 16,
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderColor: '#FBBF24',
      borderWidth: 2,
    },
    buttonOutlineText: {
      color: '#FBBF24',
    },
});