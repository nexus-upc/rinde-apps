import { Routes } from '@angular/router';

export const TRIPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/trips-dashboard-page').then((m) => m.TripsDashboardPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/trip-detail-page').then((m) => m.TripDetailPage),
  },
];
