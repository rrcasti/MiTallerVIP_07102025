import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export default function QuickAccessButton({ icon: Icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Icon color="#FBBF24" size={28} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    width: '48%',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 120,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
