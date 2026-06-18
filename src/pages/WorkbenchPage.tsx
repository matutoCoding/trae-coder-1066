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
} from 'lucide-react';
import { useWindowStore } from '../store/windowStore';
import { useTicketStore } from '../store/ticketStore';
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
  } = useTicketStore();

  const [isCalling, setIsCalling] = useState(false);

  const currentWindow = getWindowById(selectedWindowId);
  const currentTicket = getCurrentTicketByWindow(selectedWindowId);
  const waitingTickets = getWaitingTicketsByWindow(selectedWindowId);

  const optimalResult = getOptimalWindow(windows);
  const optimalWindow = optimalResult
    ? getWindowById(optimalResult.windowId)
    : null;

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
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">
                <FileText className="w-5 h-5" />
                <span className="font-medium">绑定试管</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WorkbenchPage;
