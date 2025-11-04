import { collection, query, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * SERVICIO: Gestión de Actividad del Usuario
 * Carga notificaciones, documentos, mensajes y servicios activos
 * 
 * ESTRATEGIA: Cargar TODO y filtrar en memoria (evita índices de Firebase)
 */

/**
 * Carga todas las actividades del usuario
 */
export const loadUserActivity = async (userId, userEmail) => {
  try {
    console.log('📊 Cargando actividad del usuario:', userId);
    console.log('📧 Email del usuario:', userEmail);

    const [notifications, documents, serviceRequests] = await Promise.all([
      loadAllNotifications(),
      loadAllDocuments(),
      loadAllServiceRequests()
    ]);

    // Filtrar en memoria
    const activeNotifications = notifications.filter(n => !n.is_dismissed && n.user_id === userId);
    const userDocs = documents.filter(doc => doc.created_by === userEmail);
    const pendingDocs = userDocs.filter(doc => 
      doc.status === 'pendiente' || doc.status === 'esperando_aprobacion'
    );
    
    // 🔧 CORRECCIÓN: userId está dentro de customerInfo
    const userRequests = serviceRequests.filter(sr => sr.customerInfo?.userId === userId);

    console.log('📊 Items encontrados:', {
      notifications: activeNotifications.length,
      pendingDocs: pendingDocs.length,
      serviceRequests: userRequests.length
    });

    return {
      notifications: activeNotifications,
      pendingDocuments: pendingDocs,
      allDocuments: userDocs,
      serviceRequests: userRequests,
      totalPending: activeNotifications.length + pendingDocs.length + userRequests.filter(s => s.status === 'pendiente').length
    };

  } catch (error) {
    console.error('❌ Error cargando actividad:', error);
    return {
      notifications: [],
      pendingDocuments: [],
      allDocuments: [],
      serviceRequests: [],
      totalPending: 0
    };
  }
};

/**
 * 🆕 LISTENER EN TIEMPO REAL para Service Requests
 * Escucha cambios automáticamente y notifica al callback
 * 
 * @param {string} userId - ID del usuario
 * @param {function} callback - Función que se llama cuando hay cambios
 * @returns {function} - Función para cancelar el listener (unsubscribe)
 */
export const subscribeToServiceRequests = (userId, callback) => {
  try {
    console.log('🔴 [REAL-TIME] Iniciando listener para serviceRequests del usuario:', userId);

    const q = query(
      collection(db, 'serviceRequests'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    // onSnapshot escucha cambios en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('🔄 [REAL-TIME] Actualización recibida de serviceRequests');
        
        const allRequests = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // 🔧 CONVERTIR TIMESTAMPS A DATE
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            preferredDate: data.preferredDate?.toDate ? data.preferredDate.toDate() : data.preferredDate,
            cancelledAt: data.cancelledAt?.toDate ? data.cancelledAt.toDate() : data.cancelledAt,
          };
        });

        // Filtrar solo las del usuario actual
        const userRequests = allRequests.filter(sr => sr.customerInfo?.userId === userId);
        
        console.log(`✅ [REAL-TIME] ${userRequests.length} solicitudes encontradas para el usuario`);
        
        // Llamar al callback con los datos actualizados
        callback(userRequests);
      },
      (error) => {
        console.error('❌ [REAL-TIME] Error en listener:', error);
        callback([]); // En caso de error, devolver array vacío
      }
    );

    // Retornar función para cancelar el listener cuando ya no se necesite
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error iniciando listener:', error);
    return () => {}; // Retornar función vacía si falla
  }
};

/**
 * Carga TODAS las notificaciones (sin filtro)
 */
const loadAllNotifications = async () => {
  try {
    const q = query(
      collection(db, 'notifications'),
      orderBy('created_date', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error loading notifications:', error);
    return [];
  }
};

/**
 * Carga TODOS los documentos (sin filtro)
 */
const loadAllDocuments = async () => {
  try {
    const q = query(
      collection(db, 'documents'),
      orderBy('created_date', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error loading documents:', error);
    return [];
  }
};

/**
 * Carga TODAS las solicitudes de servicio (sin filtro)
 * 🔧 CORREGIDO: Convierte Timestamps a Date
 */
const loadAllServiceRequests = async () => {
  try {
    const q = query(
      collection(db, 'serviceRequests'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      
      // 🔧 CONVERTIR TIMESTAMPS A DATE
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        preferredDate: data.preferredDate?.toDate ? data.preferredDate.toDate() : data.preferredDate,
        cancelledAt: data.cancelledAt?.toDate ? data.cancelledAt.toDate() : data.cancelledAt,
      };
    });
  } catch (error) {
    console.error('❌ Error loading service requests:', error);
    return [];
  }
};