import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrandMark } from './brand-mark';

@Component({
  template: '<app-brand-mark [size]="size" />',
  imports: [BrandMark],
})
class HostComponent {
  size = 16;
}

describe('BrandMark', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('exposes the name as text and hides the logo from assistive technology', () => {
    const fixture = TestBed.createComponent(BrandMark);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent?.trim()).toBe('Rinde');
    expect(host.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelectorAll('path')[1]?.getAttribute('fill')).toBe('currentColor');
    expect(host.querySelector('path')?.getAttribute('fill')).toMatch(/^url\(#rinde-logo-gradient-/);
  });

  it('draws the horizontal logo 24 px high by default, keeping its proportion', () => {
    const fixture = TestBed.createComponent(BrandMark);
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(svg?.getAttribute('height')).toBe('24');
    expect(svg?.getAttribute('width')).toBe('86');
  });

  it('follows the size input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(svg?.getAttribute('height')).toBe('16');
  });
});
