// Ruta: services/membershipService.ts
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { membershipPlans } from '../constants/membershipPlans'; // Moveremos los datos aquí

// Función para obtener la membresía activa de un usuario
export const getUserActiveMembership = async (userId) => {
  const q = query(
    collection(db, 'memberships'),
    where('user_id', '==', userId),
    where('is_active', '==', true)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null; // No tiene membresía activa
  }
  // Aquí puedes agregar la validación de fecha si quieres
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

// Función para suscribirse a un nuevo plan
export const subscribeToPlan = async (planId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado.");

  const selectedPlan = membershipPlans.find(p => p.id === planId);
  if (!selectedPlan) throw new Error("Plan no encontrado.");

  // 1. Desactivar membresías viejas
  const q = query(collection(db, 'memberships'), where('user_id', '==', user.uid), where('is_active', '==', true));
  const existingMemberships = await getDocs(q);
  for (const docSnapshot of existingMemberships.docs) {
    await updateDoc(doc(db, 'membersships', docSnapshot.id), { is_active: false });
  }

  // 2. Crear nueva membresía
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(startDate.getFullYear() + 1);

  const newMembership = {
    user_id: user.uid,
    type: selectedPlan.id,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    discount_percentage: parseInt(selectedPlan.benefits[0]),
    benefits: selectedPlan.benefits,
    is_active: true,
  };

  await addDoc(collection(db, 'memberships'), newMembership);
  return newMembership;
};