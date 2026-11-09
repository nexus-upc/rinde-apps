import { Routes } from '@angular/router';

export const DRIVERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/drivers-page/drivers-page').then((module) => module.DriversPage),
  },
];
