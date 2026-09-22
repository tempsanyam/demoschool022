import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Building2
} from 'lucide-react';
import {
  School,
  Student,
  Staff,
  PhysicalFacility,
  AttendanceRecord,
  MDMRecord,
  GovernmentWork,
  Complaint,
  NotificationItem,
  DocumentItem
} from '../../types';
import { triggerSystemPrint, generateUnicodePDFFromElement } from '../../utils/exportUtils';
import { printElement } from '../../utils/printUtils';
import { exportDossierToExcel } from '../../utils/dossierExportUtils';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SchoolDossierDocument } from './SchoolDossierDocument';

interface PrintDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  students?: Student[];
  staff?: Staff[];
  facilities?: PhysicalFacility[];
  attendance?: AttendanceRecord[];
  mdmRecords?: MDMRecord[];
  governmentWork?: GovernmentWork[];
  complaints?: Complaint[];
  notifications?: NotificationItem[];
  documents?: DocumentItem[];
  session?: string;
}

export const PrintDossierModal: React.FC<PrintDossierModalProps> = ({
  isOpen,
  onClose,
  school,
  students: propStudents,
  staff: propStaff,
  facilities: propFacilities,
  attendance: propAttendance,
  mdmRecords: propMDM,
  governmentWork: propGovWork,
  complaints: propComplaints,
  notifications: propNotifications,
  documents: propDocuments,
  session: propSession,
}) => {
  const { currentUser } = useAuth();
  const {
    selectedSessionId,
    students: contextStudents,
    staff: contextStaff,
    facilities: contextFacilities,
    attendance: contextAttendance,
    mdmRecords: contextMDM,
    governmentWork: contextGovWork,
    complaints: contextComplaints,
    notifications: contextNotifications,
    documents: contextDocuments,
    logActivity
  } = useData();

  const session = propSession || selectedSessionId || '2026-27';

  const printAreaRef = useRef<HTMLDivElement>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen || !school) return null;

  // Use props or fallback to filtered context data
  const schoolStudents = propStudents || contextStudents.filter((s) => s.schoolUdise === school.udise);
  const schoolStaff = propStaff || contextStaff.filter((st) => st.assignedSchoolUdise === school.udise);
  const schoolFacilities = propFacilities || contextFacilities.filter((f) => f.schoolUdise === school.udise);
  const schoolAttendance = propAttendance || contextAttendance.filter((a) => a.schoolUdise === school.udise);
  const schoolMDM = propMDM || contextMDM.filter((m) => m.schoolUdise === school.udise);
  
  const schoolGovWork = propGovWork || contextGovWork.filter(
    (w) => !w.schoolUdise || w.schoolUdise === school.udise
  );
  const schoolComplaints = propComplaints || contextComplaints.filter(
    (c) => !c.schoolUdise || c.schoolUdise === school.udise
  );
  const schoolNotifications = propNotifications || contextNotifications.filter(
    (n) => !n.schoolUdise || n.schoolUdise === school.udise
  );
  const schoolDocuments = propDocuments || contextDocuments.filter(
    (d) => !d.schoolUdise || d.schoolUdise === school.udise
  );

  const showNotification = (msg: string, duration = 3000) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), duration);
  };

  // 1. Trigger Direct A4 Print
  const handlePrint = () => {
    setIsPrinting(true);
    setPdfError(null);
    setStatusMessage(`A4 ${orientation === 'portrait' ? 'पोर्ट्रेट' : 'लैंडस्केप'} प्रिंट विंडो खोली जा रही है...`);

    const clearPrintState = () => {
      setIsPrinting(false);
      setStatusMessage(null);
    };

    window.addEventListener('afterprint', clearPrintState, { once: true });
    setTimeout(clearPrintState, 4000); // Safety fallback

    try {
      logActivity(
        'EXPORT',
        'PrintDossier',
        `विद्यालय संपूर्ण शासकीय डोजियर प्रिंट (${orientation}): ${school.name || school.hindiName} (${school.udise})`,
        { schoolUdise: school.udise }
      );
      if (printAreaRef.current) {
        printElement(printAreaRef.current, {
          title: `विद्यालय डोजियर: ${school.name || school.hindiName}`,
          orientation,
        });
      } else {
        triggerSystemPrint(orientation);
      }
    } catch (err) {
      console.error('System Print Error:', err);
      clearPrintState();
    }
  };

  // 2. Download Unicode PDF
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current || isPdfGenerating) return;
    setIsPdfGenerating(true);
    setPdfError(null);
    setStatusMessage('PDF तैयार हो रहा है...');

    const safeSchoolName = (school.name || school.hindiName || 'School').replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
    const fileName = `${safeSchoolName}_UDISE_${school.udise}_Dossier_${orientation}_${session.replace('/', '_')}`;

    try {
      logActivity(
        'EXPORT',
        'PrintDossier',
        `विद्यालय संपूर्ण शासकीय डोजियर PDF (${orientation}) डाउनलोड: ${school.name || school.hindiName}`,
        { schoolUdise: school.udise }
      );

      await generateUnicodePDFFromElement(printAreaRef.current, fileName, orientation);
      setStatusMessage('PDF सफलतापूर्वक डाउनलोड हो गया!');
      setTimeout(() => setStatusMessage(null), 3500);
      showNotification('PDF डाउनलोड हो गया।', 3500);
    } catch (err: any) {
      console.error('PDF Generation Pipeline Failed:', err);
      setStatusMessage(null);
      setPdfError('PDF तैयार नहीं हो सका। कृपया पुनः प्रयास करें अथवा "प्रिंट विकल्प" से Save as PDF चुनें।');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // 3. Multi-sheet Excel Export
  const handleExcelExport = () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    setPdfError(null);

    try {
      logActivity(
        'EXPORT',
        'PrintDossier',
        `विद्यालय संपूर्ण शासकीय डोजियर Excel डाउनलोड: ${school.name || school.hindiName}`,
        { schoolUdise: school.udise }
      );

      exportDossierToExcel({
        school,
        students: schoolStudents,
        staff: schoolStaff,
        facilities: schoolFacilities,
        attendance: schoolAttendance,
        mdmRecords: schoolMDM,
        governmentWork: schoolGovWork,
        complaints: schoolComplaints,
        notifications: schoolNotifications,
        documents: schoolDocuments,
        session
      });

      showNotification('10-शीट्स संपूर्ण डोजियर एक्सेल (.xlsx) डाउनलोड हो गया!', 3500);
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert('एक्सेल फाइल तैयार करने में त्रुटि हुई।');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto modal-print-wrapper">
      <div className="bg-white dark:bg-[#121A16] rounded-2xl w-full max-w-6xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[96vh] overflow-hidden animate-in fade-in zoom-in-95 print-modal-container">
        
        {/* Modal Top Action Bar */}
        <div className="px-4 py-3 bg-[#0B6B4B] text-white flex items-center justify-between shrink-0 shadow-xs no-print flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Printer className="w-4 h-4 text-emerald-200" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black tracking-tight">
                विद्यालय संपूर्ण शासकीय डोजियर (Print Document Preview)
              </h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-100 font-semibold">
                {school.name || school.hindiName} • यूडाइस: {school.udise} • सत्र: {session}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Orientation Toggle */}
            <div className="bg-emerald-900/60 p-0.5 rounded-lg border border-emerald-600/60 flex items-center text-[11px] font-bold mr-1">
              <button
                type="button"
                id="btn-orientation-portrait"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                  orientation === 'portrait'
                    ? 'bg-white text-emerald-950 font-black shadow-2xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
                title="A4 पोर्ट्रेट (खड़ा प्रारूप)"
              >
                A4 Portrait
              </button>
              <button
                type="button"
                id="btn-orientation-landscape"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                  orientation === 'landscape'
                    ? 'bg-white text-emerald-950 font-black shadow-2xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
                title="A4 लैंडस्केप (चौड़ा प्रारूप)"
              >
                A4 Landscape
              </button>
            </div>

            {/* Excel Download Button */}
            <button
              type="button"
              id="btn-dossier-excel-export"
              onClick={handleExcelExport}
              disabled={isExportingExcel}
              className="px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/40 disabled:opacity-50"
              title="10-अनुभाग संपूर्ण एक्सेल वर्कबुक डाउनलोड करें"
              aria-label="एक्सेल (.xlsx) डाउनलोड करें"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200 shrink-0" aria-hidden="true" />
              <span>{isExportingExcel ? 'Excel तैयार हो रहा है...' : 'Excel (.xlsx)'}</span>
            </button>

            {/* PDF Download Button */}
            <button
              type="button"
              id="btn-dossier-pdf-download"
              onClick={handleDownloadPDF}
              disabled={isPdfGenerating}
              className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-400/40 disabled:opacity-50"
              title="A4 साइज में PDF डाउनलोड करें"
              aria-label="PDF डाउनलोड करें"
            >
              {isPdfGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-200 shrink-0" aria-hidden="true" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-amber-200 shrink-0" aria-hidden="true" />
              )}
              <span>{isPdfGenerating ? 'PDF तैयार हो रहा है...' : 'PDF डाउनलोड'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              id="btn-dossier-print"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              title="सीधे प्रिंटर पर भेजें"
              aria-label="प्रिंट करें"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isPrinting ? 'प्रिंट विंडो खुल रही है...' : 'प्रिंट'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="btn-dossier-close"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              aria-label="डायलॉग बंद करें"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Feedback / Toast Messages */}
        {statusMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-4 py-2 text-xs font-bold flex items-center gap-2 no-print">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
        )}

        {pdfError && (
          <div className="bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
              <span>{pdfError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-2 py-1 bg-rose-200 text-rose-950 rounded text-[10px] font-black hover:bg-rose-300 cursor-pointer"
              >
                पुनः प्रयास करें
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-2 py-1 bg-amber-200 text-amber-950 rounded text-[10px] font-black hover:bg-amber-300 cursor-pointer"
              >
                प्रिंट विकल्प
              </button>
            </div>
          </div>
        )}

        {/* Document Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gray-100 dark:bg-[#0A100D] print:p-0 print:bg-white print:overflow-visible">
          <div ref={printAreaRef} id="printable-school-dossier" className="w-full flex justify-center print:block">
            <SchoolDossierDocument
              school={school}
              students={schoolStudents}
              staff={schoolStaff}
              facilities={schoolFacilities}
              attendance={schoolAttendance}
              mdmRecords={schoolMDM}
              governmentWork={schoolGovWork}
              complaints={schoolComplaints}
              notifications={schoolNotifications}
              documents={schoolDocuments}
              session={session}
              orientation={orientation}
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-gray-50 dark:bg-[#15201B] border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">
              शाला: {school.name || school.hindiName} ({school.udise})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-bold cursor-pointer"
            >
              बंद करें
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
