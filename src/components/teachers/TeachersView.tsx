import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  Briefcase,
  X,
  School,
  UserCheck,
  Building2,
  Calendar,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Staff } from '../../types';
import { exportToExcel, exportToCSV, triggerSystemPrint } from '../../utils/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SmartExportModal } from '../export/SmartExportModal';

export const TeachersView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    scopedStaff,
    schools,
    selectedSchool,
    addStaff,
    updateStaff,
    deleteStaff
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('ALL');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<Partial<Staff>>({
    designation: 'माध्यमिक शिक्षक',
    subject: 'गणित',
    gender: 'MALE',
    employmentType: 'REGULAR',
    status: 'ACTIVE',
    assignedSchoolUdise: selectedSchool?.udise || schools[0]?.udise || '',
  });

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Smart Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStaffTarget, setExportStaffTarget] = useState<Staff | null>(null);

  const canEdit = currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN';

  // Summary counts
  const stats = useMemo(() => {
    const total = scopedStaff.length;
    const hmCount = scopedStaff.filter((s) => s.designation?.includes('प्रधानाध्यापक') || s.designation?.includes('Headmaster')).length;
    const msCount = scopedStaff.filter((s) => s.designation === 'माध्यमिक शिक्षक' || s.designation === 'उच्च श्रेणी शिक्षक').length;
    const psCount = scopedStaff.filter((s) => s.designation === 'प्राथमिक शिक्षक').length;
    const guestCount = scopedStaff.filter((s) => s.designation?.includes('अतिथि') || s.employmentType === 'GUEST').length;
    const cookCount = scopedStaff.filter((s) => s.designation?.includes('रसोइया')).length;
    return { total, hmCount, msCount, psCount, guestCount, cookCount };
  }, [scopedStaff]);

  // Robust Multi-field Filtered Staff
  const filteredStaff = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return scopedStaff.filter((stf) => {
      // 1. Search Query check
      if (term) {
        const empCode = (stf?.employeeId || stf?.employeeCode || '').toLowerCase();
        const name = (stf?.name || '').toLowerCase();
        const mobile = (stf?.mobile || '').toLowerCase();
        const subject = (stf?.subject || '').toLowerCase();
        const designation = (stf?.designation || '').toLowerCase();
        const qualification = (stf?.qualification || '').toLowerCase();
        const udise = (stf?.assignedSchoolUdise || '').toLowerCase();
        const empType = (stf?.employmentType || '').toLowerCase();

        // Linked School information
        const sObj = schools.find((s) => s.udise === stf?.assignedSchoolUdise);
        const schoolHindi = (sObj?.hindiName || '').toLowerCase();
        const schoolName = (sObj?.name || '').toLowerCase();
        const schoolVillage = (sObj?.village || '').toLowerCase();

        const matches =
          name.includes(term) ||
          empCode.includes(term) ||
          mobile.includes(term) ||
          subject.includes(term) ||
          designation.includes(term) ||
          qualification.includes(term) ||
          udise.includes(term) ||
          empType.includes(term) ||
          schoolHindi.includes(term) ||
          schoolName.includes(term) ||
          schoolVillage.includes(term);

        if (!matches) return false;
      }

      // 2. Designation Filter
      if (selectedDesignation !== 'ALL') {
        if (stf.designation !== selectedDesignation) return false;
      }

      // 3. School Filter
      if (selectedSchoolFilter !== 'ALL') {
        if (stf.assignedSchoolUdise !== selectedSchoolFilter) return false;
      }

      // 4. Status Filter
      if (selectedStatusFilter !== 'ALL') {
        if (stf.status !== selectedStatusFilter) return false;
      }

      return true;
    });
  }, [scopedStaff, schools, searchTerm, selectedDesignation, selectedSchoolFilter, selectedStatusFilter]);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    const genId = `EMP-TCH-${Math.floor(100 + Math.random() * 900)}`;
    setFormData({
      employeeId: genId,
      employeeCode: genId,
      name: '',
      gender: 'MALE',
      designation: 'माध्यमिक शिक्षक',
      subject: 'गणित',
      qualification: 'B.Sc., B.Ed.',
      mobile: '',
      email: '',
      joiningDate: '2016-07-15',
      employmentType: 'REGULAR',
      assignedSchoolUdise: selectedSchool?.udise || schools[0]?.udise || '',
      status: 'ACTIVE',
      dob: '1988-06-15',
      category: 'OBC',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stf: Staff) => {
    setEditingStaff(stf);
    setFormData({
      ...stf,
      employeeCode: stf.employeeCode || stf.employeeId,
      employeeId: stf.employeeId || stf.employeeCode,
    });
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = (formData.employeeId || formData.employeeCode || '').trim();

    if (!formData.name?.trim() || !code || !formData.assignedSchoolUdise) {
      alert('कृपया नाम, कर्मचारी कोड एवं विद्यालय का चयन करें।');
      return;
    }

    const payload: Staff = {
      ...(formData as Staff),
      employeeId: code.toUpperCase(),
      employeeCode: code.toUpperCase(),
      name: formData.name.trim(),
      mobile: (formData.mobile || '').trim(),
      subject: (formData.subject || 'सामान्य').trim(),
      designation: formData.designation || 'माध्यमिक शिक्षक',
      assignedSchoolUdise: formData.assignedSchoolUdise,
      status: formData.status || 'ACTIVE',
      employmentType: formData.employmentType || 'REGULAR',
      gender: formData.gender || 'MALE',
      qualification: (formData.qualification || '').trim(),
      dob: formData.dob || '1988-06-15',
      category: formData.category || 'OBC',
      joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
    };

    if (editingStaff) {
      updateStaff({ ...payload, id: editingStaff.id });
    } else {
      addStaff(payload);
    }
    setIsModalOpen(false);
  };

  const handleExport = (type: 'EXCEL' | 'CSV') => {
    const headers = [
      'क्रमांक',
      'कर्मचारी कोड (ID)',
      'नाम',
      'लिंग',
      'पदनाम',
      'मुख्य विषय',
      'पदस्थ विद्यालय',
      'यूडाइस कोड',
      'मोबाइल नंबर',
      'रोजगार प्रकार',
      'योग्यता',
      'नियुक्ति तिथि',
      'स्थिति'
    ];

    const rows = filteredStaff.map((stf, idx) => {
      const sch = schools.find((s) => s.udise === stf.assignedSchoolUdise);
      return [
        idx + 1,
        stf.employeeId || stf.employeeCode || '-',
        stf.name,
        stf.gender === 'MALE' ? 'पुरुष' : 'महिला',
        stf.designation,
        stf.subject,
        sch?.hindiName || sch?.name || stf.assignedSchoolUdise,
        stf.assignedSchoolUdise,
        stf.mobile,
        stf.employmentType || 'REGULAR',
        stf.qualification || '-',
        stf.joiningDate || '-',
        stf.status === 'ACTIVE' ? 'सक्रिय' : stf.status
      ];
    });

    const payload = {
      title: 'जन शिक्षा केंद्र मलगुवां - शिक्षक एवं स्टाफ रोस्टर',
      subtitle: `सत्र 2026-27 | कुल स्टाफ: ${filteredStaff.length}`,
      headers,
      rows,
      fileName: `Malguwa_Staff_Roster_${Date.now()}`,
    };

    if (type === 'EXCEL') exportToExcel(payload);
    else exportToCSV(payload);
  };

  const handleQuickFilter = (desig: string) => {
    setSelectedDesignation(desig);
    setSearchTerm('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  शिक्षक एवं स्टाफ प्रबंधन (Teachers & Staff Roster)
                </h2>
                <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  कुल {filteredStaff.length} / {scopedStaff.length} स्टाफ
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                संकुल मलगुवां अंतर्गत पदस्थ प्रधानाध्यापक, नियमित शिक्षक, अतिथि शिक्षक एवं रसोइया रोस्टर
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setExportStaffTarget(null);
              setIsExportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg border border-purple-300 dark:border-purple-700 hover:bg-purple-100 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="स्मार्ट एक्सपोर्ट व A4 प्रिंट केंद्र"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>स्मार्ट एक्सपोर्ट</span>
          </button>
          <button
            onClick={() => handleExport('EXCEL')}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
            title="एक्सेल फाइल डाउनलोड करें"
          >
            <Download className="w-3.5 h-3.5" />
            <span>एक्सेल (Excel)</span>
          </button>
          <button
            onClick={() => triggerSystemPrint()}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 flex items-center gap-1.5 transition-colors"
            title="स्टाफ रोस्टर प्रिंट करें"
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
              <span>नया स्टाफ जोड़ें</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Category Summary Stats Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        <button
          onClick={() => handleQuickFilter('ALL')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            selectedDesignation === 'ALL'
              ? 'bg-emerald-50 border-emerald-400 dark:bg-emerald-950/60 dark:border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-[#17211C] border-[#DDE7E2] dark:border-[#2B3933] hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">कुल स्टाफ</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{stats.total}</div>
        </button>

        <button
          onClick={() => handleQuickFilter('प्रधानाध्यापक')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            selectedDesignation === 'प्रधानाध्यापक'
              ? 'bg-purple-50 border-purple-400 dark:bg-purple-950/60 dark:border-purple-600 shadow-xs'
              : 'bg-white dark:bg-[#17211C] border-[#DDE7E2] dark:border-[#2B3933] hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">प्रधानाध्यापक</div>
          <div className="text-lg font-bold text-purple-700 dark:text-purple-300 mt-0.5">{stats.hmCount}</div>
        </button>

        <button
          onClick={() => handleQuickFilter('माध्यमिक शिक्षक')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            selectedDesignation === 'माध्यमिक शिक्षक'
              ? 'bg-blue-50 border-blue-400 dark:bg-blue-950/60 dark:border-blue-600 shadow-xs'
              : 'bg-white dark:bg-[#17211C] border-[#DDE7E2] dark:border-[#2B3933] hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">माध्यमिक शिक्षक</div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">{stats.msCount}</div>
        </button>

        <button
          onClick={() => handleQuickFilter('प्राथमिक शिक्षक')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            selectedDesignation === 'प्राथमिक शिक्षक'
              ? 'bg-teal-50 border-teal-400 dark:bg-teal-950/60 dark:border-teal-600 shadow-xs'
              : 'bg-white dark:bg-[#17211C] border-[#DDE7E2] dark:border-[#2B3933] hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">प्राथमिक शिक्षक</div>
          <div className="text-lg font-bold text-teal-700 dark:text-teal-300 mt-0.5">{stats.psCount}</div>
        </button>

        <button
          onClick={() => handleQuickFilter('अतिथि शिक्षक')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            selectedDesignation === 'अतिथि शिक्षक'
              ? 'bg-amber-50 border-amber-400 dark:bg-amber-950/60 dark:border-amber-600 shadow-xs'
              : 'bg-white dark:bg-[#17211C] border-[#DDE7E2] dark:border-[#2B3933] hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">अतिथि शिक्षक</div>
          <div className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">{stats.guestCount}</div>
        </button>

        <button
          onClick={() => handleQuickFilter('रसोइया')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            selectedDesignation === 'रसोइया'
              ? 'bg-orange-50 border-orange-400 dark:bg-orange-950/60 dark:border-orange-600 shadow-xs'
              : 'bg-white dark:bg-[#17211C] border-[#DDE7E2] dark:border-[#2B3933] hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">रसोइया (MDM)</div>
          <div className="text-lg font-bold text-orange-700 dark:text-orange-300 mt-0.5">{stats.cookCount}</div>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="नाम, कोड, मोबाइल, विषय, विद्यालय या ग्राम से खोजें..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title="सर्च साफ़ करें"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* School Selector */}
          <div className="flex items-center gap-1">
            <School className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={selectedSchoolFilter}
              onChange={(e) => setSelectedSchoolFilter(e.target.value)}
              className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium"
            >
              <option value="ALL">सभी विद्यालय ({schools.length})</option>
              {schools.map((s) => (
                <option key={s.udise} value={s.udise}>
                  {s.name || s.hindiName} ({s.udise.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          {/* Designation Selector */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium"
            >
              <option value="ALL">सभी पदनाम</option>
              <option value="प्रधानाध्यापक">प्रधानाध्यापक (Headmaster)</option>
              <option value="माध्यमिक शिक्षक">माध्यमिक शिक्षक</option>
              <option value="प्राथमिक शिक्षक">प्राथमिक शिक्षक</option>
              <option value="उच्च श्रेणी शिक्षक">उच्च श्रेणी शिक्षक</option>
              <option value="अतिथि शिक्षक">अतिथि शिक्षक (Guest Teacher)</option>
              <option value="रसोइया">रसोइया (MDM Cook)</option>
            </select>
          </div>

          {/* Reset Filters button if any active */}
          {(searchTerm || selectedDesignation !== 'ALL' || selectedSchoolFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDesignation('ALL');
                setSelectedSchoolFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="px-2.5 py-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>फ़िल्टर रीसेट</span>
            </button>
          )}
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((stf) => {
            const sObj = schools.find((s) => s.udise === stf.assignedSchoolUdise);
            const empCode = stf.employeeId || stf.employeeCode || '-';

            return (
              <div
                key={stf.id}
                className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                      ID: {empCode}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      stf.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {stf.status === 'ACTIVE' ? 'सक्रिय (Active)' : stf.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {stf.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <strong className="text-gray-800 dark:text-gray-200">{stf.designation}</strong>
                    {stf.subject && <span> • {stf.subject}</span>}
                  </p>

                  <div className="mt-3 text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                        {sObj?.name || sObj?.hindiName || stf.assignedSchoolUdise}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <a
                        href={`tel:${stf.mobile}`}
                        className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {stf.mobile || '-'}
                      </a>
                    </div>

                    {stf.qualification && (
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{stf.qualification}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>यूडाइस: <span className="font-mono">{stf.assignedSchoolUdise}</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>नियुक्ति: {stf.joiningDate || '15/07/2016'}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setExportStaffTarget(stf);
                        setIsExportModalOpen(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors"
                      title="प्रिंट व डोजियर निर्यात"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(stf)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                          title="संपादित करें"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(stf.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                          title="हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#17211C] p-12 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            कोई स्टाफ रिकॉर्ड नहीं मिला
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            आपके द्वारा दिए गए सर्च शब्द &quot;{searchTerm}&quot; या फ़िल्टर के अनुसार कोई शिक्षक या कर्मचारी उपलब्ध नहीं है।
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDesignation('ALL');
              setSelectedSchoolFilter('ALL');
              setSelectedStatusFilter('ALL');
            }}
            className="mt-4 px-4 py-2 bg-[#0B6B4B] text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-colors inline-flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>सभी स्टाफ देखें (फ़िल्टर हटाएं)</span>
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>{editingStaff ? 'स्टाफ विवरण संशोधित करें' : 'नया शिक्षक / कर्मचारी पंजीकृत करें'}</span>
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    कर्मचारी कोड (Employee Code / ID) *
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId || formData.employeeCode || ''}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFormData({ ...formData, employeeId: val, employeeCode: val });
                    }}
                    placeholder="उदा. EMP-TCH-301"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-mono focus:ring-2 focus:ring-[#0B6B4B]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    पूरा नाम (Full Name) *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="शिक्षक / कर्मचारी का पूरा नाम"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    पदनाम (Designation) *
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="माध्यमिक शिक्षक">माध्यमिक शिक्षक</option>
                    <option value="प्राथमिक शिक्षक">प्राथमिक शिक्षक</option>
                    <option value="उच्च श्रेणी शिक्षक">उच्च श्रेणी शिक्षक</option>
                    <option value="प्रधानाध्यापक">प्रधानाध्यापक</option>
                    <option value="अतिथि शिक्षक">अतिथि शिक्षक</option>
                    <option value="रसोइया">रसोइया</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    मुख्य विषय (Subject)
                  </label>
                  <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="उदा. गणित, विज्ञान, हिंदी"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    पदस्थ विद्यालय *
                  </label>
                  <select
                    value={formData.assignedSchoolUdise}
                    onChange={(e) => setFormData({ ...formData, assignedSchoolUdise: e.target.value })}
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
                    मोबाइल नंबर (10 अंक) *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    placeholder="9826XXXXXX"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    शैक्षणिक योग्यता
                  </label>
                  <input
                    type="text"
                    value={formData.qualification || ''}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="उदा. M.Sc., B.Ed."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    लिंग (Gender)
                  </label>
                  <select
                    value={formData.gender || 'MALE'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="MALE">पुरुष (Male)</option>
                    <option value="FEMALE">महिला (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    रोजगार प्रकार (Employment Type)
                  </label>
                  <select
                    value={formData.employmentType || 'REGULAR'}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="REGULAR">नियमित (Regular)</option>
                    <option value="GUEST">अतिथि शिक्षक (Guest)</option>
                    <option value="CONTRACT">संविदा (Contract)</option>
                  </select>
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
        title="स्टाफ रिकॉर्ड हटाने की पुष्टि"
        message="क्या आप वास्तव में इस स्टाफ/शिक्षक का रिकॉर्ड हटाना चाहते हैं? यह कार्यवाही ऑडिट लॉग में दर्ज की जाएगी।"
        confirmText="हटाएं"
        cancelText="रद्द करें"
        isDestructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteStaff(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Smart Export & Print Modal */}
      <SmartExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportStaffTarget(null);
        }}
        initialType="TEACHER"
        initialTeacherId={exportStaffTarget?.id}
        initialUdise={exportStaffTarget?.assignedSchoolUdise || (selectedSchoolFilter !== 'ALL' ? selectedSchoolFilter : undefined)}
      />
    </div>
  );
};
