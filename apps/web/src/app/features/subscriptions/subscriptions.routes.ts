import { Routes } from '@angular/router';

export const SUBSCRIPTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/subscription-page').then((module) => module.SubscriptionPage),
  },
];
