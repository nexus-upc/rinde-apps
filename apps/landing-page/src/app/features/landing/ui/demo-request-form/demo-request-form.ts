import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { revealErrors, showError } from '@shared/forms/field-errors';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  DemoRequest,
  DemoRequestField,
  DemoRequestFieldErrors,
} from '../../models/demo-request.models';

const PHONE_PATTERN = /^\+?[\d\s()-]{6,30}$/;
const MESSAGE_LIMIT = 500;
const FIELD_ORDER: readonly DemoRequestField[] = [
  'fullName',
  'companyName',
  'email',
  'phone',
  'fleetSize',
  'message',
];

const text = (control: AbstractControl): string => String(control.value ?? '').trim();

const requiredText: ValidatorFn = (control): ValidationErrors | null =>
  text(control) === '' ? { required: true } : null;

const maxText =
  (max: number): ValidatorFn =>
  (control): ValidationErrors | null =>
    text(control).length > max ? { maxlength: { requiredLength: max } } : null;

const emailText: ValidatorFn = (control): ValidationErrors | null => {
  const value = text(control);
  return value === '' ? null : Validators.email(new FormControl(value));
};

const phoneText: ValidatorFn = (control): ValidationErrors | null => {
  const value = text(control);
  return value === '' || PHONE_PATTERN.test(value) ? null : { pattern: true };
};

const wholeNumber: ValidatorFn = (control): ValidationErrors | null =>
  control.value === null || Number.isInteger(control.value) ? null : { integer: true };

/** Formulario de solicitud de demostración: valida, muestra errores y emite la solicitud. */
@Component({
  selector: 'app-demo-request-form',
  imports: [ReactiveFormsModule, UiButton],
  templateUrl: './demo-request-form.html',
  styleUrl: './demo-request-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoRequestForm {
  readonly pending = input(false);
  readonly sent = input(false);
  readonly error = input<string | null>(null);
  readonly fieldErrors = input<DemoRequestFieldErrors>({});
  readonly submitted = output<DemoRequest>();
  readonly restarted = output<void>();

  protected readonly messageLimit = MESSAGE_LIMIT;
  protected readonly form = inject(NonNullableFormBuilder).group({
    fullName: ['', [requiredText, maxText(150)]],
    companyName: ['', [requiredText, maxText(120)]],
    email: ['', [requiredText, maxText(150), emailText]],
    phone: ['', [phoneText]],
    fleetSize: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(500),
      wholeNumber,
    ]),
    message: ['', [maxText(MESSAGE_LIMIT)]],
  });

  /** Campos que la persona modificó desde que llegó el último error del servidor. */
  private readonly edited = linkedSignal<DemoRequestFieldErrors, ReadonlySet<DemoRequestField>>({
    source: this.fieldErrors,
    computation: () => new Set(),
  });
  private readonly messageValue = toSignal(this.form.controls.message.valueChanges, {
    initialValue: '',
  });
  protected readonly messageLength = computed(() => this.messageValue().length);
  private readonly inputs = viewChildren<ElementRef<HTMLElement>>('field');

  constructor() {
    const changes = FIELD_ORDER.map((field) =>
      (this.form.controls[field] as AbstractControl).valueChanges.pipe(map(() => field)),
    );
    merge(...changes)
      .pipe(takeUntilDestroyed())
      .subscribe((field) => {
        if (!this.edited().has(field)) this.edited.update((set) => new Set(set).add(field));
      });
  }

  /** Mensaje visible del campo: el del servidor tiene prioridad hasta que se edite el campo. */
  protected errorOf(field: DemoRequestField): string | null {
    const server = this.fieldErrors()[field];
    if (server && !this.edited().has(field)) return server;
    const control = this.form.controls[field];
    return showError(control) ? clientMessage(field, control.errors) : null;
  }

  protected submit(): void {
    if (this.pending()) return;
    revealErrors(this.form);
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    const value = this.form.getRawValue();
    const phone = value.phone.trim();
    const message = value.message.trim();
    this.submitted.emit({
      fullName: value.fullName.trim(),
      companyName: value.companyName.trim(),
      email: value.email.trim(),
      ...(phone ? { phone } : {}),
      fleetSize: Number(value.fleetSize),
      ...(message ? { message } : {}),
    });
  }

  protected restart(): void {
    this.form.reset();
    this.restarted.emit();
  }

  private focusFirstInvalid(): void {
    const first = FIELD_ORDER.find((field) => this.form.controls[field].invalid);
    this.inputs()
      .find((ref) => ref.nativeElement.getAttribute('name') === first)
      ?.nativeElement.focus();
  }
}

function clientMessage(field: DemoRequestField, errors: ValidationErrors | null): string {
  const kind = errors ? Object.keys(errors)[0] : undefined;
  switch (field) {
    case 'fullName':
      return kind === 'maxlength'
        ? 'El nombre admite hasta 150 caracteres.'
        : 'Ingrese su nombre completo.';
    case 'companyName':
      return kind === 'maxlength'
        ? 'El nombre de la empresa admite hasta 120 caracteres.'
        : 'Ingrese el nombre de su empresa.';
    case 'email':
      return kind === 'maxlength'
        ? 'El correo admite hasta 150 caracteres.'
        : 'Ingrese un correo electrónico válido.';
    case 'phone':
      return 'Ingrese un teléfono válido o deje el campo vacío.';
    case 'fleetSize':
      return 'La cantidad de unidades debe estar entre 1 y 500.';
    case 'message':
      return 'El mensaje admite hasta 500 caracteres.';
  }
}
