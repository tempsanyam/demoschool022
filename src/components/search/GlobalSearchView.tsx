import React, { useState, useMemo } from 'react';
import {
  Search,
  School as SchoolIcon,
  GraduationCap,
  Users,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  X,
  FileText,
  BookOpen,
  UserCheck,
  FolderLock,
  Utensils,
  HeartHandshake
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface GlobalSearchViewProps {
  initialQuery?: string;
  onSelectSchool?: (udise: string) => void;
  onNavigate?: (viewId: string) => void;
  onNavigateToSchool?: (udise: string) => void;
  onNavigateToStudent?: (studentId: string) => void;
  onNavigateToTeacher?: (staffId: string) => void;
  onClose?: () => void;
}

type FilterCategory = 'ALL' | 'SCHOOLS' | 'STUDENTS' | 'TEACHERS' | 'RASOIYA' | 'SHG' | 'WORK' | 'COMPLAINTS' | 'DOCUMENTS' | 'LITERACY';

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({
  initialQuery = '',
  onSelectSchool,
  onNavigate,
  onNavigateToSchool,
  onNavigateToStudent,
  onNavigateToTeacher,
  onClose
}) => {
  const { currentUser } = useAuth();
  const {
    scopedSchools = [],
    scopedStudents = [],
    scopedStaff = [],
    scopedRasoiya = [],
    scopedSHGs = [],
    scopedWork = [],
    scopedComplaints = [],
    scopedDocuments = [],
    scopedIlliteratePersons = [],
    scopedAksharSathis = [],
    setSelectedSchoolUdise
  } = useData();

  const isSchoolRestricted = currentUser?.role === 'SCHOOL';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<FilterCategory>('ALL');

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        schools: [],
        students: [],
        teachers: [],
        rasoiya: [],
        shgs: [],
        work: [],
        complaints: [],
        documents: [],
        learners: [],
        volunteers: [],
        total: 0,
      };
    }

    const matchedSchools = (scopedSchools || []).filter(
      (s) =>
        !s?.isDeleted &&
        s?.status === 'ACTIVE' &&
        ((s?.name || '').toLowerCase().includes(q) ||
          (s?.hindiName || '').toLowerCase().includes(q) ||
          (s?.udise || '').includes(q) ||
          (s?.village || '').toLowerCase().includes(q) ||
          (s?.gramPanchayat || '').toLowerCase().includes(q))
    );

    const matchedStudents = (scopedStudents || []).filter(
      (st) =>
        (st?.name || '').toLowerCase().includes(q) ||
        (st?.samagraId || '').includes(q) ||
        (st?.id || '').toLowerCase().includes(q) ||
        (st?.fatherName || '').toLowerCase().includes(q) ||
        (st?.schoolUdise || '').includes(q) ||
        (st?.class || '').toLowerCase().includes(q)
    );

    const matchedStaff = (scopedStaff || []).filter(
      (stf) => {
        const staffSchool = (scopedSchools || []).find((s) => s.udise === stf?.assignedSchoolUdise);
        const empCode = stf?.employeeId || stf?.employeeCode || '';
        return (
          (stf?.name || '').toLowerCase().includes(q) ||
          empCode.toLowerCase().includes(q) ||
          (stf?.mobile || '').includes(q) ||
          (stf?.designation || '').toLowerCase().includes(q) ||
          (stf?.subject || '').toLowerCase().includes(q) ||
          (stf?.assignedSchoolUdise || '').includes(q) ||
          (stf?.aadhaarNumber || '').includes(q) ||
          (stf?.voterId || '').toLowerCase().includes(q) ||
          (stf?.caste || '').toLowerCase().includes(q) ||
          (stf?.teacherType || '').toLowerCase().includes(q) ||
          (stf?.currentPostingSchoolName || '').toLowerCase().includes(q) ||
          (staffSchool?.hindiName || '').toLowerCase().includes(q) ||
          (staffSchool?.name || '').toLowerCase().includes(q) ||
          (staffSchool?.village || '').toLowerCase().includes(q) ||
          (stf?.qualification || '').toLowerCase().includes(q)
        );
      }
    );

    const matchedRasoiya = (scopedRasoiya || []).filter(
      (r) =>
        (r?.name || '').toLowerCase().includes(q) ||
        (r?.mobile || '').includes(q) ||
        (r?.aadhaarNumber || '').includes(q) ||
        (r?.caste || '').toLowerCase().includes(q) ||
        (r?.shgName || '').toLowerCase().includes(q) ||
        (r?.schoolUdise || '').includes(q) ||
        (r?.id || '').toLowerCase().includes(q)
    );

    const matchedSHGs = (scopedSHGs || []).filter(
      (s) =>
        (s?.name || '').toLowerCase().includes(q) ||
        (s?.presidentName || '').toLowerCase().includes(q) ||
        (s?.presidentMobile || '').includes(q) ||
        (s?.secretaryName || '').toLowerCase().includes(q) ||
        (s?.secretaryMobile || '').includes(q) ||
        (s?.registrationNumber || '').toLowerCase().includes(q) ||
        (s?.accountNumber || '').includes(q) ||
        (s?.schoolUdise || '').includes(q)
    );

    const matchedWork = (scopedWork || []).filter(
      (w) =>
        (w?.workName || '').toLowerCase().includes(q) ||
        (w?.orderNumber || '').toLowerCase().includes(q) ||
        (w?.department || '').toLowerCase().includes(q)
    );

    const matchedComplaints = (scopedComplaints || []).filter(
      (c) =>
        (c?.complaintId || '').toLowerCase().includes(q) ||
        (c?.subject || '').toLowerCase().includes(q) ||
        (c?.complainantName || '').toLowerCase().includes(q)
    );

    const matchedDocs = (scopedDocuments || []).filter(
      (d) =>
        (d?.title || '').toLowerCase().includes(q) ||
        (d?.category || '').toLowerCase().includes(q) ||
        (d?.schoolUdise || '').includes(q)
    );

    const matchedLearners = (scopedIlliteratePersons || []).filter(
      (p) =>
        (p?.name || '').toLowerCase().includes(q) ||
        (p?.fatherOrHusbandName || '').toLowerCase().includes(q) ||
        (p?.samagraId || '').includes(q) ||
        (p?.schoolUdise || '').includes(q)
    );

    const matchedVolunteers = (scopedAksharSathis || []).filter(
      (v) =>
        (v?.name || '').toLowerCase().includes(q) ||
        (v?.mobile || '').includes(q) ||
        (v?.village || '').toLowerCase().includes(q) ||
        (v?.schoolUdise || '').includes(q)
    );

    const total =
      (matchedSchools?.length || 0) +
      (matchedStudents?.length || 0) +
      (matchedStaff?.length || 0) +
      (matchedRasoiya?.length || 0) +
      (matchedSHGs?.length || 0) +
      (matchedWork?.length || 0) +
      (matchedComplaints?.length || 0) +
      (matchedDocs?.length || 0) +
      (matchedLearners?.length || 0) +
      (matchedVolunteers?.length || 0);

    return {
      schools: matchedSchools || [],
      students: matchedStudents || [],
      teachers: matchedStaff || [],
      rasoiya: matchedRasoiya || [],
      shgs: matchedSHGs || [],
      work: matchedWork || [],
      complaints: matchedComplaints || [],
      documents: matchedDocs || [],
      learners: matchedLearners || [],
      volunteers: matchedVolunteers || [],
      total,
    };
  }, [
    query,
    scopedSchools,
    scopedStudents,
    scopedStaff,
    scopedRasoiya,
    scopedSHGs,
    scopedWork,
    scopedComplaints,
    scopedDocuments,
    scopedIlliteratePersons,
    scopedAksharSathis
  ]);

  const handleSelectSchool = (udise: string) => {
    if (isSchoolRestricted) {
      if (currentUser?.assignedSchoolUdise) {
        setSelectedSchoolUdise(currentUser.assignedSchoolUdise);
        if (onSelectSchool) {
          onSelectSchool(currentUser.assignedSchoolUdise);
        } else if (onNavigateToSchool) {
          onNavigateToSchool(currentUser.assignedSchoolUdise);
        } else if (onNavigate) {
          onNavigate('school-profile');
        }
      }
      return;
    }
    setSelectedSchoolUdise(udise);
    if (onSelectSchool) {
      onSelectSchool(udise);
    } else if (onNavigateToSchool) {
      onNavigateToSchool(udise);
    } else if (onNavigate) {
      onNavigate('schools');
    }
  };

  const handleSelectStudent = (studentId: string) => {
    if (onNavigateToStudent) {
      onNavigateToStudent(studentId);
    } else if (onNavigate) {
      onNavigate('students');
    }
  };

  const handleSelectTeacher = (staffId: string) => {
    if (onNavigateToTeacher) {
      onNavigateToTeacher(staffId);
    } else if (onNavigate) {
      onNavigate('teachers');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header & Big Search Input */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              संकुल वैश्विक खोज (Universal Search)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              यूडाइस कोड, छात्र समग्र आईडी, शिक्षक कोड, आदेश क्रमांक अथवा नाम से त्वरित खोजें
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="खोजें... (उदा: मलगुवां, 230807, 102938475, EMP101, छात्रवृत्ति)"
            className="w-full pl-11 pr-4 py-3 bg-[#F8FAF8] dark:bg-[#0F1713] border border-emerald-300 dark:border-emerald-700 rounded-xl text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
          />
          <Search className="w-5 h-5 text-[#0B6B4B] absolute left-4 top-3.5" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
          {[
            { id: 'ALL' as FilterCategory, label: `सभी (${filteredResults.total})` },
            ...(!isSchoolRestricted ? [{ id: 'SCHOOLS' as FilterCategory, label: `विद्यालय (${filteredResults.schools.length})` }] : []),
            { id: 'STUDENTS' as FilterCategory, label: `विद्यार्थी (${filteredResults.students.length})` },
            { id: 'TEACHERS' as FilterCategory, label: `शिक्षक/स्टाफ (${filteredResults.teachers.length})` },
            { id: 'RASOIYA' as FilterCategory, label: `रसोइया (${filteredResults.rasoiya.length})` },
            { id: 'SHG' as FilterCategory, label: `स्व-सहायता समूह (${filteredResults.shgs.length})` },
            { id: 'WORK' as FilterCategory, label: `शासकीय कार्य (${filteredResults.work.length})` },
            { id: 'COMPLAINTS' as FilterCategory, label: `शिकायतें (${filteredResults.complaints.length})` },
            { id: 'DOCUMENTS' as FilterCategory, label: `दस्तावेज (${filteredResults.documents.length})` },
            { id: 'LITERACY' as FilterCategory, label: `साक्षरता (${filteredResults.learners.length + filteredResults.volunteers.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0B6B4B] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {query ? (
        <div className="space-y-4">
          {filteredResults.total === 0 ? (
            <div className="bg-white dark:bg-[#17211C] p-12 text-center rounded-2xl border border-gray-200 dark:border-gray-800">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                कोई परिणाम नहीं मिला
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                कृपया कीवर्ड (जैसे यूडाइस कोड, समग्र आईडी या नाम) जांचें और पुनः प्रयास करें।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Schools list - only for CAC/Admin */}
              {!isSchoolRestricted && (activeTab === 'ALL' || activeTab === 'SCHOOLS') && filteredResults.schools.length > 0 && (
                <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933]">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <SchoolIcon className="w-4 h-4 text-[#0B6B4B]" />
                    <span>विद्यालय परिणाम ({filteredResults.schools.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredResults.schools.map((s) => (
                      <div
                        key={s.udise}
                        onClick={() => handleSelectSchool(s.udise)}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713] hover:border-[#0B6B4B] cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white">
                            {s.name || s.hindiName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            यूडाइस: <span className="font-mono font-semibold text-[#0B6B4B]">{s.udise}</span> | ग्राम: {s.village}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            प्रधानाध्यापक: {s.principalName} ({s.principalMobile})
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students list */}
              {(activeTab === 'ALL' || activeTab === 'STUDENTS') && filteredResults.students.length > 0 && (
                <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933]">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>विद्यार्थी परिणाम ({filteredResults.students.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredResults.students.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => handleSelectStudent(st.id)}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713] hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                            <span>{st.name} ({st.gender}) - कक्षा {st.class}</span>
                            {st.status === 'PROMOTED' && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                कक्षोन्नत (PROMOTED)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            समग्र आईडी: <span className="font-mono font-semibold text-blue-600">{st.samagraId}</span> | पिता: {st.fatherName}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            यूडाइस: {st.schoolUdise} | वर्ग: {st.category}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff list */}
              {(activeTab === 'ALL' || activeTab === 'TEACHERS') && filteredResults.teachers.length > 0 && (
                <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933]">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>शिक्षक एवं स्टाफ परिणाम ({filteredResults.teachers.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredResults.teachers.map((stf) => (
                      <div
                        key={stf.id}
                        onClick={() => handleSelectTeacher(stf.id)}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713] hover:border-purple-500 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white">
                            {stf.name} ({stf.designation})
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            कोड: <span className="font-mono font-semibold text-purple-600">{stf.employeeId || stf.employeeCode || '-'}</span> | मोबाइल: {stf.mobile}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            विषय: {stf.subject} | पदस्थ विद्यालय: {stf.assignedSchoolUdise}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rasoiya list */}
              {(activeTab === 'ALL' || activeTab === 'RASOIYA') && filteredResults.rasoiya.length > 0 && (
                <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933]">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-emerald-600" />
                    <span>रसोइया परिणाम ({filteredResults.rasoiya.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredResults.rasoiya.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate('rasoiya');
                          }
                        }}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713] hover:border-emerald-500 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                            <span>{r.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                              {r.workingRole || 'रसोइया'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            मोबाइल: <span className="font-mono">{r.mobile || '-'}</span> | आधार: {r.aadhaarNumber ? `•••• •••• ${r.aadhaarNumber.slice(-4)}` : '-'}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            समूह: {r.shgName || '-'} | यूडाइस: {r.schoolUdise}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SHG list */}
              {(activeTab === 'ALL' || activeTab === 'SHG') && filteredResults.shgs.length > 0 && (
                <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933]">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-teal-600" />
                    <span>स्व-सहायता समूह (SHG) परिणाम ({filteredResults.shgs.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredResults.shgs.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate('shg');
                          }
                        }}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713] hover:border-teal-500 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                            <span>{s.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-medium">
                              पंजीकरण: {s.registrationNumber || 'पंजीकृत'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            अध्यक्ष: {s.presidentName} ({s.presidentMobile || '-'})
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            सचिव: {s.secretaryName || '-'} | यूडाइस: {s.schoolUdise}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work */}
              {(activeTab === 'ALL' || activeTab === 'WORK') && filteredResults.work.length > 0 && (
                <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-amber-600" />
                    <span>शासकीय कार्य एवं आदेश ({filteredResults.work.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.work.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => onNavigate && onNavigate('work')}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713] hover:border-amber-500 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{w.workName}</div>
                          <div className="text-gray-500 dark:text-gray-400">आदेश: {w.orderNumber} | अंतिम तिथि: {w.deadline}</div>
                        </div>
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">{w.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complaints */}
              {(activeTab === 'ALL' || activeTab === 'COMPLAINTS') && filteredResults.complaints.length > 0 && (
                <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>शिकायत निवारण ({filteredResults.complaints.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.complaints.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onNavigate && onNavigate('complaints')}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713] hover:border-red-500 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{c.subject}</div>
                          <div className="text-gray-500 dark:text-gray-400">आईडी: {c.complaintId} | शिकायतकर्ता: {c.complainantName}</div>
                        </div>
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {(activeTab === 'ALL' || activeTab === 'DOCUMENTS') && filteredResults.documents.length > 0 && (
                <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                    <FolderLock className="w-4 h-4 text-teal-600" />
                    <span>दस्तावेज एवं प्रपत्र ({filteredResults.documents.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.documents.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => onNavigate && onNavigate('documents')}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713] hover:border-teal-500 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{d.title}</div>
                          <div className="text-gray-500 dark:text-gray-400">श्रेणी: {d.category} | तिथि: {d.date}</div>
                        </div>
                        <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">{d.fileType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Literacy Learners & Volunteers */}
              {(activeTab === 'ALL' || activeTab === 'LITERACY') && (filteredResults.learners.length > 0 || filteredResults.volunteers.length > 0) && (
                <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>नवभारत साक्षरता कार्यक्रम परिणाम ({filteredResults.learners.length + filteredResults.volunteers.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredResults.learners.map((lrn) => (
                      <div
                        key={lrn.id}
                        onClick={() => onNavigate && onNavigate('literacy-learners')}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713] hover:border-emerald-500 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">असाक्षर: {lrn.name} ({lrn.gender})</div>
                          <div className="text-gray-500 dark:text-gray-400">पिता/पति: {lrn.fatherOrHusbandName} | समग्र: {lrn.samagraId || '-'}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">स्थिति: {lrn.registrationStatus}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                    {filteredResults.volunteers.map((vol) => (
                      <div
                        key={vol.id}
                        onClick={() => onNavigate && onNavigate('literacy-volunteers')}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713] hover:border-emerald-500 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">अक्षर साथी: {vol.name}</div>
                          <div className="text-gray-500 dark:text-gray-400">मोबाइल: {vol.mobile} | ग्राम: {vol.village}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">संलग्न असाक्षर: {vol.assignedLearnersCount || 0}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Helpful suggestions before search */
        <div className="bg-white dark:bg-[#17211C] p-6 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] flex items-center justify-center mx-auto mb-2">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            खोजने के लिए टाइप करना प्रारंभ करें
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
            आप किसी भी 11 अंकों के यूडाइस कोड (उदा. 23080703801), 9 अंकों की समग्र आईडी, या शिक्षक नाम से पूरे संकुल में खोज सकते हैं।
          </p>
        </div>
      )}
    </div>
  );
};
