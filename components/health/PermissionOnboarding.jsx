// RUTA: components/health/PermissionOnboarding.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Shield, Zap, TrendingUp } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function PermissionOnboarding({ onEnableGPS, onSkipToManual }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#0a0a0a']}
        style={styles.gradient}
      >
        {/* Ícono principal animado */}
        <Animated.View 
          entering={FadeInUp.duration(800).springify()}
          style={styles.iconContainer}
        >
          <View style={styles.iconGlow}>
            <MapPin size={64} color="#00d9ff" strokeWidth={2} />
          </View>
        </Animated.View>

        {/* Título */}
        <Animated.Text 
          entering={FadeInUp.delay(200).duration(800)}
          style={styles.title}
        >
          Health Check Inteligente
        </Animated.Text>
        
        <Animated.Text 
          entering={FadeInUp.delay(300).duration(800)}
          style={styles.subtitle}
        >
          Monitoreo automático del estado de tu vehículo
        </Animated.Text>

        {/* Features */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(800)}
          style={styles.featuresContainer}
        >
          <FeatureItem
            icon={<Zap size={24} color="#00d9ff" />}
            title="Cálculo Automático"
            description="Sin tocar nada, calculamos tus kilómetros"
          />
          <FeatureItem
            icon={<TrendingUp size={24} color="#00d9ff" />}
            title="Predicciones IA"
            description="Alertas antes de que surjan problemas"
          />
          <FeatureItem
            icon={<Shield size={24} color="#00d9ff" />}
            title="Privacidad Total"
            description="Tu ubicación nunca se comparte"
          />
        </Animated.View>

        {/* Botones */}
        <Animated.View 
          entering={FadeInDown.delay(600).duration(800)}
          style={styles.buttonsContainer}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onEnableGPS}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00d9ff', '#0099cc']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <MapPin size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Activar GPS Automático</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSkipToManual}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>
              Prefiero ingreso manual
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            🔒 Solo usamos tu ubicación para calcular distancias
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

function FeatureItem({ icon, title, description }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>{icon}</View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00d9ff11',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00d9ff11',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#999',
  },
  buttonsContainer: {
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});