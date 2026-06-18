import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWindowStore } from '../store/windowStore';
import { useTicketStore } from '../store/ticketStore';

const DisplayPage = () => {
  const navigate = useNavigate();
  const { windows, getWindowById } = useWindowStore();
  const { getCurrentTicketByWindow, getWaitingTicketsByWindow } = useTicketStore();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="absolute top-6 left-6">
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

      <div className="p-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {openWindows.map((win, index) => {
            const currentTicket = getCurrentTicketByWindow(win.id);
            const waitingTickets = getWaitingTicketsByWindow(win.id);
            const isCalling = currentTicket?.status === 'calling';

            return (
              <motion.div
                key={win.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-3xl p-6 border ${
                  isCalling
                    ? 'border-blue-500/50 shadow-2xl shadow-blue-500/20'
                    : 'border-white/10'
                }`}
              >
                {isCalling && (
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-3xl border-2 border-blue-400/30"
                  />
                )}

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{win.name}</h3>
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isCalling ? 'bg-blue-400 animate-pulse' : 'bg-green-400'
                    }`}
                  />
                </div>

                <div className="text-center mb-6">
                  <p className="text-slate-400 text-sm mb-1">当前叫号</p>
                  <AnimatePresence mode="wait">
                    {currentTicket ? (
                      <motion.div
                        key={currentTicket.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{ type: 'spring' }}
                        className={`text-5xl font-bold font-mono ${
                          isCalling ? 'text-blue-400' : 'text-white'
                        }`}
                      >
                        A{currentTicket.number}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-5xl font-bold text-slate-600 font-mono"
                      >
                        ----
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {currentTicket && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-lg text-slate-300 mt-2"
                    >
                      {currentTicket.patientName}
                    </motion.p>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-slate-400">等待队列</span>
                    <span className="text-amber-400 font-medium">
                      {win.queueLength} 人
                    </span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-hidden">
                    {waitingTickets.slice(0, 4).map((ticket, i) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="flex items-center justify-between text-sm py-1.5 px-3 bg-white/5 rounded-lg"
                      >
                        <span className="text-slate-400">A{ticket.number}</span>
                        <span className="text-slate-500 text-xs">
                          {ticket.patientName}
                        </span>
                      </motion.div>
                    ))}
                    {win.queueLength > 4 && (
                      <p className="text-center text-xs text-slate-500 pt-1">
                        还有 {win.queueLength - 4} 人...
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
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
