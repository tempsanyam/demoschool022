import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  Download,
  Printer,
  Plus,
  CheckCircle2,
  Users,
  Clock,
  TrendingUp,
  School as SchoolIcon
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { exportToExcel, exportToCSV, triggerSystemPrint } from '../../utils/exportUtils';

export const AttendanceView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    scopedAttendance,
    scopedStudents,
    scopedStaff,
    schools,
    selectedSchool,
    markAttendance
  } = useData();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedType, setSelectedType] = useState<'ALL' | 'STUDENT' | 'STAFF'>('ALL');
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState<string>(selectedSchool?.udise || '');

  // Mark Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSchoolUdise, setFormSchoolUdise] = useState(selectedSchool?.udise || schools[0]?.udise || '');
  const [formType, setFormType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [formClass, setFormClass] = useState('5');
  const [formTotal, setFormTotal] = useState(30);
  const [formPresent, setFormPresent] = useState(27);
  const [formRemarks, setFormRemarks] = useState('सामान्य उपस्थिति');

  // Filtered Attendance Records
  const filteredAttendance = useMemo(() => {
    return scopedAttendance.filter((a) => {
      const matchDate = !selectedDate || a.date === selectedDate;
      const matchType = selectedType === 'ALL' || a.type === selectedType;
      const matchSchool = !selectedSchoolUdise || a.schoolUdise === selectedSchoolUdise;
      return matchDate && matchType && matchSchool;
    });
  }, [scopedAttendance, selectedDate, selectedType, selectedSchoolUdise]);

  // Overall attendance statistics for selected date
  const overallStats = useMemo(() => {
    let totalMarked = 0;
    let totalPresent = 0;
    filteredAttendance.forEach((rec) => {
      totalMarked += rec.totalCount;
      totalPresent += rec.presentCount;
    });
    const pct = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;
    return { totalMarked, totalPresent, totalAbsent: totalMarked - totalPresent, pct };
  }, [filteredAttendance]);

  const handleSaveAttendance = (e: React.FormEvent) => {
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

  const handleExport = (type: 'EXCEL' | 'CSV') => {
    const headers = [
      'क्रमांक',
      'दिनांक',
      'यूडाइस कोड',
      'प्रकार (छात्र/स्टाफ)',
      'कक्षा',
      'कुल संख्या',
      'उपस्थित संख्या',
      'अनुपस्थित संख्या',
      'उपस्थिति प्रतिशत',
      'दर्जकर्ता',
      'दर्ज समय'
    ];

    const rows = filteredAttendance.map((rec, idx) => [
      idx + 1,
      rec.date,
      rec.schoolUdise,
      rec.type === 'STUDENT' ? 'विद्यार्थी' : 'स्टाफ/शिक्षक',
      rec.class ? `कक्षा ${rec.class}` : '-',
      rec.totalCount,
      rec.presentCount,
      rec.absentCount,
      `${rec.percentage}%`,
      rec.recordedBy,
      rec.markedAt || '-'
    ]);

    const payload = {
      title: 'जन शिक्षा केंद्र मलगुवां - दैनिक उपस्थिति रिपोर्ट',
      subtitle: `दिनांक: ${selectedDate} | सत्र 2026-27`,
      headers,
      rows,
      fileName: `Malguwa_Attendance_${selectedDate}`,
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
              दैनिक उपस्थिति मॉनिटरिंग (Daily Attendance Tracking)
            </h2>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              दिनांक: {selectedDate}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            संकुल मलगुवां अंतर्गत छात्र एवं शिक्षक दैनिक उपस्थिति का लाइव डिजिटल संकलन
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
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>उपस्थिति दर्ज करें</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700 dark:text-gray-300">दिनांक चुनें:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium"
          >
            <option value="ALL">सभी (छात्र + स्टाफ)</option>
            <option value="STUDENT">केवल विद्यार्थी</option>
            <option value="STAFF">केवल शिक्षक/स्टाफ</option>
          </select>
        </div>
      </div>

      {/* Summary Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <span className="text-xs text-gray-500 block">कुल दर्ज उपस्थिति</span>
          <span className="text-2xl font-black text-gray-900 dark:text-white">{overallStats.totalMarked}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <span className="text-xs text-emerald-600 font-semibold block">कुल उपस्थित</span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{overallStats.totalPresent}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <span className="text-xs text-red-600 font-semibold block">कुल अनुपस्थित</span>
          <span className="text-2xl font-black text-red-600">{overallStats.totalAbsent}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <span className="text-xs text-blue-600 font-semibold block">औसत उपस्थिति दर</span>
          <span className="text-2xl font-black text-blue-600">{overallStats.pct}%</span>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-bold">क्र.</th>
                <th className="p-3 font-bold">विद्यालय (यूडाइस)</th>
                <th className="p-3 font-bold">प्रकार</th>
                <th className="p-3 font-bold">कक्षा</th>
                <th className="p-3 font-bold text-right">नामांकन</th>
                <th className="p-3 font-bold text-right text-emerald-600">उपस्थित</th>
                <th className="p-3 font-bold text-right text-red-600">अनुपस्थित</th>
                <th className="p-3 font-bold text-right">प्रतिशत</th>
                <th className="p-3 font-bold">दर्जकर्ता व समय</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredAttendance.map((rec, idx) => {
                const sObj = schools.find((s) => s.udise === rec.schoolUdise);
                return (
                  <tr key={rec.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                    <td className="p-3 text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-gray-900 dark:text-white">
                      <div>{sObj?.name || sObj?.hindiName || rec.schoolUdise}</div>
                      <div className="text-[10px] font-mono text-gray-400">{rec.schoolUdise}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          rec.type === 'STUDENT'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {rec.type === 'STUDENT' ? 'विद्यार्थी' : 'स्टाफ'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{rec.class ? `कक्षा ${rec.class}` : 'समस्त स्टाफ'}</td>
                    <td className="p-3 text-right font-bold">{rec.totalCount}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {rec.presentCount}
                    </td>
                    <td className="p-3 text-right font-bold text-red-600">
                      {rec.absentCount}
                    </td>
                    <td className="p-3 text-right font-black text-gray-900 dark:text-white">
                      {rec.percentage}%
                    </td>
                    <td className="p-3 text-gray-500">
                      <div>👤 {rec.recordedBy}</div>
                      <div className="text-[10px] text-gray-400">⏰ {rec.markedAt || '10:30 AM'}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              दैनिक उपस्थिति दर्ज करें
            </h3>

            <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  विद्यालय का चयन *
                </label>
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
                  उपस्थिति सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
