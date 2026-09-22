import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  UserCheck,
  Building2,
  Calendar,
  Award,
  Phone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { Staff } from '../../types';
import { School } from '../../types';
import { institutionConfig } from '../../config/institutionConfig';
import { printElement } from '../../utils/printUtils';
import { generateUnicodePDFFromElement } from '../../utils/exportUtils';

interface TeacherPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
  school: School | undefined;
  session?: string;
  isAuthorizedToViewAadhaar?: boolean;
}

export const TeacherPrintModal: React.FC<TeacherPrintModalProps> = ({
  isOpen,
  onClose,
  staff,
  school,
  session = '2026-27',
  isAuthorizedToViewAadhaar = true
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !staff) return null;

  const schoolName = school?.hindiName || school?.name || staff.assignedSchoolUdise;
  const postingDate = staff.postingDate || staff.joiningDate || '-';
  const rawAadhaar = staff.aadhaarNumber?.replace(/\s+/g, '') || '';
  const displayAadhaar = rawAadhaar
    ? (isAuthorizedToViewAadhaar
        ? `${rawAadhaar.slice(0, 4)} ${rawAadhaar.slice(4, 8)} ${rawAadhaar.slice(8, 12)}`
        : `•••• •••• ${rawAadhaar.slice(-4)}`)
    : 'उपलब्ध नहीं';

  const handlePrint = () => {
    if (printContainerRef.current) {
      printElement(printContainerRef.current, {
        title: `Teacher_Profile_${staff.employeeId || staff.employeeCode || staff.name}`,
        orientation: 'portrait'
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (printContainerRef.current) {
      await generateUnicodePDFFromElement(
        printContainerRef.current,
        `Teacher_Profile_${staff.employeeId || staff.employeeCode || staff.name}_${session}`,
        'portrait'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 my-8">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                शिक्षक प्रोफ़ाइल प्रिंट / PDF प्रीव्यू
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {staff.name} ({staff.designation}) • सत्र {session}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-teacher-print-modal"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨️ प्रिंट करें</span>
            </button>
            <button
              id="btn-teacher-pdf-modal"
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF डाउनलोड करें</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Container Preview */}
        <div className="bg-gray-50 dark:bg-[#0F1713] p-4 rounded-xl border border-gray-200 dark:border-gray-800 max-h-[75vh] overflow-y-auto">
          <div
            ref={printContainerRef}
            className="bg-white text-gray-900 p-8 shadow-sm rounded-lg max-w-[210mm] mx-auto text-xs leading-normal font-sans"
            style={{ minHeight: '297mm', color: '#111827' }}
          >
            {/* Official Header */}
            <div className="text-center pb-4 border-b-2 border-emerald-800 mb-6">
              <div className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                {institutionConfig.state} शासन • {institutionConfig.department || 'स्कूल शिक्षा विभाग'}
              </div>
              <h1 className="text-xl font-black text-gray-950 mt-0.5">
                {institutionConfig.institutionName} ({institutionConfig.block}, {institutionConfig.district})
              </h1>
              <div className="text-xs font-semibold text-gray-600 mt-1">
                संकुल केंद्र: {institutionConfig.sankulName || institutionConfig.institutionName} • डाइस कोड: {institutionConfig.diseCode}
              </div>
              <div className="inline-block mt-2 px-3 py-1 bg-emerald-800 text-white font-bold rounded-full text-xs">
                शिक्षक एवं कर्मचारी व्यक्तिगत सेवा अभिलेख (Teacher / Staff Profile Dossier) • सत्र {session}
              </div>
            </div>

            {/* Basic Identity Strip */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 mb-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">शिक्षक का नाम</span>
                <h2 className="text-lg font-black text-gray-900">{staff.name}</h2>
                <div className="text-xs text-gray-700 font-medium mt-0.5">
                  <strong>{staff.designation}</strong> {staff.subject && <span>• मुख्य विषय: {staff.subject}</span>}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">कर्मचारी कोड / ID</span>
                <div className="text-base font-mono font-black text-emerald-950">
                  {staff.employeeId || staff.employeeCode || '-'}
                </div>
                {staff.uniqueId && (
                  <div className="text-[11px] font-mono text-gray-600">
                    यूनिक आईडी: <strong className="text-gray-900">{staff.uniqueId}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Section 1: व्यक्तिगत जानकारी */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 inline-block" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  १. व्यक्तिगत जानकारी (Personal Details)
                </h3>
              </div>
              <table className="w-full border-collapse border border-gray-300 text-xs">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="w-1/4 p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">शिक्षक का नाम</td>
                    <td className="w-1/4 p-2 font-semibold text-gray-900 border-r border-gray-200">{staff.name}</td>
                    <td className="w-1/4 p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">लिंग (Gender)</td>
                    <td className="w-1/4 p-2 font-medium text-gray-900">{staff.gender === 'बालक' || staff.gender === 'MALE' ? 'पुरुष (Male)' : 'महिला (Female)'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">आधार नंबर (Aadhaar No.)</td>
                    <td className="p-2 font-mono font-bold text-gray-900 border-r border-gray-200">{displayAadhaar}</td>
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">मतदाता परिचय पत्र (Voter ID)</td>
                    <td className="p-2 font-mono font-semibold text-gray-900">{staff.voterIdNumber || 'उपलब्ध नहीं'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">जाति (Caste)</td>
                    <td className="p-2 font-medium text-gray-900 border-r border-gray-200">{staff.caste || 'उल्लेखित नहीं'}</td>
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">सामाजिक श्रेणी (Category)</td>
                    <td className="p-2 font-medium text-gray-900">{staff.category || 'सामान्य'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">जन्म तिथि (DOB)</td>
                    <td className="p-2 font-medium text-gray-900 border-r border-gray-200">{staff.dob || '-'}</td>
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">मोबाइल नंबर (Mobile)</td>
                    <td className="p-2 font-mono font-medium text-gray-900">{staff.mobile || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: सेवा संबंधी जानकारी */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 inline-block" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  २. सेवा संबंधी जानकारी (Service & Posting Details)
                </h3>
              </div>
              <table className="w-full border-collapse border border-gray-300 text-xs">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="w-1/4 p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">कर्मचारी कोड (Employee Code)</td>
                    <td className="w-1/4 p-2 font-mono font-bold text-gray-900 border-r border-gray-200">{staff.employeeId || staff.employeeCode || '-'}</td>
                    <td className="w-1/4 p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">स्थायी यूनिक आईडी (Unique ID)</td>
                    <td className="w-1/4 p-2 font-mono font-bold text-gray-900">{staff.uniqueId || 'लागू नहीं'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">शिक्षक प्रकार (Teacher Type)</td>
                    <td className="p-2 font-bold text-emerald-800 border-r border-gray-200">{staff.teacherType || 'अन्य'}</td>
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">पदनाम (Designation)</td>
                    <td className="p-2 font-semibold text-gray-900">{staff.designation}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">वर्तमान पदस्थ विद्यालय (Current Posting)</td>
                    <td className="p-2 font-bold text-gray-900 border-r border-gray-200">{schoolName}</td>
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">शाला यूडाइस कोड (UDISE)</td>
                    <td className="p-2 font-mono font-bold text-gray-900">{staff.assignedSchoolUdise}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">पदस्थापना दिनांक (Posting Date)</td>
                    <td className="p-2 font-medium text-gray-900 border-r border-gray-200">{postingDate}</td>
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">मूल कार्यभार ग्रहण (Joining Date)</td>
                    <td className="p-2 font-medium text-gray-900">{staff.joiningDate || '-'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">शैक्षणिक योग्यता (Qualification)</td>
                    <td className="p-2 font-medium text-gray-900 border-r border-gray-200">{staff.qualification || '-'}</td>
                    <td className="p-2 bg-gray-50 font-bold text-gray-700 border-r border-gray-200">रोजगार प्रकार (Employment Type)</td>
                    <td className="p-2 font-medium text-gray-900">{staff.employmentType === 'REGULAR' ? 'नियमित (Regular)' : staff.employmentType === 'GUEST' ? 'अतिथि शिक्षक' : staff.employmentType || 'नियमित'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: अतिरिक्त दायित्व / Status */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 inline-block" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  ३. अतिरिक्त दायित्व एवं सेवा स्थिति (Additional Duties & Status)
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">BLO दायित्व</div>
                  <div className={`text-sm font-black mt-1 ${staff.isBlo ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {staff.isBlo ? '✓ हाँ (Yes)' : '✗ नहीं (No)'}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Census (जनगणना)</div>
                  <div className={`text-sm font-black mt-1 ${staff.isCensus ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {staff.isCensus ? '✓ हाँ (Yes)' : '✗ नहीं (No)'}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">OD (On Duty / विशेष कार्य)</div>
                  <div className={`text-sm font-black mt-1 ${staff.isOd ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {staff.isOd ? '✓ हाँ (Yes)' : '✗ नहीं (No)'}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">वर्तमान सेवा स्थिति</div>
                  <div className={`text-sm font-black mt-1 ${staff.status === 'ACTIVE' ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {staff.status === 'ACTIVE' ? 'सक्रिय (Active)' : staff.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Verification Signatures */}
            <div className="mt-14 pt-6 border-t-2 border-dashed border-gray-300 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="h-12" />
                <div className="font-bold text-gray-900 border-t border-gray-400 pt-1">
                  हस्ताक्षर शिक्षक / कर्मचारी
                </div>
                <div className="text-[10px] text-gray-500">({staff.name})</div>
              </div>
              <div>
                <div className="h-12" />
                <div className="font-bold text-gray-900 border-t border-gray-400 pt-1">
                  हस्ताक्षर संस्था प्रमुख / HM
                </div>
                <div className="text-[10px] text-gray-500">(सील व हस्ताक्षर)</div>
              </div>
              <div>
                <div className="h-12" />
                <div className="font-bold text-gray-900 border-t border-gray-400 pt-1">
                  संकुल प्राचार्य / जन शिक्षा केंद्र प्रभारी
                </div>
                <div className="text-[10px] text-gray-500">शा.उ.मा.वि. मलगुवां (23080110702)</div>
              </div>
            </div>

            {/* Print Footer Note */}
            <div className="mt-8 pt-2 border-t border-gray-200 text-[9px] text-gray-400 flex items-center justify-between">
              <span>कंप्यूटर जनरेटेड शिक्षक अभिलेख • जन शिक्षा केंद्र पोर्टल मलगुवां</span>
              <span>दिनांक: {new Date().toLocaleDateString('hi-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
