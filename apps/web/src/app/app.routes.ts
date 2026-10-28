import { Routes } from '@angular/router';
import { adminGuard } from '@core/auth/admin.guard';
import { authGuard } from '@core/auth/auth.guard';
import { platformGuard } from '@core/auth/platform.guard';

export const routes: Routes = [
  {
    path: 'platform/sign-in',
    loadComponent: () =>
      import('./features/platform/pages/platform-sign-in').then((m) => m.PlatformSignIn),
  },
  {
    path: 'platform',
    canActivate: [platformGuard],
    canActivateChild: [platformGuard],
    loadComponent: () => import('./layout/platform-shell').then((m) => m.PlatformShell),
    children: [
      {
        path: 'mailbox',
        loadComponent: () =>
          import('./features/demo-mailbox/pages/mailbox-page').then((m) => m.MailboxPage),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/platform/platform.routes').then((m) => m.PLATFORM_ROUTES),
      },
    ],
  },
  // La raíz va al inicio; el guard decide entre el ingreso, el panel del dueño o la empresa.
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: '',
    loadChildren: () =>
      import('./features/iam/iam.routes').then((module) => module.IAM_ACCESS_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./layout/shell-layout').then((module) => module.ShellLayout),
    children: [
      {
        path: 'subscription',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/subscriptions/subscriptions.routes').then(
            (module) => module.SUBSCRIPTION_ROUTES,
          ),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/iam/iam.routes').then((module) => module.IAM_USER_ROUTES),
      },
      {
        path: 'home',
        loadChildren: () =>
          import('./features/home/home.routes').then((module) => module.HOME_ROUTES),
      },
      {
        path: 'trips',
        loadChildren: () =>
          import('./features/trips/trips.routes').then(
            (module) => module.TRIPS_ROUTES,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  { path: '**', redirectTo: '' },
];
