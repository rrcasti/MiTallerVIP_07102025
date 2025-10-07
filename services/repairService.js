// En /services/repairService.js

import { firestore, auth } from '../firebase/config.js'; // Asegúrate que la ruta sea correcta
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Obtiene todas las reparaciones de un usuario específico, separadas por activas y completadas.
 * @param {string} userId - El UID del usuario de Firebase Auth.
 * @returns {Promise<object>} Una promesa que resuelve a un objeto con { active: [], completed: [] }.
 */
export const getRepairsForUser = async (userId) => {
  if (!userId) {
    console.error("Se requiere un ID de usuario para obtener las reparaciones.");
    return { active: [], completed: [] };
  }

  const repairsCol = collection(firestore, 'repairs');
  // Hacemos una sola consulta y filtramos en la aplicación
  const q = query(repairsCol, where("userId", "==", userId));

  try {
    const querySnapshot = await getDocs(q);
    const allRepairs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtramos las reparaciones por estado
    const active = allRepairs.filter(repair => repair.status !== 'finalizado' && repair.status !== 'entregado');
    const completed = allRepairs.filter(repair => repair.status === 'finalizado' || repair.status === 'entregado');

    return { active, completed };
  } catch (error) {
    console.error("Error al obtener las reparaciones:", error);
    return { active: [], completed: [] };
  }
};