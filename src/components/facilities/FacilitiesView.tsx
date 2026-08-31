import React, { useState, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Edit2,
  Download,
  Printer,
  ShieldCheck,
  Search,
  Filter,
  School as SchoolIcon
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { PhysicalFacility, FacilityStatus } from '../../types';
import { facilityMasterList } from '../../data/seedData';
import { exportToExcel, exportToCSV, triggerSystemPrint } from '../../utils/exportUtils';

export const FacilitiesView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    scopedFacilities,
    schools,
    selectedSchool,
    updateFacility
  } = useData();

  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState<string>(
    selectedSchool?.udise || schools[0]?.udise || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Edit Modal State
  const [editingFacility, setEditingFacility] = useState<PhysicalFacility | null>(null);
  const [modalStatus, setModalStatus] = useState<FacilityStatus>('YES');
  const [modalRemarks, setModalRemarks] = useState('');

  const canEdit = currentUser?.role === 'CAC' || currentUser?.role === 'PRINCIPAL' || currentUser?.role === 'ADMIN';

  const activeSchool = schools.find((s) => s.udise === selectedSchoolUdise);
  const activeSchoolFacilities = scopedFacilities.filter((f) => f.schoolUdise === selectedSchoolUdise);

  // Filtered facility list
  const filteredFacilities = useMemo(() => {
    return activeSchoolFacilities.filter((f) => {
      const matchSearch = f.facilityName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || f.available === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [activeSchoolFacilities, searchTerm, statusFilter]);

  // Completeness stats for selected school
  const facilityStats = useMemo(() => {
    const total = activeSchoolFacilities.length;
    const yesCount = activeSchoolFacilities.filter((f) => f.available === 'YES').length;
    const noCount = activeSchoolFacilities.filter((f) => f.available === 'NO').length;
    const unknownCount = activeSchoolFacilities.filter((f) => f.available === 'UNKNOWN').length;
    const completenessPct = total > 0 ? Math.round(((yesCount + noCount) / total) * 100) : 0;
    return { total, yesCount, noCount, unknownCount, completenessPct };
  }, [activeSchoolFacilities]);

  const handleOpenEdit = (fac: PhysicalFacility) => {
    setEditingFacility(fac);
    setModalStatus(fac.available);
    setModalRemarks(fac.remarks || '');
  };

  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility) return;

    updateFacility({
      ...editingFacility,
      available: modalStatus,
      remarks: modalRemarks,
      lastInspectionDate: new Date().toISOString().split('T')[0],
    });

    setEditingFacility(null);
  };

  const handleExport = (type: 'EXCEL' | 'CSV') => {
    const headers = [
      'क्रमांक',
      'भौतिक सुविधा का नाम',
      'उपलब्धता स्थिति',
      'टिप्पणी / विवरण',
      'अंतिम निरीक्षण दिनांक'
    ];

    const rows = activeSchoolFacilities.map((f, idx) => [
      idx + 1,
      f.facilityName,
      f.available === 'YES' ? 'उपलब्ध (YES)' : f.available === 'NO' ? 'अनुपलब्ध (NO)' : 'Data Not Entered (अपूर्ण)',
      f.remarks || '-',
      f.lastInspectionDate || '-'
    ]);

    const payload = {
      title: `जन शिक्षा केंद्र मलगुवां - भौतिक अधोसंरचना चेकलिस्ट`,
      subtitle: `विद्यालय: ${activeSchool?.hindiName} (यूडाइस: ${selectedSchoolUdise})`,
      schoolName: activeSchool?.hindiName,
      udise: selectedSchoolUdise,
      headers,
      rows,
      fileName: `Facilities_${selectedSchoolUdise}`,
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
              भौतिक सुविधाएं एवं अधोसंरचना (Physical Facilities & Infrastructure)
            </h2>
            <span className="bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              16 सूत्रीय मानक चेकलिस्ट
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            पेयजल, बालक/बालिका शौचालय, विद्युत, बाउंड्रीवाल, खेल मैदान, रैम्प, स्मार्ट क्लास आदि का वास्तविक सत्यापन
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
            <span>प्रिंट चेकलिस्ट</span>
          </button>
        </div>
      </div>

      {/* School Selector & Stats Summary */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">विद्यालय चुनें:</span>
          <select
            value={selectedSchoolUdise}
            onChange={(e) => setSelectedSchoolUdise(e.target.value)}
            className="w-full md:w-96 px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-bold"
          >
            {schools.map((s) => (
              <option key={s.udise} value={s.udise}>
                {s.name || s.hindiName} ({s.udise})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>उपलब्ध: {facilityStats.yesCount}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 font-bold">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>अनुपलब्ध: {facilityStats.noCount}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 font-bold">
            <HelpCircle className="w-4 h-4 text-[#FF7A00]" />
            <span>डेटा अप्राप्त: {facilityStats.unknownCount}</span>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg font-bold text-gray-700 dark:text-gray-300">
            सत्यापन: {facilityStats.completenessPct}%
          </div>
        </div>
      </div>

      {/* 16 Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFacilities.map((fac) => {
          const isYes = fac.available === 'YES';
          const isNo = fac.available === 'NO';
          const isUnknown = fac.available === 'UNKNOWN';

          return (
            <div
              key={fac.facilityKey}
              className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    {fac.facilityName}
                  </h4>
                </div>

                <p className="text-gray-500 dark:text-gray-400">
                  {fac.remarks || 'कोई अतिरिक्त टिप्पणी नहीं दर्ज की गई है।'}
                </p>

                <div className="text-[11px] text-gray-400 pt-1">
                  निरीक्षण दिनांक: {fac.lastInspectionDate || '2026-02-15'}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {isYes && (
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> उपलब्ध
                  </span>
                )}
                {isNo && (
                  <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> अनुपलब्ध
                  </span>
                )}
                {isUnknown && (
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Data Not Entered
                  </span>
                )}

                {canEdit && (
                  <button
                    onClick={() => handleOpenEdit(fac)}
                    className="text-[#0B6B4B] dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>अपडेट करें</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Facility Modal */}
      {editingFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              भौतिक सुविधा स्थिति अद्यतन
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {editingFacility.facilityName} - {activeSchool?.hindiName}
            </p>

            <form onSubmit={handleSaveFacility} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-2">
                  उपलब्धता स्थिति (Availability Status) *
                </label>
                <div className="space-y-2">
                  {[
                    { val: 'YES' as FacilityStatus, label: 'उपलब्ध (YES - क्रियाशील व सुरक्षित)', color: 'text-emerald-700' },
                    { val: 'NO' as FacilityStatus, label: 'अनुपलब्ध (NO - शाला में उपलब्ध नहीं है)', color: 'text-red-700' },
                    { val: 'UNKNOWN' as FacilityStatus, label: 'Data Not Entered (सत्यापन प्रतीक्षित)', color: 'text-amber-700' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                        modalStatus === opt.val
                          ? 'border-[#0B6B4B] bg-emerald-50 dark:bg-emerald-950 font-bold'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1713]'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={modalStatus === opt.val}
                        onChange={() => setModalStatus(opt.val)}
                        className="text-[#0B6B4B]"
                      />
                      <span className={opt.color}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  विस्तृत टिप्पणी / भौतिक विवरण (Remarks)
                </label>
                <textarea
                  rows={3}
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  placeholder="उदा. नल-जल चालू है, पेयजल आपूर्ति नियमित है..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingFacility(null)}
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
    </div>
  );
};
