import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastService } from '@core/feedback/toast.service';
import { environment } from '../../../../../environments/environment';
import { User } from '../../models/iam.models';
import { UsersPage } from './users-page';

const USERS_URL = `${environment.apiBaseUrl}/api/v1/users`;
const TOKEN = [
  btoa('{"alg":"HS256"}'),
  btoa(
    `{"email":"ana@andes.pe","role":"ADMINISTRATOR","exp":${Math.floor(Date.now() / 1000) + 3600}}`,
  ),
  'firma',
].join('.');

const USERS: User[] = [
  {
    id: 'u1',
    fullName: 'Ana Rojas',
    email: 'ana@andes.pe',
    role: 'ADMINISTRATOR',
    status: 'ACTIVE',
  },
  { id: 'u2', fullName: 'Luis Ticona', email: 'luis@andes.pe', role: 'DRIVER', status: 'ACTIVE' },
];

describe('UsersPage', () => {
  let fixture: ComponentFixture<UsersPage>;
  let http: HttpTestingController;
  let toasts: ToastService;

  beforeEach(() => {
    sessionStorage.setItem('rinde.accessToken', TOKEN);
    TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(UsersPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function button(label: string): HTMLButtonElement {
    return Array.from(root().querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === label,
    ) as HTMLButtonElement;
  }

  it('shows a skeleton, then the rows, and marks the signed-in user', () => {
    expect(root().querySelector('[aria-busy="true"]')).not.toBeNull();
    http.expectOne(USERS_URL).flush(USERS);
    fixture.detectChanges();

    expect(root().querySelectorAll('.user-row').length).toBe(2);
    expect(root().textContent).toContain('2 usuarios');
    expect(root().textContent).toContain('(tú)');
    expect(root().querySelector('#role-u1')).toBeNull();
  });

  it('shows a centered error with a retry', () => {
    http.expectOne(USERS_URL).flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(root().textContent).toContain('No se pudo cargar la lista');
    button('Reintentar').click();
    http.expectOne(USERS_URL).flush([]);
    fixture.detectChanges();
    expect(root().textContent).toContain('Todavía no hay usuarios');
  });

  it('invites a user in place and confirms it with a toast', () => {
    http.expectOne(USERS_URL).flush(USERS);
    fixture.detectChanges();

    button('Invitar usuario').click();
    fixture.detectChanges();
    const set = (id: string, value: string) => {
      const input = root().querySelector(`#${id}`) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    set('invite-name', 'Rosa Huamán');
    set('invite-email', 'rosa@andes.pe');
    button('Enviar invitación').click();

    const request = http.expectOne(USERS_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      fullName: 'Rosa Huamán',
      email: 'rosa@andes.pe',
      role: 'DRIVER',
    });
    request.flush({
      id: 'u3',
      fullName: 'Rosa Huamán',
      email: 'rosa@andes.pe',
      role: 'DRIVER',
      status: 'INVITED',
    });
    fixture.detectChanges();

    expect(root().querySelectorAll('.user-row').length).toBe(3);
    expect(toasts.messages()[0]?.text).toBe('Invitación creada para rosa@andes.pe.');
  });

  it('disables another user and updates the row', () => {
    http.expectOne(USERS_URL).flush(USERS);
    fixture.detectChanges();

    button('Deshabilitar').click();
    const request = http.expectOne(`${USERS_URL}/u2`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'DISABLED' });
    request.flush({ ...USERS[1], status: 'DISABLED' });
    fixture.detectChanges();

    expect(root().textContent).toContain('Deshabilitado');
    expect(root().textContent).not.toContain('Habilitar');
    expect(root().querySelectorAll('button.user-row__action').length).toBe(0);
    expect(toasts.messages()[0]?.text).toBe('Luis Ticona ya no puede iniciar sesión.');
  });

  it('keeps the previous role when the server rejects an update', () => {
    http.expectOne(USERS_URL).flush(USERS);
    fixture.detectChanges();
    const select = root().querySelector('#role-u2') as HTMLSelectElement;
    select.value = 'OPERATIONS_MANAGER';
    select.dispatchEvent(new Event('change'));
    const request = http.expectOne(`${USERS_URL}/u2`);
    expect(request.request.body).toEqual({ role: 'OPERATIONS_MANAGER' });
    request.flush(
      { detail: 'No se pudo cambiar el rol.' },
      { status: 503, statusText: 'Unavailable' },
    );
    fixture.detectChanges();
    expect(select.value).toBe('DRIVER');
    expect(toasts.messages()[0]?.text).toBe('No se pudo cambiar el rol.');
  });

  it('cancels a pending list request when leaving the page', () => {
    const request = http.expectOne(USERS_URL);
    fixture.destroy();
    expect(request.cancelled).toBe(true);
  });

  it('returns keyboard focus to the invitation trigger when cancelling', async () => {
    http.expectOne(USERS_URL).flush(USERS);
    fixture.detectChanges();
    button('Invitar usuario').click();
    fixture.detectChanges();
    button('Cancelar').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(button('Invitar usuario'));
  });
});
