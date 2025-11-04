import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wrench, ChevronRight, Clock } from 'lucide-react-native';
import { router } from 'expo-router';

export default function PreventiveCard({ item }) {
  const handlePress = () => {
    if (item.action_url) {
      router.push(item.action_url);
    }
  };

  // Determinar color según urgencia
  const urgencyConfig = {
    'now': { color: '#F59E0B', label: 'Esta semana' },
    '2_weeks': { color: '#3B82F6', label: 'En 2 semanas' },
    '1_month': { color: '#10B981', label: 'Este mes' },
    '3_months': { color: '#64748B', label: 'En 3 meses' }
  };

  const config = urgencyConfig[item.urgency] || urgencyConfig['1_month'];

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Header con icono */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: config.color + '22' }]}>
            <Wrench size={20} color={config.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.urgencyBadge}>
              <Clock size={12} color={config.color} />
              <Text style={[styles.urgencyText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Descripción */}
        <Text style={styles.description}>{item.description}</Text>

        {/* Beneficios */}
        {item.benefit && (
          <View style={styles.benefitBox}>
            <Text style={styles.benefitIcon}>✨</Text>
            <Text style={styles.benefitText}>{item.benefit}</Text>
          </View>
        )}

        {/* KM restantes */}
        {item.km_remaining && item.km_remaining > 0 && (
          <View style={styles.kmBox}>
            <Text style={styles.kmLabel}>Faltan aproximadamente:</Text>
            <Text style={styles.kmValue}>{item.km_remaining.toLocaleString('es-CL')} km</Text>
          </View>
        )}

        {/* Footer con costo y CTA */}
        <View style={styles.footer}>
          {item.estimated_cost && (
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Costo aprox.</Text>
              <Text style={styles.priceValue}>${item.estimated_cost}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.ctaButton} onPress={handlePress}>
            <Text style={styles.ctaText}>{item.cta || 'Agendar'}</Text>
            <ChevronRight size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 12,
  },
  benefitBox: {
    flexDirection: 'row',
    backgroundColor: '#10B98122',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  benefitIcon: {
    fontSize: 16,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  kmBox: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kmLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  kmValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00d9ff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceBox: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});