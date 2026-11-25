import { DashboardCharts } from '../models/home.models';

export const DASHBOARD_CHARTS_FIXTURE: DashboardCharts = {
  from: '2026-11-01',
  to: '2026-11-30',
  currency: 'PEN',
  excludedCurrencies: [],
  expensesByCategory: [
    { category: 'FUEL', total: 2450 },
    { category: 'TOLL', total: 420.5 },
    { category: 'FOOD', total: 310 },
    { category: 'LODGING', total: 180 },
    { category: 'MAINTENANCE', total: 0 },
    { category: 'OTHER', total: 95 },
  ],
  tripsByStatus: [
    { status: 'SCHEDULED', count: 2 },
    { status: 'ASSIGNED', count: 3 },
    { status: 'IN_ROUTE', count: 2 },
    { status: 'FINISHED', count: 4 },
    { status: 'SETTLED', count: 5 },
  ],
  expensesByVehicle: [
    {
      vehicleId: 'deac3d8e-12d4-4a72-98f2-1e2fc4d0d230',
      plateNumber: 'ABC-123',
      total: 1890.5,
    },
  ],
  partial: false,
  unavailableSources: [],
};
