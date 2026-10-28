import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrandMark } from '../../brand/brand-mark/brand-mark';
import { isWideScreen } from '../../browser/wide-screen';
import { RouteScene } from '../route-scene/route-scene';

/** Marco común del acceso: marca, columna del formulario, bloque decorativo y pie. */
@Component({
  selector: 'app-access-layout',
  imports: [BrandMark, RouteScene],
  templateUrl: './access-layout.html',
  styleUrl: './access-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessLayout {
  /** Desde 1100 px la pantalla tiene dos columnas y muestra la vista decorativa. */
  protected readonly wide = isWideScreen();
}
