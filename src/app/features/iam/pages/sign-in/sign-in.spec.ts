import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { SignIn } from './sign-in';

const STORAGE_KEY = 'rinde.accessToken';
const SIGN_IN_URL = `${environment.apiBaseUrl}/api/v1/auth/sign-in`;
const TOKEN = [
  btoa('{"alg":"HS256"}'),
  btoa(
    `{"email":"admin@rinde.test","role":"ADMINISTRATOR","exp":${Math.floor(Date.now() / 1000) + 3600}}`,
  ),
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

  function button(label: string): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (candidate) => (candidate as HTMLButtonElement).textContent?.trim() === label,
    ) as HTMLButtonElement;
  }

  function startWithEmail(): void {
    button('Continuar con correo').click();
    fixture.detectChanges();
  }

  function continueTo(email: string): void {
    startWithEmail();
    type('email', email);
    submit();
  }

  it('starts by choosing the email method, without asking for the email yet', () => {
    createFixture();

    expect(field('email')).toBeNull();
    startWithEmail();

    expect(fixture.nativeElement.querySelector('h1').getAttribute('aria-label')).toBe('Tu correo');
    expect(field('email')).not.toBeNull();

    button('Otra forma de entrar').click();
    fixture.detectChanges();
    expect(field('email')).toBeNull();
  });

  it('asks for the email and shows the required message in Spanish', () => {
    createFixture();
    startWithEmail();
    submit();

    expect(text()).toContain('Ingrese su correo electrónico.');
    expect(field('password')).toBeNull();
    http.expectNone(SIGN_IN_URL);
  });

  it('rejects an email with an invalid format and stays on the first step', () => {
    createFixture();
    continueTo('ana.rojas');

    expect(text()).toContain('Ingrese un correo electrónico válido.');
    expect(field('password')).toBeNull();
    http.expectNone(SIGN_IN_URL);
  });

  it('moves to the password step showing the email, and can go back to change it', () => {
    createFixture();
    continueTo('admin@rinde.test');

    expect(fixture.nativeElement.querySelector('h1').getAttribute('aria-label')).toBe(
      'Hola de nuevo',
    );
    expect(text()).toContain('admin@rinde.test');
    expect(field('password')).not.toBeNull();

    button('Cambiar').click();
    fixture.detectChanges();

    expect(field('email').value).toBe('admin@rinde.test');
    expect(field('password')).toBeNull();
  });

  it('requires the password before sending', () => {
    createFixture();
    continueTo('admin@rinde.test');
    submit();

    expect(text()).toContain('Ingrese su contraseña.');
    http.expectNone(SIGN_IN_URL);
  });

  it('shows the backend detail when the credentials are wrong', () => {
    createFixture();
    continueTo('admin@rinde.test');
    type('password', 'incorrecta');
    submit();

    http.expectOne(SIGN_IN_URL).flush(
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

  it('shows the spinner while the request is pending and goes to the trips page on success', () => {
    createFixture();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    continueTo('admin@rinde.test');
    type('password', 'clave-de-prueba');
    submit();

    expect(submitButton().disabled).toBe(true);
    expect(submitButton().getAttribute('aria-busy')).toBe('true');
    expect(submitButton().querySelector('.ui-button__spinner')).not.toBeNull();

    http
      .expectOne(SIGN_IN_URL)
      .flush({ accessToken: TOKEN, tokenType: 'Bearer', expiresInSeconds: 28800 });

    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(TOKEN);
    expect(navigate).toHaveBeenCalledWith('/trips');
  });

  it('announces the title once and animates its words separately', () => {
    createFixture();
    const title = fixture.nativeElement.querySelector('h1') as HTMLElement;

    expect(title.getAttribute('aria-label')).toBe('Inicia sesión en Rinde');
    expect(title.querySelectorAll('.arc-entrance-word[aria-hidden="true"]').length).toBe(4);
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
