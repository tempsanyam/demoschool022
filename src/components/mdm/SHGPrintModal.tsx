import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { SHG, School as SchoolType } from '../../types';
import { institutionConfig } from '../../config/institutionConfig';

interface SHGPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  shg: SHG | null;
  schools: SchoolType[];
  session?: string;
}

export const SHGPrintModal: React.FC<SHGPrintModalProps> = ({
  isOpen,
  onClose,
  shg,
  schools,
  session,
}) => {
  if (!isOpen || !shg) return null;

  const schoolObj = schools.find((s) => s.udise === shg.schoolUdise);
  const schoolName = schoolObj?.hindiName || schoolObj?.name || shg.schoolName || shg.schoolUdise;
  const displaySession = session || shg.sessionId || '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] my-6 max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 no-print">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <Printer className="w-4 h-4 text-[#0B6B4B]" />
            स्व-सहायता समूह (SHG) अभिलेख पत्रक
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#0B6B4B] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              प्रिंट / PDF निकालें
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="mt-4 p-6 border-2 border-gray-800 bg-white text-black print:m-0 print:p-4 print:border-none rounded-xl" id="shg-print-area">
          {/* Official Header */}
          <div className="text-center pb-4 border-b-2 border-gray-800 mb-4">
            <div className="text-xs font-bold tracking-widest text-gray-700 uppercase">
              मध्य प्रदेश शासन • स्कूल शिक्षा विभाग एवं पंचायत एवं ग्रामीण विकास विभाग
            </div>
            <h1 className="text-base sm:text-lg font-black mt-0.5">
              मध्याह्न भोजन (पीएम-पोषण) स्व-सहायता समूह (SHG) आधिकारिक विवरण पत्रक
            </h1>
            <div className="text-xs font-bold text-gray-800 mt-1">
              संकुल: {institutionConfig.sankulName || 'संकुल मलगुवां'} | ब्लॉक: {institutionConfig.block || 'बलदेवगढ़'} | जिला: {institutionConfig.district || 'टीकमगढ़'}
            </div>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="px-3 py-1 bg-gray-100 border border-gray-600 rounded text-xs font-black uppercase">
                समूह पंजीयन एवं शाला सहभागिता प्रमाण पत्र
              </div>
              {displaySession && (
                <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-600 rounded text-xs font-bold text-emerald-900">
                  सत्र: {displaySession}
                </div>
              )}
            </div>
          </div>

          {/* Details Table */}
          <table className="w-full text-xs border-collapse border border-gray-600 my-2">
            <tbody>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400 w-1/3">समूह का नाम</td>
                <td className="p-2 font-bold text-sm">{shg.name}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">समूह आईडी / पंजीयन क्रमांक</td>
                <td className="p-2 font-mono font-bold">{shg.id} ({shg.registrationNumber || 'पंजीकृत'})</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">संबद्ध विद्यालय (Linked School)</td>
                <td className="p-2 font-bold">{schoolName}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">शाला UDISE कोड</td>
                <td className="p-2 font-mono font-bold">{shg.schoolUdise}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">अध्यक्ष (President)</td>
                <td className="p-2 font-semibold">
                  {shg.presidentName} {shg.presidentMobile ? `(मो. ${shg.presidentMobile})` : ''}
                </td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">सचिव (Secretary)</td>
                <td className="p-2 font-semibold">
                  {shg.secretaryName} {shg.secretaryMobile ? `(मो. ${shg.secretaryMobile})` : ''}
                </td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">गठन / पंजीयन दिनांक</td>
                <td className="p-2">{shg.formationDate || '2020-07-15'}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">कुल सदस्य संख्या</td>
                <td className="p-2 font-bold">{shg.totalMembers || shg.members?.length || 5} सदस्य</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">संयुक्त बैंक खाता विवरण</td>
                <td className="p-2">
                  बैंक: {shg.bankName || 'SBI'} | खाता क्र.: <span className="font-mono">{shg.accountNumber || '-'}</span> | IFSC: <span className="font-mono">{shg.ifsc || '-'}</span>
                </td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">समूह स्थिति (Status)</td>
                <td className="p-2 font-bold">
                  {shg.status === 'ACTIVE' ? 'सक्रिय (Active)' : shg.status || 'सक्रिय'}
                </td>
              </tr>
              {shg.remarks && (
                <tr className="border-b border-gray-400">
                  <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">विशेष टिप्पणी</td>
                  <td className="p-2">{shg.remarks}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Members Table */}
          {shg.members && shg.members.length > 0 && (
            <div className="mt-4">
              <div className="font-bold text-xs mb-1">समूह सदस्यों का विवरण:</div>
              <table className="w-full text-xs border-collapse border border-gray-500">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1.5 border border-gray-500 text-center w-10">क्र.</th>
                    <th className="p-1.5 border border-gray-500 text-left">सदस्य का नाम</th>
                    <th className="p-1.5 border border-gray-500 text-left">पद / दायित्व</th>
                    <th className="p-1.5 border border-gray-500 text-left">मोबाइल नंबर</th>
                  </tr>
                </thead>
                <tbody>
                  {shg.members.map((m, idx) => (
                    <tr key={m.id || idx}>
                      <td className="p-1 border border-gray-500 text-center">{idx + 1}</td>
                      <td className="p-1 border border-gray-500 font-medium">{m.name}</td>
                      <td className="p-1 border border-gray-500">{m.role || 'सदस्य'}</td>
                      <td className="p-1 border border-gray-500 font-mono">{m.mobile || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-8 pt-6 border-t border-dashed border-gray-400 grid grid-cols-2 text-center text-xs">
            <div>
              <div className="h-10"></div>
              <div className="font-bold border-t border-gray-600 inline-block px-4 pt-1">
                समूह अध्यक्ष / सचिव के हस्ताक्षर व मुहर
              </div>
            </div>
            <div>
              <div className="h-10"></div>
              <div className="font-bold border-t border-gray-600 inline-block px-4 pt-1">
                संस्था प्रधान / संकुल प्राचार्य के प्रतिहस्ताक्षर
              </div>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 text-center mt-6">
            प्रमाणित प्रतिलिपि • मुद्रण दिनांक: {new Date().toLocaleDateString('hi-IN')}
          </div>
        </div>
      </div>
    </div>
  );
};
