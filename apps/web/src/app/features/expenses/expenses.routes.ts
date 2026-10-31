import { Routes } from '@angular/router';

export const EXPENSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/expense-review-page').then((m) => m.ExpenseReviewPage),
  },
  {
    path: ':tripId',
    loadComponent: () =>
      import('./pages/expense-review-page').then((m) => m.ExpenseReviewPage),
  },
];
