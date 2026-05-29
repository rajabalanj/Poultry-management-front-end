export interface TenantFeatureCreate {
  tenant_id: string;
  feature_name: string;
  is_restricted: boolean;
}

export interface TenantFeatureUpdate {
  is_restricted: boolean;
}

export interface TenantFeatureResponse extends TenantFeatureCreate {
  id: number;
  created_at: string;
  updated_at: string;
}