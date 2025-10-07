// RUTA: components/chat/ChatInput.js

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { Paperclip, Send, X, Video as VideoIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

// Asumimos que la lógica de onSendMessage puede manejar un objeto con { text, file }
export default function ChatInput({ onSendMessage, disabled = false }) {
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permiso denegado", "Necesitas dar acceso a tu galería para adjuntar archivos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.fileSize > 10 * 1024 * 1024) {
        Alert.alert("Archivo muy grande", "El tamaño máximo es 10MB.");
        return;
      }
      setAttachedFile(asset);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  const handleSend = async () => {
    if ((!message.trim() && !attachedFile) || isUploading || disabled) return;

    setIsUploading(true);
    try {
      const messageData = {
        text: message.trim(),
        file: attachedFile,
      };
      await onSendMessage(messageData);
      setMessage('');
      removeAttachment();
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar el mensaje.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {attachedFile && (
        <View style={styles.previewContainer}>
          <View style={styles.previewBox}>
            {attachedFile.type === 'video' ? (
              <VideoIcon color="#94A3B8" size={48} />
            ) : (
              <Image source={{ uri: attachedFile.uri }} style={styles.previewImage} />
            )}
          </View>
          <TouchableOpacity onPress={removeAttachment} style={styles.removeButton}>
            <X color="white" size={12} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputBar}>
        <TouchableOpacity 
          onPress={handleFileSelect} 
          disabled={isUploading || disabled || attachedFile !== null}
          style={styles.clipButton}
          activeOpacity={0.7}
        >
          <Paperclip color={attachedFile ? '#475569' : '#94A3B8'} size={24} />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#64748B"
          multiline
          editable={!isUploading && !disabled}
        />

        <TouchableOpacity 
          onPress={handleSend} 
          disabled={(!message.trim() && !attachedFile) || isUploading || disabled} 
          style={[styles.sendButton, { opacity: (!message.trim() && !attachedFile) || isUploading ? 0.5 : 1 }]}
          activeOpacity={0.7}
        >
          {isUploading ? <ActivityIndicator color="#1E293B" /> : <Send color="#1E293B" size={22} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#0F172A', // Fondo principal de la app
    borderTopWidth: 1,
    borderTopColor: '#334155', // Línea de separación sutil
  },
  previewContainer: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  previewBox: {
    width: 80,
    height: 80,
    backgroundColor: '#334155',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B', // Fondo de la cápsula de input
    borderRadius: 25,
    paddingHorizontal: 8,
  },
  clipButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    color: '#FFFFFF', // Texto blanco
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#FBBF24', // Color de acento de la app
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});