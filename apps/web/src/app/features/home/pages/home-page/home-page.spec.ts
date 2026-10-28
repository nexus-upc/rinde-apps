import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { TripSummary } from '../../models/home.models';
import { isoDay } from '../../state/home.store';
import { HomePage } from './home-page';

const BASE = `${environment.apiBaseUrl}/api/v1`;
const TRIPS_URL = `${BASE}/trips`;

function trip(code: string, status: TripSummary['status'], offset: number): TripSummary {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return {
    id: code,
    code,
    origin: 'Lima',
    destination: code === 'TRP-000003' ? 'Chimbote' : 'Arequipa',
    departureDate: isoDay(date),
    vehicleId: status === 'SCHEDULED' ? null : 'vehicle',
    driverId: status === 'SCHEDULED' ? null : 'driver',
    status,
  };
}

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let http: HttpTestingController;
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  /** Responde los viajes; Fleet devuelve la unidad y el conductor de los viajes asignados. */
  function respond(trips: TripSummary[] | null, status = 200) {
    http.expectOne(`${BASE}/vehicles`).flush([{ id: 'vehicle', plateNumber: 'ABC-123' }]);
    http.expectOne(`${BASE}/drivers`).flush([{ id: 'driver', fullName: 'Luis Quispe' }]);
    if (status === 200) http.expectOne(TRIPS_URL).flush(trips);
    else http.expectOne(TRIPS_URL).flush(null, { status, statusText: 'Error' });
    fixture.detectChanges();
  }

  it('summarizes the trips in route, the next departure and what lacks an assignment', () => {
    expect(text()).toContain('Cargando el inicio');
    respond([
      trip('TRP-000001', 'IN_ROUTE', 0),
      trip('TRP-000002', 'IN_ROUTE', -1),
      trip('TRP-000003', 'SCHEDULED', 2),
      trip('TRP-000004', 'FINISHED', -30),
    ]);

    expect(text()).toContain('2 viajes en camino');
    expect(text()).toContain('1 salida espera unidad y conductor.');
    expect(text()).toContain('Lima a Chimbote');
    expect(text()).toContain('Viajes de hoy');
    expect(text()).toContain('TRP-000003 sin asignar');
    expect(text()).toContain('ABC-123, Luis Quispe');
    expect(text()).not.toContain('TRP-000004');
  });

  it('shows the upcoming departures when nothing leaves today', () => {
    respond([trip('TRP-000005', 'ASSIGNED', 3)]);

    expect(text()).toContain('Ningún viaje en camino');
    expect(text()).toContain('Próximas salidas');
    expect(text()).toContain('Nada pendiente por ahora.');
  });

  it('offers a retry when the trips cannot be loaded', () => {
    respond(null, 500);
    expect(text()).toContain('No pudimos cargar el inicio');

    const retry = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.trim() === 'Reintentar');
    retry!.click();
    respond([]);
    expect(text()).toContain('Aún no hay viajes programados');
  });
});
