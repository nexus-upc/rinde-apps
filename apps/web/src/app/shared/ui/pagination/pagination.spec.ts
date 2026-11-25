import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

@Component({
  imports: [Pagination],
  template: `<app-pagination
    [page]="page()"
    [size]="size()"
    [totalItems]="totalItems()"
    [disabled]="disabled()"
    (pageChange)="changed.push($event)"
  />`,
})
class PaginationHost {
  page = signal(0);
  size = signal(20);
  totalItems = signal(57);
  disabled = signal(false);
  changed: number[] = [];
}

describe('Pagination', () => {
  it('shows current and total pages and emits requested page index', () => {
    const fixture = TestBed.createComponent(PaginationHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const buttons = root.querySelectorAll('button');
    const prev = buttons[0] as HTMLButtonElement;
    const next = buttons[1] as HTMLButtonElement;

    expect(root.textContent).toContain('Página 1 de 3');
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    next.click();
    expect(fixture.componentInstance.changed).toEqual([1]);

    fixture.componentInstance.page.set(1);
    fixture.detectChanges();
    expect(root.textContent).toContain('Página 2 de 3');
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(false);

    prev.click();
    expect(fixture.componentInstance.changed).toEqual([1, 0]);

    fixture.componentInstance.page.set(2);
    fixture.detectChanges();
    expect(root.textContent).toContain('Página 3 de 3');
    expect(next.disabled).toBe(true);
  });

  it('handles zero items gracefully without emitting invalid pages', () => {
    const fixture = TestBed.createComponent(PaginationHost);
    fixture.componentInstance.totalItems.set(0);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const buttons = root.querySelectorAll('button');
    expect(root.textContent).toContain('Página 1 de 1');
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(true);
    expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);
  });
});
