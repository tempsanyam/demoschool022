import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Edit2,
  Phone,
  School,
  Building2,
  Calendar,
  Award,
  Briefcase,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HeartPulse,
  CreditCard,
  Users
} from 'lucide-react';
import { Rasoiya, School as SchoolType } from '../../types';

interface RasoiyaProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  rasoiya: Rasoiya | null;
  schools: SchoolType[];
  canEdit?: boolean;
  onEdit?: (rasoiya: Rasoiya) => void;
  onPrint?: (rasoiya: Rasoiya) => void;
  userAssignedUdise?: string;
  isSchoolRestricted?: boolean;
}

export const RasoiyaProfileModal: React.FC<RasoiyaProfileModalProps> = ({
  isOpen,
  onClose,
  rasoiya,
  schools,
  canEdit = false,
  onEdit,
  onPrint,
  userAssignedUdise,
  isSchoolRestricted = false
}) => {
  const [showFullAadhaar, setShowFullAadhaar] = useState(false);

  if (!isOpen || !rasoiya) return null;

  // School Scope Security check
  const isUnauthorized = isSchoolRestricted && userAssignedUdise && rasoiya.schoolUdise !== userAssignedUdise;

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
            आप केवल अपनी अधिकृत शाला ({userAssignedUdise}) के रसोइया की जानकारी देख सकते हैं। यह रिकॉर्ड आपकी अधिकृत शाला का नहीं है।
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

  const schoolObj = schools.find((s) => s.udise === rasoiya.schoolUdise);
  const schoolName = schoolObj?.hindiName || schoolObj?.name || rasoiya.schoolName || rasoiya.schoolUdise;

  const rawAadhaar = rasoiya.aadhaarNumber?.replace(/\s+/g, '') || '';
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
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-lg">
              {rasoiya.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {rasoiya.name}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  rasoiya.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {rasoiya.status === 'ACTIVE' ? 'सक्रिय (Active)' : rasoiya.status || 'सक्रिय'}
                </span>
                {rasoiya.trainingStatus === 'TRAINED' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    प्रशिक्षित रसोइया
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    अप्रशिक्षित
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                रसोइया / मिड डे मील कार्यकर्ता • आईडी: <span className="font-mono">{rasoiya.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-rasoiya-profile-print"
              onClick={() => onPrint && onPrint(rasoiya)}
              className="px-3 py-1.5 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="रसोइया डेटा प्रिंट करें"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">डेटा प्रिंट करें</span>
            </button>
            {canEdit && onEdit && (
              <button
                id="btn-rasoiya-profile-edit"
                onClick={() => {
                  onClose();
                  onEdit(rasoiya);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">संशोधन</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 pt-4 text-xs sm:text-sm">
          {/* Linked School Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <School className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  वर्तमान पदस्थ विद्यालय (Assigned School)
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {schoolName}
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-gray-500 dark:text-gray-400">School UDISE</div>
              <div className="font-mono font-bold text-amber-800 dark:text-amber-300">{rasoiya.schoolUdise}</div>
            </div>
          </div>

          {/* Grid of details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Mobile */}
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121B17]">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                मोबाइल नंबर (Mobile)
              </div>
              <div className="font-mono font-bold text-gray-900 dark:text-white">
                {rasoiya.mobile || 'उपलब्ध नहीं'}
              </div>
            </div>

            {/* Gender */}
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121B17]">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                लिंग (Gender)
              </div>
              <div className="font-bold text-gray-900 dark:text-white">
                {rasoiya.gender === 'FEMALE' ? 'महिला (Female)' : rasoiya.gender === 'MALE' ? 'पुरुष (Male)' : 'महिला'}
              </div>
            </div>

            {/* Category & Caste */}
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121B17]">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                सामाजिक वर्ग / जाति (Category / Caste)
              </div>
              <div className="font-bold text-gray-900 dark:text-white">
                {rasoiya.category || 'OBC'} {rasoiya.caste ? `(${rasoiya.caste})` : ''}
              </div>
            </div>

            {/* Aadhaar Number with Toggle */}
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121B17]">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
                <span>आधार नंबर (Aadhaar Number)</span>
                {rawAadhaar && (
                  <button
                    type="button"
                    onClick={() => setShowFullAadhaar(!showFullAadhaar)}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline text-[10px] flex items-center gap-1 font-semibold"
                  >
                    {showFullAadhaar ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showFullAadhaar ? 'मास्क करें' : 'पूर्ण देखें'}
                  </button>
                )}
              </div>
              <div className="font-mono font-bold text-gray-900 dark:text-white">
                {maskedAadhaar}
              </div>
            </div>

            {/* Joining Date */}
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121B17]">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                कार्यभार ग्रहण दिनांक (Joining Date)
              </div>
              <div className="font-bold text-gray-900 dark:text-white">
                {rasoiya.joiningDate || 'उपलब्ध नहीं'}
              </div>
            </div>

            {/* Work Location */}
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121B17]">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                कार्यस्थल (Work Location)
              </div>
              <div className="font-bold text-gray-900 dark:text-white">
                {rasoiya.workLocation || 'विद्यालय मध्याह्न भोजन रसोई शेड'}
              </div>
            </div>
          </div>

          {/* Section: SHG Association */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#121B17]/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
              <Users className="w-4 h-4 text-emerald-600" />
              संबद्ध स्व-सहायता समूह (SHG / Samuh Details)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">समूह का नाम: </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {rasoiya.shgName || 'माँ शारदा स्व-सहायता समूह'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">समूह आईडी: </span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  {rasoiya.shgId || 'उपलब्ध नहीं'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Cooking Training & Health Checkup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                <Award className="w-4 h-4 text-blue-600" />
                पाककला प्रशिक्षण स्थिति (Cooking Training)
              </div>
              <div className="flex items-center gap-2">
                {rasoiya.trainingStatus === 'TRAINED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-600" />
                )}
                <span className="font-bold text-gray-900 dark:text-white">
                  {rasoiya.trainingStatus === 'TRAINED' ? 'प्रशिक्षित (Trained Cook)' : 'अप्रशिक्षित (Untrained)'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                स्वच्छता एवं पोषण सुरक्षा मानकों पर संकुल स्तरीय प्रशिक्षण
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                स्वास्थ्य परीक्षण स्थिति (Health Checkup)
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-gray-900 dark:text-white">
                  {rasoiya.healthCheckupStatus === 'UP_TO_DATE'
                    ? 'अद्यतन (Up to Date - प्रमाणित)'
                    : rasoiya.healthCheckupStatus === 'REGULAR'
                    ? 'नियमित (Regular)'
                    : 'लंबित (Pending)'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                अंतिम परीक्षण दिनांक: {rasoiya.lastHealthCheckupDate || '2026-02-15'}
              </p>
            </div>
          </div>

          {/* Section: Bank & Payment Details */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#121B17]/70 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              बैंक खाता एवं मानदेय विवरण (Bank & Honorarium Details)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">बैंक का नाम (Bank Name)</div>
                <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                  {rasoiya.bankName || 'State Bank of India'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">खाता क्रमांक (Account No.)</div>
                <div className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">
                  {rasoiya.bankAccount || '38920194821'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">IFSC कोड</div>
                <div className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">
                  {rasoiya.ifsc || 'SBIN0001234'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">मानदेय स्थिति (Payment Status)</div>
                <div className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {rasoiya.paymentStatus === 'PAID'
                    ? 'भुगतान पूर्ण (Paid)'
                    : rasoiya.paymentStatus === 'PROCESSING'
                    ? 'प्रक्रियाधीन (Processing)'
                    : 'लंबित (Pending)'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">मासिक मानदेय राशि</div>
                <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                  ₹{rasoiya.monthlyHonorarium || 2000} /- प्रतिमाह
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">समग्र आईडी (Samagra ID)</div>
                <div className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">
                  {rasoiya.samagraId || 'उपलब्ध नहीं'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
