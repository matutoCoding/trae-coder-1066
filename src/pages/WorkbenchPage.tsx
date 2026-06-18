import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  CheckCircle,
  SkipForward,
  Clock,
  User,
  FileText,
  ChevronRight,
  Volume2,
  AlertCircle,
  X,
  TestTube,
  Barcode,
  Package,
} from 'lucide-react';
import { useWindowStore } from '../store/windowStore';
import { useTicketStore } from '../store/ticketStore';
import { useSplitStore } from '../store/splitStore';
import { useBatchStore } from '../store/batchStore';
import { getOptimalWindow } from '../utils/loadBalancer';
import type { Ticket } from '../types';

const WorkbenchPage = () => {
  const { windows, selectedWindowId, setSelectedWindowId, getWindowById } = useWindowStore();
  const {
    getWaitingTicketsByWindow,
    getCurrentTicketByWindow,
    callNextTicket,
    completeTicket,
    skipTicket,
    bindTube,
  } = useTicketStore();
  const { getSplitRecordsByTarget } = useSplitStore();
  const { getBatchById } = useBatchStore();

  const [isCalling, setIsCalling] = useState(false);
  const [showBindModal, setShowBindModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  const currentWindow = getWindowById(selectedWindowId);
  const currentTicket = getCurrentTicketByWindow(selectedWindowId);
  const waitingTickets = getWaitingTicketsByWindow(selectedWindowId);

  const optimalResult = getOptimalWindow(windows);
  const optimalWindow = optimalResult
    ? getWindowById(optimalResult.windowId)
    : null;

  const windowSplits = getSplitRecordsByTarget('window', selectedWindowId);

  const availableBatches = windowSplits
    .filter((s) => s.remainQuantity > 0)
    .map((s) => {
      const batch = getBatchById(s.batchId);
      return {
        splitId: s.id,
        batchId: s.batchId,
        batchNo: s.batchNo,
        tubeType: batch?.tubeType || '',
        remainQuantity: s.remainQuantity,
      };
    });

  const handleCallNext = () => {
    setIsCalling(true);
    const ticket = callNextTicket(selectedWindowId);
    if (ticket) {
      setTimeout(() => setIsCalling(false), 1500);
    } else {
      setIsCalling(false);
    }
  };

  const handleComplete = () => {
    if (currentTicket) {
      completeTicket(currentTicket.id);
    }
  };

  const handleSkip = () => {
    if (currentTicket) {
      skipTicket(currentTicket.id);
    }
  };

  const handleBindTube = () => {
    if (!currentTicket || !selectedBatchId || !barcodeInput.trim()) return;

    const selectedBatch = availableBatches.find((b) => b.batchId === selectedBatchId);
    if (selectedBatch) {
      bindTube(currentTicket.id, barcodeInput.trim(), selectedBatch.batchNo);
      setShowBindModal(false);
      setBarcodeInput('');
      setSelectedBatchId('');
    }
  };

  const statusConfig = {
    waiting: { label: '等待中', color: 'bg-gray-100 text-gray-600' },
    calling: { label: '叫号中', color: 'bg-blue-100 text-blue-600' },
    processing: { label: '进行中', color: 'bg-amber-100 text-amber-600' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
    skipped: { label: '已过号', color: 'bg-red-100 text-red-600' },
  };

  const windowStatusConfig = {
    open: { label: '营业中', color: 'bg-green-500', dotColor: 'bg-green-400' },
    closed: { label: '已关闭', color: 'bg-gray-400', dotColor: 'bg-gray-300' },
    busy: { label: '忙碌', color: 'bg-amber-500', dotColor: 'bg-amber-400' },
    idle: { label: '空闲', color: 'bg-blue-500', dotColor: 'bg-blue-400' },
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap">
        {windows.map((win) => (
          <button
            key={win.id}
            onClick={() => win.status !== 'closed' && setSelectedWindowId(win.id)}
            disabled={win.status === 'closed'}
            className={`relative px-5 py-3 rounded-xl transition-all duration-200 ${
              selectedWindowId === win.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                : win.status === 'closed'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  windowStatusConfig[win.status].dotColor
                }`}
              />
              <span className="font-bold">{win.name}</span>
            </div>
            <div className="text-xs mt-1 opacity-80">
              排队 {win.queueLength} 人
            </div>
            {optimalWindow?.id === win.id && selectedWindowId !== win.id && (
              <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full">
                最优
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-2">当前叫号</p>
              <AnimatePresence mode="wait">
                {currentTicket ? (
                  <motion.div
                    key={currentTicket.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="relative"
                  >
                    <div
                      className={`text-7xl font-bold mb-4 font-mono ${
                        currentTicket.status === 'calling'
                          ? 'text-blue-600'
                          : 'text-gray-800'
                      }`}
                    >
                      A{currentTicket.number}
                    </div>
                    {isCalling && (
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 rounded-3xl border-4 border-blue-400 opacity-50"
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-6xl font-bold text-gray-300 mb-4 font-mono"
                  >
                    ----
                  </motion.div>
                )}
              </AnimatePresence>

              {currentTicket && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3 mb-6"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <User className="w-5 h-5" />
                    <span className="text-lg font-medium">{currentTicket.patientName}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <FileText className="w-4 h-4" />
                    <span>{currentTicket.examType}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusConfig[currentTicket.status].color
                      }`}
                    >
                      {statusConfig[currentTicket.status].label}
                    </span>
                  </div>

                  {currentTicket.tubeBarcodes && currentTicket.tubeBarcodes.length > 0 && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-xl max-w-md mx-auto">
                      <p className="text-sm text-purple-600 font-medium mb-2">已绑定试管</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-500 flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            批次号
                          </span>
                          <span className="font-mono font-bold text-purple-800">
                            {currentTicket.tubeBatchNo}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-500 flex items-center gap-1">
                            <Barcode className="w-4 h-4" />
                            试管条码
                          </span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {currentTicket.tubeBarcodes.map((barcode, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-mono text-xs"
                              >
                                {barcode}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              <div className="flex justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCallNext}
                  disabled={waitingTickets.length === 0}
                  className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Mic className="w-6 h-6" />
                  下一位
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleComplete}
                  disabled={!currentTicket}
                  className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-600/30 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <CheckCircle className="w-6 h-6" />
                  完成
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkip}
                  disabled={!currentTicket}
                  className="flex items-center gap-2 px-6 py-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-5 h-5" />
                  过号
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">等待队列</h3>
              <span className="text-sm text-gray-500">
                共 {waitingTickets.length} 人
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {waitingTickets.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无等待人员</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {waitingTickets.map((ticket, index) => (
                    <motion.li
                      key={ticket.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold font-mono">
                            {ticket.number.toString().slice(-2)}
                          </span>
                          <div>
                            <p className="font-medium text-gray-800">
                              {ticket.patientName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {ticket.examType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            预计等{' '}
                            {Math.round(
                              ((index + 1) * (currentWindow?.avgWaitTime || 5))
                            )}{' '}
                            分钟
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {optimalResult && optimalWindow && optimalWindow.id !== selectedWindowId && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold">负载均衡提示</span>
              </div>
              <p className="text-sm opacity-90 mb-3">
                {optimalWindow.name} 目前最空闲
              </p>
              <p className="text-xs opacity-75">原因：{optimalResult.reason}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100"
          >
            <h3 className="font-bold text-gray-800 mb-4">窗口统计</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">今日已服务</span>
                <span className="text-2xl font-bold text-gray-800">
                  {currentWindow?.totalServed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">平均等待</span>
                <span className="text-2xl font-bold text-blue-600">
                  {currentWindow?.avgWaitTime || 0} 分钟
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">当前排队</span>
                <span className="text-2xl font-bold text-amber-600">
                  {currentWindow?.queueLength || 0} 人
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">窗口状态</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    windowStatusConfig[currentWindow?.status || 'closed'].color
                  } text-white`}
                >
                  {windowStatusConfig[currentWindow?.status || 'closed'].label}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100"
          >
            <h3 className="font-bold text-gray-800 mb-4">快捷操作</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                <Volume2 className="w-5 h-5" />
                <span className="font-medium">重复叫号</span>
              </button>
              <button
                onClick={() => {
                  if (currentTicket) {
                    setShowBindModal(true);
                    if (availableBatches.length > 0) {
                      setSelectedBatchId(availableBatches[0].batchId);
                    }
                  }
                }}
                disabled={!currentTicket}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube className="w-5 h-5" />
                <span className="font-medium">绑定试管</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showBindModal && currentTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBindModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">绑定试管</h3>
                <button
                  onClick={() => setShowBindModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-600 mb-1">受检者</p>
                  <p className="font-bold text-blue-800">
                    {currentTicket.patientName} · A{currentTicket.number}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择批次 <span className="text-red-500">*</span>
                  </label>
                  {availableBatches.length === 0 ? (
                    <p className="text-amber-600 text-sm p-3 bg-amber-50 rounded-xl">
                      当前窗口暂无可用试管，请先在拆分出库中分发试管
                    </p>
                  ) : (
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">请选择批次</option>
                      {availableBatches.map((batch) => (
                        <option key={batch.batchId} value={batch.batchId}>
                          {batch.batchNo} - {batch.tubeType} (剩余{batch.remainQuantity}支)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    试管条码 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Barcode className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="扫描或输入试管条码"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBindModal(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBindTube}
                    disabled={!selectedBatchId || !barcodeInput.trim() || availableBatches.length === 0}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    确认绑定
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkbenchPage;
