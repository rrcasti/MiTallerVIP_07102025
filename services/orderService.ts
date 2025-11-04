import { collection, addDoc, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/config';

const generateOrderId = async () => {
  const counterRef = doc(db, 'app_counters', 'orderCounter');
  let nextOrderIdNum = 1001;
  try {
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { currentNumber: nextOrderIdNum });
      } else {
        nextOrderIdNum = (counterDoc.data()?.currentNumber || 1000) + 1;
        transaction.update(counterRef, { currentNumber: nextOrderIdNum });
      }
    });
    return `MTV-${nextOrderIdNum}`;
  } catch (e) {
    console.error("Error generating order ID:", e);
    return `MTV-${Date.now().toString().slice(-5)}`;
  }
};

export const createOrder = async (orderData) => {
  try {
    const orderId = await generateOrderId();

    let totalAmount = 0;
    let totalCost = 0;
    orderData.items.forEach((item) => {
      totalAmount += (item.price * item.quantity);
      totalCost += (item.cost * item.quantity);
    });
    const totalProfit = totalAmount - totalCost;

    const orderDoc = {
      ...orderData, 
      orderId: orderId,
      status: 'paid',
      totalAmount: totalAmount,
      totalCost: totalCost,
      totalProfit: totalProfit,
      createdAt: serverTimestamp(),
    };

    if (!orderDoc.userId || !orderDoc.items || orderDoc.items.length === 0) {
      throw new Error("Datos de la orden incompletos.");
    }

    const docRef = await addDoc(collection(db, 'orders'), orderDoc);
    console.log("Order successfully created with Firestore ID: ", docRef.id, "and Order ID:", orderId);

    return { id: docRef.id, ...orderDoc };
  } catch (error) {
    console.error("Error creating order in Firestore:", error);
    throw new Error("No se pudo registrar tu pedido. Contacta a soporte.");
  }
};