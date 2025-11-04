import { collection, addDoc, serverTimestamp, doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/config'; // Asegúrate que la ruta a tu config de Firebase sea correcta

// Función para generar un ID de orden legible (Ej: MTV-1001)
const generateOrderId = async () => {
  // Usaremos un contador simple en Firestore para este ejemplo
  // Puedes hacerlo más robusto si necesitas
  const counterRef = doc(db, 'app_counters', 'orderCounter');
  let nextOrderIdNum = 1001; // Valor inicial

  try {
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { currentNumber: nextOrderIdNum });
      } else {
        nextOrderIdNum = counterDoc.data().currentNumber + 1;
        transaction.update(counterRef, { currentNumber: nextOrderIdNum });
      }
    });
    return `MTV-${nextOrderIdNum}`;
  } catch (e) {
    console.error("Error generating order ID:", e);
    // Fallback simple si falla el contador
    return `MTV-${Date.now().toString().slice(-4)}`; 
  }
};

// Función para crear la orden en Firestore
export const createOrder = async (orderData) => {
  try {
    const orderId = await generateOrderId();

    // Calculamos los totales del backend para seguridad
    let totalAmount = 0;
    let totalCost = 0;
    orderData.items.forEach(item => {
      totalAmount += (item.price * item.quantity);
      totalCost += (item.cost * item.quantity);
    });
    const totalProfit = totalAmount - totalCost;

    const orderDoc = {
      ...orderData,
      orderId: orderId,
      status: 'paid', // La orden se crea *después* del pago exitoso
      totalAmount: totalAmount,
      totalCost: totalCost,
      totalProfit: totalProfit,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderDoc);
    console.log("Order created with ID: ", docRef.id);

    // Podrías añadir lógica aquí para reducir el stock de los productos
    // await updateProductStock(orderData.items); 

    return { id: docRef.id, ...orderDoc };
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("No se pudo registrar el pedido en el sistema.");
  }
};

// (Opcional) Función para actualizar el stock después de la venta
// const updateProductStock = async (items) => {
//   const batch = writeBatch(db);
//   items.forEach(item => {
//     const productRef = doc(db, 'products', item.productId);
//     batch.update(productRef, {
//       stock: increment(-item.quantity) // Necesitas importar 'increment' de firestore
//     });
//   });
//   await batch.commit();
// };