import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRightLeft,
  RefreshCw,
  Zap,
  X,
  History,
  Mic,
  CheckCircle,
  SkipForward,
  TestTube,
  Calendar,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useWindowStore } from '../store/windowStore';
import { useTicketStore } from '../store/ticketStore';
import { useOperationStore } from '../store/operationStore';
import { useSplitStore } from '../store/splitStore';
import {
  getTotalWaiting,
  getAverageWaitTime,
  checkNeedTransfer,
  getOptimalWindow,
} from '../utils/loadBalancer';
import type { OperationType } from '../types';

const MonitorPage = () => {
  const { windows, getWindowById, toggleWindowStatus } = useWindowStore();
  const { transferTicket, getWaitingTicketsByWindow, getCurrentTicketByWindow } = useTicketStore();
  const { getRecordsByWindow, checkStockWarnings, appConfig } = useOperationStore();
  const { getSplitRecordsByTarget } = useSplitStore();

  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);

  const totalWaiting = getTotalWaiting(windows);
  const avgWaitTime = getAverageWaitTime(windows);
  const openWindows = windows.filter((w) => w.status !== 'closed').length;
  const totalServed = windows.reduce((sum, w) => sum + w.totalServed, 0);
  const transferSuggestions = checkNeedTransfer(windows);
  const optimalResult = getOptimalWindow(windows);
  const optimalWindow = optimalResult ? getWindowById(optimalResult.windowId) : null;
  const stockWarnings = useMemo(() => checkStockWarnings(), [checkStockWarnings]);

  const maxQueue = Math.max(...windows.map((w) => w.queueLength), 1);

  const selectedWindow = selectedWindowId ? getWindowById(selectedWindowId) : null;
  const selectedWindowRecords = selectedWindowId
    ? getRecordsByWindow(selectedWindowId, 20)
    : [];
  const selectedWindowCurrentTicket = selectedWindowId
    ? getCurrentTicketByWindow(selectedWindowId)
    : null;
  const selectedWindowWaiting = selectedWindowId
    ? getWaitingTicketsByWindow(selectedWindowId)
    : [];
  const selectedWindowSplits = selectedWindowId
    ? getSplitRecordsByTarget('window', selectedWindowId)
    : [];
  const selectedWindowStock = selectedWindowSplits.reduce(
    (sum, s) => sum + s.remainQuantity,
    0
  );
  const selectedWindowWarning = stockWarnings.find(
    (w) => w.windowId === selectedWindowId
  );

  const handleTransfer = (fromId: string, toId: string, count: number) => {
    const tickets = getWaitingTicketsByWindow(fromId);
    const ticketsToTransfer = tickets.slice(-count);
    ticketsToTransfer.forEach((ticket) => {
      transferTicket(ticket.id, toId);
    });
  };

  const windowStatusConfig = {
    open: { label: '营业中', color: 'bg-green-500', textColor: 'text-green-600' },
    closed: { label: '已关闭', color: 'bg-gray-400', textColor: 'text-gray-500' },
    busy: { label: '忙碌', color: 'bg-amber-500', textColor: 'text-amber-600' },
    idle: { label: '空闲', color: 'bg-blue-500', textColor: 'text-blue-600' },
  };

  const loadLevel = (queue: number) => {
    if (queue === 0) return 0;
    if (queue <= 2) return 33;
    if (queue <= 5) return 66;
    return 100;
  };

  const loadColor = (level: number) => {
    if (level < 33) return 'from-green-400 to-green-500';
    if (level < 66) return 'from-amber-400 to-amber-500';
    return 'from-red-400 to-red-500';
  };

  const operationIcon: Record<OperationType, typeof Clock> = {
    create: Calendar,
    call: Mic,
    bind_tube: TestTube,
    complete: CheckCircle,
    skip: SkipForward,
    transfer: ArrowRight,
    window_open: AlertCircle,
    window_close: AlertCircle,
  };

  const operationColor: Record<OperationType, string> = {
    create: 'bg-gray-100 text-gray-600',
    call: 'bg-blue-100 text-blue-600',
    bind_tube: 'bg-purple-100 text-purple-600',
    complete: 'bg-green-100 text-green-600',
    skip: 'bg-red-100 text-red-600',
    transfer: 'bg-amber-100 text-amber-600',
    window_open: 'bg-green-100 text-green-600',
    window_close: 'bg-gray-100 text-gray-600',
  };

  const operationLabel: Record<OperationType, string> = {
    create: '取号',
    call: '叫号',
    bind_tube: '绑定试管',
    complete: '完成抽血',
    skip: '过号',
    transfer: '窗口调剂',
    window_open: '窗口开启',
    window_close: '窗口关闭',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              实时
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalWaiting}</p>
          <p className="text-sm text-gray-500 mt-1">等待人数</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              平均
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{avgWaitTime} <span className="text-lg font-normal">分钟</span></p>
          <p className="text-sm text-gray-500 mt-1">平均等待时间</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              运行中
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{openWindows} <span className="text-lg font-normal">/ {windows.length}</span></p>
          <p className="text-sm text-gray-500 mt-1">开放窗口</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              今日
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalServed}</p>
          <p className="text-sm text-gray-500 mt-1">已服务人数</p>
        </motion.div>
      </div>

      {transferSuggestions.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-800 mb-1">负载均衡建议</h3>
              <p className="text-sm text-amber-700 mb-3">
                检测到窗口负载不均，建议进行跨窗口调剂以提升整体效率
              </p>
              <div className="space-y-2">
                {transferSuggestions.map((suggestion, index) => {
                  const fromWin = getWindowById(suggestion.from);
                  const toWin = getWindowById(suggestion.to);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/60 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-800">{fromWin?.name}</span>
                        <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                        <span className="font-medium text-gray-800">{toWin?.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          调剂 {suggestion.count} 人
                        </span>
                        <button
                          onClick={() =>
                            handleTransfer(suggestion.from, suggestion.to, suggestion.count)
                          }
                          className="px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          执行调剂
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {optimalWindow && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-teal-700">当前最优窗口</p>
              <p className="font-bold text-teal-800">
                {optimalWindow.name} - {optimalResult?.reason}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-teal-600">{optimalWindow.queueLength}人</p>
              <p className="text-xs text-teal-600">排队人数</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg">窗口负载监控</h3>
          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {windows.map((win, index) => {
              const level = loadLevel(win.queueLength);
              const isClosed = win.status === 'closed';
              const warning = stockWarnings.find((w) => w.windowId === win.id);

              return (
                <motion.div
                  key={win.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => setSelectedWindowId(win.id)}
                  className={`relative rounded-2xl p-5 border-2 transition-all duration-300 cursor-pointer ${
                    isClosed
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg'
                  } ${selectedWindowId === win.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-800 text-lg">{win.name}</h4>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          windowStatusConfig[win.status].color
                        } ${!isClosed ? 'animate-pulse' : ''}`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          windowStatusConfig[win.status].textColor
                        }`}
                      >
                        {windowStatusConfig[win.status].label}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-sm text-gray-500">排队人数</span>
                      <span className="text-3xl font-bold text-gray-800 font-mono">
                        {win.queueLength}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(win.queueLength / Math.max(maxQueue, 1)) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.7 + index * 0.1 }}
                        className={`h-full bg-gradient-to-r ${loadColor(level)} rounded-full`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">平均等待</p>
                      <p className="font-bold text-gray-700">{win.avgWaitTime} 分钟</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">今日服务</p>
                      <p className="font-bold text-gray-700">{win.totalServed} 人</p>
                    </div>
                  </div>

                  {warning && (
                    <div
                      className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                        warning.level === 'critical'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      库存不足
                    </div>
                  )}

                  <div className="mt-3 text-center text-xs text-gray-400">
                    点击查看详情
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="font-bold text-gray-800 text-lg mb-4">负载分布</h3>
          <div className="space-y-3">
            {windows
              .filter((w) => w.status !== 'closed')
              .map((win, index) => (
                <div key={win.id} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-gray-600 font-medium">
                    {win.name}
                  </span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(win.queueLength / Math.max(maxQueue, 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.9 + index * 0.1 }}
                      className={`h-full bg-gradient-to-r ${loadColor(
                        loadLevel(win.queueLength)
                      )} rounded-lg flex items-center justify-end pr-2`}
                    >
                      {win.queueLength > 0 && (
                        <span className="text-xs font-bold text-white">
                          {win.queueLength}
                        </span>
                      )}
                    </motion.div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="font-bold text-gray-800 text-lg mb-4">效率统计</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-600 mb-1">最高效窗口</p>
              <p className="text-xl font-bold text-blue-800">
                {[...windows]
                  .filter((w) => w.status !== 'closed')
                  .sort((a, b) => b.weight - a.weight)[0]?.name || '-'}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                权重{' '}
                {[...windows]
                  .filter((w) => w.status !== 'closed')
                  .sort((a, b) => b.weight - a.weight)[0]?.weight || 0}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-600 mb-1">最空闲窗口</p>
              <p className="text-xl font-bold text-green-800">
                {optimalWindow?.name || '-'}
              </p>
              <p className="text-xs text-green-500 mt-1">
                {optimalWindow?.queueLength || 0} 人等待
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-amber-600 mb-1">最繁忙窗口</p>
              <p className="text-xl font-bold text-amber-800">
                {[...windows]
                  .filter((w) => w.status !== 'closed')
                  .sort((a, b) => b.queueLength - a.queueLength)[0]?.name || '-'}
              </p>
              <p className="text-xs text-amber-500 mt-1">
                {[...windows]
                  .filter((w) => w.status !== 'closed')
                  .sort((a, b) => b.queueLength - a.queueLength)[0]?.queueLength || 0}{' '}
                人等待
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm text-purple-600 mb-1">负载均衡度</p>
              <p className="text-xl font-bold text-purple-800">
                {openWindows > 0
                  ? Math.round(
                      (1 -
                        (Math.max(...windows.map((w) => w.queueLength)) -
                          Math.min(
                            ...windows
                              .filter((w) => w.status !== 'closed')
                              .map((w) => w.queueLength)
                          )) /
                          Math.max(totalWaiting, 1)) *
                        100
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-purple-500 mt-1">均衡度越高越好</p>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedWindow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedWindowId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-800">{selectedWindow.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                      windowStatusConfig[selectedWindow.status].color
                    }`}
                  >
                    {windowStatusConfig[selectedWindow.status].label}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedWindowId(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-600 mb-1">当前叫号</p>
                    <p className="text-2xl font-bold text-blue-800 font-mono">
                      {selectedWindowCurrentTicket
                        ? `A${selectedWindowCurrentTicket.number}`
                        : '--'}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      {selectedWindowCurrentTicket?.patientName || '无'}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-amber-600 mb-1">等待人数</p>
                    <p className="text-2xl font-bold text-amber-800">
                      {selectedWindowWaiting.length}
                    </p>
                    <p className="text-xs text-amber-500 mt-1">人排队</p>
                  </div>
                  <div
                    className={`rounded-xl p-4 text-center ${
                      selectedWindowStock <= appConfig.criticalThreshold
                        ? 'bg-red-50'
                        : selectedWindowStock <= appConfig.stockThreshold
                          ? 'bg-amber-50'
                          : 'bg-green-50'
                    }`}
                  >
                    <p
                      className={`text-sm mb-1 ${
                        selectedWindowStock <= appConfig.criticalThreshold
                          ? 'text-red-600'
                          : selectedWindowStock <= appConfig.stockThreshold
                            ? 'text-amber-600'
                            : 'text-green-600'
                      }`}
                    >
                      试管库存
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        selectedWindowStock <= appConfig.criticalThreshold
                          ? 'text-red-800'
                          : selectedWindowStock <= appConfig.stockThreshold
                            ? 'text-amber-800'
                            : 'text-green-800'
                      }`}
                    >
                      {selectedWindowStock}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        selectedWindowStock <= appConfig.criticalThreshold
                          ? 'text-red-500'
                          : selectedWindowStock <= appConfig.stockThreshold
                            ? 'text-amber-500'
                            : 'text-green-500'
                      }`}
                    >
                      {selectedWindowWarning
                        ? selectedWindowWarning.level === 'critical'
                          ? '库存危急'
                          : '库存不足'
                        : '充足'}
                    </p>
                  </div>
                </div>

                {selectedWindowWaiting.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-bold text-gray-800 mb-3">等待队列</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedWindowWaiting.slice(0, 5).map((ticket, idx) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-bold font-mono">
                              {ticket.number.toString().slice(-2)}
                            </span>
                            <span className="text-sm text-gray-800">{ticket.patientName}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            预计等 {((idx + 1) * (selectedWindow?.avgWaitTime || 5))} 分钟
                          </span>
                        </div>
                      ))}
                      {selectedWindowWaiting.length > 5 && (
                        <p className="text-xs text-gray-400 text-center pt-1">
                          还有 {selectedWindowWaiting.length - 5} 人等待
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-gray-800">最近处理记录</h4>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {selectedWindowRecords.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-sm">
                        暂无处理记录
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100" />
                        <ul className="space-y-3">
                          {selectedWindowRecords
                            .filter((r) => r.ticketId)
                            .slice(0, 10)
                            .map((record) => {
                              const Icon = operationIcon[record.type] || Clock;
                              return (
                                <li key={record.id} className="relative pl-10">
                                  <div
                                    className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${
                                      operationColor[record.type]
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-gray-800 text-sm">
                                        A{record.ticketNumber} {record.patientName}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {record.timestamp}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                                          operationColor[record.type]
                                        }`}
                                      >
                                        {operationLabel[record.type]}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {record.description}
                                      </span>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => toggleWindowStatus(selectedWindow.id)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    selectedWindow.status === 'closed'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {selectedWindow.status === 'closed' ? '开启窗口' : '关闭窗口'}
                </button>
                <button
                  onClick={() => setSelectedWindowId(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonitorPage;
