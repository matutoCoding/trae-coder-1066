import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OperationRecord, OperationType, AppConfig, StockWarning } from '../types';
import { useWindowStore } from './windowStore';
import { useTicketStore } from './ticketStore';
import { useSplitStore } from './splitStore';
import { useBatchStore } from './batchStore';

interface OperationState {
  records: OperationRecord[];
  appConfig: AppConfig;
  addRecord: (
    type: OperationType,
    data: Partial<OperationRecord>,
    details?: Record<string, unknown>
  ) => void;
  getRecordsByWindow: (windowId: string, limit?: number) => OperationRecord[];
  getRecordsByTicket: (ticketId: string) => OperationRecord[];
  getRecentRecords: (limit?: number) => OperationRecord[];
  getTicketTimeline: (ticketId: string) => OperationRecord[];
  updateConfig: (config: Partial<AppConfig>) => void;
  checkStockWarnings: () => StockWarning[];
}

const generateId = (): string => {
  return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getOperator = (): string => {
  return '系统';
};

export const useOperationStore = create<OperationState>()(
  persist(
    (set, get) => ({
      records: [],
      appConfig: {
        stockThreshold: 20,
        criticalThreshold: 5,
      },

      addRecord: (type, data, details) => {
        const windowStore = useWindowStore.getState();
        const window = data.windowId
          ? windowStore.getWindowById(data.windowId)
          : null;

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const record: OperationRecord = {
          id: generateId(),
          windowId: data.windowId || '',
          windowName: window?.name || data.windowName || '',
          type,
          description: data.description || '',
          operator: data.operator || getOperator(),
          timestamp: now,
          ...data,
          details,
        };

        set((state) => ({
          records: [record, ...state.records].slice(0, 500),
        }));
      },

      getRecordsByWindow: (windowId, limit = 20) => {
        return get()
          .records.filter((r) => r.windowId === windowId)
          .slice(0, limit);
      },

      getRecordsByTicket: (ticketId) => {
        return get().records.filter((r) => r.ticketId === ticketId);
      },

      getRecentRecords: (limit = 50) => {
        return get().records.slice(0, limit);
      },

      getTicketTimeline: (ticketId) => {
        return get()
          .records.filter((r) => r.ticketId === ticketId)
          .sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
      },

      updateConfig: (config) => {
        set((state) => ({
          appConfig: { ...state.appConfig, ...config },
        }));
      },

      checkStockWarnings: () => {
        const { appConfig } = get();
        const windowStore = useWindowStore.getState();
        const splitStore = useSplitStore.getState();
        const warnings: StockWarning[] = [];

        const openWindows = windowStore.getAllOpenWindows();
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        for (const win of openWindows) {
          const windowSplits = splitStore.getSplitRecordsByTarget('window', win.id);
          const totalRemain = windowSplits.reduce(
            (sum, s) => sum + s.remainQuantity,
            0
          );

          if (totalRemain <= appConfig.criticalThreshold) {
            warnings.push({
              id: `warn-${win.id}-${now}`,
              windowId: win.id,
              windowName: win.name,
              batchId: '',
              batchNo: '',
              tubeType: '',
              remainQuantity: totalRemain,
              threshold: appConfig.criticalThreshold,
              level: 'critical',
              timestamp: now,
            });
          } else if (totalRemain <= appConfig.stockThreshold) {
            warnings.push({
              id: `warn-${win.id}-${now}`,
              windowId: win.id,
              windowName: win.name,
              batchId: '',
              batchNo: '',
              tubeType: '',
              remainQuantity: totalRemain,
              threshold: appConfig.stockThreshold,
              level: 'low',
              timestamp: now,
            });
          }
        }

        return warnings;
      },
    }),
    {
      name: 'operation-store',
    }
  )
);

export const recordOperation = {
  createTicket: (ticketId: string, ticketNumber: number, patientName: string, windowId: string) => {
    useOperationStore.getState().addRecord(
      'create',
      {
        ticketId,
        ticketNumber,
        patientName,
        windowId,
        description: `${patientName} 取号，排队号 A${ticketNumber}`,
      },
      { ticketNumber, patientName }
    );
  },

  callTicket: (ticketId: string, ticketNumber: number, patientName: string, windowId: string) => {
    useOperationStore.getState().addRecord(
      'call',
      {
        ticketId,
        ticketNumber,
        patientName,
        windowId,
        description: `叫号 A${ticketNumber} ${patientName}`,
      },
      { ticketNumber, patientName }
    );
  },

  bindTube: (ticketId: string, ticketNumber: number, patientName: string, windowId: string, barcode: string, batchNo: string) => {
    useOperationStore.getState().addRecord(
      'bind_tube',
      {
        ticketId,
        ticketNumber,
        patientName,
        windowId,
        description: `${patientName} 绑定试管 ${barcode} (批次: ${batchNo})`,
      },
      { barcode, batchNo }
    );
  },

  completeTicket: (ticketId: string, ticketNumber: number, patientName: string, windowId: string) => {
    useOperationStore.getState().addRecord(
      'complete',
      {
        ticketId,
        ticketNumber,
        patientName,
        windowId,
        description: `${patientName} 抽血完成`,
      },
      { ticketNumber, patientName }
    );
  },

  skipTicket: (ticketId: string, ticketNumber: number, patientName: string, windowId: string) => {
    useOperationStore.getState().addRecord(
      'skip',
      {
        ticketId,
        ticketNumber,
        patientName,
        windowId,
        description: `${patientName} 过号`,
      },
      { ticketNumber, patientName }
    );
  },

  transferTicket: (ticketId: string, ticketNumber: number, patientName: string, fromWindowId: string, toWindowId: string, fromWindowName: string, toWindowName: string) => {
    useOperationStore.getState().addRecord(
      'transfer',
      {
        ticketId,
        ticketNumber,
        patientName,
        windowId: toWindowId,
        description: `${patientName} 从 ${fromWindowName} 调剂到 ${toWindowName}`,
      },
      { fromWindowId, toWindowId }
    );
  },

  windowOpen: (windowId: string) => {
    const window = useWindowStore.getState().getWindowById(windowId);
    useOperationStore.getState().addRecord(
      'window_open',
      {
        windowId,
        windowName: window?.name,
        description: `${window?.name} 开启服务`,
      },
      {}
    );
  },

  windowClose: (windowId: string) => {
    const window = useWindowStore.getState().getWindowById(windowId);
    useOperationStore.getState().addRecord(
      'window_close',
      {
        windowId,
        windowName: window?.name,
        description: `${window?.name} 暂停服务`,
      },
      {}
    );
  },
};
