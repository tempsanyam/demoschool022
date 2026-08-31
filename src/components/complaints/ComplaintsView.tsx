import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintStatus, ComplaintPriority } from '../../types';
import { exportToExcel, exportToCSV, triggerSystemPrint } from '../../utils/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const ComplaintsView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    scopedComplaints,
    schools,
    selectedSchool,
    addComplaint,
    updateComplaint,
    deleteComplaint
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [formData, setFormData] = useState<Partial<Complaint>>({
    schoolUdise: selectedSchool?.udise || schools[0]?.udise || '',
    category: 'अधोसंरचना',
    priority: 'HIGH',
    title: '',
    description: '',
    complainantName: currentUser?.name || '',
    complainantMobile: currentUser?.mobile || '',
    status: 'OPEN',
    resolutionNotes: '',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const canResolve = currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN' || currentUser?.role === 'PRINCIPAL';

  // Filtered Complaints
  const filteredComplaints = useMemo(() => {
    return scopedComplaints.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.complainantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
      const matchPriority = selectedPriority === 'ALL' || c.priority === selectedPriority;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [scopedComplaints, searchTerm, selectedStatus, selectedPriority]);

  const handleOpenAdd = () => {
    setEditingComplaint(null);
    setFormData({
      schoolUdise: selectedSchool?.udise || schools[0]?.udise || '',
      category: 'अधोसंरचना',
      priority: 'HIGH',
      title: '',
      description: '',
      complainantName: currentUser?.name || 'पालक / शिक्षक',
      complainantMobile: '9826012345',
      status: 'OPEN',
      resolutionNotes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Complaint) => {
    setEditingComplaint(c);
    setFormData(c);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.schoolUdise) {
      alert('कृपया शिकायत का शीर्षक एवं विद्यालय का चयन करें।');
      return;
    }

    if (editingComplaint) {
      updateComplaint(formData as Complaint);
    } else {
      addComplaint(formData as Omit<Complaint, 'id' | 'createdAt'>);
    }
    setIsModalOpen(false);
  };

  const handleExport = (type: 'EXCEL' | 'CSV') => {
    const headers = [
      'क्रमांक',
      'शिकायत शीर्षक',
      'श्रेणी',
      'प्राथमिकता',
      'संबंधित विद्यालय',
      'शिकायतकर्ता',
      'मोबाइल',
      'स्थिति',
      'दर्ज दिनांक',
      'निराकरण विवरण'
    ];

    const rows = filteredComplaints.map((c, idx) => [
      idx + 1,
      c.title,
      c.category,
      c.priority,
      c.schoolUdise,
      c.complainantName,
      c.complainantMobile || '-',
      c.status,
      c.createdAt,
      c.resolutionNotes || '-'
    ]);

    const payload = {
      title: 'जन शिक्षा केंद्र मलगुवां - जन शिकायत एवं निवारण रजिस्टर',
      subtitle: `सत्र 2026-27 | कुल शिकायतें: ${filteredComplaints.length}`,
      headers,
      rows,
      fileName: 'Malguwa_Complaints_Register',
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
              जन शिकायत एवं समस्या निवारण (Grievance Redressal)
            </h2>
            <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              कुल {filteredComplaints.length} प्रकरण
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            पेयजल, शौचालय मरम्मत, मध्याह्न भोजन गुणवत्ता एवं शाला प्रबंधन संबंधी शिकायतों का पारदर्शी समाधान
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
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>नई शिकायत दर्ज करें</span>
          </button>
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
            placeholder="शीर्षक, शिकायतकर्ता, श्रेणी..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B6B4B]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium"
          >
            <option value="ALL">सभी स्थितियां</option>
            <option value="OPEN">लंबित (Open)</option>
            <option value="IN_PROGRESS">प्रगति पर (In Progress)</option>
            <option value="RESOLVED">निराकृत (Resolved)</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium"
          >
            <option value="ALL">सभी प्राथमिकताएं</option>
            <option value="HIGH">उच्च (High Priority)</option>
            <option value="MEDIUM">मध्यम (Medium)</option>
            <option value="LOW">सामान्य (Low)</option>
          </select>
        </div>
      </div>

      {/* Complaints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredComplaints.map((c) => {
          const sObj = schools.find((s) => s.udise === c.schoolUdise);
          return (
            <div
              key={c.id}
              className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    {c.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : c.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {c.priority}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : c.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  {c.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {c.description}
                </p>

                <div className="mt-3 p-2.5 bg-gray-50 dark:bg-[#0F1713] rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">विद्यालय:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {sObj?.name || sObj?.hindiName || c.schoolUdise}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">शिकायतकर्ता:</span>
                    <span>{c.complainantName} ({c.complainantMobile || 'संपर्क उपलब्ध'})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">दिनांक:</span>
                    <span>{c.createdAt}</span>
                  </div>
                  {c.resolutionNotes && (
                    <div className="pt-1.5 border-t border-gray-200 dark:border-gray-700 text-emerald-700 dark:text-emerald-400">
                      <strong>निराकरण:</strong> {c.resolutionNotes}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                {canResolve && (
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 rounded text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>निराकरण / अपडेट</span>
                  </button>
                )}
                {canResolve && (
                  <button
                    onClick={() => setDeleteTargetId(c.id)}
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
              {editingComplaint ? 'शिकायत निराकरण व स्थिति अपडेट' : 'नई जन शिकायत दर्ज करें'}
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  शिकायत का शीर्षक *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="उदा. हैंडपंप खराब होने से पेयजल संकट"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    शिकायत श्रेणी *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="अधोसंरचना">अधोसंरचना / भवन मरम्मत</option>
                    <option value="पेयजल">पेयजल व्यवस्था</option>
                    <option value="शौचालय">शौचालय सफाई / मरम्मत</option>
                    <option value="मध्याह्न भोजन">मध्याह्न भोजन गुणवत्ता</option>
                    <option value="शिक्षक उपस्थिति">शिक्षक उपस्थिति</option>
                    <option value="छात्रवृत्ति">छात्रवृत्ति एवं पाठ्यपुस्तक</option>
                    <option value="अन्य">अन्य समस्या</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    प्राथमिकता (Priority)
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as ComplaintPriority })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="HIGH">उच्च (High Priority)</option>
                    <option value="MEDIUM">मध्यम (Medium)</option>
                    <option value="LOW">सामान्य (Low)</option>
                  </select>
                </div>
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
                      {s.name || s.hindiName} ({s.udise})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  समस्या का विस्तृत विवरण *
                </label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    शिकायतकर्ता का नाम
                  </label>
                  <input
                    type="text"
                    value={formData.complainantName || ''}
                    onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    मोबाइल नंबर
                  </label>
                  <input
                    type="tel"
                    value={formData.complainantMobile || ''}
                    onChange={(e) => setFormData({ ...formData, complainantMobile: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>
              </div>

              {canResolve && (
                <div className="p-3 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="font-bold text-gray-800 dark:text-gray-200">
                    अधिकारी निराकरण अनुभाग (Resolution Section)
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      स्थिति अद्यतन (Status)
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ComplaintStatus })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                    >
                      <option value="OPEN">लंबित (Open)</option>
                      <option value="IN_PROGRESS">प्रगति पर (In Progress)</option>
                      <option value="RESOLVED">निराकृत (Resolved)</option>
                      <option value="REJECTED">अस्वीकृत (Rejected)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      निराकरण टिप्पणी (Resolution Notes)
                    </label>
                    <input
                      type="text"
                      value={formData.resolutionNotes || ''}
                      onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                      placeholder="उदा. PHE विभाग द्वारा बोरिंग मोटर सुधार दी गई है।"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
                    />
                  </div>
                </div>
              )}

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
                  className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
                >
                  शिकायत सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="शिकायत रिकॉर्ड हटाने की पुष्टि"
        message="क्या आप वास्तव में इस शिकायत को हटाना चाहते हैं? यह कार्यवाही ऑडिट लॉग में दर्ज की जाएगी।"
        confirmText="हटाएं"
        cancelText="रद्द करें"
        isDestructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteComplaint(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
