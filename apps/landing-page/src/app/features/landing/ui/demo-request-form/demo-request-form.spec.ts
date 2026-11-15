import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemoRequest, DemoRequestFieldErrors } from '../../models/demo-request.models';
import { DemoRequestForm } from './demo-request-form';

@Component({
  imports: [DemoRequestForm],
  template: `<app-demo-request-form
    [pending]="pending()"
    [sent]="sent()"
    [error]="error()"
    [fieldErrors]="fieldErrors()"
    (submitted)="emitted.push($event)"
    (restarted)="restarts = restarts + 1"
  />`,
})
class Host {
  readonly pending = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);
  readonly fieldErrors = signal<DemoRequestFieldErrors>({});
  readonly emitted: DemoRequest[] = [];
  restarts = 0;
}

describe('DemoRequestForm', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;

  const control = (id: string) => root.querySelector<HTMLInputElement>(`#demo-${id}`)!;
  const type = (id: string, value: string) => {
    const element = control(id);
    element.value = value;
    element.dispatchEvent(new Event('input'));
    element.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };
  const submit = () => {
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const fillValid = () => {
    type('fullName', '  Ana Torres  ');
    type('companyName', ' Transportes Andes SAC ');
    type('email', ' ana@example.com ');
    type('fleetSize', '12');
  };
  const errorText = (id: string) =>
    root.querySelector(`#demo-${id}-error`)?.textContent?.trim() ?? null;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('does not emit an empty form and shows the required errors', () => {
    submit();
    expect(host.emitted).toHaveLength(0);
    expect(errorText('fullName')).toBe('Ingrese su nombre completo.');
    expect(errorText('companyName')).toBe('Ingrese el nombre de su empresa.');
    expect(errorText('email')).toBe('Ingrese un correo electrónico válido.');
    expect(errorText('fleetSize')).toBe('La cantidad de unidades debe estar entre 1 y 500.');
    expect(errorText('phone')).toBeNull();
    expect(control('fullName').getAttribute('aria-invalid')).toBe('true');
    expect(control('fullName').getAttribute('aria-describedby')).toBe('demo-fullName-error');
    expect(document.activeElement).toBe(control('fullName'));
  });

  it('shows the email error for an invalid address', () => {
    fillValid();
    type('email', 'no-es-un-correo');
    submit();
    expect(host.emitted).toHaveLength(0);
    expect(errorText('email')).toBe('Ingrese un correo electrónico válido.');
    expect(document.activeElement).toBe(control('email'));
  });

  it('rejects an invalid phone and an out of range fleet size', () => {
    fillValid();
    type('phone', 'abc');
    type('fleetSize', '501');
    submit();
    expect(host.emitted).toHaveLength(0);
    expect(errorText('phone')).toBe('Ingrese un teléfono válido o deje el campo vacío.');
    expect(errorText('fleetSize')).toBe('La cantidad de unidades debe estar entre 1 y 500.');
  });

  it('emits a trimmed request without empty optionals', () => {
    fillValid();
    submit();
    expect(host.emitted).toEqual([
      {
        fullName: 'Ana Torres',
        companyName: 'Transportes Andes SAC',
        email: 'ana@example.com',
        fleetSize: 12,
      },
    ]);
    expect('phone' in host.emitted[0]!).toBe(false);
    expect('message' in host.emitted[0]!).toBe(false);
  });

  it('includes the optional fields when present', () => {
    fillValid();
    type('phone', '+51 987 654 321');
    type('message', '  Quiero ver la demo.  ');
    submit();
    expect(host.emitted[0]).toMatchObject({
      phone: '+51 987 654 321',
      message: 'Quiero ver la demo.',
    });
  });

  it('shows server field errors until the field is edited', () => {
    fillValid();
    host.fieldErrors.set({ fleetSize: 'La cantidad de unidades debe estar entre 1 y 500.' });
    fixture.detectChanges();
    expect(errorText('fleetSize')).toBe('La cantidad de unidades debe estar entre 1 y 500.');
    expect(control('fleetSize').getAttribute('aria-invalid')).toBe('true');
    type('fleetSize', '20');
    expect(errorText('fleetSize')).toBeNull();
  });

  it('shows the general error as an alert and keeps the submit button loading state', () => {
    host.error.set('No se pudo enviar la solicitud. Intente nuevamente.');
    host.pending.set(true);
    fixture.detectChanges();
    expect(root.querySelector('.form-alert')?.getAttribute('role')).toBe('alert');
    expect(root.querySelector('button[type="submit"]')?.classList).toContain('is-loading');
  });

  it('shows the confirmation and restarts with a clean form', () => {
    fillValid();
    host.sent.set(true);
    fixture.detectChanges();
    expect(root.querySelector('form')).toBeNull();
    const status = root.querySelector('[role="status"]');
    expect(status?.textContent).toContain('Recibimos su solicitud.');
    root.querySelector<HTMLButtonElement>('[role="status"] button')!.click();
    host.sent.set(false);
    fixture.detectChanges();
    expect(host.restarts).toBe(1);
    expect(control('fullName').value).toBe('');
  });
});
