import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const addItem = (product, quantity = 1) => {
    if (!product.stock || product.stock <= 0) {
      Alert.alert("Producto Agotado", "Este producto no tiene stock disponible.");
      return;
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          Alert.alert("Stock Superado", `Solo puedes añadir ${product.stock} unidades de este producto.`);
          return prevItems.map(item =>
            item.id === product.id ? { ...item, quantity: product.stock } : item
          );
        }
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        const price = product.vip_price > 0 && product.vip_price < product.price ? product.vip_price : product.price;
        return [...prevItems, {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          quantity: quantity > product.stock ? product.stock : quantity,
          price: price,
          cost: product.cost,
          stock: product.stock
        }];
      }
    });
    Alert.alert("Producto Añadido", `${product.name} se añadió a tu carrito.`);
  };

  const removeItem = (productId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      return removeItem(productId);
    }
    setItems(prevItems => prevItems.map(item => {
      if (item.id !== productId) return item;
      if (newQuantity > item.stock) {
         Alert.alert("Stock Superado", `Solo hay ${item.stock} unidades disponibles.`);
         return { ...item, quantity: item.stock };
      }
      return { ...item, quantity: newQuantity };
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);