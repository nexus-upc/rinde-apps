import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '@core/config/api-config';
import { DemoMailDetail, MailPage, MailPurpose } from '../models/mailbox.models';
@Injectable({ providedIn: 'root' })
export class MailboxApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL) + '/api/v1/platform/demo-mailbox/messages';
  list(page: number, search: string, purpose: MailPurpose | '') {
    let params = new HttpParams().set('page', page).set('search', search);
    if (purpose) params = params.set('purpose', purpose);
    return this.http.get<MailPage>(this.base, { params });
  }
  open(id: string) {
    return this.http.get<DemoMailDetail>(this.base + '/' + encodeURIComponent(id));
  }
}
