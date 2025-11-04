// components/documents/DocumentCard.js

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking, 
  Share,
  Modal, // Importar Modal
  Image, // Importar Image para previsualizar
  ScrollView // Para la lista de adjuntos
} from 'react-native';
import { 
  FileText, 
  ExternalLink, 
  Car,
  Calendar,
  DollarSign,
  CheckCircle,
  Share2,
  Phone,
  Mail,
  MapPin,
  Globe,
  X, // Para cerrar el modal
  Download, // Para descargar/abrir otros archivos
  Image as ImageIcon, // Icono para imágenes
  Play, // Icono para videos
} from 'lucide-react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DocumentCard({ request }) { // Eliminamos 'type' porque no se usa
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false); // Estado para controlar el modal de adjuntos

  const vehicleInfo = request.vehicleInfo || {};
  const workOrderNumber = request.workOrderDetails?.workOrderNumber || 'N/A';
  const externalCRM = request.workOrderDetails?.externalCRMNumber;
  const createdDate = request.createdAt ? new Date(request.createdAt) : null;
  const totalCost = request.laborCost || 0;

  // Enlaces de documentos
  const externalCrmLink = request.workOrderDetails?.externalCrmLink; // URL a un sistema externo
  const attachedPhotos = request.photos || []; // Array de URLs de archivos adjuntos (fotos, PDFs, videos)

  const handleOpenExternalDocument = () => {
    if (externalCrmLink) {
      Linking.openURL(externalCrmLink).catch(err => {
        console.error('Error al abrir link externo:', err);
        alert('No se pudo abrir el enlace externo.');
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Orden de Trabajo #${workOrderNumber}\n${vehicleInfo.brand} ${vehicleInfo.model}\nTotal: $${totalCost.toLocaleString('es-AR')}\n\nElectromecánica Matías\nwww.electromecanicamatias.com.ar`,
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  const renderAttachmentItem = (url, index) => {
    const fileName = url.substring(url.lastIndexOf('/') + 1).split('?')[0].split('_').slice(1).join('_');
    const fileExtension = url.split('.').pop().toLowerCase().split('?')[0];
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';
    const isVideo = ['mp4', 'webm', 'ogg'].includes(fileExtension); // Asumiendo estos formatos
  
    const handleOpenAttachment = () => {
      Linking.openURL(url).catch(err => {
        console.error('Error al abrir adjunto:', err);
        alert('No se pudo abrir el archivo adjunto.');
      });
    };
  
    return (
      <TouchableOpacity key={index} style={styles.attachmentItem} onPress={handleOpenAttachment}>
        {isImage && <Image source={{ uri: url }} style={styles.attachmentImage} resizeMode="cover" />}
        {isPdf && (
          <View style={styles.attachmentFile}>
            <FileText size={32} color="#EF4444" />
            <Text style={styles.attachmentFileName} numberOfLines={1}>
              {fileName || `Documento ${index + 1}.pdf`}
            </Text>
          </View>
        )}
        {isVideo && (
          <View style={styles.attachmentFile}>
            <Play size={32} color="#3B82F6" />
            <Text style={styles.attachmentFileName} numberOfLines={1}>
              {fileName || `Video ${index + 1}`}
            </Text>
          </View>
        )}
        {!isImage && !isPdf && !isVideo && (
          <View style={styles.attachmentFile}>
            <Download size={32} color="#6B7280" />
            <Text style={styles.attachmentFileName} numberOfLines={1}>
              {fileName || `Archivo ${index + 1}`}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.card}>
      {/* ========================================
          CABECERA DE LA EMPRESA (TIPO FACTURA)
          ======================================== */}
      <View style={styles.companyHeader}>
        {/* Logo/Nombre de la empresa */}
        <View style={styles.companyLogoContainer}>
          <View style={styles.companyLogo}>
            <Text style={styles.companyLogoText}>EM</Text>
          </View>
          <View style={styles.companyNameContainer}>
            <Text style={styles.companyName}>Electromecánica Matías</Text>
            <Text style={styles.companyCUIT}>CUIT: 20-30369367-0</Text>
          </View>
        </View>

        {/* Información de contacto */}
        <View style={styles.companyInfoContainer}>
          <View style={styles.companyInfoRow}>
            <MapPin size={12} color="#64748B" />
            <Text style={styles.companyInfoText}>Biarritz 3224, José L. Suarez, Buenos Aires</Text>
          </View>
          <View style={styles.companyInfoRow}>
            <Phone size={12} color="#64748B" />
            <Text style={styles.companyInfoText}>+54 11 5178-2053</Text>
          </View>
          <View style={styles.companyInfoRow}>
            <Mail size={12} color="#64748B" />
            <Text style={styles.companyInfoText}>info@electromecanicamatias.com.ar</Text>
          </View>
          <View style={styles.companyInfoRow}>
            <Globe size={12} color="#64748B" />
            <Text style={styles.companyInfoText}>www.electromecanicamatias.com.ar</Text>
          </View>
        </View>

        {/* Línea divisoria dorada */}
        <View style={styles.dividerGold} />
      </View>

      {/* ========================================
          HEADER DEL DOCUMENTO
          ======================================== */}
      <View style={styles.documentHeader}>
        <View style={styles.documentHeaderLeft}>
          <View style={styles.iconContainer}>
            <FileText size={24} color="#FBBF24" />
          </View>
          <View>
            <Text style={styles.orderNumber}>Orden #{workOrderNumber}</Text>
            {externalCRM && (
              <Text style={styles.externalCRM}>CRM: {externalCRM}</Text>
            )}
          </View>
        </View>
        <View style={styles.statusBadge}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.statusText}>{request.status?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Línea divisoria */}
      <View style={styles.divider} />

      {/* ========================================
          INFORMACIÓN DEL VEHÍCULO
          ======================================== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VEHÍCULO</Text>
        <View style={styles.vehicleInfo}>
          <Car size={20} color="#94A3B8" />
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleModel}>
              {vehicleInfo.brand} {vehicleInfo.model} {vehicleInfo.year}
            </Text>
            {vehicleInfo.license_plate && (
              <Text style={styles.vehiclePlate}>Patente: {vehicleInfo.license_plate}</Text>
            )}
          </View>
        </View>
      </View>

      {/* ========================================
          FECHA DE EMISIÓN
          ======================================== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FECHA DE EMISIÓN</Text>
        <View style={styles.dateInfo}>
          <Calendar size={20} color="#94A3B8" />
          <Text style={styles.dateText}>
            {createdDate ? format(createdDate, "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha no disponible'}
          </Text>
        </View>
      </View>

      {/* ========================================
          DESCRIPCIÓN DEL SERVICIO
          ======================================== */}
      {request.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>SERVICIO REALIZADO:</Text>
          <Text style={styles.descriptionText}>{request.description}</Text>
        </View>
      )}

      {/* ========================================
          COSTO TOTAL
          ======================================== */}
      {totalCost > 0 && (
        <View style={styles.totalCostContainer}>
          <View style={styles.totalCostLeft}>
            <DollarSign size={20} color="#10B981" />
            <Text style={styles.totalCostTitle}>TOTAL:</Text>
          </View>
          <Text style={styles.totalCostValue}>
            ${totalCost.toLocaleString('es-AR')}
          </Text>
        </View>
      )}

      {/* ========================================
          BOTONES DE ACCIÓN
          ======================================== */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={16} color="#3B82F6" />
          <Text style={styles.shareButtonText}>Compartir</Text>
        </TouchableOpacity>

        {externalCrmLink && (
          <TouchableOpacity style={styles.documentButton} onPress={handleOpenExternalDocument}>
            <ExternalLink size={16} color="#1E293B" />
            <Text style={styles.documentButtonText}>Abrir Documento Externo</Text>
          </TouchableOpacity>
        )}
        
        {/* ✅ NUEVO BOTÓN: VER ARCHIVOS ADJUNTOS */}
        {attachedPhotos.length > 0 && (
          <TouchableOpacity style={styles.attachmentsButton} onPress={() => setShowAttachmentsModal(true)}>
            <ImageIcon size={16} color="#1E293B" />
            <Text style={styles.attachmentsButtonText}>Ver Archivos Adjuntos ({attachedPhotos.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ========================================
          MODAL DE ARCHIVOS ADJUNTOS
          ======================================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAttachmentsModal}
        onRequestClose={() => setShowAttachmentsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Archivos Adjuntos</Text>
              <TouchableOpacity onPress={() => setShowAttachmentsModal(false)} style={styles.modalCloseButton}>
                <X size={24} color="#E2E8F0" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.attachmentsList}>
              {attachedPhotos.map(renderAttachmentItem)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B', // Fondo oscuro de la tarjeta
    borderRadius: 12,
    marginVertical: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  companyHeader: {
    backgroundColor: '#1E293B', // Mismo fondo oscuro
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  companyLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  companyLogo: {
    width: 48,
    height: 48,
    backgroundColor: '#FBBF24', // Amarillo vibrante
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  companyLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  companyNameContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E8F0', // Texto claro
  },
  companyCUIT: {
    fontSize: 12,
    color: '#94A3B8', // Texto gris
  },
  companyInfoContainer: {
    marginTop: 10,
  },
  companyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyInfoText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 5,
  },
  dividerGold: {
    height: 2,
    backgroundColor: '#FBBF24', // Línea dorada para resaltar
    marginTop: 16,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#0F172A', // Fondo ligeramente más oscuro para el header del documento
  },
  documentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    padding: 8,
    backgroundColor: '#334155', // Fondo para el icono
    borderRadius: 8,
    marginRight: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  externalCRM: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A', // Verde para status
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 5,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetails: {
    marginLeft: 10,
  },
  vehicleModel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  vehiclePlate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#E2E8F0',
    marginLeft: 10,
  },
  descriptionContainer: {
    backgroundColor: '#0F172A', // Fondo más oscuro para la descripción
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  descriptionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FBBF24', // Amarillo para el título de descripción
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 13,
    color: '#E2E8F0',
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 179, 107, 0.15)', // Verde tenue
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 179, 107, 0.3)',
  },
  totalCostLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalCostTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981', // Verde brillante
    marginLeft: 8,
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Para que los botones se envuelvan si hay muchos
    justifyContent: 'center',
    padding: 16,
    gap: 10, // Espacio entre botones
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1, // Para que ocupen espacio equitativamente
    minWidth: 120, // Ancho mínimo para evitar que sean demasiado pequeños
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3B82F6', // Azul para compartir
    marginLeft: 8,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24', // Amarillo para el botón principal de documento
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1,
    minWidth: 120,
  },
  documentButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B', // Texto oscuro en botón amarillo
    marginLeft: 8,
  },
  attachmentsButton: { // Estilos para el nuevo botón "Ver Archivos Adjuntos"
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6', // Un color diferente, azul por ejemplo
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1,
    minWidth: 120,
  },
  attachmentsButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texto blanco
    marginLeft: 8,
  },

  // Estilos del Modal de Archivos Adjuntos
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    width: '90%',
    height: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  modalCloseButton: {
    padding: 5,
  },
  attachmentsList: {
    padding: 16,
  },
  attachmentItem: {
    marginBottom: 10,
    backgroundColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
    height: 120, // Altura fija para cada item
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  attachmentFile: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  attachmentFileName: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 5,
  }
});