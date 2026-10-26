import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'sign-in',
    loadComponent: () => import('./features/auth/sign-in/sign-in').then((m) => m.SignIn),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'recover',
    loadComponent: () => import('./features/auth/recover/recover').then((m) => m.Recover),
  },
  {
    path: 'reset-password',
    data: { mode: 'reset' },
    loadComponent: () =>
      import('./features/auth/define-password/define-password').then((m) => m.DefinePassword),
  },
  {
    path: 'accept-invitation',
    data: { mode: 'invitation' },
    loadComponent: () =>
      import('./features/auth/define-password/define-password').then((m) => m.DefinePassword),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/shell-layout').then((m) => m.ShellLayout),
    children: [
      {
        path: 'subscription',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/subscriptions/subscription-page').then((m) => m.SubscriptionPage),
      },
      {
        path: 'trips',
        loadComponent: () =>
          import('./features/trips/trips-placeholder/trips-placeholder').then(
            (m) => m.TripsPlaceholder,
          ),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/users-page/users-page').then((m) => m.UsersPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'trips' },
    ],
  },
  { path: '**', redirectTo: '' },
];
