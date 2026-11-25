import { TripConsolidatedSummary } from '../models/trip.models';

export const TRIP_CONSOLIDATED_SUMMARY_FIXTURE: TripConsolidatedSummary = {
  tripId: '7b0e4f52-1c9a-4f3e-8d21-5a6c9e0b3d44',
  code: 'TRP-000014',
  status: 'FINISHED',
  origin: 'Lima',
  destination: 'Trujillo',
  cargoDescription: 'Materiales de construcción',
  cargoWeightKg: 4200,
  departureDate: '2026-11-20',
  vehicleId: 'deac3d8e-12d4-4a72-98f2-1e2fc4d0d230',
  driverId: '1355b6b8-7cd5-4f4f-9f66-7b883c7e8819',
  startedAt: '2026-11-20T07:30:00Z',
  finishedAt: '2026-11-20T18:10:00Z',
  expenseCount: 4,
  expenseTotal: 310,
  expenseCurrency: 'PEN',
  settlementStatus: 'OPEN',
  advanceAmount: 500,
  advanceBalance: 190,
  vehiclePlate: 'ABC-123',
  driverName: 'Luis Quispe Mamani',
  expenseCountsByStatus: {
    REGISTERED: 1,
    PENDING_SUPPORT: 0,
    APPROVED: 2,
    OBSERVED: 1,
  },
  approvedTotal: 310,
  pendingReviewCount: 1,
  advanceDeliveryMethod: 'TRANSFER',
  settlementId: '91a4c2d0-8e33-4a1f-9c22-44b1e0a9f101',
  settlementClosedAt: null,
  openIncidents: [
    {
      id: '3c589391-d520-4d01-838a-1a574c7d2bb6',
      type: 'DELAY',
      status: 'OPEN',
      reportedAt: '2026-11-20T13:20:00Z',
    },
  ],
  partial: false,
  unavailableSources: [],
};

export const TRIP_CONSOLIDATED_PARTIAL_FIXTURE: TripConsolidatedSummary = {
  ...TRIP_CONSOLIDATED_SUMMARY_FIXTURE,
  openIncidents: [],
  partial: true,
  unavailableSources: ['INCIDENT'],
};
