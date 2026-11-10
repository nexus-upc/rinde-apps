import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HeroBadgeContent, HeroPhoneContent } from '../../models/landing-content.models';
import { DeviceStatus } from '../device-status/device-status';

/**
 * Composición de la portada: el teléfono del conductor, inclinado, con la pantalla del viaje en
 * curso, y una tarjeta azul superpuesta con el mensaje del registro sin señal.
 */
@Component({
  selector: 'app-hero-visual',
  imports: [DeviceStatus],
  templateUrl: './hero-visual.html',
  styleUrl: './hero-visual.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroVisual {
  readonly phone = input.required<HeroPhoneContent>();
  readonly badge = input.required<HeroBadgeContent>();
}
