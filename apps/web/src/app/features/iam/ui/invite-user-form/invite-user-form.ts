import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ROLE_LABELS } from '@core/auth/auth.models';
import { AutoFocus } from '@shared/forms/autofocus';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { ASSIGNABLE_ROLES, InviteUserRequest, UserRole } from '../../models/iam.models';
import { revealErrors, showError } from '@shared/forms/field-errors';

/** Formulario de invitación sin consultas HTTP ni estado global. */
@Component({
  selector: 'app-invite-user-form',
  imports: [ReactiveFormsModule, UiButton, AutoFocus],
  templateUrl: './invite-user-form.html',
  styleUrl: './invite-user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteUserForm {
  readonly pending = input(false);
  readonly error = input<string | null>(null);
  readonly submitted = output<InviteUserRequest>();
  readonly cancelled = output<void>();
  protected readonly roles = ASSIGNABLE_ROLES;
  protected readonly roleLabels = ROLE_LABELS;
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    fullName: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    email: this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(150)]),
    role: this.fb.control<UserRole>('DRIVER', Validators.required),
  });
  protected submit(): void {
    if (this.pending()) return;
    if (this.form.invalid) {
      revealErrors(this.form);
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({ ...value, fullName: value.fullName.trim(), email: value.email.trim() });
  }
  protected isInvalid(name: 'fullName' | 'email'): boolean {
    const control = this.form.controls[name];
    return showError(control);
  }
}
