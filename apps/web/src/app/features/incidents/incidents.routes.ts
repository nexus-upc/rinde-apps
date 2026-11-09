import { Routes } from '@angular/router';

export const INCIDENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/incidents-page/incidents-page').then((module) => module.IncidentsPage),
  },
];
