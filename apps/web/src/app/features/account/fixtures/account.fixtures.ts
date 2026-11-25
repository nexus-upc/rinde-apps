import { AccountUserProfile, CompanyProfile } from '../models/account.models';

export const COMPANY_PROFILE_FIXTURE: CompanyProfile = {
  id: '3f6c1b9e-8a2d-4c57-9a43-0d2f6b1e7a10',
  tradeName: 'Transportes Andes SAC',
  ruc: '20123456789',
  status: 'ACTIVE',
  phone: '+51 1 445 8899',
  address: 'Av. Argentina 2450, Lima',
};

export const UPDATED_COMPANY_PROFILE_FIXTURE: CompanyProfile = {
  ...COMPANY_PROFILE_FIXTURE,
  tradeName: 'Transportes Andes del Perú SAC',
  phone: '+51 999 888 777',
  address: 'Av. Nicolás Arriola 1200, La Victoria, Lima',
};

export const ACCOUNT_USER_PROFILE_FIXTURE: AccountUserProfile = {
  id: '9db235a4-3e8a-4c1b-8c65-a687c73b6a18',
  fullName: 'Ana Torres Vega',
  email: 'ana.torres@example.test',
  role: 'ADMINISTRATOR',
  status: 'ACTIVE',
  tenant: {
    id: '3f6c1b9e-8a2d-4c57-9a43-0d2f6b1e7a10',
    tradeName: 'Transportes Andes SAC',
    ruc: '20123456789',
    status: 'ACTIVE',
  },
};
