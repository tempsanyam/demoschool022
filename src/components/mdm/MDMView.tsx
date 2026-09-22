import React, { useState, useMemo } from 'react';
import {
  Utensils,
  UtensilsCrossed,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  Award,
  Users,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import { MDMRecord } from '../../types';
import { exportToExcel } from '../../utils/exportUtils';
import { triggerPrint } from '../../utils/printUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { SmartExportModal } from '../export/SmartExportModal';
import { RasoiyaView } from './RasoiyaView';
import { SHGView } from './SHGView';

export const MDMView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'rasoiya' | 'shg'>('daily');
  const { currentUser } = useAuth();
  const {
    mdmRecords: scopedMDM,
    schools,
    currentSchool,
    currentSchoolUdise,
    isSchoolUser: isSchoolRestricted,
    saveMDMRecord,
    deleteMDMRecord,
    fetchMDM
  } = useSchoolScope();
  const { selectedSessionId, isCurrentSessionSelected } = useData();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState<string>(
    isSchoolRestricted ? (currentSchoolUdise || schools[0]?.udise || '') : 'ALL'
  );

  // Auto-align date to session on switch
  React.useEffect(() => {
    if (isCurrentSessionSelected) {
      setSelectedDate(today);
    } else {
      const dates = scopedMDM.map((m) => m.date).sort().reverse();
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      } else {
        setSelectedDate('');
      }
    }
  }, [selectedSessionId, scopedMDM, today]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMdm, setEditingMdm] = useState<MDMRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isSmartExportOpen, setIsSmartExportOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MDMRecord>>({
    date: today,
    schoolUdise: currentSchoolUdise || (schools[0]?.udise || ''),
    menuItem: 'रोटी, दाल, मौसमी हरी सब्जी व सलाद',
    eligibleStudents: 65,
    mealsServed: 58,
    foodQuality: 'उत्कृष्ट (Good)',
    inspectedBy: currentUser?.name || 'संस्था प्रधान',
    remarks: 'भोजन मीनू अनुसार ताजा व स्वच्छ पकाया गया।',
  });

  const canEdit = currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SCHOOL';

  // Filtered MDM
  React.useEffect(() => {
    if (isModalOpen) {
      setIsModalOpen(false);
      setEditingMdm(null);
    }
  }, [selectedSessionId]);

  const filteredMDM = useMemo(() => {
    return scopedMDM.filter((m) => {
      const matchDate = !selectedDate || m.date === selectedDate;
      const matchSchool = isSchoolRestricted || !selectedSchoolUdise || m.schoolUdise === selectedSchoolUdise;
      return matchDate && matchSchool;
    });
  }, [scopedMDM, selectedDate, selectedSchoolUdise, isSchoolRestricted]);

  const handleOpenAdd = () => {
    setEditingMdm(null);
    setFormData({
      date: today,
      schoolUdise: currentSchoolUdise || (schools[0]?.udise || ''),
      menuItem: 'रोटी, दाल, मौसमी हरी सब्जी व सलाद',
      eligibleStudents: 65,
      mealsServed: 58,
      foodQuality: 'उत्कृष्ट (Good)',
      inspectedBy: currentUser?.name || 'संस्था प्रधान',
      remarks: 'भोजन मीनू अनुसार ताजा व स्वच्छ पकाया गया।',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: MDMRecord) => {
    setEditingMdm(m);
    setFormData(m);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolUdise || !formData.date) {
      alert('कृपया शाला एवं दिनांक का चयन करें।');
      return;
    }

    saveMDMRecord({
      ...(editingMdm?.id ? { id: editingMdm.id } : {}),
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
    setEditingMdm(null);
  };

  const getMdmExportPayload = () => {
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

    return {
      title: 'जन शिक्षा केंद्र मलगुवां - मध्याह्न भोजन (MDM) वितरण रजिस्टर',
      subtitle: `सत्र ${selectedSessionId} | दिनांक: ${selectedDate}`,
      schoolName: currentSchool?.name || currentSchool?.hindiName,
      udise: isSchoolRestricted ? currentSchoolUdise : (selectedSchoolUdise === 'ALL' ? undefined : selectedSchoolUdise),
      session: selectedSessionId,
      headers,
      rows,
      fileName: `MDM_${selectedSessionId}_${selectedDate}`,
    };
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Sub Module Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'daily'
              ? 'bg-[#0B6B4B] text-white shadow-xs'
              : 'bg-white dark:bg-[#17211C] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>दैनिक भोजन पंजी (Daily MDM)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rasoiya')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'rasoiya'
              ? 'bg-[#0B6B4B] text-white shadow-xs'
              : 'bg-white dark:bg-[#17211C] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>रसोइया प्रबंधन (Rasoiya Management)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shg')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'shg'
              ? 'bg-[#0B6B4B] text-white shadow-xs'
              : 'bg-white dark:bg-[#17211C] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>स्व-सहायता समूह (SHG / Samuh)</span>
        </button>
      </div>

      {activeTab === 'rasoiya' ? (
        <RasoiyaView />
      ) : activeTab === 'shg' ? (
        <SHGView />
      ) : (
        <>
          {/* Top Banner */}
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  मध्याह्न भोजन कार्यक्रम (PM POSHAN / MDM Monitoring)
                </h2>
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  सत्र {selectedSessionId}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                संकुल अंतर्गत दैनिक पौष्टिक आहार वितरण, मीनू अनुपालन एवं भोजन गुणवत्ता का प्रत्यक्ष अनुश्रवण
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <UnifiedPrintButton
                id="mdm-unified-print"
                currentSession={selectedSessionId}
                currentSchoolName={currentSchool?.name || currentSchool?.hindiName}
                currentUdise={isSchoolRestricted ? currentSchoolUdise : (selectedSchoolUdise === 'ALL' ? undefined : selectedSchoolUdise)}
                onPrintCurrentView={() => triggerPrint()}
                onPrintReport={() => setIsSmartExportOpen(true)}
                currentViewLabel="Print Current View"
                currentViewSubtext="वर्तमान मध्याह्न भोजन दैनिक रजिस्टर व तालिका का त्वरित प्रिंट"
                reportLabel="Print Report"
                reportSubtext="मध्याह्न भोजन मासिक पंजी / आधिकारिक A4 स्मार्ट रिपोर्ट प्रारूप"
                exportPayload={getMdmExportPayload}
              />
              {canEdit && (
                <button
                  onClick={handleOpenAdd}
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

        {!isSchoolRestricted && (
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
        )}
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
                {canEdit && <th className="p-3 font-bold text-center no-print">कार्यवाही</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredMDM.length > 0 ? (
                filteredMDM.map((m, idx) => {
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
                      {canEdit && (
                        <td className="p-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(m)}
                              title="संपादित करें"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(m.id)}
                              title="हटाएं"
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="p-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UtensilsCrossed className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                      <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
                        इस शैक्षणिक सत्र में अभी कोई डेटा उपलब्ध नहीं है।
                      </p>
                      <p className="text-xs text-gray-400">
                        {scopedMDM.length === 0
                          ? `सत्र ${selectedSessionId} के लिए कोई मध्याह्न भोजन (MDM) रिकॉर्ड उपलब्ध नहीं है।`
                          : 'चयनित दिनांक अथवा शाला फ़िल्टर के लिए कोई रिकॉर्ड नहीं मिला।'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit MDM Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              {editingMdm ? 'मध्याह्न भोजन (MDM) प्रविष्टि संपादित करें' : 'दैनिक मध्याह्न भोजन (MDM) प्रविष्टि'}
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
      {/* Smart Export Modal for MDM */}
      <SmartExportModal
        isOpen={isSmartExportOpen}
        onClose={() => setIsSmartExportOpen(false)}
        initialType="MDM"
        initialUdise={selectedSchoolUdise === 'ALL' ? undefined : selectedSchoolUdise}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="MDM प्रविष्टि हटाएं"
        message="क्या आप इस मध्याह्न भोजन (MDM) वितरण रिकॉर्ड को हटाना चाहते हैं? यह कार्यवाही स्थायी होगी।"
        confirmText="हटाएं"
        cancelText="रद्द करें"
        isDestructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteMDMRecord(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
        </>
      )}
    </div>
  );
};
