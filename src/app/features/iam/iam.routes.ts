import { Routes } from '@angular/router';

export const IAM_ACCESS_ROUTES: Routes = [
  {
    path: 'sign-in',
    loadComponent: () => import('./pages/sign-in/sign-in').then((module) => module.SignIn),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((module) => module.Register),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./pages/verify-email/verify-email').then((module) => module.VerifyEmail),
  },
  {
    path: 'recover',
    loadComponent: () => import('./pages/recover/recover').then((module) => module.Recover),
  },
  {
    path: 'reset-password',
    data: { mode: 'reset' },
    loadComponent: () =>
      import('./pages/define-password/define-password').then((module) => module.DefinePassword),
  },
  {
    path: 'accept-invitation',
    data: { mode: 'invitation' },
    loadComponent: () =>
      import('./pages/define-password/define-password').then((module) => module.DefinePassword),
  },
];

export const IAM_USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/users/users-page').then((module) => module.UsersPage),
  },
];
