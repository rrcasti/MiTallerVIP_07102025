import { callGeminiAPI } from './geminiService';

/**
 * SERVICIO: Análisis Inteligente con Gemini
 * Usa Gemini para analizar el vehículo y generar recomendaciones priorizadas
 */

/**
 * Construye el contexto completo del vehículo para análisis
 */
export const buildVehicleContext = (vehicle, healthData, serviceHistory) => {
  return {
    brand: vehicle?.brand || 'Desconocido',
    model: vehicle?.model || 'Desconocido',
    year: vehicle?.year || 2020,
    currentKm: healthData?.currentKm || vehicle?.mileage || 0,
    lastServiceDate: healthData?.lastUpdate || null,
    lastOilChange: healthData?.lastServices?.oil_change || 0,
    avgKmPerMonth: healthData?.kmThisMonth || 0,
    serviceHistory: serviceHistory || []
  };
};

/**
 * Analiza el contexto completo del vehículo y genera recomendaciones inteligentes
 */
export const analyzeVehicleWithAI = async (vehicleContext) => {
  try {
    console.log('🤖 Iniciando análisis con IA...');
    console.log('📊 Contexto:', vehicleContext);

    const currentKm = vehicleContext.currentKm || 0;
    const lastOilChange = vehicleContext.lastOilChange || 0;
    const kmSinceOil = currentKm - lastOilChange;

    const prompt = `
Eres un asesor automotriz experto de Mi Taller VIP. Analiza este vehículo y genera recomendaciones PRIORIZADAS e INTELIGENTES.

CONTEXTO DEL VEHÍCULO:
- Marca/Modelo: ${vehicleContext.brand} ${vehicleContext.model} ${vehicleContext.year}
- Kilometraje actual: ${currentKm.toLocaleString('es-CL')} km
- Último cambio de aceite: ${lastOilChange.toLocaleString('es-CL')} km
- KM desde último aceite: ${kmSinceOil.toLocaleString('es-CL')} km
- Patrón de uso: ${vehicleContext.avgKmPerMonth || 0} km/mes
- Edad del vehículo: ${new Date().getFullYear() - vehicleContext.year} años

TU TAREA:
1. Identifica TODO lo que necesita atención (crítico, preventivo, educativo)
2. Para cada item, explica en lenguaje simple POR QUÉ es importante
3. Da contexto económico: costo de prevención vs costo de falla
4. Sugiere CUÁNDO hacerlo (now, 2_weeks, 1_month, 3_months)
5. Si NO hay nada urgente, genera contenido EDUCATIVO para "sembrar semillas"

REGLAS IMPORTANTES:
- Sé HONESTO: Si no hay nada urgente, dilo y enfócate en educación
- Usa lenguaje persuasivo pero NO alarmista
- Siempre da contexto de costo/beneficio
- Prioriza: seguridad > economía > confort
- NO inventes problemas
- Genera contenido educativo valioso, no spam de marketing

RESPONDE EN JSON PURO (SIN MARKDOWN, SIN BLOQUES DE CÓDIGO):
{
  "summary": "Resumen ejecutivo en 1-2 frases",
  "overall_status": "excellent" | "good" | "attention_needed" | "critical",
  "items": [
    {
      "category": "critical" | "preventive" | "educational",
      "type": "oil_change" | "timing_belt" | "brakes" | "tires" | "other",
      "title": "Título corto y claro",
      "description": "Explicación simple de POR QUÉ es importante",
      "urgency": "now" | "2_weeks" | "1_month" | "3_months",
      "estimated_cost": 80,
      "failure_cost": 1500,
      "km_remaining": 2000,
      "reason": "Explicación técnica pero accesible",
      "benefit": "Qué gana el usuario al hacerlo",
      "risk": "Qué pasa si NO lo hace",
      "cta": "Texto del botón de acción"
    }
  ],
  "educational_content": {
    "title": "Título educativo",
    "message": "Mensaje persuasivo pero útil",
    "tips": ["Tip 1", "Tip 2", "Tip 3"]
  },
  "maintenance_roadmap": [
    {
      "km": 80000,
      "description": "Qué hacer en ese kilometraje",
      "priority": "high" | "medium" | "low"
    }
  ]
}

IMPORTANTE: Responde SOLO el JSON, sin texto adicional, sin markdown, sin bloques de código.
`;

    // Llamar a Gemini
    const response = await callGeminiAPI(prompt, '', null);
    
    console.log('📥 Respuesta de Gemini:', response.substring(0, 200));

    // Intentar parsear JSON
    let analysis;
    try {
      analysis = JSON.parse(response);
      console.log('✅ Análisis completado:', analysis.summary);
      console.log('📊 Items encontrados:', analysis.items?.length || 0);
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError);
      console.log('🔄 Intentando limpiar respuesta...');
      
      // Intentar extraer JSON de la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON extraído exitosamente');
      } else {
        throw new Error('No se pudo extraer JSON de la respuesta');
      }
    }
    
    return analysis;

  } catch (error) {
    console.error('❌ Error en análisis con IA:', error);
    
    // Fallback: análisis básico sin IA
    console.log('🔄 Usando análisis básico de respaldo...');
    return generateBasicAnalysis(vehicleContext);
  }
};

/**
 * Genera un análisis básico si falla la IA
 */
const generateBasicAnalysis = (context) => {
  const items = [];
  const currentKm = context.currentKm || 0;
  const lastOilChange = context.lastOilChange || 0;
  const kmSinceOil = currentKm - lastOilChange;

  console.log('🔧 Generando análisis básico:', {
    currentKm,
    lastOilChange,
    kmSinceOil
  });

  // 1. CRÍTICO: Cambio de aceite vencido
  if (kmSinceOil > 5000) {
    items.push({
      category: 'critical',
      type: 'oil_change',
      title: '🔴 Cambio de Aceite Vencido',
      description: `Has recorrido ${kmSinceOil.toLocaleString('es-CL')} km desde el último cambio. El aceite viejo daña el motor.`,
      urgency: 'now',
      estimated_cost: 80,
      failure_cost: 1500,
      reason: 'El aceite pierde propiedades después de 5,000 km, causando desgaste prematuro del motor.',
      benefit: 'Protege el motor y mantiene potencia óptima',
      risk: 'Desgaste acelerado del motor, posible falla y reparación costosa',
      cta: 'Agendar AHORA',
      action_url: '/requests/ServiceRequest'
    });
  }

  // 2. PREVENTIVO: Cambio de aceite próximo
  else if (kmSinceOil > 4000 && kmSinceOil <= 5000) {
    const kmRestantes = 5000 - kmSinceOil;
    items.push({
      category: 'preventive',
      type: 'oil_change',
      title: '🟡 Cambio de Aceite Próximo',
      description: 'Se acerca el momento del cambio de aceite programado.',
      urgency: '2_weeks',
      estimated_cost: 80,
      km_remaining: kmRestantes,
      benefit: 'Mantén tu motor protegido y en óptimas condiciones',
      cta: 'Agendar',
      action_url: '/requests/ServiceRequest'
    });
  }

  // 3. CRÍTICO/PREVENTIVO: Correa de distribución (75k-100k km)
  if (currentKm >= 75000 && currentKm < 100000) {
    const kmParaCorrea = 80000 - currentKm;
    const esCritico = currentKm >= 80000;
    
    items.push({
      category: esCritico ? 'critical' : 'preventive',
      type: 'timing_belt',
      title: esCritico 
        ? '🔴 Correa de Distribución en Zona CRÍTICA' 
        : '🟡 Correa de Distribución Próxima',
      description: esCritico
        ? 'Has superado los 80,000 km. La correa puede romperse en cualquier momento.'
        : `Te acercas a los 80,000 km (faltan ${Math.abs(kmParaCorrea).toLocaleString('es-CL')} km). Es momento de programar el cambio.`,
      urgency: esCritico ? 'now' : '1_month',
      estimated_cost: 250,
      failure_cost: 2500,
      km_remaining: Math.max(0, kmParaCorrea),
      reason: 'La correa sincroniza el motor. Si se rompe, pistones y válvulas chocan.',
      benefit: 'Prevenir daño catastrófico del motor',
      risk: 'Motor destruido, reparación de $2,000-$4,000',
      cta: esCritico ? 'URGENTE: Agendar Ya' : 'Programar Cambio',
      action_url: '/requests/ServiceRequest'
    });
  }

  // 4. EDUCATIONAL: Si todo está OK
  if (items.length === 0) {
    items.push({
      category: 'educational',
      type: 'general',
      title: '✅ Tu vehículo está en buen estado',
      description: 'No detectamos mantenimientos urgentes. Sigue cuidando tu vehículo.',
      urgency: '3_months',
      benefit: 'Mantén este buen estado con revisiones periódicas',
      cta: 'Ver Recomendaciones',
      action_url: '/health'
    });
  }

  const overallStatus = items.some(i => i.category === 'critical') 
    ? 'critical' 
    : items.some(i => i.category === 'preventive') 
      ? 'attention_needed' 
      : 'good';

  return {
    summary: items.length === 0 
      ? 'Tu vehículo está en excelente estado. Sigue así.' 
      : `Se detectaron ${items.length} item(s) que requieren atención.`,
    overall_status: overallStatus,
    items,
    educational_content: {
      title: 'Mantén tu vehículo en óptimas condiciones',
      message: 'El mantenimiento preventivo es la clave para evitar reparaciones costosas.',
      tips: [
        'Revisa el nivel de aceite cada 2 semanas',
        'Verifica la presión de neumáticos mensualmente',
        'Mantén un registro digital de todos los servicios'
      ]
    },
    maintenance_roadmap: [
      { km: currentKm + 5000, description: 'Cambio de aceite', priority: 'high' },
      { km: currentKm + 10000, description: 'Revisión general', priority: 'medium' },
      { km: 80000, description: 'Correa de distribución', priority: 'high' }
    ].filter(item => item.km > currentKm)
  };
};

export default { buildVehicleContext, analyzeVehicleWithAI };