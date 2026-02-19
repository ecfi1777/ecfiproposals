export interface CatalogItem {
  id: string;
  description: string;
  category: string;
  section: string;
  default_unit: string;
  custom_data?: Record<string, any> | null;
  is_active?: boolean;
}

export interface CatalogItemWithTimestamp extends CatalogItem {
  created_at: string;
}
