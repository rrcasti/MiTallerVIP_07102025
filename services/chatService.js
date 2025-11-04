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
  writeBatch
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
      
      const user = auth.currentUser;
      let userName = 'Cliente';
      let userEmail = '';
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userName = userData.displayName || userData.full_name || user.displayName || 'Cliente';
            userEmail = userData.email || user.email || '';
        } else {
            userName = user.displayName || 'Cliente';
            userEmail = user.email || '';
        }
      }
      
      const newConvData = {
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        advisorId: null,
        createdAt: serverTimestamp(),
        lastMessage: 'Conversación iniciada.',
        lastMessageAt: serverTimestamp(),
        lastMessageSender: 'client',
        archivedByAdvisor: false,
        archivedByUser: false,
        unreadCountAdvisor: 0,
        unreadCountClient: 0,
        typingAdvisor: false,
        typingClient: false,
        isDeleted: false,
      };

      const newConvRef = await addDoc(conversationsRef, newConvData);

      console.log(`[chatService]: Nueva conversación creada con ID: ${newConvRef.id}`);
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
  
  const q = query(
    messagesRef, 
    where('isDeleted', '==', false),
    orderBy('timestamp', 'desc') // <-- Mantenemos 'desc' como en tu archivo
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() 
    }));
    callback(messages); // <-- Mantenemos el callback
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

// ============================================================================
// FUNCIÓN 'sendMessage' (CORREGIDA)
// ============================================================================
/**
 * Envía un nuevo mensaje a una conversación.
 * Acepta un objeto messageData con { text, file }
 */
export const sendMessage = async (conversationId, messageData) => {
    const user = auth.currentUser;
    if (!user) {
        console.error("[chatService Error]: Intento de enviar mensaje sin usuario autenticado.");
        throw new Error("Usuario no autenticado.");
    }
    
    // Validar que hay algo que enviar
    const text = messageData.text ? messageData.text.trim() : '';
    const file = messageData.file; // El objeto { uri, type, ... } de ImagePicker
    if (!text && !file) {
        console.log("[chatService]: Intento de enviar mensaje vacío.");
        return; 
    }

    console.log(`[chatService]: Enviando mensaje a la conversación ${conversationId}...`);

    try {
        // Objeto base del mensaje
        let finalMessageData = {
            uid: user.uid,
            senderName: user.displayName || 'Cliente',
            text: text, // Texto (puede estar vacío si es solo archivo)
            timestamp: serverTimestamp(),
            isDeleted: false,
            readBy: [user.uid], // El emisor ya lo leyó
            
            // Campos de compatibilidad (basados en tu base de datos funcional)
            isRead: false,
            read: false,
            isReaded: false,
        };

        let lastMessageText = text;

        // Si hay un archivo adjunto, subirlo y actualizar messageData
        if (file) {
            console.log(`[chatService]: Adjuntando archivo... tipo: ${file.type}`);
            const fileType = file.type === 'video' ? 'video' : 'image';
            const fileExtension = file.uri.split('.').pop() || (fileType === 'video' ? 'mp4' : 'jpg');
            const remotePath = `chat_media/${conversationId}/${Date.now()}.${fileExtension}`;
            
            const downloadUrl = await uploadFileToStorage(file.uri, remotePath);
            
            finalMessageData.type = fileType;
            finalMessageData.fileUrl = downloadUrl; // <-- Usamos fileUrl (como en AdminChat)
            finalMessageData.fileName = file.fileName || `${fileType}.${fileExtension}`; // Usar nombre original si existe

            // Actualizar el texto del último mensaje
            lastMessageText = (fileType === 'image') ? '📷 Imagen' : '📹 Video';
            if (text) {
                finalMessageData.text = text; // Si hay texto Y archivo, se guarda el texto
            } else {
                finalMessageData.text = lastMessageText; // Si solo es archivo, el texto es '📷 Imagen'
            }

        } else {
            // Si no hay archivo, es solo texto
            finalMessageData.type = 'text';
        }

        // 1. Añadir el mensaje a la subcolección
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await addDoc(messagesRef, finalMessageData);

        // 2. Actualizar el documento principal de la conversación
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
            lastMessage: lastMessageText,
            lastMessageAt: serverTimestamp(),
            lastMessageSender: 'client', // <-- CAMBIADO A 'client' (tu estándar)
            unreadCountAdvisor: increment(1),
            typingClient: false, // Asegurarse de resetear el 'typing'
        });

        console.log(`[chatService]: Mensaje enviado con éxito.`);

    } catch (error) {
        console.error("[chatService Error]: No se pudo enviar el mensaje.", error);
        throw error;
    }
};
// ============================================================================
// FIN DE LA FUNCIÓN CORREGIDA
// ============================================================================


/**
 * Elimina un mensaje (soft delete).
 */
export const deleteMessage = async (conversationId, messageId) => {
    console.log(`[chatService]: Eliminando mensaje ${messageId}...`);
    try {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        await updateDoc(messageRef, { isDeleted: true });
        console.log(`[chatService]: Mensaje eliminado con éxito.`);
    } catch (error) {
        console.error("[chatService Error]: No se pudo eliminar el mensaje.", error);
        throw error;
    }
};

/**
 * Marca TODOS los mensajes no leídos del asesor como leídos por el cliente.
 */
export const markConversationAsReadByClient = async (conversationId, messages, currentUserId) => {
  console.log(`[chatService]: Intentando marcar mensajes como leídos en conversación ${conversationId}...`);
  
  if (!messages || messages.length === 0) {
    console.log(`[chatService]: No hay mensajes para marcar.`);
    return;
  }

  const unreadAdvisorMessages = messages.filter(msg => 
    msg.uid !== currentUserId && // No es mi mensaje
    (!msg.readBy || !msg.readBy.includes(currentUserId)) // Y no está en el array 'readBy'
  );

  if (unreadAdvisorMessages.length === 0) {
    // console.log(`[chatService]: No hay mensajes del asesor sin leer.`); // Log muy ruidoso
    return;
  }

  console.log(`[chatService]: Marcando ${unreadAdvisorMessages.length} mensajes como leídos...`);

  try {
    const batch = writeBatch(db);
    
    unreadAdvisorMessages.forEach(msg => {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
      const newReadBy = msg.readBy ? [...msg.readBy, currentUserId] : [currentUserId];
      // Estandarizamos todos los campos de "leído"
      batch.update(messageRef, { 
          readBy: newReadBy,
          isRead: true,
          read: true,
          isReaded: true
      });
    });

    const conversationRef = doc(db, 'conversations', conversationId);
    batch.update(conversationRef, { unreadCountClient: 0 }); // Resetea el contador del cliente

    await batch.commit();
    console.log(`[chatService]: ${unreadAdvisorMessages.length} mensajes marcados como leídos.`);
  } catch (error) {
    console.error("[chatService Error]: Falló al marcar mensajes como leídos.", error);
  }
};