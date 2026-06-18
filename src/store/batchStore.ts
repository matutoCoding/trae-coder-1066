import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Batch } from '../types';
import { mockBatches } from '../data/mockData';

interface BatchState {
  batches: Batch[];
  addBatch: (batch: Omit<Batch, 'id' | 'createTime' | 'status' | 'remainQuantity'>) => void;
  getBatchById: (id: string) => Batch | undefined;
  updateRemainQuantity: (id: string, delta: number) => void;
  getActiveBatches: () => Batch[];
  getBatchStats: () => { total: number; active: number; used: number; totalTubes: number };
}

const generateId = (): string => {
  return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useBatchStore = create<BatchState>()(
  persist(
    (set, get) => ({
      batches: mockBatches,

      addBatch: (batchData) => {
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const newBatch: Batch = {
          ...batchData,
          id: generateId(),
          remainQuantity: batchData.totalQuantity,
          status: 'active',
          createTime: now,
        };

        set((state) => ({
          batches: [newBatch, ...state.batches],
        }));
      },

      getBatchById: (id) => {
        return get().batches.find((b) => b.id === id);
      },

      updateRemainQuantity: (id, delta) => {
        set((state) => ({
          batches: state.batches.map((b) => {
            if (b.id !== id) return b;
            const newRemain = Math.max(0, b.remainQuantity + delta);
            return {
              ...b,
              remainQuantity: newRemain,
              status: newRemain === 0 ? 'used' : b.status,
            };
          }),
        }));
      },

      getActiveBatches: () => {
        return get().batches.filter((b) => b.status === 'active');
      },

      getBatchStats: () => {
        const batches = get().batches;
        return {
          total: batches.length,
          active: batches.filter((b) => b.status === 'active').length,
          used: batches.filter((b) => b.status === 'used').length,
          totalTubes: batches.reduce((sum, b) => sum + b.totalQuantity, 0),
        };
      },
    }),
    {
      name: 'batch-store',
    }
  )
);
