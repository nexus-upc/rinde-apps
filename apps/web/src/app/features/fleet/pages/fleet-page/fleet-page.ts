import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { FleetStore } from '../../state/fleet.store';
import { MaintenanceAlertList } from '../../ui/maintenance-alert-list/maintenance-alert-list';
import { MaintenanceForm } from '../../ui/maintenance-form/maintenance-form';
import { VehicleDetailModal } from '../../ui/vehicle-detail-modal/vehicle-detail-modal';
import { VehicleForm } from '../../ui/vehicle-form/vehicle-form';
import { VehicleList } from '../../ui/vehicle-list/vehicle-list';

/** Página principal del módulo de Flota: listado, registro, alertas e historial (US12, US32, US33 y US34). */
@Component({
  selector: 'app-fleet-page',
  providers: [FleetStore],
  imports: [
    PageHeader,
    StatePanel,
    UiButton,
    VehicleForm,
    VehicleList,
    VehicleDetailModal,
    MaintenanceForm,
    MaintenanceAlertList,
  ],
  templateUrl: './fleet-page.html',
  styleUrl: './fleet-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetPage {
  protected readonly store = inject(FleetStore);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);

  private readonly trigger = viewChild<UiButton, ElementRef<HTMLButtonElement>>('createTrigger', {
    read: ElementRef,
  });

  constructor() {
    const vehicleId = this.route.snapshot.queryParamMap.get('vehicleId');
    this.store.load(vehicleId);
  }

  protected closeCreate(): void {
    this.store.closeCreate();
    afterNextRender(() => this.trigger()?.nativeElement.focus(), { injector: this.injector });
  }

  protected onRecordRequested(vehicleId?: string): void {
    this.store.openRecordMaintenance(vehicleId);
  }
}
