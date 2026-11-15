import { TestBed } from '@angular/core/testing';
import { FaqContent } from '../../models/landing-content.models';
import { FaqSection } from './faq-section';

const CONTENT: FaqContent = {
  intro: { title: 'Título', lead: 'Introducción' },
  items: [
    { id: 'one', question: 'Primera', answer: 'Respuesta uno' },
    { id: 'two', question: 'Segunda', answer: 'Respuesta dos' },
  ],
};

describe('FaqSection', () => {
  function setup() {
    const fixture = TestBed.createComponent(FaqSection);
    fixture.componentRef.setInput('content', CONTENT);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const triggers = Array.from(host.querySelectorAll<HTMLButtonElement>('button'));
    const panels = Array.from(host.querySelectorAll<HTMLElement>('[role="region"]'));
    const click = (button: HTMLButtonElement | undefined) => {
      button?.click();
      fixture.detectChanges();
    };
    return { triggers, panels, click };
  }

  it('starts with every answer closed and wires each button to its region', () => {
    const { triggers, panels } = setup();

    expect(triggers.map((button) => button.getAttribute('aria-expanded'))).toEqual([
      'false',
      'false',
    ]);
    expect(panels.every((panel) => panel.hidden)).toBe(true);
    triggers.forEach((button, index) => {
      expect(button.getAttribute('aria-controls')).toBe(panels[index]?.id);
    });
  });

  it('opens a question and closes the previous one', () => {
    const { triggers, panels, click } = setup();

    click(triggers[0]);
    expect(triggers[0]?.getAttribute('aria-expanded')).toBe('true');
    expect(panels[0]?.hidden).toBe(false);

    click(triggers[1]);
    expect(triggers[0]?.getAttribute('aria-expanded')).toBe('false');
    expect(panels[0]?.hidden).toBe(true);
    expect(triggers[1]?.getAttribute('aria-expanded')).toBe('true');
    expect(panels[1]?.hidden).toBe(false);
  });

  it('closes the open question when it is pressed again', () => {
    const { triggers, panels, click } = setup();

    click(triggers[0]);
    click(triggers[0]);

    expect(triggers[0]?.getAttribute('aria-expanded')).toBe('false');
    expect(panels[0]?.hidden).toBe(true);
  });
});
