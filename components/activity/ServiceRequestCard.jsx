import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator, // ✅ Importado para el estado de carga
} from 'react-native';
import { 
  Calendar, 
  Clock, 
  Car, 
  Wrench, 
  X, // Para el botón de cancelar
  AlertCircle, // Para 'esperando_aprobacion' y 'desconocido'
  CheckCircle, // Para 'listo_retiro', 'entregado', 'finalizado', 'control_calidad'
  XCircle, // Para 'rechazada'
  // MessageCircle, // No usado en este statusConfig, pero lo dejamos si lo necesitas
  Hourglass, // Para 'en_proceso'
  FileText, // Para 'presupuesto_enviado'
  Truck, // Para 'listo_retiro', 'entregado'
  Hammer, // Para 'ingresado'
  Search, // Para 'en_diagnostico'
  Check, // ✅ Reemplazo para ClipboardCheck (o ClipboardCheckBig si existe en tu versión)
  Slash, // ✅ Reemplazo para Ban (es el ícono de prohibido)
  ThumbsUp, // Para 'aceptada'
  RotateCw, // Para 'revisando'
  CheckSquare, // Para 'completado'
  Package // Para 'esperando_repuestos'
} from 'lucide-react-native'; // Asegúrate de que todos estos existan en tu versión

import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * COMPONENTE: Tarjeta de Solicitud de Servicio
 * Muestra toda la información relevante y permite cancelar
 */
export default function ServiceRequestCard({ request, onUpdate }) {
  const [cancelling, setCancelling] = useState(false);

  // Status config UNIFICADO CON ORDER_STATES DEL GESTOR
  const statusConfig = {
    ingresado: {
      label: 'Ingresado',
      icon: Hammer, // Cambiado de Clock a Hammer, que es más representativo de "en taller"
      color: '#2196F3', // Azul fuerte (de text-blue-800)
      bg: '#E3F2FD20', // Azul claro con transparencia (de bg-blue-100)
      borderColor: '#90CAF9', // Un azul intermedio
    },
    en_diagnostico: {
      label: 'En Diagnóstico',
      icon: Search, // Según tu ORDER_STATES
      color: '#FFA000', // Naranja fuerte (de text-yellow-800)
      bg: '#FFF8E120', // Amarillo claro con transparencia (de bg-yellow-100)
      borderColor: '#FFD54F', // Un amarillo intermedio
    },
    esperando_aprobacion: {
      label: 'Esperando Aprobación',
      icon: AlertCircle, // Según tu ORDER_STATES
      color: '#8E24AA', // Púrpura fuerte (de text-purple-800)
      bg: '#F3E5F520', // Púrpura claro con transparencia (de bg-purple-100)
      borderColor: '#CE93D8', // Un púrpura intermedio
    },
    pendiente_respuesta: {
      label: 'Pendiente Respuesta',
      icon: Clock, // Según tu ORDER_STATES
      color: '#EF6C00', // Naranja fuerte (de text-orange-800)
      bg: '#FFF3E020', // Naranja claro con transparencia (de bg-orange-100)
      borderColor: '#FFCC80', // Un naranja intermedio
    },
    esperando_repuestos: {
      label: 'Esperando Repuestos',
      icon: Package, // Según tu ORDER_STATES
      color: '#D32F2F', // Rojo fuerte (de text-red-800)
      bg: '#FFEBEE20', // Rojo claro con transparencia (de bg-red-100)
      borderColor: '#EF9A9A', // Un rojo intermedio
    },
    en_proceso: {
      label: 'En Reparación', // Etiqueta ajustada para mayor claridad en app móvil
      icon: Wrench, // Según tu ORDER_STATES
      color: '#303F9F', // Índigo fuerte (de text-indigo-800)
      bg: '#E8EAF620', // Índigo claro con transparencia (de bg-indigo-100)
      borderColor: '#9FA8DA', // Un índigo intermedio
    },
    en_stand_by: {
      label: 'En Stand By',
      icon: Clock, // Según tu ORDER_STATES
      color: '#424242', // Gris fuerte (de text-gray-800)
      bg: '#F5F5F520', // Gris claro con transparencia (de bg-gray-100)
      borderColor: '#E0E0E0', // Un gris intermedio
    },
    control_calidad: {
      label: 'Control de Calidad',
      icon: CheckCircle, // Según tu ORDER_STATES
      color: '#00ACC1', // Cyan fuerte (de text-cyan-800)
      bg: '#E0F7FA20', // Cyan claro con transparencia (de bg-cyan-100)
      borderColor: '#80DEEA', // Un cyan intermedio
    },
    listo_retiro: {
      label: 'Listo para Retiro',
      icon: CheckCircle, // Según tu ORDER_STATES
      color: '#388E3C', // Verde fuerte (de text-green-800)
      bg: '#E8F5E920', // Verde claro con transparencia (de bg-green-100)
      borderColor: '#A5D6A7', // Un verde intermedio
    },
    entregado: {
      label: 'Entregado',
      icon: CheckCircle, // Según tu ORDER_STATES
      color: '#424242', // Gris fuerte (de text-slate-800)
      bg: '#EEEEEE20', // Gris claro con transparencia (de bg-slate-200)
      borderColor: '#BDBDBD', // Un gris intermedio
    },
    cancelado: {
      label: 'Cancelado',
      icon: Slash, // ✅ Usamos Slash para prohibido/cancelado
      color: '#424242', // Gris fuerte (de text-neutral-800)
      bg: '#F5F5F520', // Gris claro con transparencia (de bg-neutral-100)
      borderColor: '#E0E0E0', // Un gris intermedio
    },
    // Añadimos un estado por defecto si por alguna razón llega un status no reconocido
    desconocido: {
      label: 'Estado Desconocido',
      icon: AlertCircle, // Alerta para estados no mapeados
      color: '#757575', // Gris oscuro
      bg: '#E0E0E020',
      borderColor: '#BDBDBD',
    }
  };

  // Usar el estado "desconocido" si no se encuentra el status en el config
  const statusInfo = statusConfig[request.status] || statusConfig.desconocido;
  const StatusIcon = statusInfo.icon;

  /**
   * Cancelar solicitud
   */
  const handleCancel = () => {
    Alert.alert(
      '¿Cancelar solicitud?',
      'Esta acción no se puede deshacer. El taller será notificado.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          onPress: async () => {
            setCancelling(true);
            try {
              await updateDoc(doc(db, 'serviceRequests', request.id), {
                status: 'cancelado',
                cancelledAt: new Date(),
              });
              onUpdate(); // Notificar al padre para recargar datos
              Alert.alert('✅ Solicitud cancelada', 'Hemos notificado al taller.');
            } catch (error) {
              console.error('Error al cancelar solicitud:', error);
              Alert.alert('❌ Error', 'No se pudo cancelar la solicitud. Intenta de nuevo.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  // Función para obtener el nombre del servicio, si viene como array
  const getServiceName = (services) => {
    if (Array.isArray(services) && services.length > 0) {
      return services.join(', '); // Concatena si hay varios
    }
    return services || 'Servicio no especificado'; // Si no es array o vacío
  };

  return (
    <View style={[
      styles.card, 
      { borderColor: statusInfo.borderColor, backgroundColor: statusInfo.bg }
    ]}>
      {/* Botón de Cancelar */}
      {request.status !== 'cancelado' && request.status !== 'entregado' && request.status !== 'finalizado' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <X size={18} color="#fff" />
          )}
        </TouchableOpacity>
      )}

      {/* Badge de Estado */}
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
        <StatusIcon size={14} color="#fff" />
        <Text style={styles.statusText}>{statusInfo.label}</Text>
      </View>

      {/* Información del Vehículo */}
      <View style={styles.infoRow}>
        <Car size={16} color="#00d9ff" />
        <Text style={styles.infoText}>VEHÍCULO</Text>
      </View>
      <Text style={styles.vehicleName}>
        {request.vehicleInfo?.brand || 'N/A'} {request.vehicleInfo?.model || ''}
      </Text>
      <Text style={styles.licensePlate}>
        {request.vehicleInfo?.license_plate || 'Sin patente'}
      </Text>

      {/* Número de Orden (si existe) */}
      {request.workOrderDetails?.workOrderNumber && (
        <View style={styles.detailRow}>
          <Wrench size={16} color="#00d9ff" />
          <Text style={styles.detailLabel}>Nº de Orden:</Text>
          <Text style={styles.detailValue}>#{request.workOrderDetails.workOrderNumber}</Text>
        </View>
      )}

      {/* Nº CRM (si existe) */}
      {request.workOrderDetails?.externalCRMNumber && (
        <View style={styles.detailRow}>
          <FileText size={16} color="#00d9ff" />
          <Text style={styles.detailLabel}>Nº CRM:</Text>
          <Text style={styles.detailValue}>{request.workOrderDetails.externalCRMNumber}</Text>
        </View>
      )}

      {/* Servicios Solicitados */}
      <View style={styles.infoRow}>
        <Wrench size={16} color="#00d9ff" />
        <Text style={styles.infoText}>SERVICIOS SOLICITADOS</Text>
      </View>
      <Text style={styles.description}>
        {getServiceName(request.services)}
      </Text>

      {/* Descripción */}
      {request.description && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Descripción:</Text>
          <Text style={styles.detailValue}>{request.description}</Text>
        </View>
      )}

      {/* Fecha Preferida (si existe) */}
      {request.preferredDate && (
        <View style={styles.detailRow}>
          <Calendar size={16} color="#94a3b8" />
          <Text style={styles.detailLabel}>Fecha Preferida:</Text>
          <Text style={styles.detailValue}>
            {format(request.preferredDate, 'd MMM yyyy, HH:mm', { locale: es })}
          </Text>
        </View>
      )}

      {/* Solicitado el */}
      {request.createdAt && (
        <View style={styles.detailRow}>
          <Clock size={16} color="#94a3b8" />
          <Text style={styles.detailLabel}>Solicitado:</Text>
          <Text style={styles.detailValue}>
            {format(request.createdAt, 'd MMM yyyy, HH:mm', { locale: es })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B', // Fondo oscuro de la tarjeta
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 5, // Borde izquierdo para el color de estado
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ef4444', // Rojo
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
    alignSelf: 'flex-start', // Para que el badge no ocupe todo el ancho
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  infoText: {
    color: '#00d9ff', // Color de resalte
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  vehicleName: {
    color: '#E2E8F0', // Texto claro
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  licensePlate: {
    color: '#94a3b8', // Texto secundario
    fontSize: 14,
    marginBottom: 8,
  },
  description: {
    color: '#E2E8F0',
    fontSize: 16,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 13,
    marginRight: 8,
  },
  detailValue: {
    color: '#E2E8F0',
    fontSize: 14,
  },
});