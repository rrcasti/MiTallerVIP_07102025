import { db } from "../firebase/config";
import { collection, addDoc } from "firebase/firestore";

// Función para agregar una nueva solicitud de servicio
export const addServiceRequest = async (serviceRequestData) => {
  try {
    const docRef = await addDoc(collection(db, "serviceRequests"), serviceRequestData);
    console.log("Service Request added with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding service request: ", e);
    throw e;
  }
};