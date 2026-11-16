/** Tipos de documento de identidad admitidos para un conductor. */
export const DOCUMENT_TYPES = ['DNI', 'CE', 'PASSPORT'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number] | string;

/** Categorías de brevete / licencia de conducir admitidas. */
export const LICENSE_CATEGORIES = [
  'A-I',
  'A-IIa',
  'A-IIb',
  'A-IIIa',
  'A-IIIb',
  'A-IIIc',
] as const;
export type LicenseCategory = (typeof LICENSE_CATEGORIES)[number] | string;

/** Cuenta de usuario de la empresa devuelta por el servicio IAM. */
export interface DriverUserAccount {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly role: string;
  readonly status: 'ACTIVE' | 'INVITED' | 'DISABLED' | string;
}

/** Entidad de conductor registrada en la flota de la empresa. */
export interface Driver {
  readonly id: string;
  readonly userId: string | null;
  readonly fullName: string;
  readonly documentType: DocumentType;
  readonly documentNumber: string;
  readonly licenseNumber: string;
  readonly licenseCategory: LicenseCategory;
  readonly licenseExpirationDate: string;
  readonly status: 'ENABLED' | 'DISABLED' | string;
  readonly createdAt: string;
}

/** Carga útil para dar de alta un conductor en el sistema. */
export interface CreateDriverPayload {
  readonly userId: string | null;
  readonly fullName: string;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly licenseNumber: string;
  readonly licenseCategory: string;
  readonly licenseExpirationDate: string;
}

/** Carga útil para vincular o desvincular una cuenta de usuario DRIVER. */
export interface LinkDriverAccountPayload {
  readonly userId: string | null;
}

/** Estado de elegibilidad técnico-operativa de un conductor. */
export interface DriverEligibility {
  readonly driverId: string;
  readonly eligible: boolean;
  readonly driverStatus: string;
  readonly licenseStatus: 'VALID' | 'EXPIRED' | string;
  readonly reason: string;
}

/** Etiquetas legibles de estado de conductor. */
export const DRIVER_STATUS_LABELS: Record<string, string> = {
  ENABLED: 'Habilitado',
  DISABLED: 'Inhabilitado',
};

/** Etiquetas legibles de estado de licencia. */
export const LICENSE_STATUS_LABELS: Record<string, string> = {
  VALID: 'Vigente',
  EXPIRED: 'Vencida',
};
