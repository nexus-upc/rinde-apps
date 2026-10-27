import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { RequestAction } from './request-action';

@Component({ template: '' })
class ActionHost {
  readonly action = new RequestAction(inject(DestroyRef));
}

describe('RequestAction', () => {
  it('accepts a single submission while the request is pending', () => {
    const fixture = TestBed.createComponent(ActionHost);
    const request = new Subject<number>();
    const next = vi.fn();
    const options = { onSuccess: next, errorMessage: 'Error de prueba.' };
    expect(fixture.componentInstance.action.run(request, options)).toBe(true);
    expect(fixture.componentInstance.action.run(request, options)).toBe(false);
    request.next(42);
    request.complete();
    expect(next).toHaveBeenCalledExactlyOnceWith(42);
    expect(fixture.componentInstance.action.pending()).toBe(false);
  });
  it('does not apply a late response after the page is destroyed', () => {
    const fixture = TestBed.createComponent(ActionHost);
    const request = new Subject<number>();
    const next = vi.fn();
    fixture.componentInstance.action.run(request, { onSuccess: next, errorMessage: 'Error.' });
    fixture.destroy();
    request.next(42);
    request.complete();
    expect(next).not.toHaveBeenCalled();
  });
  it('shows the server detail and clears the error when retrying', () => {
    const fixture = TestBed.createComponent(ActionHost);
    const failed = new Subject<number>();
    const options = { onSuccess: vi.fn(), errorMessage: 'Error.' };
    const action = fixture.componentInstance.action;
    action.run(failed, options);
    failed.error(
      new HttpErrorResponse({ status: 409, error: { detail: 'El correo ya está registrado.' } }),
    );
    expect(action.error()).toBe('El correo ya está registrado.');
    const retry = new Subject<number>();
    action.run(retry, options);
    expect(action.error()).toBeNull();
    expect(action.pending()).toBe(true);
    retry.complete();
  });
});
