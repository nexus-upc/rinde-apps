import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoFocus } from '@shared/forms/autofocus';
import { revealErrors, showError } from '@shared/forms/field-errors';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  CreateDriverPayload,
  DOCUMENT_TYPES,
  DriverUserAccount,
  LICENSE_CATEGORIES,
} from '../../models/driver.models';

/** Formulario para dar de alta un conductor con selector de cuentas DRIVER de la empresa. */
@Component({
  selector: 'app-driver-form',
  imports: [ReactiveFormsModule, UiButton, AutoFocus],
  templateUrl: './driver-form.html',
  styleUrl: './driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverForm {
  readonly accounts = input<readonly DriverUserAccount[]>([]);
  readonly pending = input(false);
  readonly error = input<string | null>(null);

  readonly submitted = output<CreateDriverPayload>();
  readonly cancelled = output<void>();

  protected readonly documentTypes = DOCUMENT_TYPES;
  protected readonly licenseCategories = LICENSE_CATEGORIES;

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    fullName: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    documentType: this.fb.control<string>('DNI', [Validators.required]),
    documentNumber: this.fb.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(20),
    ]),
    licenseNumber: this.fb.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(20),
    ]),
    licenseCategory: this.fb.control<string>('A-IIb', [Validators.required]),
    licenseExpirationDate: this.fb.control('', [Validators.required]),
    userId: this.fb.control<string>(''),
  });

  protected onAccountSelected(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedId = select.value;
    if (selectedId) {
      const match = this.accounts().find((acc) => acc.id === selectedId);
      if (match && !this.form.controls.fullName.value.trim()) {
        this.form.controls.fullName.setValue(match.fullName);
      }
    }
  }

  protected submit(): void {
    if (this.pending()) return;
    if (this.form.invalid) {
      revealErrors(this.form);
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      fullName: value.fullName.trim(),
      documentType: value.documentType,
      documentNumber: value.documentNumber.trim(),
      licenseNumber: value.licenseNumber.trim().toUpperCase(),
      licenseCategory: value.licenseCategory,
      licenseExpirationDate: value.licenseExpirationDate,
      userId: value.userId.trim() ? value.userId.trim() : null,
    });
  }

  protected isInvalid(
    name:
      | 'fullName'
      | 'documentType'
      | 'documentNumber'
      | 'licenseNumber'
      | 'licenseCategory'
      | 'licenseExpirationDate',
  ): boolean {
    const control = this.form.controls[name];
    return showError(control);
  }
}
