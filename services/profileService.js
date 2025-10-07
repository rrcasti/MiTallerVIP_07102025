import { firestore } from '../firebase/config'; // Asegúrate de que esta ruta a tu instancia de Firestore sea correcta
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Colección central para los perfiles de usuario
const usersCollection = 'users';

/**
 * Obtiene el perfil de un usuario de Firestore.
 * Utiliza el UID del usuario como ID del documento para la colección 'users'.
 * @param {string} userId - El UID del usuario de Firebase Authentication.
 * @returns {Promise<object|null>} Los datos del perfil o null si no existe.
 */
export const getUserProfile = async (userId) => {
  if (!userId) return null;

  try {
    // Apunta al documento en /users/{userId}
    const userRef = doc(firestore, usersCollection, userId); 
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      // Retorna null si el perfil aún no ha sido creado
      return null; 
    }
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    return null;
  }
};

/**
 * Crea o actualiza el perfil de usuario en Firestore.
 * Esto asegura que el UID de Auth (el ID largo) sea el ID del documento.
 * @param {string} userId - El UID del usuario.
 * @param {object} profileData - Los datos del perfil a guardar.
 * @param {boolean} isNew - Indica si es un registro inicial.
 * @returns {Promise<boolean>} Éxito o fracaso.
 */
export const saveUserProfile = async (userId, profileData, isNew = false) => {
  if (!userId) {
    console.error("No se puede guardar: falta el ID de usuario.");
    return false;
  }

  // Apunta al documento específico /users/{userId}
  const userRef = doc(firestore, usersCollection, userId); 

  try {
    const dataToSave = {
      ...profileData,
      uid: userId, // Duplicamos el UID dentro del documento para consultas (Buena práctica en NoSQL)
    };

    if (isNew) {
      // Uso de setDoc para crear el documento usando el userId como su ID
      await setDoc(userRef, {
        ...dataToSave,
        createdAt: new Date(),
        isAdmin: false, 
      });
    } else {
      // Si ya existe, updateDoc actualiza los campos
      await updateDoc(userRef, dataToSave);
    }
    
    return true;
  } catch (error) {
    console.error("Error al guardar el perfil:", error);
    return false;
  }
};
