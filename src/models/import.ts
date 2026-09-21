export type ImportType = 'website' | 'csv' | 'excel' | 'google_sheet' | 'api';
export type ImportStatus = 'processing' | 'preview' | 'completed' | 'failed';

export interface ExtractedPropertyData {
  title: string;
  community: string;
  address: string;
  price: number | null;
  area: number | null;
  mainArea: number | null;
  landArea: number | null;
  buildingAge: number | null;
  layout: string;
  floor: string;
  totalFloors: string;
  parking: string;
  propertyType: string;
  orientation: string;
  managementFee: number | null;
  description: string;
  sourceUrl: string;
  sourceSite: string;
  images: string[];
  confidence: {
    title: number;
    price: number;
    address: number;
    area: number;
  };
  needsVerification: string[];
}

export interface ImportRecord {
  id: string;
  _id?: string;
  userId: string;
  storeId?: string;
  type: ImportType;
  sourceUrl: string;
  sourceSite?: string;
  rawMetadata?: {
    title?: string;
    description?: string;
    ogImage?: string;
    sourceSite?: string;
    hasJsonLd?: boolean;
    contentLength?: number;
  };
  extractedData?: ExtractedPropertyData | null;
  confirmedData?: any;
  status: ImportStatus;
  errorCode?: string | null;
  propertyId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartImportResponse {
  importId: string;
  status: ImportStatus;
  extractedData?: ExtractedPropertyData;
  rawMetadata?: any;
  isDuplicate?: boolean;
  duplicateProperty?: {
    id: string;
    title: string;
    address: string;
    price: number;
  } | null;
}
