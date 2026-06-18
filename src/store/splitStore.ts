import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SplitRecord, SplitTargetType } from '../types';
import { mockSplitRecords } from '../data/mockData';
import { useBatchStore } from './batchStore';

interface SplitState {
  splitRecords: SplitRecord[];
  addSplitRecord: (
    batchId: string,
    quantity: number,
    targetType: SplitTargetType,
    targetId: string,
    targetName: string,
    operator: string,
    parentSplitId?: string
  ) => SplitRecord | null;
  getSplitRecordsByBatch: (batchId: string) => SplitRecord[];
  getSplitRecordsByParent: (parentId: string) => SplitRecord[];
  getSplitRecordsByTarget: (targetType: SplitTargetType, targetId: string) => SplitRecord[];
  getSplitTree: (batchId: string) => SplitRecord[];
  getDestinationDistribution: (batchId: string) => { name: string; value: number; type: string }[];
  getTotalDistributed: (batchId: string) => number;
}

const generateId = (): string => {
  return `split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useSplitStore = create<SplitState>()(
  persist(
    (set, get) => ({
      splitRecords: mockSplitRecords,

      addSplitRecord: (
        batchId,
        quantity,
        targetType,
        targetId,
        targetName,
        operator,
        parentSplitId?
      ) => {
        const batchStore = useBatchStore.getState();
        const batch = batchStore.getBatchById(batchId);
        if (!batch) return null;

        let availableQuantity = 0;
        let parentLevel = 0;

        if (parentSplitId) {
          const parentSplit = get().splitRecords.find((s) => s.id === parentSplitId);
          if (!parentSplit || parentSplit.remainQuantity < quantity) return null;
          availableQuantity = parentSplit.remainQuantity;
          parentLevel = parentSplit.level;
        } else {
          if (batch.remainQuantity < quantity) return null;
          availableQuantity = batch.remainQuantity;
        }

        if (availableQuantity < quantity) return null;

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const newSplit: SplitRecord = {
          id: generateId(),
          batchId,
          batchNo: batch.batchNo,
          parentSplitId,
          quantity,
          remainQuantity: quantity,
          targetType,
          targetId,
          targetName,
          splitTime: now,
          operator,
          level: parentLevel + 1,
        };

        set((state) => {
          let updatedRecords = [...state.splitRecords, newSplit];

          if (parentSplitId) {
            updatedRecords = updatedRecords.map((s) =>
              s.id === parentSplitId
                ? { ...s, remainQuantity: s.remainQuantity - quantity }
                : s
            );
          }

          return { splitRecords: updatedRecords };
        });

        if (!parentSplitId) {
          batchStore.updateRemainQuantity(batchId, -quantity);
        }

        return newSplit;
      },

      getSplitRecordsByBatch: (batchId) => {
        return get()
          .splitRecords.filter((s) => s.batchId === batchId)
          .sort((a, b) => new Date(b.splitTime).getTime() - new Date(a.splitTime).getTime());
      },

      getSplitRecordsByParent: (parentId) => {
        return get().splitRecords.filter((s) => s.parentSplitId === parentId);
      },

      getSplitRecordsByTarget: (targetType, targetId) => {
        return get().splitRecords.filter(
          (s) => s.targetType === targetType && s.targetId === targetId
        );
      },

      getSplitTree: (batchId) => {
        return get().splitRecords.filter((s) => s.batchId === batchId);
      },

      getDestinationDistribution: (batchId) => {
        const records = get().getSplitRecordsByBatch(batchId);
        const distribution: { [key: string]: { name: string; value: number; type: string } } = {};

        const addOrUpdate = (key: string, name: string, value: number, type: string) => {
          if (!distribution[key]) {
            distribution[key] = { name, value: 0, type };
          }
          distribution[key].value += value;
        };

        for (const record of records) {
          if (record.targetType === 'window') {
            addOrUpdate(record.targetId, record.targetName, record.quantity - record.remainQuantity, 'window');
          } else if (record.targetType === 'nurse') {
            addOrUpdate(record.targetId, record.targetName, record.quantity - record.remainQuantity, 'nurse');
          }
        }

        return Object.values(distribution);
      },

      getTotalDistributed: (batchId) => {
        const records = get().getSplitRecordsByBatch(batchId);
        return records.reduce((sum, r) => sum + (r.quantity - r.remainQuantity), 0);
      },
    }),
    {
      name: 'split-store',
    }
  )
);
