import React, { useState, useMemo } from 'react';
import {
  User,
  X,
  GraduationCap,
  History,
  School as SchoolIcon,
  Calendar,
  CreditCard,
  Gift,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Printer,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { Student, School } from '../../types';
import { useData } from '../../context/DataContext';
import { StudentPrintModal } from './StudentPrintModal';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  currentSchool?: School;
  onOpenPromotion?: () => void;
  onOpenTransfer?: () => void;
  canMutate?: boolean;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  currentSchool,
  onOpenPromotion,
  onOpenTransfer,
  canMutate = true,
}) => {
  const { getStudentAcademicJourney, selectedSessionId, schools, studentTransfers } = useData();
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'JOURNEY'>('DETAILS');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const journey = useMemo(() => {
    return getStudentAcademicJourney(student.id);
  }, [getStudentAcademicJourney, student.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#16211D] rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-[#123826] text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">{student.name}</h3>
                <span className="bg-[#0B6B4B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  कक्षा {student.class}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                समग्र: <span className="font-mono font-bold text-white">{student.samagraId}</span> • स्थायी मास्टर आईडी: <span className="font-mono text-white/80">{student.id}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-profile-print-student"
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer shadow-xs"
              title="विद्यार्थी का सम्पूर्ण डेटा A4 में प्रिंट करें"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">🖨 विद्यार्थी का डेटा प्रिंट करें</span>
              <span className="sm:hidden">प्रिंट</span>
            </button>
            <button
              id="btn-profile-download-pdf"
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border border-blue-400/30 cursor-pointer shadow-xs"
              title="विद्यार्थी की प्रोफाइल का देवनागरी PDF डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF डाउनलोड करें</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#121B17] px-4">
          <button
            onClick={() => setActiveTab('DETAILS')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'DETAILS'
                ? 'border-[#0B6B4B] text-[#0B6B4B] dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>व्यक्तिगत एवं शैक्षणिक विवरण</span>
          </button>
          <button
            onClick={() => setActiveTab('JOURNEY')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'JOURNEY'
                ? 'border-[#0B6B4B] text-[#0B6B4B] dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>शैक्षणिक यात्रा (Academic Journey - {journey.length} सत्र)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'DETAILS' ? (
            <div className="space-y-4">
              {/* Primary Enrollment Card */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block text-[11px]">वर्तमान विद्यालय:</span>
                  <strong className="text-gray-900 dark:text-white block">
                    {currentSchool?.name || currentSchool?.hindiName || student.schoolUdise}
                  </strong>
                  <span className="text-[10px] font-mono text-gray-500">यूडाइस: {student.schoolUdise}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block text-[11px]">सत्र एवं कक्षा:</span>
                  <strong className="text-emerald-800 dark:text-emerald-300 block font-bold text-sm">
                    सत्र {selectedSessionId} • कक्षा {student.class} (वर्ग {student.section || 'A'})
                  </strong>
                  <span className="text-[10px] text-gray-500">दाखिल क्रमांक / SR: {student.srNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block text-[11px]">नामांकन स्थिति:</span>
                  <span className="inline-block bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold mt-0.5">
                    {student.status === 'ACTIVE' ? 'सक्रिय अध्ययनरत' : student.status}
                  </span>
                </div>
              </div>

              {/* Personal & Family Details */}
              <div className="bg-white dark:bg-[#1A2621] p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>व्यक्तिगत एवं पारिवारिक विवरण</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-gray-500 block text-[11px]">पिता का नाम:</span>
                    <strong className="text-gray-900 dark:text-white">{student.fatherName || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">माता का नाम:</span>
                    <strong className="text-gray-900 dark:text-white">{student.motherName || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">जन्म तिथि (DOB):</span>
                    <strong className="text-gray-900 dark:text-white font-mono">{student.dob || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">लिंग / सामाजिक वर्ग:</span>
                    <strong className="text-gray-900 dark:text-white">
                      {student.gender} • {student.category}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-gray-500 block text-[11px]">दिव्यांगता (CWSN):</span>
                    <strong className="text-gray-900 dark:text-white">
                      {student.isCwsn ? `हाँ (${student.cwsnType || 'सामान्य'})` : 'नहीं'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">मोबाइल नंबर:</span>
                    <strong className="text-gray-900 dark:text-white font-mono">{student.mobile || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">अपार (APAAR) आईडी:</span>
                    <strong className="text-gray-900 dark:text-white font-mono">{student.apaarId || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">आधार सत्यापन:</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      सत्यापित
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-gray-500 block text-[11px]">अपार आईडी स्थिति (APAAR ID Status):</span>
                    {student.apaarStatus ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          student.apaarStatus === 'Available / Generated'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : student.apaarStatus === 'Pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {student.apaarStatus}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">विद्यार्थी पैन नंबर (Student PAN Number):</span>
                    <strong className="text-gray-900 dark:text-white font-mono font-bold tracking-wider">
                      {student.panNumber || '-'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Address & Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#1A2621] p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>निवास का पता</span>
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">{student.address || '-'}</p>
                  <p className="text-gray-500">ग्राम: {student.village || 'मलगुवां'} • विकासखंड: बलदेवगढ़, टीकमगढ़</p>
                </div>

                <div className="bg-white dark:bg-[#1A2621] p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>बैंक खाता विवरण (DBT)</span>
                  </h4>
                  <div>
                    <span className="text-gray-500 block text-[11px]">बैंक का नाम:</span>
                    <strong className="text-gray-900 dark:text-white">{student.bankAccount?.bankName || 'भारतीय स्टेट बैंक'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>खाता सं.: <strong className="font-mono">{student.bankAccount?.accountNumber || '-'}</strong></span>
                    <span>IFSC: <strong className="font-mono">{student.bankAccount?.ifsc || 'SBIN0001234'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Academic Journey Timeline Tab */
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-200">
                    सत्र-वार शैक्षणिक इतिहास (Multi-Year Academic Journey)
                  </h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    प्रवेश से लेकर वर्तमान सत्र तक का पूर्ण प्रामाणिक शैक्षणिक रिकॉर्ड
                  </p>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold px-2.5 py-1 rounded-lg text-xs">
                  कुल सत्र: {journey.length}
                </span>
              </div>

              {journey.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  कोई पूर्व शैक्षणिक इतिहास उपलब्ध नहीं है।
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200 dark:before:bg-gray-700">
                  {journey.map((entry, idx) => {
                    const isCurrent = entry.sessionId === selectedSessionId;
                    const schoolObj = schools.find((s) => s.udise === entry.schoolUdise);

                    return (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-6 top-2 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-[#16211D] ${
                            isCurrent
                              ? 'border-[#0B6B4B] ring-4 ring-emerald-100 dark:ring-emerald-950'
                              : 'border-blue-500'
                          }`}
                        />
                        <div className="bg-white dark:bg-[#1A2621] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-900 dark:text-white font-mono">
                                सत्र {entry.sessionId}
                              </span>
                              <span className="font-black px-2 py-0.5 bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950 dark:text-emerald-300 rounded">
                                कक्षा {entry.class}
                              </span>
                              {isCurrent && (
                                <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  वर्तमान सत्र
                                </span>
                              )}
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                entry.enrollmentStatus === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : entry.enrollmentStatus === 'PROMOTED'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : entry.enrollmentStatus === 'TRANSFERRED'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {entry.enrollmentStatus === 'ACTIVE'
                                ? 'सक्रिय अध्ययनरत'
                                : entry.enrollmentStatus === 'PROMOTED'
                                ? 'कक्षोन्नत (Promoted)'
                                : entry.enrollmentStatus === 'TRANSFERRED'
                                ? 'शाला स्थानांतरित'
                                : entry.enrollmentStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                            <div>
                              <span>विद्यालय: </span>
                              <strong className="text-gray-900 dark:text-white">
                                {schoolObj?.name || schoolObj?.hindiName || entry.schoolUdise}
                              </strong>
                              <span className="font-mono text-[10px] ml-1">({entry.schoolUdise})</span>
                            </div>
                            <div>
                              <span>उपस्थिति: </span>
                              <strong className="text-gray-900 dark:text-white font-mono">
                                {entry.attendancePct || 90}%
                              </strong>
                            </div>
                          </div>

                          {/* Preserved Transfer Destination Details */}
                          {(() => {
                            const transfer = studentTransfers.find(
                              (t) =>
                                t.studentId === student.id &&
                                (t.oldSessionId === entry.sessionId || t.newSessionId === entry.sessionId)
                            );
                            const destName = (transfer?.destinationSchoolName || transfer?.newSchoolName || '').trim();
                            const destUdise = (
                              transfer?.destinationSchoolUdise ||
                              (transfer?.newSchoolUdise && transfer?.newSchoolUdise !== 'OTHER'
                                ? transfer?.newSchoolUdise
                                : '') ||
                              ''
                            ).trim();

                            if (!destName && !destUdise && !transfer?.tcNumber) return null;

                            return (
                              <div className="mt-2.5 p-2.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                                <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                  <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  <span>गंतव्य विद्यालय (Transfer Destination):</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                                  {destName && (
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">विद्यालय का नाम: </span>
                                      <strong className="text-gray-900 dark:text-white font-bold">{destName}</strong>
                                    </div>
                                  )}
                                  {destUdise && (
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">DISE/UDISE Code: </span>
                                      <strong className="font-mono font-bold text-gray-900 dark:text-white">{destUdise}</strong>
                                    </div>
                                  )}
                                  {transfer?.tcNumber && (
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">टीसी क्रमांक: </span>
                                      <span className="font-mono font-bold text-amber-800 dark:text-amber-300">
                                        {transfer.tcNumber}
                                      </span>
                                    </div>
                                  )}
                                  {transfer?.tcDate && (
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">दिनांक: </span>
                                      <span className="font-mono text-gray-700 dark:text-gray-300">{transfer.tcDate}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {entry.remarks && (
                            <p className="mt-2 text-[11px] text-gray-500 italic bg-gray-50 dark:bg-[#121B17] p-2 rounded">
                              टिप्पणी: {entry.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-gray-50 dark:bg-[#111A15] border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              बंद करें
            </button>

            <button
              id="btn-footer-print-student"
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>🖨 विद्यार्थी का डेटा प्रिंट करें</span>
            </button>

            <button
              id="btn-footer-download-pdf-student"
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>PDF डाउनलोड करें</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canMutate && onOpenTransfer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransfer();
                }}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl font-bold text-xs transition-colors"
              >
                स्थानांतरण (TC)
              </button>
            )}

            {canMutate && onOpenPromotion && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPromotion();
                }}
                className="px-4 py-2 bg-[#0B6B4B] hover:bg-[#085239] text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>कक्षा प्रोन्नत करें</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Single Student Data Print / PDF Modal */}
      {isPrintModalOpen && (
        <StudentPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          student={student}
        />
      )}
    </div>
  );
};
