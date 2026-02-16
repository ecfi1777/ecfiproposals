export interface CatalogItem {
  id: string;
  description: string;
  category: string;
  section: string;
  default_unit: string;
}

export interface CatalogItemWithTimestamp extends CatalogItem {
  created_at: string;
}
