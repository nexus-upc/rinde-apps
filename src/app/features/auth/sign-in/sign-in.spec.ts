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

/** Ventana simulada: jsdom no trae matchMedia, así que el ancho se decide aquí antes de crear la pantalla. */
let wideScreen = false;

function stubMatchMedia(): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: wideScreen && query === '(min-width: 1100px)',
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}

describe('SignIn', () => {
  let fixture: ComponentFixture<SignIn>;
  let http: HttpTestingController;
  let router: Router;

  function createFixture(): void {
    fixture = TestBed.createComponent(SignIn);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.clear();
    wideScreen = false;
    stubMatchMedia();
    await TestBed.configureTestingModule({
      imports: [SignIn],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
    delete (window as { matchMedia?: unknown }).matchMedia;
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
    createFixture();
    submit();

    expect(text()).toContain('Ingrese su correo electrónico.');
    expect(text()).toContain('Ingrese su contraseña.');
    http.expectNone(SIGN_IN_URL);
  });

  it('rejects an email with an invalid format', () => {
    createFixture();
    type('email', 'ana.rojas');
    type('password', 'clave-de-prueba');
    submit();

    expect(text()).toContain('Ingrese un correo electrónico válido.');
    http.expectNone(SIGN_IN_URL);
  });

  it('shows the backend detail when the credentials are wrong', () => {
    createFixture();
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
    createFixture();
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

  it('does not mount the entrance preview below 1100 px', () => {
    wideScreen = false;
    createFixture();

    expect(fixture.nativeElement.querySelector('app-entrance-preview')).toBeNull();
  });

  it('mounts the entrance preview at 1100 px, hidden from assistive technology and inert', () => {
    wideScreen = true;
    createFixture();

    const preview = fixture.nativeElement.querySelector('app-entrance-preview') as HTMLElement;
    expect(preview).not.toBeNull();
    expect(preview.getAttribute('aria-hidden')).toBe('true');
    expect(preview.hasAttribute('inert')).toBe(true);
    expect(preview.querySelector('button, a, input, select, textarea, [tabindex]')).toBeNull();
  });
});
