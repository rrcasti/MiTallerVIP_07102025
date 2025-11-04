import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lightbulb, ChevronRight, BookOpen } from 'lucide-react-native';
import { router } from 'expo-router';

export default function EducationalCard({ item }) {
  const handlePress = () => {
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Lightbulb size={20} color="#F59E0B" />
          </View>
          <Text style={styles.badge}>APRENDE</Text>
        </View>

        {/* Contenido */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>

        {/* ¿Por qué es importante? */}
        {item.reason && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonTitle}>¿Por qué es importante?</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>
        )}

        {/* Tips rápidos */}
        {item.tips && item.tips.length > 0 && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Tips:</Text>
            {item.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA suave */}
        <TouchableOpacity style={styles.ctaButton} onPress={handlePress}>
          <BookOpen size={16} color="#F59E0B" />
          <Text style={styles.ctaText}>{item.cta || 'Leer más'}</Text>
          <ChevronRight size={16} color="#F59E0B" />
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
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 12,
  },
  reasonBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reasonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  tipsContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '700',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  ctaText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
  },
});