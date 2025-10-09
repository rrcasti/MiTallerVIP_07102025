import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Crown, Star } from 'lucide-react-native';
import { createPaymentPreference } from '../services/paymentService';
import { useMembership } from '../context/MembershipContext';
import { membershipPlans } from '../constants/membershipPlans';

// --- Componente Reutilizable para la Tarjeta del Plan ---
const MembershipPlanCard = ({ plan, onSubscribe, isCurrentPlan, isSubscribing }) => (
  <View style={[styles.planCard, plan.isFeatured && styles.featuredPlan, isCurrentPlan && styles.currentPlan]}>
    {plan.isFeatured && !isCurrentPlan && (
      <View style={styles.featuredBadge}>
        <Star color="#1A202C" size={14} fill={PALETTE.accent} />
        <Text style={styles.featuredBadgeText}>Recomendado</Text>
      </View>
    )}
    <Text style={styles.planName}>{plan.name}</Text>
    <View style={styles.priceContainer}>
      <Text style={styles.planPrice}>{plan.price}</Text>
      <Text style={styles.planPricePeriod}>/ anual</Text>
    </View>
    <Text style={styles.planMonthlyPrice}>{plan.monthlyPrice}</Text>

    <View style={styles.divider} />

    <View style={styles.benefitsContainer}>
      {plan.benefits.map((benefit, index) => (
        <View key={index} style={styles.benefitItem}>
          <CheckCircle color={PALETTE.success} size={18} style={styles.benefitIcon} />
          <Text style={styles.benefitText}>{benefit}</Text>
        </View>
      ))}
    </View>

    <TouchableOpacity 
      style={[
        styles.subscribeButton,
        plan.isFeatured && styles.featuredSubscribeButton,
        isCurrentPlan && styles.currentPlanButton
      ]}
      onPress={() => onSubscribe(plan.id)}
      disabled={isCurrentPlan || isSubscribing}
    >
      {isSubscribing ? (
        <ActivityIndicator color={plan.isFeatured || isCurrentPlan ? PALETTE.background : PALETTE.textPrimary} />
      ) : (
        <Text style={[
          styles.subscribeButtonText,
          plan.isFeatured && styles.featuredSubscribeButtonText,
          isCurrentPlan && styles.currentPlanButtonText
        ]}>
          {isCurrentPlan ? 'Plan Actual' : 'Suscribirse'}
        </Text>
      )}
    </TouchableOpacity>
  </View>
);

// --- Componente Principal de la Página ---
export default function MembershipsScreen() {
  const router = useRouter();
  const { membership, refreshMembership, isLoading: isMembershipLoading } = useMembership();
  const [isSubscribing, setIsSubscribing] = useState(null);

  const handleSubscription = async (planId) => {
    const selectedPlan = membershipPlans.find(p => p.id === planId);
    if (!selectedPlan) return;

    if (membership?.type === planId) {
      Alert.alert("Plan Actual", "Ya estás suscripto a este plan.");
      return;
    }

    const alertTitle = membership ? 'Cambiar de Plan' : 'Confirmar Suscripción';
    const alertMessage = `Estás a punto de pagar ${selectedPlan.price} por el plan "${selectedPlan.name}".`;

    Alert.alert(alertTitle, alertMessage, [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Pagar con Mercado Pago', 
        onPress: async () => {
          setIsSubscribing(planId);
          try {
            const paymentItem = {
              title: selectedPlan.name, // Usamos el nombre del plan directamente
              description: 'Acceso anual al Club Mi Taller VIP', // Una descripción más limpia
              quantity: 1,
              unit_price: parseFloat(selectedPlan.price.replace(/[^0-9]/g, '')),
            };
            
            await createPaymentPreference(paymentItem);

          } catch (error) {
            Alert.alert("Error de Pago", error.message);
          } finally {
            setIsSubscribing(null);
          }
        }
      },
    ]);
  };
  
  if (isMembershipLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={PALETTE.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#CBD5E1" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Club VIP</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <Text style={styles.mainTitle}>Eleva tu Experiencia</Text>
        <Text style={styles.subtitle}>
          Únete a nuestro programa de fidelización premium y accede a beneficios exclusivos.
        </Text>

        {membershipPlans.map(plan => (
          <MembershipPlanCard 
            key={plan.id}
            plan={plan}
            onSubscribe={handleSubscription}
            isCurrentPlan={membership?.type === plan.id}
            isSubscribing={isSubscribing === plan.id}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const PALETTE = {
  background: '#1A202C',
  cardBackground: '#2D3748',
  accent: '#F7B500',
  textPrimary: '#EDF2F7',
  textSecondary: '#A0AEC0',
  success: '#34D399',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.background },
  container: { padding: 24, paddingBottom: 50 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: PALETTE.textPrimary },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PALETTE.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  planCard: {
    backgroundColor: PALETTE.cardBackground,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 24,
    position: 'relative',
  },
  featuredPlan: {
    borderColor: PALETTE.accent,
  },
  currentPlan: {
    borderColor: PALETTE.success,
    backgroundColor: '#2D3748'
  },
  featuredBadge: {
    position: 'absolute',
    top: -15,
    alignSelf: 'center',
    backgroundColor: PALETTE.accent,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredBadgeText: {
    color: PALETTE.background,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PALETTE.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PALETTE.textPrimary,
  },
  planPricePeriod: {
    fontSize: 16,
    color: PALETTE.textSecondary,
    marginLeft: 8,
    marginBottom: 5,
  },
  planMonthlyPrice: {
    fontSize: 14,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#4A5568',
    marginVertical: 16,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  benefitIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 16,
    color: PALETTE.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  subscribeButton: {
    borderWidth: 2,
    borderColor: '#4A5568',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 54,
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: PALETTE.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  featuredSubscribeButton: {
    backgroundColor: PALETTE.accent,
    borderColor: PALETTE.accent,
  },
  featuredSubscribeButtonText: {
    color: PALETTE.background,
  },
  currentPlanButton: {
    backgroundColor: PALETTE.success,
    borderColor: PALETTE.success,
  },
  currentPlanButtonText: {
    color: PALETTE.background,
  },
});