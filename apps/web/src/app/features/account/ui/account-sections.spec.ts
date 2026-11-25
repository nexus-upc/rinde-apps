import { TestBed } from '@angular/core/testing';
import { AccountProfileSection } from './account-profile-section/account-profile-section';
import { AccountSecuritySection } from './account-security-section/account-security-section';
import { CompanyProfileSection } from './company-profile-section/company-profile-section';

describe('Account section shells', () => {
  it('renders profile, security and company shell titles', () => {
    const profile = TestBed.createComponent(AccountProfileSection);
    profile.componentRef.setInput('fullName', 'Ana Torres Vega');
    profile.detectChanges();
    expect(profile.nativeElement.textContent).toContain('Editar perfil');
    expect(profile.nativeElement.textContent).toContain('Ana Torres Vega');

    const security = TestBed.createComponent(AccountSecuritySection);
    security.detectChanges();
    expect(security.nativeElement.textContent).toContain('Cambio de contraseña');

    const company = TestBed.createComponent(CompanyProfileSection);
    company.componentRef.setInput('canEdit', true);
    company.detectChanges();
    expect(company.nativeElement.textContent).toContain('Datos de la empresa');
  });
});
