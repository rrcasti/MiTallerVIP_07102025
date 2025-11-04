import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Sparkles, Calendar, TrendingUp, Shield } from 'lucide-react-native';
import { router } from 'expo-router';

export default function EmptyStateEducation({ educationalContent, maintenanceRoadmap }) {
  return (
    <ScrollView style={styles.container}>
      {/* Estado excelente */}
      <View style={styles.statusCard}>
        <View style={styles.statusIconContainer}>
          <Sparkles size={32} color="#10B981" />
        </View>
        <Text style={styles.statusTitle}>¡Tu vehículo está en excelente estado! 🎉</Text>
        <Text style={styles.statusSubtitle}>
          No hay nada urgente que atender ahora
        </Text>
      </View>

      {/* Contenido educativo */}
      {educationalContent && (
        <View style={styles.educationalCard}>
          <View style={styles.cardHeader}>
            <Shield size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>{educationalContent.title}</Text>
          </View>
          <Text style={styles.cardMessage}>{educationalContent.message}</Text>

          {/* Tips */}
          {educationalContent.tips && educationalContent.tips.length > 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>💡 Consejos para mantenerlo así:</Text>
              {educationalContent.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipNumber}>{index + 1}</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Roadmap de mantenimiento */}
      {maintenanceRoadmap && maintenanceRoadmap.length > 0 && (
        <View style={styles.roadmapCard}>
          <View style={styles.cardHeader}>
            <Calendar size={24} color="#F59E0B" />
            <Text style={styles.cardTitle}>Tu Plan de Mantenimiento</Text>
          </View>
          <Text style={styles.roadmapSubtitle}>
            Preparémonos para lo que viene en los próximos kilómetros
          </Text>

          {/* Timeline */}
          <View style={styles.timeline}>
            {maintenanceRoadmap.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                {index < maintenanceRoadmap.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineKm}>
                      {item.km.toLocaleString('es-CL')} km
                    </Text>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(item.priority) }
                    ]}>
                      <Text style={styles.priorityText}>
                        {getPriorityLabel(item.priority)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.timelineDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* CTA para agendar revisión preventiva */}
      <TouchableOpacity 
        style={styles.ctaCard}
        onPress={() => router.push('/requests/ServiceRequest')}
        activeOpacity={0.9}
      >
        <View style={styles.ctaIcon}>
          <TrendingUp size={24} color="#FFF" />
        </View>
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>¿Quieres adelantarte?</Text>
          <Text style={styles.ctaSubtitle}>Agenda una revisión preventiva</Text>
        </View>
        <Text style={styles.ctaArrow}>→</Text>
      </TouchableOpacity>

      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#64748B';
  }
};

const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'high': return 'Alta';
    case 'medium': return 'Media';
    case 'low': return 'Baja';
    default: return 'Normal';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#10B98122',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#065F46',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
  },
  educationalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
  cardMessage: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 16,
  },
  tipsSection: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  roadmapCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roadmapSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    marginTop: 4,
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 5.5,
    top: 16,
    bottom: -20,
    width: 1,
    backgroundColor: '#334155',
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
    paddingBottom: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timelineKm: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d9ff',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  timelineDescription: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  ctaCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: '#DBEAFE',
  },
  ctaArrow: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});