import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingPage } from './features/landing/pages/landing-page/landing-page';

@Component({
  selector: 'app-root',
  imports: [LandingPage],
  template: '<app-landing-page />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
