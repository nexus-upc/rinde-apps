import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeader } from '@shared/ui/page-header/page-header';

/** Marcador de la sección Flota; la pantalla definitiva reemplaza este contenido en su carpeta. */
@Component({
  selector: 'app-fleet-page',
  imports: [PageHeader],
  templateUrl: './fleet-page.html',
  styleUrl: './fleet-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetPage {}
