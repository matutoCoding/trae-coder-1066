import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ticket } from '../types';
import { mockTickets, createTicket as createMockTicket } from '../data/mockData';
import { getOptimalWindow } from '../utils/loadBalancer';
import { useWindowStore } from './windowStore';
import { useSplitStore } from './splitStore';
import { recordOperation } from './operationStore';

interface TicketState {
  tickets: Ticket[];
  currentTicketNumber: number;
  addTicket: (patientName: string, examType: string, windowId?: string) => Ticket;
  getTicketsByWindow: (windowId: string) => Ticket[];
  getWaitingTicketsByWindow: (windowId: string) => Ticket[];
  callNextTicket: (windowId: string) => Ticket | null;
  completeTicket: (ticketId: string) => void;
  skipTicket: (ticketId: string) => void;
  getCurrentTicketByWindow: (windowId: string) => Ticket | undefined;
  getWaitingCount: () => number;
  getCompletedCount: () => number;
  transferTicket: (ticketId: string, toWindowId: string) => void;
  bindTube: (ticketId: string, barcode: string, batchNo: string) => void;
  voidTube: (ticketId: string, barcode: string, reason: string) => void;
  replaceTube: (ticketId: string, oldBarcode: string, newBarcode: string, reason: string) => void;
  resetTickets: () => void;
  recalculateQueueLengths: () => void;
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: mockTickets,
      currentTicketNumber: 1008,

      addTicket: (patientName, examType, windowId) => {
        const windows = useWindowStore.getState().windows;

        let targetWindowId = windowId;
        if (!targetWindowId) {
          const optimal = getOptimalWindow(windows);
          if (optimal) {
            targetWindowId = optimal.windowId;
          } else {
            targetWindowId = windows.find((w) => w.status !== 'closed')?.id || 'win-1';
          }
        }

        const newTicket = createMockTicket(patientName, examType, targetWindowId);

        set((state) => ({
          tickets: [...state.tickets, newTicket],
          currentTicketNumber: newTicket.number,
        }));

        useWindowStore.getState().updateQueueLength(targetWindowId, 1);

        recordOperation.createTicket(
          newTicket.id,
          newTicket.number,
          newTicket.patientName,
          newTicket.windowId
        );

        return newTicket;
      },

      getTicketsByWindow: (windowId) => {
        return get().tickets.filter((t) => t.windowId === windowId);
      },

      getWaitingTicketsByWindow: (windowId) => {
        return get()
          .tickets.filter((t) => t.windowId === windowId && t.status === 'waiting')
          .sort((a, b) => {
            const ra = a.recallCount || 0;
            const rb = b.recallCount || 0;
            if (ra !== rb) return ra - rb;
            return a.number - b.number;
          });
      },

      callNextTicket: (windowId) => {
        const waitingTickets = get().getWaitingTicketsByWindow(windowId);
        if (waitingTickets.length === 0) return null;

        const nextTicket = waitingTickets[0];
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const currentCalling = get().tickets.find(
          (t) => t.windowId === windowId && t.status === 'calling'
        );

        if (currentCalling) {
          useWindowStore.getState().updateQueueLength(windowId, 1);
        }

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === nextTicket.id
              ? { ...t, status: 'calling' as const, callTime: now }
              : t.status === 'calling' && t.windowId === windowId
                ? { ...t, status: 'waiting' as const, recallCount: (t.recallCount || 0) + 1 }
                : t
          ),
        }));

        useWindowStore.getState().setCurrentTicket(windowId, nextTicket.id);
        useWindowStore.getState().updateQueueLength(windowId, -1);

        recordOperation.callTicket(
          nextTicket.id,
          nextTicket.number,
          nextTicket.patientName,
          windowId
        );

        return { ...nextTicket, status: 'calling' as const, callTime: now };
      },

      completeTicket: (ticketId) => {
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const ticket = get().tickets.find((t) => t.id === ticketId);

        if (ticket) {
          const windowStore = useWindowStore.getState();
          const window = windowStore.getWindowById(ticket.windowId);

          if (window) {
            const newAvg = Math.round(
              ((window.avgWaitTime * window.totalServed + 5) / (window.totalServed + 1)) * 10
            ) / 10;

            useWindowStore.setState({
              windows: windowStore.windows.map((w) =>
                w.id === ticket.windowId
                  ? { ...w, totalServed: w.totalServed + 1, avgWaitTime: newAvg }
                  : w
              ),
            });
          }

          useWindowStore.getState().setCurrentTicket(ticket.windowId, undefined);
        }

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? { ...t, status: 'completed' as const, finishTime: now }
              : t
          ),
        }));

        if (ticket) {
          recordOperation.completeTicket(
            ticket.id,
            ticket.number,
            ticket.patientName,
            ticket.windowId
          );
        }
      },

      skipTicket: (ticketId) => {
        const ticket = get().tickets.find((t) => t.id === ticketId);
        if (ticket) {
          useWindowStore.getState().setCurrentTicket(ticket.windowId, undefined);
          useWindowStore.getState().updateQueueLength(ticket.windowId, 0);

          recordOperation.skipTicket(
            ticket.id,
            ticket.number,
            ticket.patientName,
            ticket.windowId
          );
        }

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, status: 'skipped' as const } : t
          ),
        }));
      },

      bindTube: (ticketId, barcode, batchNo) => {
        const ticket = get().tickets.find((t) => t.id === ticketId);
        if (!ticket) return;

        const splitStore = useSplitStore.getState();
        const windowSplits = splitStore.getSplitRecordsByTarget(
          'window',
          ticket.windowId
        );

        const targetSplit = windowSplits.find(
          (s) => s.batchNo === batchNo && s.remainQuantity > 0
        );

        if (targetSplit) {
          useSplitStore.setState({
            splitRecords: splitStore.splitRecords.map((s) =>
              s.id === targetSplit.id
                ? { ...s, remainQuantity: Math.max(0, s.remainQuantity - 1) }
                : s
            ),
          });
        }

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  tubeBarcodes: [...(t.tubeBarcodes || []), barcode],
                  tubeBatchNo: batchNo,
                }
              : t
          ),
        }));

        if (ticket) {
          recordOperation.bindTube(
            ticket.id,
            ticket.number,
            ticket.patientName,
            ticket.windowId,
            barcode,
            batchNo
          );
        }
      },

      voidTube: (ticketId, barcode, reason) => {
        const ticket = get().tickets.find((t) => t.id === ticketId);
        if (!ticket || !ticket.tubeBarcodes?.includes(barcode)) return;

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  tubeBarcodes: t.tubeBarcodes?.filter((b) => b !== barcode),
                }
              : t
          ),
        }));

        if (ticket) {
          recordOperation.voidTube(
            ticket.id,
            ticket.number,
            ticket.patientName,
            ticket.windowId,
            barcode,
            ticket.tubeBatchNo || '',
            reason
          );
        }
      },

      replaceTube: (ticketId, oldBarcode, newBarcode, reason) => {
        const ticket = get().tickets.find((t) => t.id === ticketId);
        if (!ticket || !ticket.tubeBarcodes?.includes(oldBarcode)) return;

        const splitStore = useSplitStore.getState();
        const windowSplits = splitStore.getSplitRecordsByTarget(
          'window',
          ticket.windowId
        );

        const targetSplit = windowSplits.find(
          (s) => s.batchNo === ticket.tubeBatchNo && s.remainQuantity > 0
        );

        if (targetSplit) {
          useSplitStore.setState({
            splitRecords: splitStore.splitRecords.map((s) =>
              s.id === targetSplit.id
                ? { ...s, remainQuantity: Math.max(0, s.remainQuantity - 1) }
                : s
            ),
          });
        }

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  tubeBarcodes: t.tubeBarcodes?.map((b) =>
                    b === oldBarcode ? newBarcode : b
                  ),
                }
              : t
          ),
        }));

        if (ticket) {
          recordOperation.replaceTube(
            ticket.id,
            ticket.number,
            ticket.patientName,
            ticket.windowId,
            oldBarcode,
            newBarcode,
            ticket.tubeBatchNo || '',
            reason
          );
        }
      },

      recalculateQueueLengths: () => {
        const windows = useWindowStore.getState().windows;
        windows.forEach((win) => {
          const waitingCount = get().tickets.filter(
            (t) => t.windowId === win.id && t.status === 'waiting'
          ).length;
          useWindowStore.setState({
            windows: useWindowStore.getState().windows.map((w) =>
              w.id === win.id ? { ...w, queueLength: waitingCount } : w
            ),
          });
        });
      },

      getCurrentTicketByWindow: (windowId) => {
        return get().tickets.find(
          (t) => t.windowId === windowId && (t.status === 'calling' || t.status === 'processing')
        );
      },

      getWaitingCount: () => {
        return get().tickets.filter((t) => t.status === 'waiting').length;
      },

      getCompletedCount: () => {
        return get().tickets.filter((t) => t.status === 'completed').length;
      },

      transferTicket: (ticketId, toWindowId) => {
        const ticket = get().tickets.find((t) => t.id === ticketId);
        if (!ticket || ticket.status !== 'waiting') return;

        const fromWindow = useWindowStore.getState().getWindowById(ticket.windowId);
        const toWindow = useWindowStore.getState().getWindowById(toWindowId);

        useWindowStore.getState().updateQueueLength(ticket.windowId, -1);
        useWindowStore.getState().updateQueueLength(toWindowId, 1);

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, windowId: toWindowId } : t
          ),
        }));

        if (fromWindow && toWindow) {
          recordOperation.transferTicket(
            ticket.id,
            ticket.number,
            ticket.patientName,
            ticket.windowId,
            toWindowId,
            fromWindow.name,
            toWindow.name
          );
        }
      },

      resetTickets: () => {
        set({ tickets: [], currentTicketNumber: 1000 });
      },
    }),
    {
      name: 'ticket-store',
    }
  )
);
