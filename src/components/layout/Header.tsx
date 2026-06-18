import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell, Clock, Users } from 'lucide-react';
import { useTicketStore } from '../../store/ticketStore';
import { useWindowStore } from '../../store/windowStore';
import { getTotalWaiting, getAverageWaitTime } from '../../utils/loadBalancer';

const Header = () => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState('');
  const waitingCount = useTicketStore((state) => state.getWaitingCount());
  const completedCount = useTicketStore((state) => state.getCompletedCount());
  const windows = useWindowStore((state) => state.windows);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/': '叫号工作台',
      '/monitor': '负载监控大屏',
      '/batch': '试管批次管理',
      '/split': '拆分出库管理',
      '/ticket': '自助取号',
      '/display': '排队叫号大屏',
    };
    return titles[location.pathname] || '抽血排队系统';
  };

  const avgWaitTime = getAverageWaitTime(windows);
  const totalWaiting = getTotalWaiting(windows);
  const openWindows = windows.filter((w) => w.status !== 'closed').length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">{getPageTitle()}</h2>
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{currentTime}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Users className="w-4 h-4" />
            <span className="font-medium">开放窗口: {openWindows}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600">
            <Bell className="w-4 h-4" />
            <span className="font-medium">等待: {totalWaiting}人</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-600">
            <span className="font-medium">已完成: {completedCount}人</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600">
            <span className="font-medium">平均等待: {avgWaitTime}分钟</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
