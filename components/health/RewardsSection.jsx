// RUTA: components/health/RewardsSection.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { 
  Award, 
  TrendingUp, 
  CheckCircle, 
  Lock,
  Sparkles,
  Crown,
  Target,
  Zap
} from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * COMPONENTE: RewardsSection
 * 
 * Sistema de gamificación:
 * - 💎 Diamantes acumulados
 * - 🏆 Niveles y progreso
 * - 🎯 Achievements desbloqueables
 * - 🎁 Recompensas futuras
 */
export default function RewardsSection({ vehicleId, healthData }) {
  console.log("RewardsSection - vehicleId recibido:", vehicleId);
  const [diamonds, setDiamonds] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRewardsData();
  }, [vehicleId]);

  const loadRewardsData = async () => {
    // 👇 AÑADIR ESTA VERIFICACIÓN 👇
    if (!vehicleId) {
      console.log("RewardsSection: vehicleId no disponible aún, esperando...");
      setLoading(false); // Asegúrate de quitar el estado de carga si sales temprano
      return; // No continuar si no hay ID de vehículo
    }
    // 👆 FIN DE LA VERIFICACIÓN 👆

    setLoading(true);
    try {
      // Ahora estamos seguros de que vehicleId es un string válido
      const healthDoc = await getDoc(doc(db, 'vehicleHealth', vehicleId));

      if (healthDoc.exists()) {
        const data = healthDoc.data();
        setDiamonds(data.diamonds || 0);
        setTotalServices(data.totalServicesLogged || 0);

        const calculatedLevel = Math.floor((data.diamonds || 0) / 100) + 1;
        setLevel(calculatedLevel);

        calculateAchievements(data);
      } else {
        // Opcional: Manejar el caso donde no existe el documento health
        console.log("No se encontró documento de recompensas para:", vehicleId);
        // Podrías resetear los estados a 0 aquí si es necesario
        setDiamonds(0);
        setTotalServices(0);
        setLevel(1);
        setAchievements([]); // Limpia los achievements si no hay datos
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
      // Podrías setear un estado de error aquí para mostrar en la UI
    } finally {
      // Mover setLoading(false) al finally para asegurar que siempre se ejecute
      setLoading(false);
    }
  };

  const calculateAchievements = (data) => {
    const servicesCount = data.totalServicesLogged || 0;
    const currentDiamonds = data.diamonds || 0;
    const healthScore = data.healthScore || 85;

    const allAchievements = [
      {
        id: 'first_service',
        title: '🔰 Primera Vez',
        description: 'Registra tu primer servicio',
        unlocked: servicesCount >= 1,
        reward: '+15 💎',
        progress: Math.min(servicesCount, 1),
        max: 1,
      },
      {
        id: 'early_bird',
        title: '🐦 Madrugador',
        description: 'Registra 5 servicios',
        unlocked: servicesCount >= 5,
        reward: '+50 💎',
        progress: Math.min(servicesCount, 5),
        max: 5,
      },
      {
        id: 'maintenance_pro',
        title: '🔧 Profesional',
        description: 'Registra 10 servicios',
        unlocked: servicesCount >= 10,
        reward: '+100 💎',
        progress: Math.min(servicesCount, 10),
        max: 10,
      },
      {
        id: 'perfect_health',
        title: '💯 Salud Perfecta',
        description: 'Alcanza 95% de Health Score',
        unlocked: healthScore >= 95,
        reward: '+150 💎',
        progress: healthScore,
        max: 95,
      },
      {
        id: 'diamond_collector',
        title: '💎 Coleccionista',
        description: 'Acumula 500 diamantes',
        unlocked: currentDiamonds >= 500,
        reward: '🎁 Recompensa Especial',
        progress: Math.min(currentDiamonds, 500),
        max: 500,
      },
      {
        id: 'consistency_king',
        title: '👑 Rey de la Constancia',
        description: 'Registra servicios 3 meses seguidos',
        unlocked: false, // TODO: implementar lógica de meses
        reward: '+200 💎',
        progress: 1,
        max: 3,
      },
    ];

    setAchievements(allAchievements);
  };

  // Calcular progreso al próximo nivel
  const diamondsToNextLevel = 100 - (diamonds % 100);
  const progressToNextLevel = ((diamonds % 100) / 100) * 100;

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Award size={24} color="#fbbf24" />
        <Text style={styles.title}>Recompensas</Text>
      </View>

      {/* Contador de Diamantes HERO */}
      <View style={styles.diamondHero}>
        <View style={styles.diamondGlow}>
          <Sparkles size={32} color="#fbbf24" />
        </View>
        <Text style={styles.diamondCount}>{diamonds}</Text>
        <Text style={styles.diamondLabel}>Diamantes Acumulados</Text>
        
        {/* Nivel */}
        <View style={styles.levelBadge}>
          <Crown size={16} color="#fbbf24" />
          <Text style={styles.levelText}>Nivel {level}</Text>
        </View>
      </View>

      {/* Progreso al siguiente nivel */}
      <View style={styles.levelProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progreso al Nivel {level + 1}</Text>
          <Text style={styles.progressSubtitle}>
            {diamondsToNextLevel} 💎 restantes
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progressToNextLevel}%` }
            ]} 
          />
        </View>
      </View>

      {/* Cómo ganar diamantes */}
      <View style={styles.howToEarn}>
        <Text style={styles.sectionTitle}>💡 Cómo Ganar Diamantes</Text>
        
        <View style={styles.earnMethodsList}>
          <View style={styles.earnMethod}>
            <View style={styles.earnIcon}>
              <Zap size={20} color="#00d9ff" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Registrar Servicio</Text>
              <Text style={styles.earnSubtitle}>Cada mantenimiento</Text>
            </View>
            <Text style={styles.earnReward}>+15 💎</Text>
          </View>

          <View style={styles.earnMethod}>
            <View style={styles.earnIcon}>
              <TrendingUp size={20} color="#10b981" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Actualizar Kilometraje</Text>
              <Text style={styles.earnSubtitle}>Cada actualización manual</Text>
            </View>
            <Text style={styles.earnReward}>+5 💎</Text>
          </View>

          <View style={styles.earnMethod}>
            <View style={styles.earnIcon}>
              <Target size={20} color="#f59e0b" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Desbloquear Achievement</Text>
              <Text style={styles.earnSubtitle}>Completa logros</Text>
            </View>
            <Text style={styles.earnReward}>+50-200 💎</Text>
          </View>

          <View style={styles.earnMethod}>
            <View style={styles.earnIcon}>
              <CheckCircle size={20} color="#8b5cf6" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Servicios al Día</Text>
              <Text style={styles.earnSubtitle}>Mantén todo actualizado</Text>
            </View>
            <Text style={styles.earnReward}>+50 💎</Text>
          </View>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.achievements}>
        <Text style={styles.sectionTitle}>🏆 Logros</Text>
        
        <View style={styles.achievementsList}>
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                achievement.unlocked && styles.achievementUnlocked
              ]}
            >
              {/* Icono de logro */}
              <View style={[
                styles.achievementIcon,
                achievement.unlocked && styles.achievementIconUnlocked
              ]}>
                {achievement.unlocked ? (
                  <CheckCircle size={24} color="#10b981" />
                ) : (
                  <Lock size={24} color="#64748b" />
                )}
              </View>

              {/* Info del logro */}
              <View style={styles.achievementInfo}>
                <Text style={[
                  styles.achievementTitle,
                  achievement.unlocked && styles.achievementTitleUnlocked
                ]}>
                  {achievement.title}
                </Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
                
                {/* Barra de progreso */}
                {!achievement.unlocked && (
                  <View style={styles.achievementProgressContainer}>
                    <View style={styles.achievementProgressBar}>
                      <View 
                        style={[
                          styles.achievementProgressFill,
                          { width: `${(achievement.progress / achievement.max) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.achievementProgressText}>
                      {achievement.progress}/{achievement.max}
                    </Text>
                  </View>
                )}
              </View>

              {/* Recompensa */}
              <View style={[
                styles.achievementReward,
                achievement.unlocked && styles.achievementRewardUnlocked
              ]}>
                <Text style={[
                  styles.achievementRewardText,
                  achievement.unlocked && styles.achievementRewardTextUnlocked
                ]}>
                  {achievement.reward}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Próximas Recompensas */}
      <View style={styles.futureRewards}>
        <Text style={styles.sectionTitle}>🎁 Próximamente</Text>
        <Text style={styles.futureDescription}>
          Usa tus diamantes para desbloquear beneficios exclusivos
        </Text>

        <View style={styles.futureList}>
          <View style={styles.futureItem}>
            <View style={styles.futureIcon}>
              <Text style={styles.futureEmoji}>🎫</Text>
            </View>
            <View style={styles.futureInfo}>
              <Text style={styles.futureTitle}>Descuento 10%</Text>
              <Text style={styles.futureSubtitle}>En próximo servicio</Text>
            </View>
            <View style={styles.futureCost}>
              <Text style={styles.futureCostText}>500 💎</Text>
            </View>
          </View>

          <View style={styles.futureItem}>
            <View style={styles.futureIcon}>
              <Text style={styles.futureEmoji}>📄</Text>
            </View>
            <View style={styles.futureInfo}>
              <Text style={styles.futureTitle}>Historial Premium</Text>
              <Text style={styles.futureSubtitle}>Certificado digital</Text>
            </View>
            <View style={styles.futureCost}>
              <Text style={styles.futureCostText}>300 💎</Text>
            </View>
          </View>

          <View style={styles.futureItem}>
            <View style={styles.futureIcon}>
              <Text style={styles.futureEmoji}>🔔</Text>
            </View>
            <View style={styles.futureInfo}>
              <Text style={styles.futureTitle}>Alertas Premium</Text>
              <Text style={styles.futureSubtitle}>Notificaciones personalizadas</Text>
            </View>
            <View style={styles.futureCost}>
              <Text style={styles.futureCostText}>200 💎</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer motivacional */}
      <View style={styles.footerCard}>
        <Sparkles size={24} color="#fbbf24" />
        <Text style={styles.footerText}>
          ¡Sigue así! Cada servicio registrado aumenta el valor de tu vehículo y te acerca a recompensas exclusivas.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Diamond Hero Section
  diamondHero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginBottom: 24,
    position: 'relative',
  },
  diamondGlow: {
    marginBottom: 16,
  },
  diamondCount: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fbbf24',
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  diamondLabel: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  // Level Progress
  levelProgress: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  progressHeader: {
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 6,
  },
  // How to Earn
  howToEarn: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  earnMethodsList: {
    gap: 12,
  },
  earnMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  earnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  earnSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  earnReward: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fbbf24',
  },
  // Achievements
  achievements: {
    marginBottom: 32,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  achievementTitleUnlocked: {
    color: '#fff',
  },
  achievementDescription: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 8,
  },
  achievementProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#00d9ff',
    borderRadius: 3,
  },
  achievementProgressText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  achievementReward: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  achievementRewardUnlocked: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  achievementRewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  achievementRewardTextUnlocked: {
    color: '#fbbf24',
  },
  // Future Rewards
  futureRewards: {
    marginBottom: 32,
  },
  futureDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  futureList: {
    gap: 12,
  },
  futureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  futureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  futureEmoji: {
    fontSize: 24,
  },
  futureInfo: {
    flex: 1,
  },
  futureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  futureSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  futureCost: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
  },
  futureCostText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a78bfa',
  },
  // Footer
  footerCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    marginBottom: 32,
  },
  footerText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});