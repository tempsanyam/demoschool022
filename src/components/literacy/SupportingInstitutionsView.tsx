import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Save,
  Download,
  Users,
  Award,
  Phone,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { SupportingInstitution } from '../../types/literacy';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { LiteracyFormPrintModal } from './LiteracyFormPrintModal';

export const SupportingInstitutionsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();
  const {
    schools,
    selectedSchoolUdise,
    setSelectedSchoolUdise,
    selectedSchool,
    currentSchoolUdise,
    scopedSupportingInstitutions,
    addSupportingInstitution,
    updateSupportingInstitution,
    deleteSupportingInstitution,
  } = useData();

  const isSchoolUser = currentUser?.role === 'SCHOOL';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Partial<SupportingInstitution> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open modal
  const handleOpenModal = (inst?: SupportingInstitution) => {
    if (inst) {
      setEditingInst({ ...inst });
    } else {
      const targetUdise = isSchoolUser ? currentSchoolUdise : (selectedSchoolUdise || schools[0]?.udise || '');
      const schoolObj = schools.find((s) => s.udise === targetUdise);

      setEditingInst({
        schoolUdise: targetUdise,
        schoolName: schoolObj?.name || 'शासकीय प्राथमिक शाला',
        institutionType: 'नेहरू युवा केंद्र (NYK)',
        institutionName: '',
        totalMembersCount: 25,
        aksharSathiCount: 5,
        teachingCentersCount: 3,
        totalLearnersCount: 30,
        examAppearedLearnersCount: 26,
        passedLearnersCount: 22,
        nodalPersonName: '',
        nodalDesignation: 'समन्वयक',
        contactNumber: '',
      });
    }
    setIsModalOpen(true);
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst || !editingInst.institutionName) return;

    const targetUdise = isSchoolUser ? currentSchoolUdise : (editingInst.schoolUdise || schools[0]?.udise || '');
    const schoolObj = schools.find((s) => s.udise === targetUdise);

    if (editingInst.id) {
      updateSupportingInstitution(editingInst as SupportingInstitution);
      showToast('सहयोगी संस्था का विवरण अद्यतन किया गया।');
    } else {
      addSupportingInstitution({
        schoolUdise: targetUdise,
        schoolName: schoolObj?.name || editingInst.schoolName || '',
        institutionType: editingInst.institutionType || 'अन्य',
        institutionName: editingInst.institutionName.trim(),
        totalMembersCount: Number(editingInst.totalMembersCount) || 0,
        aksharSathiCount: Number(editingInst.aksharSathiCount) || 0,
        teachingCentersCount: Number(editingInst.teachingCentersCount) || 0,
        totalLearnersCount: Number(editingInst.totalLearnersCount) || 0,
        examAppearedLearnersCount: Number(editingInst.examAppearedLearnersCount) || 0,
        passedLearnersCount: Number(editingInst.passedLearnersCount) || 0,
        nodalPersonName: editingInst.nodalPersonName?.trim() || '',
        nodalDesignation: editingInst.nodalDesignation?.trim() || '',
        contactNumber: editingInst.contactNumber?.trim() || '',
        remarks: editingInst.remarks || '',
      });
      showToast('नई सहयोगी संस्था सफलतापूर्वक पंजीकृत की गई।');
    }

    setIsModalOpen(false);
  };

  // Delete
  const handleDelete = (id: string) => {
    deleteSupportingInstitution(id);
    setDeleteConfirmId(null);
    showToast('सहयोगी संस्था का रिकॉर्ड हटा दिया गया।');
  };

  // Filtered
  const filteredInstitutions = scopedSupportingInstitutions.filter((inst) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      inst.institutionName.toLowerCase().includes(term) ||
      inst.institutionType.toLowerCase().includes(term) ||
      inst.nodalPersonName.toLowerCase().includes(term) ||
      inst.contactNumber.includes(term) ||
      inst.schoolName.toLowerCase().includes(term);

    const matchType = filterType === 'ALL' || inst.institutionType === filterType;

    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white dark:bg-[#16221D] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>प्रपत्र क्रमांक - 05 : सहयोगी विभाग / संस्था का विवरण (Partner Organizations)</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mt-1">
            सहयोगी विभाग एवं संस्थाएँ
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            नेहरू युवा केंद्र, जन अभियान परिषद, उच्च शिक्षा विभाग, एनसीसी/एनएसएस एवं स्वयंसेवी संस्थाओं का सहभागिता अभिलेख।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* School Selector (for CAC/Admin only) */}
          {!isSchoolUser && (
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedSchoolUdise}
                onChange={(e) => setSelectedSchoolUdise(e.target.value)}
                aria-label="विद्यालय का चयन करें"
                className="bg-transparent text-xs font-medium text-gray-900 dark:text-white border-0 focus:ring-0 focus:outline-hidden"
              >
                <option value="">समस्त विद्यालय ({schools.length})</option>
                {schools.map((s) => (
                  <option key={s.udise} value={s.udise}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isFeatureEnabled('module.literacy-partners.action.print_export') && (
            <UnifiedPrintButton
              id="supporting-inst-unified-print"
              onPrintCurrentView={() => window.print()}
              onPrintReport={() => setIsPrintModalOpen(true)}
              onPrintLiteracyForm={() => setIsPrintModalOpen(true)}
              currentViewLabel="Current View"
              currentViewSubtext="सहयोगी संस्था सूची का त्वरित स्क्रीन प्रिंट"
              reportLabel="Report"
              reportSubtext="सहयोगी विभाग व संस्था समेकित रिपोर्ट"
              literacyFormLabel="Literacy Form (प्रपत्र - 05)"
              literacyFormSubtext="आधिकारिक प्रपत्र 05 सहयोगी संस्था A4 प्रारूप"
              buttonLabel="Print"
            />
          )}

          {isFeatureEnabled('module.literacy-partners.action.add') && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>नई संस्था जोड़ें</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="संस्था का नाम, प्रकार, नोडल व्यक्ति या मोबाइल से खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="w-full sm:w-72">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="संस्था प्रकार फ़िल्टर"
            className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">समस्त संस्था प्रकार (All Types)</option>
            <option value="नेहरू युवा केंद्र (NYK)">नेहरू युवा केंद्र (NYK)</option>
            <option value="मध्य प्रदेश जन अभियान परिषद (MAPCAC)">जन अभियान परिषद (MAPCAC)</option>
            <option value="महाविद्यालय / NSS / NCC">महाविद्यालय / NSS / NCC</option>
            <option value="विद्यालय छात्र / शिक्षक">विद्यालय छात्र / शिक्षक</option>
            <option value="स्वयंसेवी संस्था (NGO)">स्वयंसेवी संस्था (NGO)</option>
            <option value="अन्य">अन्य</option>
          </select>
        </div>

        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
          पंजीकृत संस्थाएं: <strong className="text-gray-900 dark:text-white">{filteredInstitutions.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E2825] text-teal-100 font-bold border-b border-[#1A453F] uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-3">क्र.</th>
                <th className="py-3 px-3">संस्था / विभाग का नाम</th>
                <th className="py-3 px-3">संस्था प्रकार</th>
                <th className="py-3 px-3">संबद्ध शाला</th>
                <th className="py-3 px-3 text-center">कुल सदस्य</th>
                <th className="py-3 px-3 text-center">अक्षर साथी</th>
                <th className="py-3 px-3 text-center">केंद्र संख्या</th>
                <th className="py-3 px-3 text-center">शिक्षार्थी संख्या</th>
                <th className="py-3 px-3 text-center">उत्तीर्ण साक्षर</th>
                <th className="py-3 px-3">नोडल प्रभारी व संपर्क</th>
                <th className="py-3 px-3 text-center">कार्यवाही</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-normal">
              {filteredInstitutions.map((inst, index) => (
                <tr key={inst.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-gray-500 dark:text-gray-400">{index + 1}</td>
                  <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                    {inst.institutionName}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                      {inst.institutionType}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-700 dark:text-gray-300 truncate max-w-[140px]" title={inst.schoolName}>
                    {inst.schoolName}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-gray-800 dark:text-gray-200">
                    {inst.totalMembersCount}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-purple-600 dark:text-purple-400">
                    {inst.aksharSathiCount}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                    {inst.teachingCentersCount}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                    {inst.totalLearnersCount}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {inst.passedLearnersCount}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-gray-900 dark:text-white">{inst.nodalPersonName}</div>
                    <div className="text-[10.5px] font-mono text-gray-500">{inst.contactNumber}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isFeatureEnabled('module.literacy-partners.action.edit') && (
                        <button
                          onClick={() => handleOpenModal(inst)}
                          className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-gray-700 dark:text-gray-300 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer"
                          title="संपादित करें"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isFeatureEnabled('module.literacy-partners.action.delete') && (
                        <button
                          onClick={() => setDeleteConfirmId(inst.id)}
                          className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-gray-700 dark:text-gray-300 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                          title="हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInstitutions.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    कोई सहयोगी विभाग / संस्था रिकॉर्ड नहीं मिला।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit Institution */}
      {isModalOpen && editingInst && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#16221D] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  सहयोगी विभाग / संस्था विवरण (प्रपत्र-05)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {/* School and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    संबद्ध विद्यालय
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingInst.schoolName || ''}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    संस्था का प्रकार <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingInst.institutionType || 'नेहरू युवा केंद्र (NYK)'}
                    onChange={(e) => setEditingInst({ ...editingInst, institutionType: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  >
                    <option value="नेहरू युवा केंद्र (NYK)">नेहरू युवा केंद्र (NYK)</option>
                    <option value="मध्य प्रदेश जन अभियान परिषद (MAPCAC)">जन अभियान परिषद (MAPCAC)</option>
                    <option value="महाविद्यालय / NSS / NCC">महाविद्यालय / NSS / NCC</option>
                    <option value="विद्यालय छात्र / शिक्षक">विद्यालय छात्र / शिक्षक</option>
                    <option value="स्वयंसेवी संस्था (NGO)">स्वयंसेवी संस्था (NGO)</option>
                    <option value="अन्य">अन्य</option>
                  </select>
                </div>
              </div>

              {/* Institution Name */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  संस्था / विभाग का नाम <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingInst.institutionName || ''}
                  onChange={(e) => setEditingInst({ ...editingInst, institutionName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  placeholder="जैसे: नेहरू युवा मंडल मलगुवां"
                />
              </div>

              {/* Members and Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    कुल सदस्य संख्या
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingInst.totalMembersCount || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, totalMembersCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-purple-700 dark:text-purple-300 mb-1">
                    अक्षर साथी बने
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingInst.aksharSathiCount || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, aksharSathiCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    अध्यापन केंद्र
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingInst.teachingCentersCount || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, teachingCentersCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    शिक्षार्थी संख्या
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingInst.totalLearnersCount || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, totalLearnersCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Exam Participated & Passed */}
              <div className="grid grid-cols-2 gap-3 bg-teal-50 dark:bg-teal-950/20 p-3 rounded-xl border border-teal-200 dark:border-teal-800/40">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1">
                    परीक्षा में सम्मिलित शिक्षार्थी
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingInst.examAppearedLearnersCount || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, examAppearedLearnersCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                    उत्तीर्ण शिक्षार्थी संख्या
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingInst.passedLearnersCount || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, passedLearnersCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Nodal Person Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    नोडल प्रभारी का नाम
                  </label>
                  <input
                    type="text"
                    value={editingInst.nodalPersonName || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, nodalPersonName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="प्रभारी का नाम"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    पदनाम
                  </label>
                  <input
                    type="text"
                    value={editingInst.nodalDesignation || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, nodalDesignation: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="जैसे: समन्वयक / अध्यक्ष"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    संपर्क मोबाइल नंबर
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editingInst.contactNumber || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, contactNumber: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>सुरक्षित करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16221D] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                सहयोगी संस्था हटाने की पुष्टि करें
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                क्या आप इस संस्था का रिकॉर्ड हटाना चाहते हैं?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                हटाएं
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official ULLAS Form 05 Print Modal */}
      <LiteracyFormPrintModal
        isOpen={isPrintModalOpen}
        initialForm="FORM_5"
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
