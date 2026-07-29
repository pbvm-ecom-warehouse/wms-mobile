import type { GoodsReceiptNote, GoodsReceiptNoteItem } from '@/features/inbound/types/grn';
import type {
  PutawayPackageSpec,
  PutawayTask,
  PutawayTaskItem,
  PutawayWorkItem,
} from '../types/putaway';

function packageSpecFrom(
  line: PutawayTaskItem,
  item?: GoodsReceiptNoteItem,
): PutawayPackageSpec | undefined {
  if (line.packageSpec) {
    return {
      depthCm: line.packageSpec.depthCm,
      widthCm: line.packageSpec.widthCm,
      heightCm: line.packageSpec.heightCm,
      volumeCm3: line.packageSpec.volumeCm3,
    };
  }
  const depthCm = (item as any)?.itemDepth;
  const widthCm = (item as any)?.itemWidth;
  const heightCm = (item as any)?.itemHeight;
  if (!depthCm || !widthCm || !heightCm) return undefined;
  return {
    depthCm,
    widthCm,
    heightCm,
    volumeCm3: depthCm * widthCm * heightCm,
  };
}

export function buildPutawayWorkItems(
  tasks: PutawayTask[],
  receipts: GoodsReceiptNote[],
  options: { includeCompleted?: boolean } = {},
): PutawayWorkItem[] {
  const receiptById = new Map(receipts.map((receipt) => [receipt.id, receipt]));

  return tasks.flatMap((task) => {
    const receipt = receiptById.get(task.grnId);
    return (task.items || []).flatMap((line) => {
      const remainingQty = line.remainingQty ?? line.quantity ?? 0;
      if (!options.includeCompleted && remainingQty <= 0) return [];
      const item =
        receipt?.items?.find(
          (candidate) =>
            candidate.itemId === line.itemId &&
            (!line.lotNumber || candidate.lotNumber === line.lotNumber),
        ) ??
        receipt?.items?.find((candidate) => candidate.itemId === line.itemId);
      const lotId = line.lotId ?? undefined;
      const lotNumber = line.lotNumber ?? item?.lotNumber ?? undefined;
      return [
        {
          key: `${task.id}:${line.itemId}:${lotId ?? lotNumber ?? 'none'}`,
          taskId: task.id,
          grnId: task.grnId,
          grnNumber: receipt?.grnNumber ?? task.grnNumber ?? task.grnId,
          itemId: line.itemId,
          sku: item?.sku || line.sku || 'Chưa có SKU',
          itemName: item?.itemName || item?.sku || line.sku || 'Mặt hàng',
          barcode: (item as any)?.barcode,
          itemType: (item as any)?.type ?? (item as any)?.category,
          lotId,
          lotNumber,
          manufacturedDate: item?.manufacturedDate ?? undefined,
          expiryDate: item?.expiryDate ?? undefined,
          quantity: line.quantity,
          remainingQty,
          packageSpec: packageSpecFrom(line, item),
        },
      ];
    });
  });
}
