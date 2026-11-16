import {
  AboutContent,
  DemoContent,
  DriverContent,
  FaqContent,
  FeatureItem,
  FeaturesContent,
  FooterContent,
  HeroContent,
  NavLink,
  Photo,
  PlansContent,
  StepsContent,
} from '../../models/landing-content.models';

export const SECTION_LINKS: readonly NavLink[] = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Conductores', href: '#conductores' },
  { label: 'Planes', href: '#planes' },
  { label: 'Preguntas', href: '#preguntas' },
];

export const DEMO_LINK: NavLink = { label: 'Solicitar demostración', href: '#demo' };

const ICON = {
  calendar: [
    'M8 2v4M16 2v4M3 10h18',
    'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  ],
  pulse: ['M22 12h-4l-3 9L9 3l-3 9H2'],
  receipt: ['M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z', 'M9 8h6M9 12h6'],
  calculator: [
    'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
    'M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  ],
  truck: [
    'M1 6h13v10H1z',
    'M14 9h4l3 3v4h-7',
    'M4 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
    'M15 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  ],
  alert: [
    'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    'M12 9v4M12 17h.01',
  ],
  pin: ['M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z', 'M10 10a2 2 0 1 0 4 0a2 2 0 1 0-4 0'],
  camera: [
    'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z',
    'M8.5 13.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0',
  ],
  sync: ['M21 12a9 9 0 0 0-15.5-6.2L3 8M3 3v5h5', 'M3 12a9 9 0 0 0 15.5 6.2L21 16M21 21v-5h-5'],
  sheet: ['M4 3h16v18H4z', 'M4 9h16M4 15h16M10 3v18'],
  chat: ['M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z'],
} as const;

export const HERO_CONTENT: HeroContent = {
  title: 'Cada viaje de su flota, con sus gastos y su liquidación en orden',
  subtitle:
    'RINDE junta en un solo lugar lo que hoy vive en hojas de cálculo, chats y comprobantes de papel. Para empresas de carga con 3 a 30 unidades.',
  cta: DEMO_LINK,
  secondary: { label: 'Ver los planes', href: '#planes' },
  phone: {
    ariaLabel:
      'Pantalla de la app del conductor: viaje en ruta de Lima a Arequipa, adelanto recibido y dos gastos, uno con foto y otro guardado sin señal.',
    screenTitle: 'Mi viaje',
    status: 'En ruta',
    origin: 'Lima',
    destination: 'Arequipa',
    departure: 'Salida hoy, 05:30',
    vehicle: 'Unidad ABC-123',
    advanceLabel: 'Adelanto recibido',
    advance: 'S/ 800.00',
    expensesLabel: 'Gastos del viaje',
    expenses: [
      { label: 'Combustible', amount: 'S/ 450.00', state: 'Con foto' },
      { label: 'Peaje', amount: 'S/ 15.70', state: 'Sin señal', pending: true },
    ],
    action: 'Registrar gasto',
  },
  badge: {
    title: 'Registre sin señal',
    caption: 'Se envía solo al volver la conexión.',
  },
};

export const ABOUT_CONTENT: AboutContent = {
  intro: {
    title: 'Lo que hoy está repartido, en un solo lugar',
    lead: 'En una empresa de carga, cada viaje deja rastros en muchos sitios. RINDE los reúne para que operaciones sepa cuánto costó cada servicio sin perseguir a nadie.',
  },
  photo: {
    src: 'images/about-office.webp',
    alt: 'Responsable de operaciones revisando viajes en una laptop, con comprobantes sobre el escritorio.',
    ratio: '4 / 5',
  },
  points: [
    {
      id: 'sheets',
      title: 'Viajes en hojas de cálculo',
      description: 'Pasan a una agenda con unidad y conductor asignados.',
      iconPaths: ICON.sheet,
    },
    {
      id: 'paper',
      title: 'Comprobantes de papel',
      description: 'Llegan como foto, pegados a su gasto.',
      iconPaths: ICON.receipt,
    },
    {
      id: 'chats',
      title: 'Adelantos anotados en chats',
      description: 'Quedan registrados en el viaje que les corresponde.',
      iconPaths: ICON.chat,
    },
    {
      id: 'manual',
      title: 'Liquidaciones a mano',
      description: 'Se calculan con los adelantos y los gastos aprobados.',
      iconPaths: ICON.calculator,
    },
  ],
};

const OPERATIONS_EXTRA: readonly FeatureItem[] = [
  {
    id: 'status',
    title: 'Estado de cada servicio',
    description: 'Vea en qué etapa está cada viaje sin llamar ni revisar mensajes.',
    iconPaths: ICON.pulse,
  },
  {
    id: 'fleet',
    title: 'Flota y conductores',
    description: 'Alertas de mantenimiento y de licencias por vencer.',
    iconPaths: ICON.truck,
  },
  {
    id: 'incidents',
    title: 'Incidencias en ruta',
    description: 'Atienda lo que reportan los conductores y siga cada caso.',
    iconPaths: ICON.alert,
  },
];

export const FEATURES_CONTENT: FeaturesContent = {
  intro: {
    title: 'La oficina de operaciones, en una sola pantalla',
    lead: 'Programar, revisar y liquidar dejan de ser tres trabajos separados.',
  },
  showcase: [
    {
      id: 'trips',
      title: 'Programación de viajes',
      description:
        'Cree el viaje con origen, destino y fecha, y asigne la unidad y el conductor disponibles.',
      iconPaths: ICON.calendar,
      photo: {
        src: 'images/ops-trips.webp',
        alt: 'Patio de una empresa de carga con camiones listos para salir al amanecer.',
        ratio: '4 / 3',
      },
    },
    {
      id: 'expenses',
      title: 'Gastos con evidencia',
      description:
        'Cada gasto llega con la foto de su comprobante. Apruébelo u obsérvelo antes de liquidar.',
      iconPaths: ICON.receipt,
      photo: {
        src: 'images/ops-expenses.webp',
        alt: 'Manos sosteniendo un comprobante de peaje junto a un teléfono que lo fotografía.',
        ratio: '4 / 3',
      },
    },
    {
      id: 'settlements',
      title: 'Liquidación por viaje',
      description:
        'Descuente los adelantos de los gastos aprobados y cierre el viaje con su saldo.',
      iconPaths: ICON.calculator,
      photo: {
        src: 'images/ops-settlements.webp',
        alt: 'Escritorio de oficina con una laptop abierta y una calculadora junto a carpetas.',
        ratio: '4 / 3',
      },
    },
  ],
  items: OPERATIONS_EXTRA,
};

export const ROUTE_PHOTO: Photo = {
  src: 'images/route-banner.webp',
  alt: 'Camión de carga en una carretera de los Andes peruanos, con andenes y montañas nevadas al fondo.',
  ratio: '21 / 9',
};

export const DRIVER_CONTENT: DriverContent = {
  intro: {
    title: 'Una app Android para el conductor en ruta',
    lead: 'El conductor registra lo que pasa en el viaje desde su teléfono, también donde no hay señal.',
  },
  items: [
    {
      id: 'assigned-trip',
      title: 'Viaje asignado',
      description: 'Ve su viaje con la información necesaria para salir.',
      iconPaths: ICON.pin,
    },
    {
      id: 'expense-photo',
      title: 'Gastos con foto del comprobante',
      description: 'Registra el gasto y adjunta la foto en el momento.',
      iconPaths: ICON.camera,
    },
    {
      id: 'offline',
      title: 'Registro sin conexión',
      description: 'Lo guardado sin señal se sincroniza cuando vuelve la conexión.',
      iconPaths: ICON.sync,
    },
    {
      id: 'incident-report',
      title: 'Reporte de incidencias',
      description: 'Informa una incidencia para que operaciones la atienda.',
      iconPaths: ICON.alert,
    },
  ],
  mockup: {
    ariaLabel:
      'Pantalla Registrar gasto de la app Android: monto, categoría Peaje, foto del comprobante adjunta y estado Guardado sin conexión.',
    screenTitle: 'Registrar gasto',
    amountLabel: 'Monto',
    amount: '15.70',
    categoryLabel: 'Categoría',
    category: 'Peaje',
    photoLabel: 'Comprobante',
    photoCaption: 'Foto adjunta',
    statusLabel: 'Guardado sin conexión',
    buttonLabel: 'Guardar gasto',
  },
};

export const STEPS_CONTENT: StepsContent = {
  intro: {
    title: 'Cómo empezar',
    lead: 'De la demostración al primer viaje registrado.',
  },
  steps: [
    'Solicite la demostración con el formulario de esta página.',
    'Le mostramos RINDE y resolvemos sus dudas.',
    'Registre su empresa y elija el plan según sus unidades.',
    'Cargue sus unidades e invite a sus conductores.',
    'Programe el primer viaje y siga sus gastos desde la oficina.',
  ],
  photo: {
    src: 'images/steps-driver.webp',
    alt: 'Conductor en la cabina de su camión registrando un gasto en el teléfono.',
    ratio: '4 / 3',
    position: '36% center',
    tinted: true,
  },
};

const PLAN_HIGHLIGHTS: readonly string[] = [
  'Web para operaciones',
  'App Android para conductores',
  'Viajes, gastos con evidencia y liquidaciones',
  'Flota, conductores e incidencias',
  'Resumen operativo del periodo',
];

export const PLANS_CONTENT: PlansContent = {
  intro: {
    title: 'Un plan según el tamaño de su flota',
    lead: 'Todos incluyen lo mismo. Solo cambia cuántas unidades puede registrar.',
  },
  plans: [
    {
      id: 'chasqui',
      name: 'Chasqui',
      tagline: 'Para flotas que empiezan a ordenar sus viajes.',
      unitLimit: 5,
      trucks: 1,
      tone: 'light',
      priceLabel: 'Por definir',
      priceNote: 'precio mensual',
      highlights: PLAN_HIGHLIGHTS,
    },
    {
      id: 'qhapaq',
      name: 'Qhapaq',
      tagline: 'Para flotas que ya crecen cada mes.',
      unitLimit: 15,
      trucks: 2,
      tone: 'medium',
      priceLabel: 'Por definir',
      priceNote: 'precio mensual',
      highlights: PLAN_HIGHLIGHTS,
    },
    {
      id: 'apu',
      name: 'Apu',
      tagline: 'Para la operación completa de una flota mediana.',
      unitLimit: 30,
      trucks: 3,
      tone: 'deep',
      priceLabel: 'Por definir',
      priceNote: 'precio mensual',
      highlights: PLAN_HIGHLIGHTS,
    },
  ],
  cardCta: 'Consultar este plan',
  cardCtaHref: '#demo',
  notes: [
    'Los precios se publicarán antes del lanzamiento.',
    'La suscripción es mensual y se paga mediante una pasarela externa.',
    'Si su flota crece, puede pasar a un plan de mayor capacidad.',
  ],
};

export const FAQ_CONTENT: FaqContent = {
  intro: {
    title: '¿Más preguntas?',
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
        'Sí. La app guarda el registro sin conexión y lo sincroniza cuando el teléfono vuelve a tener señal.',
    },
    {
      id: 'payment',
      question: '¿Cómo se paga?',
      answer:
        'Con una suscripción mensual según el número de unidades de la flota, mediante una pasarela externa.',
    },
    {
      id: 'privacy',
      question: '¿Los datos de mi empresa están separados de los de otras empresas?',
      answer: 'Sí. Cada empresa ve únicamente sus propios datos.',
    },
    {
      id: 'start',
      question: '¿Cómo empiezo?',
      answer: 'Solicite la demostración con el formulario y nos pondremos en contacto con usted.',
    },
  ],
};

export const DEMO_CONTENT: DemoContent = {
  title: 'Solicite una demostración',
  lead: 'Déjenos los datos de su empresa y le mostraremos cómo RINDE ordena los viajes, gastos y liquidaciones de su flota.',
};

export const FOOTER_CONTENT: FooterContent = {
  tagline:
    'Viajes, gastos y liquidaciones de su flota de carga, ordenados desde la oficina y desde la ruta.',
  columns: [
    {
      title: 'Producto',
      links: [
        { label: 'Funcionalidades', href: '#funcionalidades' },
        { label: 'App del conductor', href: '#conductores' },
        { label: 'Planes', href: '#planes' },
        { label: 'Cómo empezar', href: '#empezar' },
      ],
    },
    {
      title: 'Ayuda',
      links: [
        { label: 'Preguntas frecuentes', href: '#preguntas' },
        { label: 'Solicitar demostración', href: '#demo' },
      ],
    },
  ],
  signature: 'RINDE by NEXUS. Hecho para las flotas de carga del Perú.',
  disclaimer: 'Las pantallas y montos mostrados son ilustrativos.',
  art: {
    src: 'images/footer-andes.webp',
    alt: 'Ilustración animada de un valle andino al amanecer: un camión de carga en la carretera, andenes y un río.',
    ratio: '1896 / 830',
  },
};
