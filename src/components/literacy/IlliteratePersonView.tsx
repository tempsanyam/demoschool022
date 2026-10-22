import React, { useState } from 'react';
import {
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
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  UserCheck,
  School as SchoolIcon,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { IlliteratePerson } from '../../types/literacy';
import { triggerPrint } from '../../utils/printUtils';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { LiteracyFormPrintModal } from './LiteracyFormPrintModal';

export const IlliteratePersonView: React.FC = () => {
  const { currentUser } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();
  const {
    schools,
    selectedSchoolUdise,
    setSelectedSchoolUdise,
    selectedSchool,
    currentSchoolUdise,
    scopedIlliteratePersons,
    scopedAksharSathis,
    addIlliteratePerson,
    updateIlliteratePerson,
    deleteIlliteratePerson,
  } = useData();

  const isSchoolUser = currentUser?.role === 'SCHOOL';

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterExamStatus, setFilterExamStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Partial<IlliteratePerson> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open modal for new person or editing
  const handleOpenModal = (person?: IlliteratePerson) => {
    if (person) {
      setEditingPerson({ ...person });
    } else {
      const targetUdise = isSchoolUser ? currentSchoolUdise : (selectedSchoolUdise || schools[0]?.udise || '');
      const schoolObj = schools.find((s) => s.udise === targetUdise);
      setEditingPerson({
        schoolUdise: targetUdise,
        schoolName: schoolObj?.name || 'शासकीय प्राथमिक शाला',
        name: '',
        fatherOrHusbandName: '',
        motherName: '',
        headOfFamily: '',
        maritalStatus: 'विवाहित',
        dob: '1985-01-01',
        age: 40,
        gender: 'महिला',
        category: 'OBC',
        disability: 'लागू नहीं',
        mobileNumber: '',
        samagraId: '',
        aadhaarNumber: '',
        address: schoolObj?.village || '',
        isRegistered: true,
        assignedAksharSathiName: scopedAksharSathis[0]?.name || '',
        isExamParticipated: false,
        examResult: 'परीक्षा में सम्मिलित नहीं',
      });
    }
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson || !editingPerson.name) return;

    const targetUdise = isSchoolUser ? currentSchoolUdise : (editingPerson.schoolUdise || schools[0]?.udise || '');
    const schoolObj = schools.find((s) => s.udise === targetUdise);

    if (editingPerson.id) {
      updateIlliteratePerson(editingPerson as IlliteratePerson);
      showToast('असाक्षर व्यक्ति का विवरण सफलतापूर्वक अद्यतन किया गया।');
    } else {
      addIlliteratePerson({
        schoolUdise: targetUdise,
        schoolName: schoolObj?.name || editingPerson.schoolName || '',
        name: editingPerson.name.trim(),
        fatherOrHusbandName: editingPerson.fatherOrHusbandName?.trim() || '',
        motherName: editingPerson.motherName?.trim() || '',
        headOfFamily: editingPerson.headOfFamily?.trim() || '',
        maritalStatus: editingPerson.maritalStatus || 'विवाहित',
        dob: editingPerson.dob || '1985-01-01',
        age: Number(editingPerson.age) || 40,
        gender: editingPerson.gender || 'महिला',
        category: editingPerson.category || 'OBC',
        disability: editingPerson.disability || 'लागू नहीं',
        mobileNumber: editingPerson.mobileNumber?.trim() || '',
        samagraId: editingPerson.samagraId?.trim() || '',
        aadhaarNumber: editingPerson.aadhaarNumber?.trim() || '',
        address: editingPerson.address?.trim() || '',
        isRegistered: Boolean(editingPerson.isRegistered),
        assignedAksharSathiName: editingPerson.assignedAksharSathiName || '',
        isExamParticipated: Boolean(editingPerson.isExamParticipated),
        examResult: editingPerson.examResult || 'परीक्षा में सम्मिलित नहीं',
        remarks: editingPerson.remarks || '',
      });
      showToast('नया असाक्षर व्यक्ति सफलतापूर्वक पंजीकृत किया गया।');
    }

    setIsModalOpen(false);
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    deleteIlliteratePerson(id);
    setDeleteConfirmId(null);
    showToast('असाक्षर व्यक्ति का रिकॉर्ड सफलतापूर्वक हटा दिया गया।');
  };

  // Filtered list
  const filteredLearners = scopedIlliteratePersons.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(term) ||
      p.fatherOrHusbandName?.toLowerCase().includes(term) ||
      p.mobileNumber.includes(term) ||
      (p.samagraId && p.samagraId.includes(term)) ||
      p.schoolName.toLowerCase().includes(term);

    const matchGender = filterGender === 'ALL' || p.gender === filterGender;
    const matchCategory = filterCategory === 'ALL' || p.category === filterCategory;
    const matchExam =
      filterExamStatus === 'ALL' ||
      (filterExamStatus === 'PASSED' && p.examResult === 'उत्तीर्ण') ||
      (filterExamStatus === 'FAILED' && p.examResult === 'अनुत्तीर्ण') ||
      (filterExamStatus === 'NOT_APPEARED' && p.examResult !== 'उत्तीर्ण' && p.examResult !== 'अनुत्तीर्ण');

    return matchSearch && matchGender && matchCategory && matchExam;
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
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>प्रपत्र क्रमांक - 01 : असाक्षर व्यक्ति का विवरण (ULLAS Learners Master)</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mt-1">
            असाक्षर व्यक्ति सर्वेक्षण पंजी
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            15+ आयु वर्ग के असाक्षर व्यक्तियों की व्यक्तिगत जानकारी, समग्र आईडी, अक्षर साथी टैगिंग एवं परीक्षा रिकॉर्ड।
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

          {isFeatureEnabled('module.literacy-learners.action.print_export') && (
            <UnifiedPrintButton
              id="illiterate-unified-print"
              onPrintCurrentView={() => window.print()}
              onPrintReport={() => setIsPrintModalOpen(true)}
              onPrintLiteracyForm={() => setIsPrintModalOpen(true)}
              currentViewLabel="Current View"
              currentViewSubtext="असाक्षर व्यक्ति सूची का स्क्रीन प्रिंट"
              reportLabel="Report"
              reportSubtext="असाक्षर चिन्हांकन समेकित सारांश रिपोर्ट"
              literacyFormLabel="Literacy Form (प्रपत्र - 01)"
              literacyFormSubtext="आधिकारिक प्रपत्र 01 असाक्षर पंजी A4 प्रारूप"
              buttonLabel="Print"
            />
          )}

          {isFeatureEnabled('module.literacy-learners.action.add') && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087F5B] hover:bg-[#076C4D] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>नया असाक्षर व्यक्ति जोड़ें</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="नाम, पिता/पति, समग्र आईडी या मोबाइल नंबर से खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#087F5B]"
          />
        </div>

        {/* Gender Filter */}
        <div>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            aria-label="लिंग फ़िल्टर"
            className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#087F5B]"
          >
            <option value="ALL">समस्त लिंग (महिला व पुरुष)</option>
            <option value="महिला">केवल महिला</option>
            <option value="पुरुष">केवल पुरुष</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="सामाजिक वर्ग फ़िल्टर"
            className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#087F5B]"
          >
            <option value="ALL">समस्त सामाजिक वर्ग</option>
            <option value="SC">SC (अनुसूचित जाति)</option>
            <option value="ST">ST (अनुसूचित जनजाति)</option>
            <option value="OBC">OBC (अन्य पिछड़ा वर्ग)</option>
            <option value="GEN">सामान्य (General)</option>
          </select>
        </div>

        {/* Exam Status */}
        <div>
          <select
            value={filterExamStatus}
            onChange={(e) => setFilterExamStatus(e.target.value)}
            aria-label="परीक्षा स्थिति फ़िल्टर"
            className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#087F5B]"
          >
            <option value="ALL">समस्त परीक्षा स्थिति</option>
            <option value="PASSED">उत्तीर्ण (साक्षर प्रमाणित)</option>
            <option value="FAILED">अनुत्तीर्ण</option>
            <option value="NOT_APPEARED">सम्मिलित नहीं</option>
          </select>
        </div>
      </div>

      {/* Learners Data Table */}
      <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C291F] text-emerald-100 font-bold border-b border-[#1A4234] uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-3">क्र.</th>
                <th className="py-3 px-3">असाक्षर व्यक्ति का नाम</th>
                <th className="py-3 px-3">पिता / पति का नाम</th>
                <th className="py-3 px-3">आयु / लिंग</th>
                <th className="py-3 px-3">वर्ग / स्थिति</th>
                <th className="py-3 px-3">समग्र आईडी / मोबाइल</th>
                <th className="py-3 px-3">शाला / ग्राम</th>
                <th className="py-3 px-3">अक्षर साथी (टैगिंग)</th>
                <th className="py-3 px-3 text-center">उल्लास ऐप</th>
                <th className="py-3 px-3 text-center">परीक्षा परिणाम</th>
                <th className="py-3 px-3 text-center">कार्यवाही</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-normal">
              {filteredLearners.map((person, index) => (
                <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-gray-500 dark:text-gray-400">{index + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900 dark:text-white">{person.name}</div>
                    {person.disability && person.disability !== 'लागू नहीं' && (
                      <span className="text-[10px] text-amber-600 font-medium">दिव्यांग: {person.disability}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                    {person.fatherOrHusbandName || '—'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-gray-900 dark:text-white">{person.age} वर्ष</span> /{' '}
                    <span className={person.gender === 'महिला' ? 'text-rose-600 font-bold' : 'text-sky-600 font-bold'}>
                      {person.gender}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      {person.category}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-1.5">{person.maritalStatus || 'विवाहित'}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-gray-700 dark:text-gray-300">
                    <div>{person.samagraId || '—'}</div>
                    <div className="text-[10.5px] text-gray-500">{person.mobileNumber || '—'}</div>
                  </td>
                  <td className="py-3 px-3 text-gray-800 dark:text-gray-200 truncate max-w-[150px]" title={person.schoolName}>
                    <div>{person.schoolName}</div>
                    <div className="text-[10px] text-gray-500">{person.address}</div>
                  </td>
                  <td className="py-3 px-3">
                    {person.assignedAksharSathiName ? (
                      <span className="font-semibold text-purple-700 dark:text-purple-300">
                        {person.assignedAksharSathiName}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">टैग नहीं</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {person.isRegistered ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        पंजीकृत
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        लंबित
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        person.examResult === 'उत्तीर्ण'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : person.examResult === 'अनुत्तीर्ण'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {person.examResult || 'सम्मिलित नहीं'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isFeatureEnabled('module.literacy-learners.action.edit') && (
                        <button
                          onClick={() => handleOpenModal(person)}
                          className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
                          title="संपादित करें"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isFeatureEnabled('module.literacy-learners.action.delete') && (
                        <button
                          onClick={() => setDeleteConfirmId(person.id)}
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
              {filteredLearners.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    कोई असाक्षर व्यक्ति का विवरण नहीं मिला।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit Learner */}
      {isModalOpen && editingPerson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#16221D] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#087F5B]" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingPerson.id ? 'असाक्षर व्यक्ति विवरण संशोधन' : 'नया असाक्षर व्यक्ति पंजीकरण (प्रपत्र-01)'}
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
              {/* School Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    विद्यालय का नाम
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingPerson.schoolName || ''}
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
                    value={editingPerson.schoolUdise || ''}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    असाक्षर व्यक्ति का नाम <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPerson.name || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                    placeholder="जैसे: रामप्यारी अहिरवार"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    पिता / पति का नाम
                  </label>
                  <input
                    type="text"
                    value={editingPerson.fatherOrHusbandName || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, fatherOrHusbandName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="पिता या पति का नाम"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    माता का नाम
                  </label>
                  <input
                    type="text"
                    value={editingPerson.motherName || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, motherName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="माता का नाम"
                  />
                </div>
              </div>

              {/* Gender, Age, DOB, Marital */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    लिंग
                  </label>
                  <select
                    value={editingPerson.gender || 'महिला'}
                    onChange={(e) => setEditingPerson({ ...editingPerson, gender: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="महिला">महिला</option>
                    <option value="पुरुष">पुरुष</option>
                    <option value="अन्य">अन्य</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    आयु (वर्ष)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="105"
                    value={editingPerson.age || 40}
                    onChange={(e) => setEditingPerson({ ...editingPerson, age: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    सामाजिक वर्ग
                  </label>
                  <select
                    value={editingPerson.category || 'OBC'}
                    onChange={(e) => setEditingPerson({ ...editingPerson, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="SC">SC (अनुसूचित जाति)</option>
                    <option value="ST">ST (अनुसूचित जनजाति)</option>
                    <option value="OBC">OBC (अन्य पिछड़ा वर्ग)</option>
                    <option value="GEN">सामान्य (GEN)</option>
                    <option value="अल्पसंख्यक">अल्पसंख्यक</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    वैवाहिक स्थिति
                  </label>
                  <select
                    value={editingPerson.maritalStatus || 'विवाहित'}
                    onChange={(e) => setEditingPerson({ ...editingPerson, maritalStatus: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="विवाहित">विवाहित</option>
                    <option value="अविवाहित">अविवाहित</option>
                    <option value="विधवा">विधवा</option>
                    <option value="विधुर">विधुर</option>
                    <option value="तलाकशुदा">तलाकशुदा</option>
                  </select>
                </div>
              </div>

              {/* Samagra, Mobile, Aadhaar, Disability */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    समग्र आईडी (9 अंक)
                  </label>
                  <input
                    type="text"
                    maxLength={9}
                    value={editingPerson.samagraId || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, samagraId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    मोबाइल नंबर (10 अंक)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editingPerson.mobileNumber || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, mobileNumber: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    आधार नंबर (वैकल्पिक)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={editingPerson.aadhaarNumber || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, aadhaarNumber: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    placeholder="12 अंक"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    दिव्यांगता
                  </label>
                  <select
                    value={editingPerson.disability || 'लागू नहीं'}
                    onChange={(e) => setEditingPerson({ ...editingPerson, disability: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="लागू नहीं">लागू नहीं</option>
                    <option value="दृष्टिबाधित">दृष्टिबाधित</option>
                    <option value="मूक-बधिर">मूक-बधिर</option>
                    <option value="अस्थिबाधित">अस्थिबाधित</option>
                    <option value="अन्य">अन्य</option>
                  </select>
                </div>
              </div>

              {/* Address & Akshar Sathi Mapping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    संबद्ध अक्षर साथी (स्वयंसेवक टैगिंग)
                  </label>
                  <select
                    value={editingPerson.assignedAksharSathiName || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, assignedAksharSathiName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  >
                    <option value="">-- अक्षर साथी चुनें --</option>
                    {scopedAksharSathis.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name} ({v.mobileNumber}) - {v.schoolName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    पता / टोला / मोहल्ला
                  </label>
                  <input
                    type="text"
                    value={editingPerson.address || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, address: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="ग्राम मलगुवां, अहिरवार मोहल्ला"
                  />
                </div>
              </div>

              {/* App Registration & Exam Status */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRegisteredApp"
                    checked={Boolean(editingPerson.isRegistered)}
                    onChange={(e) => setEditingPerson({ ...editingPerson, isRegistered: e.target.checked })}
                    className="w-4 h-4 rounded text-[#087F5B] focus:ring-[#087F5B]"
                  />
                  <label htmlFor="isRegisteredApp" className="text-xs font-semibold text-gray-900 dark:text-white">
                    उल्लास मोबाइल ऐप पर पंजीकृत है
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    परीक्षा परिणाम स्थिति
                  </label>
                  <select
                    value={editingPerson.examResult || 'परीक्षा में सम्मिलित नहीं'}
                    onChange={(e) =>
                      setEditingPerson({
                        ...editingPerson,
                        examResult: e.target.value as any,
                        isExamParticipated: e.target.value !== 'परीक्षा में सम्मिलित नहीं',
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  >
                    <option value="परीक्षा में सम्मिलित नहीं">परीक्षा में सम्मिलित नहीं</option>
                    <option value="उत्तीर्ण">उत्तीर्ण (साक्षर प्रमाणित)</option>
                    <option value="अनुत्तीर्ण">अनुत्तीर्ण</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#087F5B] hover:bg-[#076C4D] text-white font-bold shadow-xs transition-colors cursor-pointer"
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
                रिकॉर्ड हटाने की पुष्टि करें
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                क्या आप इस असाक्षर व्यक्ति का नाम साक्षरता पंजी से हटाना चाहते हैं?
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

      {/* Official ULLAS Form 01 Print Modal */}
      <LiteracyFormPrintModal
        isOpen={isPrintModalOpen}
        initialForm="FORM_1"
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
