import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Window } from '../types';
import { mockWindows } from '../data/mockData';

interface WindowState {
  windows: Window[];
  selectedWindowId: string;
  setSelectedWindowId: (id: string) => void;
  getWindowById: (id: string) => Window | undefined;
  updateWindowStatus: (id: string, status: Window['status']) => void;
  updateQueueLength: (id: string, delta: number) => void;
  setCurrentTicket: (windowId: string, ticketId: string | undefined) => void;
  toggleWindowStatus: (id: string) => void;
  getAllOpenWindows: () => Window[];
}

export const useWindowStore = create<WindowState>()(
  persist(
    (set, get) => ({
      windows: mockWindows,
      selectedWindowId: 'win-1',

      setSelectedWindowId: (id) => set({ selectedWindowId: id }),

      getWindowById: (id) => {
        return get().windows.find((w) => w.id === id);
      },

      updateWindowStatus: (id, status) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, status } : w
          ),
        }));
      },

      updateQueueLength: (id, delta) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  queueLength: Math.max(0, w.queueLength + delta),
                  status: w.queueLength + delta > 0 ? 'busy' : 'idle',
                }
              : w
          ),
        }));
      },

      setCurrentTicket: (windowId, ticketId) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId ? { ...w, currentTicketId: ticketId } : w
          ),
        }));
      },

      toggleWindowStatus: (id) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: w.status === 'closed' ? 'open' : 'closed',
                  queueLength: w.status === 'closed' ? w.queueLength : 0,
                }
              : w
          ),
        }));
      },

      getAllOpenWindows: () => {
        return get().windows.filter((w) => w.status !== 'closed');
      },
    }),
    {
      name: 'window-store',
    }
  )
);
