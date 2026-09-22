import React, { useState, useMemo, useRef } from 'react';
import {
  Utensils,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  Eye,
  Edit2,
  Trash2,
  School,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Award,
  HeartPulse,
  CreditCard,
  Building2,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import { Rasoiya } from '../../types';
import { exportToExcel } from '../../utils/exportUtils';
import { printReport } from '../../utils/printUtils';
import { RasoiyaProfileModal } from './RasoiyaProfileModal';
import { RasoiyaPrintModal } from './RasoiyaPrintModal';

export const RasoiyaView: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedSessionId } = useData();
  const {
    rasoiya: scopedRasoiya,
    schools,
    currentSchool,
    currentSchoolUdise,
    isSchoolUser: isSchoolRestricted,
    addRasoiya,
    updateRasoiya,
    deleteRasoiya
  } = useSchoolScope();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>(
    isSchoolRestricted ? (currentSchoolUdise || schools[0]?.udise || '') : 'ALL'
  );
  const [trainingFilter, setTrainingFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Input ref for quick focus on search
  const searchInputRef = useRef<HTMLInputElement>(null);
  const handleTriggerSearch = () => {
    searchInputRef.current?.focus();
  };

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRasoiya, setEditingRasoiya] = useState<Rasoiya | null>(null);
  const [viewingRasoiya, setViewingRasoiya] = useState<Rasoiya | null>(null);
  const [printingRasoiya, setPrintingRasoiya] = useState<Rasoiya | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const canEdit = currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SCHOOL';

  // Form State
  const initialFormState: Partial<Rasoiya> = {
    name: '',
    schoolUdise: isSchoolRestricted ? (currentSchoolUdise || schools[0]?.udise || '') : (schools[0]?.udise || ''),
    mobile: '',
    aadhaarNumber: '',
    gender: 'FEMALE',
    category: 'OBC',
    caste: '',
    joiningDate: new Date().toISOString().split('T')[0],
    trainingStatus: 'TRAINED',
    healthCheckupStatus: 'UP_TO_DATE',
    lastHealthCheckupDate: new Date().toISOString().split('T')[0],
    bankName: 'State Bank of India',
    bankAccount: '',
    ifsc: 'SBIN0001234',
    branchName: 'खिरकिया',
    paymentStatus: 'PAID',
    monthlyHonorarium: 2000,
    shgName: 'माँ शारदा स्व-सहायता समूह',
    shgId: '',
    status: 'ACTIVE',
    workLocation: 'विद्यालय मध्याह्न भोजन रसोई शेड',
    remarks: ''
  };

  const [formData, setFormData] = useState<Partial<Rasoiya>>(initialFormState);

  // Auto-sync school filter if restricted
  React.useEffect(() => {
    if (isSchoolRestricted && currentSchoolUdise) {
      setSelectedSchoolFilter(currentSchoolUdise);
      setFormData((prev) => ({ ...prev, schoolUdise: currentSchoolUdise }));
    }
  }, [isSchoolRestricted, currentSchoolUdise]);

  // Filtered List
  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return scopedRasoiya.filter((item) => {
      // School filter
      if (!isSchoolRestricted && selectedSchoolFilter !== 'ALL') {
        if (item.schoolUdise !== selectedSchoolFilter) return false;
      }

      // Training filter
      if (trainingFilter !== 'ALL') {
        if (item.trainingStatus !== trainingFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (item.status !== statusFilter) return false;
      }

      // Search term
      if (term) {
        const sObj = schools.find((s) => s.udise === item.schoolUdise);
        const schoolName = (sObj?.hindiName || sObj?.name || item.schoolName || '').toLowerCase();
        const matches =
          (item.name || '').toLowerCase().includes(term) ||
          (item.mobile || '').includes(term) ||
          (item.aadhaarNumber || '').includes(term) ||
          (item.id || '').toLowerCase().includes(term) ||
          (item.caste || '').toLowerCase().includes(term) ||
          (item.shgName || '').toLowerCase().includes(term) ||
          (item.schoolUdise || '').includes(term) ||
          schoolName.includes(term);

        if (!matches) return false;
      }

      return true;
    });
  }, [scopedRasoiya, searchTerm, selectedSchoolFilter, trainingFilter, statusFilter, isSchoolRestricted, schools]);

  // Statistics
  const stats = useMemo(() => {
    const total = scopedRasoiya.length;
    const trained = scopedRasoiya.filter((r) => r.trainingStatus === 'TRAINED').length;
    const untrained = total - trained;
    const active = scopedRasoiya.filter((r) => r.status === 'ACTIVE').length;
    const upToDateHealth = scopedRasoiya.filter((r) => r.healthCheckupStatus === 'UP_TO_DATE').length;
    return { total, trained, untrained, active, upToDateHealth };
  }, [scopedRasoiya]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingRasoiya(null);
    setFormData({
      ...initialFormState,
      schoolUdise: isSchoolRestricted ? (currentSchoolUdise || schools[0]?.udise || '') : (schools[0]?.udise || '')
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: Rasoiya) => {
    setEditingRasoiya(item);
    setFormData({ ...item });
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('कृपया रसोइया का नाम दर्ज करें।');
      return;
    }

    const schoolUdise = isSchoolRestricted ? currentSchoolUdise : (formData.schoolUdise || schools[0]?.udise || '');
    const sObj = schools.find((s) => s.udise === schoolUdise);

    if (editingRasoiya) {
      updateRasoiya({
        ...(formData as Rasoiya),
        id: editingRasoiya.id,
        schoolUdise,
        schoolName: sObj?.hindiName || sObj?.name || formData.schoolName || schoolUdise
      });
    } else {
      addRasoiya({
        ...(formData as Omit<Rasoiya, 'id'>),
        name: formData.name.trim(),
        schoolUdise,
        schoolName: sObj?.hindiName || sObj?.name || schoolUdise
      });
    }

    setIsFormModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteRasoiya(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      'क्र.', 'रसोइया आईडी', 'रसोइया का नाम', 'विद्यालय का नाम', 'UDISE कोड',
      'मोबाइल नंबर', 'आधार नंबर', 'लिंग', 'सामाजिक वर्ग', 'जाति',
      'कार्यभार ग्रहण दिनांक', 'पाककला प्रशिक्षण', 'स्वास्थ्य परीक्षण', 'संबद्ध समूह',
      'बैंक खाता', 'IFSC', 'बैंक नाम', 'मासिक मानदेय', 'मानदेय स्थिति', 'सेवा स्थिति'
    ];

    const rows = filteredList.map((r, idx) => {
      const sObj = schools.find((s) => s.udise === r.schoolUdise);
      return [
        idx + 1,
        r.id,
        r.name,
        sObj?.hindiName || sObj?.name || r.schoolName || r.schoolUdise,
        r.schoolUdise,
        r.mobile || '-',
        canEdit ? (r.aadhaarNumber || '-') : (r.aadhaarNumber ? `•••• •••• ${r.aadhaarNumber.slice(-4)}` : '-'),
        r.gender === 'FEMALE' ? 'महिला' : 'पुरुष',
        r.category || 'OBC',
        r.caste || '-',
        r.joiningDate || '-',
        r.trainingStatus === 'TRAINED' ? 'प्रशिक्षित' : 'अप्रशिक्षित',
        r.healthCheckupStatus === 'UP_TO_DATE' ? 'अद्यतन' : 'नियमित/लंबित',
        r.shgName || '-',
        r.bankAccount || '-',
        r.ifsc || '-',
        r.bankName || '-',
        r.monthlyHonorarium || 2000,
        r.paymentStatus === 'PAID' ? 'पूर्ण' : 'लंबित',
        r.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'
      ];
    });

    exportToExcel({
      title: 'जन शिक्षा केंद्र मलगुवां - रसोइया पंजी एवं विवरण',
      subtitle: `सत्र ${selectedSessionId} | कुल रसोइया: ${filteredList.length}`,
      schoolName: currentSchool?.name || currentSchool?.hindiName,
      udise: isSchoolRestricted ? currentSchoolUdise : (selectedSchoolFilter === 'ALL' ? undefined : selectedSchoolFilter),
      session: selectedSessionId,
      headers,
      rows,
      fileName: `Rasoiya_List_${selectedSessionId}_${new Date().toISOString().split('T')[0]}`
    });
  };

  // Official Report Print Handler
  const handlePrintReport = () => {
    const headers = [
      'क्र.', 'रसोइया का नाम', 'पदस्थ विद्यालय', 'UDISE कोड',
      'मोबाइल', 'संबद्ध समूह (SHG)', 'बैंक खाता विवरण', 'स्थिति'
    ];

    const rows = filteredList.map((r, idx) => {
      const sObj = schools.find((s) => s.udise === r.schoolUdise);
      const schoolName = sObj?.hindiName || sObj?.name || r.schoolName || r.schoolUdise;
      return [
        idx + 1,
        r.name,
        schoolName,
        r.schoolUdise,
        r.mobile || '-',
        r.shgName || '-',
        `${r.bankName || 'SBI'} (${r.bankAccount || '-'})`,
        r.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'
      ];
    });

    const activeSchoolName = isSchoolRestricted
      ? (currentSchool?.hindiName || currentSchool?.name)
      : (selectedSchoolFilter !== 'ALL' ? schools.find(s => s.udise === selectedSchoolFilter)?.hindiName : undefined);

    printReport(
      {
        title: 'रसोइया (Cook) प्रबंधन पंजी',
        subtitle: 'विद्यालयवार रसोइया एवं संबंधित सेवा जानकारी का प्रबंधन',
        session: selectedSessionId,
        schoolName: activeSchoolName,
        udise: isSchoolRestricted ? currentSchoolUdise : (selectedSchoolFilter !== 'ALL' ? selectedSchoolFilter : undefined),
        headers,
        rows,
        summaryMetrics: [
          { label: 'कुल रसोइया', value: stats.total },
          { label: 'सक्रिय रसोइया', value: stats.active },
          { label: 'प्रशिक्षित', value: stats.trained },
          { label: 'स्वास्थ्य अद्यतन', value: stats.upToDateHealth }
        ],
        fileName: `Rasoiya_Register_${selectedSessionId}`
      },
      {
        orientation: 'landscape',
        reportStyle: 'PROFESSIONAL'
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Utensils className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                रसोइया (Cook) प्रबंधन
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                विद्यालयवार रसोइया एवं संबंधित सेवा जानकारी का प्रबंधन
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions: + रसोइया जोड़ें, खोजें, Print, PDF, Excel */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              id="btn-add-new-rasoiya"
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="नया रसोइया जोड़ें"
            >
              <Plus className="w-4 h-4" />
              + रसोइया जोड़ें
            </button>
          )}

          <button
            id="btn-search-rasoiya"
            onClick={handleTriggerSearch}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="खोज बॉक्स पर जाएं"
          >
            <Search className="w-4 h-4 text-gray-500" />
            🔍 खोजें
          </button>

          <button
            id="btn-print-rasoiya-list"
            onClick={() => window.print()}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="प्रिंट करें"
          >
            <Printer className="w-4 h-4" />
            🖨 Print
          </button>

          <button
            id="btn-pdf-rasoiya"
            onClick={handlePrintReport}
            className="px-3 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="PDF अभिलेख डाउनलोड करें"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>

          <button
            id="btn-export-rasoiya-excel"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Excel स्प्रेडशीट डाउनलोड करें"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">कुल रसोइया</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">संस्था स्तर पर दर्ज</div>
        </div>

        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">सक्रिय रसोइया</div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{stats.active}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">नियमित कार्यरत</div>
        </div>

        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">प्रशिक्षित रसोइया</div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">{stats.trained}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">पाककला व पोषण प्रशिक्षित</div>
        </div>

        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">स्वास्थ्य अद्यतन</div>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">{stats.upToDateHealth}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">चिकित्सा परीक्षण प्रमाणित</div>
        </div>
      </div>

      {/* Quick Status Filters Pills: [ सभी ] [ सक्रिय ] [ निष्क्रिय ] */}
      <div className="bg-white dark:bg-[#17211C] p-2.5 sm:p-3 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 px-1">स्थिति फ़िल्टर:</span>
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-[#0B6B4B] text-white shadow-sm'
              : 'bg-gray-50 dark:bg-[#121B17] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          सभी ({stats.total})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('ACTIVE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-gray-50 dark:bg-[#121B17] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60'
          }`}
        >
          सक्रिय ({stats.active})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('INACTIVE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'INACTIVE'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'bg-gray-50 dark:bg-[#121B17] text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60'
          }`}
        >
          निष्क्रिय ({stats.total - stats.active})
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="रसोइया नाम, मोबाइल, आधार, शाला, समूह, जाति द्वारा खोजें..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#121B17] border border-gray-200 dark:border-gray-800 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B]"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* School Selector for CAC/ADMIN */}
          {!isSchoolRestricted && (
            <select
              value={selectedSchoolFilter}
              onChange={(e) => setSelectedSchoolFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-[#121B17] border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-white max-w-[200px]"
            >
              <option value="ALL">समस्त विद्यालय (All Schools)</option>
              {schools.map((s) => (
                <option key={s.udise} value={s.udise}>
                  {s.hindiName || s.name} ({s.udise})
                </option>
              ))}
            </select>
          )}

          {/* Training filter */}
          <select
            value={trainingFilter}
            onChange={(e) => setTrainingFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-[#121B17] border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
          >
            <option value="ALL">सभी प्रशिक्षण स्थिति</option>
            <option value="TRAINED">प्रशिक्षित (Trained)</option>
            <option value="UNTRAINED">अप्रशिक्षित (Untrained)</option>
          </select>
        </div>
      </div>

      {/* Main Table: | क्रम | रसोइया | विद्यालय | UDISE | मोबाइल | SHG | बैंक | स्थिति | Action | */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold">
                <th className="py-3 px-3 w-12 text-center">क्रम</th>
                <th className="py-3 px-3">रसोइया</th>
                <th className="py-3 px-3">विद्यालय</th>
                <th className="py-3 px-3 font-mono">UDISE</th>
                <th className="py-3 px-3">मोबाइल</th>
                <th className="py-3 px-3">SHG</th>
                <th className="py-3 px-3">बैंक</th>
                <th className="py-3 px-3 text-center">स्थिति</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredList.length > 0 ? (
                filteredList.map((r, idx) => {
                  const sObj = schools.find((s) => s.udise === r.schoolUdise);
                  const schoolName = sObj?.hindiName || sObj?.name || r.schoolName || r.schoolUdise;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-[#1b2721] transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-gray-500 font-medium">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setViewingRasoiya(r)}
                          className="font-bold text-gray-900 dark:text-white hover:text-[#0B6B4B] dark:hover:text-emerald-400 text-left transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{r.name}</span>
                          {r.gender === 'FEMALE' && (
                            <span className="text-[9px] bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 px-1.5 py-0.2 rounded font-medium">
                              महिला
                            </span>
                          )}
                        </button>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          आईडी: {r.id}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px]" title={schoolName}>
                          {schoolName}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-gray-600 dark:text-gray-300 font-bold text-[11px]">
                        {r.schoolUdise}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-gray-900 dark:text-white">
                        {r.mobile ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{r.mobile}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-gray-800 dark:text-gray-200 font-medium">
                        <div className="truncate max-w-[150px]" title={r.shgName || '-'}>
                          {r.shgName || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono text-gray-800 dark:text-gray-200 text-[11px]">
                          {r.bankAccount ? `खाता: ${r.bankAccount}` : '-'}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                          {r.bankName || 'SBI'} {r.ifsc ? `• ${r.ifsc}` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {r.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {r.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingRasoiya(r)}
                            className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPrintingRasoiya(r)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                            title="Print"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(r)}
                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTargetId(r.id)}
                                className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    <Utensils className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    कोई रसोइया रिकॉर्ड नहीं मिला। कृपया फ़िल्टर बदलें अथवा नया रसोइया जोड़ें।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Rasoiya Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#0B6B4B]" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingRasoiya ? 'रसोइया जानकारी संशोधन (Edit Rasoiya)' : 'नया रसोइया पंजीकरण (Register New Rasoiya)'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 pt-4 text-xs sm:text-sm">
              {/* Section 1: बुनियादी पहचान */}
              <div className="p-3.5 bg-gray-50/70 dark:bg-[#121B17] rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="font-bold text-xs text-gray-800 dark:text-gray-200">
                  १. रसोइया की व्यक्तिगत पहचान (Personal Identity)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      रसोइया का पूरा नाम *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="उदा. श्रीमती कौशल्या बाई"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      मोबाइल नंबर *
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.mobile || ''}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                      placeholder="98260XXXXX"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      आधार नंबर (Aadhaar, 12 अंक)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={formData.aadhaarNumber || ''}
                      onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                      placeholder="12 अंकों का आधार"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      लिंग (Gender)
                    </label>
                    <select
                      value={formData.gender || 'FEMALE'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg"
                    >
                      <option value="FEMALE">महिला (Female)</option>
                      <option value="MALE">पुरुष (Male)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      सामाजिक संवर्ग (Category)
                    </label>
                    <select
                      value={formData.category || 'OBC'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg"
                    >
                      <option value="GENERAL">सामान्य (General)</option>
                      <option value="OBC">अन्य पिछड़ा वर्ग (OBC)</option>
                      <option value="SC">अनुसूचित जाति (SC)</option>
                      <option value="ST">अनुसूचित जनजाति (ST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      जाति (Caste)
                    </label>
                    <input
                      type="text"
                      value={formData.caste || ''}
                      onChange={(e) => setFormData({ ...formData, caste: e.target.value })}
                      placeholder="उदा. पटेल, अहिरवार, कोरकू"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: पदस्थापना एवं शाला संबंध */}
              <div className="p-3.5 bg-gray-50/70 dark:bg-[#121B17] rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="font-bold text-xs text-gray-800 dark:text-gray-200">
                  २. पदस्थापना एवं शाला लिंकिंग (Posting & School Association)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      पदस्थ विद्यालय (School) *
                    </label>
                    {isSchoolRestricted ? (
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg font-bold">
                        {schools.find((s) => s.udise === formData.schoolUdise)?.hindiName || formData.schoolUdise}
                      </div>
                    ) : (
                      <select
                        value={formData.schoolUdise}
                        onChange={(e) => setFormData({ ...formData, schoolUdise: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg"
                      >
                        {schools.map((s) => (
                          <option key={s.udise} value={s.udise}>
                            {s.hindiName || s.name} ({s.udise})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      कार्यभार ग्रहण दिनांक
                    </label>
                    <input
                      type="date"
                      value={formData.joiningDate || ''}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      संबद्ध स्व-सहायता समूह का नाम
                    </label>
                    <input
                      type="text"
                      value={formData.shgName || ''}
                      onChange={(e) => setFormData({ ...formData, shgName: e.target.value })}
                      placeholder="उदा. माँ शारदा स्व-सहायता समूह"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      पाककला प्रशिक्षण स्थिति
                    </label>
                    <select
                      value={formData.trainingStatus || 'TRAINED'}
                      onChange={(e) => setFormData({ ...formData, trainingStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-semibold"
                    >
                      <option value="TRAINED">प्रशिक्षित (Trained Cook)</option>
                      <option value="UNTRAINED">अप्रशिक्षित (Untrained)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      स्वास्थ्य परीक्षण स्थिति
                    </label>
                    <select
                      value={formData.healthCheckupStatus || 'UP_TO_DATE'}
                      onChange={(e) => setFormData({ ...formData, healthCheckupStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-semibold"
                    >
                      <option value="UP_TO_DATE">अद्यतन प्रमाणित (Up to Date)</option>
                      <option value="REGULAR">नियमित (Regular)</option>
                      <option value="PENDING">लंबित (Pending)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: बैंक खाता एवं मानदेय */}
              <div className="p-3.5 bg-gray-50/70 dark:bg-[#121B17] rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="font-bold text-xs text-gray-800 dark:text-gray-200">
                  ३. बैंक खाता विवरण एवं मानदेय (Bank & Honorarium Details)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      बैंक का नाम
                    </label>
                    <input
                      type="text"
                      value={formData.bankName || ''}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="उदा. State Bank of India"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      खाता क्रमांक (Account Number)
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccount || ''}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                      placeholder="उदा. 38290194821"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      IFSC कोड
                    </label>
                    <input
                      type="text"
                      value={formData.ifsc || ''}
                      onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                      placeholder="उदा. SBIN0001234"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      मासिक मानदेय राशि (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyHonorarium || 2000}
                      onChange={(e) => setFormData({ ...formData, monthlyHonorarium: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  {editingRasoiya ? 'परिवर्तन सुरक्षित करें' : 'नया रसोइया जोड़ें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <RasoiyaProfileModal
        isOpen={Boolean(viewingRasoiya)}
        onClose={() => setViewingRasoiya(null)}
        rasoiya={viewingRasoiya}
        schools={schools}
        canEdit={canEdit}
        onEdit={(r) => handleOpenEditModal(r)}
        onPrint={(r) => setPrintingRasoiya(r)}
        userAssignedUdise={currentSchoolUdise}
        isSchoolRestricted={isSchoolRestricted}
      />

      {/* Print Modal */}
      <RasoiyaPrintModal
        isOpen={Boolean(printingRasoiya)}
        onClose={() => setPrintingRasoiya(null)}
        rasoiya={printingRasoiya}
        schools={schools}
        session={selectedSessionId}
      />

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-rose-200 dark:border-rose-900 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              रसोइया रिकॉर्ड हटाएं?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              क्या आप वाकई इस रसोइया रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                रद्द करें
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                हटाएं (Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
