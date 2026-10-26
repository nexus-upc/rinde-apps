import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SignIn } from './sign-in';

const STORAGE_KEY = 'rinde.accessToken';
const SIGN_IN_URL = `${environment.apiBaseUrl}/api/v1/auth/sign-in`;
const TOKEN = [
  btoa('{"alg":"HS256"}'),
  btoa(`{"email":"admin@rinde.test","role":"ADMINISTRATOR","exp":${Math.floor(Date.now() / 1000) + 3600}}`),
  'firma-de-prueba',
].join('.');

describe('SignIn', () => {
  let fixture: ComponentFixture<SignIn>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SignIn],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SignIn);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  function field(id: 'email' | 'password'): HTMLInputElement {
    return fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
  }

  function submitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  function type(id: 'email' | 'password', value: string): void {
    field(id).value = value;
    field(id).dispatchEvent(new Event('input'));
    field(id).dispatchEvent(new Event('blur'));
  }

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function submit(): void {
    submitButton().click();
    fixture.detectChanges();
  }

  it('shows the required-field messages in Spanish and sends nothing when the form is empty', () => {
    submit();

    expect(text()).toContain('Ingrese su correo electrónico.');
    expect(text()).toContain('Ingrese su contraseña.');
    http.expectNone(SIGN_IN_URL);
  });

  it('rejects an email with an invalid format', () => {
    type('email', 'ana.rojas');
    type('password', 'clave-de-prueba');
    submit();

    expect(text()).toContain('Ingrese un correo electrónico válido.');
    http.expectNone(SIGN_IN_URL);
  });

  it('shows the backend detail when the credentials are wrong', () => {
    type('email', 'admin@rinde.test');
    type('password', 'incorrecta');
    submit();

    http
      .expectOne(SIGN_IN_URL)
      .flush(
        {
          status: 401,
          title: 'Unauthorized',
          detail: 'El correo o la contraseña son incorrectos.',
        },
        { status: 401, statusText: 'Unauthorized' },
      );
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('El correo o la contraseña son incorrectos.');
    expect(submitButton().disabled).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('disables the button while the request is pending and goes to the trips page on success', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    type('email', 'admin@rinde.test');
    type('password', 'clave-de-prueba');
    submit();

    expect(submitButton().disabled).toBe(true);

    http
      .expectOne(SIGN_IN_URL)
      .flush({ accessToken: TOKEN, tokenType: 'Bearer', expiresInSeconds: 28800 });

    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(TOKEN);
    expect(navigate).toHaveBeenCalledWith('/trips');
  });
});
