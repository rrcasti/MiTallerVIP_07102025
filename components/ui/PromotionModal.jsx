import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  Animated,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { X } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PromotionModal({ isVisible, imageUrl, onDismiss }) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      console.log('🎉 PromotionModal: Abriendo con imagen:', imageUrl);
      
      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Resetear animaciones
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [isVisible]);

  if (!isVisible || !imageUrl) {
    console.log('🚫 PromotionModal: No visible o sin imagen');
    return null;
  }

  const handleDismiss = () => {
    console.log('👆 PromotionModal: Usuario cerró el modal');
    
    // Animación de salida
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  // Corregir URL si es necesario
  const correctedImageUrl = imageUrl?.includes('mitallervip.appspot.com')
    ? imageUrl.replace('mitallervip.appspot.com', 'mitallervip.firebasestorage.app')
    : imageUrl;

  console.log('🖼️ PromotionModal: Renderizando con URL:', correctedImageUrl);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        <View style={styles.overlay} />

        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Image
            source={{ uri: correctedImageUrl }}
            style={styles.image}
            resizeMode="contain"
            onError={(error) => {
              console.error('❌ PromotionModal: Error cargando imagen:', error.nativeEvent.error);
            }}
            onLoad={() => {
              console.log('✅ PromotionModal: Imagen cargada correctamente');
            }}
          />

          {/* Botón X para cerrar */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <View style={styles.closeButtonCircle}>
              <X size={28} color="#FFFFFF" strokeWidth={3} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
    right: 20,
    zIndex: 1000,
  },
  closeButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});