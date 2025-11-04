// Ruta: app/documents/approval.jsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Importar Firestore
import { db } from '../../firebase/config'; // Asegúrate de que la ruta a tu config de Firebase sea correcta
import { TouchableOpacity } from 'react-native-gesture-handler';
import { FileText, CheckCircle, XCircle, Download, ArrowLeft } from 'lucide-react-native';
import { useInAppNotification } from '../../components/context/InAppNotificationContext'; // Asegúrate de que la ruta sea correcta

const DocumentApprovalScreen = () => {
  const router = useRouter();
  const { documentId, type } = useLocalSearchParams();
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { dismissActionRequiredNotification } = useInAppNotification();

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    } else {
      setLoading(false);
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDocumentData({ id: docSnap.id, ...docSnap.data() });
      } else {
        Alert.alert("Error", "Documento no encontrado.");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      Alert.alert("Error", "No se pudo cargar el documento.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (newStatus) => {
    if (!documentData || updating) return;

    setUpdating(true);
    try {
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, { status: newStatus });
      
      setDocumentData(prev => ({ ...prev, status: newStatus }));
      Alert.alert("Éxito", `Documento ${newStatus === 'aprobado' ? 'aprobado' : 'rechazado'} correctamente.`);
      
      // Descartar la notificación in-app (si fue de este tipo)
      if (notificationId) { // asumiendo que notificationId viene del contexto
         dismissActionRequiredNotification(notificationId);
      } else if (activeNotification?.data?.relatedId === documentId){
        dismissActionRequiredNotification(activeNotification.data?.notificationId);
      }

      router.back(); // Volver a la pantalla anterior
    } catch (error) {
      console.error(`Error al ${newStatus === 'aprobado' ? 'aprobar' : 'rechazar'} documento:`, error);
      Alert.alert("Error", `No se pudo ${newStatus === 'aprobado' ? 'aprobar' : 'rechazar'} el documento.`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = () => {
    if (documentData?.file_url) {
      Linking.openURL(documentData.file_url).catch(err => {
        console.error("Error al abrir URL:", err);
        Alert.alert("Error", "No se pudo abrir el archivo PDF.");
      });
    } else {
      Alert.alert("Información", "No hay URL de archivo PDF disponible.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#00d9ff" style={styles.loading} />
      </SafeAreaView>
    );
  }

  if (!documentData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen options={{ title: "Documento", headerBackTitleVisible: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar el documento o no existe.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const screenTitle = type === 'budget_approval' ? "Aprobar Presupuesto" : "Ver Factura";

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: screenTitle, headerBackTitleVisible: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.iconBackground}>
            <FileText size={40} color="#FFF" />
          </View>
          <Text style={styles.documentTitle}>{documentData.title}</Text>
          <Text style={styles.documentBody}>{documentData.description || "Sin descripción."}</Text>

          {documentData.amount && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Monto:</Text>
              <Text style={styles.infoValue}>${documentData.amount.toLocaleString()}</Text>
            </View>
          )}
          {documentData.status && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estado:</Text>
              <Text style={[styles.infoValue, { color: documentData.status === 'aprobado' ? '#10B981' : '#F59E0B' }]}>
                {documentData.status.toUpperCase()}
              </Text>
            </View>
          )}
          {documentData.created_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha:</Text>
              <Text style={styles.infoValue}>
                {new Date(documentData.created_date).toLocaleDateString('es-ES')}
              </Text>
            </View>
          )}

          {documentData.file_url && (
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownload} disabled={updating}>
              <Download size={20} color="#00d9ff" />
              <Text style={styles.downloadButtonText}>Ver/Descargar PDF</Text>
            </TouchableOpacity>
          )}

          {type === 'budget_approval' && documentData.status === 'pendiente' && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity onPress={() => handleAction('aprobado')} style={[styles.actionButton, styles.approveButton]} disabled={updating}>
                {updating ? <ActivityIndicator color="#FFF" /> : <CheckCircle size={20} color="#FFF" />}
                <Text style={styles.actionButtonText}>Aprobar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleAction('rechazado')} style={[styles.actionButton, styles.rejectButton]} disabled={updating}>
                {updating ? <ActivityIndicator color="#FFF" /> : <XCircle size={20} color="#FFF" />}
                <Text style={styles.actionButtonText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,217,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  documentBody: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 15,
  },
  infoValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a4f6d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 30,
    width: '100%',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: '#00d9ff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 30,
    width: '100%',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#00d9ff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
});

export default DocumentApprovalScreen;