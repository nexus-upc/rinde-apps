import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { SettlementTripStatus, TRIP_STATUS_LABELS } from '../../models/settlement.models';
import { SettlementStore } from '../../state/settlement.store';
import { AdvanceForm } from '../../ui/advance-form/advance-form';
import { AdvanceList } from '../../ui/advance-list/advance-list';
import { SettlementCloseModal } from '../../ui/settlement-close-modal/settlement-close-modal';
import { SettlementSummary } from '../../ui/settlement-summary/settlement-summary';

/** Pantalla de gestión de anticipos y liquidación por viaje (US25, US26, US27 y US35). */
@Component({
  selector: 'app-settlements-page',
  providers: [SettlementStore],
  imports: [
    FormsModule,
    RouterLink,
    PageHeader,
    StatePanel,
    UiButton,
    AdvanceForm,
    AdvanceList,
    SettlementSummary,
    SettlementCloseModal,
  ],
  templateUrl: './settlements-page.html',
  styleUrl: './settlements-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettlementsPage implements OnInit {
  protected readonly store = inject(SettlementStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly inputTripId = signal('');

  ngOnInit(): void {
    this.store.loadTrips();

    const routeTripId =
      this.route.snapshot.paramMap?.get('tripId') ??
      this.route.snapshot.queryParamMap?.get('tripId');
    if (routeTripId) {
      this.inputTripId.set(routeTripId);
      this.store.loadTrip(routeTripId);
    }
  }

  protected selectTripFromList(tripId: string): void {
    this.inputTripId.set(tripId);
    if (tripId) {
      this.store.loadTrip(tripId);
    }
  }

  protected searchByTripId(): void {
    const tripId = this.inputTripId().trim();
    if (tripId) {
      this.store.loadTrip(tripId);
    }
  }

  protected retryTrip(): void {
    if (this.store.tripId()) {
      this.store.loadTrip(this.store.tripId());
    }
  }

  protected tripStatusLabel(status: SettlementTripStatus): string {
    return TRIP_STATUS_LABELS[status] ?? status;
  }
}
