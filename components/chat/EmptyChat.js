// RUTA: components/chat/EmptyChat.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessageCircle } from 'lucide-react-native';

/**
 * Componente que se muestra cuando no hay mensajes en la conversación.
 */
export default function EmptyChat() {
  // console.log('[EmptyChat]: Renderizando estado vacío.');
  return (
    <View style={styles.container}>
      <MessageCircle size={64} color="#475569" />
      <Text style={styles.title}>Inicia la conversación</Text>
      <Text style={styles.subtitle}>
        Pregunta lo que necesites sobre tu vehículo o servicios.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
});