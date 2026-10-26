import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { DefinePassword } from './define-password/define-password';
import { Recover } from './recover/recover';
import { Register } from './register/register';
import { VerifyEmail } from './verify-email/verify-email';

const API = `${environment.apiBaseUrl}/api/v1`;

describe('Access flows', () => {
  let http: HttpTestingController;

  function setup<T>(
    component: Type<T>,
    query: Record<string, string> = {},
    data: Record<string, string> = {},
  ): ComponentFixture<T> {
    TestBed.configureTestingModule({
      imports: [component],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(query), data } },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => http.verify());

  function root(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function type(fixture: ComponentFixture<unknown>, id: string, value: string): void {
    const input = root(fixture).querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  function submit(fixture: ComponentFixture<unknown>): void {
    (root(fixture).querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function title(fixture: ComponentFixture<unknown>): string | null {
    return root(fixture).querySelector('h1')?.getAttribute('aria-label') ?? null;
  }

  describe('Register', () => {
    it('validates each step before moving on and sends the whole tenant at the end', () => {
      const fixture = setup(Register);

      type(fixture, 'tradeName', 'Transportes Andes SAC');
      type(fixture, 'ruc', '2061');
      submit(fixture);
      expect(root(fixture).textContent).toContain('El RUC debe tener 11 dígitos numéricos.');

      type(fixture, 'ruc', '20612345671');
      submit(fixture);
      expect(title(fixture)).toBe('¿Cómo te llamas?');

      type(fixture, 'administratorFullName', 'Ana Rojas');
      submit(fixture);
      expect(title(fixture)).toBe('Hola, Ana');

      type(fixture, 'administratorEmail', 'ana@andes.pe');
      submit(fixture);
      type(fixture, 'password', 'Clave-Segura-2026');
      submit(fixture);

      const request = http.expectOne(`${API}/tenants`);
      expect(request.request.body).toEqual({
        tradeName: 'Transportes Andes SAC',
        ruc: '20612345671',
        administratorFullName: 'Ana Rojas',
        administratorEmail: 'ana@andes.pe',
        password: 'Clave-Segura-2026',
      });
      request.flush(
        {
          id: 't1',
          tradeName: 'Transportes Andes SAC',
          ruc: '20612345671',
          status: 'PENDING_VERIFICATION',
        },
        { status: 201, statusText: 'Created' },
      );
      fixture.detectChanges();

      expect(title(fixture)).toBe('Revisa tu correo');
      expect(root(fixture).textContent).toContain('ana@andes.pe');
    });

    it('shows the backend message when the RUC is already registered', () => {
      const fixture = setup(Register);
      type(fixture, 'tradeName', 'Andes');
      type(fixture, 'ruc', '20612345671');
      submit(fixture);
      type(fixture, 'administratorFullName', 'Ana Rojas');
      submit(fixture);
      type(fixture, 'administratorEmail', 'ana@andes.pe');
      submit(fixture);
      type(fixture, 'password', 'Clave-Segura-2026');
      submit(fixture);

      http
        .expectOne(`${API}/tenants`)
        .flush(
          { detail: 'Ya existe una empresa con ese RUC.' },
          { status: 409, statusText: 'Conflict' },
        );
      fixture.detectChanges();

      expect(root(fixture).querySelector('[role="alert"]')?.textContent).toContain(
        'Ya existe una empresa con ese RUC.',
      );
    });
  });

  describe('VerifyEmail', () => {
    it('explains an incomplete link', () => {
      const fixture = setup(VerifyEmail, { token: 'abc' });
      expect(title(fixture)).toBe('El enlace no está completo');
    });

    it('confirms the email and returns to sign-in with a notice', () => {
      const fixture = setup(VerifyEmail, { tenant: 't1', token: 'abc' });
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      (root(fixture).querySelector('button') as HTMLButtonElement).click();

      const request = http.expectOne(`${API}/tenants/t1/verification`);
      expect(request.request.body).toEqual({ token: 'abc' });
      request.flush({ id: 't1', tradeName: 'Andes', ruc: '20612345671', status: 'ACTIVE' });

      expect(navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { notice: 'verified' } });
    });
  });

  describe('Recover', () => {
    it('asks for the link and shows the same message for any email', () => {
      const fixture = setup(Recover, { email: 'ana@andes.pe' });
      submit(fixture);

      const request = http.expectOne(`${API}/auth/password-reset`);
      expect(request.request.body).toEqual({ email: 'ana@andes.pe' });
      request.flush(null, { status: 202, statusText: 'Accepted' });
      fixture.detectChanges();

      expect(title(fixture)).toBe('Revisa tu correo');
    });
  });

  describe('DefinePassword', () => {
    it('requires both passwords to match', () => {
      const fixture = setup(DefinePassword, { token: 'abc' }, { mode: 'reset' });
      type(fixture, 'password', 'Clave-Nueva-2026');
      type(fixture, 'confirmation', 'Otra-Clave-2026');
      submit(fixture);

      expect(root(fixture).textContent).toContain('Las contraseñas no coinciden.');
      http.expectNone(`${API}/auth/password`);
    });

    it('activates an invitation with its token', () => {
      const fixture = setup(DefinePassword, { token: 'invite-1' }, { mode: 'invitation' });
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      expect(title(fixture)).toBe('Únete a tu empresa');

      type(fixture, 'password', 'Clave-Nueva-2026');
      type(fixture, 'confirmation', 'Clave-Nueva-2026');
      submit(fixture);

      const request = http.expectOne(`${API}/auth/password`);
      expect(request.request.body).toEqual({ token: 'invite-1', password: 'Clave-Nueva-2026' });
      request.flush(null, { status: 204, statusText: 'No Content' });

      expect(navigate).toHaveBeenCalledWith(['/sign-in'], {
        queryParams: { notice: 'invitation' },
      });
    });
  });
});
