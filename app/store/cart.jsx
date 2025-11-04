import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { startMercadoPagoCheckout } from '../../services/paymentService';
import { createOrder } from '../../services/orderService';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react-native';

const PALETTE = {
  background: '#1A202C',
  cardBackground: '#2D3748',
  accent: '#F7B500',
  textPrimary: '#EDF2F7',
  textSecondary: '#A0AEC0',
  highlight: '#4A5568',
};

const CartScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      Alert.alert("Inicio de Sesión Requerido", "Debes iniciar sesión para completar la compra.");
      return;
    }
    if (items.length === 0) return;

    setIsPaying(true);
    let paymentResult; // Definir fuera del try para usarla en el chequeo

    try {
      // 1. Iniciar el pago con MercadoPago
      // Asumimos que devuelve { status: 'approved' | 'rejected' | 'cancelled' | ..., transactionId: '...', message: '...' }
      // O puede devolver null/undefined si hay un error de red al iniciar.
      paymentResult = await startMercadoPagoCheckout(items, totalPrice);

      // --- 👇 NUEVA LÓGICA DE VALIDACIÓN DEL PAGO 👇 ---
      if (!paymentResult || paymentResult.status !== 'approved') {
        // El pago NO fue exitoso (cancelado, rechazado, o error al iniciar)
        console.log("Payment not approved or failed:", paymentResult); // Log para depuración
        Alert.alert(
          "Pago No Completado",
          paymentResult?.message || "El pago fue cancelado o no pudo ser procesado. Tu orden no fue creada."
        );
        setIsPaying(false); // Detener indicador de carga
        return; // Terminar la función aquí, no continuar a crear la orden
      }
      // --- FIN DE LA NUEVA LÓGICA ---

      // 2. Si llegamos aquí, el pago FUE aprobado. Procedemos a crear la orden.
      const newOrderData = {
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost,
        })),
        paymentDetails: {
          method: 'MercadoPago',
          transactionId: paymentResult.transactionId || 'N/A',
        },
      };

      await createOrder(newOrderData); // Llama a la función del orderService

      // 3. Vaciar el carrito y notificar éxito
      clearCart();
      Alert.alert(
        "¡Compra Exitosa!",
        "Tu pedido ha sido procesado correctamente.",
        [{ text: "OK", onPress: () => router.replace('/(tabs)/store') }]
      );

    } catch (error) {
      // Este catch ahora solo atrapará errores INESPERADOS
      // (ej: error de red al llamar a startMercadoPagoCheckout o error dentro de createOrder)
      console.error("Error inesperado en el proceso de pago/orden:", error);
      Alert.alert(
        "Error Inesperado",
        "Ocurrió un problema al procesar tu pago o registrar tu pedido. Por favor, contacta a soporte si el problema persiste."
      );
    } finally {
      // Asegurarse de detener el indicador de carga en cualquier caso
      setIsPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.mainTitle}>Mi Carrito</Text>
      {items.length === 0 ? (
        <View style={styles.centered}>
          <ShoppingBag color={PALETTE.textSecondary} size={64} />
          <Text style={styles.emptyText}>Tu carrito está vacío.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.goBackLink}>Volver a la tienda</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.container}>
            {items.map(item => (
              <View key={item.id} style={styles.itemCard}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${(item.price * item.quantity).toLocaleString('es-AR')}</Text>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.quantityButton}>
                      <Minus color={PALETTE.accent} size={20} />
                    </TouchableOpacity>
                    <Text style={styles.itemQuantity}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.quantityButton}>
                      <Plus color={PALETTE.accent} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.trashIcon}>
                  <Trash2 color={PALETTE.textSecondary} size={22} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total:</Text>
              <Text style={styles.totalPrice}>${totalPrice.toLocaleString('es-AR')}</Text>
            </View>
            <TouchableOpacity
              style={[styles.ctaButton, isPaying && styles.ctaButtonDisabled]}
              onPress={handlePayment}
              disabled={isPaying}
            >
              {isPaying ? (
                <ActivityIndicator color={PALETTE.background} size="small" />
              ) : (
                <Text style={styles.ctaButtonText}>Pagar con MercadoPago</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.background },
  container: { padding: 16, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: PALETTE.textPrimary, marginBottom: 16, paddingHorizontal: 16, paddingTop: 20 },
  emptyText: { fontSize: 16, color: PALETTE.textSecondary, marginTop: 16, textAlign: 'center' },
  goBackLink: { fontSize: 16, color: PALETTE.accent, marginTop: 24, fontWeight: '600' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: PALETTE.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: PALETTE.background,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalText: { fontSize: 16, color: PALETTE.textSecondary },
  totalPrice: { fontSize: 22, fontWeight: 'bold', color: PALETTE.textPrimary },
  ctaButton: { backgroundColor: PALETTE.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaButtonDisabled: { backgroundColor: PALETTE.highlight },
  ctaButtonText: { color: PALETTE.background, fontWeight: 'bold', fontSize: 16 },
  itemCard: {
    backgroundColor: PALETTE.cardBackground,
    borderRadius: 12,
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  itemImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: PALETTE.highlight },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '600', color: PALETTE.textPrimary, marginBottom: 4 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: PALETTE.accent, marginBottom: 8 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  quantityButton: { padding: 4 },
  itemQuantity: { color: PALETTE.textPrimary, fontSize: 16, fontWeight: '600', marginHorizontal: 12 },
  trashIcon: { paddingLeft: 12, paddingVertical: 8 },
});

export default CartScreen;