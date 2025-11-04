import * as WebBrowser from 'expo-web-browser';

const MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-2037119821110626-100819-9140f365310f1ff4688d7be550e6cfc1-2913071083';

export const startMercadoPagoCheckout = async (items, totalPrice) => {
  try {
    const preferenceItems = items.map(item => ({
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'ARS',
      description: item.name,
    }));

    const preference = {
      items: preferenceItems,
      payer: {},
      back_urls: {
        success: 'mitallervip://payment/success',
        failure: 'mitallervip://payment/failure',
        pending: 'mitallervip://payment/pending',
      },
      auto_return: 'approved',
      notification_url: 'https://webhook.site/YOUR_WEBHOOK_ENDPOINT',
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
      const result = await WebBrowser.openBrowserAsync(data.init_point);
      
      if (result.type === 'cancel') {
        return { status: 'cancelled', message: 'El proceso de pago fue cancelado por el usuario.' };
      }
      
      return { status: 'approved', transactionId: data.id || 'N/A' };

    } else {
      console.error('Error de Mercado Pago:', data);
      return { status: 'rejected', message: data.message || 'No se pudo obtener la URL de pago.' };
    }

  } catch (error) {
    console.error('Error al iniciar el checkout de Mercado Pago:', error);
    return { status: 'rejected', message: 'No se pudo iniciar el proceso de pago.' };
  }
};