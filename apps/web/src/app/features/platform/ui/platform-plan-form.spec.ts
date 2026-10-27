import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlatformPlanForm } from './platform-plan-form';
import { CreatePlan } from '../models/platform.models';

describe('PlatformPlanForm', () => {
  let fixture: ComponentFixture<PlatformPlanForm>;
  let submitted: CreatePlan[];
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PlatformPlanForm] });
    fixture = TestBed.createComponent(PlatformPlanForm);
    submitted = [];
    fixture.componentInstance.create.subscribe((value) => submitted.push(value));
    fixture.detectChanges();
  });
  function fill(selector: string, value: string) {
    const control = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      selector,
    )!;
    control.value = value;
    control.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function submit() {
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }
  it('keeps an invalid or unreasoned plan out of the catalog', () => {
    submit();
    expect(submitted).toEqual([]);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent,
    ).toContain('Completa');
  });
  it('emits normalized fields and a reason for the audited creation', () => {
    fill('#plan-name', '  Plan de prueba  ');
    fill('#plan-price', '99.90');
    fill('#plan-limit', '10');
    fill('#plan-reason', '  Nueva oferta comercial  ');
    submit();
    expect(submitted).toEqual([
      {
        name: 'Plan de prueba',
        monthlyPrice: 99.9,
        unitLimit: 10,
        reason: 'Nueva oferta comercial',
      },
    ]);
  });
  it('disables the fields and submit button during the pending request', () => {
    fixture.componentRef.setInput('pending', true);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('fieldset')?.disabled).toBe(true);
    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  });
});
