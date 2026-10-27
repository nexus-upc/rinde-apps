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
        path: 'trips',
        loadComponent: () =>
          import('./features/trips/trips-placeholder/trips-placeholder').then(
            (module) => module.TripsPlaceholder,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'trips' },
    ],
  },
  { path: '**', redirectTo: '' },
];
