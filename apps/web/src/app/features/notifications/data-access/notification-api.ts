import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import {
  NotificationFilters,
  NotificationPage,
  UnreadNotificationCount,
} from '../models/notification.models';

/** Operaciones del centro de notificaciones a través del API Gateway (contrato C6). */
@Injectable({ providedIn: 'root' })
export class NotificationApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/api/v1/notifications`;

  getNotifications(filters?: NotificationFilters): Observable<NotificationPage> {
    let params = new HttpParams();
    if (filters?.unreadOnly !== undefined) {
      params = params.set('unreadOnly', filters.unreadOnly);
    }
    if (filters?.type?.length) {
      params = params.set('type', filters.type.join(','));
    }
    if (filters?.page !== undefined) params = params.set('page', filters.page);
    if (filters?.size !== undefined) params = params.set('size', filters.size);
    return this.http.get<NotificationPage>(this.base, { params });
  }

  getUnreadCount(): Observable<UnreadNotificationCount> {
    return this.http.get<UnreadNotificationCount>(`${this.base}/unread-count`);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${encodeURIComponent(id)}/read`, null);
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.base}/read-all`, null);
  }
}
