import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api-config';
@Injectable({ providedIn: 'root' })
export class DemoConfigApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  features() {
    return this.http.get<{ readonly mailboxEnabled: boolean }>(this.base + '/api/v1/demo/features');
  }
}
