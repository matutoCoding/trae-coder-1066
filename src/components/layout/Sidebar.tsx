import { NavLink } from 'react-router-dom';
import {
  ClipboardList,
  Activity,
  Package,
  SplitSquareVertical,
  Ticket,
  MonitorPlay,
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: '叫号工作台', icon: ClipboardList },
  { path: '/monitor', label: '负载监控', icon: Activity },
  { path: '/batch', label: '批次管理', icon: Package },
  { path: '/split', label: '拆分出库', icon: SplitSquareVertical },
  { path: '/ticket', label: '取号', icon: Ticket },
  { path: '/display', label: '排队大屏', icon: MonitorPlay },
];

const Sidebar = () => {
  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-full w-64 bg-slate-800 text-white flex flex-col z-50 shadow-xl"
    >
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-blue-100">抽血排队系统</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Blood Collection Queue</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isActive ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                      />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="activeIndicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-sm font-bold">
            护
          </div>
          <div>
            <p className="text-sm font-medium">李护士</p>
            <p className="text-xs text-slate-400">1号窗口</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
