import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { SessionProfileStore } from '@features/iam/state/session-profile.store';
import { CurrentUser } from '@features/iam/models/iam.models';
import { ShellLayout } from './shell-layout';

const PROFILE: CurrentUser = {
  id: 'user-a',
  fullName: 'Ana Rojas',
  email: 'ana.rojas@example.test',
  role: 'ADMINISTRATOR',
  status: 'ACTIVE',
  tenant: { id: 'tenant-a', tradeName: 'Transportes Andes', ruc: '20123456789', status: 'ACTIVE' },
};

describe('ShellLayout', () => {
  let fixture: ComponentFixture<ShellLayout>;
  const signOut = vi.fn();
  const root = () => fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    Array.from(root().querySelectorAll('button')).find((item) => item.textContent?.includes(label));

  beforeEach(() => {
    signOut.mockReset();
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    TestBed.configureTestingModule({
      imports: [ShellLayout],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: signal({ scope: 'TENANT', email: PROFILE.email, role: 'ADMINISTRATOR' }),
            roleLabel: signal('Administrador'),
            signOut,
          },
        },
        { provide: SessionProfileStore, useValue: { profile: signal(PROFILE) } },
      ],
    });
    fixture = TestBed.createComponent(ShellLayout);
    fixture.detectChanges();
  });

  it('shows the company, the sections and the account of the session', () => {
    expect(root().textContent).toContain('Transportes Andes');
    expect(root().textContent).toContain('Usuarios');
    expect(root().textContent).toContain('Ana Rojas');
    expect(root().querySelector('.shell__avatar')?.textContent).toBe('AR');
    expect(root().querySelector('[role="menu"]')).toBeNull();
  });

  it('opens the account menu and closes it with Escape', () => {
    button('Ana Rojas')!.click();
    fixture.detectChanges();
    expect(root().querySelector('[role="menu"]')).not.toBeNull();
    expect(button('Ana Rojas')!.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(root().querySelector('[role="menu"]')).toBeNull();
  });

  it('opens the settings with the real profile and signs out from the menu', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    button('Ana Rojas')!.click();
    fixture.detectChanges();
    button('Ajustes')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = root().querySelector('dialog');
    expect(dialog?.textContent).toContain('20123456789');
    expect(dialog?.textContent).toContain('Activa');

    button('Seguridad')!.click();
    fixture.detectChanges();
    expect(dialog?.textContent).toContain('Seguridad llegará pronto');

    Array.from(dialog!.querySelectorAll('button'))
      .find((item) => item.textContent?.includes('Cerrar sesión'))!
      .click();
    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/sign-in');
  });
});
