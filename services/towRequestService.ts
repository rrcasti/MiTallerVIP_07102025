// Ruta: services/towRequestService.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export const createTowRequest = async (requestData) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado.");

  try {
    const docRef = await addDoc(collection(db, 'towRequests'), {
      user_id: user.uid,
      vehicle_id: requestData.vehicle_id,
      location_lat: requestData.location.lat,
      location_lng: requestData.location.lng,
      address: requestData.location.address,
      description: requestData.description,
      phone_contact: requestData.phone_contact,
      status: 'solicitada', // Estado inicial
      created_date: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating tow request:", error);
    throw new Error("No se pudo enviar la solicitud de grúa.");
  }
};