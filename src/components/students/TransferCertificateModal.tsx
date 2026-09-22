import React from 'react';
import { Printer, X, Download, ShieldCheck, CheckCircle2, ArrowRightLeft, Edit2, School as SchoolIcon } from 'lucide-react';
import { Student, School } from '../../types';
import { StudentTransferRecord } from '../../types/session';

interface TransferCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  transferRecord: Partial<StudentTransferRecord> | null;
  schools: School[];
  onEdit?: () => void;
}

export const TransferCertificateModal: React.FC<TransferCertificateModalProps> = ({
  isOpen,
  onClose,
  student,
  transferRecord,
  schools,
  onEdit,
}) => {
  if (!isOpen || !student || !transferRecord) return null;

  const sourceSchool = schools.find((s) => s.udise === (transferRecord.oldSchoolUdise || student.schoolUdise));
  const schoolName = sourceSchool?.name || sourceSchool?.hindiName || transferRecord.oldSchoolName || student.schoolUdise;
  const schoolUdise = sourceSchool?.udise || transferRecord.oldSchoolUdise || student.schoolUdise;

  const destSchoolName = (
    transferRecord.destinationSchoolName ||
    (transferRecord.newSchoolName && transferRecord.newSchoolName !== 'OTHER' && transferRecord.newSchoolName !== 'अन्य विद्यालय (Other)'
      ? transferRecord.newSchoolName
      : '') ||
    ''
  ).trim();

  const destSchoolUdise = (
    transferRecord.destinationSchoolUdise ||
    (transferRecord.newSchoolUdise && transferRecord.newSchoolUdise !== 'OTHER' ? transferRecord.newSchoolUdise : '') ||
    ''
  ).trim();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1A2620] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-amber-700 to-amber-900 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <SchoolIcon className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">शाला स्थानांतरण प्रमाण-पत्र (Transfer Certificate)</h3>
              <p className="text-xs text-amber-200">
                टीसी क्रमांक: <span className="font-mono font-bold text-white">{transferRecord.tcNumber || 'अप्रकाशित'}</span> • दिनांक: {transferRecord.tcDate || new Date().toISOString().split('T')[0]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>संशोधित करें (Edit)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white text-amber-900 hover:bg-amber-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-amber-50/20 dark:bg-[#121B17]">
          <div
            id="official-transfer-certificate-printable"
            className="bg-white dark:bg-[#15201A] p-6 sm:p-8 rounded-xl border-2 border-amber-900/40 dark:border-amber-700/60 shadow-md text-gray-900 dark:text-gray-100 max-w-2xl mx-auto"
          >
            {/* Header / Emblems */}
            <div className="text-center border-b-2 border-amber-900/30 pb-4 mb-5">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                मध्य प्रदेश शासन • स्कूल शिक्षा विभाग (Government of Madhya Pradesh)
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-amber-950 dark:text-amber-200">
                {schoolName}
              </h1>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                <span>यूडाइस कोड (UDISE): <strong className="font-mono text-gray-900 dark:text-white">{schoolUdise}</strong></span>
                {sourceSchool?.block && <span>विकासखंड: {sourceSchool.block}</span>}
                {sourceSchool?.district && <span>जिला: {sourceSchool.district} (म.प्र.)</span>}
              </div>

              <div className="mt-3 inline-block px-4 py-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-md font-bold text-xs sm:text-sm tracking-wide text-amber-900 dark:text-amber-200">
                शाला स्थानांतरण प्रमाण-पत्र (TRANSFER CERTIFICATE)
              </div>
            </div>

            {/* TC Meta Row */}
            <div className="grid grid-cols-2 text-xs font-bold border-b border-gray-200 dark:border-gray-800 pb-3 mb-4 text-gray-700 dark:text-gray-300">
              <div>
                टीसी क्रमांक (TC No.): <span className="font-mono text-amber-900 dark:text-amber-300 font-extrabold">{transferRecord.tcNumber || 'टीसी-प्रारूप'}</span>
              </div>
              <div className="text-right">
                दिनांक (Date of Issue): <span className="font-mono">{transferRecord.tcDate || new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            {/* Key Particulars */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-baseline justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5">
                <span className="text-gray-500 dark:text-gray-400">१. विद्यार्थी का पूरा नाम (Full Name of Pupil):</span>
                <strong className="text-sm font-bold text-gray-900 dark:text-white">{student.name}</strong>
              </div>

              <div className="flex items-baseline justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5">
                <span className="text-gray-500 dark:text-gray-400">२. ९-अंकीय समग्र सदस्य आईडी (Samagra ID):</span>
                <strong className="font-mono font-bold text-gray-900 dark:text-white">{student.samagraId}</strong>
              </div>

              <div className="flex items-baseline justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5">
                <span className="text-gray-500 dark:text-gray-400">३. पिता का नाम (Father's Name):</span>
                <strong className="font-semibold text-gray-900 dark:text-white">{student.fatherName}</strong>
              </div>

              <div className="flex items-baseline justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5">
                <span className="text-gray-500 dark:text-gray-400">४. माता का नाम (Mother's Name):</span>
                <strong className="font-semibold text-gray-900 dark:text-white">{student.motherName}</strong>
              </div>

              <div className="flex items-baseline justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5">
                <span className="text-gray-500 dark:text-gray-400">५. जन्म दिनांक (Date of Birth):</span>
                <strong className="font-mono text-gray-900 dark:text-white">{student.dob}</strong>
              </div>

              <div className="flex items-baseline justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5">
                <span className="text-gray-500 dark:text-gray-400">६. सामाजिक वर्ग एवं लिंग (Category & Gender):</span>
                <span className="text-gray-900 dark:text-white font-medium">{student.category} • {student.gender}</span>
              </div>

              <div className="flex items-baseline justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5">
                <span className="text-gray-500 dark:text-gray-400">७. उत्तीर्ण / अध्ययनरत कक्षा (Class Last Studied):</span>
                <span className="font-bold text-gray-900 dark:text-white">कक्षा {student.class} ({student.section || 'A'})</span>
              </div>

              <div className="flex items-baseline justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5">
                <span className="text-gray-500 dark:text-gray-400">८. नवीन प्रवेश योग्य कक्षा (Class Qualified for Admission):</span>
                <span className="font-bold text-amber-800 dark:text-amber-300">कक्षा {transferRecord.newClass || student.class}</span>
              </div>

              {/* Destination School */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 text-xs space-y-1.5">
                <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1">
                  ९. गंतव्य विद्यालय (Destination School)
                </div>
                {destSchoolName && (
                  <div className="flex items-baseline justify-between border-b border-dashed border-amber-200 dark:border-amber-800/60 pb-1">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">गंतव्य विद्यालय:</span>
                    <strong className="text-gray-900 dark:text-white font-bold">{destSchoolName}</strong>
                  </div>
                )}
                {destSchoolUdise && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">DISE/UDISE Code:</span>
                    <strong className="font-mono font-bold text-gray-900 dark:text-white">{destSchoolUdise}</strong>
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5">
                <span className="text-gray-500 dark:text-gray-400">१०. शाला छोड़ने का कारण (Reason for Leaving):</span>
                <span className="text-gray-900 dark:text-white font-medium">{transferRecord.reason || 'निवास परिवर्तन'}</span>
              </div>

              <div className="flex items-baseline justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5">
                <span className="text-gray-500 dark:text-gray-400">११. आचरण एवं चरित्र (Conduct and Character):</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">उत्कृष्ट (Good)</span>
              </div>
            </div>

            {/* Certification Statement */}
            <p className="mt-5 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed italic border-t border-gray-200 dark:border-gray-800 pt-3">
              प्रमाणित किया जाता है कि उपरोक्त विवरण विद्यालय के आधिकारिक छात्र रजिस्टर (Scholar Register) एवं समग्र अभिलेख के अनुसार पूर्णतः सत्य एवं सत्यापित है। विद्यार्थी का नाम रजिस्टर से प्रथक किया गया है।
            </p>

            {/* Signatures */}
            <div className="mt-8 pt-6 grid grid-cols-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 gap-4">
              <div>
                <div className="h-10"></div>
                <div className="border-t border-gray-400 pt-1">हस्ताक्षर कक्षा शिक्षक</div>
                <div className="text-[10px] text-gray-400 font-normal">Class Teacher</div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="border-t border-gray-400 pt-1">जांचकर्ता (लिपिक)</div>
                <div className="text-[10px] text-gray-400 font-normal">Checked By</div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="border-t border-gray-400 pt-1">मुख्याध्यापक / प्राचार्य (सील)</div>
                <div className="text-[10px] text-gray-400 font-normal">Headmaster / Principal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-gray-50 dark:bg-[#111A15] border-t border-gray-100 dark:border-gray-800 flex items-center justify-between print:hidden">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            A4 आकार में आधिकारिक मुद्रण हेतु तैयार
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-xs transition-colors"
            >
              बंद करें
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>प्रमाण-पत्र प्रिंट करें</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
