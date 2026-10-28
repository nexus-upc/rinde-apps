import { Routes } from '@angular/router';

export const TRIPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./trips-placeholder/trips-placeholder').then((m) => m.TripsPlaceholder),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/trip-detail-page').then((m) => m.TripDetailPage),
  },
];
