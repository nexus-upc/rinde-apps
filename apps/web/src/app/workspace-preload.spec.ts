import { Routes } from '@angular/router';
import { routePreload } from './workspace-preload';

describe('routePreload', () => {
  it('loads the shell and the screen that lead to the url, not other areas', async () => {
    const loaded: string[] = [];
    const load = (name: string) => () => {
      loaded.push(name);
      return Promise.resolve(class {});
    };
    const routes: Routes = [
      { path: 'platform', loadComponent: load('platform-shell') },
      {
        path: '',
        loadChildren: () => Promise.resolve([{ path: 'sign-in', loadComponent: load('sign-in') }]),
      },
      {
        path: '',
        loadComponent: load('shell'),
        children: [
          { path: 'users', loadComponent: load('users') },
          { path: 'trips', loadComponent: load('trips') },
          { path: '', redirectTo: 'trips', pathMatch: 'full' },
        ],
      },
      { path: '**', redirectTo: '' },
    ];

    await routePreload(routes)('/trips?tab=1');

    expect(loaded).toEqual(['shell', 'trips']);
  });
});
