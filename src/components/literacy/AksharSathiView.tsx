import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Save,
  Download,
  GraduationCap,
  MapPin,
  Phone,
  Award,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { AksharSathi } from '../../types/literacy';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { LiteracyFormPrintModal } from './LiteracyFormPrintModal';

export const AksharSathiView: React.FC = () => {
  const { currentUser } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();
  const {
    schools,
    selectedSchoolUdise,
    setSelectedSchoolUdise,
    selectedSchool,
    currentSchoolUdise,
    scopedAksharSathis,
    scopedIlliteratePersons,
    addAksharSathi,
    updateAksharSathi,
    deleteAksharSathi,
  } = useData();

  const isSchoolUser = currentUser?.role === 'SCHOOL';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQualification, setFilterQualification] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Partial<AksharSathi> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open modal
  const handleOpenModal = (volunteer?: AksharSathi) => {
    if (volunteer) {
      setEditingVolunteer({ ...volunteer });
    } else {
      const targetUdise = isSchoolUser ? currentSchoolUdise : (selectedSchoolUdise || schools[0]?.udise || '');
      const schoolObj = schools.find((s) => s.udise === targetUdise);

      setEditingVolunteer({
        schoolUdise: targetUdise,
        schoolName: schoolObj?.name || 'शासकीय प्राथमिक शाला',
        name: '',
        fatherOrHusbandName: '',
        mobileNumber: '',
        dob: '1998-05-15',
        age: 26,
        educationalQualification: '12वीं',
        institutionName: 'शासकीय उच्चतर माध्यमिक विद्यालय मलगुवां',
        teachingPlace: 'विद्यालय भवन',
        mappedLearnerCount: 10,
        examParticipatedLearnerCount: 8,
        passedLearnerCount: 7,
      });
    }
    setIsModalOpen(true);
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVolunteer || !editingVolunteer.name || !editingVolunteer.mobileNumber) return;

    const targetUdise = isSchoolUser ? currentSchoolUdise : (editingVolunteer.schoolUdise || schools[0]?.udise || '');
    const schoolObj = schools.find((s) => s.udise === targetUdise);

    if (editingVolunteer.id) {
      updateAksharSathi(editingVolunteer as AksharSathi);
      showToast('अक्षर साथी का विवरण सफलतापूर्वक अद्यतन किया गया।');
    } else {
      addAksharSathi({
        schoolUdise: targetUdise,
        schoolName: schoolObj?.name || editingVolunteer.schoolName || '',
        name: editingVolunteer.name.trim(),
        fatherOrHusbandName: editingVolunteer.fatherOrHusbandName?.trim() || '',
        mobileNumber: editingVolunteer.mobileNumber.trim(),
        dob: editingVolunteer.dob || '1998-05-15',
        age: Number(editingVolunteer.age) || 26,
        educationalQualification: editingVolunteer.educationalQualification || '12वीं',
        institutionName: editingVolunteer.institutionName?.trim() || 'शासकीय संस्था',
        teachingPlace: editingVolunteer.teachingPlace?.trim() || 'विद्यालय भवन',
        mappedLearnerCount: Number(editingVolunteer.mappedLearnerCount) || 0,
        examParticipatedLearnerCount: Number(editingVolunteer.examParticipatedLearnerCount) || 0,
        passedLearnerCount: Number(editingVolunteer.passedLearnerCount) || 0,
        remarks: editingVolunteer.remarks || '',
      });
      showToast('नया अक्षर साथी सफलतापूर्वक पंजीकृत किया गया।');
    }

    setIsModalOpen(false);
  };

  // Delete handler
  const handleDelete = (id: string) => {
    deleteAksharSathi(id);
    setDeleteConfirmId(null);
    showToast('अक्षर साथी रिकॉर्ड सफलतापूर्वक हटा दिया गया।');
  };

  // Filtered Volunteers
  const filteredVolunteers = scopedAksharSathis.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      v.name.toLowerCase().includes(term) ||
      v.mobileNumber.includes(term) ||
      v.institutionName.toLowerCase().includes(term) ||
      v.schoolName.toLowerCase().includes(term);

    const matchQual = filterQualification === 'ALL' || v.educationalQualification.includes(filterQualification);

    return matchSearch && matchQual;
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
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
            <UserPlus className="w-4 h-4" />
            <span>प्रपत्र क्रमांक - 02 : अक्षर साथी का विवरण (Volunteer Management)</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mt-1">
            अक्षर साथी स्वयंसेवक पंजी
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            असाक्षर व्यक्तियों को साक्षर बनाने हेतु समर्पित स्वयंसेवक, छात्र, एनवाईके एवं जन अभियान परिषद के अक्षर साथी।
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

          {isFeatureEnabled('module.literacy-volunteers.action.print_export') && (
            <UnifiedPrintButton
              id="akshar-sathi-unified-print"
              onPrintCurrentView={() => window.print()}
              onPrintReport={() => setIsPrintModalOpen(true)}
              onPrintLiteracyForm={() => setIsPrintModalOpen(true)}
              currentViewLabel="Current View"
              currentViewSubtext="अक्षर साथी सूची का त्वरित स्क्रीन प्रिंट"
              reportLabel="Report"
              reportSubtext="अक्षर साथी समेकित विवरण रिपोर्ट"
              literacyFormLabel="Literacy Form (प्रपत्र - 02)"
              literacyFormSubtext="आधिकारिक प्रपत्र 02 अक्षर साथी पंजी A4 प्रारूप"
              buttonLabel="Print"
            />
          )}

          {isFeatureEnabled('module.literacy-volunteers.action.add') && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>नया अक्षर साथी जोड़ें</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="नाम, मोबाइल नंबर, संस्था या शाला से खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={filterQualification}
            onChange={(e) => setFilterQualification(e.target.value)}
            aria-label="शैक्षणिक योग्यता फ़िल्टर"
            className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">समस्त शैक्षणिक योग्यताएं</option>
            <option value="10वीं">10वीं उत्तीर्ण</option>
            <option value="12वीं">12वीं उत्तीर्ण</option>
            <option value="स्नातक">स्नातक (Graduate)</option>
            <option value="स्नातकोत्तर">स्नातकोत्तर (Post Graduate)</option>
          </select>
        </div>

        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
          पंजीकृत साथी: <strong className="text-gray-900 dark:text-white">{filteredVolunteers.length}</strong>
        </div>
      </div>

      {/* Volunteers Table */}
      <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1F1538] text-purple-200 font-bold border-b border-[#302353] uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-3">क्र.</th>
                <th className="py-3 px-3">अक्षर साथी का नाम</th>
                <th className="py-3 px-3">पिता / पति का नाम</th>
                <th className="py-3 px-3">मोबाइल नंबर</th>
                <th className="py-3 px-3">आयु / योग्यता</th>
                <th className="py-3 px-3">संस्था / विभाग</th>
                <th className="py-3 px-3">शाला व UDISE</th>
                <th className="py-3 px-3">अध्यापन स्थल</th>
                <th className="py-3 px-3 text-center">टैग शिक्षार्थी</th>
                <th className="py-3 px-3 text-center">परीक्षा सम्मिलित</th>
                <th className="py-3 px-3 text-center">उत्तीर्ण साक्षर</th>
                <th className="py-3 px-3 text-center">कार्यवाही</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-normal">
              {filteredVolunteers.map((vol, index) => (
                <tr key={vol.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-gray-500 dark:text-gray-400">{index + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900 dark:text-white">{vol.name}</div>
                    <div className="text-[10px] text-purple-600 font-medium">ULLAS Volunteer</div>
                  </td>
                  <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                    {vol.fatherOrHusbandName || '—'}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-gray-800 dark:text-gray-200">
                    {vol.mobileNumber}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-gray-900 dark:text-white">{vol.age} वर्ष</span> /{' '}
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                      {vol.educationalQualification}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={vol.institutionName}>
                    {vol.institutionName}
                  </td>
                  <td className="py-3 px-3 text-gray-800 dark:text-gray-200 truncate max-w-[150px]" title={vol.schoolName}>
                    <div>{vol.schoolName}</div>
                    <div className="text-[10.5px] font-mono text-gray-500">{vol.schoolUdise}</div>
                  </td>
                  <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                    {vol.teachingPlace}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold text-sm text-purple-700 dark:text-purple-400">
                      {vol.mappedLearnerCount}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-amber-600 dark:text-amber-400">
                    {vol.examParticipatedLearnerCount}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {vol.passedLearnerCount}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isFeatureEnabled('module.literacy-volunteers.action.edit') && (
                        <button
                          onClick={() => handleOpenModal(vol)}
                          className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer"
                          title="संपादित करें"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isFeatureEnabled('module.literacy-volunteers.action.delete') && (
                        <button
                          onClick={() => setDeleteConfirmId(vol.id)}
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
              {filteredVolunteers.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    कोई अक्षर साथी रिकॉर्ड नहीं मिला।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit Akshar Sathi */}
      {isModalOpen && editingVolunteer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#16221D] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingVolunteer.id ? 'अक्षर साथी विवरण संशोधन' : 'नया अक्षर साथी पंजीकरण (प्रपत्र-02)'}
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
              {/* School info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    संबद्ध विद्यालय
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingVolunteer.schoolName || ''}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    UDISE कोड
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingVolunteer.schoolUdise || ''}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Name and Relative */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    अक्षर साथी का नाम <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVolunteer.name || ''}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                    placeholder="जैसे: नीलेश लोधी"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    पिता / पति का नाम
                  </label>
                  <input
                    type="text"
                    value={editingVolunteer.fatherOrHusbandName || ''}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, fatherOrHusbandName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="पिता या पति का नाम"
                  />
                </div>
              </div>

              {/* Mobile, Age, Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    मोबाइल नंबर (10 अंक) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editingVolunteer.mobileNumber || ''}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, mobileNumber: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    आयु (वर्ष)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="80"
                    value={editingVolunteer.age || 25}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, age: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    शैक्षणिक योग्यता
                  </label>
                  <select
                    value={editingVolunteer.educationalQualification || '12वीं'}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, educationalQualification: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="8वीं">8वीं</option>
                    <option value="10वीं">10वीं</option>
                    <option value="12वीं">12वीं</option>
                    <option value="स्नातक (BA/B.Sc/B.Com)">स्नातक (BA/B.Sc/B.Com)</option>
                    <option value="स्नातकोत्तर (MA/M.Sc)">स्नातकोत्तर (MA/M.Sc)</option>
                    <option value="B.Ed / D.El.Ed">B.Ed / D.El.Ed</option>
                  </select>
                </div>
              </div>

              {/* Institution and Teaching Place */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    संस्था / विभाग का नाम
                  </label>
                  <input
                    type="text"
                    value={editingVolunteer.institutionName || ''}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, institutionName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="जैसे: नेहरू युवा केंद्र / छात्र / स्वयंसेवक"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    अध्यापन स्थल
                  </label>
                  <input
                    type="text"
                    value={editingVolunteer.teachingPlace || ''}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, teachingPlace: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="जैसे: शाला भवन / सामुदायिक भवन / व्यक्तिगत आवास"
                  />
                </div>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-3 bg-purple-50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-200 dark:border-purple-800/40">
                <div>
                  <label className="block text-[11px] font-bold text-purple-900 dark:text-purple-300 mb-1">
                    टैग शिक्षार्थी संख्या
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingVolunteer.mappedLearnerCount || 0}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, mappedLearnerCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1">
                    परीक्षा सम्मिलित
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingVolunteer.examParticipatedLearnerCount || 0}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, examParticipatedLearnerCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                    उत्तीर्ण शिक्षार्थी
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingVolunteer.passedLearnerCount || 0}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, passedLearnerCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>सुरक्षित करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16221D] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                अक्षर साथी हटाने की पुष्टि करें
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                क्या आप इस अक्षर साथी का रिकॉर्ड हटाना चाहते हैं?
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

      {/* Official ULLAS Form 02 Print Modal */}
      <LiteracyFormPrintModal
        isOpen={isPrintModalOpen}
        initialForm="FORM_2"
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
