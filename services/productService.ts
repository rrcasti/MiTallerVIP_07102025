// Ruta: services/productService.ts
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Esta función obtiene TODOS los productos activos (sin filtro)
export const getActiveProducts = async () => {
  try {
    const q = query(collection(db, 'products'), where('is_active', '==', true));
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("No se pudieron cargar los productos.");
  }
};

/**
 * FUNCIÓN: getRecommendedProducts
 * Propósito: Filtrar y ordenar productos por relevancia para un vehículo.
 */
export const getRecommendedProducts = (vehicle, allProducts) => {
  if (!vehicle) return allProducts;

  const vehicleFullName = `${vehicle.brand} ${vehicle.model}`.toLowerCase();
  
  // Nivel 1: Coincidencia Exacta
  const exactMatches = allProducts.filter(p => 
    p.compatible_vehicles?.some(v => v.toLowerCase() === vehicleFullName)
  );
  exactMatches.forEach(p => p.recommendation_level = 'exact');

  // Nivel 2: Coincidencia por Marca
  const brandMatches = allProducts.filter(p => 
    !exactMatches.includes(p) &&
    (p.compatible_vehicles?.some(v => v.toLowerCase() === vehicle.brand.toLowerCase()) ||
     p.vehicle_requirements?.brands?.some(b => b.toLowerCase() === vehicle.brand.toLowerCase()))
  );
  brandMatches.forEach(p => p.recommendation_level = 'brand');

  // Nivel 4: Productos Generales (simplificado por ahora)
  const generalProducts = allProducts.filter(p => 
    !p.compatible_vehicles && !p.vehicle_requirements
  );
  generalProducts.forEach(p => p.recommendation_level = 'general');

  // Combinar y eliminar duplicados
  const recommended = [
    ...exactMatches,
    ...brandMatches,
    // Aquí iría el Nivel 3 (características) si lo necesitas
    ...generalProducts.filter(p => !exactMatches.includes(p) && !brandMatches.includes(p))
  ];
  
  return recommended;
};

// Placeholder para la función de IA
export const getAIRecommendations = async (vehicle, products) => {
  console.log("Llamando a la IA para enriquecer recomendaciones...");
  // En el futuro, aquí se conectaría con una API de IA
  return {
    welcome_message: `Análisis IA: Hemos encontrado los mejores productos para tu ${vehicle.brand} ${vehicle.model}.`
  };
};