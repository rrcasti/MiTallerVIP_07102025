// Ruta: app/promotions/view.jsx

import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PromotionViewScreen = () => {
  const { imageUrl, title } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: title || "Promoción", headerBackTitleVisible: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No hay imagen disponible</Text>
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{title || "Detalles de la Promoción"}</Text>
          <Text style={styles.bodyText}>
            Aquí podrías añadir más detalles de la promoción, su duración, términos y condiciones, etc.
            Actualmente, la notificación solo envía el título y la URL de la imagen.
            Si necesitas más contenido, tu Cloud Function debería enviar más campos.
          </Text>
          {/* Puedes añadir más botones o información aquí */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Fondo oscuro
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.7, // Altura proporcional al ancho
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#64748b',
    fontSize: 16,
  },
  textContainer: {
    paddingHorizontal: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
  },
});

export default PromotionViewScreen;