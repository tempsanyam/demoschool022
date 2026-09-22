import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
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
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  XCircle,
  AlertCircle,
  UserPlus,
  FileText,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import { SHG, SHGMember } from '../../types';
import { exportToExcel } from '../../utils/exportUtils';
import { printReport } from '../../utils/printUtils';
import { SHGProfileModal } from './SHGProfileModal';
import { SHGPrintModal } from './SHGPrintModal';

export const SHGView: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedSessionId, isSessionLocked, assertSessionModifiable } = useData();
  const {
    shgs: scopedSHGs,
    schools,
    currentSchool,
    currentSchoolUdise,
    isSchoolUser: isSchoolRestricted,
    addSHG,
    updateSHG,
    deleteSHG
  } = useSchoolScope();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>(
    isSchoolRestricted ? (currentSchoolUdise || schools[0]?.udise || '') : 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSHG, setEditingSHG] = useState<SHG | null>(null);
  const [viewingSHG, setViewingSHG] = useState<SHG | null>(null);
  const [printingSHG, setPrintingSHG] = useState<SHG | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const sessionLocked = typeof isSessionLocked === 'function' ? isSessionLocked(selectedSessionId) : !!isSessionLocked;
  const canEdit = !sessionLocked && (currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SCHOOL');

  // Initial Form Data
  const initialFormState: Partial<SHG> = {
    name: '',
    schoolUdise: isSchoolRestricted ? (currentSchoolUdise || schools[0]?.udise || '') : (schools[0]?.udise || ''),
    presidentName: '',
    presidentMobile: '',
    secretaryName: '',
    secretaryMobile: '',
    registrationNumber: '',
    formationDate: new Date().toISOString().split('T')[0],
    purpose: 'मध्याह्न भोजन (पीएम-पोषण) संचालन एवं पोषण सुरक्षा',
    bankName: 'भारतीय स्टेट बैंक (SBI)',
    accountNumber: '',
    ifsc: 'SBIN0001234',
    branchName: 'बलदेवगढ़',
    status: 'ACTIVE',
    totalMembers: 5,
    members: [
      { id: '1', name: '', role: 'मुख्य रसोइया', mobile: '', aadhaarNumber: '' },
      { id: '2', name: '', role: 'सहायक रसोइया', mobile: '', aadhaarNumber: '' },
      { id: '3', name: '', role: 'सदस्य', mobile: '', aadhaarNumber: '' }
    ],
    remarks: 'मध्याह्न भोजन सुचारू व स्वच्छ रूप से संचालित किया जा रहा है।'
  };

  const [formData, setFormData] = useState<Partial<SHG>>(initialFormState);

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

    return scopedSHGs.filter((item) => {
      // School filter
      if (!isSchoolRestricted && selectedSchoolFilter !== 'ALL') {
        if (item.schoolUdise !== selectedSchoolFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (item.status !== statusFilter) return false;
      }

      // Search
      if (term) {
        const sObj = schools.find((s) => s.udise === item.schoolUdise);
        const schoolName = (sObj?.hindiName || sObj?.name || item.schoolName || '').toLowerCase();
        const matches =
          (item.name || '').toLowerCase().includes(term) ||
          (item.presidentName || '').toLowerCase().includes(term) ||
          (item.presidentMobile || '').includes(term) ||
          (item.secretaryName || '').toLowerCase().includes(term) ||
          (item.secretaryMobile || '').includes(term) ||
          (item.registrationNumber || '').toLowerCase().includes(term) ||
          (item.accountNumber || '').includes(term) ||
          (item.schoolUdise || '').includes(term) ||
          schoolName.includes(term);

        if (!matches) return false;
      }

      return true;
    });
  }, [scopedSHGs, searchTerm, selectedSchoolFilter, statusFilter, isSchoolRestricted, schools]);

  // Statistics
  const stats = useMemo(() => {
    const total = scopedSHGs.length;
    const active = scopedSHGs.filter((s) => s.status === 'ACTIVE').length;
    const totalMembers = scopedSHGs.reduce((acc, curr) => acc + (curr.totalMembers || curr.members?.length || 5), 0);
    const totalSchools = new Set(scopedSHGs.map((s) => s.schoolUdise)).size;
    return { total, active, totalMembers, totalSchools };
  }, [scopedSHGs]);

  // Modal handlers
  const handleOpenAddModal = () => {
    if (sessionLocked) {
      assertSessionModifiable(selectedSessionId, 'addSHG');
      return;
    }
    setEditingSHG(null);
    setFormData({
      ...initialFormState,
      schoolUdise: isSchoolRestricted ? (currentSchoolUdise || schools[0]?.udise || '') : (schools[0]?.udise || '')
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: SHG) => {
    if (sessionLocked) {
      assertSessionModifiable(selectedSessionId, 'updateSHG');
      return;
    }
    setEditingSHG(item);
    setFormData({
      ...item,
      members: item.members?.length ? item.members : [
        { id: '1', name: item.presidentName, role: 'अध्यक्ष', mobile: item.presidentMobile, aadhaarNumber: '' },
        { id: '2', name: item.secretaryName, role: 'सचिव', mobile: item.secretaryMobile, aadhaarNumber: '' }
      ]
    });
    setIsFormModalOpen(true);
  };

  // Focus Search input
  const handleTriggerSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  };

  // Add Member inside Form
  const handleAddMemberRow = () => {
    const newMember: SHGMember = {
      id: String(Date.now()),
      name: '',
      role: 'सदस्य',
      mobile: '',
      aadhaarNumber: ''
    };
    setFormData((prev) => ({
      ...prev,
      members: [...(prev.members || []), newMember],
      totalMembers: (prev.members?.length || 0) + 1
    }));
  };

  const handleRemoveMemberRow = (index: number) => {
    setFormData((prev) => {
      const nextMembers = (prev.members || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        members: nextMembers,
        totalMembers: nextMembers.length
      };
    });
  };

  const handleMemberChange = (index: number, field: keyof SHGMember, value: string) => {
    setFormData((prev) => {
      const nextMembers = [...(prev.members || [])];
      nextMembers[index] = {
        ...nextMembers[index],
        [field]: value
      };
      return { ...prev, members: nextMembers };
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    assertSessionModifiable(selectedSessionId, editingSHG ? 'updateSHG' : 'addSHG');

    if (!formData.name?.trim() || !formData.presidentName?.trim()) {
      alert('कृपया समूह का नाम एवं अध्यक्ष का नाम अवश्य भरें।');
      return;
    }

    const schoolUdise = isSchoolRestricted ? currentSchoolUdise : (formData.schoolUdise || schools[0]?.udise || '');
    const sObj = schools.find((s) => s.udise === schoolUdise);

    const validMembers = (formData.members || []).filter((m) => m.name && m.name.trim() !== '');

    if (editingSHG) {
      updateSHG({
        ...(formData as SHG),
        id: editingSHG.id,
        schoolUdise,
        schoolName: sObj?.hindiName || sObj?.name || formData.schoolName || schoolUdise,
        members: validMembers,
        totalMembers: validMembers.length || formData.totalMembers || 5
      });
    } else {
      addSHG({
        ...(formData as Omit<SHG, 'id'>),
        name: formData.name.trim(),
        presidentName: formData.presidentName.trim(),
        secretaryName: formData.secretaryName?.trim() || 'श्रीमती सचिव',
        schoolUdise,
        schoolName: sObj?.hindiName || sObj?.name || schoolUdise,
        members: validMembers,
        totalMembers: validMembers.length || 5
      });
    }

    setIsFormModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      assertSessionModifiable(selectedSessionId, 'deleteSHG');
      deleteSHG(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  // Official Print Handler
  const handlePrintList = () => {
    const headers = [
      'क्र.', 'समूह का नाम', 'पंजीयन क्र.', 'संबद्ध विद्यालय', 'UDISE कोड',
      'अध्यक्ष का नाम', 'सचिव का नाम', 'संपर्क मोबाइल',
      'सदस्य संख्या', 'बैंक खाता विवरण', 'स्थिति'
    ];

    const rows = filteredList.map((s, idx) => {
      const sObj = schools.find((sc) => sc.udise === s.schoolUdise);
      return [
        idx + 1,
        s.name,
        s.registrationNumber || '-',
        sObj?.hindiName || sObj?.name || s.schoolName || s.schoolUdise,
        s.schoolUdise,
        s.presidentName,
        s.secretaryName || '-',
        `${s.presidentMobile || '-'}${s.secretaryMobile ? ` / ${s.secretaryMobile}` : ''}`,
        `${s.members?.length || s.totalMembers || 5} सदस्य`,
        `${s.bankName || 'SBI'} (खाता: ${s.accountNumber || '-'})`,
        s.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'
      ];
    });

    const activeSchoolName = isSchoolRestricted
      ? (currentSchool?.hindiName || currentSchool?.name)
      : (selectedSchoolFilter !== 'ALL' ? schools.find((s) => s.udise === selectedSchoolFilter)?.hindiName : undefined);

    printReport(
      {
        title: 'स्व-सहायता समूह (SHG) प्रबंधन पंजी',
        subtitle: 'विद्यालय/मध्यान्ह भोजन से संबद्ध स्व-सहायता समूहों का आधिकारिक अभिलेख',
        session: selectedSessionId,
        schoolName: activeSchoolName,
        udise: isSchoolRestricted ? currentSchoolUdise : (selectedSchoolFilter !== 'ALL' ? selectedSchoolFilter : undefined),
        headers,
        rows,
        summaryMetrics: [
          { label: 'कुल स्व-सहायता समूह', value: stats.total },
          { label: 'सक्रिय समूह', value: stats.active },
          { label: 'कुल महिला सदस्य', value: stats.totalMembers },
          { label: 'संबद्ध विद्यालय', value: stats.totalSchools }
        ],
        fileName: `SHG_Register_${selectedSessionId}`
      },
      {
        orientation: 'landscape',
        reportStyle: 'PROFESSIONAL'
      }
    );
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    const headers = [
      'क्र.', 'समूह आईडी', 'समूह का नाम', 'पंजीयन क्रमांक', 'संबद्ध शाला', 'UDISE कोड',
      'अध्यक्ष का नाम', 'अध्यक्ष मोबाइल', 'सचिव का नाम', 'सचिव मोबाइल',
      'कुल सदस्य', 'गठन दिनांक', 'बैंक का नाम', 'शाखा', 'खाता क्रमांक', 'IFSC कोड', 'स्थिति'
    ];

    const rows = filteredList.map((s, idx) => {
      const sObj = schools.find((sc) => sc.udise === s.schoolUdise);
      return [
        idx + 1,
        s.id,
        s.name,
        s.registrationNumber || '-',
        sObj?.hindiName || sObj?.name || s.schoolName || s.schoolUdise,
        s.schoolUdise,
        s.presidentName,
        s.presidentMobile || '-',
        s.secretaryName || '-',
        s.secretaryMobile || '-',
        s.totalMembers || s.members?.length || 5,
        s.formationDate || '-',
        s.bankName || '-',
        s.branchName || '-',
        s.accountNumber || '-',
        s.ifsc || '-',
        s.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'
      ];
    });

    exportToExcel({
      title: 'जन शिक्षा केंद्र मलगुवां - स्व-सहायता समूह (SHG) पंजी एवं विवरण',
      subtitle: `शैक्षणिक सत्र: ${selectedSessionId} | कुल पंजीकृत समूह: ${filteredList.length}`,
      schoolName: currentSchool?.name || currentSchool?.hindiName,
      udise: isSchoolRestricted ? currentSchoolUdise : (selectedSchoolFilter === 'ALL' ? undefined : selectedSchoolFilter),
      session: selectedSessionId,
      headers,
      rows,
      fileName: `SHG_List_${selectedSessionId}_${new Date().toISOString().split('T')[0]}`
    });
  };

  return (
    <div className="space-y-4">
      {/* Locked Session Banner */}
      {sessionLocked && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>शैक्षणिक सत्र ({selectedSessionId}) सुरक्षित / अभिलेखीय (Locked) स्थिति में है। डेटा केवल पढ़ने योग्य (Read-Only) है।</span>
          </div>
        </div>
      )}

      {/* Page Header with All 5 Required Buttons */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                स्व-सहायता समूह (SHG) प्रबंधन
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                विद्यालय से संबद्ध स्व-सहायता समूहों की जानकारी एवं प्रबंधन
              </p>
            </div>
          </div>
        </div>

        {/* 5 Required Action Buttons: + SHG जोड़ें, खोजें, Print, PDF, Excel */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              id="btn-add-shg"
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="नया स्व-सहायता समूह पंजीकृत करें"
            >
              <Plus className="w-4 h-4" />
              + SHG जोड़ें
            </button>
          )}

          <button
            id="btn-search-shg"
            onClick={handleTriggerSearch}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="खोज बॉक्स पर जाएं"
          >
            <Search className="w-4 h-4 text-gray-500" />
            🔍 खोजें
          </button>

          <button
            id="btn-print-shg"
            onClick={handlePrintList}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="प्रिंट करें"
          >
            <Printer className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            🖨 Print
          </button>

          <button
            id="btn-pdf-shg"
            onClick={handlePrintList}
            className="px-3 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="PDF अभिलेख डाउनलोड करें"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>

          <button
            id="btn-excel-shg"
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
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">कुल स्व-सहायता समूह</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">संस्था स्तर पर संबद्ध (सत्र: {selectedSessionId})</div>
        </div>

        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">सक्रिय समूह</div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{stats.active}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">भोजन संचालन रत</div>
        </div>

        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">कुल महिला सदस्य</div>
          <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">{stats.totalMembers}</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">समूह सहभागिता</div>
        </div>

        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">संबद्ध शालाएं</div>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">{stats.totalSchools}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">कवर किए गए विद्यालय</div>
        </div>
      </div>

      {/* Quick Status Filter Pills: [ सभी ] [ सक्रिय ] [ निष्क्रिय ] */}
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

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="समूह का नाम, अध्यक्ष, सचिव, मोबाइल, शाला, UDISE द्वारा खोजें..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#121B17] border border-gray-200 dark:border-gray-800 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B]"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
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
        </div>
      </div>

      {/* Main Table: | क्रम | SHG समूह | विद्यालय | UDISE | अध्यक्ष | सचिव | सदस्य | स्थिति | Action | */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold">
                <th className="py-3 px-3 w-12 text-center">क्रम</th>
                <th className="py-3 px-3">SHG समूह</th>
                <th className="py-3 px-3">विद्यालय</th>
                <th className="py-3 px-3 font-mono">UDISE</th>
                <th className="py-3 px-3">अध्यक्ष</th>
                <th className="py-3 px-3">सचिव</th>
                <th className="py-3 px-3 text-center">सदस्य</th>
                <th className="py-3 px-3 text-center">स्थिति</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredList.length > 0 ? (
                filteredList.map((s, idx) => {
                  const sObj = schools.find((sc) => sc.udise === s.schoolUdise);
                  const schoolName = sObj?.hindiName || sObj?.name || s.schoolName || s.schoolUdise;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-[#1b2721] transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-gray-500 font-medium">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setViewingSHG(s)}
                          className="font-bold text-gray-900 dark:text-white hover:text-[#0B6B4B] dark:hover:text-emerald-400 text-left transition-colors cursor-pointer"
                        >
                          {s.name}
                        </button>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          पंजीयन: {s.registrationNumber || s.id}
                        </div>
                        {s.accountNumber && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                            खाता: {s.accountNumber} ({s.bankName || 'SBI'})
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px]" title={schoolName}>
                          {schoolName}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-gray-600 dark:text-gray-300 font-bold text-[11px]">
                        {s.schoolUdise}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {s.presidentName}
                        </div>
                        {s.presidentMobile ? (
                          <div className="text-gray-600 dark:text-gray-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {s.presidentMobile}
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {s.secretaryName || '-'}
                        </div>
                        {s.secretaryMobile ? (
                          <div className="text-gray-600 dark:text-gray-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {s.secretaryMobile}
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          {s.members?.length || s.totalMembers || 5} सदस्य
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {s.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> सक्रिय
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            निष्क्रिय
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingSHG(s)}
                            className="p-1.5 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors cursor-pointer"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPrintingSHG(s)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                            title="Print"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(s)}
                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTargetId(s.id)}
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
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    कोई स्व-सहायता समूह रिकॉर्ड नहीं मिला। कृपया फ़िल्टर बदलें अथवा नया SHG जोड़ें।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingSHG ? 'स्व-सहायता समूह जानकारी संशोधन (Edit SHG)' : 'नया स्व-सहायता समूह पंजीकरण (+ Add SHG)'}
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
              {/* १. समूह जानकारी */}
              <div className="p-3.5 bg-gray-50/70 dark:bg-[#121B17] rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>१. समूह जानकारी व संबद्ध विद्यालय (Group Details)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      समूह का नाम (SHG Name) *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="उदा. माँ शारदा स्व-सहायता समूह"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      पंजीयन क्रमांक (Registration No.)
                    </label>
                    <input
                      type="text"
                      value={formData.registrationNumber || ''}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      placeholder="MP/TK/SHG/2023/019"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      संबद्ध विद्यालय (Linked School for MDM) *
                    </label>
                    {isSchoolRestricted ? (
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-gray-900 dark:text-white">
                        {schools.find((s) => s.udise === formData.schoolUdise)?.hindiName || formData.schoolUdise} ({formData.schoolUdise})
                      </div>
                    ) : (
                      <select
                        value={formData.schoolUdise}
                        onChange={(e) => setFormData({ ...formData, schoolUdise: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
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
                      UDISE कोड
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.schoolUdise || ''}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-mono font-bold text-gray-700 dark:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      गठन दिनांक (Formation Date)
                    </label>
                    <input
                      type="date"
                      value={formData.formationDate || ''}
                      onChange={(e) => setFormData({ ...formData, formationDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      कार्य / उद्देश्य
                    </label>
                    <input
                      type="text"
                      value={formData.purpose || ''}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="मध्याह्न भोजन (पीएम-पोषण) संचालन"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      समूह स्थिति (Status)
                    </label>
                    <select
                      value={formData.status || 'ACTIVE'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="ACTIVE">सक्रिय (Active)</option>
                      <option value="INACTIVE">निष्क्रिय (Inactive)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* २. मुख्य पदाधिकारी */}
              <div className="p-3.5 bg-gray-50/70 dark:bg-[#121B17] rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>२. मुख्य पदाधिकारी (President & Secretary Details)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      समूह अध्यक्ष का नाम (President Name) *
                    </label>
                    <input
                      type="text"
                      value={formData.presidentName || ''}
                      onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                      placeholder="उदा. श्रीमती राधा बाई"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      अध्यक्ष मोबाइल नंबर
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.presidentMobile || ''}
                      onChange={(e) => setFormData({ ...formData, presidentMobile: e.target.value.replace(/\D/g, '') })}
                      placeholder="98260XXXXX"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      समूह सचिव का नाम (Secretary Name)
                    </label>
                    <input
                      type="text"
                      value={formData.secretaryName || ''}
                      onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                      placeholder="उदा. श्रीमती अनिता यादव"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      सचिव मोबाइल नंबर
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.secretaryMobile || ''}
                      onChange={(e) => setFormData({ ...formData, secretaryMobile: e.target.value.replace(/\D/g, '') })}
                      placeholder="94250XXXXX"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* ३. बैंक खाता */}
              <div className="p-3.5 bg-gray-50/70 dark:bg-[#121B17] rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>३. समूह संयुक्त बैंक खाता विवरण (Joint Bank Account)</span>
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
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      शाखा (Branch)
                    </label>
                    <input
                      type="text"
                      value={formData.branchName || ''}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                      placeholder="उदा. बलदेवगढ़"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      खाता क्रमांक (Account No.)
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber || ''}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="उदा. 48201948201"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
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
                      placeholder="SBIN0001234"
                      className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* ४. सदस्य सूची (Dynamic Members List) */}
              <div className="p-3.5 bg-gray-50/70 dark:bg-[#121B17] rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>४. समूह सदस्य सूची (Dynamic Group Members)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMemberRow}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + सदस्य जोड़ें
                  </button>
                </div>

                <div className="space-y-2">
                  {(formData.members || []).map((member, idx) => (
                    <div key={member.id || idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-white dark:bg-[#17211C] border border-gray-200 dark:border-gray-700 rounded-lg">
                      <span className="w-5 text-center font-bold text-gray-400 text-xs">{idx + 1}.</span>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                        placeholder="सदस्य का नाम *"
                        className="flex-1 px-2.5 py-1 bg-gray-50 dark:bg-[#121B17] border border-gray-300 dark:border-gray-700 rounded-md text-xs text-gray-900 dark:text-white"
                        required
                      />
                      <input
                        type="text"
                        value={member.role || ''}
                        onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                        placeholder="पद (उदा. मुख्य रसोइया)"
                        className="w-full sm:w-36 px-2.5 py-1 bg-gray-50 dark:bg-[#121B17] border border-gray-300 dark:border-gray-700 rounded-md text-xs text-gray-900 dark:text-white"
                      />
                      <input
                        type="tel"
                        maxLength={10}
                        value={member.mobile || ''}
                        onChange={(e) => handleMemberChange(idx, 'mobile', e.target.value.replace(/\D/g, ''))}
                        placeholder="मोबाइल नं."
                        className="w-full sm:w-28 px-2.5 py-1 bg-gray-50 dark:bg-[#121B17] border border-gray-300 dark:border-gray-700 rounded-md text-xs font-mono text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        maxLength={12}
                        value={member.aadhaarNumber || ''}
                        onChange={(e) => handleMemberChange(idx, 'aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                        placeholder="आधार (12 अंक)"
                        className="w-full sm:w-28 px-2.5 py-1 bg-gray-50 dark:bg-[#121B17] border border-gray-300 dark:border-gray-700 rounded-md text-xs font-mono text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberRow(idx)}
                        className="px-2 py-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded text-xs font-bold self-end sm:self-center cursor-pointer"
                        title="सदस्य हटाएँ"
                      >
                        ✕ हटाएं
                      </button>
                    </div>
                  ))}
                  {(formData.members || []).length === 0 && (
                    <div className="text-center py-3 text-gray-400 text-xs">
                      कोई सदस्य नहीं जोड़ा गया। कृपया `+ सदस्य जोड़ें` पर क्लिक करें।
                    </div>
                  )}
                </div>
              </div>

              {/* विशेष विवरण / टिप्पणी */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  विशेष विवरण / टिप्पणी
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="समूह संबंधी विशेष टिप्पणी..."
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  {editingSHG ? 'परिवर्तन सुरक्षित करें' : 'नया समूह जोड़ें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <SHGProfileModal
        isOpen={Boolean(viewingSHG)}
        onClose={() => setViewingSHG(null)}
        shg={viewingSHG}
        schools={schools}
        canEdit={canEdit}
        onEdit={(s) => handleOpenEditModal(s)}
        onPrint={(s) => setPrintingSHG(s)}
        userAssignedUdise={currentSchoolUdise}
        isSchoolRestricted={isSchoolRestricted}
      />

      {/* Print Modal */}
      <SHGPrintModal
        isOpen={Boolean(printingSHG)}
        onClose={() => setPrintingSHG(null)}
        shg={printingSHG}
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
              स्व-सहायता समूह हटाएं?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              क्या आप वाकई इस स्व-सहायता समूह रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
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

