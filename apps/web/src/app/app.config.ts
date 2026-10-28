import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { authInterceptor } from '@core/auth/auth.interceptor';
import { WORKSPACE_PRELOAD } from '@core/loading/workspace-transition';
import { routes } from './app.routes';
import { routePreload } from './workspace-preload';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: WORKSPACE_PRELOAD, useValue: routePreload(routes) },
  ],
};
