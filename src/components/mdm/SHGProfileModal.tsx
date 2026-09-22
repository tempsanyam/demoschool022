import React from 'react';
import {
  X,
  Printer,
  Edit2,
  Phone,
  School,
  Building2,
  Calendar,
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { SHG, School as SchoolType } from '../../types';

interface SHGProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  shg: SHG | null;
  schools: SchoolType[];
  canEdit?: boolean;
  onEdit?: (shg: SHG) => void;
  onPrint?: (shg: SHG) => void;
  userAssignedUdise?: string;
  isSchoolRestricted?: boolean;
}

export const SHGProfileModal: React.FC<SHGProfileModalProps> = ({
  isOpen,
  onClose,
  shg,
  schools,
  canEdit = false,
  onEdit,
  onPrint,
  userAssignedUdise,
  isSchoolRestricted = false
}) => {
  if (!isOpen || !shg) return null;

  // School Scope Security check
  const isUnauthorized = isSchoolRestricted && userAssignedUdise && shg.schoolUdise !== userAssignedUdise;

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
            आप केवल अपनी अधिकृत शाला ({userAssignedUdise}) के स्व-सहायता समूह की जानकारी देख सकते हैं। यह रिकॉर्ड आपकी अधिकृत शाला का नहीं है।
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

  const schoolObj = schools.find((s) => s.udise === shg.schoolUdise);
  const schoolName = schoolObj?.hindiName || schoolObj?.name || shg.schoolName || shg.schoolUdise;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] my-6 max-h-[92vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {shg.name}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  shg.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {shg.status === 'ACTIVE' ? 'सक्रिय (Active)' : shg.status || 'सक्रिय'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {shg.members?.length || shg.totalMembers || 5} सदस्य
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                स्व-सहायता समूह (SHG) • पंजीयन क्रमांक: <span className="font-mono">{shg.registrationNumber || 'SHG-REG-01'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-shg-profile-print"
              onClick={() => onPrint && onPrint(shg)}
              className="px-3 py-1.5 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="समूह विवरण प्रिंट करें"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">प्रिंट करें</span>
            </button>
            {canEdit && onEdit && (
              <button
                id="btn-shg-profile-edit"
                onClick={() => {
                  onClose();
                  onEdit(shg);
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

        {/* Content */}
        <div className="space-y-4 pt-4 text-xs sm:text-sm">
          {/* Linked School */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <School className="w-5 h-5 text-indigo-700 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300">
                  संबद्ध विद्यालय (Linked School for MDM)
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {schoolName}
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-gray-500 dark:text-gray-400">School UDISE</div>
              <div className="font-mono font-bold text-indigo-800 dark:text-indigo-300">{shg.schoolUdise}</div>
            </div>
          </div>

          {/* Key Office Bearers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* President */}
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-[#121B17]">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                समूह अध्यक्ष (President)
              </div>
              <div className="font-bold text-base text-gray-900 dark:text-white">
                {shg.presidentName}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mt-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {shg.presidentMobile || 'मोबाइल नंबर दर्ज नहीं'}
              </div>
            </div>

            {/* Secretary */}
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-[#121B17]">
              <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                समूह सचिव (Secretary)
              </div>
              <div className="font-bold text-base text-gray-900 dark:text-white">
                {shg.secretaryName}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mt-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {shg.secretaryMobile || 'मोबाइल नंबर दर्ज नहीं'}
              </div>
            </div>
          </div>

          {/* Formation date & Total members */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121B17]">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                गठन / पंजीयन दिनांक
              </div>
              <div className="font-bold text-gray-900 dark:text-white">
                {shg.formationDate || '2020-07-15'}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121B17]">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                कुल सदस्य संख्या
              </div>
              <div className="font-bold text-gray-900 dark:text-white">
                {shg.totalMembers || shg.members?.length || 5} सदस्य
              </div>
            </div>
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121B17]">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                पंजीयन क्रमांक
              </div>
              <div className="font-mono font-bold text-gray-900 dark:text-white">
                {shg.registrationNumber || 'SHG-REG-01'}
              </div>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#121B17]/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              समूह बैंक खाता विवरण (SHG Joint Bank Account)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">बैंक का नाम (Bank)</div>
                <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                  {shg.bankName || 'State Bank of India'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">समूह खाता क्रमांक (A/C No.)</div>
                <div className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">
                  {shg.accountNumber || '48201948201'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">IFSC कोड</div>
                <div className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">
                  {shg.ifsc || 'SBIN0001234'}
                </div>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#121B17]/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                <Users className="w-4 h-4 text-indigo-600" />
                समूह के सक्रिय सदस्य सूची (Members List)
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                कुल {shg.members?.length || 0} सदस्य
              </span>
            </div>

            {shg.members && shg.members.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-[#17211C]">
                {shg.members.map((m, idx) => (
                  <div key={m.id || idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[10px] text-gray-600 dark:text-gray-400">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{m.name}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">{m.role || 'सदस्य'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {m.mobile && <div className="font-mono text-gray-700 dark:text-gray-300">{m.mobile}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-gray-500">
                कोई अतिरिक्त सदस्य दर्ज नहीं है। (अध्यक्ष व सचिव मुख्य पदाधिकारी हैं)
              </div>
            )}
          </div>

          {shg.remarks && (
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800/60 text-xs text-gray-700 dark:text-gray-300">
              <span className="font-bold">विशेष टिप्पणी: </span>
              {shg.remarks}
            </div>
          )}
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
