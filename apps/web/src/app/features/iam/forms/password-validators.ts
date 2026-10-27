import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

export const PASSWORD_VALIDATORS = [
  Validators.required,
  Validators.minLength(8),
  Validators.maxLength(72),
];

export function matchingPasswords(group: AbstractControl): ValidationErrors | null {
  const value = group.value as { password: string; confirmation: string };
  return value.confirmation !== '' && value.password !== value.confirmation
    ? { mismatch: true }
    : null;
}
