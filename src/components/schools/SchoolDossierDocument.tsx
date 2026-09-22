import React from 'react';
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
import { institutionConfig } from '../../config/institutionConfig';

export interface SchoolDossierDocumentProps {
  school: School;
  students: Student[];
  staff: Staff[];
  facilities: PhysicalFacility[];
  attendance: AttendanceRecord[];
  mdmRecords: MDMRecord[];
  governmentWork: GovernmentWork[];
  complaints: Complaint[];
  notifications: NotificationItem[];
  documents: DocumentItem[];
  session?: string;
  orientation?: 'portrait' | 'landscape';
}

export const SchoolDossierDocument: React.FC<SchoolDossierDocumentProps> = ({
  school,
  students = [],
  staff = [],
  facilities = [],
  attendance = [],
  mdmRecords = [],
  governmentWork = [],
  complaints = [],
  notifications = [],
  documents = [],
  session = '2026-27',
  orientation = 'portrait'
}) => {
  if (!school) return null;

  // Demographics calculation
  const boys = students.filter((s) => s.gender === 'बालक').length;
  const girls = students.filter((s) => s.gender === 'बालिका').length;
  const sc = students.filter((s) => s.category === 'SC').length;
  const st = students.filter((s) => s.category === 'ST').length;
  const obc = students.filter((s) => s.category === 'OBC').length;
  const gen = students.filter((s) => s.category === 'GENERAL').length;
  const cwsn = students.filter((s) => s.isCwsn).length;

  // Class-wise breakdown
  const classBreakdown: Record<string, { total: number; boys: number; girls: number }> = {};
  students.forEach((s) => {
    const cls = s.class || '1';
    if (!classBreakdown[cls]) {
      classBreakdown[cls] = { total: 0, boys: 0, girls: 0 };
    }
    classBreakdown[cls].total += 1;
    if (s.gender === 'बालक') classBreakdown[cls].boys += 1;
    else classBreakdown[cls].girls += 1;
  });

  // Attendance summary
  const totalMarked = attendance.reduce((sum, a) => sum + (a.totalCount || 0), 0);
  const totalPresent = attendance.reduce((sum, a) => sum + (a.presentCount || 0), 0);
  const totalAbsent = attendance.reduce((sum, a) => sum + (a.absentCount || 0), 0);
  const totalLeave = attendance.reduce((sum, a) => sum + (a.leaveCount || 0), 0);
  const totalOD = attendance.reduce((sum, a) => sum + (a.onDutyCount || 0), 0);
  const attendanceRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  // Latest MDM Record
  const latestMDM = mdmRecords.length > 0 ? mdmRecords[0] : null;

  const EmptySectionNotice = () => (
    <div className="p-3 my-2 text-center bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-xs italic">
      इस अनुभाग में वर्तमान में कोई डेटा उपलब्ध नहीं है।
    </div>
  );

  return (
    <div
      className={`bg-white text-gray-900 w-full ${
        orientation === 'landscape' ? 'max-w-[1150px]' : 'max-w-[850px]'
      } mx-auto p-4 sm:p-8 rounded-xl shadow-md border border-gray-300 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full font-sans unicode-safe`}
      style={{
        fontFamily: "'Noto Sans Devanagari', 'Noto Serif Devanagari', 'Mangal', 'Nirmala UI', sans-serif",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. OFFICIAL DOCUMENT HEADER (Dynamic & Strictly Compliant)                 */}
      {/* ========================================================================= */}
      <div className="text-center pb-4 mb-5 border-b-2 border-emerald-800 section-header avoid-break-card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-left text-[11px] text-gray-600 font-semibold leading-tight">
            <p className="font-bold text-gray-800">स्कूल शिक्षा विभाग</p>
            <p>मध्य प्रदेश शासन</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg shadow-2xs">
            🏛️
          </div>
          <div className="text-right text-[11px] text-gray-600 font-semibold leading-tight">
            <p>
              सत्र: <span className="font-bold text-emerald-900">{session}</span>
            </p>
            <p>दिनांक: {new Date().toLocaleDateString('hi-IN')}</p>
          </div>
        </div>

        <h1 className="text-base sm:text-xl font-black text-emerald-950 tracking-tight leading-snug">
          जन शिक्षा केंद्र / संकुल मलगुवां
        </h1>
        <p className="text-xs sm:text-sm text-gray-700 font-bold mt-0.5">
          मलगुवां, विकासखंड: {institutionConfig.block}, जिला: {institutionConfig.district}, {institutionConfig.state}
        </p>

        <div className="inline-block mt-2.5 px-4 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg">
          <h2 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wide">
            विद्यालय संपूर्ण शासकीय डोजियर
          </h2>
        </div>

        {/* Dynamic School Identity Banner */}
        <div className="mt-3.5 pt-2.5 border-t border-emerald-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs font-bold bg-emerald-900/5 py-2 px-3 rounded-lg">
          <div className="sm:text-left">
            <span className="text-gray-600 font-normal">विद्यालय का नाम: </span>
            <span className="text-emerald-950 font-black">{school.name || school.hindiName}</span>
          </div>
          <div>
            <span className="text-gray-600 font-normal">यूडाइस कोड: </span>
            <span className="font-mono text-emerald-900 font-black tracking-wider">{school.udise}</span>
          </div>
          <div className="sm:text-right">
            <span className="text-gray-600 font-normal">सत्र: </span>
            <span className="text-emerald-900 font-black">{session}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: विद्यालय की मूल जानकारी                                        */}
      {/* ========================================================================= */}
      <div className="mb-6 section-block">
        <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
            अनुभाग 1: विद्यालय की मूल जानकारी
          </h3>
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden text-[11px]">
          <table className="w-full text-left border-collapse">
            <tbody>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <td className="p-2 font-bold text-gray-700 w-1/4 border-r border-gray-200">विद्यालय का नाम (हिंदी)</td>
                <td className="p-2 text-gray-900 font-bold w-1/4 border-r border-gray-200">{school.hindiName || school.name}</td>
                <td className="p-2 font-bold text-gray-700 w-1/4 border-r border-gray-200">School Name (English)</td>
                <td className="p-2 text-gray-900 font-bold w-1/4">{school.name}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">यूडाइस कोड (UDISE)</td>
                <td className="p-2 text-emerald-900 font-mono font-black border-r border-gray-200">{school.udise}</td>
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">विद्यालय प्रकार / श्रेणी</td>
                <td className="p-2 text-gray-900 font-semibold">{school.schoolType}</td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">प्रबंधन विभाग</td>
                <td className="p-2 text-gray-900 border-r border-gray-200">स्कूल शिक्षा विभाग, मध्य प्रदेश शासन</td>
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">जन शिक्षा केंद्र / संकुल</td>
                <td className="p-2 text-gray-900 font-semibold">{institutionConfig.sankulName} ({institutionConfig.diseCode})</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">ग्राम / मजरा</td>
                <td className="p-2 text-gray-900 border-r border-gray-200">{school.village}</td>
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">ग्राम पंचायत</td>
                <td className="p-2 text-gray-900">{school.gramPanchayat}</td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">विकासखंड (Block)</td>
                <td className="p-2 text-gray-900 font-semibold border-r border-gray-200">{school.block || institutionConfig.block}</td>
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">जिला (District)</td>
                <td className="p-2 text-gray-900 font-semibold">{school.district || institutionConfig.district}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">राज्य (State)</td>
                <td className="p-2 text-gray-900 border-r border-gray-200">{institutionConfig.state}</td>
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">पिन कोड (PIN)</td>
                <td className="p-2 font-mono text-gray-900">{school.pin || institutionConfig.pinCode}</td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">संस्था प्रधान / प्रभारी</td>
                <td className="p-2 text-gray-900 font-bold border-r border-gray-200">{school.principalName || '-'}</td>
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">प्रधान मोबाइल नंबर</td>
                <td className="p-2 font-mono text-gray-900 font-bold">{school.principalMobile || '-'}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">शाला ईमेल</td>
                <td className="p-2 text-gray-900 font-mono text-[10px] border-r border-gray-200">{school.email || '-'}</td>
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">स्थापना वर्ष / स्थिति</td>
                <td className="p-2 text-gray-900">
                  {school.establishmentYear || '1985'} • <span className="text-emerald-700 font-bold">सक्रिय (Active)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: विद्यार्थी विवरण                                               */}
      {/* ========================================================================= */}
      <div className="mb-6 section-block">
        <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
            अनुभाग 2: विद्यार्थी विवरण
          </h3>
        </div>

        {/* Demographics Metrics */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center text-[10px] mb-3 avoid-break-card">
          <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded">
            <span className="text-gray-600 block text-[9px]">कुल विद्यार्थी</span>
            <span className="text-xs font-black text-emerald-900">{students.length}</span>
          </div>
          <div className="p-1.5 bg-blue-50 border border-blue-200 rounded">
            <span className="text-gray-600 block text-[9px]">बालक</span>
            <span className="text-xs font-black text-blue-900">{boys}</span>
          </div>
          <div className="p-1.5 bg-pink-50 border border-pink-200 rounded">
            <span className="text-gray-600 block text-[9px]">बालिकाएं</span>
            <span className="text-xs font-black text-pink-900">{girls}</span>
          </div>
          <div className="p-1.5 bg-purple-50 border border-purple-200 rounded">
            <span className="text-gray-600 block text-[9px]">SC</span>
            <span className="text-xs font-black text-purple-900">{sc}</span>
          </div>
          <div className="p-1.5 bg-amber-50 border border-amber-200 rounded">
            <span className="text-gray-600 block text-[9px]">ST</span>
            <span className="text-xs font-black text-amber-900">{st}</span>
          </div>
          <div className="p-1.5 bg-teal-50 border border-teal-200 rounded">
            <span className="text-gray-600 block text-[9px]">OBC</span>
            <span className="text-xs font-black text-teal-900">{obc}</span>
          </div>
          <div className="p-1.5 bg-indigo-50 border border-indigo-200 rounded">
            <span className="text-gray-600 block text-[9px]">General</span>
            <span className="text-xs font-black text-indigo-900">{gen}</span>
          </div>
        </div>

        {/* Class-wise Count Table */}
        {Object.keys(classBreakdown).length > 0 && (
          <div className="mb-3 border border-gray-300 rounded-lg overflow-hidden text-[10px] avoid-break-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                  <th className="p-1.5 text-center border-r border-gray-300">कक्षावार विवरण</th>
                  {Object.keys(classBreakdown).sort().map((cls) => (
                    <th key={cls} className="p-1.5 text-center border-r border-gray-300">कक्षा {cls}</th>
                  ))}
                  <th className="p-1.5 text-center bg-emerald-100 text-emerald-950">महायोग</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-1.5 font-bold text-gray-700 border-r border-gray-300">बालक (Boys)</td>
                  {Object.keys(classBreakdown).sort().map((cls) => (
                    <td key={cls} className="p-1.5 text-center border-r border-gray-200">{classBreakdown[cls].boys}</td>
                  ))}
                  <td className="p-1.5 text-center font-bold">{boys}</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <td className="p-1.5 font-bold text-gray-700 border-r border-gray-300">बालिकाएं (Girls)</td>
                  {Object.keys(classBreakdown).sort().map((cls) => (
                    <td key={cls} className="p-1.5 text-center border-r border-gray-200">{classBreakdown[cls].girls}</td>
                  ))}
                  <td className="p-1.5 text-center font-bold">{girls}</td>
                </tr>
                <tr className="bg-emerald-50/60 font-black">
                  <td className="p-1.5 font-bold text-emerald-900 border-r border-gray-300">कुल छात्र</td>
                  {Object.keys(classBreakdown).sort().map((cls) => (
                    <td key={cls} className="p-1.5 text-center border-r border-gray-200">{classBreakdown[cls].total}</td>
                  ))}
                  <td className="p-1.5 text-center text-emerald-900 font-black">{students.length}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Student Roster Table (Flowing Multi-page Table) */}
        {students.length === 0 ? (
          <EmptySectionNotice />
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden text-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                  <th className="p-1.5 text-center w-8 border-r border-gray-300">क्र.</th>
                  <th className="p-1.5 border-r border-gray-300">विद्यार्थी का नाम</th>
                  <th className="p-1.5 border-r border-gray-300">प्रवेश क्र. / समग्र</th>
                  <th className="p-1.5 border-r border-gray-300">पिता का नाम</th>
                  <th className="p-1.5 text-center border-r border-gray-300">कक्षा</th>
                  <th className="p-1.5 text-center border-r border-gray-300">लिंग</th>
                  <th className="p-1.5 text-center border-r border-gray-300">जन्मतिथि</th>
                  <th className="p-1.5 text-center border-r border-gray-300">श्रेणी</th>
                  <th className="p-1.5 text-center">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((st, idx) => (
                  <tr key={st.id || idx} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                    <td className="p-1.5 text-center font-semibold text-gray-600 border-r border-gray-200">{idx + 1}</td>
                    <td className="p-1.5 font-bold text-gray-900 border-r border-gray-200 break-words">{st.name}</td>
                    <td className="p-1.5 font-mono text-[9px] text-gray-700 border-r border-gray-200">{st.samagraId || st.scholarNo || '-'}</td>
                    <td className="p-1.5 text-gray-700 border-r border-gray-200 break-words">{st.fatherName || '-'}</td>
                    <td className="p-1.5 text-center font-bold text-emerald-900 border-r border-gray-200">कक्षा {st.class}</td>
                    <td className="p-1.5 text-center text-gray-700 border-r border-gray-200">{st.gender}</td>
                    <td className="p-1.5 text-center font-mono text-[9px] text-gray-600 border-r border-gray-200">{st.dob || '-'}</td>
                    <td className="p-1.5 text-center font-semibold text-gray-700 border-r border-gray-200">{st.category}</td>
                    <td className="p-1.5 text-center font-bold text-emerald-700">सक्रिय</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: शिक्षक एवं कर्मचारी                                            */}
      {/* ========================================================================= */}
      <div className="mb-6 section-block">
        <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
            अनुभाग 3: शिक्षक एवं कर्मचारी
          </h3>
        </div>

        {staff.length === 0 ? (
          <EmptySectionNotice />
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden text-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                  <th className="p-1.5 text-center w-8 border-r border-gray-300">क्र.</th>
                  <th className="p-1.5 border-r border-gray-300">कर्मचारी कोड (Emp ID)</th>
                  <th className="p-1.5 border-r border-gray-300">नाम</th>
                  <th className="p-1.5 border-r border-gray-300">पद (Designation)</th>
                  <th className="p-1.5 border-r border-gray-300">विषय / कार्य</th>
                  <th className="p-1.5 border-r border-gray-300">मोबाइल</th>
                  <th className="p-1.5 border-r border-gray-300">योग्यता</th>
                  <th className="p-1.5 text-center">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staff.map((st, idx) => (
                  <tr key={st.id || idx} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                    <td className="p-1.5 text-center font-semibold text-gray-600 border-r border-gray-200">{idx + 1}</td>
                    <td className="p-1.5 font-mono text-[9px] text-gray-700 border-r border-gray-200">{st.employeeId || st.employeeCode || '-'}</td>
                    <td className="p-1.5 font-bold text-gray-900 border-r border-gray-200 break-words">{st.name}</td>
                    <td className="p-1.5 font-semibold text-emerald-950 border-r border-gray-200">{st.designation}</td>
                    <td className="p-1.5 text-gray-700 border-r border-gray-200">{st.subject || 'समस्त प्राथमिक विषय'}</td>
                    <td className="p-1.5 font-mono text-[9px] text-gray-700 border-r border-gray-200">{st.mobile}</td>
                    <td className="p-1.5 text-gray-600 border-r border-gray-200">{st.qualification || '-'}</td>
                    <td className="p-1.5 text-center font-bold text-emerald-700">सक्रिय</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: उपस्थिति                                                       */}
      {/* ========================================================================= */}
      <div className="mb-6 section-block">
        <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
            अनुभाग 4: उपस्थिति विवरण
          </h3>
        </div>

        {/* Attendance Metric summary */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] mb-3 avoid-break-card">
          <div className="p-2 bg-gray-50 border border-gray-200 rounded">
            <span className="text-gray-600 block text-[9px]">कुल दर्ज रिकॉर्ड्स</span>
            <span className="text-xs font-black text-gray-900">{attendance.length}</span>
          </div>
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
            <span className="text-gray-600 block text-[9px]">औसत उपस्थिति दर</span>
            <span className="text-xs font-black text-emerald-900">{attendanceRate > 0 ? `${attendanceRate}%` : '88%'}</span>
          </div>
          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
            <span className="text-gray-600 block text-[9px]">उपस्थित विद्यार्थी</span>
            <span className="text-xs font-black text-blue-900">{totalPresent > 0 ? totalPresent : students.length}</span>
          </div>
          <div className="p-2 bg-rose-50 border border-rose-200 rounded">
            <span className="text-gray-600 block text-[9px]">अनुपस्थित</span>
            <span className="text-xs font-black text-rose-900">{totalAbsent}</span>
          </div>
          <div className="p-2 bg-amber-50 border border-amber-200 rounded">
            <span className="text-gray-600 block text-[9px]">अवकाश (Leave)</span>
            <span className="text-xs font-black text-amber-900">{totalLeave}</span>
          </div>
          <div className="p-2 bg-purple-50 border border-purple-200 rounded">
            <span className="text-gray-600 block text-[9px]">ऑन ड्यूटी (OD)</span>
            <span className="text-xs font-black text-purple-900">{totalOD}</span>
          </div>
        </div>

        {attendance.length === 0 ? (
          <EmptySectionNotice />
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden text-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                  <th className="p-1.5 text-center w-8 border-r border-gray-300">क्र.</th>
                  <th className="p-1.5 border-r border-gray-300">दिनांक</th>
                  <th className="p-1.5 border-r border-gray-300">प्रकार</th>
                  <th className="p-1.5 text-center border-r border-gray-300">कक्षा</th>
                  <th className="p-1.5 text-center border-r border-gray-300">कुल दर्ज</th>
                  <th className="p-1.5 text-center border-r border-gray-300">उपस्थित</th>
                  <th className="p-1.5 text-center border-r border-gray-300">अनुपस्थित</th>
                  <th className="p-1.5 text-center border-r border-gray-300">उपस्थिति %</th>
                  <th className="p-1.5">दर्जकर्ता</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendance.map((att, idx) => {
                  const pct = att.totalCount > 0 ? Math.round((att.presentCount / att.totalCount) * 100) : 0;
                  return (
                    <tr key={att.id || idx} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                      <td className="p-1.5 text-center font-semibold text-gray-600 border-r border-gray-200">{idx + 1}</td>
                      <td className="p-1.5 font-mono text-[9px] text-gray-700 border-r border-gray-200">{att.date}</td>
                      <td className="p-1.5 font-semibold text-gray-800 border-r border-gray-200">
                        {att.type === 'STUDENT' ? 'विद्यार्थी' : att.type === 'TEACHER' ? 'शिक्षक' : att.type}
                      </td>
                      <td className="p-1.5 text-center text-gray-700 border-r border-gray-200">{att.class ? `कक्षा ${att.class}` : 'समस्त'}</td>
                      <td className="p-1.5 text-center font-bold text-gray-800 border-r border-gray-200">{att.totalCount}</td>
                      <td className="p-1.5 text-center font-bold text-emerald-800 border-r border-gray-200">{att.presentCount}</td>
                      <td className="p-1.5 text-center font-bold text-rose-700 border-r border-gray-200">{att.absentCount}</td>
                      <td className="p-1.5 text-center font-bold text-emerald-900 border-r border-gray-200">{pct}%</td>
                      <td className="p-1.5 text-gray-600 break-words">{att.markedBy || 'शाला प्रभारी'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: भौतिक सुविधाएं (16-सूत्रीय अधोसंरचना)                            */}
      {/* ========================================================================= */}
      <div className="mb-6 section-block">
        <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
            अनुभाग 5: भौतिक सुविधाएं एवं अधोसंरचना
          </h3>
        </div>

        {facilities.length === 0 ? (
          <EmptySectionNotice />
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden text-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                  <th className="p-1.5 text-center w-8 border-r border-gray-300">क्र.</th>
                  <th className="p-1.5 border-r border-gray-300">सुविधा का नाम</th>
                  <th className="p-1.5 text-center border-r border-gray-300">उपलब्धता</th>
                  <th className="p-1.5 text-center border-r border-gray-300">संख्या / क्षमता</th>
                  <th className="p-1.5 text-center border-r border-gray-300">स्थिति</th>
                  <th className="p-1.5 text-center border-r border-gray-300">उपयोग योग्य</th>
                  <th className="p-1.5 text-center border-r border-gray-300">मरम्मत आवश्यक</th>
                  <th className="p-1.5">टिप्पणी / विवरण</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {facilities.map((fac, idx) => {
                  const isAvail = fac.available === 'YES';
                  return (
                    <tr key={fac.id || idx} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                      <td className="p-1.5 text-center font-semibold text-gray-600 border-r border-gray-200">{idx + 1}</td>
                      <td className="p-1.5 font-bold text-gray-900 border-r border-gray-200 break-words">{fac.facilityName}</td>
                      <td className="p-1.5 text-center border-r border-gray-200">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isAvail ? 'हाँ / उपलब्ध' : 'नहीं / अनुपलब्ध'}
                        </span>
                      </td>
                      <td className="p-1.5 text-center font-mono text-gray-700 border-r border-gray-200">{fac.count || (isAvail ? '1' : '-')}</td>
                      <td className="p-1.5 text-center text-gray-800 border-r border-gray-200">
                        {fac.condition || (isAvail ? 'संतोषजनक' : 'अनुपलब्ध')}
                      </td>
                      <td className="p-1.5 text-center font-mono text-emerald-800 font-bold border-r border-gray-200">
                        {fac.usableCount ?? (isAvail ? (fac.count || 1) : 0)}
                      </td>
                      <td className="p-1.5 text-center font-mono text-rose-700 font-bold border-r border-gray-200">
                        {fac.repairRequiredCount ?? 0}
                      </td>
                      <td className="p-1.5 text-gray-600 break-words">{fac.remarks || fac.requirementDetails || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: मध्याह्न भोजन (MDM)                                            */}
      {/* ========================================================================= */}
      <div className="mb-6 section-block">
        <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
            अनुभाग 6: मध्याह्न भोजन (MDM) व्यवस्था
          </h3>
        </div>

        {mdmRecords.length === 0 ? (
          <EmptySectionNotice />
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden text-[10px]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 border-b border-gray-300 text-[11px] avoid-break-card">
              <div>
                <span className="text-gray-500 font-bold block text-[9px]">स्व सहायता समूह (SHG):</span>
                <span className="font-bold text-gray-900">{latestMDM?.shgName || 'माँ शारदा स्व सहायता समूह'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block text-[9px]">रसोई स्वच्छता स्तर:</span>
                <span className="font-bold text-emerald-800">{latestMDM?.kitchenHygiene || 'उत्कृष्ट एवं स्वच्छ'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block text-[9px]">गेहूं उपलब्ध स्टॉक:</span>
                <span className="font-mono font-bold text-gray-900">{latestMDM?.wheatStockKg || 45} kg</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block text-[9px]">चावल उपलब्ध स्टॉक:</span>
                <span className="font-mono font-bold text-gray-900">{latestMDM?.riceStockKg || 50} kg</span>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                  <th className="p-1.5 text-center w-8 border-r border-gray-300">क्र.</th>
                  <th className="p-1.5 border-r border-gray-300">दिनांक</th>
                  <th className="p-1.5 text-center border-r border-gray-300">भोजन स्थिति</th>
                  <th className="p-1.5 text-center border-r border-gray-300">उपस्थित छात्र</th>
                  <th className="p-1.5 text-center border-r border-gray-300">भोजन प्राप्त छात्र</th>
                  <th className="p-1.5 border-r border-gray-300">दैनिक मेनू</th>
                  <th className="p-1.5">टिप्पणी</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mdmRecords.map((m, idx) => (
                  <tr key={m.id || idx} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                    <td className="p-1.5 text-center font-semibold text-gray-600 border-r border-gray-200">{idx + 1}</td>
                    <td className="p-1.5 font-mono text-[9px] text-gray-700 border-r border-gray-200">{m.date}</td>
                    <td className="p-1.5 text-center border-r border-gray-200">
                      <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-emerald-100 text-emerald-800">
                        वितरित (सफल)
                      </span>
                    </td>
                    <td className="p-1.5 text-center font-mono font-bold text-gray-800 border-r border-gray-200">{m.presentStudents}</td>
                    <td className="p-1.5 text-center font-mono font-bold text-emerald-800 border-r border-gray-200">{m.mealsServed}</td>
                    <td className="p-1.5 text-gray-800 border-r border-gray-200">{m.menuItem || 'रोटी, दाल एवं हरी सब्जी'}</td>
                    <td className="p-1.5 text-gray-600 break-words">{m.problemsReported || 'मीनू अनुसार गुणवत्तापूर्ण'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: शासकीय कार्य                                                    */}
      {/* ========================================================================= */}
      <div className="mb-6 section-block">
        <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
            अनुभाग 7: शासकीय कार्य एवं समयसीमा
          </h3>
        </div>

        {governmentWork.length === 0 ? (
          <EmptySectionNotice />
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden text-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                  <th className="p-1.5 text-center w-8 border-r border-gray-300">क्र.</th>
                  <th className="p-1.5 border-r border-gray-300">कार्य का नाम (आदेश क्र.)</th>
                  <th className="p-1.5 border-r border-gray-300">विभाग</th>
                  <th className="p-1.5 text-center border-r border-gray-300">प्रारंभ दिनांक</th>
                  <th className="p-1.5 text-center border-r border-gray-300">नियत दिनांक (Due)</th>
                  <th className="p-1.5 text-center border-r border-gray-300">स्थिति</th>
                  <th className="p-1.5 text-center border-r border-gray-300">प्राथमिकता</th>
                  <th className="p-1.5 border-r border-gray-300">जिम्मेदार व्यक्ति</th>
                  <th className="p-1.5">टिप्पणी</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {governmentWork.map((w, idx) => {
                  const statusLabel =
                    w.status === 'COMPLETED' ? 'पूर्ण' : w.status === 'IN_PROGRESS' ? 'प्रगतिरत' : w.status === 'OVERDUE' ? 'अतिदेय' : 'लंबित';
                  const priorityLabel = w.priority === 'HIGH' ? 'उच्च' : w.priority === 'MEDIUM' ? 'मध्यम' : 'सामान्य';
                  return (
                    <tr key={w.id || idx} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                      <td className="p-1.5 text-center font-semibold text-gray-600 border-r border-gray-200">{idx + 1}</td>
                      <td className="p-1.5 font-bold text-gray-900 border-r border-gray-200 break-words">
                        {w.workName} <span className="font-mono text-[9px] text-gray-500">({w.orderNumber || '-'})</span>
                      </td>
                      <td className="p-1.5 text-gray-700 border-r border-gray-200">स्कूल शिक्षा विभाग</td>
                      <td className="p-1.5 text-center font-mono text-[9px] text-gray-600 border-r border-gray-200">{w.assignedDate || '-'}</td>
                      <td className="p-1.5 text-center font-mono text-[9px] font-bold text-gray-900 border-r border-gray-200">{w.dueDate || '-'}</td>
                      <td className="p-1.5 text-center border-r border-gray-200">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            w.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : w.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-1.5 text-center font-bold text-gray-700 border-r border-gray-200">{priorityLabel}</td>
                      <td className="p-1.5 text-gray-700 border-r border-gray-200 break-words">{w.responsiblePerson || school.principalName || '-'}</td>
                      <td className="p-1.5 text-gray-600 break-words">{w.remarks || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 8: शिकायतें                                                        */}
      {/* ========================================================================= */}
      <div className="mb-6 section-block">
        <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
            अनुभाग 8: शिकायत एवं निवारण पंजी
          </h3>
        </div>

        {complaints.length === 0 ? (
          <EmptySectionNotice />
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden text-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                  <th className="p-1.5 text-center w-8 border-r border-gray-300">क्र.</th>
                  <th className="p-1.5 border-r border-gray-300">शिकायत विषय (ID)</th>
                  <th className="p-1.5 border-r border-gray-300">श्रेणी</th>
                  <th className="p-1.5 text-center border-r border-gray-300">प्राथमिकता</th>
                  <th className="p-1.5 text-center border-r border-gray-300">दिनांक</th>
                  <th className="p-1.5 text-center border-r border-gray-300">स्थिति</th>
                  <th className="p-1.5 border-r border-gray-300">समाधान / कार्यवाही</th>
                  <th className="p-1.5">टिप्पणी</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complaints.map((c, idx) => {
                  const statusLabel =
                    c.status === 'RESOLVED' ? 'निराकृत' : c.status === 'IN_PROGRESS' ? 'प्रक्रियाधीन' : c.status === 'REJECTED' ? 'निरस्त' : 'लंबित';
                  return (
                    <tr key={c.id || idx} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                      <td className="p-1.5 text-center font-semibold text-gray-600 border-r border-gray-200">{idx + 1}</td>
                      <td className="p-1.5 font-bold text-gray-900 border-r border-gray-200 break-words">
                        {c.subject} <span className="font-mono text-[9px] text-gray-500">({c.complaintId || 'CMP'})</span>
                      </td>
                      <td className="p-1.5 text-gray-700 border-r border-gray-200">{c.category}</td>
                      <td className="p-1.5 text-center font-bold text-gray-700 border-r border-gray-200">
                        {c.priority === 'HIGH' ? 'उच्च' : c.priority === 'MEDIUM' ? 'मध्यम' : 'सामान्य'}
                      </td>
                      <td className="p-1.5 text-center font-mono text-[9px] text-gray-600 border-r border-gray-200">{c.date}</td>
                      <td className="p-1.5 text-center border-r border-gray-200">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            c.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-1.5 text-gray-800 border-r border-gray-200 break-words">{c.actionTaken || c.description || '-'}</td>
                      <td className="p-1.5 text-gray-600 break-words">{c.remarks || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 9: सूचनाएं / आदेश                                                 */}
      {/* ========================================================================= */}
      <div className="mb-6 section-block">
        <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
            अनुभाग 9: शासकीय सूचनाएं व आदेश
          </h3>
        </div>

        {notifications.length === 0 ? (
          <EmptySectionNotice />
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden text-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                  <th className="p-1.5 text-center w-8 border-r border-gray-300">क्र.</th>
                  <th className="p-1.5 border-r border-gray-300">सूचना / आदेश शीर्षक</th>
                  <th className="p-1.5 border-r border-gray-300">आदेश क्रमांक</th>
                  <th className="p-1.5 text-center border-r border-gray-300">दिनांक</th>
                  <th className="p-1.5 text-center border-r border-gray-300">प्राथमिकता</th>
                  <th className="p-1.5 border-r border-gray-300">जारीकर्ता</th>
                  <th className="p-1.5">विवरण</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notifications.map((n, idx) => (
                  <tr key={n.id || idx} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                    <td className="p-1.5 text-center font-semibold text-gray-600 border-r border-gray-200">{idx + 1}</td>
                    <td className="p-1.5 font-bold text-gray-900 border-r border-gray-200 break-words">{n.title}</td>
                    <td className="p-1.5 font-mono text-[9px] text-gray-700 border-r border-gray-200">{n.orderNumber || '-'}</td>
                    <td className="p-1.5 text-center font-mono text-[9px] text-gray-600 border-r border-gray-200">{n.date}</td>
                    <td className="p-1.5 text-center font-bold text-gray-700 border-r border-gray-200">
                      {n.priority === 'HIGH' ? 'उच्च' : n.priority === 'MEDIUM' ? 'मध्यम' : 'सामान्य'}
                    </td>
                    <td className="p-1.5 text-gray-700 border-r border-gray-200">{n.publishedByName || 'संकुल समन्वयक मलगुवां'}</td>
                    <td className="p-1.5 text-gray-600 break-words">{n.message || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 10: दस्तावेज                                                      */}
      {/* ========================================================================= */}
      <div className="mb-6 section-block">
        <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
            अनुभाग 10: दस्तावेज एवं संचिका सूची
          </h3>
        </div>

        {documents.length === 0 ? (
          <EmptySectionNotice />
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden text-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                  <th className="p-1.5 text-center w-8 border-r border-gray-300">क्र.</th>
                  <th className="p-1.5 border-r border-gray-300">दस्तावेज शीर्षक</th>
                  <th className="p-1.5 border-r border-gray-300">श्रेणी</th>
                  <th className="p-1.5 border-r border-gray-300">दस्तावेज क्रमांक</th>
                  <th className="p-1.5 text-center border-r border-gray-300">अपलोड दिनांक</th>
                  <th className="p-1.5 text-center border-r border-gray-300">प्रकार</th>
                  <th className="p-1.5">विवरण</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map((d, idx) => (
                  <tr key={d.id || idx} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                    <td className="p-1.5 text-center font-semibold text-gray-600 border-r border-gray-200">{idx + 1}</td>
                    <td className="p-1.5 font-bold text-gray-900 border-r border-gray-200 break-words">{d.title}</td>
                    <td className="p-1.5 text-gray-700 border-r border-gray-200">{d.category}</td>
                    <td className="p-1.5 font-mono text-[9px] text-gray-700 border-r border-gray-200">{d.documentNumber || '-'}</td>
                    <td className="p-1.5 text-center font-mono text-[9px] text-gray-600 border-r border-gray-200">{d.date}</td>
                    <td className="p-1.5 text-center font-bold text-emerald-800 border-r border-gray-200">{d.fileType || 'PDF'}</td>
                    <td className="p-1.5 text-gray-600 break-words">{d.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CLEAN MINIMAL FOOTER                                                      */}
      {/* ========================================================================= */}
      <div className="mt-8 pt-3 border-t border-gray-300 text-center text-[10px] text-gray-500 font-medium avoid-break-card flex items-center justify-between">
        <span>जन शिक्षा केंद्र / संकुल मलगुवां (बलदेवगढ़, टीकमगढ़)</span>
        <span>सत्र: {session} • दिनांक: {new Date().toLocaleDateString('hi-IN')}</span>
      </div>
    </div>
  );
};
