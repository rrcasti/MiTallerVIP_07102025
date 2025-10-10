/**
 * INTERVALOS DE MANTENIMIENTO ESTÁNDAR
 * Basado en recomendaciones de fabricantes
 */

export const MAINTENANCE_INTERVALS = {
    // Mantenimiento Regular (DESGASTE NORMAL)
    oil_change: {
      name: 'Cambio de Aceite y Filtro',
      interval_km: 6000,
      urgency: 'high',
      category: 'wear',
      description: 'Cambio de aceite de motor y filtro de aceite',
      warning_km: 500,
    },
    
    air_filter: {
      name: 'Cambio de Filtro de Aire',
      interval_km: 15000,
      urgency: 'medium',
      category: 'wear',
      description: 'Reemplazo del filtro de aire del motor',
      warning_km: 1000,
    },
    
    cabin_filter: {
      name: 'Cambio de Filtro de Habitáculo',
      interval_km: 15000,
      urgency: 'low',
      category: 'wear',
      description: 'Reemplazo del filtro de aire acondicionado',
      warning_km: 2000,
    },
  
    // Sistema de Frenos (DESGASTE NORMAL - SEGURIDAD)
    brake_pads: {
      name: 'Cambio de Pastillas de Freno',
      interval_km: 30000,
      urgency: 'high',
      category: 'wear',
      description: 'Reemplazo de pastillas de freno delanteras y traseras por desgaste',
      warning_km: 2000,
    },
    
    brake_fluid: {
      name: 'Cambio de Líquido de Frenos',
      interval_km: 40000,
      urgency: 'high',
      category: 'wear',
      description: 'Reemplazo del líquido de frenos',
      warning_km: 3000,
    },
  
    // Transmisión (PREVENTIVO - Evita FALLAS)
    timing_belt: {
      name: 'Cambio de Correa de Distribución',
      interval_km: 60000,
      urgency: 'critical',
      category: 'failure_prevention',
      description: 'CRÍTICO: Previene falla catastrófica del motor',
      warning_km: 5000,
    },
    
    transmission_oil: {
      name: 'Cambio de Aceite de Transmisión',
      interval_km: 60000,
      urgency: 'medium',
      category: 'failure_prevention',
      description: 'Previene fallas prematuras en la transmisión',
      warning_km: 5000,
    },
  
    // Sistema de Refrigeración (PREVENTIVO)
    coolant: {
      name: 'Cambio de Líquido Refrigerante',
      interval_km: 40000,
      urgency: 'medium',
      category: 'failure_prevention',
      description: 'Previene sobrecalentamiento y fallas del motor',
      warning_km: 3000,
    },
  
    // Suspensión (DESGASTE NORMAL)
    shock_absorbers: {
      name: 'Revisión de Amortiguadores',
      interval_km: 80000,
      urgency: 'medium',
      category: 'wear',
      description: 'Inspección y posible reemplazo por desgaste',
      warning_km: 5000,
    },
  
    // Neumáticos (DESGASTE NORMAL - SEGURIDAD)
    tire_rotation: {
      name: 'Rotación de Neumáticos',
      interval_km: 10000,
      urgency: 'medium',
      category: 'wear',
      description: 'Rotación para desgaste uniforme',
      warning_km: 1000,
    },
    
    wheel_alignment: {
      name: 'Alineación y Balanceo',
      interval_km: 20000,
      urgency: 'medium',
      category: 'wear',
      description: 'Previene desgaste desigual de neumáticos',
      warning_km: 2000,
    },
  
    // Batería (DESGASTE NATURAL)
    battery_check: {
      name: 'Revisión de Batería',
      interval_km: 30000,
      urgency: 'low',
      category: 'wear',
      description: 'Inspección del estado de la batería (vida útil limitada)',
      warning_km: 3000,
    },
  
    // Inspección General (PREVENTIVO)
    general_inspection: {
      name: 'Inspección General',
      interval_km: 10000,
      urgency: 'medium',
      category: 'preventive',
      description: 'Revisión completa para detectar fallas tempranas',
      warning_km: 1000,
    },
  };
  
  /**
   * Calcula servicios próximos según kilometraje actual
   */
  export function calculateUpcomingServices(currentKm, lastServices = {}) {
    const services = [];
  
    for (const [key, service] of Object.entries(MAINTENANCE_INTERVALS)) {
      const lastServiceKm = lastServices[key] || 0;
      const kmSinceService = currentKm - lastServiceKm;
      const kmUntilService = service.interval_km - kmSinceService;
      const isOverdue = kmUntilService < 0;
      const isWarning = kmUntilService <= service.warning_km;
  
      services.push({
        id: key,
        ...service,
        last_service_km: lastServiceKm,
        km_since_service: kmSinceService,
        km_until_service: Math.abs(kmUntilService),
        is_overdue: isOverdue,
        is_warning: isWarning,
        priority: isOverdue ? 'urgent' : isWarning ? 'soon' : 'scheduled',
      });
    }
  
    // Ordenar por urgencia
    services.sort((a, b) => {
      if (a.is_overdue && !b.is_overdue) return -1;
      if (!a.is_overdue && b.is_overdue) return 1;
      if (a.is_warning && !b.is_warning) return -1;
      if (!a.is_warning && b.is_warning) return 1;
      return a.km_until_service - b.km_until_service;
    });
  
    return services;
  }
  
  /**
   * Genera prompt detallado para la IA con información de desgaste vs fallas
   */
  export function generateMaintenancePrompt(currentKm, lastServices = {}) {
    const upcomingServices = calculateUpcomingServices(currentKm, lastServices);
    
    const overdueServices = upcomingServices.filter(s => s.is_overdue);
    const warningServices = upcomingServices.filter(s => s.is_warning && !s.is_overdue);
    const nextServices = upcomingServices.filter(s => !s.is_overdue && !s.is_warning).slice(0, 3);
  
    let prompt = '\n\n=== CALENDARIO DE MANTENIMIENTO ===\n\n';
    
    if (overdueServices.length > 0) {
      prompt += '⚠️ SERVICIOS VENCIDOS (URGENTE):\n';
      overdueServices.forEach(s => {
        prompt += `- ${s.name}: Vencido hace ${s.km_until_service.toLocaleString()} km\n`;
        prompt += `  Tipo: ${s.category === 'failure_prevention' ? 'PREVENTIVO (evita fallas)' : 'DESGASTE NORMAL'}\n`;
      });
      prompt += '\n';
    }
  
    if (warningServices.length > 0) {
      prompt += '🔔 SERVICIOS PRÓXIMOS (Planificar pronto):\n';
      warningServices.forEach(s => {
        prompt += `- ${s.name}: En ${s.km_until_service.toLocaleString()} km\n`;
      });
      prompt += '\n';
    }
  
    if (nextServices.length > 0) {
      prompt += '📅 PRÓXIMOS SERVICIOS PROGRAMADOS:\n';
      nextServices.forEach(s => {
        prompt += `- ${s.name}: En ${s.km_until_service.toLocaleString()} km\n`;
      });
    }
  
    // Agregar información sobre DESGASTE vs FALLAS
    prompt += `
  
  === CONCEPTOS IMPORTANTES PARA EL ANÁLISIS ===
  
  📖 DESGASTE NORMAL:
  - Es el deterioro gradual por uso regular del vehículo
  - Ejemplos: pastillas de freno, neumáticos, batería, filtros
  - NO cubierto por garantía (es responsabilidad del propietario)
  - Es INEVITABLE y debe mantenerse regularmente
  
  ⚠️ FALLAS o DEFECTOS:
  - Ocurren cuando una pieza falla PREMATURAMENTE
  - Ejemplo: motor que falla con 10,000 km (debería durar 200,000+)
  - PUEDEN estar cubiertas por garantía
  - Requieren reparación inmediata para evitar daños consecuentes
  
  🔧 MANTENIMIENTO PREVENTIVO:
  - Evita que el DESGASTE se convierta en FALLA
  - Ejemplo: cambiar correa de distribución a tiempo evita rotura del motor
  - Es MÁS BARATO prevenir que reparar fallas
  
  📊 AL ANALIZAR:
  - Servicios vencidos de categoría "failure_prevention" son CRÍTICOS
  - Desgaste normal debe mantenerse pero no es emergencia inmediata
  - Detectar señales tempranas de fallas (ruidos, vibraciones, pérdidas)
  `;
  
    return prompt;
  }