import React, { useState, useRef } from 'react';
import {
  Printer,
  X,
  FileSpreadsheet,
  Download,
  Building2,
  CheckCircle2,
  FileText,
  Eye,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  exportToExcel,
  generateUnicodePDFFromElement,
  exportToUnicodePDF,
  ExportDataPayload
} from '../../utils/exportUtils';
import { printElement, triggerPrint } from '../../utils/printUtils';

export type LiteracyFormType = 'FORM_1' | 'FORM_2' | 'FORM_3' | 'FORM_4' | 'FORM_5';

export interface LiteracyFormPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialForm?: LiteracyFormType;
  schoolUdise?: string;
}

export const LiteracyFormPrintModal: React.FC<LiteracyFormPrintModalProps> = ({
  isOpen,
  onClose,
  initialForm = 'FORM_3',
  schoolUdise,
}) => {
  const { currentUser } = useAuth();
  const {
    schools,
    selectedSchoolUdise,
    selectedSchool,
    currentSchoolUdise,
    selectedSessionId,
    academicSessions,
    scopedLiteracyRegisters,
    scopedIlliteratePersons,
    scopedAksharSathis,
    scopedLiteracyExamResults,
    scopedSupportingInstitutions,
  } = useData();

  const [selectedForm, setSelectedForm] = useState<LiteracyFormType>(initialForm);
  const printableAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isSchoolUser = currentUser?.role === 'SCHOOL';
  const targetUdise = schoolUdise || (isSchoolUser ? currentSchoolUdise : selectedSchoolUdise);
  const activeSchool = schools.find((s) => s.udise === targetUdise) || selectedSchool || schools[0];
  const activeSession = academicSessions.find((s) => s.id === selectedSessionId) || academicSessions[0];

  // Forms Metadata
  const formMetadata = {
    FORM_1: {
      number: 'प्रपत्र - 01',
      title: 'असाक्षर व्यक्ति का विवरण पंजी (ULLAS Learners Register)',
      subtext: '15+ आयु वर्ग के असाक्षर व्यक्तियों की व्यक्तिगत जानकारी, समग्र आईडी, अक्षर साथी टैगिंग एवं परीक्षा परिणाम।',
      recordsCount: scopedIlliteratePersons.length,
    },
    FORM_2: {
      number: 'प्रपत्र - 02',
      title: 'अक्षर साथी का विवरण पंजी (Volunteer Register)',
      subtext: 'असाक्षर व्यक्तियों को साक्षर बनाने हेतु कार्यरत स्वयंसेवक, छात्र, एनवाईके एवं जन अभियान परिषद अक्षर साथी।',
      recordsCount: scopedAksharSathis.length,
    },
    FORM_3: {
      number: 'प्रपत्र - 03',
      title: 'शालावार साक्षरता पंजी (Gram / Ward Literacy Register)',
      subtext: 'ग्राम/वार्डवार असाक्षर चिन्हांकन, उल्लास ऐप पंजीकरण, अक्षर साथी, परीक्षा एवं शाला प्रमाणीकरण विवरणी।',
      recordsCount: scopedLiteracyRegisters.length,
    },
    FORM_4: {
      number: 'प्रपत्र - 04',
      title: 'साक्षरता परीक्षा परिणाम संकलन (Exam Evaluation Results)',
      subtext: 'राष्ट्रीय मुक्त विद्यालयी शिक्षा संस्थान (NIOS) साक्षरता मूल्यांकन परीक्षा सत्रवार परिणाम एवं सफलता दर।',
      recordsCount: scopedLiteracyExamResults.length,
    },
    FORM_5: {
      number: 'प्रपत्र - 05',
      title: 'सहयोगी विभाग / संस्था का विवरण (Partner Organizations)',
      subtext: 'नेहरू युवा केंद्र, जन अभियान परिषद, महाविद्यालय, एनएसएस एवं स्वयंसेवी संस्थाओं का सहभागिता अभिलेख।',
      recordsCount: scopedSupportingInstitutions.length,
    },
  };

  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);

  // Direct Browser Print
  const handlePrint = () => {
    if (printableAreaRef.current) {
      printElement(printableAreaRef.current, {
        title: formMetadata[selectedForm]?.title || 'उल्लास साक्षरता प्रपत्र',
        orientation: 'landscape',
      });
    } else {
      triggerPrint({ orientation: 'landscape' });
    }
  };

  const getSelectedFormPayload = (): ExportDataPayload => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';

    if (selectedForm === 'FORM_1') {
      filename = `प्रपत्र_01_असाक्षर_व्यक्ति_पंजी_${new Date().toISOString().split('T')[0]}`;
      headers = ['क्रमांक', 'शाला का नाम', 'UDISE', 'असाक्षर का नाम', 'पिता/पति', 'आयु', 'लिंग', 'वर्ग', 'समग्र आईडी', 'मोबाइल', 'अक्षर साथी', 'उल्लास ऐप', 'परीक्षा परिणाम'];
      rows = scopedIlliteratePersons.map((p, idx) => [
        idx + 1,
        p.schoolName,
        p.schoolUdise,
        p.name,
        p.fatherOrHusbandName || '—',
        p.age,
        p.gender,
        p.category,
        p.samagraId || '—',
        p.mobileNumber || '—',
        p.assignedAksharSathiName || 'टैग नहीं',
        p.isRegistered ? 'हाँ' : 'नहीं',
        p.examResult || 'सम्मिलित नहीं',
      ]);
    } else if (selectedForm === 'FORM_2') {
      filename = `प्रपत्र_02_अक्षर_साथी_पंजी_${new Date().toISOString().split('T')[0]}`;
      headers = ['क्रमांक', 'शाला का नाम', 'UDISE', 'अक्षर साथी का नाम', 'पिता/पति', 'मोबाइल', 'आयु', 'योग्यता', 'संस्था', 'अध्यापन स्थल', 'टैग शिक्षार्थी', 'उत्तीर्ण'];
      rows = scopedAksharSathis.map((v, idx) => [
        idx + 1,
        v.schoolName,
        v.schoolUdise,
        v.name,
        v.fatherOrHusbandName || '—',
        v.mobileNumber,
        v.age,
        v.educationalQualification,
        v.institutionName,
        v.teachingPlace,
        v.mappedLearnerCount,
        v.passedLearnerCount,
      ]);
    } else if (selectedForm === 'FORM_3') {
      filename = `प्रपत्र_03_साक्षरता_पंजी_${new Date().toISOString().split('T')[0]}`;
      headers = ['क्रमांक', 'शाला का नाम', 'UDISE', 'ग्राम/वार्ड', 'परिवार', 'असाक्षर पु.', 'असाक्षर म.', 'कुल असाक्षर', 'ऐप पंजी.', 'अक्षर साथी', 'केंद्र', 'परीक्षा सम्मिलित', 'उत्तीर्ण', 'शेष'];
      rows = scopedLiteracyRegisters.map((reg, idx) => [
        idx + 1,
        reg.schoolName,
        reg.schoolUdise,
        reg.villageOrWard || '—',
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
      ]);
    } else if (selectedForm === 'FORM_4') {
      filename = `प्रपत्र_04_परीक्षा_परिणाम_${new Date().toISOString().split('T')[0]}`;
      headers = ['क्रमांक', 'शाला का नाम', 'UDISE', 'परीक्षा नाम', 'दिनांक', 'महिला', 'पुरुष', 'कुल शिक्षार्थी', 'सम्मिलित', 'उत्तीर्ण', 'अनुत्तीर्ण', 'शेष असाक्षर', 'सफलता दर (%)'];
      rows = scopedLiteracyExamResults.map((r, idx) => {
        const rate = r.participatedLearners > 0 ? Math.round((r.passedLearners / r.participatedLearners) * 100) : 0;
        const remaining = r.remainingIlliterateLearners ?? r.remainingCount ?? Math.max(0, (r.totalLearners ?? 0) - (r.passedLearners ?? 0) - (r.failedLearners ?? 0));
        return [
          idx + 1,
          r.schoolName,
          r.schoolUdise,
          r.examName,
          r.examDate,
          r.femaleLearners,
          r.maleLearners,
          r.totalLearners,
          r.participatedLearners,
          r.passedLearners,
          r.failedLearners,
          remaining,
          `${rate}%`,
        ];
      });
    } else {
      filename = `प्रपत्र_05_सहयोगी_संस्थाएं_${new Date().toISOString().split('T')[0]}`;
      headers = ['क्रमांक', 'शाला का नाम', 'UDISE', 'संस्था प्रकार', 'संस्था का नाम', 'कुल सदस्य', 'अक्षर साथी', 'केंद्र', 'शिक्षार्थी', 'उत्तीर्ण', 'नोडल प्रभारी', 'मोबाइल'];
      rows = scopedSupportingInstitutions.map((i, idx) => [
        idx + 1,
        i.schoolName,
        i.schoolUdise,
        i.institutionType,
        i.institutionName,
        i.totalMembersCount,
        i.aksharSathiCount,
        i.teachingCentersCount,
        i.totalLearnersCount,
        i.passedLearnersCount,
        i.nodalPersonName,
        i.contactNumber,
      ]);
    }

    return {
      title: formMetadata[selectedForm].title,
      subtitle: `संकुल: ${activeSchool?.cluster || 'मलगुवां'} | प्रपत्र संख्या: ${formMetadata[selectedForm].number}`,
      session: activeSession?.name || '2026-27',
      schoolName: activeSchool?.name || activeSchool?.hindiName,
      udise: activeSchool?.udise,
      headers,
      rows,
      fileName: filename,
    };
  };

  const handleExportExcel = () => {
    exportToExcel(getSelectedFormPayload());
  };

  const handleDownloadPDF = async () => {
    if (!printableAreaRef.current) return;
    setIsPdfLoading(true);
    try {
      const payload = getSelectedFormPayload();
      await generateUnicodePDFFromElement(
        printableAreaRef.current,
        payload.fileName || `ULLAS_${selectedForm}_${Date.now()}`,
        'landscape',
        {
          includeHeader: true,
          includeSchoolIdentity: true,
          includePageNumber: true,
          includeSignature: true,
          includeFooter: true,
        },
        'PROFESSIONAL'
      );
    } catch (err) {
      console.error('PDF Generation failed:', err);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const renderTable = () => {
    if (selectedForm === 'FORM_1') {
      return (
        <table className="w-full text-left text-[11px] border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-400 text-center">
              <th className="border border-gray-400 p-2 w-10">क्र.</th>
              <th className="border border-gray-400 p-2 text-left">असाक्षर व्यक्ति का नाम</th>
              <th className="border border-gray-400 p-2 text-left">पिता / पति का नाम</th>
              <th className="border border-gray-400 p-2">आयु / लिंग</th>
              <th className="border border-gray-400 p-2">वर्ग</th>
              <th className="border border-gray-400 p-2">समग्र आईडी</th>
              <th className="border border-gray-400 p-2">मोबाइल नंबर</th>
              <th className="border border-gray-400 p-2 text-left">शाला व ग्राम</th>
              <th className="border border-gray-400 p-2">अक्षर साथी</th>
              <th className="border border-gray-400 p-2">उल्लास ऐप</th>
              <th className="border border-gray-400 p-2">परीक्षा परिणाम</th>
            </tr>
          </thead>
          <tbody>
            {scopedIlliteratePersons.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500">
                  वर्तमान सत्र में कोई असाक्षर व्यक्ति रिकॉर्ड उपलब्ध नहीं है।
                </td>
              </tr>
            ) : (
              scopedIlliteratePersons.map((p, idx) => (
                <tr key={p.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{p.name}</td>
                  <td className="border border-gray-300 p-1.5">{p.fatherOrHusbandName || '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-center">
                    {p.age} वर्ष / {p.gender}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center font-semibold">{p.category}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{p.samagraId || '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{p.mobileNumber || '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-800">
                    {p.schoolName} ({p.address || ''})
                  </td>
                  <td className="border border-gray-300 p-1.5 font-medium">{p.assignedAksharSathiName || 'टैग नहीं'}</td>
                  <td className="border border-gray-300 p-1.5 text-center">{p.isRegistered ? 'पंजीकृत' : 'लंबित'}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold">
                    {p.examResult || 'सम्मिलित नहीं'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    if (selectedForm === 'FORM_2') {
      return (
        <table className="w-full text-left text-[11px] border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-400 text-center">
              <th className="border border-gray-400 p-2 w-10">क्र.</th>
              <th className="border border-gray-400 p-2 text-left">अक्षर साथी का नाम</th>
              <th className="border border-gray-400 p-2 text-left">पिता / पति का नाम</th>
              <th className="border border-gray-400 p-2">मोबाइल नंबर</th>
              <th className="border border-gray-400 p-2">आयु / योग्यता</th>
              <th className="border border-gray-400 p-2 text-left">संस्था / विभाग</th>
              <th className="border border-gray-400 p-2 text-left">संबद्ध शाला व UDISE</th>
              <th className="border border-gray-400 p-2 text-left">अध्यापन स्थल</th>
              <th className="border border-gray-400 p-2">टैग शिक्षार्थी</th>
              <th className="border border-gray-400 p-2">उत्तीर्ण साक्षर</th>
            </tr>
          </thead>
          <tbody>
            {scopedAksharSathis.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">
                  वर्तमान सत्र में कोई अक्षर साथी रिकॉर्ड उपलब्ध नहीं है।
                </td>
              </tr>
            ) : (
              scopedAksharSathis.map((v, idx) => (
                <tr key={v.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{v.name}</td>
                  <td className="border border-gray-300 p-1.5">{v.fatherOrHusbandName || '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono font-medium">{v.mobileNumber}</td>
                  <td className="border border-gray-300 p-1.5 text-center">{v.age} वर्ष / {v.educationalQualification}</td>
                  <td className="border border-gray-300 p-1.5">{v.institutionName}</td>
                  <td className="border border-gray-300 p-1.5">
                    {v.schoolName} ({v.schoolUdise})
                  </td>
                  <td className="border border-gray-300 p-1.5">{v.teachingPlace}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold text-emerald-800 font-mono">
                    {v.mappedLearnerCount}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold text-[#087F5B] font-mono">
                    {v.passedLearnerCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    if (selectedForm === 'FORM_3') {
      return (
        <table className="w-full text-left text-[11px] border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-400 text-center">
              <th className="border border-gray-400 p-2 w-10">क्र.</th>
              <th className="border border-gray-400 p-2 text-left">ग्राम / वार्ड का नाम</th>
              <th className="border border-gray-400 p-2">कुल परिवार</th>
              <th className="border border-gray-400 p-2">असाक्षर (पु.)</th>
              <th className="border border-gray-400 p-2">असाक्षर (म.)</th>
              <th className="border border-gray-400 p-2 font-bold bg-amber-50">कुल असाक्षर</th>
              <th className="border border-gray-400 p-2">ऐप पंजी.</th>
              <th className="border border-gray-400 p-2">अक्षर साथी</th>
              <th className="border border-gray-400 p-2">केंद्र संख्या</th>
              <th className="border border-gray-400 p-2">परीक्षा सम्मिलित</th>
              <th className="border border-gray-400 p-2 text-emerald-800">उत्तीर्ण साक्षर</th>
              <th className="border border-gray-400 p-2 text-amber-800">शेष असाक्षर</th>
            </tr>
          </thead>
          <tbody>
            {scopedLiteracyRegisters.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-4 text-center text-gray-500">
                  वर्तमान सत्र में कोई साक्षरता पंजी रिकॉर्ड उपलब्ध नहीं है।
                </td>
              </tr>
            ) : (
              scopedLiteracyRegisters.map((reg, idx) => (
                <tr key={reg.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">
                    {reg.villageOrWard || activeSchool?.village || '—'}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{reg.totalHouseholds}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{reg.surveyedMaleIlliterates}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{reg.surveyedFemaleIlliterates}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono font-bold bg-amber-50/50">
                    {reg.totalSurveyedIlliterates}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{reg.registeredOnApp}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono font-semibold">{reg.totalAksharSathis}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{reg.teachingCentersCount}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{reg.examAppearedLearners}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono font-bold text-[#087F5B]">
                    {reg.passedLearners}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono font-bold text-amber-900">
                    {reg.remainingIlliterates}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    if (selectedForm === 'FORM_4') {
      return (
        <table className="w-full text-left text-[11px] border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-400 text-center">
              <th className="border border-gray-400 p-2 w-10">क्र.</th>
              <th className="border border-gray-400 p-2 text-left">मूल्यांकन परीक्षा का नाम</th>
              <th className="border border-gray-400 p-2">आयोजन दिनांक</th>
              <th className="border border-gray-400 p-2">महिला परीक्षार्थी</th>
              <th className="border border-gray-400 p-2">पुरुष परीक्षार्थी</th>
              <th className="border border-gray-400 p-2">कुल शिक्षार्थी</th>
              <th className="border border-gray-400 p-2">परीक्षा में सम्मिलित</th>
              <th className="border border-gray-400 p-2 text-emerald-800">उत्तीर्ण</th>
              <th className="border border-gray-400 p-2 text-red-800">अनुत्तीर्ण</th>
              <th className="border border-gray-400 p-2 text-amber-900">शेष असाक्षर</th>
              <th className="border border-gray-400 p-2 font-bold bg-emerald-50 text-[#087F5B]">सफलता दर (%)</th>
            </tr>
          </thead>
          <tbody>
            {scopedLiteracyExamResults.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500">
                  वर्तमान सत्र में कोई साक्षरता परीक्षा परिणाम उपलब्ध नहीं है।
                </td>
              </tr>
            ) : (
              scopedLiteracyExamResults.map((r, idx) => {
                const passRate = r.participatedLearners > 0 ? Math.round((r.passedLearners / r.participatedLearners) * 100) : 0;
                const remaining = r.remainingIlliterateLearners ?? r.remainingCount ?? Math.max(0, (r.totalLearners ?? 0) - (r.passedLearners ?? 0) - (r.failedLearners ?? 0));
                return (
                  <tr key={r.id} className="border-b border-gray-300">
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{r.examName}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{r.examDate}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{r.femaleLearners}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{r.maleLearners}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono font-semibold">{r.totalLearners}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{r.participatedLearners}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono font-bold text-[#087F5B]">{r.passedLearners}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono text-red-700">{r.failedLearners}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono font-bold text-amber-900">{remaining}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono font-black text-[#087F5B] bg-emerald-50/50">
                      {passRate}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      );
    }

    return (
      <table className="w-full text-left text-[11px] border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-400 text-center">
            <th className="border border-gray-400 p-2 w-10">क्र.</th>
            <th className="border border-gray-400 p-2 text-left">संस्था / विभाग का नाम</th>
            <th className="border border-gray-400 p-2">संस्था श्रेणी</th>
            <th className="border border-gray-400 p-2">कुल सदस्य</th>
            <th className="border border-gray-400 p-2">अक्षर साथी</th>
            <th className="border border-gray-400 p-2">संचालित केंद्र</th>
            <th className="border border-gray-400 p-2">टैग शिक्षार्थी</th>
            <th className="border border-gray-400 p-2 text-emerald-800">सफल साक्षर</th>
            <th className="border border-gray-400 p-2 text-left">नोडल प्रभारी</th>
            <th className="border border-gray-400 p-2">मोबाइल नंबर</th>
          </tr>
        </thead>
        <tbody>
          {scopedSupportingInstitutions.length === 0 ? (
            <tr>
              <td colSpan={10} className="p-4 text-center text-gray-500">
                वर्तमान सत्र में कोई सहयोगी संस्था रिकॉर्ड उपलब्ध नहीं है।
              </td>
            </tr>
          ) : (
            scopedSupportingInstitutions.map((i, idx) => (
              <tr key={i.id} className="border-b border-gray-300">
                <td className="border border-gray-300 p-1.5 text-center font-mono">{idx + 1}</td>
                <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{i.institutionName}</td>
                <td className="border border-gray-300 p-1.5 text-center font-semibold">{i.institutionType}</td>
                <td className="border border-gray-300 p-1.5 text-center font-mono">{i.totalMembersCount}</td>
                <td className="border border-gray-300 p-1.5 text-center font-mono font-bold text-[#087F5B]">{i.aksharSathiCount}</td>
                <td className="border border-gray-300 p-1.5 text-center font-mono">{i.teachingCentersCount}</td>
                <td className="border border-gray-300 p-1.5 text-center font-mono">{i.totalLearnersCount}</td>
                <td className="border border-gray-300 p-1.5 text-center font-mono font-bold text-[#087F5B]">{i.passedLearnersCount}</td>
                <td className="border border-gray-300 p-1.5">{i.nodalPersonName}</td>
                <td className="border border-gray-300 p-1.5 text-center font-mono">{i.contactNumber}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto modal-print-wrapper animate-in fade-in duration-100">
      <div className="bg-white dark:bg-[#16211D] rounded-2xl w-full max-w-5xl shadow-2xl border border-gray-300 dark:border-gray-800 flex flex-col max-h-[92vh] print-modal-container">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-[#121B17] rounded-t-2xl no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#087F5B] dark:text-emerald-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  ULLAS नवभारत साक्षरता कार्यक्रम — आधिकारिक प्रपत्र मुद्रण
                </h3>
                <span className="text-[10px] font-bold bg-[#087F5B] text-white px-2 py-0.5 rounded-full">
                  {formMetadata[selectedForm].number}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formMetadata[selectedForm].title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              disabled={isPdfLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="A4 लैंडस्केप PDF दस्तावेज़ डाउनलोड करें"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isPdfLoading ? 'PDF बन रही है...' : 'PDF'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 text-[#087F5B] dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="एक्सेल (.xlsx) स्प्रेडशीट डाउनलोड करें"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>एक्सेल</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#087F5B] hover:bg-[#076C4D] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="ब्राउज़र डायलॉग से A4 प्रिंट करें"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट करें</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg cursor-pointer transition-colors"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Switcher Tabs (Hidden when printing) */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto bg-white dark:bg-[#16211D] no-print">
          {(Object.keys(formMetadata) as LiteracyFormType[]).map((key) => {
            const meta = formMetadata[key];
            const isActive = selectedForm === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedForm(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-[#087F5B] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>{meta.number}</span>
                <span className="text-[10px] opacity-75 font-normal">({meta.recordsCount})</span>
              </button>
            );
          })}
        </div>

        {/* Printable Canvas Area */}
        <div className="overflow-y-auto flex-1 p-5 bg-gray-100 dark:bg-black/30 print-container">
          <div
            ref={printableAreaRef}
            className="bg-white text-black p-6 rounded-xl border border-gray-300 shadow-md space-y-4 print-report-container max-w-4xl mx-auto"
          >
            {/* Official Government Header */}
            <div className="border-b-2 border-black pb-3 text-center space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                मध्य प्रदेश शासन — स्कूल शिक्षा विभाग / राज्य शिक्षा केंद्र, भोपाल
              </div>
              <div className="text-base font-black text-gray-950">
                कार्यालय विकासखण्ड शिक्षा अधिकारी / संकुल केन्द्र : {activeSchool?.cluster || 'संकुल केंद्र मलगुवां (बलदेवगढ़)'}
              </div>
              <div className="text-sm font-bold text-[#087F5B]">
                नवभारत साक्षरता कार्यक्रम (ULLAS - New India Literacy Programme)
              </div>
              <div className="inline-block px-3 py-0.5 bg-gray-100 border border-gray-400 text-xs font-black uppercase tracking-wide text-gray-900 rounded-xs">
                {formMetadata[selectedForm].title}
              </div>

              {/* Context Details Ribbon */}
              <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] font-medium border-t border-gray-300 mt-2 px-1 text-gray-800">
                <div>
                  <strong>शाला:</strong> {activeSchool?.hindiName || activeSchool?.name}
                </div>
                <div>
                  <strong>UDISE:</strong> <span className="font-mono font-bold">{activeSchool?.udise}</span>
                </div>
                <div>
                  <strong>शैक्षणिक सत्र:</strong> <span className="font-bold">{activeSession?.name || '2026-27'}</span>
                </div>
                <div>
                  <strong>विकासखंड:</strong> {activeSchool?.block || 'बलदेवगढ़'} | <strong>जिला:</strong> {activeSchool?.district || 'टीकमगढ़'} (म.प्र.)
                </div>
                <div>
                  <strong>दिनांक:</strong> {new Date().toLocaleDateString('hi-IN')}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {renderTable()}
            </div>

            {/* Summary Row */}
            <div className="text-[11px] text-gray-700 bg-gray-50 border border-gray-300 p-2 rounded-xs flex items-center justify-between">
              <span>
                <strong>कुल अभिलेख:</strong> {formMetadata[selectedForm].recordsCount}
              </span>
              <span className="text-[10px] text-gray-500">
                ULLAS साक्षरता पोर्टल एवं संकुल अभिलेखानुसार सत्यापित
              </span>
            </div>

            {/* Official Signatures Block */}
            <div className="pt-8 border-t border-gray-400 mt-8 grid grid-cols-3 gap-4 text-center text-xs font-semibold">
              <div className="space-y-8">
                <div className="text-gray-400 font-mono text-[10px]">[हस्ताक्षर]</div>
                <div className="border-t border-dotted border-gray-600 pt-1">
                  <strong>हस्ताक्षर प्रभारी शिक्षक / अक्षर साथी</strong>
                </div>
              </div>

              <div className="space-y-8">
                <div className="text-gray-400 font-mono text-[10px]">[सील एवं हस्ताक्षर]</div>
                <div className="border-t border-dotted border-gray-600 pt-1">
                  <strong>सील एवं हस्ताक्षर प्रधान पाठक</strong>
                </div>
              </div>

              <div className="space-y-8">
                <div className="text-gray-400 font-mono text-[10px]">[प्रतिहस्ताक्षर]</div>
                <div className="border-t border-dotted border-gray-600 pt-1">
                  <strong>प्रतिहस्ताक्षर संकुल प्राचार्य / CAC</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
