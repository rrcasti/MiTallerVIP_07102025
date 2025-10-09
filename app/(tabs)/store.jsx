import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useMembership } from '../../context/MembershipContext';
import { useVehicles } from '../../context/VehicleContext';
import { getActiveProducts, getRecommendedProducts } from '../../services/productService';
import { Crown, Lock, ShoppingBag, Car, Star, Search, Sparkles } from 'lucide-react-native';

const PALETTE = {
  background: '#1A202C',
  cardBackground: '#2D3748',
  accent: '#F7B500',
  textPrimary: '#EDF2F7',
  textSecondary: '#A0AEC0',
  highlight: '#4A5568',
};

const filterCategories = [
  { id: 'recommended', title: 'Para tu auto' },
  { id: 'all', title: 'Todos' },
  { id: 'cuidado_estetico', title: 'Cuidado y Estética' },
  { id: 'rendimiento', title: 'Rendimiento' },
  { id: 'accesorios', title: 'Accesorios' },
];

// --- Componente para Acceso Denegado ---
const AccessDenied = () => {
  const router = useRouter();
  return (
    <View style={styles.centered}>
      <Lock color={PALETTE.accent} size={48} />
      <Text style={styles.deniedTitle}>Tienda Exclusiva VIP</Text>
      <Text style={styles.deniedSubtitle}>Esta sección es un beneficio exclusivo para miembros del Club VIP.</Text>
      <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/memberships')}>
        <Crown color={PALETTE.background} size={18} style={{ marginRight: 8 }} />
        <Text style={styles.ctaButtonText}>Hazte Miembro VIP Ahora</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Componente para Tarjeta de Producto ---
const ProductCard = ({ product }) => {
  const regularPrice = product.price || 0;
  const vipPrice = product.vip_price || regularPrice;
  const hasDiscount = vipPrice < regularPrice;
  const discount = hasDiscount ? Math.round(((regularPrice - vipPrice) / regularPrice) * 100) : 0;
  return (
    <View style={styles.productCard}>
      <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
      {hasDiscount && (<View style={styles.discountBadge}><Text style={styles.discountText}>-{discount}% VIP</Text></View>)}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        {product.description && <Text style={styles.productDescription}>{product.description}</Text>}
        <View style={styles.priceContainer}>
          {hasDiscount && <Text style={styles.productPriceStriked}>${regularPrice.toLocaleString('es-AR')}</Text>}
          <Text style={styles.productPrice}>${vipPrice.toLocaleString('es-AR')}</Text>
        </View>
        <TouchableOpacity style={styles.addButton}><ShoppingBag color={PALETTE.background} size={16} /><Text style={styles.addButtonText}>Agregar</Text></TouchableOpacity>
      </View>
    </View>
  );
};

// --- Componente para Registrar Vehículo ---
const RegisterVehiclePrompt = () => {
  const router = useRouter();
  return (
    <View style={styles.promptCard}>
        <Car size={32} color={PALETTE.accent} />
        <Text style={styles.promptTitle}>Recomendaciones para tu auto</Text>
        <Text style={styles.promptSubtitle}>Registra tu vehículo para ver productos seleccionados especialmente para ti.</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)/vehicles')}><Text style={styles.ctaButtonText}>Registrar mi Vehículo</Text></TouchableOpacity>
    </View>
  );
};

// --- Componente para Banner de Bienvenida ---
const WelcomeBanner = ({ vehicle }) => (
    <View style={styles.welcomeBanner}>
        <Sparkles size={24} color={PALETTE.accent} />
        <View style={{flex: 1, marginLeft: 16}}>
            <Text style={styles.promptTitle}>Recomendaciones Personalizadas</Text>
            <Text style={styles.promptSubtitle}>
                ¡Bienvenido! Hemos seleccionado los mejores productos para tu {vehicle.brand} {vehicle.model}.
            </Text>
        </View>
    </View>
);

// --- Componente Principal de la Página ---
export default function VipStoreScreen() {
  const router = useRouter();
  const { membership, isLoading: isMembershipLoading } = useMembership();
  const { vehicles, loading: areVehiclesLoading } = useVehicles();
  
  const [allProducts, setAllProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('recommended');
  const [searchTerm, setSearchTerm] = useState('');

  const primaryVehicle = vehicles.length > 0 ? vehicles[0] : null;

  useEffect(() => {
    if (membership) {
      const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
          const fetchedProducts = await getActiveProducts();
          setAllProducts(fetchedProducts);
          if (primaryVehicle) {
            const recommendations = getRecommendedProducts(primaryVehicle, fetchedProducts);
            setRecommendedProducts(recommendations);
          } else {
            setSelectedCategory('all');
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchProducts();
    }
  }, [membership, primaryVehicle]);
  
  const filteredProducts = useMemo(() => {
    let productsToFilter = [];
    if (selectedCategory === 'all') {
      productsToFilter = allProducts;
    } else if (selectedCategory === 'recommended') {
      productsToFilter = recommendedProducts;
    } else {
      productsToFilter = allProducts.filter(p => p.category === selectedCategory);
    }
    if (searchTerm.trim() === '') {
      return productsToFilter;
    }
    return productsToFilter.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [selectedCategory, searchTerm, allProducts, recommendedProducts]);

  if (isMembershipLoading || areVehiclesLoading) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.centered}><ActivityIndicator size="large" color={PALETTE.accent} /></View></SafeAreaView>;
  }

  if (!membership) {
    return <SafeAreaView style={styles.safeArea}><AccessDenied /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.mainTitle}>Tienda VIP</Text>
        
        {primaryVehicle ? (
          <WelcomeBanner vehicle={primaryVehicle} />
        ) : (
          <Text style={styles.subtitle}>Productos exclusivos y precios especiales.</Text>
        )}

        <View style={styles.searchContainer}>
            <Search color={PALETTE.textSecondary} size={20} />
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar productos exclusivos..."
                placeholderTextColor={PALETTE.textSecondary}
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
        </View>

        <View style={{ marginBottom: 32 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterCategories.map((cat) => {
              if (cat.id === 'recommended' && !primaryVehicle) return null;
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.filterButton, isActive && styles.filterButtonActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  {cat.id === 'recommended' && <Star size={14} color={isActive ? PALETTE.background : PALETTE.accent} style={{ marginRight: 8 }} />}
                  <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>{cat.title}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        
        {!primaryVehicle && <RegisterVehiclePrompt />}
        
        {isLoadingProducts ? (
          <ActivityIndicator color={PALETTE.accent} style={{ marginTop: 50 }} />
        ) : (
          <View>
            {filteredProducts.length > 0 ? filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            )) : (
              <Text style={styles.subtitle}>No se encontraron productos.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.background },
  container: { padding: 24, paddingBottom: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  deniedTitle: { fontSize: 24, fontWeight: 'bold', color: PALETTE.textPrimary, textAlign: 'center', marginTop: 16 },
  deniedSubtitle: { fontSize: 16, color: PALETTE.textSecondary, textAlign: 'center', marginVertical: 16, lineHeight: 24 },
  ctaButton: { flexDirection: 'row', backgroundColor: PALETTE.accent, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', marginTop: 20 },
  ctaButtonText: { color: PALETTE.background, fontWeight: 'bold', fontSize: 16 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: PALETTE.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: PALETTE.textSecondary, marginBottom: 32, lineHeight: 24, textAlign: 'center' },
  
  // CAMBIOS DE ESTILO AQUÍ
  productImage: { 
    width: '100%', 
    height: 220, // Antes 180
    backgroundColor: '#333' 
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 14, // Antes 16
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A5568',
    marginRight: 10, // Antes 12
  },
  
  // ESTILOS QUE SE MANTIENEN
  productCard: { backgroundColor: PALETTE.cardBackground, borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  discountBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#E53E3E', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  discountText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  productInfo: { padding: 16 },
  productName: { fontSize: 18, fontWeight: 'bold', color: PALETTE.textPrimary, marginBottom: 4 },
  productDescription: { fontSize: 14, color: PALETTE.textSecondary, marginBottom: 12, lineHeight: 20 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  productPriceStriked: { fontSize: 16, color: PALETTE.textSecondary, textDecorationLine: 'line-through', marginRight: 10 },
  productPrice: { fontSize: 22, fontWeight: 'bold', color: PALETTE.accent },
  addButton: { flexDirection: 'row', backgroundColor: PALETTE.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: PALETTE.background, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  promptCard: {
    backgroundColor: PALETTE.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: PALETTE.accent,
  },
  promptTitle: { fontSize: 18, fontWeight: 'bold', color: PALETTE.textPrimary, textAlign: 'center', marginTop: 8 },
  promptSubtitle: { fontSize: 15, color: PALETTE.textSecondary, textAlign: 'center', marginVertical: 8, lineHeight: 22 },
  filterButtonActive: {
    backgroundColor: PALETTE.accent,
    borderColor: PALETTE.accent,
  },
  filterButtonText: {
    color: PALETTE.textSecondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: PALETTE.background,
  },
  welcomeBanner: {
    backgroundColor: PALETTE.highlight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 12,
    color: PALETTE.textPrimary,
    fontSize: 16,
  },
});