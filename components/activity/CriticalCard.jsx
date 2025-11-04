import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

export default function CriticalCard({ item }) {
  const handlePress = () => {
    // Navegar según el tipo de item
    if (item.action_url) {
      router.push(item.action_url);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Badge de prioridad */}
        <View style={styles.badge}>
          <AlertTriangle size={14} color="#FFF" />
          <Text style={styles.badgeText}>URGENTE</Text>
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>

          {/* Costo vs Beneficio */}
          {item.estimated_cost && (
            <View style={styles.costContainer}>
              <View style={styles.costItem}>
                <Text style={styles.costLabel}>Costo prevención:</Text>
                <Text style={styles.costValue}>${item.estimated_cost}</Text>
              </View>
              {item.failure_cost && (
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Si falla:</Text>
                  <Text style={[styles.costValue, styles.danger]}>${item.failure_cost}</Text>
                </View>
              )}
            </View>
          )}

          {/* Razón */}
          {item.reason && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonText}>💡 {item.reason}</Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaButton} onPress={handlePress}>
          <Text style={styles.ctaText}>{item.cta || 'Ver Detalles'}</Text>
          <ChevronRight size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FEE2E2', // Red light background
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#7F1D1D',
    marginBottom: 12,
    lineHeight: 20,
  },
  costContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  costLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  danger: {
    color: '#EF4444',
  },
  reasonBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
  },
  reasonText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});