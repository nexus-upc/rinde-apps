import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { TripDetailStore } from '../state/trip-detail.store';
import { TripAssignmentForm } from '../ui/trip-assignment-form/trip-assignment-form';
import { TripInfo } from '../ui/trip-info/trip-info';

/** Página contenedora para consultar el detalle de un viaje y asignar sus recursos. */
@Component({
  selector: 'app-trip-detail-page',
  providers: [TripDetailStore],
  imports: [PageHeader, StatePanel, UiButton, TripInfo, TripAssignmentForm],
  templateUrl: './trip-detail-page.html',
  styleUrl: './trip-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripDetailPage implements OnInit {
  protected readonly store = inject(TripDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private tripId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tripId = id;
      this.store.load(id);
    }
  }

  retry(): void {
    if (this.tripId) {
      this.store.load(this.tripId);
    }
  }

  goBack(): void {
    void this.router.navigate(['/trips']);
  }
}
