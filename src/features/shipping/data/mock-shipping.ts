export type ShippingStatus = 'READY' | 'IN_TRANSIT' | 'DELIVERED';

export const deliveries = [
  { id: 'ship-1', code: 'VD-20260727-991', recipient: 'Trần Hoàng Bảo', address: 'Quận 3, TP.HCM', status: 'IN_TRANSIT' as ShippingStatus },
  { id: 'ship-2', code: 'VD-20260727-992', recipient: 'Nguyễn Lê Hoa', address: 'Phú Nhuận, TP.HCM', status: 'READY' as ShippingStatus },
  { id: 'ship-3', code: 'VD-20260726-880', recipient: 'TocoToco', address: 'Tân Bình, TP.HCM', status: 'DELIVERED' as ShippingStatus },
];
