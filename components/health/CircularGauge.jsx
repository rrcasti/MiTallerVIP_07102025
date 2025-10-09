// RUTA: components/health/CircularGauge.jsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularGauge({ 
  value, 
  maxValue = 100, 
  size = 200, 
  strokeWidth = 20,
  label = '',
  unit = '',
  color = '#00d9ff'
}) {
  const progress = useSharedValue(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (value / maxValue) * 100;

  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: 1500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  // Color dinámico según valor
  const getColor = () => {
    if (percentage >= 80) return '#00ff88'; // Verde
    if (percentage >= 50) return '#00d9ff'; // Cyan
    if (percentage >= 30) return '#ffa500'; // Naranja
    return '#ff4444'; // Rojo
  };

  const displayColor = getColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={displayColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={displayColor} stopOpacity="0.6" />
          </SvgGradient>
        </Defs>
        
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1a1a1a"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      
      {/* Center text */}
      <View style={styles.centerContent}>
        <Text style={[styles.value, { color: displayColor }]}>
          {Math.round(value)}
        </Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2,
  },
  unit: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginTop: -4,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});