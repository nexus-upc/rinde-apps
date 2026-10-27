import { Routes } from '@angular/router';
import { PlatformSection } from './models/platform.models';
const sections: readonly { path: string; section: PlatformSection }[] = [
  { path: '', section: 'overview' },
  { path: 'companies', section: 'companies' },
  { path: 'plans', section: 'plans' },
  { path: 'subscriptions', section: 'subscriptions' },
  { path: 'payments', section: 'payments' },
  { path: 'audit', section: 'audit' },
];
export const PLATFORM_ROUTES: Routes = sections.map(({ path, section }) => ({
  path,
  pathMatch: 'full',
  data: { section },
  loadComponent: () => import('./pages/platform-page').then((m) => m.PlatformPage),
}));
