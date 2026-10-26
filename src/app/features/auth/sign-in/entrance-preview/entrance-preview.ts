import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrandMark } from '../../../../shared/brand/brand-mark/brand-mark';

/** Estado visual de la fila: en ruta, por liquidar o neutro. */
type TripTone = 'ok' | 'wait' | 'neutral';

interface PreviewTrip {
  readonly code: string;
  readonly route: string;
  readonly driver: string;
  readonly status: string;
  readonly tone: TripTone;
}

/** Vista decorativa del Inicio de Rinde con datos sintéticos. No llama a la API, no recibe foco y no se lee como contenido. */
@Component({
  selector: 'app-entrance-preview',
  imports: [BrandMark],
  templateUrl: './entrance-preview.html',
  styleUrl: './entrance-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', inert: '' },
})
export class EntrancePreview {
  protected readonly menu = ['Viajes', 'Flota', 'Gastos', 'Liquidaciones'];

  protected readonly date = capitalize(
    new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
  );

  protected readonly trips: readonly PreviewTrip[] = [
    { code: 'VJ-0012', route: 'Lima a Arequipa', driver: 'Jorge Quispe', status: 'En ruta', tone: 'ok' },
    { code: 'VJ-0013', route: 'Lima a Trujillo', driver: 'Luis Ticona', status: 'Programado', tone: 'neutral' },
    { code: 'VJ-0014', route: 'Callao a Ica', driver: 'Rosa Huamán', status: 'En ruta', tone: 'ok' },
    { code: 'VJ-0015', route: 'Lima a Huancayo', driver: 'Marco Ríos', status: 'Por liquidar', tone: 'wait' },
    { code: 'VJ-0016', route: 'Chiclayo a Piura', driver: 'Ana Cárdenas', status: 'En ruta', tone: 'ok' },
    { code: 'VJ-0017', route: 'Lima a Cusco', driver: 'Diego Mendoza', status: 'Liquidado', tone: 'neutral' },
  ];

  protected readonly onRoad = this.trips.filter((trip) => trip.tone === 'ok').length;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
