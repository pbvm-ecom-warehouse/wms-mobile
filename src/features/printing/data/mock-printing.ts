export type PrintStatus = 'QUEUED' | 'PRINTING' | 'COMPLETED';

export const printJobs = [
  { id: 'print-1', code: 'IN-20260727-01', product: 'Ly giấy 500ml · Phê La', progress: '1.800/3.000', status: 'PRINTING' as PrintStatus },
  { id: 'print-2', code: 'IN-20260727-02', product: 'Ly nhựa 700ml · The Coffee House', progress: '0/5.000', status: 'QUEUED' as PrintStatus },
  { id: 'print-3', code: 'IN-20260726-09', product: 'Ly giấy 350ml · Katinat', progress: '2.000/2.000', status: 'COMPLETED' as PrintStatus },
];
