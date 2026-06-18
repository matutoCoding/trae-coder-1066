import type { Window, LoadBalanceResult } from '../types';

export const calculateWindowScore = (window: Window): number => {
  if (window.status === 'closed') return -Infinity;

  const queueLengthFactor = 1 / (window.queueLength + 1);
  const waitTimeFactor = 1 / (window.avgWaitTime + 1);
  const weightFactor = window.weight;

  const score = (queueLengthFactor * 0.6 + waitTimeFactor * 0.3) * weightFactor * 100;

  return score;
};

export const getOptimalWindow = (windows: Window[]): LoadBalanceResult | null => {
  const openWindows = windows.filter((w) => w.status !== 'closed');
  if (openWindows.length === 0) return null;

  let bestWindow: Window | null = null;
  let bestScore = -Infinity;

  for (const win of openWindows) {
    const score = calculateWindowScore(win);
    if (score > bestScore) {
      bestScore = score;
      bestWindow = win;
    }
  }

  if (!bestWindow) return null;

  const reasons: string[] = [];

  const sortedByQueue = [...openWindows].sort((a, b) => a.queueLength - b.queueLength);
  if (sortedByQueue[0].id === bestWindow.id) {
    reasons.push('队列最短');
  }

  const sortedByWait = [...openWindows].sort((a, b) => a.avgWaitTime - b.avgWaitTime);
  if (sortedByWait[0].id === bestWindow.id) {
    reasons.push('等待时间最短');
  }

  if (bestWindow.weight > 1) {
    reasons.push('效率较高');
  }

  return {
    windowId: bestWindow.id,
    score: Math.round(bestScore * 100) / 100,
    reason: reasons.length > 0 ? reasons.join('、') : '综合评分最高',
  };
};

export const checkNeedTransfer = (windows: Window[]): { from: string; to: string; count: number }[] => {
  const openWindows = windows.filter((w) => w.status !== 'closed');
  if (openWindows.length < 2) return [];

  const suggestions: { from: string; to: string; count: number }[] = [];

  const sorted = [...openWindows].sort((a, b) => b.queueLength - a.queueLength);
  const longest = sorted[0];
  const shortest = sorted[sorted.length - 1];

  const diff = longest.queueLength - shortest.queueLength;

  if (diff >= 5) {
    const transferCount = Math.floor(diff / 2);
    suggestions.push({
      from: longest.id,
      to: shortest.id,
      count: transferCount,
    });
  }

  return suggestions;
};

export const getAverageWaitTime = (windows: Window[]): number => {
  const openWindows = windows.filter((w) => w.status !== 'closed' && w.queueLength > 0);
  if (openWindows.length === 0) return 0;

  const total = openWindows.reduce((sum, w) => sum + w.avgWaitTime * w.queueLength, 0);
  const totalQueue = openWindows.reduce((sum, w) => sum + w.queueLength, 0);

  return totalQueue > 0 ? Math.round((total / totalQueue) * 10) / 10 : 0;
};

export const getTotalWaiting = (windows: Window[]): number => {
  return windows.reduce((sum, w) => sum + w.queueLength, 0);
};
