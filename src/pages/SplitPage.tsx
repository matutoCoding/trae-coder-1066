import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SplitSquareVertical,
  Package,
  ArrowRight,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  PieChart,
  Users,
  Box,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useBatchStore } from '../store/batchStore';
import { useSplitStore } from '../store/splitStore';
import { useWindowStore } from '../store/windowStore';
import { useOperationStore } from '../store/operationStore';
import type { SplitRecord, SplitTargetType } from '../types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const SplitPage = () => {
  const { batches, getActiveBatches, getBatchById } = useBatchStore();
  const {
    splitRecords,
    addSplitRecord,
    getSplitRecordsByBatch,
    getSplitRecordsByParent,
    getDestinationDistribution,
    getTotalDistributed,
  } = useSplitStore();
  const { windows } = useWindowStore();
  const { checkStockWarnings, appConfig } = useOperationStore();

  const stockWarnings = checkStockWarnings();

  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'tree' | 'distribution'>('tree');

  const [formData, setFormData] = useState({
    quantity: 50,
    targetType: 'window' as SplitTargetType,
    targetId: '',
    targetName: '',
    operator: '管理员',
  });

  const selectedBatch = getBatchById(selectedBatchId);
  const batchSplitRecords = getSplitRecordsByBatch(selectedBatchId);
  const topLevelSplits = batchSplitRecords.filter((r) => !r.parentSplitId);
  const distributionData = getDestinationDistribution(selectedBatchId);
  const totalDistributed = getTotalDistributed(selectedBatchId);

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleOpenSplitModal = (parentId?: string) => {
    setSelectedParentId(parentId);
    if (parentId) {
      const parent = splitRecords.find((r) => r.id === parentId);
      if (parent) {
        setFormData({
          quantity: Math.min(50, parent.remainQuantity),
          targetType: 'window',
          targetId: '',
          targetName: '',
          operator: '管理员',
        });
      }
    } else {
      setFormData({
        quantity: 100,
        targetType: 'window',
        targetId: '',
        targetName: '',
        operator: '管理员',
      });
    }
    setShowSplitModal(true);
  };

  const handleSubmitSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    let targetName = formData.targetName;
    if (!targetName && formData.targetType === 'window') {
      const win = windows.find((w) => w.id === formData.targetId);
      targetName = win?.name || '';
    }

    const result = addSplitRecord(
      selectedBatchId,
      formData.quantity,
      formData.targetType,
      formData.targetId,
      targetName,
      formData.operator,
      selectedParentId
    );

    if (result) {
      setShowSplitModal(false);
      if (!expandedNodes.has(selectedParentId || selectedBatchId)) {
        setExpandedNodes(new Set([...expandedNodes, selectedParentId || selectedBatchId]));
      }
    }
  };

  const maxQuantity = selectedParentId
    ? splitRecords.find((r) => r.id === selectedParentId)?.remainQuantity || 0
    : selectedBatch?.remainQuantity || 0;

  const SplitTreeNode = ({ record, level = 0 }: { record: SplitRecord; level?: number }) => {
    const children = getSplitRecordsByParent(record.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(record.id);
    const usagePercent = ((record.quantity - record.remainQuantity) / record.quantity) * 100;

    return (
      <div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-stretch gap-3 py-2 ${level > 0 ? 'ml-8' : ''}`}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleNode(record.id)}
              className="flex items-center justify-center w-6 h-6 mt-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    record.targetType === 'window'
                      ? 'bg-blue-100 text-blue-600'
                      : record.targetType === 'nurse'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {record.targetType === 'window' ? (
                    <Users className="w-4 h-4" />
                  ) : record.targetType === 'nurse' ? (
                    <Box className="w-4 h-4" />
                  ) : (
                    <SplitSquareVertical className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{record.targetName}</p>
                  <p className="text-xs text-gray-400">
                    {record.splitTime} · {record.operator}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">
                  {record.remainQuantity} <span className="text-gray-400 font-normal">/ {record.quantity}</span>
                </p>
                <p className="text-xs text-gray-400">剩余 / 总数</p>
              </div>
            </div>

            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${
                  usagePercent > 80
                    ? 'bg-red-400'
                    : usagePercent > 50
                      ? 'bg-amber-400'
                      : 'bg-green-400'
                }`}
              />
            </div>

            {record.remainQuantity > 0 && (
              <button
                onClick={() => handleOpenSplitModal(record.id)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                继续拆分
              </button>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {children.map((child) => (
                <SplitTreeNode key={child.id} record={child} level={level + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {stockWarnings.length > 0 && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`rounded-2xl p-4 flex items-center gap-3 ${
            stockWarnings.some((w) => w.level === 'critical')
              ? 'bg-red-50 border border-red-200'
              : 'bg-amber-50 border border-amber-200'
          }`}
        >
          <AlertTriangle
            className={`w-6 h-6 ${
              stockWarnings.some((w) => w.level === 'critical')
                ? 'text-red-500'
                : 'text-amber-500'
            }`}
          />
          <div className="flex-1">
            <p
              className={`font-bold ${
                stockWarnings.some((w) => w.level === 'critical')
                  ? 'text-red-700'
                  : 'text-amber-700'
              }`}
            >
              试管库存预警
            </p>
            <p
              className={`text-sm ${
                stockWarnings.some((w) => w.level === 'critical')
                  ? 'text-red-600'
                  : 'text-amber-600'
              }`}
            >
              {stockWarnings
                .map((w) => {
                  const win = windows.find((win) => win.id === w.windowId);
                  return `${win?.name || w.windowId}${w.level === 'critical' ? '(危急)' : ''}`;
                })
                .join('、')}
              试管库存不足，请尽快补充
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-2xl font-bold text-gray-800">
                {selectedBatch?.remainQuantity.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">批次剩余</p>
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
              <SplitSquareVertical className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {batchSplitRecords.length}
              </p>
              <p className="text-xs text-gray-500">拆分记录</p>
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
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {totalDistributed.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">已分发</p>
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
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {distributionData.length}
              </p>
              <p className="text-xs text-gray-500">去向分布</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600 font-medium">选择批次</label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-64"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batchNo} - {batch.tubeType} ({batch.remainQuantity}支)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tree'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              拆分树
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'distribution'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              去向分布
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenSplitModal()}
            disabled={!selectedBatch || selectedBatch.remainQuantity === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Plus className="w-4 h-4" />
            批次拆分
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tree' && (
          <motion.div
            key="tree"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            {selectedBatch && (
              <div className="mb-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{selectedBatch.batchNo}</p>
                      <p className="text-sm text-gray-500">{selectedBatch.tubeType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">
                      {selectedBatch.remainQuantity}{' '}
                      <span className="text-base font-normal text-gray-400">
                        / {selectedBatch.totalQuantity}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">剩余 / 总数</p>
                  </div>
                </div>
              </div>
            )}

            {topLevelSplits.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <SplitSquareVertical className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">暂无拆分记录</p>
                <button
                  onClick={() => handleOpenSplitModal()}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  点击进行第一次拆分
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {topLevelSplits.map((record) => (
                  <SplitTreeNode key={record.id} record={record} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'distribution' && (
          <motion.div
            key="distribution"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80">
                <h4 className="font-bold text-gray-800 mb-4">去向分布饼图</h4>
                {distributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} 支`, '数量']}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-4">详细分布</h4>
                <div className="space-y-3">
                  {distributionData.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">暂无分发记录</p>
                  ) : (
                    distributionData.map((item, index) => {
                      const total = distributionData.reduce(
                        (sum, d) => sum + d.value,
                        0
                      );
                      const percent = total > 0 ? (item.value / total) * 100 : 0;

                      return (
                        <motion.div
                          key={item.name}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: COLORS[index % COLORS.length],
                                }}
                              />
                              <span className="font-medium text-gray-800">
                                {item.name}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  item.type === 'window'
                                    ? 'bg-blue-100 text-blue-600'
                                    : item.type === 'sub_split'
                                      ? 'bg-purple-100 text-purple-600'
                                      : 'bg-amber-100 text-amber-600'
                                }`}
                              >
                                {item.type === 'window' ? '窗口' : item.type === 'sub_split' ? '子批次' : '护士'}
                              </span>
                            </div>
                            <span className="font-bold text-gray-800">
                              {item.value} 支
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1 text-right">
                            {percent.toFixed(1)}%
                          </p>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSplitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSplitModal(false)}
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
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedParentId ? '子级拆分' : '批次拆分'}
                </h3>
                <button
                  onClick={() => setShowSplitModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitSplit} className="p-6 space-y-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-600 mb-1">可拆分数量</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {maxQuantity.toLocaleString()} 支
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    拆分数量 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Math.min(
                          maxQuantity,
                          Math.max(1, parseInt(e.target.value) || 0)
                        ),
                      })
                    }
                    max={maxQuantity}
                    min="1"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    目标类型
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetType: e.target.value as SplitTargetType,
                        targetId: '',
                        targetName: '',
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="window">抽血窗口</option>
                    <option value="nurse">护士个人</option>
                    <option value="sub_split">子批次</option>
                  </select>
                </div>

                {formData.targetType === 'window' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      选择窗口 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.targetId}
                      onChange={(e) =>
                        setFormData({ ...formData, targetId: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">请选择窗口</option>
                      {windows
                        .filter((w) => w.status !== 'closed')
                        .map((win) => (
                          <option key={win.id} value={win.id}>
                            {win.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {(formData.targetType === 'nurse' ||
                  formData.targetType === 'sub_split') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      目标名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.targetName}
                      onChange={(e) =>
                        setFormData({ ...formData, targetName: e.target.value })
                      }
                      placeholder={
                        formData.targetType === 'nurse' ? '护士姓名' : '子批次名称'
                      }
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    操作人
                  </label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) =>
                      setFormData({ ...formData, operator: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSplitModal(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={formData.quantity > maxQuantity || formData.quantity <= 0}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    确认拆分
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplitPage;
