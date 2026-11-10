import { AbstractControl } from '@angular/forms';

/** El error se muestra cuando la persona escribió y salió del campo, o cuando intentó enviar. */
export function showError(control: AbstractControl): boolean {
  return control.invalid && control.touched && control.dirty;
}

/** Al enviar, todos los campos muestran sus errores aunque no se hayan tocado. */
export function revealErrors(control: AbstractControl): void {
  control.markAllAsTouched();
  control.markAllAsDirty();
}
