import React, { useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  Eye,
  Edit2,
  Trash2,
  School as SchoolIcon,
  Phone,
  CheckCircle2,
  XCircle,
  FileText,
  X,
  UserCheck,
  Building2,
  ShieldCheck,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import { Staff } from '../../types';
import { exportToExcel } from '../../utils/exportUtils';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { SmartExportModal } from '../export/SmartExportModal';
import { TeacherProfileModal } from './TeacherProfileModal';
import { TeacherPrintModal } from './TeacherPrintModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { StaffCategorySelectionModal, StaffCategory } from './StaffCategorySelectionModal';
import { TeacherFormModal } from './TeacherFormModal';
import { OtherStaffFormModal } from './OtherStaffFormModal';

export type CategoryFilterType = 'ALL' | 'TEACHER' | 'OTHER_STAFF';

interface UnifiedStaffItem {
  id: string;
  category: 'TEACHER' | 'OTHER_STAFF';
  name: string;
  designation: string;
  schoolUdise: string;
  mobile: string;
  status: string;
  codeOrId?: string;
  uniqueId?: string;
  teacherType?: string;
  subject?: string;
  caste?: string;
  qualification?: string;
  postingDate?: string;
  joiningDate?: string;
  rawStaff: Staff;
}

const isNonTeachingDesignation = (desig: string): boolean => {
  const nonTeaching = [
    'भृत्य',
    'कार्यालय सहायक',
    'चौकीदार',
    'प्रयोगशाला सहायक',
    'सफाई कर्मचारी',
    'सहायक ग्रेड-3',
    'अन्य कर्मचारी'
  ];
  return nonTeaching.includes(desig);
};

export const TeachersView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    schools,
    currentSchool,
    currentSchoolUdise,
    isSchoolUser: isSchoolRestricted,
    staff: scopedStaff,
    addStaff,
    updateStaff,
    deleteStaff,
  } = useSchoolScope();

  const { selectedSessionId, isSessionLocked, assertSessionModifiable } = useData();

  // Category Filter & Search States
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>(
    isSchoolRestricted ? (currentSchoolUdise || schools[0]?.udise || '') : 'ALL'
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal Flow States
  const [isCategorySelectionOpen, setIsCategorySelectionOpen] = useState(false);

  // Form Modals
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Staff | null>(null);

  const [isOtherStaffModalOpen, setIsOtherStaffModalOpen] = useState(false);
  const [editingOtherStaff, setEditingOtherStaff] = useState<Staff | null>(null);

  // Profile & Print Modals
  const [viewingProfileStaff, setViewingProfileStaff] = useState<Staff | null>(null);
  const [printingStaff, setPrintingStaff] = useState<Staff | null>(null);

  // Deletion State
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStaffTarget, setExportStaffTarget] = useState<Staff | null>(null);

  const canEdit = currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SCHOOL';
  const sessionIsLocked = typeof isSessionLocked === 'function' ? isSessionLocked(selectedSessionId) : !!isSessionLocked;

  // Auto-sync school filter if restricted
  React.useEffect(() => {
    if (isSchoolRestricted && currentSchoolUdise) {
      setSelectedSchoolFilter(currentSchoolUdise);
    }
  }, [isSchoolRestricted, currentSchoolUdise]);

  // UNIFIED LIST: All Teaching and Non-Teaching Staff (Categorized into TEACHER vs OTHER_STAFF)
  const unifiedItems = useMemo<UnifiedStaffItem[]>(() => {
    return scopedStaff.map((s) => {
      const isOther = isNonTeachingDesignation(s.designation) || 
                      s.teacherType === 'अन्य' || 
                      s.designation.includes('सहायक') || 
                      s.designation.includes('भृत्य') || 
                      s.designation.includes('चौकीदार') || 
                      s.designation.includes('सफाई') || 
                      s.designation.includes('गैर-शैक्षणिक');
      const cat: 'TEACHER' | 'OTHER_STAFF' = isOther ? 'OTHER_STAFF' : 'TEACHER';

      return {
        id: s.id,
        category: cat,
        name: s.name,
        designation: s.designation || 'शिक्षक',
        schoolUdise: s.assignedSchoolUdise,
        mobile: s.mobile || '',
        status: s.status || 'ACTIVE',
        codeOrId: s.employeeId || s.employeeCode,
        uniqueId: s.uniqueId,
        teacherType: s.teacherType,
        subject: s.subject,
        caste: s.caste,
        qualification: s.qualification,
        postingDate: s.postingDate,
        joiningDate: s.joiningDate,
        rawStaff: s,
      };
    });
  }, [scopedStaff]);

  // Counts for pills
  const counts = useMemo(() => {
    const total = unifiedItems.length;
    const teachers = unifiedItems.filter((i) => i.category === 'TEACHER').length;
    const otherStaff = unifiedItems.filter((i) => i.category === 'OTHER_STAFF').length;
    const active = unifiedItems.filter((i) => i.status === 'ACTIVE').length;
    const inactive = unifiedItems.filter((i) => i.status !== 'ACTIVE').length;
    return { total, teachers, otherStaff, active, inactive };
  }, [unifiedItems]);

  // Filtered List
  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return unifiedItems.filter((item) => {
      // 1. Category Filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // 2. School Filter
      if (!isSchoolRestricted && selectedSchoolFilter !== 'ALL') {
        if (item.schoolUdise !== selectedSchoolFilter) return false;
      }

      // 3. Status Filter
      if (selectedStatusFilter !== 'ALL') {
        if (item.status !== selectedStatusFilter) return false;
      }

      // 4. Search Filter
      if (term) {
        const sObj = schools.find((s) => s.udise === item.schoolUdise);
        const schoolName = (sObj?.hindiName || sObj?.name || '').toLowerCase();
        const matches =
          (item.name || '').toLowerCase().includes(term) ||
          (item.codeOrId || '').toLowerCase().includes(term) ||
          (item.uniqueId || '').toLowerCase().includes(term) ||
          (item.mobile || '').includes(term) ||
          (item.designation || '').toLowerCase().includes(term) ||
          (item.subject || '').toLowerCase().includes(term) ||
          (item.caste || '').toLowerCase().includes(term) ||
          (item.schoolUdise || '').includes(term) ||
          schoolName.includes(term);

        if (!matches) return false;
      }

      return true;
    });
  }, [unifiedItems, categoryFilter, selectedSchoolFilter, selectedStatusFilter, searchTerm, isSchoolRestricted, schools]);

  // ADD FLOW: Opens Selection Modal first
  const handleOpenAdd = () => {
    if (sessionIsLocked) {
      alert('यह शैक्षणिक सत्र लॉक्ड है। नया रिकॉर्ड जोड़ना प्रतिबंधित है।');
      return;
    }
    setIsCategorySelectionOpen(true);
  };

  // User selects category from Selection Modal
  const handleSelectCategory = (cat: StaffCategory) => {
    setIsCategorySelectionOpen(false);

    if (cat === 'TEACHER') {
      setEditingTeacher(null);
      setIsTeacherModalOpen(true);
    } else if (cat === 'OTHER_STAFF') {
      setEditingOtherStaff(null);
      setIsOtherStaffModalOpen(true);
    }
  };

  // EDIT FLOW: Directly opens the respective edit form
  const handleOpenEdit = (item: UnifiedStaffItem) => {
    if (sessionIsLocked) {
      alert('यह शैक्षणिक सत्र लॉक्ड है। रिकॉर्ड संशोधन प्रतिबंधित है।');
      return;
    }

    if (item.category === 'TEACHER') {
      setEditingTeacher(item.rawStaff);
      setIsTeacherModalOpen(true);
    } else if (item.category === 'OTHER_STAFF') {
      setEditingOtherStaff(item.rawStaff);
      setIsOtherStaffModalOpen(true);
    }
  };

  // CHANGE CATEGORY: switches back to Selection Modal from Add Form
  const handleChangeCategoryFromTeacher = () => {
    setIsTeacherModalOpen(false);
    setIsCategorySelectionOpen(true);
  };

  const handleChangeCategoryFromOtherStaff = () => {
    setIsOtherStaffModalOpen(false);
    setIsCategorySelectionOpen(true);
  };

  // SAVE HANDLERS
  const handleSaveTeacher = (data: Staff) => {
    assertSessionModifiable(selectedSessionId, 'saveTeacher');
    if (editingTeacher) {
      updateStaff(data);
    } else {
      addStaff(data);
    }
    setIsTeacherModalOpen(false);
    setEditingTeacher(null);
  };

  const handleSaveOtherStaff = (data: Staff) => {
    assertSessionModifiable(selectedSessionId, 'saveOtherStaff');
    if (editingOtherStaff) {
      updateStaff(data);
    } else {
      addStaff(data);
    }
    setIsOtherStaffModalOpen(false);
    setEditingOtherStaff(null);
  };

  // DELETE HANDLERS
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    assertSessionModifiable(selectedSessionId, 'deleteStaff');
    deleteStaff(deleteTarget.id);
    setDeleteTarget(null);
  };

  // EXCEL EXPORT
  const handleExportExcel = () => {
    const headers = [
      'क्रम',
      'नाम',
      'प्रकार',
      'पद',
      'विद्यालय',
      'UDISE',
      'Employee Code',
      'Unique ID',
      'मोबाइल',
      'स्थिति'
    ];

    const rows = filteredList.map((item, idx) => {
      const sObj = schools.find((s) => s.udise === item.schoolUdise);
      const schoolName = sObj?.hindiName || sObj?.name || item.schoolUdise;
      const catLabel = item.category === 'TEACHER' ? 'शिक्षक' : 'अन्य स्टाफ';

      return [
        (idx + 1).toString(),
        item.name,
        catLabel,
        item.designation,
        schoolName,
        item.schoolUdise,
        item.codeOrId || '-',
        item.uniqueId || '-',
        item.mobile || '-',
        item.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'
      ];
    });

    exportToExcel({
      title: 'शिक्षक एवं स्टाफ रोस्टर विवरण',
      subtitle: `सत्र ${selectedSessionId} | कुल कर्मचारी: ${filteredList.length}`,
      schoolName: currentSchool?.name || currentSchool?.hindiName,
      udise: isSchoolRestricted ? currentSchoolUdise : (selectedSchoolFilter === 'ALL' ? undefined : selectedSchoolFilter),
      session: selectedSessionId,
      headers,
      rows,
      fileName: `Staff_Roster_${selectedSessionId}`
    });
  };

  // EXPORT PAYLOAD FOR UNIFIED PRINT BUTTON
  const getStaffExportPayload = () => {
    const headers = [
      'क्र.',
      'श्रेणी',
      'कर्मचारी नाम',
      'पदनाम/दायित्व',
      'संबंधित विद्यालय',
      'UDISE कोड',
      'मोबाइल नंबर',
      'कर्मचारी कोड/आईडी',
      'यूनिक आईडी',
      'सेवा स्थिति'
    ];

    const rows = filteredList.map((item, idx) => {
      const sObj = schools.find((s) => s.udise === item.schoolUdise);
      const schoolName = sObj?.hindiName || sObj?.name || item.schoolUdise;
      const catLabel = item.category === 'TEACHER' ? 'शिक्षक' : 'अन्य स्टाफ';

      return [
        (idx + 1).toString(),
        catLabel,
        item.name,
        item.designation,
        schoolName,
        item.schoolUdise,
        item.mobile || '-',
        item.codeOrId || '-',
        item.uniqueId || '-',
        item.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'
      ];
    });

    return {
      title: 'शिक्षक एवं स्टाफ रोस्टर विवरण',
      schoolName: currentSchool?.name || currentSchool?.hindiName,
      udise: isSchoolRestricted ? currentSchoolUdise : (selectedSchoolFilter === 'ALL' ? undefined : selectedSchoolFilter),
      session: selectedSessionId,
      headers,
      rows,
      fileName: `Staff_Roster_${selectedSessionId}`,
    };
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Page Header */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  शिक्षक एवं स्टाफ प्रबंधन
                </h2>
                <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  कुल {filteredList.length} / {counts.total} दर्ज
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono font-medium">
                  सत्र: {selectedSessionId}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                विद्यालयवार शिक्षक एवं कर्मचारी जानकारी का प्रबंधन
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions: + जोड़ें, Search, Filter, Print, PDF, Excel */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              id="btn-open-add-flow"
              type="button"
              aria-label="नया शिक्षक या स्टाफ जोड़ें"
              onClick={handleOpenAdd}
              disabled={sessionIsLocked}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer ${
                sessionIsLocked
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#0B6B4B] hover:bg-emerald-800 text-white'
              }`}
              title={sessionIsLocked ? 'सत्र लॉक्ड है' : '+ जोड़ें पर क्लिक कर श्रेणी चुनें'}
            >
              <Plus className="w-4 h-4 pointer-events-none" />
              <span>+ जोड़ें</span>
            </button>
          )}

          <button
            id="btn-teachers-excel"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Excel स्प्रेडशीट डाउनलोड करें"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <UnifiedPrintButton
            id="teachers-unified-print"
            currentSession={selectedSessionId}
            currentSchoolName={currentSchool?.name || currentSchool?.hindiName}
            currentUdise={isSchoolRestricted ? currentSchoolUdise : (selectedSchoolFilter === 'ALL' ? undefined : selectedSchoolFilter)}
            onPrintCurrentView={() => window.print()}
            onPrintReport={() => {
              setExportStaffTarget(null);
              setIsExportModalOpen(true);
            }}
            currentViewLabel="Print"
            currentViewSubtext="वर्तमान शिक्षक एवं स्टाफ सूची का त्वरित प्रिंट"
            reportLabel="PDF"
            reportSubtext="स्टाफ सेवा विवरण / आधिकारिक A4 स्मार्ट रिपोर्ट"
            exportPayload={getStaffExportPayload}
          />
        </div>
      </div>

      {/* Category Filter Pills (Tabs): [ सभी ] [ शिक्षक ] [ अन्य स्टाफ ] */}
      <div className="bg-white dark:bg-[#17211C] p-2.5 sm:p-3 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 px-1">श्रेणी:</span>

          <button
            id="btn-filter-category-all"
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-[#0B6B4B] text-white shadow-sm'
                : 'bg-gray-50 dark:bg-[#121B17] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>सभी ({counts.total})</span>
          </button>

          <button
            id="btn-filter-category-teacher"
            type="button"
            onClick={() => setCategoryFilter('TEACHER')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              categoryFilter === 'TEACHER'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-gray-50 dark:bg-[#121B17] text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>👨‍🏫 शिक्षक ({counts.teachers})</span>
          </button>

          <button
            id="btn-filter-category-other-staff"
            type="button"
            onClick={() => setCategoryFilter('OTHER_STAFF')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              categoryFilter === 'OTHER_STAFF'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-gray-50 dark:bg-[#121B17] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>👤 अन्य स्टाफ ({counts.otherStaff})</span>
          </button>
        </div>

        {/* View Mode Toggle: Table / Cards */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-[#17211C] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="तालिका प्रारूप (Table View)"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-[#17211C] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="कार्ड ग्रिड प्रारूप (Card View)"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="नाम, कोड, यूनिक आईडी, पद, विषय, मोबाइल या शाला खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121B17] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* School & Status Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isSchoolRestricted && (
            <div className="relative min-w-[180px]">
              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121B17] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B4B] appearance-none"
              >
                <option value="ALL">सभी संकुल विद्यालय ({schools.length})</option>
                {schools.map((s) => (
                  <option key={s.udise} value={s.udise}>
                    {s.hindiName || s.name} ({s.udise})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative min-w-[130px]">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121B17] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B4B] appearance-none"
            >
              <option value="ALL">सभी स्थिति</option>
              <option value="ACTIVE">सक्रिय (Active)</option>
              <option value="INACTIVE">निष्क्रिय (Inactive)</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchTerm || categoryFilter !== 'ALL' || (!isSchoolRestricted && selectedSchoolFilter !== 'ALL') || selectedStatusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('ALL');
                if (!isSchoolRestricted) setSelectedSchoolFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="px-2.5 py-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>रीसेट</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table View (Primary) or Cards View */}
      {filteredList.length > 0 ? (
        viewMode === 'table' ? (
          /* Table: | क्रम | नाम | प्रकार | पद | विद्यालय | Employee Code | Unique ID | मोबाइल | स्थिति | Action | */
          <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold">
                    <th className="py-3 px-3 w-12 text-center">क्रम</th>
                    <th className="py-3 px-3">नाम</th>
                    <th className="py-3 px-3">प्रकार</th>
                    <th className="py-3 px-3">पद</th>
                    <th className="py-3 px-3">विद्यालय</th>
                    <th className="py-3 px-3 font-mono">Employee Code</th>
                    <th className="py-3 px-3 font-mono">Unique ID</th>
                    <th className="py-3 px-3">मोबाइल</th>
                    <th className="py-3 px-3 text-center">स्थिति</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredList.map((item, idx) => {
                    const sObj = schools.find((s) => s.udise === item.schoolUdise);
                    const schoolName = sObj?.hindiName || sObj?.name || item.schoolUdise;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-[#1b2721] transition-colors"
                      >
                        {/* 1. क्रम */}
                        <td className="py-3 px-3 text-center text-gray-500 font-medium">
                          {idx + 1}
                        </td>

                        {/* 2. नाम */}
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => setViewingProfileStaff(item.rawStaff)}
                            className="font-bold text-gray-900 dark:text-white hover:text-[#0B6B4B] dark:hover:text-emerald-400 text-left transition-colors cursor-pointer"
                            title="प्रोफ़ाइल देखें"
                          >
                            {item.name}
                          </button>
                          {item.subject && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              विषय: {item.subject}
                            </div>
                          )}
                        </td>

                        {/* 3. प्रकार (Visually distinct category badge) */}
                        <td className="py-3 px-3">
                          {item.category === 'TEACHER' ? (
                            <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[11px] font-bold px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              👨‍🏫 शिक्षक
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              👤 अन्य स्टाफ
                            </span>
                          )}
                        </td>

                        {/* 4. पद */}
                        <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-200">
                          {item.designation}
                        </td>

                        {/* 5. विद्यालय */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]" title={schoolName}>
                            {schoolName}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {item.schoolUdise}
                          </div>
                        </td>

                        {/* 6. Employee Code */}
                        <td className="py-3 px-3 font-mono text-gray-700 dark:text-gray-300">
                          {item.codeOrId || '-'}
                        </td>

                        {/* 7. Unique ID */}
                        <td className="py-3 px-3 font-mono text-gray-700 dark:text-gray-300">
                          {item.uniqueId || '-'}
                        </td>

                        {/* 8. मोबाइल */}
                        <td className="py-3 px-3 font-mono text-gray-900 dark:text-white">
                          {item.mobile ? (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{item.mobile}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* 9. स्थिति */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {item.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {item.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'}
                          </span>
                        </td>

                        {/* 10. Action: View, Edit, Print, Delete */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingProfileStaff(item.rawStaff)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                              title="प्रोफ़ाइल देखें (View)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPrintingStaff(item.rawStaff)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                              title="प्रिंट करें (Print)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {canEdit && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(item)}
                                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                                  title="संपादित करें (Edit)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTarget({
                                      id: item.id,
                                      name: item.name,
                                    });
                                  }}
                                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                  title="हटाएं (Delete)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards Grid view */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((item) => {
              const sObj = schools.find((s) => s.udise === item.schoolUdise);
              const schoolName = sObj?.hindiName || sObj?.name || item.schoolUdise;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.category === 'TEACHER' ? (
                          <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            👨‍🏫 शिक्षक
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            👤 अन्य स्टाफ
                          </span>
                        )}

                        {item.codeOrId && (
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                            {item.codeOrId}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {item.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'}
                      </span>
                    </div>

                    <h3
                      onClick={() => setViewingProfileStaff(item.rawStaff)}
                      className="font-bold text-base text-gray-900 dark:text-white cursor-pointer hover:text-[#0B6B4B] dark:hover:text-emerald-400 transition-colors flex items-center justify-between group"
                      title="प्रोफ़ाइल देखने के लिए क्लिक करें"
                    >
                      <span>{item.name}</span>
                      <span className="text-[11px] font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        <Eye className="w-3.5 h-3.5" /> प्रोफ़ाइल
                      </span>
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <strong className="text-gray-800 dark:text-gray-200">{item.designation}</strong>
                      {item.subject && <span> • {item.subject}</span>}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <SchoolIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{schoolName}</span>
                      </div>
                      {item.mobile && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{item.mobile}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <button
                      onClick={() => setViewingProfileStaff(item.rawStaff)}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>पूर्ण प्रोफ़ाइल</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPrintingStaff(item.rawStaff)}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                        title="प्रिंट करें"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                            title="संपादित करें"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                id: item.id,
                                name: item.name,
                              });
                            }}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
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
        )
      ) : (
        <div className="bg-white dark:bg-[#17211C] p-12 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            {counts.total === 0
              ? 'इस शैक्षणिक सत्र में अभी कोई डेटा उपलब्ध नहीं है।'
              : 'कोई रिकॉर्ड नहीं मिला'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            {counts.total === 0
              ? `सत्र ${selectedSessionId} के लिए कोई शिक्षक या कर्मचारी पदस्थापना उपलब्ध नहीं है।`
              : `दिए गए फ़िल्टर या खोज शब्द के अनुसार कोई परिणाम नहीं मिला।`}
          </p>
          {counts.total > 0 && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="mt-4 px-4 py-2 bg-[#0B6B4B] text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>सभी देखें (फ़िल्टर हटाएं)</span>
            </button>
          )}
        </div>
      )}

      {/* 1. Category Selection Modal on "+ जोड़ें" */}
      <StaffCategorySelectionModal
        isOpen={isCategorySelectionOpen}
        onClose={() => setIsCategorySelectionOpen(false)}
        onSelectCategory={handleSelectCategory}
        selectedSessionId={selectedSessionId}
        isSessionLocked={sessionIsLocked}
      />

      {/* 2. Teacher Add/Edit Modal */}
      <TeacherFormModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        initialData={editingTeacher}
        isEdit={!!editingTeacher}
        onChangeCategory={handleChangeCategoryFromTeacher}
        schools={schools}
        currentSchoolUdise={currentSchoolUdise}
        isSchoolRestricted={isSchoolRestricted}
        selectedSessionId={selectedSessionId}
        onSave={handleSaveTeacher}
        existingStaff={scopedStaff}
      />

      {/* 3. Other Staff Add/Edit Modal */}
      <OtherStaffFormModal
        isOpen={isOtherStaffModalOpen}
        onClose={() => setIsOtherStaffModalOpen(false)}
        initialData={editingOtherStaff}
        isEdit={!!editingOtherStaff}
        onChangeCategory={handleChangeCategoryFromOtherStaff}
        schools={schools}
        currentSchoolUdise={currentSchoolUdise}
        isSchoolRestricted={isSchoolRestricted}
        selectedSessionId={selectedSessionId}
        onSave={handleSaveOtherStaff}
        existingStaff={scopedStaff}
      />

      {/* 4. Teacher Profile Modal */}
      <TeacherProfileModal
        isOpen={!!viewingProfileStaff}
        onClose={() => setViewingProfileStaff(null)}
        staff={viewingProfileStaff}
        schools={schools}
        canEdit={canEdit}
        onEdit={(stf) => {
          setViewingProfileStaff(null);
          handleOpenEdit({
            id: stf.id,
            category: isNonTeachingDesignation(stf.designation) || stf.teacherType === 'अन्य' ? 'OTHER_STAFF' : 'TEACHER',
            name: stf.name,
            designation: stf.designation,
            schoolUdise: stf.assignedSchoolUdise,
            mobile: stf.mobile,
            status: stf.status,
            rawStaff: stf,
          });
        }}
        onPrint={(stf) => {
          setViewingProfileStaff(null);
          setPrintingStaff(stf);
        }}
        userRole={currentUser?.role}
        userAssignedUdise={currentSchoolUdise}
        isSchoolRestricted={isSchoolRestricted}
      />

      {/* 5. Teacher Print Modal */}
      <TeacherPrintModal
        isOpen={!!printingStaff}
        onClose={() => setPrintingStaff(null)}
        staff={printingStaff}
        school={schools.find((s) => s.udise === printingStaff?.assignedSchoolUdise)}
        session={selectedSessionId}
        isAuthorizedToViewAadhaar={canEdit}
      />

      {/* 6. Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="रिकॉर्ड हटाने की पुष्टि"
        message={`क्या आप वास्तव में "${deleteTarget?.name}" का रिकॉर्ड हटाना चाहते हैं? यह कार्यवाही सुरक्षित ऑडिट लॉग में दर्ज की जाएगी।`}
        confirmText="हटाएं"
        cancelText="रद्द करें"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 7. Smart Export & Print Modal */}
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
