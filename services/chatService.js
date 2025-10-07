// RUTA: services/chatService.js

import { db, auth, storage, } from '../firebase/config'; // Usamos tu archivo de config
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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Busca una conversación existente para el usuario actual o crea una nueva si no existe.
 * Esta función es el punto de entrada para iniciar el chat.
 * @param {string} userId - El UID del usuario autenticado.
 * @returns {Promise<object>} El objeto de la conversación con su ID.
 */
export const findOrCreateConversation = async (userId) => {
  console.log(`[chatService]: Buscando conversación para el usuario ${userId}...`);
  const conversationsRef = collection(db, 'conversations');
  // Buscamos una conversación activa que pertenezca al usuario
  const q = query(conversationsRef, where('userId', '==', userId), limit(1));
  
  try {
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      console.log(`[chatService]: Conversación encontrada con ID: ${doc.id}`);
      return { id: doc.id, ...doc.data() };
    } else {
      console.log(`[chatService]: No se encontró conversación, creando una nueva...`);
      const newConvRef = await addDoc(conversationsRef, {
        userId: userId,
        createdAt: serverTimestamp(),
        lastMessage: 'Conversación iniciada.',
        lastMessageAt: serverTimestamp(),
      });
      console.log(`[chatService]: Nueva conversación creada con ID: ${newConvRef.id}`);
      return { id: newConvRef.id, userId, createdAt: new Date() };
    }
  } catch (error) {
    console.error("[chatService Error]: No se pudo encontrar o crear la conversación.", error);
    // Es crucial lanzar el error para que la UI pueda reaccionar
    throw error;
  }
};

/**
 * Escucha en tiempo real los mensajes de una conversación, ordenados por fecha.
 * @param {string} conversationId - El ID de la conversación a escuchar.
 * @param {function} callback - Función que se ejecuta con la lista de mensajes cada vez que hay una actualización.
 * @returns {function} Una función para cancelar la suscripción y evitar fugas de memoria.
 */
export const listenToMessages = (conversationId, callback) => {
  console.log(`[chatService]: Suscribiendo a mensajes de la conversación ${conversationId}`);
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  // onSnapshot es la función clave de Firebase para la escucha en tiempo real.
  // Es mucho más eficiente que hacer polling (consultas repetidas).
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Convertimos el timestamp de Firebase a un objeto Date de JS para manejarlo fácilmente
        timestamp: doc.data().timestamp?.toDate() 
    }));
    console.log(`[chatService]: Recibidos ${messages.length} mensajes.`);
    callback(messages);
  }, (error) => {
    console.error("[chatService Error]: Falló la suscripción a mensajes.", error);
    // En un caso real, aquí podríamos implementar un sistema de reconexión.
  });

  return unsubscribe;
};

/**
 * Sube un archivo (imagen/video) a Firebase Storage.
 * @param {string} localUri - La URI local del archivo en el dispositivo.
 * @param {string} remotePath - La ruta donde se guardará en el Storage.
 * @returns {Promise<string>} La URL de descarga pública del archivo.
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
 * Envía un nuevo mensaje a una conversación, incluyendo la posibilidad de adjuntar un archivo.
 * @param {string} conversationId - El ID de la conversación.
 * @param {object} messageData - Los datos del mensaje ({ text, file }).
 */
export const sendMessage = async (conversationId, messageData) => {
    const user = auth.currentUser;
    if (!user) {
        console.error("[chatService Error]: Intento de enviar mensaje sin usuario autenticado.");
        throw new Error("Usuario no autenticado.");
    }
    console.log(`[chatService]: Enviando mensaje a la conversación ${conversationId}...`);

    try {
        let finalMessageData = {
            uid: user.uid,
            text: messageData.text || '',
            timestamp: serverTimestamp(),
            type: 'text', // Tipo por defecto
            read: false,
          };

        // Si hay un archivo adjunto, lo subimos y añadimos su info al mensaje
        if (messageData.file) {
            const file = messageData.file;
            const remotePath = `chat_media/${conversationId}/${Date.now()}_${file.fileName || 'file'}`;
            const downloadUrl = await uploadFileToStorage(file.uri, remotePath);
            
            finalMessageData.fileUrl = downloadUrl;
            finalMessageData.fileName = file.fileName;
            finalMessageData.type = file.type === 'video' ? 'video' : 'image'; // 'image' o 'video'
        }
        
        // Añadimos el mensaje a la sub-colección de mensajes
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await addDoc(messagesRef, finalMessageData);

        // Actualizamos el documento principal de la conversación con el último mensaje
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
            lastMessage: finalMessageData.text || (finalMessageData.type === 'image' ? '📷 Imagen' : '📹 Video'),
            lastMessageAt: serverTimestamp(),
        });
        console.log(`[chatService]: Mensaje enviado con éxito.`);

    } catch (error) {
        console.error("[chatService Error]: No se pudo enviar el mensaje.", error);
        throw error;
    }
};

/**
 * Elimina un mensaje específico de una conversación.
 * @param {string} conversationId - El ID de la conversación.
 * @param {string} messageId - El ID del mensaje a eliminar.
 */
export const deleteMessage = async (conversationId, messageId) => {
  console.log(`[chatService]: Eliminando mensaje ${messageId} de la conversación ${conversationId}`);
  try {
    const messageRef = doc(db, `conversations/${conversationId}/messages`, messageId);
    await deleteDoc(messageRef);
    console.log(`[chatService]: Mensaje eliminado con éxito.`);
  } catch (error) {
    console.error("[chatService Error]: No se pudo eliminar el mensaje.", error);
    throw error;
  }
};

// En tu archivo chatService.js, al final del archivo
/**
 * Marca un mensaje específico como leído.
 * @param {string} conversationId - El ID de la conversación.
 * @param {string} messageId - El ID del mensaje a marcar como leído.
 */
export const markMessageAsRead = async (conversationId, messageId) => {
  try {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      await updateDoc(messageRef, {
          read: true,
      });
      console.log(`[chatService]: Mensaje ${messageId} marcado como leído.`);
  } catch (error) {
      console.error("[chatService Error]: No se pudo marcar el mensaje como leído.", error);
      throw error;
  }
};