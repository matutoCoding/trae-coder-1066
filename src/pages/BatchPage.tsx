import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Calendar,
  Factory,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  ArrowRight,
  Filter,
  GitBranch,
  Users,
  TestTube,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Barcode,
  TrendingDown,
} from 'lucide-react';
import { useBatchStore } from '../store/batchStore';
import { useSplitStore } from '../store/splitStore';
import { useTicketStore } from '../store/ticketStore';
import { useWindowStore } from '../store/windowStore';
import type { Batch, SplitRecord } from '../types';

const tubeTypes = [
  'EDTA抗凝管',
  '血清分离胶管',
  '枸橼酸钠抗凝管',
  '肝素锂抗凝管',
  '血糖管',
  '血沉管',
];

const BatchPage = () => {
  const { batches, addBatch, getBatchStats, getActiveBatches } = useBatchStore();
  const { getSplitRecordsByBatch, getTotalDistributed, getChildSplits } = useSplitStore();
  const { tickets } = useTicketStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [expandedSplits, setExpandedSplits] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    batchNo: '',
    tubeType: 'EDTA抗凝管',
    totalQuantity: 500,
    manufactureDate: '',
    expireDate: '',
    supplier: '',
  });

  const stats = getBatchStats();

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.tubeType.includes(searchTerm) ||
      batch.supplier.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || batch.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBatch(formData);
    setShowAddModal(false);
    setFormData({
      batchNo: '',
      tubeType: 'EDTA抗凝管',
      totalQuantity: 500,
      manufactureDate: '',
      expireDate: '',
      supplier: '',
    });
  };

  const statusConfig = {
    active: { label: '有效', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    used: { label: '已用完', color: 'bg-gray-100 text-gray-600', icon: Package },
    expired: { label: '已过期', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  };

  const selectedBatchSplits = selectedBatch
    ? getSplitRecordsByBatch(selectedBatch.id)
    : [];

  const selectedBatchBoundTickets = selectedBatch
    ? tickets.filter(
        (t) => t.tubeBatchNo === selectedBatch.batchNo && t.tubeBarcodes && t.tubeBarcodes.length > 0
      )
    : [];

  const toggleSplitExpand = (splitId: string) => {
    setExpandedSplits((prev) => {
      const next = new Set(prev);
      if (next.has(splitId)) {
        next.delete(splitId);
      } else {
        next.add(splitId);
      }
      return next;
    });
  };

  const getBoundTicketsBySplit = (split: SplitRecord) => {
    if (split.targetType !== 'window' || !selectedBatch) return [];
    return tickets.filter(
      (t) =>
        t.windowId === split.targetId &&
        t.tubeBatchNo === selectedBatch.batchNo &&
        t.tubeBarcodes &&
        t.tubeBarcodes.length > 0
    );
  };

  const renderSplitTree = (splits: SplitRecord[], level: number = 0) => {
    return splits.map((split) => {
      const children = getChildSplits(split.id);
      const hasChildren = children.length > 0;
      const isExpanded = expandedSplits.has(split.id);
      const boundTickets = getBoundTicketsBySplit(split);

      const targetTypeLabel = {
        window: '窗口',
        nurse: '护士',
        sub_split: '子批次',
      }[split.targetType];

      const targetTypeColor = {
        window: 'bg-blue-100 text-blue-700',
        nurse: 'bg-amber-100 text-amber-700',
        sub_split: 'bg-purple-100 text-purple-700',
      }[split.targetType];

      const usagePercent =
        split.quantity > 0 ? ((split.quantity - split.remainQuantity) / split.quantity) * 100 : 0;

      return (
        <div key={split.id} style={{ marginLeft: level * 20 }}>
          <div
            className={`p-3 rounded-xl hover:bg-gray-50 transition-colors ${
              level > 0 ? 'border-l-2 border-gray-200 ml-3' : ''
            }`}
          >
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => hasChildren && toggleSplitExpand(split.id)}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )
              ) : (
                <div className="w-4" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${targetTypeColor}`}
                  >
                    {targetTypeLabel}
                  </span>
                  <span className="font-medium text-gray-800">{split.targetName}</span>
                  {split.level > 0 && (
                    <span className="text-xs text-gray-400">第{split.level}级拆分</span>
                  )}
                  {split.targetType === 'window' && boundTickets.length > 0 && (
                    <span className="text-xs text-blue-500">
                      已绑定 {boundTickets.length} 支
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {split.splitTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {split.operator}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">
                  <span
                    className={
                      split.remainQuantity <= 5
                        ? 'text-red-600'
                        : split.remainQuantity <= 20
                          ? 'text-amber-600'
                          : ''
                    }
                  >
                    {split.remainQuantity}
                  </span>{' '}
                  / {split.quantity} 支
                </div>
                <div className="mt-1 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      usagePercent > 80
                        ? 'bg-red-400'
                        : usagePercent > 50
                          ? 'bg-amber-400'
                          : 'bg-green-400'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {split.targetType === 'window' && boundTickets.length > 0 && (
              <div className="mt-3 ml-7 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-blue-700">
                  <Barcode className="w-3.5 h-3.5" />
                  已绑定试管条码
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {boundTickets.map((t) =>
                    t.tubeBarcodes?.map((bc, idx) => (
                      <div
                        key={`${t.id}-${idx}`}
                        className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-blue-200"
                      >
                        <span className="text-xs font-mono text-blue-800">{bc}</span>
                        <span className="text-xs text-gray-400">
                          A{t.number}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {hasChildren && isExpanded && renderSplitTree(children, level + 1)}
        </div>
      );
    });
  };

  const rootSplits = selectedBatchSplits.filter((s) => !s.parentSplitId);
  const totalUsed = selectedBatch ? selectedBatch.totalQuantity - selectedBatch.remainQuantity : 0;
  const totalDistributed = selectedBatch ? getTotalDistributed(selectedBatch.id) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500">批次总数</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
              <p className="text-xs text-gray-500">有效批次</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.totalTubes.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">试管总数</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Factory className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.used}</p>
              <p className="text-xs text-gray-500">已用完</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <h3 className="font-bold text-gray-800 text-lg">批次列表</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索批次号、类型、供应商..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'all' | 'active' | 'used' | 'expired')
              }
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="active">有效</option>
              <option value="used">已用完</option>
              <option value="expired">已过期</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              新增批次
            </motion.button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  批次号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  试管类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  有效期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  供应商
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBatches.map((batch, index) => {
                const StatusIcon = statusConfig[batch.status].icon;
                const usagePercent =
                  ((batch.totalQuantity - batch.remainQuantity) / batch.totalQuantity) * 100;
                const splitRecords = getSplitRecordsByBatch(batch.id);
                const totalDistributed = getTotalDistributed(batch.id);
                const boundCount = tickets.filter(
                  (t) => t.tubeBatchNo === batch.batchNo && t.tubeBarcodes && t.tubeBarcodes.length > 0
                ).length;

                return (
                  <motion.tr
                    key={batch.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800">{batch.batchNo}</div>
                      <div className="text-xs text-gray-400">
                        入库: {batch.createTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {batch.tubeType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800">
                        {batch.remainQuantity.toLocaleString()}{' '}
                        <span className="text-gray-400 text-sm">
                          / {batch.totalQuantity.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            usagePercent > 80
                              ? 'bg-red-400'
                              : usagePercent > 50
                                ? 'bg-amber-400'
                                : 'bg-green-400'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        已分发 {totalDistributed} · 已使用 {boundCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {batch.expireDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {batch.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusConfig[batch.status].color
                        }`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig[batch.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        查看详情
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">新增试管批次</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    批次号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.batchNo}
                    onChange={(e) =>
                      setFormData({ ...formData, batchNo: e.target.value })
                    }
                    placeholder="如：SG202606001"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    试管类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tubeType}
                    onChange={(e) =>
                      setFormData({ ...formData, tubeType: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {tubeTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    数量 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalQuantity: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      生产日期
                    </label>
                    <input
                      type="date"
                      value={formData.manufactureDate}
                      onChange={(e) =>
                        setFormData({ ...formData, manufactureDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      有效期至
                    </label>
                    <input
                      type="date"
                      value={formData.expireDate}
                      onChange={(e) =>
                        setFormData({ ...formData, expireDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    供应商
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    placeholder="请输入供应商名称"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    确认入库
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedBatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBatch(null)}
          >
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-800">{selectedBatch.batchNo}</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusConfig[selectedBatch.status].color
                    }`}
                  >
                    {React.createElement(statusConfig[selectedBatch.status].icon, { className: 'w-3.5 h-3.5' })}
                    {statusConfig[selectedBatch.status].label}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">试管类型</p>
                    <p className="font-bold text-gray-800">{selectedBatch.tubeType}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">总数量</p>
                    <p className="font-bold text-gray-800">
                      {selectedBatch.totalQuantity.toLocaleString()} 支
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-600 mb-1">剩余数量</p>
                    <p className="font-bold text-blue-800">
                      {selectedBatch.remainQuantity.toLocaleString()} 支
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-sm text-amber-600 mb-1">已使用</p>
                    <p className="font-bold text-amber-800">
                      {selectedBatchBoundTickets.length} 支
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">生产日期</p>
                    <p className="font-bold text-gray-800">{selectedBatch.manufactureDate || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">有效期至</p>
                    <p className="font-bold text-gray-800">{selectedBatch.expireDate}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">供应商</p>
                      <p className="font-bold text-gray-800">{selectedBatch.supplier || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">入库时间</p>
                      <p className="font-bold text-gray-800">{selectedBatch.createTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">使用进度</p>
                      <p className="font-bold text-gray-800">
                        {Math.round(((selectedBatch.totalQuantity - selectedBatch.remainQuantity) / selectedBatch.totalQuantity) * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                      style={{ width: `${((selectedBatch.totalQuantity - selectedBatch.remainQuantity) / selectedBatch.totalQuantity) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <GitBranch className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-gray-800 text-lg">拆分去向</h4>
                    <span className="text-sm text-gray-500 ml-auto">
                      共 {totalDistributed} 支已分发
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rootSplits.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂无拆分记录</p>
                      </div>
                    ) : (
                      renderSplitTree(rootSplits)
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-gray-800 text-lg">绑定记录</h4>
                    <span className="text-sm text-gray-500 ml-auto">
                      共 {selectedBatchBoundTickets.length} 条记录
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl overflow-hidden">
                    {selectedBatchBoundTickets.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <TestTube className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂无绑定记录</p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                排队号
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                姓名
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                窗口
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                试管条码
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                状态
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedBatchBoundTickets.map((ticket) => (
                              <tr key={ticket.id} className="hover:bg-white/50">
                                <td className="px-4 py-3">
                                  <span className="font-mono font-bold text-blue-600">
                                    A{ticket.number}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-gray-800">{ticket.patientName}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-gray-600 text-sm">
                                    {useWindowStore.getState().getWindowById(ticket.windowId)?.name || ticket.windowId}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {ticket.tubeBarcodes?.map((bc, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono"
                                      >
                                        {bc}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      ticket.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : ticket.status === 'calling'
                                          ? 'bg-blue-100 text-blue-700'
                                          : ticket.status === 'waiting'
                                            ? 'bg-gray-100 text-gray-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {{
                                      waiting: '等待中',
                                      calling: '叫号中',
                                      processing: '进行中',
                                      completed: '已完成',
                                      skipped: '已过号',
                                    }[ticket.status]}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
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

export default BatchPage;
