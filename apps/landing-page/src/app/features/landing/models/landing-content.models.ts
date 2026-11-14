/** Contratos del contenido de la página de presentación. */
export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface SectionIntro {
  readonly title: string;
  readonly lead: string;
}

/** Foto generada aparte; mientras el archivo no exista se muestra un recuadro neutro. */
export interface Photo {
  readonly src: string;
  readonly alt: string;
  /** Proporción CSS, por ejemplo '4 / 3'. */
  readonly ratio: string;
  /** Encuadre (object-position) cuando el centro de la foto no es lo importante. */
  readonly position?: string;
  /** Filtro de color para que la foto entone con la página. */
  readonly tinted?: boolean;
}

export interface TripScreenExpense {
  readonly label: string;
  readonly amount: string;
  readonly state: string;
  readonly pending?: boolean;
}

/** Pantalla "Viaje en curso" de la app del conductor, dibujada en la portada. */
export interface HeroPhoneContent {
  readonly ariaLabel: string;
  readonly screenTitle: string;
  readonly status: string;
  readonly origin: string;
  readonly destination: string;
  readonly departure: string;
  readonly vehicle: string;
  readonly advanceLabel: string;
  readonly advance: string;
  readonly expensesLabel: string;
  readonly expenses: readonly TripScreenExpense[];
  readonly action: string;
}

export interface HeroBadgeContent {
  readonly title: string;
  readonly caption: string;
}

export interface HeroContent {
  readonly title: string;
  readonly subtitle: string;
  readonly cta: NavLink;
  readonly secondary: NavLink;
  readonly phone: HeroPhoneContent;
  readonly badge: HeroBadgeContent;
}

export interface FeatureItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Trazos SVG (atributo d) sobre una cuadrícula de 24 x 24. */
  readonly iconPaths: readonly string[];
}

export interface AboutContent {
  readonly intro: SectionIntro;
  readonly photo: Photo;
  readonly points: readonly FeatureItem[];
}

export interface ShowcaseItem extends FeatureItem {
  readonly photo: Photo;
}

export interface FeaturesContent {
  readonly intro: SectionIntro;
  readonly showcase: readonly ShowcaseItem[];
  readonly items: readonly FeatureItem[];
}

export interface PhoneMockupContent {
  readonly ariaLabel: string;
  readonly screenTitle: string;
  readonly amountLabel: string;
  readonly amount: string;
  readonly categoryLabel: string;
  readonly category: string;
  readonly photoLabel: string;
  readonly photoCaption: string;
  readonly statusLabel: string;
  readonly buttonLabel: string;
}

export interface DriverContent {
  readonly intro: SectionIntro;
  readonly items: readonly FeatureItem[];
  readonly mockup: PhoneMockupContent;
}

export interface StepsContent {
  readonly intro: SectionIntro;
  readonly steps: readonly string[];
  readonly photo: Photo;
}

export type PlanTone = 'light' | 'medium' | 'deep';

export interface PlanCard {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly unitLimit: number;
  /** Cuántos camiones dibuja el ícono: crece con la capacidad. */
  readonly trucks: number;
  readonly tone: PlanTone;
  readonly priceLabel: string;
  readonly priceNote: string;
  readonly highlights: readonly string[];
}

export interface PlansContent {
  readonly intro: SectionIntro;
  readonly plans: readonly PlanCard[];
  readonly cardCta: string;
  readonly cardCtaHref: string;
  readonly notes: readonly string[];
}

export interface FaqItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

export interface FaqContent {
  readonly intro: SectionIntro;
  readonly items: readonly FaqItem[];
}

export interface DemoContent {
  readonly title: string;
  readonly lead: string;
}

export interface FooterColumn {
  readonly title: string;
  readonly links: readonly NavLink[];
}

export interface FooterContent {
  readonly tagline: string;
  readonly columns: readonly FooterColumn[];
  readonly signature: string;
  readonly disclaimer: string;
  readonly art: Photo;
}
