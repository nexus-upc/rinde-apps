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

  it('exposes the name as text and hides the symbol from assistive technology', () => {
    const fixture = TestBed.createComponent(BrandMark);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent?.trim()).toBe('Rinde');
    expect(host.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('path')?.getAttribute('fill')).toBe('currentColor');
  });

  it('draws the symbol at 24 px by default', () => {
    const fixture = TestBed.createComponent(BrandMark);
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('follows the size input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(svg?.getAttribute('width')).toBe('16');
  });
});
