import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Edit2,
  Phone,
  Mail,
  School,
  Building2,
  Calendar,
  Award,
  Briefcase,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  Tag,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Staff } from '../../types';
import { School as SchoolType } from '../../types';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
  schools: SchoolType[];
  canEdit?: boolean;
  onEdit?: (staff: Staff) => void;
  onPrint?: (staff: Staff) => void;
  onPdf?: (staff: Staff) => void;
  userRole?: string;
  userAssignedUdise?: string;
  isSchoolRestricted?: boolean;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  staff,
  schools,
  canEdit = false,
  onEdit,
  onPrint,
  onPdf,
  userRole,
  userAssignedUdise,
  isSchoolRestricted = false
}) => {
  const [showFullAadhaar, setShowFullAadhaar] = useState(false);

  if (!isOpen || !staff) return null;

  // School Scope Security check
  const isUnauthorized = isSchoolRestricted && userAssignedUdise && staff.assignedSchoolUdise !== userAssignedUdise;

  if (isUnauthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
        <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            अनधिकृत पहुंच (Access Denied)
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
            आप केवल अपनी अधिकृत शाला ({userAssignedUdise}) के शिक्षक / स्टाफ की जानकारी देख सकते हैं। यह रिकॉर्ड आपकी अधिकृत शाला का नहीं है।
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition-colors"
          >
            वापस जाएं
          </button>
        </div>
      </div>
    );
  }

  const schoolObj = schools.find((s) => s.udise === staff.assignedSchoolUdise);
  const schoolName = schoolObj?.hindiName || schoolObj?.name || staff.assignedSchoolUdise;
  const postingDate = staff.postingDate || staff.joiningDate || '-';

  const rawAadhaar = staff.aadhaarNumber?.replace(/\s+/g, '') || '';
  const maskedAadhaar = rawAadhaar
    ? (showFullAadhaar
        ? `${rawAadhaar.slice(0, 4)} ${rawAadhaar.slice(4, 8)} ${rawAadhaar.slice(8, 12)}`
        : `•••• •••• ${rawAadhaar.slice(-4)}`)
    : 'उपलब्ध नहीं';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] my-6 max-h-[92vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-lg">
              {staff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {staff.name}
                </h2>
                {staff.teacherType && (
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {staff.teacherType}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  staff.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {staff.status === 'ACTIVE' ? 'सक्रिय (Active)' : staff.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {staff.designation} • {staff.subject || 'सामान्य विषय'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-teacher-profile-print"
              onClick={() => onPrint && onPrint(staff)}
              className="px-3 py-1.5 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="शिक्षक का डेटा प्रिंट करें"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">🖨️ डेटा प्रिंट करें</span>
            </button>
            <button
              id="btn-teacher-profile-pdf"
              onClick={() => onPdf && onPdf(staff)}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="PDF डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF डाउनलोड</span>
            </button>
            {canEdit && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(staff);
                }}
                className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                title="संपादित करें"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Content in Structured Sections */}
        <div className="mt-5 space-y-5 text-xs">

          {/* SECTION 1: व्यक्तिगत जानकारी */}
          <div className="bg-gray-50/70 dark:bg-[#0F1713] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                व्यक्तिगत जानकारी (Personal Details)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">शिक्षक का नाम (Teacher Name)</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">{staff.name}</span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">आधार नंबर (Aadhaar Number)</span>
                  {rawAadhaar && (
                    <button
                      type="button"
                      onClick={() => setShowFullAadhaar(!showFullAadhaar)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      {showFullAadhaar ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showFullAadhaar ? 'छिपाएं' : 'देखें'}</span>
                    </button>
                  )}
                </div>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {maskedAadhaar}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">मतदाता परिचय पत्र (Voter ID Number)</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  {staff.voterIdNumber || 'उपलब्ध नहीं'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">जाति (Caste)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {staff.caste || 'उल्लेखित नहीं'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">सामाजिक श्रेणी (Category)</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {staff.category || 'सामान्य'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">जन्म तिथि (Date of Birth)</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {staff.dob || '-'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">लिंग (Gender)</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {staff.gender === 'बालक' || staff.gender === 'MALE' ? 'पुरुष (Male)' : 'महिला (Female)'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">मोबाइल नंबर (Mobile)</span>
                <a href={`tel:${staff.mobile}`} className="font-mono font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  {staff.mobile || '-'}
                </a>
              </div>
            </div>
          </div>

          {/* SECTION 2: सेवा संबंधी जानकारी */}
          <div className="bg-gray-50/70 dark:bg-[#0F1713] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                सेवा संबंधी जानकारी (Service Details)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">कर्मचारी कोड (Employee Code)</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 inline-block">
                  {staff.employeeId || staff.employeeCode || '-'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">स्थायी यूनिक आईडी (Unique ID)</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 inline-block">
                  {staff.uniqueId || 'लागू नहीं'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">शिक्षक प्रकार (Teacher Type)</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {staff.teacherType || 'अन्य'}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">वर्तमान पदस्थापना विद्यालय (School Name)</span>
                <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{schoolName}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">यूडाइस कोड (Current Posting UDISE)</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {staff.assignedSchoolUdise}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">वर्तमान पदस्थापना दिनांक (Posting Date)</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {postingDate}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">मूल नियुक्ति / कार्यभार तिथि (Joining Date)</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {staff.joiningDate || '-'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">पदनाम (Designation)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {staff.designation}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">मुख्य अध्यापन विषय (Subject)</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {staff.subject || 'सामान्य'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">शैक्षणिक योग्यता (Qualification)</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {staff.qualification || '-'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">रोजगार प्रकार (Employment Type)</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {staff.employmentType === 'REGULAR' ? 'नियमित (Regular)' : staff.employmentType === 'GUEST' ? 'अतिथि शिक्षक' : staff.employmentType || 'नियमित'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: अतिरिक्त दायित्व / Status */}
          <div className="bg-gray-50/70 dark:bg-[#0F1713] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                अतिरिक्त दायित्व / Status (Duties & Status)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-white dark:bg-[#17211C] rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">बी.एल.ओ. दायित्व (BLO)</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Booth Level Officer निर्वाचन कार्य</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-bold text-xs flex items-center gap-1 ${
                  staff.isBlo
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {staff.isBlo ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                  <span>{staff.isBlo ? 'हाँ (Yes)' : 'नहीं (No)'}</span>
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-[#17211C] rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">जनगणना दायित्व (Census)</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">राष्ट्रीय जनसंख्या गणना कार्य</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-bold text-xs flex items-center gap-1 ${
                  staff.isCensus
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {staff.isCensus ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                  <span>{staff.isCensus ? 'हाँ (Yes)' : 'नहीं (No)'}</span>
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-[#17211C] rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">अन्य ड्यूटी (OD - On Duty)</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">विशेष प्रशासनिक या परीक्षा कार्य</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-bold text-xs flex items-center gap-1 ${
                  staff.isOd
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {staff.isOd ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                  <span>{staff.isOd ? 'हाँ (Yes)' : 'नहीं (No)'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            यूडाइस: <strong className="text-gray-800 dark:text-gray-200">{staff.assignedSchoolUdise}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
            >
              बंद करें
            </button>
            <button
              onClick={() => onPrint && onPrint(staff)}
              className="px-4 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨 विद्यार्थी/शिक्षक डेटा प्रिंट करें</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
