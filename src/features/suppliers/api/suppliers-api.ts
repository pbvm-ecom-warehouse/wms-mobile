import { apiClient, unwrapData } from '@/shared/lib/api-client';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  status?: string;
}

export interface SupplierItem {
  id: string;
  itemId: string;
  sku?: string;
  itemName?: string;
  supplierId: string;
  supplierItemCode?: string;
  purchasePrice: number;
  unit?: string;
  isActive?: boolean;
}

export async function listSuppliers(): Promise<Supplier[]> {
  let response;
  try {
    response = await apiClient.get<any>('/supplier');
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 403) {
      try {
        response = await apiClient.get<any>('/suppliers');
      } catch (err2) {
        console.warn('Lỗi gọi API /suppliers fallback:', err2);
        throw err;
      }
    } else {
      console.warn('Lỗi gọi API /supplier:', err);
      throw err;
    }
  }

  const unwrapped = unwrapData<any>(response.data);

  let rawList: any[] = [];
  if (Array.isArray(unwrapped)) {
    rawList = unwrapped;
  } else if (unwrapped && typeof unwrapped === 'object') {
    if (Array.isArray(unwrapped.data)) rawList = unwrapped.data;
    else if (Array.isArray(unwrapped.items)) rawList = unwrapped.items;
    else if (Array.isArray(unwrapped.result)) rawList = unwrapped.result;
    else if (Array.isArray(unwrapped.content)) rawList = unwrapped.content;
  }

  return rawList.map((s: any, idx: number) => ({
    id: String(s.id || s.supplierId || `sup-${idx + 1}`),
    code: String(s.code || s.supplierCode || ''),
    name: String(s.name || s.supplierName || 'Nhà cung cấp'),
    contactName: s.contactName || '',
    phone: s.phone || '',
    email: s.email || '',
    address: s.address || '',
    taxCode: s.taxCode || '',
    status: s.status || 'ACTIVE',
  }));
}

export async function listSupplierItemsBySupplier(supplierId: string): Promise<SupplierItem[]> {
  if (!supplierId) return [];

  try {
    let response;
    try {
      response = await apiClient.get<any>('/supplier/items', {
        params: { supplierId, limit: 100 },
      });
    } catch {
      response = await apiClient.get<any>('/suppliers/items', {
        params: { supplierId, limit: 100 },
      });
    }

    const unwrapped = unwrapData<any>(response.data);

    let rawList: any[] = [];
    if (Array.isArray(unwrapped)) {
      rawList = unwrapped;
    } else if (unwrapped && typeof unwrapped === 'object') {
      if (Array.isArray(unwrapped.data)) rawList = unwrapped.data;
      else if (Array.isArray(unwrapped.items)) rawList = unwrapped.items;
    }

    return rawList.map((it: any, idx: number) => ({
      id: String(it.id || `sup-item-${idx + 1}`),
      itemId: String(it.itemId || it.id),
      sku: it.sku || it.itemSku || it.item?.sku || '',
      itemName: it.itemName || it.item?.name || 'Sản phẩm NCC',
      supplierId: String(it.supplierId || supplierId),
      supplierItemCode: it.supplierItemCode || '',
      purchasePrice: Number(it.purchasePrice || it.price || 0),
      unit: it.unit || it.item?.unit || 'thùng',
      isActive: it.isActive !== false,
    }));
  } catch (err) {
    console.warn('Lỗi lấy danh sách sản phẩm theo nhà cung cấp:', err);
    return [];
  }
}
