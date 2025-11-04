// RUTA: components/chat/VideoModal.jsx

import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function VideoModal({ visible, videoUrl, onClose }) {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!visible && videoRef.current) {
      console.log('[VideoModal] Limpiando video al cerrar modal');
      videoRef.current.pauseAsync().catch(() => {});
      videoRef.current.unloadAsync().catch(() => {});
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.videoContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={32} color="white" />
          </TouchableOpacity>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Cargando video...</Text>
            </View>
          )}

          {hasError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ No se pudo cargar el video</Text>
              <TouchableOpacity onPress={onClose} style={styles.retryButton}>
                <Text style={styles.retryText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Video
              ref__={videoRef}
              source={{ uri: videoUrl }}
              style={styles.video}
              useNativeControls={true}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={true}
              isLooping={false}
              onLoad={() => {
                console.log('[VideoModal] Video cargado exitosamente');
                setIsLoading(false);
              }}
              onError={(error) => {
                console.error('[VideoModal] Error:', error);
                setHasError(true);
                setIsLoading(false);
              }}
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) {
                  console.log('[VideoModal] Video terminó de reproducirse');
                }
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  videoContainer: {
    width: width * 0.9,
    height: height * 0.6,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});