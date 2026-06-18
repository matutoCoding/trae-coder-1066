import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRightLeft,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useWindowStore } from '../store/windowStore';
import { useTicketStore } from '../store/ticketStore';
import {
  getTotalWaiting,
  getAverageWaitTime,
  checkNeedTransfer,
  getOptimalWindow,
} from '../utils/loadBalancer';

const MonitorPage = () => {
  const { windows, getWindowById, toggleWindowStatus } = useWindowStore();
  const { transferTicket, getWaitingTicketsByWindow } = useTicketStore();

  const totalWaiting = getTotalWaiting(windows);
  const avgWaitTime = getAverageWaitTime(windows);
  const openWindows = windows.filter((w) => w.status !== 'closed').length;
  const totalServed = windows.reduce((sum, w) => sum + w.totalServed, 0);
  const transferSuggestions = checkNeedTransfer(windows);
  const optimalResult = getOptimalWindow(windows);
  const optimalWindow = optimalResult ? getWindowById(optimalResult.windowId) : null;

  const maxQueue = Math.max(...windows.map((w) => w.queueLength), 1);

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

              return (
                <motion.div
                  key={win.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`relative rounded-2xl p-5 border-2 transition-all duration-300 ${
                    isClosed
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg'
                  }`}
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

                  <button
                    onClick={() => toggleWindowStatus(win.id)}
                    className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      isClosed
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {isClosed ? '开启窗口' : '关闭窗口'}
                  </button>
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
    </div>
  );
};

export default MonitorPage;
