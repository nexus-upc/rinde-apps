import { VehicleHistory } from '../models/fleet.models';

export const VEHICLE_HISTORY_FIXTURE: VehicleHistory = {
  vehicleId: 'deac3d8e-12d4-4a72-98f2-1e2fc4d0d230',
  nextMaintenanceDate: '2027-02-09',
  items: [
    {
      type: 'INCIDENT',
      id: '3c589391-d520-4d01-838a-1a574c7d2bb6',
      date: '2026-11-20T13:20:00Z',
      title: 'Incidencia BREAKDOWN',
      status: 'CLOSED',
      detail: 'Falla en el freno neumático',
    },
    {
      type: 'TRIP',
      id: '7b0e4f52-1c9a-4f3e-8d21-5a6c9e0b3d44',
      date: '2026-11-20T07:30:00Z',
      title: 'TRP-000014 Lima a Trujillo',
      status: 'FINISHED',
      detail: 'Materiales de construcción',
    },
    {
      type: 'MAINTENANCE',
      id: '5a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
      date: '2026-11-09T00:00:00Z',
      title: 'Mantenimiento PREVENTIVE',
      status: null,
      detail: 'Cambio de aceite y filtros',
    },
  ],
  partial: false,
  unavailableSources: [],
};
