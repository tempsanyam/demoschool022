import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { Rasoiya, School as SchoolType } from '../../types';
import { institutionConfig } from '../../config/institutionConfig';

interface RasoiyaPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  rasoiya: Rasoiya | null;
  schools: SchoolType[];
  session?: string;
}

export const RasoiyaPrintModal: React.FC<RasoiyaPrintModalProps> = ({
  isOpen,
  onClose,
  rasoiya,
  schools,
  session,
}) => {
  if (!isOpen || !rasoiya) return null;

  const schoolObj = schools.find((s) => s.udise === rasoiya.schoolUdise);
  const schoolName = schoolObj?.hindiName || schoolObj?.name || rasoiya.schoolName || rasoiya.schoolUdise;
  const displaySession = session || rasoiya.sessionId || '';

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
            रसोइया विवरण पत्रक (Rasoiya Record Slip)
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
        <div className="mt-4 p-6 border-2 border-gray-800 bg-white text-black print:m-0 print:p-4 print:border-none rounded-xl" id="rasoiya-print-area">
          {/* Official Letterhead */}
          <div className="text-center pb-4 border-b-2 border-gray-800 mb-4">
            <div className="text-xs font-bold tracking-widest text-gray-700 uppercase">
              मध्य प्रदेश शासन • स्कूल शिक्षा विभाग
            </div>
            <h1 className="text-base sm:text-lg font-black mt-0.5">
              प्रधानमंत्री पोषण शक्ति निर्माण योजना (पीएम-पोषण / मध्याह्न भोजन)
            </h1>
            <div className="text-xs font-bold text-gray-800 mt-1">
              संकुल: {institutionConfig.sankulName || 'संकुल मलगुवां'} | ब्लॉक: {institutionConfig.block || 'बलदेवगढ़'} | जिला: {institutionConfig.district || 'टीकमगढ़'} (म.प्र.)
            </div>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="px-3 py-1 bg-gray-100 border border-gray-600 rounded text-xs font-black uppercase">
                रसोइया / रसोइया-सह-सहायक आधिकारिक परिचय व सेवा पत्रक
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
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400 w-1/3">रसोइया का पूरा नाम</td>
                <td className="p-2 font-bold text-sm">{rasoiya.name}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">रसोइया आईडी (ID)</td>
                <td className="p-2 font-mono font-bold">{rasoiya.id}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">पदस्थ विद्यालय (School)</td>
                <td className="p-2 font-bold">{schoolName}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">शाला UDISE कोड</td>
                <td className="p-2 font-mono font-bold">{rasoiya.schoolUdise}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">मोबाइल नंबर</td>
                <td className="p-2 font-mono">{rasoiya.mobile || '-'}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">आधार नंबर</td>
                <td className="p-2 font-mono">
                  {rasoiya.aadhaarNumber ? `•••• •••• ${rasoiya.aadhaarNumber.slice(-4)}` : 'उपलब्ध नहीं'}
                </td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">लिंग / सामाजिक वर्ग / जाति</td>
                <td className="p-2">
                  {rasoiya.gender === 'FEMALE' ? 'महिला' : 'पुरुष'} • {rasoiya.category || 'OBC'} {rasoiya.caste ? `(${rasoiya.caste})` : ''}
                </td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">कार्यभार ग्रहण दिनांक</td>
                <td className="p-2">{rasoiya.joiningDate || '-'}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">संबद्ध स्व-सहायता समूह (SHG)</td>
                <td className="p-2 font-semibold">{rasoiya.shgName || 'संबद्ध समूह'}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">पाककला प्रशिक्षण स्थिति</td>
                <td className="p-2 font-bold">
                  {rasoiya.trainingStatus === 'TRAINED' ? 'प्रशिक्षित (Trained)' : 'अप्रशिक्षित (Untrained)'}
                </td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">स्वास्थ्य परीक्षण स्थिति</td>
                <td className="p-2">
                  {rasoiya.healthCheckupStatus === 'UP_TO_DATE'
                    ? 'अद्यतन प्रमाणित'
                    : rasoiya.healthCheckupStatus === 'REGULAR'
                    ? 'नियमित'
                    : 'लंबित'}{' '}
                  (अंतिम परीक्षण: {rasoiya.lastHealthCheckupDate || 'अद्यतन'})
                </td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">बैंक खाता विवरण</td>
                <td className="p-2">
                  बैंक: {rasoiya.bankName || 'SBI'} | खाता क्र.: <span className="font-mono">{rasoiya.bankAccount || '-'}</span> | IFSC: <span className="font-mono">{rasoiya.ifsc || '-'}</span>
                </td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">मानदेय स्थिति व राशि</td>
                <td className="p-2 font-bold">
                  {rasoiya.paymentStatus === 'PAID' ? 'भुगतान पूर्ण (Paid)' : 'प्रक्रियाधीन'} (₹{rasoiya.monthlyHonorarium || 2000}/- प्रति माह)
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-gray-50 border-r border-gray-400">सेवा स्थिति (Status)</td>
                <td className="p-2 font-bold">
                  {rasoiya.status === 'ACTIVE' ? 'सक्रिय (Active)' : rasoiya.status || 'सक्रिय'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signatures & Certification */}
          <div className="mt-8 pt-6 border-t border-dashed border-gray-400 grid grid-cols-2 text-center text-xs">
            <div>
              <div className="h-10"></div>
              <div className="font-bold border-t border-gray-600 inline-block px-4 pt-1">
                रसोइया / रसोइया-सह-सहायक के हस्ताक्षर
              </div>
            </div>
            <div>
              <div className="h-10"></div>
              <div className="font-bold border-t border-gray-600 inline-block px-4 pt-1">
                संस्था प्रधान / संकुल समन्वयक के हस्ताक्षर एवं पदमुद्रा
              </div>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 text-center mt-6">
            प्रमाणित किया जाता है कि उपरोक्त जानकारी संस्था अभिलेखानुसार सत्य व प्रमाणित है। मुद्रण दिनांक: {new Date().toLocaleDateString('hi-IN')}
          </div>
        </div>
      </div>
    </div>
  );
};
