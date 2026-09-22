import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  Download,
  Printer,
  Plus,
  CheckCircle2,
  Users,
  Utensils,
  GraduationCap,
  History,
  ClipboardCheck,
  School as SchoolIcon,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import { triggerPrint } from '../../utils/printUtils';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { SmartExportModal } from '../export/SmartExportModal';
import { StudentAttendanceTab } from './StudentAttendanceTab';
import { StaffAttendanceTab } from './StaffAttendanceTab';
import { RasoiyaAttendanceTab } from './RasoiyaAttendanceTab';
import { AttendanceHistoryTab } from './AttendanceHistoryTab';
import { CacAttendanceMonitoringView } from './CacAttendanceMonitoringView';

type ActiveCategory = 'STUDENT' | 'STAFF' | 'RASOIYA';
type ViewMode = 'DAILY' | 'HISTORY' | 'MONITORING';

export const AttendanceView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    attendance: scopedAttendance,
    students: scopedStudents,
    staff: scopedStaff,
    rasoiya: scopedRasoiya,
    schools,
    currentSchool,
    currentSchoolUdise,
    isSchoolUser: isSchoolRestricted,
    markAttendance
  } = useSchoolScope();
  const { selectedSessionId, isCurrentSessionSelected } = useData();

  const defaultSchoolUdise = currentSchoolUdise || (schools[0]?.udise || '');

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('STUDENT');
  const [viewMode, setViewMode] = useState<ViewMode>('DAILY');
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState<string>(
    isSchoolRestricted ? defaultSchoolUdise : 'ALL'
  );

  // Auto-align date to session on session change
  useEffect(() => {
    if (isCurrentSessionSelected) {
      setSelectedDate(today);
    } else {
      const datesInSession = scopedAttendance
        .filter((a) => !a.sessionId || a.sessionId === selectedSessionId)
        .map((a) => a.date)
        .sort()
        .reverse();

      if (datesInSession.length > 0) {
        setSelectedDate(datesInSession[0]);
      } else {
        setSelectedDate(today);
      }
    }
  }, [selectedSessionId, isCurrentSessionSelected, scopedAttendance, today]);

  // Keep selected school in sync if user is school restricted
  useEffect(() => {
    if (isSchoolRestricted && currentSchoolUdise) {
      setSelectedSchoolUdise(currentSchoolUdise);
    }
  }, [isSchoolRestricted, currentSchoolUdise]);

  // Quick summary manual modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmartExportOpen, setIsSmartExportOpen] = useState(false);
  const [formSchoolUdise, setFormSchoolUdise] = useState(defaultSchoolUdise);
  const [formType, setFormType] = useState<'STUDENT' | 'STAFF' | 'RASOIYA'>('STUDENT');
  const [formClass, setFormClass] = useState('5');
  const [formTotal, setFormTotal] = useState(30);
  const [formPresent, setFormPresent] = useState(27);
  const [formRemarks, setFormRemarks] = useState('सामान्य उपस्थिति');

  // Invalidate and safely close modal if academic session changes
  useEffect(() => {
    if (isModalOpen) {
      setIsModalOpen(false);
    }
  }, [selectedSessionId]);

  // Handle Quick Modal Save
  const handleSaveQuickAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (formPresent > formTotal) {
      alert('उपस्थित संख्या कुल संख्या से अधिक नहीं हो सकती।');
      return;
    }

    markAttendance({
      schoolUdise: formSchoolUdise,
      date: selectedDate,
      type: formType,
      class: formType === 'STUDENT' ? formClass : undefined,
      totalCount: Number(formTotal),
      presentCount: Number(formPresent),
      absentCount: Number(formTotal) - Number(formPresent),
      percentage: Math.round((Number(formPresent) / Number(formTotal)) * 100),
      recordedBy: currentUser?.name || 'उपयोगकर्ता',
      remarks: formRemarks,
    });

    setIsModalOpen(false);
  };

  // Export & Print Payload
  const getAttendanceExportPayload = () => {
    const headers = [
      'क्रमांक',
      'दिनांक',
      'यूडाइस कोड',
      'प्रकार',
      'कक्षा / पद',
      'कुल संख्या',
      'उपस्थित संख्या',
      'अनुपस्थित संख्या',
      'उपस्थिति प्रतिशत',
      'दर्जकर्ता',
      'दर्ज समय'
    ];

    const recordsForExport = scopedAttendance.filter((a) => {
      const matchDate = !selectedDate || a.date === selectedDate;
      const matchSchool =
        !selectedSchoolUdise || selectedSchoolUdise === 'ALL' || a.schoolUdise === selectedSchoolUdise;
      return matchDate && matchSchool;
    });

    const rows = recordsForExport.map((rec, idx) => [
      idx + 1,
      rec.date,
      rec.schoolUdise,
      rec.type === 'STUDENT'
        ? 'विद्यार्थी'
        : rec.type === 'RASOIYA'
        ? 'रसोइया'
        : 'शिक्षक/स्टाफ',
      rec.class ? `कक्षा ${rec.class}` : 'समस्त',
      rec.totalCount,
      rec.presentCount,
      rec.absentCount,
      rec.isHoliday ? 'N/A (अवकाश)' : `${rec.percentage ?? Math.round((rec.presentCount / (rec.totalCount || 1)) * 100)}%`,
      rec.recordedBy || rec.markedBy || 'उपयोगकर्ता',
      rec.markedAt || '-'
    ]);

    return {
      title: 'जन शिक्षा केंद्र मलगुवां - दैनिक उपस्थिति रिपोर्ट',
      subtitle: `दिनांक: ${selectedDate} | सत्र: ${selectedSessionId}`,
      schoolName: currentSchool?.name || currentSchool?.hindiName,
      udise: isSchoolRestricted ? currentSchoolUdise : (selectedSchoolUdise === 'ALL' ? undefined : selectedSchoolUdise),
      session: selectedSessionId,
      headers,
      rows,
      fileName: `Attendance_${selectedSessionId}_${selectedDate}`,
    };
  };

  // Counts for badge counters
  const studentCount = scopedStudents.filter(s => !selectedSchoolUdise || selectedSchoolUdise === 'ALL' || s.schoolUdise === selectedSchoolUdise).length;
  const staffCount = scopedStaff.filter(s => !selectedSchoolUdise || selectedSchoolUdise === 'ALL' || s.assignedSchoolUdise === selectedSchoolUdise).length;
  const rasoiyaCount = scopedRasoiya.filter(r => !selectedSchoolUdise || selectedSchoolUdise === 'ALL' || r.schoolUdise === selectedSchoolUdise).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              दैनिक उपस्थिति मॉनिटरिंग (Daily Attendance Tracking)
            </h2>
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
              दिनांक: {selectedDate}
            </span>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              सत्र {selectedSessionId}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            संकुल मलगुवां अंतर्गत विद्यार्थी, शिक्षक/स्टाफ एवं मध्याह्न भोजन रसोइया दैनिक उपस्थिति का डिजिटल संकलन
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <UnifiedPrintButton
            id="attendance-unified-print"
            currentSession={selectedSessionId}
            currentSchoolName={currentSchool?.name || currentSchool?.hindiName}
            currentUdise={isSchoolRestricted ? currentSchoolUdise : (selectedSchoolUdise === 'ALL' ? undefined : selectedSchoolUdise)}
            onPrintCurrentView={() => triggerPrint()}
            onPrintReport={() => setIsSmartExportOpen(true)}
            currentViewLabel="Print Current View"
            currentViewSubtext="वर्तमान दैनिक उपस्थिति तालिका का त्वरित प्रिंट"
            reportLabel="Print Report"
            reportSubtext="दैनिक व मासिक उपस्थिति / आधिकारिक A4 स्मार्ट रिपोर्ट प्रारूप"
            exportPayload={getAttendanceExportPayload}
          />
        </div>
      </div>

      {/* Primary Category Navigation Bar: [ विद्यार्थी ] [ शिक्षक एवं स्टाफ ] [ रसोइया ] */}
      <div className="bg-white dark:bg-[#17211C] p-2.5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigation Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 px-2 flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <span>उपस्थिति भरें:</span>
          </span>

          {/* Student Tab */}
          <button
            id="tab-attendance-student"
            type="button"
            onClick={() => {
              setActiveCategory('STUDENT');
              setViewMode('DAILY');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'DAILY' && activeCategory === 'STUDENT'
                ? 'bg-[#0B6B4B] text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>विद्यार्थी</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20 font-mono">
              {studentCount}
            </span>
          </button>

          {/* Teacher & Staff Tab */}
          <button
            id="tab-attendance-staff"
            type="button"
            onClick={() => {
              setActiveCategory('STAFF');
              setViewMode('DAILY');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'DAILY' && activeCategory === 'STAFF'
                ? 'bg-[#0B6B4B] text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>शिक्षक एवं स्टाफ</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20 font-mono">
              {staffCount}
            </span>
          </button>

          {/* Rasoiya Tab */}
          <button
            id="tab-attendance-rasoiya"
            type="button"
            onClick={() => {
              setActiveCategory('RASOIYA');
              setViewMode('DAILY');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'DAILY' && activeCategory === 'RASOIYA'
                ? 'bg-[#0B6B4B] text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>रसोइया</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20 font-mono">
              {rasoiyaCount}
            </span>
          </button>
        </div>

        {/* View Mode Toggle: Daily Entry vs CAC Monitoring vs History & Monthly */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#0F1713] p-1 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('DAILY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              viewMode === 'DAILY'
                ? 'bg-white dark:bg-[#17211C] text-[#0B6B4B] dark:text-emerald-400 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>दैनिक प्रविष्टि</span>
          </button>

          {(currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN') && (
            <button
              type="button"
              onClick={() => setViewMode('MONITORING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                viewMode === 'MONITORING'
                  ? 'bg-white dark:bg-[#17211C] text-[#0B6B4B] dark:text-emerald-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>संकुल मॉनिटरिंग</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewMode('HISTORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              viewMode === 'HISTORY'
                ? 'bg-white dark:bg-[#17211C] text-[#0B6B4B] dark:text-emerald-400 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>इतिहास व रिपोर्ट</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      {viewMode === 'MONITORING' ? (
        <CacAttendanceMonitoringView />
      ) : (
        <>
          {/* Date & School Selection Toolbar */}
          <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Date Selector */}
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-gray-700 dark:text-gray-300">उपस्थिति दिनांक:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-bold"
              />
            </div>

            {/* School Selector (or Locked Badge for School User) */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 dark:text-gray-300">विद्यालय:</span>
              {isSchoolRestricted ? (
                <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-lg text-[#0B6B4B] dark:text-emerald-200 font-bold truncate max-w-[280px]">
                  {currentSchool?.name || currentSchool?.hindiName || 'मेरा विद्यालय'} ({currentSchoolUdise})
                </div>
              ) : (
                <select
                  value={selectedSchoolUdise}
                  onChange={(e) => setSelectedSchoolUdise(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium max-w-[320px]"
                >
                  <option value="ALL">समस्त संकुल शालाएं ({schools.length})</option>
                  {schools.map((s) => (
                    <option key={s.udise} value={s.udise}>
                      {s.name || s.hindiName} ({s.udise})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {viewMode === 'HISTORY' ? (
            <AttendanceHistoryTab selectedSchoolUdise={selectedSchoolUdise} />
          ) : activeCategory === 'STAFF' ? (
            <StaffAttendanceTab
              selectedDate={selectedDate}
              selectedSchoolUdise={selectedSchoolUdise}
            />
          ) : activeCategory === 'RASOIYA' ? (
            <RasoiyaAttendanceTab
              selectedDate={selectedDate}
              selectedSchoolUdise={selectedSchoolUdise}
            />
          ) : (
            <StudentAttendanceTab
              selectedDate={selectedDate}
              selectedSchoolUdise={selectedSchoolUdise}
              onOpenQuickModal={() => setIsModalOpen(true)}
            />
          )}
        </>
      )}

      {/* Quick Summary Numeric Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              त्वरित सारांश उपस्थिति दर्ज करें
            </h3>

            <form onSubmit={handleSaveQuickAttendance} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  विद्यालय का चयन *
                </label>
                {isSchoolRestricted ? (
                  <div className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-lg text-[#0B6B4B] dark:text-emerald-200 font-bold truncate">
                    {schools.find(s => s.udise === formSchoolUdise)?.name || schools.find(s => s.udise === formSchoolUdise)?.hindiName || 'मेरा विद्यालय'} ({formSchoolUdise})
                  </div>
                ) : (
                  <select
                    value={formSchoolUdise}
                    onChange={(e) => setFormSchoolUdise(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    {schools.map((s) => (
                      <option key={s.udise} value={s.udise}>
                        {s.name || s.hindiName} ({s.udise})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    उपस्थिति प्रकार *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="STUDENT">विद्यार्थी उपस्थिति</option>
                    <option value="STAFF">शिक्षक/स्टाफ उपस्थिति</option>
                    <option value="RASOIYA">रसोइया उपस्थिति</option>
                  </select>
                </div>

                {formType === 'STUDENT' && (
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      कक्षा
                    </label>
                    <select
                      value={formClass}
                      onChange={(e) => setFormClass(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    >
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((c) => (
                        <option key={c} value={c}>
                          कक्षा {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    कुल दर्ज संख्या *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formTotal}
                    onChange={(e) => setFormTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    उपस्थित संख्या *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={formTotal}
                    value={formPresent}
                    onChange={(e) => setFormPresent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  टिप्पणी (Remarks)
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg"
                />
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

      {/* Smart Export Modal for Attendance */}
      <SmartExportModal
        isOpen={isSmartExportOpen}
        onClose={() => setIsSmartExportOpen(false)}
        initialType="ATTENDANCE"
        initialUdise={selectedSchoolUdise === 'ALL' ? undefined : selectedSchoolUdise}
      />
    </div>
  );
};
