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
  getChildSplits: (parentId: string) => SplitRecord[];
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

      getChildSplits: (parentId) => {
        return get().splitRecords.filter((s) => s.parentSplitId === parentId);
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

        const getLeafDistribution = (splitId: string, parentQuantity: number): void => {
          const children = get().getSplitRecordsByParent(splitId);

          if (children.length === 0) {
            const record = records.find((r) => r.id === splitId);
            if (record) {
              const usedQuantity = parentQuantity - record.remainQuantity;
              if (usedQuantity > 0) {
                addOrUpdate(
                  record.targetId,
                  record.targetName,
                  usedQuantity,
                  record.targetType
                );
              }
              if (record.remainQuantity > 0) {
                addOrUpdate(
                  `${record.targetId}-remain`,
                  `${record.targetName}(剩余)`,
                  record.remainQuantity,
                  record.targetType
                );
              }
            }
            return;
          }

          let distributed = 0;
          for (const child of children) {
            const childUsed = child.quantity;
            distributed += childUsed;
            getLeafDistribution(child.id, child.quantity);
          }

          const record = records.find((r) => r.id === splitId);
          if (record && parentQuantity - distributed > 0) {
            addOrUpdate(
              `${record.targetId}-remain`,
              `${record.targetName}(剩余)`,
              parentQuantity - distributed,
              record.targetType
            );
          }
        };

        for (const record of records) {
          if (record.parentSplitId) continue;

          if (record.targetType === 'sub_split') {
            getLeafDistribution(record.id, record.quantity);
          } else {
            const usedQuantity = record.quantity - record.remainQuantity;
            if (usedQuantity > 0) {
              addOrUpdate(
                record.targetId,
                record.targetName,
                usedQuantity,
                record.targetType
              );
            }
            if (record.remainQuantity > 0) {
              addOrUpdate(
                `${record.targetId}-remain`,
                `${record.targetName}(剩余)`,
                record.remainQuantity,
                record.targetType
              );
            }

            const children = get().getSplitRecordsByParent(record.id);
            for (const child of children) {
              getLeafDistribution(child.id, child.quantity);
            }
          }
        }

        return Object.values(distribution).filter((d) => d.value > 0);
      },

      getTotalDistributed: (batchId) => {
        const records = get().getSplitRecordsByBatch(batchId);
        const rootSplits = records.filter((r) => !r.parentSplitId);
        return rootSplits.reduce((sum, r) => sum + r.quantity, 0);
      },
    }),
    {
      name: 'split-store',
    }
  )
);
