import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeader } from '@shared/ui/page-header/page-header';

/** Marcador de la sección Conductores; la pantalla definitiva reemplaza este contenido en su carpeta. */
@Component({
  selector: 'app-drivers-page',
  imports: [PageHeader],
  templateUrl: './drivers-page.html',
  styleUrl: './drivers-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversPage {}
