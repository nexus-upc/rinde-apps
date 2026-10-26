import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'sign-in',
    loadComponent: () => import('./features/auth/sign-in/sign-in').then((m) => m.SignIn),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/shell-layout').then((m) => m.ShellLayout),
    children: [
      {
        path: 'trips',
        loadComponent: () =>
          import('./features/trips/trips-placeholder/trips-placeholder').then(
            (m) => m.TripsPlaceholder,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'trips' },
    ],
  },
  { path: '**', redirectTo: '' },
];
