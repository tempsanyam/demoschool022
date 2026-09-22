import React, { useState, useMemo } from 'react';
import {
  Calendar,
  History,
  Search,
  Filter,
  Users,
  Utensils,
  GraduationCap,
  Download,
  Printer,
  ChevronDown,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import { AttendanceRecord } from '../../types';
import { exportToExcel } from '../../utils/exportUtils';
import { triggerPrint } from '../../utils/printUtils';

interface AttendanceHistoryTabProps {
  selectedSchoolUdise: string;
}

export const AttendanceHistoryTab: React.FC<AttendanceHistoryTabProps> = ({
  selectedSchoolUdise
}) => {
  const {
    attendance: scopedAttendance,
    schools,
    staff: scopedStaff,
    rasoiya: scopedRasoiya,
    students: scopedStudents,
    selectedSessionId,
    currentSchool,
    isSchoolUser
  } = useSchoolScope();

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'STUDENT' | 'STAFF' | 'RASOIYA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<AttendanceRecord | null>(null);

  // Month-Year selection (Defaults to current month)
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);

  // Filter attendance records by month, school, and category
  const filteredRecords = useMemo(() => {
    return scopedAttendance.filter((rec) => {
      const matchMonth = !selectedMonth || rec.date.startsWith(selectedMonth);
      const matchSchool =
        !selectedSchoolUdise ||
        selectedSchoolUdise === 'ALL' ||
        rec.schoolUdise === selectedSchoolUdise;
      const matchCategory =
        categoryFilter === 'ALL' ||
        (categoryFilter === 'STAFF' && (rec.type === 'STAFF' || rec.type === 'TEACHER')) ||
        rec.type === categoryFilter;

      return matchMonth && matchSchool && matchCategory;
    });
  }, [scopedAttendance, selectedMonth, selectedSchoolUdise, categoryFilter]);

  // Generate monthly individual summary aggregated across marked dates in this month
  const monthlyPersonSummary = useMemo(() => {
    const personMap = new Map<
      string,
      {
        id: string;
        name: string;
        type: 'STUDENT' | 'STAFF' | 'RASOIYA';
        roleOrClass: string;
        schoolUdise: string;
        totalDays: number;
        presentDays: number;
        absentDays: number;
        leaveDays: number;
        odDays: number;
      }
    >();

    filteredRecords.forEach((rec) => {
      const pType: 'STUDENT' | 'STAFF' | 'RASOIYA' =
        rec.type === 'RASOIYA' ? 'RASOIYA' : (rec.type === 'STAFF' || rec.type === 'TEACHER') ? 'STAFF' : 'STUDENT';

      if (rec.records && Array.isArray(rec.records)) {
        rec.records.forEach((r) => {
          const key = `${r.entityId || r.name}___${rec.schoolUdise}`;
          if (!personMap.has(key)) {
            // Find role/designation
            let roleOrClass = rec.class ? `कक्षा ${rec.class}` : '-';
            if (pType === 'STAFF') {
              const staffMember = scopedStaff.find((s) => s.id === r.entityId || s.employeeId === r.entityId);
              if (staffMember) roleOrClass = staffMember.designation;
            } else if (pType === 'RASOIYA') {
              roleOrClass = 'रसोइया';
            }

            personMap.set(key, {
              id: r.entityId || key,
              name: r.name,
              type: pType,
              roleOrClass,
              schoolUdise: rec.schoolUdise,
              totalDays: 0,
              presentDays: 0,
              absentDays: 0,
              leaveDays: 0,
              odDays: 0
            });
          }

          const person = personMap.get(key)!;
          person.totalDays += 1;
          if (r.status === 'PRESENT') person.presentDays += 1;
          else if (r.status === 'ABSENT') person.absentDays += 1;
          else if (['LEAVE', 'CL', 'ML', 'EL'].includes(r.status)) person.leaveDays += 1;
          else if (r.status === 'OD') person.odDays += 1;
          else person.presentDays += 1;
        });
      }
    });

    const result = Array.from(personMap.values());

    if (!searchQuery) return result;
    const q = searchQuery.toLowerCase().trim();
    return result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.roleOrClass.toLowerCase().includes(q) ||
        p.schoolUdise.includes(q)
    );
  }, [filteredRecords, scopedStaff, searchQuery]);

  // Overall totals for selected month
  const monthTotals = useMemo(() => {
    let totalMarked = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalOd = 0;

    filteredRecords.forEach((rec) => {
      if (rec.isHoliday) return; // Exclude holiday days from percentage calculation
      totalMarked += rec.totalCount;
      totalPresent += rec.presentCount;
      totalAbsent += rec.absentCount;
      totalLeave += rec.leaveCount || 0;
      totalOd += rec.onDutyCount || 0;
    });

    const pct = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

    return { totalMarked, totalPresent, totalAbsent, totalLeave, totalOd, pct };
  }, [filteredRecords]);

  // Export monthly summary to Excel
  const handleExportExcel = () => {
    if (monthlyPersonSummary.length === 0) {
      alert('निर्यात के लिए कोई डेटा उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'क्र.',
      'नाम',
      'संवर्ग (Category)',
      'पद / कक्षा',
      'यूडाइस कोड',
      'कुल दर्ज दिवस',
      'उपस्थित दिवस',
      'अनुपस्थित दिवस',
      'अवकाश दिवस',
      'कर्तव्य दिवस (OD)',
      'उपस्थिति प्रतिशत (%)'
    ];

    const rows = monthlyPersonSummary.map((p, idx) => {
      const pct = p.totalDays > 0 ? Math.round((p.presentDays / p.totalDays) * 100) : 0;
      return [
        idx + 1,
        p.name,
        p.type === 'STUDENT' ? 'विद्यार्थी' : p.type === 'STAFF' ? 'शिक्षक/स्टाफ' : 'रसोइया',
        p.roleOrClass,
        p.schoolUdise,
        p.totalDays,
        p.presentDays,
        p.absentDays,
        p.leaveDays,
        p.odDays,
        `${pct}%`
      ];
    });

    exportToExcel({
      title: `मासिक उपस्थिति रिपोर्ट (${selectedMonth})`,
      subtitle: `सत्र: ${selectedSessionId}`,
      headers,
      rows,
      fileName: `Monthly_Attendance_${selectedMonth}_${selectedSessionId}`
    });
  };

  return (
    <div className="space-y-4">
      {/* Month, Category & Search Bar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-gray-700 dark:text-gray-300">माह चुनें:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-bold text-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-gray-700 dark:text-gray-300 mr-1">श्रेणी:</span>
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-[#0B6B4B] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            सभी (All)
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('STUDENT')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
              categoryFilter === 'STUDENT'
                ? 'bg-[#0B6B4B] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            विद्यार्थी
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('STAFF')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
              categoryFilter === 'STAFF'
                ? 'bg-[#0B6B4B] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            शिक्षक एवं स्टाफ
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('RASOIYA')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
              categoryFilter === 'RASOIYA'
                ? 'bg-[#0B6B4B] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            रसोइया
          </button>
        </div>

        {/* Actions & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="नाम खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white w-44"
            />
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-[#0B6B4B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-bold flex items-center gap-1 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel निर्यात</span>
          </button>

          <button
            type="button"
            onClick={() => triggerPrint()}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold flex items-center gap-1 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>प्रिंट</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-medium">कुल दर्ज प्रविष्टियां</span>
          <span className="text-xl font-black text-gray-900 dark:text-white mt-0.5 block">{monthTotals.totalMarked}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">कुल उपस्थित दिवस</span>
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">{monthTotals.totalPresent}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-red-600 block font-medium">कुल अनुपस्थित</span>
          <span className="text-xl font-black text-red-600 mt-0.5 block">{monthTotals.totalAbsent}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-amber-600 block font-medium">कुल अवकाश</span>
          <span className="text-xl font-black text-amber-600 mt-0.5 block">{monthTotals.totalLeave}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-blue-600 block font-medium">कुल कर्तव्य (OD)</span>
          <span className="text-xl font-black text-blue-600 mt-0.5 block">{monthTotals.totalOd}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-purple-600 block font-medium">मासिक उपस्थिति दर</span>
          <span className="text-xl font-black text-purple-700 dark:text-purple-400 mt-0.5 block">{monthTotals.pct}%</span>
        </div>
      </div>

      {/* Monthly Person Summary Table */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="p-3.5 bg-gray-50 dark:bg-[#0F1713] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-xs text-gray-900 dark:text-white">
              मासिक व्यक्तिगत उपस्थिति सारांश ({selectedMonth || 'समस्त'})
            </h3>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">
            कुल व्यक्ति: {monthlyPersonSummary.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-bold w-12 text-center">क्र.</th>
                <th className="p-3 font-bold min-w-[180px]">नाम</th>
                <th className="p-3 font-bold min-w-[120px]">श्रेणी</th>
                <th className="p-3 font-bold min-w-[140px]">पद / कक्षा</th>
                <th className="p-3 font-bold min-w-[140px]">शाला</th>
                <th className="p-3 font-bold text-center">कुल कार्यदिवस</th>
                <th className="p-3 font-bold text-center text-emerald-600">उपस्थित</th>
                <th className="p-3 font-bold text-center text-red-600">अनुपस्थित</th>
                <th className="p-3 font-bold text-center text-amber-600">अवकाश</th>
                <th className="p-3 font-bold text-center text-blue-600">OD</th>
                <th className="p-3 font-bold text-center min-w-[100px]">उपस्थिति दर</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {monthlyPersonSummary.length > 0 ? (
                monthlyPersonSummary.map((p, idx) => {
                  const pct = p.totalDays > 0 ? Math.round((p.presentDays / p.totalDays) * 100) : 0;
                  const schoolObj = schools.find((s) => s.udise === p.schoolUdise);

                  return (
                    <tr key={`${p.id}-${idx}`} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                      <td className="p-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-gray-900 dark:text-white">{p.name}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            p.type === 'STUDENT'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : p.type === 'STAFF'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {p.type === 'STUDENT' ? 'विद्यार्थी' : p.type === 'STAFF' ? 'शिक्षक/स्टाफ' : 'रसोइया'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">{p.roleOrClass}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        <div className="truncate max-w-[140px]" title={schoolObj?.name}>
                          {schoolObj?.name || schoolObj?.hindiName || p.schoolUdise}
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-gray-800 dark:text-gray-200">{p.totalDays}</td>
                      <td className="p-3 text-center font-bold text-emerald-600">{p.presentDays}</td>
                      <td className="p-3 text-center font-bold text-red-600">{p.absentDays}</td>
                      <td className="p-3 text-center font-bold text-amber-600">{p.leaveDays}</td>
                      <td className="p-3 text-center font-bold text-blue-600">{p.odDays}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 font-bold">
                          <span
                            className={
                              pct >= 75
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : pct >= 50
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-gray-400">
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                      चयनित माह के लिए कोई व्यक्तिगत उपस्थिति डेटा उपलब्ध नहीं है।
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      प्रतिदिन उपस्थिति सुरक्षित करने पर मासिक संकलन यहाँ स्वतः बनता जाएगा।
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Records Logs Table */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="p-3.5 bg-gray-50 dark:bg-[#0F1713] border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-xs text-gray-900 dark:text-white">
            दैनिक उपस्थिति लॉग (सत्र {selectedSessionId})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-bold">क्र.</th>
                <th className="p-3 font-bold">दिनांक</th>
                <th className="p-3 font-bold">विद्यालय</th>
                <th className="p-3 font-bold">श्रेणी</th>
                <th className="p-3 font-bold">कक्षा/वर्ग</th>
                <th className="p-3 font-bold text-right">कुल संख्या</th>
                <th className="p-3 font-bold text-right text-emerald-600">उपस्थित</th>
                <th className="p-3 font-bold text-right text-red-600">अनुपस्थित</th>
                <th className="p-3 font-bold text-right">प्रतिशत</th>
                <th className="p-3 font-bold">दर्जकर्ता व समय</th>
                <th className="p-3 font-bold text-center">विवरण</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, idx) => {
                  const sObj = schools.find((s) => s.udise === rec.schoolUdise);
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                      <td className="p-3 text-gray-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-gray-900 dark:text-white font-mono">{rec.date}</td>
                      <td className="p-3">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {sObj?.name || sObj?.hindiName || rec.schoolUdise}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400">{rec.schoolUdise}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            rec.type === 'STUDENT'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : rec.type === 'STAFF' || rec.type === 'TEACHER'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {rec.type === 'STUDENT'
                            ? 'विद्यार्थी'
                            : rec.type === 'STAFF' || rec.type === 'TEACHER'
                            ? 'शिक्षक/स्टाफ'
                            : 'रसोइया'}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{rec.class ? `कक्षा ${rec.class}` : '-'}</td>
                      <td className="p-3 text-right font-bold">{rec.totalCount}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {rec.isHoliday ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
                            अवकाश
                          </span>
                        ) : (
                          rec.presentCount
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-red-600">
                        {rec.isHoliday ? '-' : rec.absentCount}
                      </td>
                      <td className="p-3 text-right font-bold">
                        {rec.isHoliday ? (
                          <span className="text-gray-400 text-xs font-mono">N/A</span>
                        ) : (
                          `${rec.percentage ?? Math.round((rec.presentCount / (rec.totalCount || 1)) * 100)}%`
                        )}
                      </td>
                      <td className="p-3 text-gray-500">
                        <div>👤 {rec.recordedBy || rec.markedBy || 'उपयोगकर्ता'}</div>
                        {rec.isHoliday && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                            कारण: {rec.holidayReason || rec.remarks || 'अवकाश'}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400">{rec.markedAt || '-'}</div>
                      </td>
                      <td className="p-3 text-center">
                        {rec.records && rec.records.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForModal(rec)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded font-bold text-[11px] flex items-center gap-1 mx-auto"
                          >
                            <Eye className="w-3 h-3 text-emerald-600" />
                            <span>देखें ({rec.records.length})</span>
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-400">
                    इस माह अथवा फ़िल्टर के लिए कोई उपस्थिति रिकॉर्ड नहीं मिला।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal for a single attendance record */}
      {selectedRecordForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  दैनिक उपस्थिति विवरण: {selectedRecordForModal.date}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedRecordForModal.type === 'STUDENT'
                    ? 'विद्यार्थी'
                    : selectedRecordForModal.type === 'RASOIYA'
                    ? 'रसोइया'
                    : 'शिक्षक एवं स्टाफ'}{' '}
                  | यूडाइस: {selectedRecordForModal.schoolUdise}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordForModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto my-4 divide-y divide-gray-100 dark:divide-gray-800 flex-1">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-600 dark:text-gray-400">
                    <th className="p-2.5 font-bold">क्र.</th>
                    <th className="p-2.5 font-bold">नाम</th>
                    <th className="p-2.5 font-bold text-center">स्थिति</th>
                    <th className="p-2.5 font-bold">टिप्पणी</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {selectedRecordForModal.records?.map((r, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 text-gray-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-gray-900 dark:text-white">{r.name}</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            r.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : r.status === 'ABSENT'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : r.status === 'OD'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {r.status === 'PRESENT'
                            ? 'P (उपस्थित)'
                            : r.status === 'ABSENT'
                            ? 'A (अनुपस्थित)'
                            : r.status === 'OD'
                            ? 'OD (कर्तव्य)'
                            : 'L (अवकाश)'}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-500">{r.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecordForModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
