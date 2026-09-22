import React, { useState } from 'react';
import { X, Search, Printer, ArrowRightLeft, Edit2, Eye, School as SchoolIcon, Filter } from 'lucide-react';
import { Student, School } from '../../types';
import { StudentTransferRecord } from '../../types/session';

interface TransferRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfers: StudentTransferRecord[];
  students: Student[];
  schools: School[];
  selectedSessionId: string;
  onEditTransfer: (student: Student, transfer: StudentTransferRecord) => void;
  onViewCertificate: (student: Student, transfer: StudentTransferRecord) => void;
  canMutate: boolean;
}

export const TransferRegisterModal: React.FC<TransferRegisterModalProps> = ({
  isOpen,
  onClose,
  transfers,
  students,
  schools,
  selectedSessionId,
  onEditTransfer,
  onViewCertificate,
  canMutate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredTransfers = transfers.filter((t) => {
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (t.studentName && t.studentName.toLowerCase().includes(q)) ||
      (t.samagraId && t.samagraId.includes(q)) ||
      (t.tcNumber && t.tcNumber.toLowerCase().includes(q)) ||
      (t.destinationSchoolName && t.destinationSchoolName.toLowerCase().includes(q)) ||
      (t.destinationSchoolUdise && t.destinationSchoolUdise.toLowerCase().includes(q)) ||
      (t.newSchoolName && t.newSchoolName.toLowerCase().includes(q)) ||
      (t.newSchoolUdise && t.newSchoolUdise.toLowerCase().includes(q)) ||
      (t.oldSchoolName && t.oldSchoolName.toLowerCase().includes(q)) ||
      (t.oldSchoolUdise && t.oldSchoolUdise.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1A2620] rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-amber-700 to-amber-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ArrowRightLeft className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                स्थानांतरण प्रमाण-पत्र (TC) पंजी (TC Register)
              </h3>
              <p className="text-xs text-amber-200">
                सत्र {selectedSessionId} • जारी किए गए कुल {transfers.length} स्थानांतरण प्रमाण-पत्र
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-gray-50 dark:bg-[#15201A] border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="विद्यार्थी नाम, समग्र आईडी, TC क्रमांक, गंतव्य शाला..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            प्रदर्शित: {filteredTransfers.length} अभिलेख
          </span>
        </div>

        {/* Transfers Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600 opacity-60" />
              <p className="font-bold text-sm text-gray-600 dark:text-gray-400">
                कोई स्थानांतरण प्रमाण-पत्र नहीं मिला
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                विद्यार्थी तालिका में "स्थानांतरण (TC)" बटन का उपयोग कर नया TC जारी करें।
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-[#121B17] text-gray-700 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="p-3">क्र.</th>
                    <th className="p-3">टीसी क्रमांक व दिनांक</th>
                    <th className="p-3">विद्यार्थी का नाम व समग्र</th>
                    <th className="p-3">मूल शाला (From)</th>
                    <th className="p-3">गंतव्य शाला (Destination)</th>
                    <th className="p-3">कक्षा</th>
                    <th className="p-3 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredTransfers.map((tc, idx) => {
                    const studentObj = students.find((s) => s.id === tc.studentId) || {
                      id: tc.studentId,
                      name: tc.studentName,
                      samagraId: tc.samagraId,
                      class: tc.oldClass || '1',
                      schoolUdise: tc.oldSchoolUdise,
                      fatherName: '-',
                      motherName: '-',
                      dob: '-',
                      gender: 'बालक',
                      category: 'OBC',
                      status: 'ACTIVE',
                    } as Student;

                    const destName = (
                      tc.destinationSchoolName ||
                      (tc.newSchoolName && tc.newSchoolName !== 'OTHER' && tc.newSchoolName !== 'अन्य विद्यालय (Other)'
                        ? tc.newSchoolName
                        : '') ||
                      ''
                    ).trim();

                    const destUdise = (
                      tc.destinationSchoolUdise ||
                      (tc.newSchoolUdise && tc.newSchoolUdise !== 'OTHER' ? tc.newSchoolUdise : '') ||
                      ''
                    ).trim();

                    return (
                      <tr
                        key={tc.id}
                        className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors"
                      >
                        <td className="p-3 font-mono font-medium text-gray-400">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-mono font-bold text-amber-900 dark:text-amber-300">
                            {tc.tcNumber || 'अप्रकाशित'}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {tc.tcDate || tc.transferDate}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {tc.studentName}
                          </div>
                          <div className="font-mono text-[11px] text-gray-500">
                            समग्र: {tc.samagraId}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-gray-800 dark:text-gray-200">
                            {tc.oldSchoolName}
                          </div>
                          <div className="font-mono text-[10px] text-gray-400">
                            {tc.oldSchoolUdise}
                          </div>
                        </td>
                        <td className="p-3">
                          {destName && (
                            <div className="font-bold text-gray-900 dark:text-white">
                              {destName}
                            </div>
                          )}
                          {destUdise && (
                            <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
                              DISE: {destUdise}
                            </div>
                          )}
                          {!destName && !destUdise && (
                            <span className="text-gray-400 italic">विवरण नहीं</span>
                          )}
                        </td>
                        <td className="p-3 font-medium">
                          कक्षा {tc.oldClass || '1'} → {tc.newClass || tc.oldClass}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewCertificate(studentObj, tc)}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              title="टीसी प्रमाण-पत्र देखें व प्रिंट करें"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>देखें / प्रिंट</span>
                            </button>
                            {canMutate && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onEditTransfer(studentObj, tc);
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                title="टीसी विवरण संशोधित करें"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>संशोधित करें</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-50 dark:bg-[#111A15] border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            मध्य प्रदेश स्कूल शिक्षा विभाग स्थानांतरण प्रारूप अनुसार
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition-colors"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
