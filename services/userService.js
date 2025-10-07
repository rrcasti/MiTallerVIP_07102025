// RUTA: services/userService.js

import { firestore } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Guarda el Expo Push Token en el documento del usuario en Firestore.
 * @param {string} userId - El UID del usuario.
 * @param {string} token - El Expo Push Token.
 */
export const savePushToken = async (userId, token) => {
  if (!userId || !token) return;

  const userDocRef = doc(firestore, 'users', userId);
  try {
    // Actualizamos el documento del usuario con el nuevo campo pushToken
    await updateDoc(userDocRef, {
      pushToken: token,
    });
    console.log('Push Token guardado para el usuario:', userId);
  } catch (error) {
    console.error('Error al guardar el Push Token:', error);
  }
};