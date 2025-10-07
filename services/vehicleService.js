// En /services/vehicleService.js

import { firestore, auth } from '../firebase/config'; // Asegúrate que la ruta a tu config.js sea correcta
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
/**
 * Obtiene todos los vehículos de un usuario específico.
 * @param {string} userId - El UID del usuario de Firebase Auth.
 * @returns {Promise<Array>} Una promesa que resuelve a un array de objetos de vehículos.
 */
export const getVehiclesForUser = async (userId) => {
  if (!userId) {
    console.error("Se requiere un ID de usuario para obtener los vehículos.");
    return [];
  }
  
  const vehiclesCol = collection(firestore, 'vehicles');
  const q = query(vehiclesCol, where("userId", "==", userId));
  
  try {
    const querySnapshot = await getDocs(q);
    const vehicles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return vehicles;
  } catch (error) {
    console.error("Error al obtener los vehículos:", error);
    return []; // Devuelve un array vacío en caso de error
  }
};

/**
 * Agrega un nuevo vehículo a la base de datos para el usuario actual.
 * @param {object} vehicleData - Un objeto con los datos del vehículo (make, model, year, etc.).
 * @returns {Promise<string|null>} El ID del nuevo documento o null si hay un error.
 */
export const addVehicle = async (vehicleData) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("No hay un usuario autenticado para agregar el vehículo.");
    return null;
  }

  try {
    const docRef = await addDoc(collection(firestore, 'vehicles'), {
      userId: user.uid, // Vinculamos el vehículo al usuario actual
      ...vehicleData,
      createdAt: serverTimestamp() // Agregamos la fecha de creación
    });
    console.log("Vehículo agregado con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar el vehículo:", error);
    return null;
  }
};

/**
 * Actualiza los datos de un vehículo existente.
 * @param {string} vehicleId - El ID del documento del vehículo a actualizar.
 * @param {object} updatedData - Un objeto con los campos a actualizar.
 * @returns {Promise<boolean>} True si la actualización fue exitosa, false en caso contrario.
 */
export const updateVehicle = async (vehicleId, updatedData) => {
  const vehicleRef = doc(firestore, 'vehicles', vehicleId);
  try {
    await updateDoc(vehicleRef, updatedData);
    console.log("Vehículo actualizado correctamente.");
    return true;
  } catch (error) {
    console.error("Error al actualizar el vehículo:", error);
    return false;
  }
};

/**
 * Elimina un vehículo de la base de datos.
 * @param {string} vehicleId - El ID del documento del vehículo a eliminar.
 * @returns {Promise<boolean>} True si la eliminación fue exitosa, false en caso contrario.
 */
export const deleteVehicle = async (vehicleId) => {
  const vehicleRef = doc(firestore, 'vehicles', vehicleId);
  try {
    await deleteDoc(vehicleRef);
    console.log("Vehículo eliminado correctamente.");
    return true;
  } catch (error) {
    console.error("Error al eliminar el vehículo:", error);
    return false;
  }
};

/**
 * Obtiene un vehículo específico por su ID.
 * @param {string} vehicleId - El ID del documento del vehículo.
 * @returns {Promise<object|null>} Un objeto con los datos del vehículo o null si no se encuentra.
 */
export const getVehicleById = async (vehicleId) => {
  if (!vehicleId) {
    console.error("Se requiere un ID de vehículo.");
    return null;
  }

  const vehicleRef = doc(firestore, 'vehicles', vehicleId);

  try {
    const docSnap = await getDoc(vehicleRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn("No se encontró ningún vehículo con el ID:", vehicleId);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener el vehículo por ID:", error);
    return null;
  }
};

/**
 * Obtiene un usuario específico por su ID.
 * @param {string} userId - El ID del documento del usuario.
 * @returns {Promise<object|null>} Un objeto con los datos del usuario o null si no se encuentra.
 */
export const getUserById = async (userId) => {
  if (!userId) {
    console.error("Se requiere un ID de usuario para obtener sus datos.");
    return null;
  }
  
  const userRef = doc(firestore, 'users', userId);
  
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.warn("No se encontró ningún usuario con el ID:", userId);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener el usuario por ID:", error);
    return null;
  }
};