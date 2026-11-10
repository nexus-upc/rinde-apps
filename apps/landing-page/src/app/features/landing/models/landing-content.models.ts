/** Contratos del contenido de la página de presentación. */
export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface SectionIntro {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
}

export interface HeroContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly cta: NavLink;
  readonly highlights: readonly string[];
}

export interface FeatureItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Trazos SVG (atributo d) sobre una cuadrícula de 24 x 24. */
  readonly iconPaths: readonly string[];
}

export interface FeaturesContent {
  readonly intro: SectionIntro;
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

export interface PlanCard {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly unitLimit: number;
  readonly priceLabel: string;
  readonly highlights: readonly string[];
  readonly featured?: boolean;
  readonly badge?: string;
}

export interface PlansContent {
  readonly intro: SectionIntro;
  readonly plans: readonly PlanCard[];
  readonly cardCta: string;
  readonly cardCtaHref: string;
  readonly modelTitle: string;
  readonly modelPoints: readonly string[];
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

export interface FooterContent {
  readonly tagline: string;
  readonly signature: string;
}
