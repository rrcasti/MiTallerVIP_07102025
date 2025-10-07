// RUTA: components/chat/ChatHeader.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Phone } from 'lucide-react-native';

/**
 * Componente para la cabecera de la pantalla de chat.
 * @param {object} props
 * @param {number} props.activeRepairsCount - El número de reparaciones activas para mostrar.
 */
export default function ChatHeader({ activeRepairsCount }) {
  // console.log('[ChatHeader]: Renderizando cabecera.');
  return (
    <View style={styles.header}>
      <View style={styles.profileContainer}>
        {/* Agrega una imagen de perfil. Asegúrate de tener una en tu carpeta de assets. */}
        <Image 
          source={require('../../assets/asesor-avatar.png')} 
          style={styles.profileImage} 
        />
        <View style={styles.infoContainer}>
          <Text style={styles.headerTitle}>Mi Asesor de Servicio</Text>
          <Text style={styles.statusText}>En línea</Text>
        </View>
      </View>
      
      {/* Podríamos agregar un menú de opciones aquí en el futuro */}
      <TouchableOpacity style={styles.phoneButton}>
        <Phone size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 20,
  },
  infoContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusText: {
    fontSize: 14,
    color: '#A0AEC0', // Color gris más claro para que resalte en el fondo oscuro
  },
  phoneButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
});