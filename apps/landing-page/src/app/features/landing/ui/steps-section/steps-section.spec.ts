import { TestBed } from '@angular/core/testing';
import { STEPS_CONTENT } from '../../pages/landing-page/landing-content';
import { StepsSection } from './steps-section';

describe('StepsSection', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(StepsSection);
    fixture.componentRef.setInput('content', STEPS_CONTENT);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('is the empezar section', () => {
    expect(render().querySelector('section')?.id).toBe('empezar');
  });

  it('lists five steps in an ordered list, numbered from 1 to 5', () => {
    const host = render();
    const list = host.querySelector('ol');
    const steps = Array.from(list?.querySelectorAll(':scope > li') ?? []);

    expect(steps.length).toBe(5);
    expect(
      Array.from(host.querySelectorAll('.step__number')).map((number) =>
        number.textContent?.trim(),
      ),
    ).toEqual(['1', '2', '3', '4', '5']);
    expect(steps.map((step) => step.lastElementChild?.textContent?.trim())).toEqual(
      STEPS_CONTENT.steps,
    );
  });

  it('gives the driver photo a text alternative', () => {
    expect(render().querySelector('img')?.getAttribute('alt')?.trim()).toBeTruthy();
  });
});
