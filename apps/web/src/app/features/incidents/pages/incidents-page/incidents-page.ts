import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeader } from '@shared/ui/page-header/page-header';

/** Marcador de la sección Incidencias; la pantalla definitiva reemplaza este contenido en su carpeta. */
@Component({
  selector: 'app-incidents-page',
  imports: [PageHeader],
  templateUrl: './incidents-page.html',
  styleUrl: './incidents-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentsPage {}
