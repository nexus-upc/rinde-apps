import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeader } from '@shared/ui/page-header/page-header';

/** Marcador de la sección Liquidaciones; la pantalla definitiva reemplaza este contenido en su carpeta. */
@Component({
  selector: 'app-settlements-page',
  imports: [PageHeader],
  templateUrl: './settlements-page.html',
  styleUrl: './settlements-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettlementsPage {}
