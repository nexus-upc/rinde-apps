import { Provider } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { API_BASE_URL } from './app/core/config/api-config';
import { loadRuntimeConfig, showConfigurationError } from './app/core/config/runtime-config';
import { environment } from './environments/environment';

/** Lee config.json antes de arrancar; en producción, sin configuración válida no se inicia. */
async function start(): Promise<void> {
  const apiBaseUrl = await loadRuntimeConfig();
  if (apiBaseUrl === null && environment.requireRuntimeConfig) {
    showConfigurationError();
    return;
  }
  const runtimeProviders: Provider[] =
    apiBaseUrl === null ? [] : [{ provide: API_BASE_URL, useValue: apiBaseUrl }];
  await bootstrapApplication(App, {
    ...appConfig,
    providers: [...appConfig.providers, ...runtimeProviders],
  });
}

start().catch((err) => console.error(err));
