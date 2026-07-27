export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  location: string;
  available: number;
  unit: string;
}

export const products: ProductSummary[] = [
  { id: 'p-1', sku: 'LY-GIA-500ML', name: 'Ly giấy cao cấp 500ml', location: 'A01-02-B', available: 12100, unit: 'cái' },
  { id: 'p-2', sku: 'LY-NHUA-700ML', name: 'Ly nhựa PP 700ml', location: 'A02-01-A', available: 24500, unit: 'cái' },
  { id: 'p-3', sku: 'NAP-BANG-90MM', name: 'Nắp bằng PET 90mm', location: 'B01-04-C', available: 42000, unit: 'cái' },
  { id: 'p-4', sku: 'ONG-HUT-PHI-8', name: 'Ống hút bọc giấy 8mm', location: 'B02-02-A', available: 2800, unit: 'gói' },
];
