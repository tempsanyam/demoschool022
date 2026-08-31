import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  Award,
  Users,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { MDMRecord } from '../../types';
import { exportToExcel, exportToCSV, triggerSystemPrint } from '../../utils/exportUtils';

export const MDMView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    scopedMDM,
    schools,
    selectedSchool,
    saveMDMRecord
  } = useData();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState<string>(selectedSchool?.udise || '');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MDMRecord>>({
    date: today,
    schoolUdise: selectedSchool?.udise || schools[0]?.udise || '',
    menuItem: 'रोटी, दाल, मौसमी हरी सब्जी व सलाद',
    eligibleStudents: 65,
    mealsServed: 58,
    foodQuality: 'उत्कृष्ट (Good)',
    inspectedBy: currentUser?.name || 'संस्था प्रधान',
    remarks: 'भोजन मीनू अनुसार ताजा व स्वच्छ पकाया गया।',
  });

  const canEdit = currentUser?.role === 'CAC' || currentUser?.role === 'PRINCIPAL' || currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN';

  // Filtered MDM
  const filteredMDM = useMemo(() => {
    return scopedMDM.filter((m) => {
      const matchDate = !selectedDate || m.date === selectedDate;
      const matchSchool = !selectedSchoolUdise || m.schoolUdise === selectedSchoolUdise;
      return matchDate && matchSchool;
    });
  }, [scopedMDM, selectedDate, selectedSchoolUdise]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolUdise || !formData.date) {
      alert('कृपया शाला एवं दिनांक का चयन करें।');
      return;
    }

    saveMDMRecord({
      date: formData.date || today,
      schoolUdise: formData.schoolUdise,
      eligibleStudents: Number(formData.eligibleStudents || 50),
      mealsServed: Number(formData.mealsServed || 45),
      menuItem: formData.menuItem || 'दाल-चावल व सब्जी',
      foodQuality: formData.foodQuality || 'संतोषजनक',
      inspectedBy: formData.inspectedBy || currentUser?.name || 'संस्था प्रधान',
      remarks: formData.remarks || 'मीनू अनुसार तैयार',
    });

    setIsModalOpen(false);
  };

  const handleExport = (type: 'EXCEL' | 'CSV') => {
    const headers = [
      'क्रमांक',
      'दिनांक',
      'यूडाइस कोड',
      'दैनिक मीनू',
      'पात्र छात्र',
      'लाभान्वित (परोसा गया)',
      'गुणवत्ता स्तर',
      'निरीक्षक अधिकारी',
      'टिप्पणी'
    ];

    const rows = filteredMDM.map((m, idx) => [
      idx + 1,
      m.date,
      m.schoolUdise,
      m.menuItem,
      m.eligibleStudents,
      m.mealsServed,
      m.foodQuality,
      m.inspectedBy,
      m.remarks || '-'
    ]);

    const payload = {
      title: 'जन शिक्षा केंद्र मलगुवां - मध्याह्न भोजन (MDM) वितरण रजिस्टर',
      subtitle: `सत्र 2026-27 | दिनांक: ${selectedDate}`,
      headers,
      rows,
      fileName: `Malguwa_MDM_${selectedDate}`,
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
              मध्याह्न भोजन कार्यक्रम (PM POSHAN / MDM Monitoring)
            </h2>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              सत्र 2026-27
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            संकुल अंतर्गत दैनिक पौष्टिक आहार वितरण, मीनू अनुपालन एवं भोजन गुणवत्ता का प्रत्यक्ष अनुश्रवण
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
            <span>प्रिंट रजिस्टर</span>
          </button>
          {canEdit && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>MDM प्रविष्टि दर्ज करें</span>
            </button>
          )}
        </div>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700 dark:text-gray-300">दिनांक:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700 dark:text-gray-300">शाला फिल्टर:</span>
          <select
            value={selectedSchoolUdise}
            onChange={(e) => setSelectedSchoolUdise(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">सभी विद्यालय (क्लस्टर)</option>
            {schools.map((s) => (
              <option key={s.udise} value={s.udise}>
                {s.name || s.hindiName} ({s.udise.slice(-4)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MDM Log Table */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-bold">क्र.</th>
                <th className="p-3 font-bold">विद्यालय (यूडाइस)</th>
                <th className="p-3 font-bold">दिनांक</th>
                <th className="p-3 font-bold">दैनिक मीनू (Menu)</th>
                <th className="p-3 font-bold text-right">पात्र छात्र</th>
                <th className="p-3 font-bold text-right text-emerald-600">लाभान्वित छात्र</th>
                <th className="p-3 font-bold">गुणवत्ता स्तर</th>
                <th className="p-3 font-bold">निरीक्षण व टिप्पणी</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredMDM.map((m, idx) => {
                const sObj = schools.find((s) => s.udise === m.schoolUdise);
                return (
                  <tr key={m.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                    <td className="p-3 text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-gray-900 dark:text-white">
                      <div>{sObj?.name || sObj?.hindiName || m.schoolUdise}</div>
                      <div className="text-[10px] font-mono text-gray-400">{m.schoolUdise}</div>
                    </td>
                    <td className="p-3 font-medium">{m.date}</td>
                    <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">{m.menuItem}</td>
                    <td className="p-3 text-right font-bold">{m.eligibleStudents}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {m.mealsServed}
                    </td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
                        {m.foodQuality}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">
                      <div>👤 {m.inspectedBy}</div>
                      <div className="text-[11px] text-gray-400">{m.remarks}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add MDM Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              दैनिक मध्याह्न भोजन (MDM) प्रविष्टि
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  विद्यालय का चयन *
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    दिनांक *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    गुणवत्ता स्तर
                  </label>
                  <select
                    value={formData.foodQuality}
                    onChange={(e) => setFormData({ ...formData, foodQuality: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="उत्कृष्ट (Good)">उत्कृष्ट (Good)</option>
                    <option value="संतोषजनक (Satisfactory)">संतोषजनक (Satisfactory)</option>
                    <option value="सुधार आवश्यक (Needs Improvement)">सुधार आवश्यक</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  दैनिक भोजन मीनू *
                </label>
                <input
                  type="text"
                  value={formData.menuItem}
                  onChange={(e) => setFormData({ ...formData, menuItem: e.target.value })}
                  placeholder="उदा. दाल-चावल, मौसमी हरी सब्जी व सलाद"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    कुल पात्र छात्र संख्या *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.eligibleStudents}
                    onChange={(e) => setFormData({ ...formData, eligibleStudents: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    लाभान्वित छात्र (भोजन परोसा गया) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.mealsServed}
                    onChange={(e) => setFormData({ ...formData, mealsServed: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  निरीक्षक अधिकारी का नाम
                </label>
                <input
                  type="text"
                  value={formData.inspectedBy}
                  onChange={(e) => setFormData({ ...formData, inspectedBy: e.target.value })}
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
                  प्रविष्टि सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
