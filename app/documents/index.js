// app/documents/index.js

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  StyleSheet,
  Linking // Necesario para abrir enlaces de teléfono/email
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config'; // ¡ASEGÚRATE DE QUE ESTA RUTA ES CORRECTA!
import { useAuth } from '../../context/AuthContext'; // ¡ASEGÚRATE DE QUE ESTA RUTA ES CORRECTA!
import { 
  FileText, 
  ExternalLink, 
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Importa el componente de la tarjeta (lo definiremos en el Paso 2)
import DocumentCard from '../../components/documents/DocumentCard'; 

export default function DocumentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('historial');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      loadDocuments();
    } else {
      setLoading(false);
      setError('Usuario no autenticado. Por favor, inicia sesión.');
      console.error('DocumentsScreen: Usuario no autenticado.');
    }
  }, [user?.uid]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📄 DocumentsScreen: Cargando documentos para el usuario:', user.uid);
      
      let q = query(
        collection(db, 'serviceRequests'),
        where('userId', '==', user.uid), // Intenta con 'userId' primero
        orderBy('createdAt', 'desc')
      );
      
      let querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('📄 DocumentsScreen: No se encontraron documentos con userId, intentando con user_id...');
        q = query(
          collection(db, 'serviceRequests'),
          where('user_id', '==', user.uid), // Si no, intenta con 'user_id'
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      }
      
      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convertir Timestamps de Firebase a objetos Date de JavaScript si es necesario
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        };
      });
      
      setServiceRequests(docs);
      console.log(`✅ DocumentsScreen: ${docs.length} documentos de servicio cargados.`);
    } catch (e) {
      console.error('❌ DocumentsScreen: Error al cargar documentos:', e);
      setError('Error al cargar tus documentos. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const historialDocs = serviceRequests.filter(req => 
    ['finalizado', 'entregado', 'completado'].includes(req.status?.toLowerCase())
  );

  const externosDocs = serviceRequests.filter(req => 
    req.workOrderDetails?.externalCrmLink && req.workOrderDetails.externalCrmLink !== ''
  );

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };


  // --- Renderizado de Estados ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FBBF24" />
          <Text style={styles.loadingText}>Cargando tus documentos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadDocuments} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ========================================
          CABECERA PROFESIONAL DE LA EMPRESA
          ======================================== */}
      <View style={styles.companyHeader}>
        <View style={styles.companyLogoContainer}>
          <View style={styles.companyLogo}>
            <Text style={styles.companyLogoText}>EM</Text>
          </View>
          <View style={styles.companyNameContainer}>
            <Text style={styles.companyName}>Electromecánica Matías</Text>
            <Text style={styles.companyCUIT}>CUIT: 20-30369367-0</Text>
          </View>
        </View>

        <View style={styles.companyInfoContainer}>
          <View style={styles.companyInfoRow}>
            <MapPin size={12} color="#94A3B8" />
            <Text style={styles.companyInfoText}>Biarritz 3224, José L. Suarez, Buenos Aires</Text>
          </View>
          <TouchableOpacity onPress={() => handleOpenLink('tel:+541151782053')} style={styles.companyInfoRow}>
            <Phone size={12} color="#94A3B8" />
            <Text style={styles.companyInfoText}>+54 11 5178-2053</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenLink('mailto:info@electromecanicamatias.com.ar')} style={styles.companyInfoRow}>
            <Mail size={12} color="#94A3B8" />
            <Text style={styles.companyInfoText}>info@electromecanicamatias.com.ar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenLink('https://www.electromecanicamatias.com.ar')} style={styles.companyInfoRow}>
            <Globe size={12} color="#94A3B8" />
            <Text style={styles.companyInfoText}>www.electromecanicamatias.com.ar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerGold} />
      </View>


      {/* Header con botón de volver */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#E2E8F0" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mis Documentos</Text>
          <Text style={styles.headerSubtitle}>
            Historial de servicios y enlaces externos
          </Text>
        </View>
      </View>

      {/* Selector de Pestañas */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('historial')}
          style={[
            styles.tab,
            activeTab === 'historial' && styles.tabActive
          ]}
        >
          <FileText 
            size={20} 
            color={activeTab === 'historial' ? '#1E293B' : '#94A3B8'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'historial' && styles.tabTextActive
          ]}>
            Historial ({historialDocs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('externos')}
          style={[
            styles.tab,
            activeTab === 'externos' && styles.tabActive
          ]}
        >
          <ExternalLink 
            size={20} 
            color={activeTab === 'externos' ? '#1E293B' : '#94A3B8'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'externos' && styles.tabTextActive
          ]}>
            Externos ({externosDocs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido de las Pestañas */}
      <ScrollView 
  style={{ flex: 1, backgroundColor: '#0F172A' }}
  contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
>        {activeTab === 'historial' && (
          historialDocs.length > 0 ? (
            historialDocs.map((doc) => (
              <DocumentCard key={doc.id} request={doc} type="historial" />
            ))
          ) : (
            <View style={styles.emptyState}>
              <FileText size={64} color="#64748B" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                No tienes servicios finalizados en tu historial.
              </Text>
            </View>
          )
        )}

        {activeTab === 'externos' && (
          externosDocs.length > 0 ? (
            externosDocs.map((doc) => (
              <DocumentCard key={doc.id} request={doc} type="externo" />
            ))
          ) : (
            <View style={styles.emptyState}>
              <ExternalLink size={64} color="#64748B" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                No tienes documentos externos disponibles.
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ========================================
// ESTILOS (MOVIDOS AQUÍ PARA UN SOLO ARCHIVO)
// ========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Fondo oscuro principal
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  errorText: {
    color: '#EF4444', // Rojo vibrante
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB', // Azul
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // --- Estilos de la cabecera de la empresa ---
  companyHeader: {
    backgroundColor: '#0F172A', // Fondo muy oscuro para contraste
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#FBBF24', // Línea dorada
  },
  companyLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLogo: {
    width: 48,
    height: 48,
    backgroundColor: '#FBBF24', // Dorado
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B', // Texto oscuro sobre dorado
  },
  companyNameContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  companyCUIT: {
    fontSize: 12,
    color: '#94A3B8', // Gris azulado
  },
  companyInfoContainer: {
    marginTop: 8,
  },
  companyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  companyInfoText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 8,
  },
  dividerGold: {
    height: 2,
    backgroundColor: '#FBBF24',
    marginTop: 12,
  },

  // --- Estilos del Header principal (Mis Documentos) ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E293B', // Azul oscuro
    borderBottomWidth: 1,
    borderBottomColor: '#334155', // Línea de separación sutil
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2E8F0', // Blanco ligeramente azulado
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },

  // --- Estilos de las Pestañas ---
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#334155', // Gris oscuro para tabs inactivos
  },
  tabActive: {
    backgroundColor: '#FBBF24', // Dorado para tab activo
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94A3B8', // Gris azulado para texto inactivo
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#1E293B', // Azul oscuro para texto activo
  },

  // --- Contenido principal ---
  contentContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0F172A',
    paddingBottom: 300, 
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
});
