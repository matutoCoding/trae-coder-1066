export interface Patient {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  examType: string;
}

export type TicketStatus = 'waiting' | 'calling' | 'processing' | 'completed' | 'skipped';

export interface Ticket {
  id: string;
  patientId: string;
  patientName: string;
  windowId: string;
  number: number;
  status: TicketStatus;
  examType: string;
  createTime: string;
  callTime?: string;
  finishTime?: string;
  tubeBarcodes?: string[];
}

export type WindowStatus = 'open' | 'closed' | 'busy' | 'idle';

export interface Window {
  id: string;
  name: string;
  windowNo: number;
  status: WindowStatus;
  currentTicketId?: string;
  currentTicket?: Ticket;
  queueLength: number;
  avgWaitTime: number;
  totalServed: number;
  weight: number;
}

export type BatchStatus = 'active' | 'used' | 'expired';

export interface Batch {
  id: string;
  batchNo: string;
  tubeType: string;
  totalQuantity: number;
  remainQuantity: number;
  manufactureDate: string;
  expireDate: string;
  status: BatchStatus;
  supplier: string;
  createTime: string;
}

export type SplitTargetType = 'window' | 'nurse' | 'sub_split';

export interface SplitRecord {
  id: string;
  batchId: string;
  batchNo: string;
  parentSplitId?: string;
  quantity: number;
  remainQuantity: number;
  targetType: SplitTargetType;
  targetId: string;
  targetName: string;
  splitTime: string;
  operator: string;
  level: number;
}

export type TubeStatus = 'stock' | 'distributed' | 'used' | 'discarded';

export interface Tube {
  id: string;
  splitRecordId: string;
  barcode: string;
  status: TubeStatus;
  ticketId?: string;
  patientName?: string;
  windowId?: string;
  useTime?: string;
}

export interface LoadBalanceResult {
  windowId: string;
  score: number;
  reason: string;
}
