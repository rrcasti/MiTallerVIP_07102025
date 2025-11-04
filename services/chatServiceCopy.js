// RUTA: services/chatService.js
import { db, auth, storage, } from '../firebase/config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
  where,
  limit,
  updateDoc,
  increment, 
  getDoc,
  writeBatch // <-- ✅ AÑADIDO
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Busca una conversación existente para el usuario actual o crea una nueva si no existe.
 */
export const findOrCreateConversation = async (userId) => {
  console.log(`[chatService]: Buscando conversación para el usuario ${userId}...`);
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('userId', '==', userId), limit(1));
  
  try {
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      console.log(`[chatService]: Conversación encontrada con ID: ${doc.id}`);
      return { id: doc.id, ...doc.data() };
    } else {
      console.log(`[chatService]: No se encontró conversación, creando una nueva...`);
      
      // --- ✅ CORRECCIÓN: Obtener datos del usuario para la nueva conversación ---
      const user = auth.currentUser;
      let userName = 'Cliente';
      let userEmail = '';
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // Usamos la lógica de fallback para 'displayName' o 'full_name'
            userName = userData.displayName || userData.full_name || user.displayName || 'Cliente';
            userEmail = userData.email || user.email || '';
        } else {
            userName = user.displayName || 'Cliente';
            userEmail = user.email || '';
        }
      }
      
      // --- ✅ CORRECCIÓN: Crear la conversación con TODOS los campos que el admin espera ---
      const newConvData = {
        userId: userId,
        userName: userName, // <--- CAMPO AÑADIDO
        userEmail: userEmail, // <--- CAMPO AÑADIDO
        advisorId: null, // El admin se asignará al responder
        createdAt: serverTimestamp(),
        lastMessage: 'Conversación iniciada.',
        lastMessageAt: serverTimestamp(),
        lastMessageSender: 'client', // <--- CAMPO AÑADIDO
        archivedByAdvisor: false, // <--- CAMPO AÑADIDO
        archivedByUser: false, // <--- CAMPO AÑADIDO
        unreadCountAdvisor: 0, // <--- CAMPO AÑADIDO
        unreadCountClient: 0, // <--- CAMPO AÑADIDO
        typingAdvisor: false, // <--- CAMPO AÑADIDO
        typingClient: false, // <--- CAMPO AÑADIDO
        isDeleted: false, // <--- CAMPO AÑADIDO (para el filtro)
      };

      const newConvRef = await addDoc(conversationsRef, newConvData);
      // --- FIN CORRECCIÓN ---

      console.log(`[chatService]: Nueva conversación creada con ID: ${newConvRef.id}`);
      // Devolvemos los datos completos para que el estado 'conversation' los tenga
      return { id: newConvRef.id, ...newConvData, createdAt: new Date() }; 
    }
  } catch (error) {
    console.error("[chatService Error]: No se pudo encontrar o crear la conversación.", error);
    throw error;
  }
};

/**
 * Escucha en tiempo real los mensajes de una conversación.
 */
export const listenToMessages = (conversationId, callback) => {
  console.log(`[chatService]: Suscribiendo a mensajes de la conversación ${conversationId}`);
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  
  // ✅ CORRECCIÓN: Asegurarse que el filtro 'isDeleted' esté
  const q = query(
    messagesRef, 
    where('isDeleted', '==', false), // <-- Filtra mensajes borrados
    orderBy('timestamp', 'asc')
  );

  // ✅ CORRECCIÓN: Quitada la lógica de 'marcar como leído' de aquí
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() 
    }));
    // console.log(`[chatService]: Recibidos ${messages.length} mensajes.`); // Log muy ruidoso
    callback(messages);
  }, (error) => {
    console.error("[chatService Error]: Falló la suscripción a mensajes.", error);
  });

  return unsubscribe;
};

/**
 * Sube un archivo (imagen/video) a Firebase Storage.
 */
export const uploadFileToStorage = async (localUri, remotePath) => {
    console.log(`[chatService]: Subiendo archivo desde ${localUri} a ${remotePath}`);
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const storageRef = ref(storage, remotePath);

      console.log(`[chatService]: Uploading...`);
      await uploadBytes(storageRef, blob);

      const downloadUrl = await getDownloadURL(storageRef);
      console.log(`[chatService]: Archivo subido con éxito. URL: ${downloadUrl}`);
      return downloadUrl;
    } catch (error) {
      console.error("[chatService Error]: No se pudo subir el archivo.", error);
      throw error;
    }
};

/**
 * Envía un nuevo mensaje a una conversación.
 */
export const sendMessage = async (conversationId, messageData) => {
    const user = auth.currentUser;
    if (!user) {
        console.error("[chatService Error]: Intento de enviar mensaje sin usuario autenticado.");
        throw new Error("Usuario no autenticado.");
    }
    console.log(`[chatService]: Enviando mensaje a la conversación ${conversationId}...`);

    try {
        // --- ✅ CORRECCIÓN: Estandarizar el objeto del mensaje ---
        let finalMessageData = {
            uid: user.uid,
            senderName: user.displayName || 'Cliente', // <-- AÑADIDO
            text: messageData.text || '',
            timestamp: serverTimestamp(),
            type: 'text',
            isRead: false, // <-- Campo estándar
            isDeleted: false,
            // (Añadimos los otros campos que tu chat de prueba tiene para compatibilidad)
            read: false,
            isReaded: false,
        };
        // --- FIN CORRECCIÓN ---

        if (messageData.file) {
            const file = messageData.file;
            const remotePath = `chat_media/${conversationId}/${Date.now()}_${file.fileName || 'file'}`;
            const downloadUrl = await uploadFileToStorage(file.uri, remotePath);
            
            finalMessageData.fileUrl = downloadUrl;
            finalMessageData.fileName = file.fileName;
            finalMessageData.type = file.type === 'video' ? 'video' : 'image';
            // Sobreescribir el texto si es un archivo (el admin lo espera)
            finalMessageData.text = file.type === 'video' ? '📹 Video' : '📷 Imagen';
        }
        
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await addDoc(messagesRef, finalMessageData);

        // Actualizamos el documento principal de la conversación
        const conversationRef = doc(db, 'conversations', conversationId);
        // --- ✅ CORRECCIÓN: Actualizar el contador del Admin ---
        await updateDoc(conversationRef, {
            lastMessage: finalMessageData.text, // Usar el texto o '📷 Imagen'
            lastMessageAt: serverTimestamp(),
            lastMessageSender: user.uid, // <-- AÑADIDO
            unreadCountAdvisor: increment(1) // <-- AÑADIDO (¡El más importante!)
        });
        // --- FIN CORRECCIÓN ---
        console.log(`[chatService]: Mensaje enviado con éxito.`);

    } catch (error) {
        console.error("[chatService Error]: No se pudo enviar el mensaje.", error);
        throw error;
    }
};

/**
 * Elimina un mensaje específico de una conversación.
 */
export const deleteMessage = async (conversationId, messageId) => {
  console.log(`[chatService]: Eliminando mensaje ${messageId} de la conversación ${conversationId}`);
  try {
    const messageRef = doc(db, `conversations/${conversationId}/messages`, messageId);
    // --- ✅ CORRECCIÓN: Usar borrado lógico (soft delete) ---
    await updateDoc(messageRef, {
        isDeleted: true,
        text: "Mensaje eliminado" // Opcional
    });
    console.log(`[chatService]: Mensaje marcado como eliminado.`);
  } catch (error) {
    console.error("[chatService Error]: No se pudo eliminar el mensaje.", error);
    throw error;
  }
};

/**
 * Marca un mensaje específico como leído. (Función de ayuda)
 */
export const markMessageAsRead = async (conversationId, messageId) => {
  try {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      // --- ✅ CORRECCIÓN: Estandarizar a 'isRead' (y los otros por si acaso) ---
      await updateDoc(messageRef, {
          isRead: true,
          read: true,
          isReaded: true
      });
      console.log(`[chatService]: Mensaje ${messageId} marcado como leído.`);
  } catch (error) {
      console.error("[chatService Error]: No se pudo marcar el mensaje como leído.", error);
      throw error;
  }
};

// ============================================================================
// ✅ NUEVA FUNCIÓN ROBUSTA (Para marcar como leído)
// ============================================================================
/**
 * Marca todos los mensajes NO LEÍDOS DEL ADMIN como leídos
 * Y resetea el contador 'unreadCountClient' en la conversación.
 * Se llama cuando la pantalla del chat está en foco.
 */
export const markConversationAsReadByClient = async (conversationId, messages, currentUserId) => {
  if (!conversationId || !messages || !currentUserId) return;

  const batch = writeBatch(db);
  let hasUnreadMessages = false;

  // 1. Encontrar mensajes no leídos (que NO sean míos)
  const unreadMessages = messages.filter(msg => {
      if (msg.uid === currentUserId) return false; // Ignorar mis propios mensajes
      
      // Es no leído si CUALQUIERA de los campos de leído es falso
      const isUnread = (msg.isRead === false) || 
                       (msg.read === false) || 
                       (msg.isReaded === false);
      
      return isUnread;
  });

  if (unreadMessages.length > 0) {
    console.log(`[chatService]: Marcando ${unreadMessages.length} mensajes como leídos por el cliente...`);
    hasUnreadMessages = true;
    
    // 2. Añadir al batch la actualización de cada mensaje
    unreadMessages.forEach(msg => {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
      batch.update(msgRef, {
        isRead: true,
        read: true,
        isReaded: true // Estandarizar todo a 'true'
      });
    });
  }

  // 3. Verificar si el contador de la conversación (unreadCountClient) necesita resetearse
  // (Esto evita una escritura innecesaria si ya estaba en 0)
  try {
    // No podemos leer y escribir en el mismo batch si dependemos del valor
    const convDoc = await getDoc(doc(db, 'conversations', conversationId));
    if (convDoc.exists() && convDoc.data().unreadCountClient > 0) {
       console.log(`[chatService]: Reseteando unreadCountClient de ${convDoc.data().unreadCountClient} a 0.`);
       const convRef = doc(db, 'conversations', conversationId);
       batch.update(convRef, {
         unreadCountClient: 0 // Poner a 0 el contador del cliente
       });
       hasUnreadMessages = true; // Asegurarse de que el batch se ejecute
    }
  } catch (e) {
    console.error("[chatService]: Error al verificar unreadCountClient", e);
  }

  // 4. Ejecutar todas las escrituras solo si hay algo que actualizar
  if (hasUnreadMessages) {
    try {
      await batch.commit();
      console.log("[chatService]: Batch de 'leídos' y 'contador' completado.");
    } catch (e) {
      console.error("[chatService]: Error al ejecutar batch de 'leídos'", e);
    }
  } else {
    // console.log("[chatService]: No hay mensajes nuevos que marcar como leídos.");
  }
};