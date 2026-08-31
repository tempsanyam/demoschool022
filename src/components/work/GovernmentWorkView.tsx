import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { GovernmentWork, WorkStatus } from '../../types';
import { exportToExcel, exportToCSV, triggerSystemPrint } from '../../utils/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const GovernmentWorkView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    scopedWork,
    schools,
    selectedSchool,
    addGovernmentWork,
    updateGovernmentWork,
    deleteGovernmentWork
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<GovernmentWork | null>(null);
  const [formData, setFormData] = useState<Partial<GovernmentWork>>({
    schoolUdise: selectedSchool?.udise || schools[0]?.udise || '',
    workName: '',
    orderNumber: `ORDER-2026-${Math.floor(100 + Math.random() * 900)}`,
    department: 'राज्य शिक्षा केंद्र, भोपाल',
    assignedDate: new Date().toISOString().split('T')[0],
    deadline: '2026-03-31',
    status: 'IN_PROGRESS',
    assignedTo: 'संस्था प्रधान',
    completionPercentage: 50,
    remarks: '',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const canEdit = currentUser?.role === 'CAC' || currentUser?.role === 'PRINCIPAL' || currentUser?.role === 'ADMIN';

  // Filtered Work
  const filteredWork = useMemo(() => {
    return scopedWork.filter((w) => {
      const matchSearch =
        w.workName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = selectedStatus === 'ALL' || w.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [scopedWork, searchTerm, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingWork(null);
    setFormData({
      schoolUdise: selectedSchool?.udise || schools[0]?.udise || '',
      workName: '',
      orderNumber: `RSK/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      department: 'राज्य शिक्षा केंद्र, म.प्र.',
      assignedDate: new Date().toISOString().split('T')[0],
      deadline: '2026-03-31',
      status: 'IN_PROGRESS',
      assignedTo: 'संस्था प्रधान',
      completionPercentage: 20,
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: GovernmentWork) => {
    setEditingWork(w);
    setFormData(w);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workName || !formData.schoolUdise) {
      alert('कृपया कार्य का नाम एवं विद्यालय का चयन करें।');
      return;
    }

    if (editingWork) {
      updateGovernmentWork(formData as GovernmentWork);
    } else {
      addGovernmentWork(formData as Omit<GovernmentWork, 'id'>);
    }
    setIsModalOpen(false);
  };

  const handleExport = (type: 'EXCEL' | 'CSV') => {
    const headers = [
      'क्रमांक',
      'शासकीय कार्य / आदेश नाम',
      'आदेश क्रमांक',
      'विभाग',
      'विद्यालय यूडाइस',
      'आवंटन तिथि',
      'अंतिम तिथि',
      'स्थिति',
      'प्रगति %',
      'प्रभारी अधिकारी'
    ];

    const rows = filteredWork.map((w, idx) => [
      idx + 1,
      w.workName,
      w.orderNumber,
      w.department,
      w.schoolUdise,
      w.assignedDate,
      w.deadline,
      w.status,
      `${w.completionPercentage}%`,
      w.assignedTo
    ]);

    const payload = {
      title: 'जन शिक्षा केंद्र मलगुवां - शासकीय कार्य एवं टास्क रजिस्टर',
      subtitle: `सत्र 2026-27 | कुल कार्य: ${filteredWork.length}`,
      headers,
      rows,
      fileName: 'Malguwa_Government_Work',
    };

    if (type === 'EXCEL') exportToExcel(payload);
    else exportToCSV(payload);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              शासकीय कार्य एवं आदेश अनुश्रवण (Government Tasks & Orders)
            </h2>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              कुल {filteredWork.length} कार्य
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            यूडाइस प्लस, अपार आईडी, समग्र सत्यापन, परीक्षा प्रपत्र एवं विभागीय समय-सीमा वाले कार्यों की निगरानी
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleExport('EXCEL')}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>एक्सेल (Excel)</span>
          </button>
          <button
            onClick={() => triggerSystemPrint()}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>प्रिंट (Print)</span>
          </button>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>नया कार्य आवंटित करें</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="कार्य नाम, आदेश क्रमांक, प्रभारी..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B6B4B]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium"
          >
            <option value="ALL">सभी स्थितियां (Status)</option>
            <option value="PENDING">लंबित (Pending)</option>
            <option value="IN_PROGRESS">प्रगति पर (In Progress)</option>
            <option value="COMPLETED">पूर्ण (Completed)</option>
            <option value="OVERDUE">अति-लंबित (Overdue)</option>
          </select>
        </div>
      </div>

      {/* Work Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWork.map((w) => {
          const sObj = schools.find((s) => s.udise === w.schoolUdise);
          return (
            <div
              key={w.id}
              className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                    {w.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      w.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : w.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : w.status === 'OVERDUE'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  {w.workName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  विभाग: {w.department} | विद्यालय: {sObj?.name || sObj?.hindiName || w.schoolUdise}
                </p>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-600 dark:text-gray-400">कार्य प्रगति:</span>
                    <span className="text-gray-900 dark:text-white">{w.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        w.completionPercentage >= 100
                          ? 'bg-emerald-600'
                          : w.completionPercentage >= 50
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${w.completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 text-xs space-y-1 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>📅 अंतिम तिथि (Deadline):</span>
                    <strong className="text-red-600 dark:text-red-400">{w.deadline}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>👤 प्रभारी / नोडल:</span>
                    <span>{w.assignedTo}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                {canEdit && (
                  <button
                    onClick={() => handleOpenEdit(w)}
                    className="p-1.5 text-gray-500 hover:text-emerald-600 rounded"
                    title="संशोधित करें"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => setDeleteTargetId(w.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 rounded"
                    title="हटाएं"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              {editingWork ? 'शासकीय कार्य अद्यतन करें' : 'नया शासकीय कार्य / आदेश जोड़ें'}
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  कार्य का नाम (Work/Order Name) *
                </label>
                <input
                  type="text"
                  value={formData.workName || ''}
                  onChange={(e) => setFormData({ ...formData, workName: e.target.value })}
                  placeholder="उदा. यूडाइस प्लस 2026-27 सत्यापन"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    आदेश क्रमांक
                  </label>
                  <input
                    type="text"
                    value={formData.orderNumber || ''}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    संबंधित विद्यालय *
                  </label>
                  <select
                    value={formData.schoolUdise}
                    onChange={(e) => setFormData({ ...formData, schoolUdise: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    {schools.map((s) => (
                      <option key={s.udise} value={s.udise}>
                        {s.name || s.hindiName} ({s.udise.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    अंतिम तिथि (Deadline) *
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    वर्तमान स्थिति (Status) *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkStatus })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="PENDING">लंबित (Pending)</option>
                    <option value="IN_PROGRESS">प्रगति पर (In Progress)</option>
                    <option value="COMPLETED">पूर्ण (Completed)</option>
                    <option value="OVERDUE">अति-लंबित (Overdue)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    प्रगति प्रतिशत (% Progress)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.completionPercentage}
                    onChange={(e) => setFormData({ ...formData, completionPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    प्रभारी शिक्षक / नोडल
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo || ''}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="शासकीय कार्य हटाने की पुष्टि"
        message="क्या आप वास्तव में इस कार्य का रिकॉर्ड हटाना चाहते हैं? यह कार्यवाही ऑडिट लॉग में दर्ज की जाएगी।"
        confirmText="हटाएं"
        cancelText="रद्द करें"
        isDestructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteGovernmentWork(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
