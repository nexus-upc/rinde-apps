import { Routes } from '@angular/router';

export const FLEET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/fleet-page/fleet-page').then((module) => module.FleetPage),
  },
];
