import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ticket } from '../types';
import { mockTickets, createTicket as createMockTicket } from '../data/mockData';
import { getOptimalWindow } from '../utils/loadBalancer';
import { useWindowStore } from './windowStore';

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
  resetTickets: () => void;
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

        return newTicket;
      },

      getTicketsByWindow: (windowId) => {
        return get().tickets.filter((t) => t.windowId === windowId);
      },

      getWaitingTicketsByWindow: (windowId) => {
        return get()
          .tickets.filter((t) => t.windowId === windowId && t.status === 'waiting')
          .sort((a, b) => a.number - b.number);
      },

      callNextTicket: (windowId) => {
        const waitingTickets = get().getWaitingTicketsByWindow(windowId);
        if (waitingTickets.length === 0) return null;

        const nextTicket = waitingTickets[0];
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === nextTicket.id
              ? { ...t, status: 'calling' as const, callTime: now }
              : t.status === 'calling' && t.windowId === windowId
                ? { ...t, status: 'waiting' as const }
                : t
          ),
        }));

        useWindowStore.getState().setCurrentTicket(windowId, nextTicket.id);
        useWindowStore.getState().updateQueueLength(windowId, -1);

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
      },

      skipTicket: (ticketId) => {
        const ticket = get().tickets.find((t) => t.id === ticketId);
        if (ticket) {
          useWindowStore.getState().setCurrentTicket(ticket.windowId, undefined);
        }

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, status: 'skipped' as const } : t
          ),
        }));
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

        useWindowStore.getState().updateQueueLength(ticket.windowId, -1);
        useWindowStore.getState().updateQueueLength(toWindowId, 1);

        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, windowId: toWindowId } : t
          ),
        }));
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
