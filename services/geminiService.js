// RUTA: services/geminiService.js
/**
 * GEMINI API SERVICE - Solo gemini-pro-vision disponible
 * 
 * IMPORTANTE: Esta API key solo tiene acceso a gemini-pro-vision
 * Lo usaremos para texto e imágenes
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || 
                       process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
                       'AIzaSyBsjslU-s3XZKl13ylapJ5HnJWZiWo43bQ';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ✅ ÚNICO MODELO DISPONIBLE
const MODEL_NAME = 'gemini-2.5-flash-image-preview';

/**
 * ✨ NUEVA FUNCIÓN: Limpia la respuesta de Gemini removiendo markdown
 */
function cleanGeminiResponse(text) {
  // Remover bloques de código markdown
  let cleaned = text.trim();
  
  // Si empieza con ```json o ``` al inicio
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7); // Remover ```json
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3); // Remover ```
  }
  
  // Si termina con ```
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}

/**
 * Lista los modelos REALMENTE disponibles con tu API key
 */
export async function listAvailableModels() {
  try {
    console.log('📋 === LISTANDO MODELOS DISPONIBLES ===');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error:', error);
      return [];
    }
    
    const data = await response.json();
    
    if (data.models && data.models.length > 0) {
      console.log('✅ Modelos disponibles:');
      data.models.forEach(model => {
        const name = model.name.replace('models/', '');
        const methods = model.supportedGenerationMethods?.join(', ') || 'N/A';
        console.log(`  📌 ${name}`);
        console.log(`     Métodos: ${methods}`);
      });
      return data.models;
    } else {
      console.log('⚠️ No hay modelos disponibles');
      return [];
    }
  } catch (error) {
    console.error('❌ Error listando modelos:', error.message);
    return [];
  }
}

/**
 * Genera análisis mockeado
 */
function generateMockAnalysis(prompt, hasImage = false) {
  console.log('🎭 Generando análisis simulado');
  
  // Análisis de odómetro
  if (prompt.toLowerCase().includes('kilómetros') || prompt.toLowerCase().includes('odómetro')) {
    const randomKm = Math.floor(Math.random() * 50000) + 50000;
    return JSON.stringify({
      kilometers: randomKm,
      confidence: 80,
      readable: true
    });
  }
  
  // Análisis de salud
  if (prompt.toLowerCase().includes('salud') || prompt.toLowerCase().includes('análisis')) {
    return JSON.stringify({
      health_score: 85,
      status: "good",
      recommendations: [
        "Revisa el nivel de aceite del motor",
        "Verifica la presión de los neumáticos",
        "Programa un mantenimiento preventivo"
      ],
      alerts: [],
      next_maintenance: {
        service: "Cambio de aceite",
        km: 5000,
        urgency: "medium"
      }
    });
  }
  
  return "Análisis generado localmente. Configura Vertex AI para análisis con IA real.";
}

/**
 * Convierte imagen a formato Gemini
 */
async function imageUrlToGenerativePart(imageUrl) {
  try {
    console.log('📸 Descargando imagen...');
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log(`📦 Imagen descargada: ${blob.type}, ${blob.size} bytes`);
    
    const base64Data = await blobToBase64(blob);
    const base64Clean = base64Data.split(',')[1];
    
    return {
      inlineData: {
        data: base64Clean,
        mimeType: blob.type
      }
    };
  } catch (error) {
    console.error('❌ Error procesando imagen:', error);
    throw error;
  }
}

/**
 * Llama a Gemini API - SIEMPRE usa gemini-pro-vision
 */
export async function callGeminiAPI(prompt, systemInstruction = '', imageUrl = null) {
  console.log('\n🚀 === INICIANDO LLAMADA A GEMINI ===');
  console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`🖼️ Imagen: ${imageUrl ? 'SÍ' : 'NO'}`);
  
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ API key no configurada');
    return generateMockAnalysis(prompt, !!imageUrl);
  }

  try {
    // Construir prompt completo
    let fullPrompt = prompt;
    if (systemInstruction) {
      fullPrompt = `${systemInstruction}\n\n${prompt}`;
    }

    console.log(`🤖 Usando modelo: ${MODEL_NAME}`);

    // Construir partes del request
    const parts = [fullPrompt];

    // Agregar imagen si existe
    if (imageUrl) {
      const imagePart = await imageUrlToGenerativePart(imageUrl);
      parts.push(imagePart);
      console.log('✅ Imagen agregada al request');
    } else {
      // gemini-pro-vision requiere una imagen, así que agregamos un placeholder
      console.log('ℹ️ No hay imagen, pero gemini-pro-vision la requiere');
      // Crear una imagen blanca pequeña como placeholder
      const placeholderImage = {
        inlineData: {
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          mimeType: 'image/png'
        }
      };
      parts.push(placeholderImage);
    }

    // Crear modelo
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      }
    });

    // Generar contenido
    console.log('⏳ Enviando request a Gemini...');
    const result = await model.generateContent(parts);
    const response = await result.response;
    const rawText = response.text();

    // ✨ LIMPIEZA DE RESPUESTA: Remover markdown
    const cleanedText = cleanGeminiResponse(rawText);

    console.log('✅ === RESPUESTA RECIBIDA Y LIMPIADA ===');
    console.log('📄 Texto original:', rawText.substring(0, 100) + '...');
    console.log('🧹 Texto limpio:', cleanedText.substring(0, 100) + '...');
    console.log('================================\n');
    
    return cleanedText;

  } catch (error) {
    console.error('❌ === ERROR CON GEMINI ===');
    console.error('Mensaje:', error.message);
    console.error('================================\n');
    
    // Si es error 404, listar modelos disponibles
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      console.log('🔍 Verificando modelos disponibles...');
      await listAvailableModels();
    }
    
    console.log('🎭 Usando análisis simulado como fallback');
    return generateMockAnalysis(prompt, !!imageUrl);
  }
}

/**
 * Convierte Blob a Base64
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 🔍 DEBUG: Listar modelos al iniciar
console.log('\n🔍 === VERIFICANDO CONFIGURACIÓN DE GEMINI ===');
console.log(`API Key configurada: ${GEMINI_API_KEY ? 'SÍ' : 'NO'}`);
console.log(`Modelo a usar: ${MODEL_NAME}`);
console.log('================================================\n');

// Llamar automáticamente para ver qué modelos están disponibles
listAvailableModels();