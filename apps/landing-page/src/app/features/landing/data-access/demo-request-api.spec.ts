import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DemoRequest, DemoRequestReceipt } from '../models/demo-request.models';
import { DemoRequestApi } from './demo-request-api';

describe('DemoRequestApi', () => {
  const request: DemoRequest = {
    fullName: 'Ana Torres',
    companyName: 'Transportes Andes SAC',
    email: 'ana@example.com',
    fleetSize: 12,
  };

  it('posts the request to the public endpoint without credentials', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    let receipt: DemoRequestReceipt | undefined;
    TestBed.inject(DemoRequestApi)
      .submit(request)
      .subscribe((value) => (receipt = value));

    const call = http.expectOne('http://localhost:8000/api/v1/public/demo-requests');
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual(request);
    expect(call.request.headers.has('Authorization')).toBe(false);
    const body: DemoRequestReceipt = {
      id: 'b3f1c1c2-0000-4000-8000-000000000001',
      status: 'RECEIVED',
      receivedAt: '2026-11-09T13:05:12.418Z',
    };
    call.flush(body);
    expect(receipt).toEqual(body);
    http.verify();
  });
});
