import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket as TicketIcon,
  User,
  FileText,
  ArrowLeft,
  CheckCircle,
  Clock,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTicketStore } from '../store/ticketStore';
import { useWindowStore } from '../store/windowStore';
import { getOptimalWindow } from '../utils/loadBalancer';

const examTypes = [
  { value: '入职体检', label: '入职体检', icon: '💼' },
  { value: '年度体检', label: '年度体检', icon: '📅' },
  { value: '健康体检', label: '健康体检', icon: '❤️' },
  { value: '妇科体检', label: '妇科体检', icon: '🌸' },
  { value: '入职体检', label: '入职体检', icon: '💼' },
];

const TicketPage = () => {
  const navigate = useNavigate();
  const { addTicket } = useTicketStore();
  const { windows, getWindowById } = useWindowStore();

  const [step, setStep] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [newTicket, setNewTicket] = useState<ReturnType<typeof addTicket> | null>(null);

  const optimalResult = getOptimalWindow(windows);
  const optimalWindow = optimalResult ? getWindowById(optimalResult.windowId) : null;
  const totalWaiting = windows.reduce((sum, w) => sum + w.queueLength, 0);

  const handleGetTicket = () => {
    if (!patientName.trim() || !selectedExam) return;
    const ticket = addTicket(patientName, selectedExam);
    setNewTicket(ticket);
    setStep(3);
  };

  const assignedWindow = newTicket ? getWindowById(newTicket.windowId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex flex-col">
      <header className="p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回工作台</span>
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-6 bg-white rounded-3xl shadow-2xl flex items-center justify-center"
                >
                  <TicketIcon className="w-12 h-12 text-blue-600" />
                </motion.div>
                <h1 className="text-3xl font-bold text-white mb-2">自助取号</h1>
                <p className="text-blue-100">请输入您的信息获取排队号</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-white/90 mb-3 text-sm font-medium">
                    <User className="w-4 h-4" />
                    您的姓名
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="请输入姓名"
                    className="w-full px-5 py-4 bg-white/90 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all text-lg"
                  />
                </div>

                <div className="mb-8">
                  <label className="flex items-center gap-2 text-white/90 mb-3 text-sm font-medium">
                    <FileText className="w-4 h-4" />
                    体检类型
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {examTypes.slice(0, 4).map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedExam(type.value)}
                        className={`p-4 rounded-2xl transition-all duration-200 text-left ${
                          selectedExam === type.value
                            ? 'bg-white text-blue-600 shadow-lg scale-105'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="font-medium text-sm">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  disabled={!patientName.trim() || !selectedExam}
                  className="w-full py-5 bg-white text-blue-600 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  获取排队号
                </motion.button>
              </div>

              {optimalWindow && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 text-center text-white/80 text-sm"
                >
                  <p>当前共 {totalWaiting} 人等待，{optimalWindow.name} 最空闲</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                  确认取号信息
                </h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-500">姓名</span>
                    <span className="font-bold text-gray-800">{patientName}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-500">体检类型</span>
                    <span className="font-bold text-gray-800">{selectedExam}</span>
                  </div>
                  {optimalWindow && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                      <span className="text-blue-600 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        推荐窗口
                      </span>
                      <span className="font-bold text-blue-600">
                        {optimalWindow.name} ({optimalWindow.queueLength}人)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 font-medium rounded-2xl hover:bg-gray-200 transition-colors"
                  >
                    返回修改
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGetTicket}
                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
                  >
                    确认取号
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && newTicket && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md"
            >
              <motion.div
                initial={{ rotateY: 90 }}
                animate={{ rotateY: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
                className="bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.5 }}
                    className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="text-blue-100 text-sm mb-1">您的排队号是</p>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', delay: 0.6 }}
                    className="text-6xl font-bold font-mono text-white tracking-wider"
                  >
                    A{newTicket.number}
                  </motion.div>
                </div>

                <div className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">姓名</span>
                      <span className="font-bold text-gray-800">{newTicket.patientName}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">体检类型</span>
                      <span className="font-bold text-gray-800">{newTicket.examType}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">抽血窗口</span>
                      <span className="font-bold text-blue-600">
                        {assignedWindow?.name || '分配中'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-500">预计等待</span>
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        约 {assignedWindow ? assignedWindow.avgWaitTime * assignedWindow.queueLength : 0} 分钟
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 rounded-2xl">
                    <p className="text-amber-700 text-sm flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      请在休息区等候，听到叫号后前往对应窗口抽血
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={() => {
                  setStep(1);
                  setPatientName('');
                  setSelectedExam('');
                  setNewTicket(null);
                }}
                className="w-full mt-6 py-4 bg-white/20 text-white font-medium rounded-2xl backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                再取一个号
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TicketPage;
