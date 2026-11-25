import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/notifications-page/notifications-page').then(
        (module) => module.NotificationsPage,
      ),
  },
];
