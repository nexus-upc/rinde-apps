import {
  DemoContent,
  DriverContent,
  FaqContent,
  FeaturesContent,
  FooterContent,
  HeroContent,
  NavLink,
  PlansContent,
} from '../../models/landing-content.models';

export const SECTION_LINKS: readonly NavLink[] = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Conductores', href: '#conductores' },
  { label: 'Planes', href: '#planes' },
  { label: 'Preguntas', href: '#preguntas' },
];

export const DEMO_LINK: NavLink = { label: 'Solicitar demostración', href: '#demo' };

export const HERO_CONTENT: HeroContent = {
  eyebrow: 'Para empresas de transporte terrestre de carga',
  title: 'Viajes, gastos y liquidaciones de su flota, en un solo lugar',
  subtitle:
    'RINDE reúne la información que hoy se reparte entre hojas de cálculo, mensajes y comprobantes en papel. Pensado para flotas de 3 a 30 unidades.',
  cta: DEMO_LINK,
  highlights: ['Viajes', 'Gastos con evidencia', 'Liquidaciones', 'Flota y conductores'],
};

export const FEATURES_CONTENT: FeaturesContent = {
  intro: {
    eyebrow: 'Operaciones',
    title: 'Todo lo que su equipo de operaciones necesita',
    lead: 'La aplicación web centraliza el trabajo diario de quienes programan, revisan y liquidan los servicios.',
  },
  items: [
    {
      id: 'trips',
      title: 'Programación de viajes',
      description: 'Programe cada viaje y asigne la unidad y el conductor desde una sola vista.',
      iconPaths: [
        'M8 2v4M16 2v4M3 10h18',
        'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
      ],
    },
    {
      id: 'status',
      title: 'Estado de cada servicio',
      description: 'Consulte en qué etapa se encuentra cada viaje sin llamar ni revisar mensajes.',
      iconPaths: ['M22 12h-4l-3 9L9 3l-3 9H2'],
    },
    {
      id: 'expenses',
      title: 'Revisión de gastos con evidencia',
      description: 'Revise cada gasto junto con la foto de su comprobante antes de aprobarlo.',
      iconPaths: ['M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z', 'M9 8h6M9 12h6'],
    },
    {
      id: 'settlements',
      title: 'Liquidación por viaje',
      description:
        'Liquide cada viaje considerando los adelantos entregados y los gastos aprobados.',
      iconPaths: [
        'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
        'M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
      ],
    },
    {
      id: 'fleet',
      title: 'Flota y conductores',
      description:
        'Gestione unidades y conductores, con alertas de mantenimiento y de vencimiento de licencias.',
      iconPaths: [
        'M1 6h13v10H1z',
        'M14 9h4l3 3v4h-7',
        'M4 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
        'M15 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
      ],
    },
    {
      id: 'incidents',
      title: 'Incidencias en ruta',
      description:
        'Atienda las incidencias que reportan los conductores y dé seguimiento a cada una.',
      iconPaths: [
        'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
        'M12 9v4M12 17h.01',
      ],
    },
  ],
};

export const DRIVER_CONTENT: DriverContent = {
  intro: {
    eyebrow: 'Conductores',
    title: 'Una app Android para el conductor en ruta',
    lead: 'El conductor registra lo que ocurre durante el viaje desde su teléfono, aun donde no hay señal.',
  },
  items: [
    {
      id: 'assigned-trip',
      title: 'Viaje asignado',
      description: 'Ve el viaje que le corresponde, con la información necesaria para salir.',
      iconPaths: [
        'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z',
        'M10 10a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
      ],
    },
    {
      id: 'expense-photo',
      title: 'Gastos con foto del comprobante',
      description: 'Registra cada gasto y adjunta la foto del comprobante en el momento.',
      iconPaths: [
        'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z',
        'M8.5 13.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0',
      ],
    },
    {
      id: 'offline',
      title: 'Registro sin conexión',
      description: 'Guarda los registros sin señal y se sincronizan cuando vuelve la conexión.',
      iconPaths: [
        'M21 12a9 9 0 0 0-15.5-6.2L3 8M3 3v5h5',
        'M3 12a9 9 0 0 0 15.5 6.2L21 16M21 21v-5h-5',
      ],
    },
    {
      id: 'incident-report',
      title: 'Reporte de incidencias',
      description: 'Informa una incidencia en ruta para que operaciones pueda atenderla.',
      iconPaths: [
        'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
        'M12 9v4M12 17h.01',
      ],
    },
  ],
  mockup: {
    ariaLabel:
      'Maqueta de la app Android: pantalla Registrar gasto con monto, categoría Peaje, foto del comprobante adjunta y el estado Guardado sin conexión.',
    screenTitle: 'Registrar gasto',
    amountLabel: 'Monto',
    amount: '120.00',
    categoryLabel: 'Categoría',
    category: 'Peaje',
    photoLabel: 'Comprobante',
    photoCaption: 'Foto adjunta',
    statusLabel: 'Guardado sin conexión',
    buttonLabel: 'Guardar gasto',
  },
};

const PLAN_HIGHLIGHTS: readonly string[] = [
  'Web para operaciones y app Android para conductores',
  'Usuarios y conductores de la empresa',
  'Gastos con evidencia y liquidaciones',
];

const PRICE_LABEL = 'Precio mensual por definir';

export const PLANS_CONTENT: PlansContent = {
  intro: {
    eyebrow: 'Planes',
    title: 'Un plan según el tamaño de su flota',
    lead: 'Los tres planes incluyen las mismas funcionalidades. Lo único que cambia es el límite de unidades.',
  },
  plans: [
    {
      id: 'chasqui',
      name: 'Plan Chasqui',
      tagline: 'Para flotas que empiezan a ordenar sus viajes.',
      unitLimit: 5,
      priceLabel: PRICE_LABEL,
      highlights: PLAN_HIGHLIGHTS,
    },
    {
      id: 'qhapaq',
      name: 'Plan Qhapaq',
      tagline: 'Para flotas en crecimiento.',
      unitLimit: 15,
      priceLabel: PRICE_LABEL,
      highlights: PLAN_HIGHLIGHTS,
      featured: true,
      badge: 'Flotas medianas',
    },
    {
      id: 'apu',
      name: 'Plan Apu',
      tagline: 'Para la operación completa de una flota mediana.',
      unitLimit: 30,
      priceLabel: PRICE_LABEL,
      highlights: PLAN_HIGHLIGHTS,
    },
  ],
  cardCta: 'Consultar este plan',
  cardCtaHref: '#demo',
  modelTitle: 'Cómo funciona la suscripción',
  modelPoints: [
    'Suscripción mensual según el número de unidades de la flota.',
    'Cada plan tiene un precio mensual y un límite de unidades.',
    'Se paga solo por la capacidad que se necesita.',
    'Cuando la flota crece, se puede cambiar a un plan de mayor capacidad.',
    'El pago se realiza mediante una pasarela externa.',
  ],
};

export const FAQ_CONTENT: FaqContent = {
  intro: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Resolvemos sus dudas',
    lead: 'Lo esencial para decidir si RINDE se ajusta a su empresa.',
  },
  items: [
    {
      id: 'who',
      question: '¿Para qué empresas es RINDE?',
      answer:
        'Para pequeñas y medianas empresas de transporte terrestre de carga con flotas de 3 a 30 unidades.',
    },
    {
      id: 'requirements',
      question: '¿Qué se necesita para usarlo?',
      answer:
        'El personal de operaciones usa un navegador web. Los conductores usan la app en un teléfono Android.',
    },
    {
      id: 'offline',
      question: '¿El conductor puede registrar gastos sin señal?',
      answer:
        'Sí. La app permite registrar sin conexión y los datos se sincronizan cuando el teléfono vuelve a tener conexión.',
    },
    {
      id: 'payment',
      question: '¿Cómo se paga?',
      answer:
        'Mediante una suscripción mensual según el número de unidades de la flota. El pago se realiza por una pasarela externa.',
    },
    {
      id: 'privacy',
      question: '¿Los datos de mi empresa están separados de los de otras empresas?',
      answer: 'Sí. Cada empresa ve únicamente sus propios datos.',
    },
    {
      id: 'start',
      question: '¿Cómo empiezo?',
      answer:
        'Solicite la demostración con el formulario de esta página y nos pondremos en contacto con usted.',
    },
  ],
};

export const DEMO_CONTENT: DemoContent = {
  title: 'Solicite una demostración',
  lead: 'Déjenos los datos de su empresa y le mostraremos cómo RINDE ordena los viajes, gastos y liquidaciones de su flota.',
};

export const FOOTER_CONTENT: FooterContent = {
  tagline: 'Gestión de viajes, gastos y liquidaciones para flotas de carga.',
  signature: 'RINDE by NEXUS',
};
