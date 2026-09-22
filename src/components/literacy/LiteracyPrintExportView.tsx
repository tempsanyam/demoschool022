import React, { useState, useRef } from 'react';
import {
  Printer,
  FileDown,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Filter,
  School as SchoolIcon,
  BookOpen,
  Users,
  Award,
  Building2,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';

export const LiteracyPrintExportView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    schools,
    selectedSchoolUdise,
    setSelectedSchoolUdise,
    selectedSchool,
    currentSchoolUdise,
    scopedLiteracyRegisters,
    scopedIlliteratePersons,
    scopedAksharSathis,
    scopedLiteracyExamResults,
    scopedSupportingInstitutions,
  } = useData();

  const isSchoolUser = currentUser?.role === 'SCHOOL';

  // Selected Form
  const [selectedForm, setSelectedForm] = useState<'FORM_1' | 'FORM_2' | 'FORM_3' | 'FORM_4' | 'FORM_5'>('FORM_3');

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string | null>(null);

  // Ref for the printable report container
  const reportPrintRef = useRef<HTMLDivElement>(null);

  // Target School for Single School print
  const activeSchoolUdise = isSchoolUser ? currentSchoolUdise : selectedSchoolUdise;
  const activeSchool = schools.find((s) => s.udise === activeSchoolUdise) || selectedSchool || schools[0];

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

  // Trigger Browser Print
  const handleBrowserPrint = () => {
    window.print();
  };

  // Direct Client-Side PDF Generation using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    const element = reportPrintRef.current;
    if (!element) {
      setPdfStatusMessage('प्रिंट रिपोर्ट अवयव नहीं मिला। कृपया पुनः प्रयास करें।');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setPdfStatusMessage('PDF तैयार हो रहा है, कृपया प्रतीक्षा करें...');

      // Capture high quality canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: element.scrollWidth,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Landscape A4 dimensions in mm: 297 x 210
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 297;
      const pdfHeight = 210;
      const margin = 8;
      const printableWidth = pdfWidth - margin * 2;
      const imgProps = pdf.getImageProperties(imgData);
      const calculatedHeight = (imgProps.height * printableWidth) / imgProps.width;

      // Handle multi-page if content height exceeds printable height
      const pageUsableHeight = pdfHeight - margin * 2;
      let heightLeft = calculatedHeight;
      let position = margin;
      let pageCount = 1;

      pdf.addImage(imgData, 'JPEG', margin, position, printableWidth, calculatedHeight);
      heightLeft -= pageUsableHeight;

      while (heightLeft > 0) {
        position = margin - pageCount * pageUsableHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, printableWidth, calculatedHeight);
        heightLeft -= pageUsableHeight;
        pageCount++;
      }

      const safeName = formMetadata[selectedForm].number.replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
      pdf.save(`नवभारत_साक्षरता_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);

      setPdfStatusMessage('PDF सफलतापूर्वक डाउनलोड हो गया!');
      setTimeout(() => setPdfStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setPdfStatusMessage('PDF तैयार नहीं हो सका। कृपया प्रिंट विकल्प से सीधे PDF सेव करें।');
      setTimeout(() => setPdfStatusMessage(null), 4000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getLiteracyFormExportPayload = () => {
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
      headers = ['क्रमांक', 'शाला का नाम', 'UDISE', 'परीक्षा नाम', 'दिनांक', 'महिला', 'पुरुष', 'कुल', 'सम्मिलित', 'उत्तीर्ण', 'अनुत्तीर्ण', 'सफलता दर (%)'];
      rows = scopedLiteracyExamResults.map((r, idx) => {
        const rate = r.participatedLearners > 0 ? Math.round((r.passedLearners / r.participatedLearners) * 100) : 0;
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
      subtitle: `संकुल: ${activeSchool?.cluster || 'मलगुवां'} | ${formMetadata[selectedForm].number}`,
      schoolName: activeSchool?.name || activeSchool?.hindiName,
      udise: activeSchool?.udise,
      headers,
      rows,
      fileName: filename,
    };
  };

  // Render Form Table for Print & Preview
  const renderPrintableTable = () => {
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
            {scopedIlliteratePersons.map((p, idx) => (
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
            ))}
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
            {scopedAksharSathis.map((v, idx) => (
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
                <td className="border border-gray-300 p-1.5 text-center font-bold">{v.mappedLearnerCount}</td>
                <td className="border border-gray-300 p-1.5 text-center font-bold">{v.passedLearnerCount}</td>
              </tr>
            ))}
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
              <th className="border border-gray-400 p-2 text-left">शाला का नाम</th>
              <th className="border border-gray-400 p-2">UDISE कोड</th>
              <th className="border border-gray-400 p-2 text-left">ग्राम / वार्ड</th>
              <th className="border border-gray-400 p-2">परिवार</th>
              <th className="border border-gray-400 p-2">असाक्षर (पु/म/कुल)</th>
              <th className="border border-gray-400 p-2">उल्लास ऐप</th>
              <th className="border border-gray-400 p-2">अक्षर साथी</th>
              <th className="border border-gray-400 p-2">केंद्र</th>
              <th className="border border-gray-400 p-2">परीक्षा सम्मिलित</th>
              <th className="border border-gray-400 p-2">उत्तीर्ण साक्षर</th>
              <th className="border border-gray-400 p-2">शेष असाक्षर</th>
              <th className="border border-gray-400 p-2">सत्यापन स्थिति</th>
            </tr>
          </thead>
          <tbody>
            {scopedLiteracyRegisters.map((reg, idx) => (
              <tr key={reg.id} className="border-b border-gray-300">
                <td className="border border-gray-300 p-1.5 text-center font-mono">{idx + 1}</td>
                <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{reg.schoolName}</td>
                <td className="border border-gray-300 p-1.5 text-center font-mono">{reg.schoolUdise}</td>
                <td className="border border-gray-300 p-1.5">{reg.villageOrWard || '—'}</td>
                <td className="border border-gray-300 p-1.5 text-center">{reg.totalHouseholds}</td>
                <td className="border border-gray-300 p-1.5 text-center font-mono">
                  {reg.surveyedMaleIlliterates} + {reg.surveyedFemaleIlliterates} ={' '}
                  <strong>{reg.totalSurveyedIlliterates}</strong>
                </td>
                <td className="border border-gray-300 p-1.5 text-center font-bold">{reg.registeredOnApp}</td>
                <td className="border border-gray-300 p-1.5 text-center font-bold">{reg.totalAksharSathis}</td>
                <td className="border border-gray-300 p-1.5 text-center">{reg.teachingCentersCount}</td>
                <td className="border border-gray-300 p-1.5 text-center font-semibold">{reg.examAppearedLearners}</td>
                <td className="border border-gray-300 p-1.5 text-center font-bold">{reg.passedLearners}</td>
                <td className="border border-gray-300 p-1.5 text-center font-bold">{reg.remainingIlliterates}</td>
                <td className="border border-gray-300 p-1.5 text-center font-medium">
                  {reg.isCertified ? 'प्रमाणित' : 'लंबित'}
                </td>
              </tr>
            ))}
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
              <th className="border border-gray-400 p-2 text-left">शाला का नाम</th>
              <th className="border border-gray-400 p-2">UDISE कोड</th>
              <th className="border border-gray-400 p-2 text-left">परीक्षा सत्र / तिथि</th>
              <th className="border border-gray-400 p-2">पंजीकृत महिला</th>
              <th className="border border-gray-400 p-2">पंजीकृत पुरुष</th>
              <th className="border border-gray-400 p-2">कुल पंजीकृत</th>
              <th className="border border-gray-400 p-2">सम्मिलित शिक्षार्थी</th>
              <th className="border border-gray-400 p-2">उत्तीर्ण शिक्षार्थी</th>
              <th className="border border-gray-400 p-2">अनुत्तीर्ण</th>
              <th className="border border-gray-400 p-2">सफलता दर (%)</th>
            </tr>
          </thead>
          <tbody>
            {scopedLiteracyExamResults.map((r, idx) => {
              const rate = r.participatedLearners > 0 ? Math.round((r.passedLearners / r.participatedLearners) * 100) : 0;
              return (
                <tr key={r.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{r.schoolName}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{r.schoolUdise}</td>
                  <td className="border border-gray-300 p-1.5">
                    {r.examName} ({r.examDate})
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center">{r.femaleLearners}</td>
                  <td className="border border-gray-300 p-1.5 text-center">{r.maleLearners}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold">{r.totalLearners}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-semibold">{r.participatedLearners}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold">{r.passedLearners}</td>
                  <td className="border border-gray-300 p-1.5 text-center">{r.failedLearners}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold">{rate}%</td>
                </tr>
              );
            })}
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
            <th className="border border-gray-400 p-2">संस्था प्रकार</th>
            <th className="border border-gray-400 p-2 text-left">संबद्ध शाला</th>
            <th className="border border-gray-400 p-2">कुल सदस्य</th>
            <th className="border border-gray-400 p-2">अक्षर साथी</th>
            <th className="border border-gray-400 p-2">केंद्र</th>
            <th className="border border-gray-400 p-2">शिक्षार्थी</th>
            <th className="border border-gray-400 p-2">उत्तीर्ण</th>
            <th className="border border-gray-400 p-2 text-left">नोडल प्रभारी व संपर्क</th>
          </tr>
        </thead>
        <tbody>
          {scopedSupportingInstitutions.map((inst, idx) => (
            <tr key={inst.id} className="border-b border-gray-300">
              <td className="border border-gray-300 p-1.5 text-center font-mono">{idx + 1}</td>
              <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{inst.institutionName}</td>
              <td className="border border-gray-300 p-1.5 text-center">{inst.institutionType}</td>
              <td className="border border-gray-300 p-1.5">{inst.schoolName}</td>
              <td className="border border-gray-300 p-1.5 text-center">{inst.totalMembersCount}</td>
              <td className="border border-gray-300 p-1.5 text-center font-bold">{inst.aksharSathiCount}</td>
              <td className="border border-gray-300 p-1.5 text-center">{inst.teachingCentersCount}</td>
              <td className="border border-gray-300 p-1.5 text-center font-bold">{inst.totalLearnersCount}</td>
              <td className="border border-gray-300 p-1.5 text-center font-bold">{inst.passedLearnersCount}</td>
              <td className="border border-gray-300 p-1.5">
                {inst.nodalPersonName} ({inst.contactNumber})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {pdfStatusMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{pdfStatusMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white dark:bg-[#16221D] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <Printer className="w-4 h-4" />
            <span>शासकीय प्रपत्र प्रिंट एवं एक्सपोर्ट सेंटर (Print & PDF Export)</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mt-1">
            प्रिंट एवं एक्सपोर्ट (प्रपत्र 1 से 5)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            पांचों संदर्भ प्रपत्रों का पूर्ण शासकीय प्रारूप में प्रिंट पूर्वावलोकन, डायरेक्ट PDF डाउनलोड एवं Excel संचिका।
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

          {/* Unified Professional Print & Download Button */}
          <UnifiedPrintButton
            id="literacy-unified-print"
            currentSchoolName={activeSchool?.name || activeSchool?.hindiName}
            currentUdise={activeSchool?.udise}
            onPrintCurrentView={handleBrowserPrint}
            onPrintReport={handleDownloadPdf}
            onPrintLiteracyForm={() => setIsPreviewOpen(true)}
            currentViewLabel="Current View"
            currentViewSubtext="वर्तमान प्रपत्र का त्वरित ब्राउज़र प्रिंट"
            reportLabel="Report (A4 / PDF)"
            reportSubtext="A4 शासकीय प्रारूप में PDF डाउनलोड एवं सेव करें"
            literacyFormLabel="Literacy Form"
            literacyFormSubtext="ULLAS आधिकारिक प्रपत्र पूर्वावलोकन एवं प्रिंट"
            exportPayload={getLiteracyFormExportPayload}
          />
        </div>
      </div>

      {/* Select Form Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(Object.keys(formMetadata) as Array<keyof typeof formMetadata>).map((key) => {
          const item = formMetadata[key];
          const isSelected = selectedForm === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedForm(key)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#087F5B] bg-emerald-50/80 dark:bg-emerald-950/30 shadow-xs ring-2 ring-[#087F5B]'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#16221D] hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#087F5B] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  {item.number}
                </span>
                <span className="text-[10.5px] font-mono text-gray-500">
                  {item.recordsCount} रिकॉर्ड
                </span>
              </div>
              <div className="mt-2 text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                {item.title}
              </div>
              <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
                {item.subtext}
              </p>
            </button>
          );
        })}
      </div>

      {/* Live Document Canvas (Visible on page and targeted by html2canvas and @media print) */}
      <div className="bg-white rounded-2xl border border-gray-300 shadow-md p-6 sm:p-8 text-black overflow-hidden print:p-0 print:border-0 print:shadow-none">
        <div ref={reportPrintRef} className="space-y-4 max-w-full print:w-full">
          {/* Official Government Header */}
          <div className="border-b-2 border-black pb-3 text-center space-y-1">
            <div className="text-[12px] font-bold uppercase tracking-wider text-gray-800">
              मध्य प्रदेश शासन — स्कूल शिक्षा विभाग / राज्य शिक्षा केंद्र, भोपाल
            </div>
            <div className="text-base font-black text-gray-950">
              कार्यालय विकासखण्ड शिक्षा अधिकारी / संकुल केन्द्र : {activeSchool?.cluster || 'संकुल केंद्र मलगुवां (दमोह)'}
            </div>
            <div className="text-sm font-bold text-[#087F5B]">
              नवभारत साक्षरता कार्यक्रम (ULLAS - New India Literacy Programme)
            </div>
            <div className="inline-block px-3 py-0.5 bg-gray-100 border border-gray-400 text-xs font-black uppercase tracking-wide text-gray-900 rounded-sm">
              {formMetadata[selectedForm].title}
            </div>

            {/* School & Location Metadata Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] font-medium border-t border-gray-300 mt-2 px-1">
              <div>
                <strong>शाला का नाम:</strong> {activeSchool?.name || 'शासकीय प्राथमिक शाला'}
              </div>
              <div>
                <strong>UDISE कोड:</strong> <span className="font-mono">{activeSchool?.udise || '23080108302'}</span>
              </div>
              <div>
                <strong>विकासखण्ड:</strong> हटा | <strong>जिला:</strong> दमोह (म.प्र.)
              </div>
              <div>
                <strong>दिनांक:</strong> {new Date().toLocaleDateString('hi-IN')}
              </div>
            </div>
          </div>

          {/* Form Table Content */}
          <div className="overflow-x-auto print:overflow-visible">
            {renderPrintableTable()}
          </div>

          {/* Official Signatures & Verification Footer */}
          <div className="pt-8 border-t border-gray-400 mt-6 grid grid-cols-3 gap-4 text-center text-xs font-semibold">
            <div className="space-y-8">
              <div className="text-gray-400 font-mono text-[10px]">[हस्ताक्षर]</div>
              <div className="border-t border-dotted border-gray-600 pt-1">
                <strong>हस्ताक्षर प्रभारी शिक्षक / अक्षर साथी</strong>
                <div className="text-[10px] text-gray-600 font-normal">नवभारत साक्षरता कार्यक्रम</div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="text-gray-400 font-mono text-[10px]">[सील एवं हस्ताक्षर]</div>
              <div className="border-t border-dotted border-gray-600 pt-1">
                <strong>सील एवं हस्ताक्षर प्रधान पाठक</strong>
                <div className="text-[10px] text-gray-600 font-normal">{activeSchool?.name}</div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="text-gray-400 font-mono text-[10px]">[प्रतिहस्ताक्षर]</div>
              <div className="border-t border-dotted border-gray-600 pt-1">
                <strong>प्रतिहस्ताक्षर संकुल प्राचार्य / CAC</strong>
                <div className="text-[10px] text-gray-600 font-normal">विकासखण्ड शिक्षा कार्यालय</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl max-w-5xl w-full p-4 shadow-2xl border border-gray-300 dark:border-gray-800 my-4 space-y-3 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-300 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#087F5B]" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  प्रिंट पूर्वावलोकन (Print Preview) — {formMetadata[selectedForm].number}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBrowserPrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#087F5B] hover:bg-[#076C4D] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रिंट करें</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Canvas */}
            <div className="overflow-y-auto flex-1 p-4 bg-white text-black rounded-xl border border-gray-300 shadow-inner space-y-4">
              {/* Official Header */}
              <div className="border-b-2 border-black pb-3 text-center space-y-1">
                <div className="text-[12px] font-bold uppercase tracking-wider text-gray-800">
                  मध्य प्रदेश शासन — स्कूल शिक्षा विभाग / राज्य शिक्षा केंद्र, भोपाल
                </div>
                <div className="text-base font-black text-gray-950">
                  कार्यालय विकासखण्ड शिक्षा अधिकारी / संकुल केन्द्र : {activeSchool?.cluster || 'संकुल केंद्र मलगुवां (दमोह)'}
                </div>
                <div className="text-sm font-bold text-[#087F5B]">
                  नवभारत साक्षरता कार्यक्रम (ULLAS - New India Literacy Programme)
                </div>
                <div className="inline-block px-3 py-0.5 bg-gray-100 border border-gray-400 text-xs font-black uppercase tracking-wide text-gray-900 rounded-sm">
                  {formMetadata[selectedForm].title}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] font-medium border-t border-gray-300 mt-2 px-1">
                  <div>
                    <strong>शाला का नाम:</strong> {activeSchool?.name}
                  </div>
                  <div>
                    <strong>UDISE कोड:</strong> <span className="font-mono">{activeSchool?.udise}</span>
                  </div>
                  <div>
                    <strong>विकासखण्ड:</strong> हटा | <strong>जिला:</strong> दमोह (म.प्र.)
                  </div>
                  <div>
                    <strong>दिनांक:</strong> {new Date().toLocaleDateString('hi-IN')}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {renderPrintableTable()}
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-gray-400 mt-6 grid grid-cols-3 gap-4 text-center text-xs font-semibold">
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
      )}
    </div>
  );
};
