import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrandMark } from '../../brand/brand-mark/brand-mark';
import { GlideOnResize } from '../../motion/glide-on-resize';

/** Marco común del acceso: marca en la esquina, formulario centrado y pie. */
@Component({
  selector: 'app-access-layout',
  imports: [BrandMark, GlideOnResize],
  templateUrl: './access-layout.html',
  styleUrl: './access-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessLayout {}
