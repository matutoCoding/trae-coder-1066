import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, ArrowLeft, Volume2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWindowStore } from '../store/windowStore';
import { useTicketStore } from '../store/ticketStore';
import type { Ticket, Window } from '../types';

const DisplayPage = () => {
  const navigate = useNavigate();
  const { windows, getWindowById } = useWindowStore();
  const { getCurrentTicketByWindow, getWaitingTicketsByWindow, getTicketsByWindow } = useTicketStore();

  const [currentTime, setCurrentTime] = useState('');
  const [pulsing, setPulsing] = useState(false);

  const openWindows = windows.filter((w) => w.status !== 'closed');
  const totalWaiting = windows.reduce((sum, w) => sum + w.queueLength, 0);
  const totalServed = windows.reduce((sum, w) => sum + w.totalServed, 0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const callingTickets = useMemo(() => {
    return openWindows
      .map((win) => ({
        window: win,
        ticket: getCurrentTicketByWindow(win.id),
      }))
      .filter((item): item is { window: Window; ticket: Ticket } => item.ticket !== undefined);
  }, [openWindows, getCurrentTicketByWindow]);

  const upcomingByWindow = useMemo(() => {
    return openWindows.map((win) => {
      const waiting = getWaitingTicketsByWindow(win.id);
      return {
        window: win,
        upcoming: waiting.slice(0, 5),
        totalWaiting: waiting.length,
      };
    });
  }, [openWindows, getWaitingTicketsByWindow]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
      </div>

      <header className="py-8 px-8 text-center border-b border-white/10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          体检中心抽血叫号大屏
        </h1>
        <p className="text-slate-400 text-lg">Blood Collection Queue Display</p>
      </header>

      <div className="px-8 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <span className="text-3xl font-mono font-bold text-white">
              {currentTime}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-green-400" />
            <span className="text-xl">
              等待: <span className="font-bold text-green-400">{totalWaiting}</span> 人
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl">
              已完成: <span className="font-bold text-blue-400">{totalServed}</span> 人
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-sm">开放窗口</p>
          <p className="text-2xl font-bold">{openWindows.length} 个</p>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-3xl p-8 border border-blue-500/20"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">当前叫号</h2>
                <p className="text-slate-400 text-sm">正在呼叫的受检者请前往对应窗口</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {callingTickets.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <div className="text-8xl font-bold text-slate-700 font-mono mb-4">----</div>
                  <p className="text-slate-500 text-xl">暂无叫号</p>
                </div>
              ) : (
                callingTickets.map(({ window, ticket }, index) => {
                  const isCalling = ticket.status === 'calling';
                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative rounded-2xl p-6 border-2 ${
                        isCalling
                          ? 'bg-gradient-to-br from-blue-600/30 to-blue-800/20 border-blue-500/50 shadow-2xl shadow-blue-500/20'
                          : 'bg-slate-800/50 border-white/10'
                      }`}
                    >
                      {isCalling && (
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 rounded-2xl border-2 border-blue-400/30"
                        />
                      )}
                      {isCalling && pulsing && (
                        <motion.div
                          initial={{ scale: 1, opacity: 0.8 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          className="absolute inset-0 rounded-2xl border-4 border-blue-400"
                        />
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-300">{window.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isCalling
                              ? 'bg-blue-500 text-white animate-pulse'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isCalling ? '呼叫中' : '进行中'}
                        </span>
                      </div>

                      <div className="text-center">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={ticket.number}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className={`text-7xl font-bold font-mono mb-3 ${
                              isCalling ? 'text-blue-400' : 'text-white'
                            }`}
                          >
                            A{ticket.number}
                          </motion.div>
                        </AnimatePresence>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-2xl text-slate-200"
                        >
                          {ticket.patientName}
                        </motion.p>
                        <p className="text-sm text-slate-400 mt-2">{ticket.examType}</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-3xl p-6 border border-amber-500/20 h-full"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">即将叫号</h2>
                <p className="text-slate-400 text-xs">请做好准备</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
              {upcomingByWindow.map(({ window, upcoming, totalWaiting }, winIndex) => (
                <motion.div
                  key={window.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + winIndex * 0.1 }}
                  className="bg-slate-800/50 rounded-2xl p-4 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-200">{window.name}</h3>
                    <span className="text-xs text-amber-400 font-medium">
                      等待 {totalWaiting} 人
                    </span>
                  </div>

                  {upcoming.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 text-sm">
                      暂无等待人员
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcoming.map((ticket, idx) => (
                        <motion.div
                          key={ticket.id}
                          initial={{ x: 10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 + winIndex * 0.1 + idx * 0.05 }}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="relative">
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                                idx === 0
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-slate-700/50 text-slate-400'
                              }`}
                            >
                              {ticket.number.toString().slice(-2)}
                            </span>
                            {idx === 0 && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                              {ticket.patientName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {ticket.examType}
                            </p>
                          </div>
                          {idx === 0 && (
                            <ChevronRight className="w-4 h-4 text-amber-400" />
                          )}
                        </motion.div>
                      ))}
                      {totalWaiting > upcoming.length && (
                        <p className="text-center text-xs text-slate-500 pt-1">
                          还有 {totalWaiting - upcoming.length} 人等待...
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-4 bg-gradient-to-t from-slate-900 to-transparent">
        <div className="px-8 flex items-center justify-center gap-8 text-sm text-slate-500">
          <span>请在休息区耐心等候</span>
          <span>•</span>
          <span>叫号后请前往对应窗口</span>
          <span>•</span>
          <span>过号请重新取号</span>
        </div>
      </div>
    </div>
  );
};

export default DisplayPage;
