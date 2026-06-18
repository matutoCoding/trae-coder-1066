import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import WorkbenchPage from '@/pages/WorkbenchPage';
import MonitorPage from '@/pages/MonitorPage';
import BatchPage from '@/pages/BatchPage';
import SplitPage from '@/pages/SplitPage';
import TicketPage from '@/pages/TicketPage';
import DisplayPage from '@/pages/DisplayPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<WorkbenchPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/batch" element={<BatchPage />} />
          <Route path="/split" element={<SplitPage />} />
        </Route>
        <Route path="/ticket" element={<TicketPage />} />
        <Route path="/display" element={<DisplayPage />} />
      </Routes>
    </Router>
  );
}
