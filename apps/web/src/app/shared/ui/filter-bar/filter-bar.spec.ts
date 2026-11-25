import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FilterBar } from './filter-bar';

@Component({
  imports: [FilterBar],
  template: `<app-filter-bar [canClear]="canClear()" (cleared)="clearCount = clearCount + 1">
    <div class="field">
      <label class="field__label" for="test-status">Estado</label>
      <select class="field__select" id="test-status">
        <option value="">Todos</option>
      </select>
    </div>
  </app-filter-bar>`,
})
class FilterHost {
  canClear = signal(true);
  clearCount = 0;
}

describe('FilterBar', () => {
  it('projects filter fields and emits cleared when the clear button is pressed', () => {
    const fixture = TestBed.createComponent(FilterHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#test-status')).not.toBeNull();

    const clearButton = root.querySelector('.filter-bar__clear') as HTMLButtonElement;
    clearButton.click();
    expect(fixture.componentInstance.clearCount).toBe(1);

    fixture.componentInstance.canClear.set(false);
    fixture.detectChanges();
    expect(clearButton.disabled).toBe(true);
  });
});
