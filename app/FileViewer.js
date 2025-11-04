import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Text,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { X } from 'lucide-react-native';

export default function FileViewerScreen() {
  const router = useRouter();
  const { fileUrl, fileType } = useLocalSearchParams();
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    console.log('[FileViewer] ✅ Montado');
    console.log(`[FileViewer] 📁 Tipo: ${fileType}`);
    console.log(`[FileViewer] 🔗 URL: ${fileUrl}`);

    return () => {
      console.log('[FileViewer] 🧹 Desmontado');
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(() => {});
        videoRef.current.unloadAsync().catch(() => {});
        console.log('[FileViewer] ⏹️ Video liberado');
      }
    };
  }, []);

  const renderContent = () => {
    if (fileType === 'image' && fileUrl) {
      return (
        <Image
          source={{ uri: fileUrl }}
          style={styles.media}
          resizeMode="contain"
        />
      );
    }

    if (fileType === 'video' && fileUrl) {
      return (
        <Video
          ref={(ref) => {
            videoRef.current = ref;
          }}
          source={{ uri: fileUrl }}
          style={styles.media}
          useNativeControls={true}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          isLooping={false}
          onLoad={() => {
            console.log('[FileViewer] ✅ Video cargado');
            setIsLoading(false);
          }}
          onError={(e) => {
            console.log('[FileViewer] ❌ Error al cargar video', e);
            setHasError(true);
            setIsLoading(false);
          }}
        />
      );
    }

    return (
      <Text style={styles.errorText}>
        ❌ Tipo de archivo no soportado.
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={async () => {
          if (videoRef.current) {
            try {
              console.log('[FileViewer] 🔒 Pausando video antes de cerrar');
              await videoRef.current.pauseAsync();
            } catch (e) {
              console.warn('[FileViewer] ⚠️ Error al pausar:', e);
            }
          }
          router.back();
        }}
      >
        <X size={32} color="white" />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        {renderContent()}
        {isLoading && fileType === 'video' && (
          <Text style={styles.loadingText}>⏳ Cargando video...</Text>
        )}
        {hasError && (
          <Text style={styles.errorText}>❌ No se pudo reproducir el video</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    position: 'absolute',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 60,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
});
