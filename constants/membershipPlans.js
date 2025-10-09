// Ruta: constants/membershipPlans.js

export const membershipPlans = [
    {
      id: 'basica',
      name: 'Membresía Básica',
      price: '$9,990',
      monthlyPrice: '~$833/mes',
      benefits: [
        '10% de descuento en mano de obra',
        'Revisión semestral gratuita',
        'Soporte prioritario por chat',
        'Historial digital completo',
      ],
      isFeatured: false,
    },
    {
      id: 'premium',
      name: 'Membresía Premium',
      price: '$19,990',
      monthlyPrice: '~$1,666/mes',
      benefits: [
        '15% de descuento en mano de obra',
        'Revisión trimestral gratuita',
        'Acceso completo a Tienda VIP',
        'Grúa gratuita (1 vez por año)',
        'Diagnóstico express sin costo',
      ],
      isFeatured: true,
    },
    {
      id: 'vip_elite',
      name: 'Membresía VIP Elite',
      price: '$34,990',
      monthlyPrice: '~$2,916/mes',
      benefits: [
        '25% de descuento en mano de obra',
        'Revisión mensual gratuita',
        'Grúa ilimitada',
        'Servicio a domicilio incluido',
        'Concierge automotriz personal',
      ],
      isFeatured: false,
    },
  ];