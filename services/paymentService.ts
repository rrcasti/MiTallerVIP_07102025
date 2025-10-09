// Ruta: services/paymentService.ts
import * as WebBrowser from 'expo-web-browser';

// VERIFICADO: Tu Access Token de PRODUCCIÓN está insertado.
const MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-2037119821110626-100819-9140f365310f1ff4688d7be550e6cfc1-2913071083';

interface PaymentItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
  description?: string;
}

export const createPaymentPreference = async (item: PaymentItem) => {
  try {
    const preference = {
      items: [
        {
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: item.currency_id || 'ARS',
          description: item.description || '',
        },
      ],
      back_urls: {
        success: 'mitallervip://payment/success', // Deep Link de producción
        failure: 'mitallervip://payment/failure',
        pending: 'mitallervip://payment/pending',
      },
      auto_return: 'approved',
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();

    if (data.init_point) {
      await WebBrowser.openBrowserAsync(data.init_point);
    } else {
      console.error('Error de Mercado Pago:', data);
      throw new Error(data.message || 'No se pudo obtener la URL de pago.');
    }

  } catch (error) {
    console.error('Error al crear la preferencia de pago:', error);
    throw new Error('No se pudo iniciar el proceso de pago.');
  }
};