import React, { useRef, useState, useMemo } from 'react';
import {
  Printer,
  Download,
  X,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  School as SchoolIcon,
  BookOpen,
  History,
  FileText,
  AlertTriangle,
  Lock,
  Loader2,
  Phone,
  MapPin,
  Clock,
  Award,
} from 'lucide-react';
import { Student, School } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { institutionConfig } from '../../config/institutionConfig';
import { printElement } from '../../utils/printUtils';
import { generateUnicodePDFFromElement } from '../../utils/exportUtils';

interface StudentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  initialAction?: 'NONE' | 'PRINT' | 'PDF';
}

export const StudentPrintModal: React.FC<StudentPrintModalProps> = ({
  isOpen,
  onClose,
  student,
  initialAction = 'NONE',
}) => {
  const {
    schools,
    studentMasters,
    studentAcademicRecords,
    studentTransfers,
    getStudentAcademicJourney,
    attendance,
    documents,
    governmentWork,
    selectedSessionId,
  } = useData();

  const { currentUser } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Security Check: If SCHOOL role, only students belonging to assigned school are permitted
  const isSchoolUser = currentUser?.role === 'SCHOOL';
  const assignedSchoolUdise = (currentUser?.assignedSchoolUdise || '').trim();
  const studentSchoolUdise = (student?.schoolUdise || '').trim();
  const isAccessDenied = Boolean(
    isSchoolUser &&
      assignedSchoolUdise &&
      studentSchoolUdise &&
      assignedSchoolUdise !== studentSchoolUdise
  );

  // Associated school object
  const school = useMemo(() => {
    if (!student) return undefined;
    return schools.find((s) => s.udise === student.schoolUdise);
  }, [schools, student]);

  // Associated permanent StudentMaster object
  const master = useMemo(() => {
    if (!student) return undefined;
    return studentMasters.find(
      (m) => m.id === student.id || m.samagraId === student.samagraId
    );
  }, [studentMasters, student]);

  // Session-specific academic enrollment record
  const currentEnrollment = useMemo(() => {
    if (!student) return undefined;
    const records = studentAcademicRecords.filter(
      (r) => r.studentId === student.id || r.studentId === master?.id
    );
    return (
      records.find((r) => r.sessionId === selectedSessionId) ||
      records[0] ||
      undefined
    );
  }, [studentAcademicRecords, student, master, selectedSessionId]);

  // Multi-year academic journey
  const academicJourney = useMemo(() => {
    if (!student) return [];
    const journey = getStudentAcademicJourney(student.id);
    return journey.filter((j) => Boolean(j.sessionId && j.class));
  }, [getStudentAcademicJourney, student]);

  // Transfer / TC record if any
  const transferRecord = useMemo(() => {
    if (!student) return undefined;
    return studentTransfers.find(
      (t) =>
        (t.studentId === student.id || t.studentId === master?.id) &&
        (t.oldSessionId === selectedSessionId ||
          t.newSessionId === selectedSessionId ||
          !selectedSessionId)
    );
  }, [studentTransfers, student, master, selectedSessionId]);

  // Student Attendance extraction for current selected session
  const studentAttendance = useMemo(() => {
    if (!student) {
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        leaveDays: 0,
        odDays: 0,
        attendancePct: 0,
        dailyRecords: [] as Array<{ date: string; status: string; remarks?: string }>,
      };
    }

    const sessionAttRecords = attendance.filter((a) => {
      const matchType = a.type === 'STUDENT';
      const matchSession = !selectedSessionId || a.sessionId === selectedSessionId || !a.sessionId;
      const matchSchool = !student.schoolUdise || a.schoolUdise === student.schoolUdise;
      return matchType && matchSession && matchSchool;
    });

    const dailyList: Array<{ date: string; status: string; remarks?: string }> = [];
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let odCount = 0;

    sessionAttRecords.forEach((att) => {
      if (!att.records) return;
      const rec = att.records.find(
        (r) =>
          r.entityId === student.id ||
          r.entityId === master?.id ||
          r.entityId === student.samagraId ||
          r.name.trim() === student.name.trim()
      );

      if (rec) {
        dailyList.push({
          date: att.date,
          status: rec.status,
          remarks: rec.remarks,
        });

        if (rec.status === 'PRESENT') presentCount++;
        else if (rec.status === 'ABSENT') absentCount++;
        else if (['LEAVE', 'CL', 'ML', 'EL'].includes(rec.status)) leaveCount++;
        else if (rec.status === 'OD') odCount++;
      }
    });

    // Sort descending by date
    dailyList.sort((a, b) => b.date.localeCompare(a.date));

    const totalMarked = dailyList.length;
    let calculatedPct =
      totalMarked > 0
        ? Math.round((presentCount / totalMarked) * 100)
        : currentEnrollment?.attendancePct || 0;

    return {
      totalDays: totalMarked,
      presentDays: presentCount,
      absentDays: absentCount,
      leaveDays: leaveCount,
      odDays: odCount,
      attendancePct: calculatedPct,
      dailyRecords: dailyList,
    };
  }, [student, attendance, selectedSessionId, master, currentEnrollment]);

  // Student linked documents
  const studentDocuments = useMemo(() => {
    if (!student) return [];
    return documents.filter((doc) => {
      const matchesStudentDoc = doc.category === 'STUDENT_DOC';
      const matchesTitle =
        doc.title.includes(student.name) ||
        (student.samagraId && doc.title.includes(student.samagraId));
      const matchesDesc =
        doc.description &&
        (doc.description.includes(student.name) ||
          (student.samagraId && doc.description.includes(student.samagraId)));
      const matchesEntity = (doc as any).studentId === student.id;
      return (matchesStudentDoc && (matchesTitle || matchesDesc)) || matchesEntity;
    });
  }, [documents, student]);

  // Sanitized Dynamic Filename
  const dynamicFileName = useMemo(() => {
    if (!student) return 'Student_Report';
    const cleanName = (student.name || 'Student').replace(/[^\w\u0900-\u097F]/g, '_');
    const cleanSr = (student.srNumber || student.scholarNo || student.samagraId || 'NA').replace(
      /[^\w]/g,
      '_'
    );
    const cleanSession = (selectedSessionId || institutionConfig.academicSession || 'Session').replace(
      /[^\w]/g,
      '_'
    );
    return `Student_${cleanName}_${cleanSr}_${cleanSession}`;
  }, [student, selectedSessionId]);

  if (!isOpen || !student) return null;

  // Print Handler
  const handlePrint = async () => {
    if (isAccessDenied || !reportRef.current) return;
    try {
      const title = `विद्यार्थी_प्रोफाइल_${student.name}_${selectedSessionId || ''}`;
      await printElement(reportRef.current, {
        orientation: 'portrait',
        title,
      });
    } catch (err) {
      console.error('Print trigger failed:', err);
    }
  };

  // PDF Handler
  const handleDownloadPdf = async () => {
    if (isAccessDenied || !reportRef.current) return;
    setIsGeneratingPdf(true);
    setPdfError(null);
    try {
      await generateUnicodePDFFromElement(
        reportRef.current,
        dynamicFileName,
        'portrait',
        undefined,
        'PROFESSIONAL'
      );
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setPdfError('पीडीएफ जनरेट करने में त्रुटि हुई। कृपया पुनः प्रयास करें अथवा प्रिंट विकल्प चुनें।');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const currentTimeFormatted = new Date().toLocaleTimeString('hi-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id="student-print-modal-overlay"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        id="student-print-modal-dialog"
        className="bg-gray-100 dark:bg-[#121815] rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-gray-300 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
      >
        {/* Modal Action Header (Excluded from Print) */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Printer className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-wide">
                  विद्यार्थी डेटा प्रिंट पूर्वावलोकन (Student Profile Print & PDF)
                </h3>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  A4 Report
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                {student.name} • समग्र आईडी: <span className="font-mono font-bold text-white">{student.samagraId}</span> • सत्र: <span className="font-semibold text-white">{selectedSessionId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAccessDenied && (
              <>
                <button
                  id="btn-modal-print-student"
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="A4 साइज में प्रिंट करें"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">🖨 विद्यार्थी का डेटा प्रिंट करें</span>
                  <span className="sm:hidden">प्रिंट</span>
                </button>

                <button
                  id="btn-modal-download-pdf-student"
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="उच्च गुणवत्ता देवनागरी PDF डाउनलोड करें"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">PDF डाउनलोड करें</span>
                  <span className="sm:hidden">PDF</span>
                </button>
              </>
            )}

            <button
              id="btn-modal-close-student-print"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex justify-center bg-gray-200/70 dark:bg-[#0c120f]">
          {isAccessDenied ? (
            /* ==========================================================
               SECURITY ACCESS DENIED STATE (Strict School User Enforcement)
               ========================================================== */
            <div
              id="student-print-access-denied"
              className="bg-white dark:bg-[#16211D] max-w-xl w-full p-8 rounded-2xl shadow-lg border border-rose-300 dark:border-rose-800 text-center my-auto space-y-4"
            >
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto border-2 border-rose-400">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-rose-600 text-white text-xs font-mono font-bold rounded-md">
                  [ACCESS_DENIED]
                </span>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  अनाधिकृत पहुँच (Unauthorized Access Violation)
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                  सुरक्षा नीति के अंतर्गत आप केवल अपनी अधिकृत शाला{' '}
                  <strong className="font-mono underline">
                    {assignedSchoolUdise}
                  </strong>{' '}
                  के विद्यार्थियों का डेटा देखने अथवा प्रिंट करने हेतु अधिकृत हैं।
                </p>
                <div className="p-3 bg-gray-50 dark:bg-[#0f1713] rounded-xl border border-gray-200 dark:border-gray-800 text-left text-xs space-y-1">
                  <div className="text-gray-500">विद्यार्थी का नाम: <strong className="text-gray-900 dark:text-white">{student.name}</strong></div>
                  <div className="text-gray-500">विद्यार्थी की शाला यूडाइस: <strong className="font-mono text-gray-900 dark:text-white">{studentSchoolUdise}</strong></div>
                  <div className="text-gray-500">आपकी अधिकृत शाला यूडाइस: <strong className="font-mono text-rose-600 dark:text-rose-400">{assignedSchoolUdise}</strong></div>
                </div>
                <p className="text-[11px] text-gray-400">
                  इस विद्यार्थी की व्यक्तिगत प्रोफाइल, उपस्थिति, शैक्षणिक इतिहास एवं दस्तावेज का मुद्रण व निर्यात पूरी तरह प्रतिबंधित किया गया है।
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                विंडो बंद करें
              </button>
            </div>
          ) : (
            /* ==========================================================
               THE OFFICIAL A4 PRINTABLE DOCUMENT CONTAINER
               ========================================================== */
            <div className="w-full flex flex-col items-center">
              {pdfError && (
                <div className="mb-4 max-w-[210mm] w-full p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{pdfError}</span>
                </div>
              )}

              {/* Printable Area - Standard A4 Portrait Container */}
              <div
                id="student-print-report-container"
                ref={reportRef}
                className="bg-white text-gray-900 p-8 sm:p-10 shadow-xl border border-gray-300 rounded-xl w-full max-w-[210mm] min-h-[297mm] unicode-safe flex flex-col justify-between"
                style={{
                  fontFamily:
                    "'Noto Sans Devanagari', 'Noto Serif Devanagari', 'Mangal', 'Nirmala UI', sans-serif",
                  boxSizing: 'border-box',
                }}
              >
                {/* Content Body */}
                <div className="space-y-5">
                  {/* HEADER SECTION: OFFICIAL GOVERNMENT HEADER */}
                  <div className="border-b-2 border-gray-900 pb-3 text-center space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-left text-[11px] text-gray-600">
                        <div>मध्य प्रदेश शासन</div>
                        <div className="font-semibold text-gray-800">स्कूल शिक्षा विभाग</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-extrabold tracking-wider text-gray-950 uppercase">
                          {institutionConfig.jskName || 'जन शिक्षा केंद्र मलगुवां'}
                        </div>
                        <div className="text-xs font-bold text-emerald-800">
                          {institutionConfig.sankulName || 'संकुल मलगुवां'} (डाइस कोड: {institutionConfig.diseCode})
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-gray-600 font-mono">
                        <div>सत्र: <strong className="text-gray-900">{selectedSessionId || institutionConfig.academicSession}</strong></div>
                        <div>दिनांक: {currentDateFormatted}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-600 border-t border-gray-200 pt-1">
                      विकासखंड: {institutionConfig.block}, जिला: {institutionConfig.district} (मध्य प्रदेश) - पिन: {institutionConfig.pinCode}
                    </div>

                    <div className="mt-2 pt-1 border-t border-dashed border-gray-400">
                      <h2 className="text-base font-extrabold text-gray-900 tracking-wide uppercase">
                        विद्यार्थी व्यक्तिगत विवरण एवं शैक्षणिक रिपोर्ट (Student Profile Report)
                      </h2>
                    </div>

                    {/* Quick Meta Ribbon */}
                    <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                      <div>
                        <span className="text-gray-500 text-[10px] block">विद्यार्थी का नाम:</span>
                        <strong className="text-gray-950 font-bold">{student.name}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] block">वर्तमान विद्यालय:</span>
                        <strong className="text-gray-950 truncate block">
                          {school?.hindiName || school?.name || student.schoolUdise}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] block">शाला UDISE कोड:</span>
                        <strong className="font-mono text-gray-950 font-bold">{student.schoolUdise}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] block">कक्षा व वर्ग:</span>
                        <strong className="text-emerald-800 font-bold">
                          कक्षा {student.class} {student.section ? `(${student.section})` : ''}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 1: विद्यार्थी की मूल जानकारी (PERSONAL & BASIC INFORMATION) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
                      <User className="w-4 h-4 text-emerald-800" />
                      <h3 className="font-extrabold text-xs tracking-wider uppercase text-gray-900">
                        १. विद्यार्थी की मूल व्यक्तिगत जानकारी (Personal Information)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Photo if available */}
                      {Boolean(student.photo || master?.photo) && (
                        <div className="sm:col-span-1 flex flex-col items-center justify-center p-2 border border-gray-300 rounded-lg bg-gray-50">
                          <img
                            src={student.photo || master?.photo}
                            alt={student.name}
                            className="w-28 h-32 object-cover rounded border border-gray-300 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[10px] text-gray-500 mt-1">विद्यार्थी फोटो</span>
                        </div>
                      )}

                      {/* Info Table Grid */}
                      <div
                        className={`${
                          Boolean(student.photo || master?.photo) ? 'sm:col-span-2' : 'sm:col-span-3'
                        } border border-gray-300 rounded-lg overflow-hidden text-xs`}
                      >
                        <table className="w-full border-collapse">
                          <tbody>
                            <tr className="border-b border-gray-200 bg-gray-50/70">
                              <td className="p-1.5 font-bold text-gray-700 w-1/3 border-r border-gray-200">
                                विद्यार्थी का पूरा नाम:
                              </td>
                              <td className="p-1.5 font-bold text-gray-950">{student.name}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                समग्र सामाजिक सुरक्षा आईडी (9 अंक):
                              </td>
                              <td className="p-1.5 font-mono font-bold text-blue-700">
                                {student.samagraId || master?.samagraId || 'N/A'}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50/70">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                स्थायी छात्र आईडी (Student Master ID):
                              </td>
                              <td className="p-1.5 font-mono text-gray-800">
                                {student.id || master?.id}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                अपार आईडी (APAAR / One Nation One ID):
                              </td>
                              <td className="p-1.5 font-mono text-gray-800">
                                {student.apaarId || master?.apaarId || 'उपलब्ध नहीं'}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50/70">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                अपार आईडी स्थिति (APAAR ID Status):
                              </td>
                              <td className="p-1.5 font-medium text-gray-900">
                                {student.apaarStatus || master?.apaarStatus || 'लागू नहीं / उपलब्ध नहीं'}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                विद्यार्थी पैन नंबर (Student PAN Number):
                              </td>
                              <td className="p-1.5 font-mono font-bold text-gray-900">
                                {student.panNumber || master?.panNumber || 'लागू नहीं / उपलब्ध नहीं'}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50/70">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                स्कॉलर / दाखिल-खारिज क्रमांक (SR No):
                              </td>
                              <td className="p-1.5 font-mono font-bold text-gray-900">
                                {student.scholarNo ||
                                  student.srNumber ||
                                  currentEnrollment?.scholarNo ||
                                  currentEnrollment?.srNumber ||
                                  'N/A'}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                जन्मतिथि (DOB) एवं लिंग:
                              </td>
                              <td className="p-1.5 text-gray-900">
                                <strong>{student.dob || master?.dob || 'N/A'}</strong> • लिंग: <strong>{student.gender || master?.gender}</strong>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50/70">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                पिता / पालक का नाम:
                              </td>
                              <td className="p-1.5 text-gray-900">{student.fatherName || master?.fatherName}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                माता का नाम:
                              </td>
                              <td className="p-1.5 text-gray-900">{student.motherName || master?.motherName || '-'}</td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50/70">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                सामाजिक वर्ग (Category):
                              </td>
                              <td className="p-1.5 text-gray-900">
                                <span className="font-bold">{student.category || master?.category}</span>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                दिव्यांगता स्थिति (CWSN):
                              </td>
                              <td className="p-1.5 text-gray-900">
                                {student.isCwsn || master?.isCwsn ? (
                                  <span className="font-bold text-rose-700">
                                    हाँ {student.cwsnType || master?.cwsnType ? `(${student.cwsnType || master?.cwsnType})` : ''}
                                  </span>
                                ) : (
                                  'नहीं (सामान्य)'
                                )}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50/70">
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                संपर्क मोबाइल नंबर:
                              </td>
                              <td className="p-1.5 font-mono text-gray-900">
                                {student.mobile || master?.mobile || 'N/A'}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                                निवास का ग्राम व पता:
                              </td>
                              <td className="p-1.5 text-gray-900">
                                {student.village || master?.village ? `ग्राम: ${student.village || master?.village}, ` : ''}
                                {student.address || master?.address || 'संकुल मलगुवां क्षेत्र'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: विद्यालय एवं वर्तमान नामांकन विवरण (SCHOOL & ENROLLMENT INFO) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
                      <SchoolIcon className="w-4 h-4 text-emerald-800" />
                      <h3 className="font-extrabold text-xs tracking-wider uppercase text-gray-900">
                        २. विद्यालय एवं वर्तमान शैक्षणिक सत्र नामांकन विवरण (School & Session Enrollment)
                      </h3>
                    </div>

                    <div className="border border-gray-300 rounded-lg overflow-hidden text-xs">
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr className="border-b border-gray-200 bg-gray-50/70">
                            <td className="p-1.5 font-bold text-gray-700 w-1/4 border-r border-gray-200">
                              विद्यालय का नाम:
                            </td>
                            <td className="p-1.5 font-bold text-gray-950 w-1/4 border-r border-gray-200">
                              {school?.hindiName || school?.name || student.schoolUdise}
                            </td>
                            <td className="p-1.5 font-bold text-gray-700 w-1/4 border-r border-gray-200">
                              शाला यूडाइस कोड (DISE):
                            </td>
                            <td className="p-1.5 font-mono font-bold text-gray-950 w-1/4">
                              {student.schoolUdise}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                              शैक्षणिक सत्र:
                            </td>
                            <td className="p-1.5 font-bold text-emerald-800 border-r border-gray-200">
                              {selectedSessionId || institutionConfig.academicSession}
                            </td>
                            <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                              नामांकन स्थिति (Status):
                            </td>
                            <td className="p-1.5 font-bold text-gray-900">
                              {student.status === 'ACTIVE'
                                ? 'सक्रिय (नियमित अध्ययनरत)'
                                : student.status === 'PROMOTED'
                                ? 'प्रोन्नत (Promoted)'
                                : student.status === 'TC_ISSUED'
                                ? 'टीसी जारी (TC Issued)'
                                : student.status === 'PASSED_OUT'
                                ? 'उत्तीर्ण (Passed Out)'
                                : student.status || 'सक्रिय'}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 bg-gray-50/70">
                            <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                              नामांकित कक्षा:
                            </td>
                            <td className="p-1.5 font-bold text-gray-900 border-r border-gray-200">
                              कक्षा {student.class}
                            </td>
                            <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                              वर्ग / सेक्शन:
                            </td>
                            <td className="p-1.5 text-gray-900">
                              {student.section || currentEnrollment?.section || 'A'}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                              विकासखंड व संकुल:
                            </td>
                            <td className="p-1.5 text-gray-900 border-r border-gray-200">
                              बलदेवगढ़ (संकुल मलगुवां)
                            </td>
                            <td className="p-1.5 font-bold text-gray-700 border-r border-gray-200">
                              जिला व राज्य:
                            </td>
                            <td className="p-1.5 text-gray-900">
                              टीकमगढ़ (मध्य प्रदेश)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SECTION 3: बहु-वर्षीय शैक्षणिक इतिहास (ACADEMIC HISTORY / JOURNEY) */}
                  {academicJourney.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
                        <History className="w-4 h-4 text-emerald-800" />
                        <h3 className="font-extrabold text-xs tracking-wider uppercase text-gray-900">
                          ३. बहु-वर्षीय शैक्षणिक इतिहास (Academic History & Multi-Year Journey)
                        </h3>
                      </div>

                      <div className="border border-gray-300 rounded-lg overflow-hidden text-xs">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100 border-b border-gray-300 text-gray-800 text-left font-bold">
                              <th className="p-1.5 border-r border-gray-300 text-center w-10">क्र.</th>
                              <th className="p-1.5 border-r border-gray-300 w-24">सत्र (Session)</th>
                              <th className="p-1.5 border-r border-gray-300">विद्यालय का नाम</th>
                              <th className="p-1.5 border-r border-gray-300 w-28 font-mono text-center">UDISE कोड</th>
                              <th className="p-1.5 border-r border-gray-300 w-20 text-center">कक्षा</th>
                              <th className="p-1.5 border-r border-gray-300">परिणाम / उपस्थिति</th>
                              <th className="p-1.5 text-center w-28">स्थिति</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {academicJourney.map((entry, idx) => {
                              const isThisSession = entry.sessionId === selectedSessionId;
                              return (
                                <tr
                                  key={entry.sessionId || idx}
                                  className={isThisSession ? 'bg-emerald-50/50 font-semibold' : 'bg-white'}
                                >
                                  <td className="p-1.5 border-r border-gray-200 text-center text-gray-500 font-mono">
                                    {idx + 1}
                                  </td>
                                  <td className="p-1.5 border-r border-gray-200 font-mono font-bold text-gray-900">
                                    {entry.sessionName || entry.sessionId}
                                  </td>
                                  <td className="p-1.5 border-r border-gray-200 text-gray-900">
                                    {entry.schoolName}
                                  </td>
                                  <td className="p-1.5 border-r border-gray-200 font-mono text-center text-gray-700">
                                    {entry.schoolUdise}
                                  </td>
                                  <td className="p-1.5 border-r border-gray-200 text-center font-bold text-emerald-800">
                                    कक्षा {entry.class}
                                  </td>
                                  <td className="p-1.5 border-r border-gray-200 text-gray-700">
                                    {entry.result || (entry.attendancePct ? `उपस्थिति: ${entry.attendancePct}%` : 'उत्तीर्ण')}
                                  </td>
                                  <td className="p-1.5 text-center text-gray-900">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        entry.status === 'ACTIVE'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : entry.status === 'PROMOTED'
                                          ? 'bg-blue-100 text-blue-800'
                                          : entry.status === 'TC_ISSUED'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {entry.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SECTION 4: उपस्थिति विवरण (ATTENDANCE SUMMARY & HISTORY) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
                      <Calendar className="w-4 h-4 text-emerald-800" />
                      <h3 className="font-extrabold text-xs tracking-wider uppercase text-gray-900">
                        ४. उपस्थिति विवरण - सत्र {selectedSessionId || institutionConfig.academicSession} (Student Attendance Record)
                      </h3>
                    </div>

                    {/* Attendance Metric Cards */}
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <div className="p-2 border border-gray-300 rounded-lg bg-gray-50">
                        <div className="text-[10px] text-gray-500">कुल कार्य दिवस</div>
                        <div className="text-sm font-bold font-mono text-gray-900">
                          {studentAttendance.totalDays > 0 ? studentAttendance.totalDays : 'सत्र अभिलेख'}
                        </div>
                      </div>
                      <div className="p-2 border border-emerald-300 rounded-lg bg-emerald-50">
                        <div className="text-[10px] text-emerald-700">उपस्थित दिवस</div>
                        <div className="text-sm font-bold font-mono text-emerald-800">
                          {studentAttendance.presentDays}
                        </div>
                      </div>
                      <div className="p-2 border border-rose-300 rounded-lg bg-rose-50">
                        <div className="text-[10px] text-rose-700">अनुपस्थित दिवस</div>
                        <div className="text-sm font-bold font-mono text-rose-800">
                          {studentAttendance.absentDays}
                        </div>
                      </div>
                      <div className="p-2 border border-amber-300 rounded-lg bg-amber-50">
                        <div className="text-[10px] text-amber-700">स्वीकृत अवकाश</div>
                        <div className="text-sm font-bold font-mono text-amber-800">
                          {studentAttendance.leaveDays}
                        </div>
                      </div>
                      <div className="p-2 border border-blue-300 rounded-lg bg-blue-50">
                        <div className="text-[10px] text-blue-700">उपस्थिति प्रतिशत</div>
                        <div className="text-sm font-bold font-mono text-blue-800">
                          {studentAttendance.attendancePct}%
                        </div>
                      </div>
                    </div>

                    {/* Daily Attendance Log Table (if available) */}
                    {studentAttendance.dailyRecords.length > 0 && (
                      <div className="mt-2 border border-gray-300 rounded-lg overflow-hidden text-xs">
                        <div className="bg-gray-100 p-1.5 font-bold text-[11px] text-gray-700 border-b border-gray-300 flex justify-between items-center">
                          <span>दैनिक उपस्थिति पंजी अभिलेख (Daily Attendance Logs)</span>
                          <span className="text-[10px] text-gray-500 font-normal">
                            केवल चयनित विद्यार्थी के दर्ज रिकॉर्ड
                          </span>
                        </div>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-left font-semibold">
                              <th className="p-1 border-r border-gray-200 text-center w-8">क्र.</th>
                              <th className="p-1 border-r border-gray-200 w-28 font-mono">दिनांक</th>
                              <th className="p-1 border-r border-gray-200 w-28 text-center">उपस्थिति स्थिति</th>
                              <th className="p-1">टिप्पणी / विवरण (Remarks)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {studentAttendance.dailyRecords.slice(0, 10).map((day, idx) => (
                              <tr key={idx} className="bg-white">
                                <td className="p-1 border-r border-gray-200 text-center text-gray-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="p-1 border-r border-gray-200 font-mono text-gray-800">
                                  {day.date}
                                </td>
                                <td className="p-1 border-r border-gray-200 text-center">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      day.status === 'PRESENT'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : day.status === 'ABSENT'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {day.status === 'PRESENT'
                                      ? 'उपस्थित (P)'
                                      : day.status === 'ABSENT'
                                      ? 'अनुपस्थित (A)'
                                      : day.status}
                                  </span>
                                </td>
                                <td className="p-1 text-gray-600 text-[11px]">
                                  {day.remarks || 'सामान्य दैनिक हाजिरी'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* SECTION 5: शाला स्थानांतरण प्रमाण-पत्र (TRANSFER / TC INFORMATION) */}
                  {Boolean(transferRecord) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
                        <FileText className="w-4 h-4 text-amber-700" />
                        <h3 className="font-extrabold text-xs tracking-wider uppercase text-gray-900">
                          ५. शाला स्थानांतरण प्रमाण-पत्र विवरण (Transfer Certificate Record)
                        </h3>
                      </div>

                      <div className="border border-amber-300 bg-amber-50/50 rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-gray-500 text-[10px] block">टीसी क्रमांक:</span>
                          <strong className="font-mono text-amber-900 font-bold">
                            {transferRecord?.tcNumber || 'अप्रकाशित'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] block">टीसी जारी दिनांक:</span>
                          <strong className="font-mono text-gray-900">
                            {transferRecord?.tcDate || transferRecord?.transferDate || 'N/A'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] block">गंतव्य विद्यालय का नाम:</span>
                          <strong className="text-gray-950 font-bold">
                            {transferRecord?.destinationSchoolName ||
                              transferRecord?.newSchoolName ||
                              'अभिलेखित नहीं'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] block">गंतव्य शाला UDISE:</span>
                          <strong className="font-mono text-gray-950 font-bold">
                            {transferRecord?.destinationSchoolUdise ||
                              transferRecord?.newSchoolUdise ||
                              '-'}
                          </strong>
                        </div>
                        {transferRecord?.reason && (
                          <div className="col-span-2 sm:col-span-4 text-[11px] text-gray-600 border-t border-amber-200 pt-1 mt-1">
                            <strong>स्थानांतरण का कारण:</strong> {transferRecord.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SECTION 6: संलग्न दस्तावेज (STUDENT DOCUMENTS) */}
                  {studentDocuments.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
                        <BookOpen className="w-4 h-4 text-emerald-800" />
                        <h3 className="font-extrabold text-xs tracking-wider uppercase text-gray-900">
                          ६. संलग्न विद्यार्थी दस्तावेज (Attached Student Documents)
                        </h3>
                      </div>

                      <div className="border border-gray-300 rounded-lg overflow-hidden text-xs">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 text-left font-semibold">
                              <th className="p-1.5 border-r border-gray-300 text-center w-8">क्र.</th>
                              <th className="p-1.5 border-r border-gray-300">दस्तावेज शीर्षक</th>
                              <th className="p-1.5 border-r border-gray-300 w-32 font-mono">क्रमांक</th>
                              <th className="p-1.5 border-r border-gray-300 w-28">दिनांक</th>
                              <th className="p-1.5 text-center w-24">प्रकार / आकार</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {studentDocuments.map((doc, idx) => (
                              <tr key={doc.id || idx} className="bg-white">
                                <td className="p-1.5 border-r border-gray-200 text-center text-gray-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="p-1.5 border-r border-gray-200 font-semibold text-gray-900">
                                  {doc.title}
                                </td>
                                <td className="p-1.5 border-r border-gray-200 font-mono text-gray-700">
                                  {doc.documentNumber || '-'}
                                </td>
                                <td className="p-1.5 border-r border-gray-200 font-mono text-gray-700">
                                  {doc.date}
                                </td>
                                <td className="p-1.5 text-center text-gray-600 font-mono text-[11px]">
                                  {doc.fileType} ({doc.fileSize})
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* FOOTER SECTION: VERIFICATION & SIGNATURES */}
                <div className="mt-8 pt-4 border-t-2 border-gray-900 space-y-6">
                  {/* Certification Statement */}
                  <p className="text-[11px] text-gray-600 text-center italic leading-relaxed">
                    प्रमाणित किया जाता है कि उपरोक्त विद्यार्थी का व्यक्तिगत विवरण, नामांकन स्थिति, बहु-वर्षीय शैक्षणिक इतिहास एवं उपस्थिति अभिलेख शाला के आधिकारिक छात्र पंजीयन रजिस्टर (Scholar Register) एवं जन शिक्षा केंद्र / संकुल मलगुवां के डिजिटल डेटाबेस के अनुसार पूर्णतः सत्य एवं सत्यापित है।
                  </p>

                  {/* Three-Column Official Signature Blocks */}
                  <div className="grid grid-cols-3 gap-6 text-center text-xs font-bold text-gray-800 pt-3">
                    <div>
                      <div className="h-10"></div>
                      <div className="border-t border-gray-500 pt-1">
                        हस्ताक्षर कक्षा अध्यापक
                      </div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        Class Teacher Signature
                      </div>
                    </div>

                    <div>
                      <div className="h-10"></div>
                      <div className="border-t border-gray-500 pt-1">
                        हस्ताक्षर संस्था प्रधान / प्रधानाध्यापक (सील)
                      </div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        Headmaster / Principal (Seal)
                      </div>
                    </div>

                    <div>
                      <div className="h-10"></div>
                      <div className="border-t border-gray-500 pt-1">
                        संकुल समन्वयक / जन शिक्षक (CAC)
                      </div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        Cluster Coordinator / CAC Seal
                      </div>
                    </div>
                  </div>

                  {/* System Generation Stamp */}
                  <div className="border-t border-dashed border-gray-300 pt-2 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 font-mono">
                    <div>
                      यह प्रति जन शिक्षा केंद्र / संकुल मलगुवां (बलदेवगढ़, टीकमगढ़ म.प्र.) के आधिकारिक डिजिटल पोर्टल से जनरेट की गई है।
                    </div>
                    <div>
                      जनरेट दिनांक: {currentDateFormatted} {currentTimeFormatted}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar (Screen Only) */}
        <div className="p-3.5 bg-white dark:bg-[#151D19] border-t border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            A4 पोर्ट्रेट प्रिंट हेतु पूर्णतः अनुकूलित • Unicode Devanagari Font Safe
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              बंद करें
            </button>

            {!isAccessDenied && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>PDF डाउनलोड करें</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨 विद्यार्थी का डेटा प्रिंट करें</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
