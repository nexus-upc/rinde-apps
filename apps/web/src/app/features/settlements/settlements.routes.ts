import { Routes } from '@angular/router';

export const SETTLEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/settlements-page/settlements-page').then((module) => module.SettlementsPage),
  },
  {
    path: ':tripId',
    loadComponent: () =>
      import('./pages/settlements-page/settlements-page').then((module) => module.SettlementsPage),
  },
];
