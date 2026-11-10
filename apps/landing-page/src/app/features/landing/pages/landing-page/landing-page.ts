import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DemoRequestStore } from '../../state/demo-request.store';
import { DemoRequestForm } from '../../ui/demo-request-form/demo-request-form';
import { DriverSection } from '../../ui/driver-section/driver-section';
import { FaqSection } from '../../ui/faq-section/faq-section';
import { FeaturesSection } from '../../ui/features-section/features-section';
import { HeroSection } from '../../ui/hero-section/hero-section';
import { PlansSection } from '../../ui/plans-section/plans-section';
import { SiteFooter } from '../../ui/site-footer/site-footer';
import { SiteHeader } from '../../ui/site-header/site-header';
import {
  DEMO_CONTENT,
  DEMO_LINK,
  DRIVER_CONTENT,
  FAQ_CONTENT,
  FEATURES_CONTENT,
  FOOTER_CONTENT,
  HERO_CONTENT,
  PLANS_CONTENT,
  SECTION_LINKS,
} from './landing-content';

/** Página única de presentación de RINDE: compone las secciones de contenido. */
@Component({
  selector: 'app-landing-page',
  imports: [
    SiteHeader,
    HeroSection,
    FeaturesSection,
    DriverSection,
    PlansSection,
    FaqSection,
    SiteFooter,
    DemoRequestForm,
  ],
  providers: [DemoRequestStore],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  protected readonly store = inject(DemoRequestStore);
  protected readonly links = SECTION_LINKS;
  protected readonly demoLink = DEMO_LINK;
  protected readonly hero = HERO_CONTENT;
  protected readonly features = FEATURES_CONTENT;
  protected readonly driver = DRIVER_CONTENT;
  protected readonly plans = PLANS_CONTENT;
  protected readonly faq = FAQ_CONTENT;
  protected readonly demo = DEMO_CONTENT;
  protected readonly footer = FOOTER_CONTENT;
}
