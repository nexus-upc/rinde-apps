import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DemoRequest } from '../models/demo-request.models';
import { DemoRequestStore } from './demo-request.store';

const URL = 'http://localhost:8000/api/v1/public/demo-requests';
const request: DemoRequest = {
  fullName: 'Ana Torres',
  companyName: 'Transportes Andes SAC',
  email: 'ana@example.com',
  fleetSize: 12,
};
const receipt = {
  id: 'b3f1c1c2-0000-4000-8000-000000000001',
  status: 'RECEIVED',
  receivedAt: '2026-11-09T13:05:12.418Z',
};

describe('DemoRequestStore', () => {
  let store: DemoRequestStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), DemoRequestStore],
    });
    store = TestBed.inject(DemoRequestStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('marks the request as sent on 201', () => {
    store.submit(request);
    expect(store.pending()).toBe(true);
    http.expectOne(URL).flush(receipt, { status: 201, statusText: 'Created' });
    expect(store.sent()).toBe(true);
    expect(store.pending()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('keeps only known string field errors on 400', () => {
    store.submit(request);
    http.expectOne(URL).flush(
      {
        detail: 'La solicitud tiene datos inválidos.',
        errors: {
          fleetSize: 'La cantidad de unidades debe estar entre 1 y 500.',
          unknown: 'ignorada',
          email: 42,
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    expect(store.fieldErrors()).toEqual({
      fleetSize: 'La cantidad de unidades debe estar entre 1 y 500.',
    });
    expect(store.error()).toBe('La solicitud tiene datos inválidos.');
    expect(store.sent()).toBe(false);
  });

  it('falls back to a generic message on 400 without detail', () => {
    store.submit(request);
    http.expectOne(URL).flush({}, { status: 400, statusText: 'Bad Request' });
    expect(store.error()).toBe('Revise los campos marcados.');
  });

  it('shows the server detail on 429', () => {
    store.submit(request);
    http
      .expectOne(URL)
      .flush(
        { detail: 'Ya recibimos tu solicitud. Te contactaremos pronto.' },
        { status: 429, statusText: 'Too Many Requests' },
      );
    expect(store.error()).toBe('Ya recibimos tu solicitud. Te contactaremos pronto.');
    expect(store.sent()).toBe(false);
  });

  it('reports a connection problem on status 0', () => {
    store.submit(request);
    http.expectOne(URL).error(new ProgressEvent('error'), { status: 0 });
    expect(store.error()).toBe('No se pudo conectar con el servidor. Intente nuevamente.');
  });

  it('reports a generic problem on other failures', () => {
    store.submit(request);
    http.expectOne(URL).flush(null, { status: 500, statusText: 'Server Error' });
    expect(store.error()).toBe('No se pudo enviar la solicitud. Intente nuevamente.');
  });

  it('ignores a second submit while one is pending', () => {
    store.submit(request);
    store.submit(request);
    const calls = http.match(URL);
    expect(calls).toHaveLength(1);
    calls[0]?.flush(receipt, { status: 201, statusText: 'Created' });
  });

  it('clears previous errors on a new submit', () => {
    store.submit(request);
    http
      .expectOne(URL)
      .flush({ errors: { email: 'x' } }, { status: 400, statusText: 'Bad Request' });
    store.submit(request);
    expect(store.error()).toBeNull();
    expect(store.fieldErrors()).toEqual({});
    http.expectOne(URL).flush(receipt, { status: 201, statusText: 'Created' });
  });

  it('returns to the initial state on reset and cancels a pending request', () => {
    store.submit(request);
    const call = http.expectOne(URL);
    store.reset();
    expect(call.cancelled).toBe(true);
    expect(store.pending()).toBe(false);
    store.submit(request);
    http.expectOne(URL).flush(receipt, { status: 201, statusText: 'Created' });
    expect(store.sent()).toBe(true);
    store.reset();
    expect(store.sent()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.fieldErrors()).toEqual({});
  });
});
