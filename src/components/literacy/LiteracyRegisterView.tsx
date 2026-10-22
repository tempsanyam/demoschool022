import React, { useState } from 'react';
import {
  BookMarked,
  PlusCircle,
  Edit2,
  Save,
  X,
  Printer,
  CheckCircle,
  AlertCircle,
  Filter,
  School as SchoolIcon,
  Search,
  Building,
  Users,
  Award,
  Download,
  Trash2,
  Lock,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { LiteracyRegister } from '../../types/literacy';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { LiteracyFormPrintModal } from './LiteracyFormPrintModal';

export const LiteracyRegisterView: React.FC = () => {
  const { currentUser } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();
  const {
    schools,
    selectedSchoolUdise,
    setSelectedSchoolUdise,
    selectedSchool,
    currentSchoolUdise,
    selectedSessionId,
    selectedSession,
    isSessionLocked,
    scopedLiteracyRegisters,
    scopedIlliteratePersons,
    scopedAksharSathis,
    saveLiteracyRegister,
    deleteLiteracyRegister,
  } = useData();

  const isSchoolUser = currentUser?.role === 'SCHOOL';
  const targetSchoolUdise = isSchoolUser ? currentSchoolUdise : selectedSchoolUdise;
  const activeSchool = schools.find((s) => s.udise === targetSchoolUdise) || selectedSchool;
  const isLocked = isSessionLocked();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Register Entry / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [editingRegister, setEditingRegister] = useState<Partial<LiteracyRegister> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Delete Confirmation State
  const [deletingRegister, setDeletingRegister] = useState<LiteracyRegister | null>(null);

  // Success message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Populate school details and initial survey stats
  const selectSchoolForForm = (udise: string, currentReg: Partial<LiteracyRegister>) => {
    const schoolObj = schools.find((s) => s.udise === udise);
    const schoolLearners = scopedIlliteratePersons.filter((p) => p.schoolUdise === udise);
    const mCount = schoolLearners.filter((p) => p.gender === 'पुरुष').length;
    const fCount = schoolLearners.filter((p) => p.gender === 'महिला').length;
    const regCount = schoolLearners.filter((p) => p.isRegistered).length;
    const volCount = scopedAksharSathis.filter((v) => v.schoolUdise === udise).length;
    const totalIll = mCount + fCount;

    return {
      ...currentReg,
      schoolUdise: udise,
      schoolName: schoolObj?.name || 'शासकीय शाला',
      villageOrWard: schoolObj?.village || currentReg.villageOrWard || '',
      surveyedMaleIlliterates: mCount,
      surveyedFemaleIlliterates: fCount,
      totalSurveyedIlliterates: totalIll,
      registeredOnApp: regCount,
      totalAksharSathis: volCount,
      teachingCentersCount: Math.max(1, Math.ceil(volCount / 2)),
      examRegisteredLearners: Math.round(totalIll * 0.8),
      examAppearedLearners: Math.round(totalIll * 0.7),
      passedLearners: Math.round(totalIll * 0.6),
      remainingIlliterates: Math.max(0, totalIll - Math.round(totalIll * 0.6)),
    };
  };

  // Open modal to add or edit register
  const handleOpenEdit = (reg?: LiteracyRegister, readOnly = false) => {
    setFormError(null);
    setIsViewOnly(isLocked || readOnly);

    if (reg) {
      setEditingRegister({ ...reg });
    } else {
      if (isLocked) {
        showToast('सत्र लॉक है। नई प्रविष्टि अनुमत नहीं है।');
        return;
      }
      // Pre-fill with selected school or default
      const defaultUdise = isSchoolUser ? currentSchoolUdise : (selectedSchoolUdise || schools[0]?.udise || '');
      const schoolObj = schools.find((s) => s.udise === defaultUdise);

      const baseReg: Partial<LiteracyRegister> = {
        schoolUdise: defaultUdise,
        schoolName: schoolObj?.name || 'शासकीय प्राथमिक शाला',
        villageOrWard: schoolObj?.village || '',
        totalHouseholds: 120,
        totalPopulation: 650,
        isCertified: true,
        certifiedBy: schoolObj?.inchargeName || currentUser?.name || 'प्रधान पाठक',
        certificationDate: new Date().toISOString().split('T')[0],
      };

      const populated = selectSchoolForForm(defaultUdise, baseReg);
      setEditingRegister(populated);
    }
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isLocked) {
      setFormError(`शैक्षणिक सत्र ${selectedSessionId} लॉक (Read-Only) है। परिवर्तन सुरक्षित नहीं किए जा सकते।`);
      return;
    }

    if (!editingRegister || !editingRegister.schoolUdise) {
      setFormError('कृपया शाला एवं UDISE कोड का चयन करें।');
      return;
    }

    if (!editingRegister.villageOrWard || !editingRegister.villageOrWard.trim()) {
      setFormError('कृपया ग्राम / वार्ड का नाम अनिवार्य रूप से दर्ज करें।');
      return;
    }

    const targetUdise = editingRegister.schoolUdise.trim();
    if (targetUdise.length !== 11) {
      setFormError('अमान्य UDISE कोड! कोड ठीक 11 अंकों का होना चाहिए।');
      return;
    }

    // Duplicate Check: if creating a new entry, verify school doesn't already have a record in this session
    const isNew = !editingRegister.id;
    if (isNew) {
      const alreadyExists = scopedLiteracyRegisters.some((r) => r.schoolUdise === targetUdise);
      if (alreadyExists) {
        setFormError(`इस विद्यालय (${editingRegister.schoolName || targetUdise}) हेतु शैक्षणिक सत्र ${selectedSessionId} में साक्षरता पंजी पूर्व से दर्ज है। कृपया मौजूदा प्रविष्टि को संपादित करें।`);
        return;
      }
    }

    const male = Math.max(0, Number(editingRegister.surveyedMaleIlliterates) || 0);
    const female = Math.max(0, Number(editingRegister.surveyedFemaleIlliterates) || 0);
    const total = male + female;
    const passed = Math.max(0, Number(editingRegister.passedLearners) || 0);
    const remaining = Math.max(0, total - passed);

    try {
      saveLiteracyRegister({
        id: editingRegister.id,
        sessionId: selectedSessionId,
        academicYear: selectedSessionId,
        schoolUdise: targetUdise,
        schoolName: editingRegister.schoolName || '',
        villageOrWard: editingRegister.villageOrWard.trim(),
        totalHouseholds: Math.max(0, Number(editingRegister.totalHouseholds) || 0),
        totalPopulation: Math.max(0, Number(editingRegister.totalPopulation) || 0),
        surveyedMaleIlliterates: male,
        surveyedFemaleIlliterates: female,
        totalSurveyedIlliterates: total,
        registeredOnApp: Math.max(0, Number(editingRegister.registeredOnApp) || 0),
        totalAksharSathis: Math.max(0, Number(editingRegister.totalAksharSathis) || 0),
        teachingCentersCount: Math.max(1, Number(editingRegister.teachingCentersCount) || 1),
        examRegisteredLearners: Math.max(0, Number(editingRegister.examRegisteredLearners) || 0),
        examAppearedLearners: Math.max(0, Number(editingRegister.examAppearedLearners) || 0),
        passedLearners: passed,
        remainingIlliterates: remaining,
        isCertified: Boolean(editingRegister.isCertified),
        certifiedBy: editingRegister.certifiedBy || '',
        certificationDate: editingRegister.certificationDate || new Date().toISOString().split('T')[0],
        remarks: editingRegister.remarks || '',
      });

      setIsModalOpen(false);
      showToast('साक्षरता पंजी का विवरण सफलतापूर्वक सुरक्षित कर लिया गया है।');
    } catch (err: any) {
      setFormError(err.message || 'पंजी सुरक्षित करते समय त्रुटि उत्पन्न हुई।');
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = () => {
    if (!deletingRegister) return;
    if (isLocked) {
      showToast('सत्र लॉक है, विलोपन अनुमत नहीं है।');
      setDeletingRegister(null);
      return;
    }
    try {
      deleteLiteracyRegister(deletingRegister.id);
      showToast(`साक्षरता पंजी (${deletingRegister.schoolName}) सफलतापूर्वक हटा दी गई।`);
    } catch (err: any) {
      showToast(err.message || 'रिकॉर्ड हटाने में विफल।');
    } finally {
      setDeletingRegister(null);
    }
  };

  // Filtered registers
  const filteredRegisters = scopedLiteracyRegisters.filter((reg) => {
    const term = searchTerm.toLowerCase();
    return (
      reg.schoolName.toLowerCase().includes(term) ||
      reg.schoolUdise.includes(term) ||
      (reg.villageOrWard || '').toLowerCase().includes(term)
    );
  });

  // Export Payload for UnifiedPrintButton
  const getLiteracyExportPayload = () => {
    const headers = [
      'क्रमांक',
      'सत्र',
      'शाला का नाम',
      'UDISE कोड',
      'ग्राम / वार्ड',
      'कुल परिवार',
      'सर्वेक्षित पुरुष असाक्षर',
      'सर्वेक्षित महिला असाक्षर',
      'कुल सर्वेक्षित असाक्षर',
      'उल्लास ऐप पंजीकृत',
      'कुल अक्षर साथी',
      'संचालित केंद्र',
      'परीक्षा में सम्मिलित',
      'उत्तीर्ण नवसाक्षर',
      'शेष असाक्षर',
      'प्रमाणीकरण स्थिति'
    ];
    const rows = filteredRegisters.map((reg, idx) => [
      idx + 1,
      reg.sessionId || reg.academicYear || selectedSessionId,
      reg.schoolName,
      reg.schoolUdise,
      reg.villageOrWard || '-',
      reg.totalHouseholds,
      reg.surveyedMaleIlliterates,
      reg.surveyedFemaleIlliterates,
      reg.totalSurveyedIlliterates,
      reg.registeredOnApp,
      reg.totalAksharSathis,
      reg.teachingCentersCount,
      reg.examAppearedLearners,
      reg.passedLearners,
      reg.remainingIlliterates,
      reg.isCertified ? 'प्रमाणित' : 'लंबित'
    ]);
    return {
      title: `उल्लास नव भारत साक्षरता कार्यक्रम - साक्षरता पंजी (सत्र: ${selectedSessionId})`,
      subtitle: `जन शिक्षा केंद्र मलगुवां | कुल रिकॉर्ड: ${filteredRegisters.length}`,
      schoolName: activeSchool?.name || activeSchool?.hindiName,
      udise: activeSchool?.udise,
      headers,
      rows,
      fileName: `ULLAS_Form03_Register_${selectedSessionId}_${Date.now()}`
    };
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Locked / Archived Session Notice Banner */}
      {isLocked && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-3 shadow-xs">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
              अभिलेखीय / बंद सत्र ({selectedSessionId}) - केवल पठन मोड (Read-Only Mode)
            </h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              यह शैक्षणिक सत्र अभिलेखीय एवं बंद स्थिति में है। इसमें नवीन साक्षरता पंजी प्रविष्टि, संपादन अथवा विलोपन सुरक्षित रूप से प्रतिबंधित है। आप अभिलेखों को देख एवं प्रिंट/डाउनलोड कर सकते हैं।
            </p>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#16221D] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <BookMarked className="w-4 h-4" />
            <span>प्रपत्र क्रमांक - 03 : शासकीय साक्षरता अभिलेख</span>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold">
              सत्र: {selectedSessionId}
            </span>
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mt-1">
            शालावार साक्षरता पंजी (Literacy Register)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            ग्राम/वार्डवार असाक्षर चिन्हांकन, उल्लास ऐप पंजीकरण, परीक्षा एवं प्रमाणीकरण की समेकित पंजी।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

          {isFeatureEnabled('module.literacy-register.action.print_export') && (
            <UnifiedPrintButton
              id="literacy-reg-unified-print"
              currentSession={selectedSessionId}
              currentSchoolName={activeSchool?.name || activeSchool?.hindiName}
              currentUdise={activeSchool?.udise}
              onPrintCurrentView={() => window.print()}
              onPrintReport={() => setIsPrintModalOpen(true)}
              onPrintLiteracyForm={() => setIsPrintModalOpen(true)}
              currentViewLabel="Current View"
              currentViewSubtext="साक्षरता पंजी तालिका का त्वरित स्क्रीन प्रिंट"
              reportLabel="Report"
              reportSubtext="शालावार साक्षरता पंजी सारांश रिपोर्ट"
              literacyFormLabel="Literacy Form (प्रपत्र - 03)"
              literacyFormSubtext="आधिकारिक प्रपत्र 03 साक्षरता पंजी A4 प्रारूप"
              exportPayload={getLiteracyExportPayload}
            />
          )}

          {isFeatureEnabled('module.literacy-register.action.edit') && (
            <button
              onClick={() => handleOpenEdit()}
              disabled={isLocked}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors ${
                isLocked
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-[#087F5B] hover:bg-[#076C4D] text-white cursor-pointer'
              }`}
              title={isLocked ? 'सत्र लॉक होने के कारण नवीन प्रविष्टि बंद है' : 'नवीन साक्षरता पंजी जोड़ें'}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>पंजी प्रविष्टि / अद्यतन</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="शाला का नाम, UDISE कोड या ग्राम/वार्ड से खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#087F5B]"
          />
        </div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
          सत्र <span className="font-bold text-emerald-700 dark:text-emerald-400">{selectedSessionId}</span> में प्रदर्शित पंजी:{' '}
          <strong className="text-gray-900 dark:text-white">{filteredRegisters.length}</strong>
        </div>
      </div>

      {/* Register Table View */}
      <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C291F] text-emerald-100 font-bold border-b border-[#1A4234] uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-3">क्र.</th>
                <th className="py-3 px-3">शाला का नाम व UDISE कोड</th>
                <th className="py-3 px-3">ग्राम / वार्ड</th>
                <th className="py-3 px-3 text-center">परिवार / जनसंख्या</th>
                <th className="py-3 px-3 text-center">चिन्हांकित असाक्षर<br />(पु / म / कुल)</th>
                <th className="py-3 px-3 text-center">उल्लास ऐप पंजी.</th>
                <th className="py-3 px-3 text-center">अक्षर साथी / केंद्र</th>
                <th className="py-3 px-3 text-center">परीक्षा सम्मिलित</th>
                <th className="py-3 px-3 text-center">उत्तीर्ण साक्षर</th>
                <th className="py-3 px-3 text-center">शेष असाक्षर</th>
                <th className="py-3 px-3 text-center">प्रमाणीकरण स्थिति</th>
                <th className="py-3 px-3 text-center">कार्यवाही</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-normal">
              {filteredRegisters.map((reg, index) => (
                <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-gray-500 dark:text-gray-400">{index + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900 dark:text-white">{reg.schoolName}</div>
                    <div className="text-[10.5px] font-mono text-emerald-700 dark:text-emerald-400">{reg.schoolUdise}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-gray-700 dark:text-gray-300">
                    {reg.villageOrWard || '—'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-semibold text-gray-900 dark:text-white">{reg.totalHouseholds}</span> /{' '}
                    <span className="text-gray-600 dark:text-gray-400">{reg.totalPopulation}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span className="text-sky-600 font-semibold">{reg.surveyedMaleIlliterates}</span> +{' '}
                    <span className="text-rose-600 font-semibold">{reg.surveyedFemaleIlliterates}</span> ={' '}
                    <strong className="text-gray-900 dark:text-white font-bold">{reg.totalSurveyedIlliterates}</strong>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                    {reg.registeredOnApp}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold text-purple-700 dark:text-purple-300">{reg.totalAksharSathis}</span> साथी /{' '}
                    <span className="text-gray-600 dark:text-gray-400">{reg.teachingCentersCount} केंद्र</span>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-amber-600 dark:text-amber-400">
                    {reg.examAppearedLearners}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {reg.passedLearners}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                    {reg.remainingIlliterates}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {reg.isCertified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle className="w-3 h-3" />
                        <span>प्रमाणित</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <AlertCircle className="w-3 h-3" />
                        <span>सत्यापन प्रतीक्षित</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isLocked ? (
                        <button
                          onClick={() => handleOpenEdit(reg, true)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                          title="पंजी विवरण देखें (Read-Only)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <>
                          {isFeatureEnabled('module.literacy-register.action.edit') && (
                            <button
                              onClick={() => handleOpenEdit(reg, false)}
                              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                              title="पंजी विवरण संपादित करें"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isFeatureEnabled('module.literacy-register.action.delete') && (
                            <button
                              onClick={() => setDeletingRegister(reg)}
                              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-gray-700 dark:text-gray-300 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer"
                              title="पंजी रिकॉर्ड हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRegisters.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    {isLocked
                      ? `सत्र ${selectedSessionId} में कोई साक्षरता पंजी उपलब्ध नहीं है।`
                      : `सत्र ${selectedSessionId} में कोई साक्षरता पंजी रिकॉर्ड नहीं मिला। कृपया "पंजी प्रविष्टि / अद्यतन" बटन पर क्लिक करें।`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Literacy Register Edit / Entry */}
      {isModalOpen && editingRegister && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#16221D] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-[#087F5B]" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {isViewOnly ? 'साक्षरता पंजी अवलोकन (View Only)' : editingRegister.id ? 'साक्षरता पंजी अद्यतन' : 'नवीन साक्षरता पंजी प्रविष्टि'}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    सत्र: {selectedSessionId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Error Banner */}
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2 text-rose-800 dark:text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* School Identification */}
              <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl space-y-3">
                {!isSchoolUser && !editingRegister.id && !isViewOnly ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      विद्यालय का चयन करें *
                    </label>
                    <select
                      value={editingRegister.schoolUdise || ''}
                      onChange={(e) => {
                        const updated = selectSchoolForForm(e.target.value, editingRegister);
                        setEditingRegister(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                      required
                    >
                      {schools.map((s) => (
                        <option key={s.udise} value={s.udise}>
                          {s.name} ({s.udise})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        विद्यालय का नाम
                      </label>
                      <input
                        type="text"
                        disabled
                        value={editingRegister.schoolName || ''}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        UDISE कोड
                      </label>
                      <input
                        type="text"
                        disabled
                        value={editingRegister.schoolUdise || ''}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-mono"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    ग्राम / वार्ड का नाम *
                  </label>
                  <input
                    type="text"
                    disabled={isViewOnly}
                    value={editingRegister.villageOrWard || ''}
                    onChange={(e) => setEditingRegister({ ...editingRegister, villageOrWard: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                    placeholder="जैसे: मलगुवां मुख्य बस्ती / वार्ड 04"
                    required
                  />
                </div>
              </div>

              {/* Demographics & Survey Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    कुल परिवार संख्या
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isViewOnly}
                    value={editingRegister.totalHouseholds ?? ''}
                    onChange={(e) => setEditingRegister({ ...editingRegister, totalHouseholds: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    कुल जनसंख्या
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isViewOnly}
                    value={editingRegister.totalPopulation ?? ''}
                    onChange={(e) => setEditingRegister({ ...editingRegister, totalPopulation: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-sky-700 dark:text-sky-300 mb-1">
                    असाक्षर पुरुष
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isViewOnly}
                    value={editingRegister.surveyedMaleIlliterates ?? ''}
                    onChange={(e) => {
                      const male = Number(e.target.value);
                      const female = Number(editingRegister.surveyedFemaleIlliterates) || 0;
                      const passed = Number(editingRegister.passedLearners) || 0;
                      setEditingRegister({
                        ...editingRegister,
                        surveyedMaleIlliterates: male,
                        totalSurveyedIlliterates: male + female,
                        remainingIlliterates: Math.max(0, male + female - passed),
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-sky-300 dark:border-sky-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-rose-700 dark:text-rose-300 mb-1">
                    असाक्षर महिला
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isViewOnly}
                    value={editingRegister.surveyedFemaleIlliterates ?? ''}
                    onChange={(e) => {
                      const female = Number(e.target.value);
                      const male = Number(editingRegister.surveyedMaleIlliterates) || 0;
                      const passed = Number(editingRegister.passedLearners) || 0;
                      setEditingRegister({
                        ...editingRegister,
                        surveyedFemaleIlliterates: female,
                        totalSurveyedIlliterates: male + female,
                        remainingIlliterates: Math.max(0, male + female - passed),
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                  />
                </div>
              </div>

              {/* ULLAS App, Centers & Volunteers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    उल्लास ऐप पर पंजीकृत
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isViewOnly}
                    value={editingRegister.registeredOnApp ?? ''}
                    onChange={(e) => setEditingRegister({ ...editingRegister, registeredOnApp: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    कुल अक्षर साथी (संख्या)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isViewOnly}
                    value={editingRegister.totalAksharSathis ?? ''}
                    onChange={(e) => setEditingRegister({ ...editingRegister, totalAksharSathis: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    अध्यापन केंद्र संख्या
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isViewOnly}
                    value={editingRegister.teachingCentersCount ?? 1}
                    onChange={(e) => setEditingRegister({ ...editingRegister, teachingCentersCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                  />
                </div>
              </div>

              {/* Exam & Literacy Numbers */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    परीक्षा सम्मिलित
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isViewOnly}
                    value={editingRegister.examAppearedLearners ?? ''}
                    onChange={(e) => setEditingRegister({ ...editingRegister, examAppearedLearners: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                    उत्तीर्ण शिक्षार्थी
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isViewOnly}
                    value={editingRegister.passedLearners ?? ''}
                    onChange={(e) => {
                      const passed = Number(e.target.value);
                      const male = Number(editingRegister.surveyedMaleIlliterates) || 0;
                      const female = Number(editingRegister.surveyedFemaleIlliterates) || 0;
                      setEditingRegister({
                        ...editingRegister,
                        passedLearners: passed,
                        remainingIlliterates: Math.max(0, male + female - passed),
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-rose-700 dark:text-rose-300 mb-1">
                    अवशेष असाक्षर
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled
                    value={editingRegister.remainingIlliterates ?? 0}
                    className="w-full px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-gray-100 dark:bg-gray-800/80 text-rose-700 dark:text-rose-300 font-bold"
                  />
                </div>
              </div>

              {/* Certification & Headmaster Sign */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="regCertifiedCheck"
                    disabled={isViewOnly}
                    checked={Boolean(editingRegister.isCertified)}
                    onChange={(e) => setEditingRegister({ ...editingRegister, isCertified: e.target.checked })}
                    className="w-4 h-4 rounded text-[#087F5B] focus:ring-[#087F5B]"
                  />
                  <label htmlFor="regCertifiedCheck" className="text-xs font-bold text-gray-900 dark:text-white">
                    प्रमाणित किया जाता है कि उपरोक्त विवरण शाला अभिलेख व भौतिक सत्यापन अनुसार सही है।
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                      सत्यापनकर्ता / प्रधान पाठक का नाम
                    </label>
                    <input
                      type="text"
                      disabled={isViewOnly}
                      value={editingRegister.certifiedBy || ''}
                      onChange={(e) => setEditingRegister({ ...editingRegister, certifiedBy: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                      placeholder="प्रधान पाठक का नाम"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                      सत्यापन तिथि
                    </label>
                    <input
                      type="date"
                      disabled={isViewOnly}
                      value={editingRegister.certificationDate || ''}
                      onChange={(e) => setEditingRegister({ ...editingRegister, certificationDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800/60"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  {isViewOnly ? 'बंद करें' : 'रद्द करें'}
                </button>
                {!isViewOnly && (
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#087F5B] hover:bg-[#076C4D] text-white font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>पंजी सुरक्षित करें</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRegister && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16221D] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  साक्षरता पंजी विलोपन पुष्टि
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  सत्र: {selectedSessionId}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              क्या आप विद्यालय <strong className="text-gray-900 dark:text-white">{deletingRegister.schoolName}</strong> (UDISE: {deletingRegister.schoolUdise}) की साक्षरता पंजी को स्थायी रूप से हटाना चाहते हैं?
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60">
              चेतावनी: यह कार्यवाही स्थायी है और रिकॉर्ड को स्थानीय संचय (Local Storage) से हटा देगी।
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setDeletingRegister(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>हाँ, हटाएं</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official ULLAS Form 03 Print Modal */}
      <LiteracyFormPrintModal
        isOpen={isPrintModalOpen}
        initialForm="FORM_3"
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
