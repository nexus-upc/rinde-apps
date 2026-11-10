import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { DriversStore } from '../../state/drivers.store';
import { DriverDetailModal } from '../../ui/driver-detail-modal/driver-detail-modal';
import { DriverForm } from '../../ui/driver-form/driver-form';
import { DriverList } from '../../ui/driver-list/driver-list';

/** Página principal del módulo de Conductores: listado, alta y selector de cuentas DRIVER (US13). */
@Component({
  selector: 'app-drivers-page',
  providers: [DriversStore],
  imports: [PageHeader, StatePanel, UiButton, DriverForm, DriverList, DriverDetailModal],
  templateUrl: './drivers-page.html',
  styleUrl: './drivers-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversPage {
  protected readonly store = inject(DriversStore);
  private readonly injector = inject(Injector);

  private readonly trigger = viewChild<UiButton, ElementRef<HTMLButtonElement>>('createTrigger', {
    read: ElementRef,
  });

  constructor() {
    this.store.load();
  }

  protected closeCreate(): void {
    this.store.closeCreate();
    afterNextRender(() => this.trigger()?.nativeElement.focus(), { injector: this.injector });
  }
}
