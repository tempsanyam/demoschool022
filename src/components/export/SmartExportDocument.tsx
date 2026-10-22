import React from 'react';
import { institutionConfig } from '../../config/institutionConfig';
import { ExportOptions, SummaryMetric } from '../../utils/exportUtils';
import { School, Student, Staff, PhysicalFacility, AttendanceRecord, MDMRecord, GovernmentWork, Complaint } from '../../types';
import { KeyValueDetail } from '../../types/dataExportRegistry';
import {
  DocumentStyle,
  PrintReportStyle,
  getDocumentStyle,
  toCanonicalDocumentStyle,
} from '../../utils/documentStyle';

export interface SmartExportDocumentProps {
  title: string;
  subtitle?: string;
  session?: string;
  schoolName?: string;
  udise?: string;
  orientation?: 'portrait' | 'landscape';
  summaryMetrics?: SummaryMetric[];
  headers: string[];
  rows: (string | number)[][];
  options?: ExportOptions;
  dataType?: string;
  documentStyle?: DocumentStyle | PrintReportStyle;
  // Rich data for complete dossier if needed
  school?: School;
  students?: Student[];
  staff?: Staff[];
  facilities?: PhysicalFacility[];
  attendance?: AttendanceRecord[];
  mdmRecords?: MDMRecord[];
  governmentWork?: GovernmentWork[];
  complaints?: Complaint[];
  // Rich details for Single Record Profile Cards
  singleEntityDetails?: KeyValueDetail[];
  // Secondary relation table for Dual Scope Reports
  dualSectionTitle?: string;
  dualHeaders?: string[];
  dualRows?: (string | number)[][];
}

export const SmartExportDocument: React.FC<SmartExportDocumentProps> = ({
  title,
  subtitle,
  session = '2026-27',
  schoolName,
  udise,
  orientation = 'portrait',
  summaryMetrics = [],
  headers = [],
  rows = [],
  options = {
    includeHeader: true,
    includeSchoolIdentity: true,
    includePageNumber: false,
    includeSignature: false,
    includeFooter: false,
  },
  dataType,
  documentStyle,
  school,
  students = [],
  staff = [],
  facilities = [],
  attendance = [],
  mdmRecords = [],
  governmentWork = [],
  complaints = [],
  singleEntityDetails,
  dualSectionTitle,
  dualHeaders = [],
  dualRows = []
}) => {
  const isCompleteDossier = dataType === 'COMPLETE_SCHOOL' && school;
  const canonicalStyle = toCanonicalDocumentStyle(documentStyle || getDocumentStyle());

  const theme = canonicalStyle === 'high-contrast'
    ? {
        containerBorder: '3.5px solid #000000',
        headerBorder: 'border-b-4 border-black',
        headerDeptColor: 'text-black font-bold',
        headerInstColor: 'text-black font-black',
        headerSubColor: 'text-black font-semibold',
        ribbonBg: 'bg-white border-2 border-black text-black',
        bannerBg: 'bg-white border-2 border-black text-black',
        bannerTitleColor: 'text-black font-black',
        metricCardBg: 'bg-white border-2 border-black text-black',
        metricValColor: 'text-black font-black',
        tableThead: 'bg-black text-white font-black',
        tableThBorder: 'border-2 border-black text-white font-black',
        tableTdBorder: 'border-1.5 border-black text-black font-semibold',
        tableRowAltBg: 'bg-white',
        accentColor: 'text-black',
        sectionBar: 'bg-black',
        sigBorder: 'border-t-2 border-black',
      }
    : canonicalStyle === 'ink-saver'
    ? {
        containerBorder: '1px solid #6B7280',
        headerBorder: 'border-b border-gray-700',
        headerDeptColor: 'text-gray-600 font-semibold',
        headerInstColor: 'text-gray-900 font-bold',
        headerSubColor: 'text-gray-600',
        ribbonBg: 'bg-white border border-gray-400 text-gray-900',
        bannerBg: 'bg-white border border-gray-400 text-gray-900',
        bannerTitleColor: 'text-gray-900 font-bold',
        metricCardBg: 'bg-white border border-gray-400 text-gray-900',
        metricValColor: 'text-gray-900 font-bold',
        tableThead: 'bg-white text-gray-900 font-bold border-b-2 border-gray-700',
        tableThBorder: 'border border-gray-300 text-gray-900 font-semibold',
        tableTdBorder: 'border border-gray-200 text-gray-900',
        tableRowAltBg: 'bg-white',
        accentColor: 'text-gray-900',
        sectionBar: 'bg-gray-700',
        sigBorder: 'border-t border-gray-700',
      }
    : {
        // government
        containerBorder: '2px solid #0B6B4B',
        headerBorder: 'border-b-2 border-[#0B6B4B]',
        headerDeptColor: 'text-gray-600 font-bold',
        headerInstColor: 'text-[#0B6B4B] font-black',
        headerSubColor: 'text-gray-700 font-medium',
        ribbonBg: 'bg-gray-50/90 border border-gray-200 text-gray-900',
        bannerBg: 'bg-emerald-50/70 border border-emerald-200 text-[#0B6B4B]',
        bannerTitleColor: 'text-[#0B6B4B] font-bold',
        metricCardBg: 'bg-gray-50 border border-gray-200 text-gray-900',
        metricValColor: 'text-[#0B6B4B] font-black',
        tableThead: 'bg-[#0B6B4B] text-white font-bold',
        tableThBorder: 'border border-[#08553B] text-white font-bold',
        tableTdBorder: 'border border-gray-300 text-gray-900',
        tableRowAltBg: 'bg-gray-50/70',
        accentColor: 'text-[#0B6B4B]',
        sectionBar: 'bg-[#0B6B4B]',
        sigBorder: 'border-t-2 border-[#0B6B4B]',
      };

  return (
    <div
      className={`smart-export-document unicode-safe document-style-${canonicalStyle} print-style-${canonicalStyle} bg-white text-gray-900 p-4 sm:p-8 md:p-10 shadow-lg rounded-sm w-full max-w-full overflow-x-auto transition-all ${
        orientation === 'landscape' ? 'max-w-5xl' : 'max-w-4xl'
      }`}
      style={{
        fontFamily: "'Noto Sans Devanagari', 'Noto Serif Devanagari', 'Mangal', 'Nirmala UI', 'Inter', 'Noto Sans', sans-serif",
        border: theme.containerBorder,
        height: 'auto',
        minHeight: '0',
        maxHeight: 'none',
      }}
    >
      {/* 1. Official Document Header */}
      {(options.includeHeader ?? true) && (
        <div className={`pb-4 mb-4 text-center ${theme.headerBorder} section-header avoid-break`}>
          <div className={`text-[11px] font-bold tracking-wider uppercase ${theme.headerDeptColor}`}>
            {institutionConfig.department}
          </div>
          <h1 className={`text-xl sm:text-2xl tracking-tight my-0.5 ${theme.headerInstColor}`}>
            {institutionConfig.institutionName} / {institutionConfig.sankulName}
          </h1>
          <p className={`text-xs ${theme.headerSubColor}`}>
            मलगुवां, विकासखंड: {institutionConfig.block}, जिला: {institutionConfig.district}, {institutionConfig.state}
          </p>

          {/* School Identity Metadata Ribbon */}
          {(options.includeSchoolIdentity ?? true) && (
            <div className={`mt-3 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold p-2 rounded ${theme.ribbonBg}`}>
              <div className="sm:text-left">
                <span className="opacity-75 font-normal">विद्यालय: </span>
                <strong className="text-gray-900">{schoolName || (school?.name || school?.hindiName) || 'समस्त संकुल शालाएं'}</strong>
              </div>
              <div className="text-center">
                <span className="opacity-75 font-normal">यूडाइस कोड: </span>
                <strong className={`font-mono ${theme.accentColor}`}>{udise || school?.udise || institutionConfig.diseCode}</strong>
              </div>
              <div className="sm:text-right">
                <span className="opacity-75 font-normal">शैक्षणिक सत्र: </span>
                <strong className="text-gray-900">{session}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Document Subject Banner */}
      <div className={`my-3 py-2.5 px-3.5 rounded-lg flex items-center justify-between text-xs avoid-break ${theme.bannerBg}`}>
        <div>
          <h2 className={`text-sm ${theme.bannerTitleColor}`}>{title}</h2>
          {subtitle && <p className="text-[11px] opacity-80 mt-0.5">{subtitle}</p>}
        </div>
        <div className="text-right text-[10.5px] opacity-75 shrink-0">
          <div>दिनांक: <strong>{new Date().toLocaleDateString('hi-IN')}</strong></div>
          <div>समय: <strong>{new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}</strong></div>
        </div>
      </div>

      {/* 3. Summary Metrics Row */}
      {summaryMetrics && summaryMetrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 avoid-break">
          {summaryMetrics.map((m, idx) => (
            <div key={idx} className={`p-2 rounded text-center ${theme.metricCardBg}`}>
              <span className="text-[10px] opacity-75 block font-medium">{m.label}</span>
              <span className={`text-sm ${theme.metricValColor}`}>{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* 4. Complete Multi-Section Dossier Flow (When COMPLETE_SCHOOL is selected) */}
      {isCompleteDossier ? (
        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="section-block">
            <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-[#0B6B4B]">
              <span className="w-2 h-2 rounded-full bg-[#0B6B4B]"></span>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                1. विद्यालय की मूल जानकारी (Basic School Details)
              </h3>
            </div>
            <table className="w-full text-left text-xs border-collapse border border-gray-300">
              <tbody>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <td className="p-2 font-bold text-gray-700 w-1/4 border-r border-gray-200">विद्यालय का नाम (हिंदी)</td>
                  <td className="p-2 text-gray-900 font-bold w-1/4 border-r border-gray-200">{school.hindiName || school.name}</td>
                  <td className="p-2 font-bold text-gray-700 w-1/4 border-r border-gray-200">School Name (English)</td>
                  <td className="p-2 text-gray-900 font-bold w-1/4">{school.name}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-2 font-bold text-gray-700 border-r border-gray-200">यूडाइस कोड (UDISE)</td>
                  <td className="p-2 text-[#0B6B4B] font-mono font-bold border-r border-gray-200">{school.udise}</td>
                  <td className="p-2 font-bold text-gray-700 border-r border-gray-200">शाला श्रेणी / प्रकार</td>
                  <td className="p-2 text-gray-900">{school.schoolType}</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <td className="p-2 font-bold text-gray-700 border-r border-gray-200">ग्राम / मजरा</td>
                  <td className="p-2 text-gray-900 border-r border-gray-200">{school.village}</td>
                  <td className="p-2 font-bold text-gray-700 border-r border-gray-200">ग्राम पंचायत</td>
                  <td className="p-2 text-gray-900">{school.gramPanchayat}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-2 font-bold text-gray-700 border-r border-gray-200">संस्था प्रधान का नाम</td>
                  <td className="p-2 text-gray-900 font-bold border-r border-gray-200">{school.principalName || '-'}</td>
                  <td className="p-2 font-bold text-gray-700 border-r border-gray-200">प्रधान मोबाइल नंबर</td>
                  <td className="p-2 text-gray-900 font-mono font-bold">{school.principalMobile || '-'}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-gray-700 border-r border-gray-200">कुल दर्ज विद्यार्थी</td>
                  <td className="p-2 text-[#0B6B4B] font-bold border-r border-gray-200">{students.length} छात्र</td>
                  <td className="p-2 font-bold text-gray-700 border-r border-gray-200">पदस्थ स्टाफ संख्या</td>
                  <td className="p-2 text-gray-900 font-bold">{staff.length} शिक्षक/कर्मचारी</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Student Enrollment Statistics */}
          <div className="section-block">
            <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-[#0B6B4B]">
              <span className="w-2 h-2 rounded-full bg-[#0B6B4B]"></span>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                2. विद्यार्थी सांख्यिकी एवं नामांकन रोस्टर ({students.length} दर्ज)
              </h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3 text-center text-xs">
              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <span className="text-[10px] text-gray-500 block">बालक (Boys)</span>
                <strong className="text-blue-900">{students.filter((s) => s.gender === 'बालक').length}</strong>
              </div>
              <div className="p-2 bg-pink-50 border border-pink-200 rounded">
                <span className="text-[10px] text-gray-500 block">बालिकाएं (Girls)</span>
                <strong className="text-pink-900">{students.filter((s) => s.gender === 'बालिका').length}</strong>
              </div>
              <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                <span className="text-[10px] text-gray-500 block">SC</span>
                <strong className="text-purple-900">{students.filter((s) => s.category === 'SC').length}</strong>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                <span className="text-[10px] text-gray-500 block">ST</span>
                <strong className="text-amber-900">{students.filter((s) => s.category === 'ST').length}</strong>
              </div>
              <div className="p-2 bg-teal-50 border border-teal-200 rounded">
                <span className="text-[10px] text-gray-500 block">OBC</span>
                <strong className="text-teal-900">{students.filter((s) => s.category === 'OBC').length}</strong>
              </div>
              <div className="p-2 bg-rose-50 border border-rose-200 rounded">
                <span className="text-[10px] text-gray-500 block">CWSN</span>
                <strong className="text-rose-900">{students.filter((s) => s.isCwsn).length}</strong>
              </div>
            </div>

            {students.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 font-bold text-gray-900 border-b border-gray-300">
                      <th className="p-1.5 border border-gray-300 w-10 text-center">क्र.</th>
                      <th className="p-1.5 border border-gray-300">समग्र आईडी</th>
                      <th className="p-1.5 border border-gray-300">विद्यार्थी का नाम</th>
                      <th className="p-1.5 border border-gray-300">पिता का नाम</th>
                      <th className="p-1.5 border border-gray-300">कक्षा</th>
                      <th className="p-1.5 border border-gray-300">लिंग</th>
                      <th className="p-1.5 border border-gray-300">जाति वर्ग</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st, idx) => (
                      <tr key={st.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                        <td className="p-1.5 border border-gray-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-1.5 border border-gray-300 font-mono text-[11px]">{st.samagraId}</td>
                        <td className="p-1.5 border border-gray-300 font-medium">{st.name}</td>
                        <td className="p-1.5 border border-gray-300">{st.fatherName}</td>
                        <td className="p-1.5 border border-gray-300">कक्षा {st.class}</td>
                        <td className="p-1.5 border border-gray-300">{st.gender}</td>
                        <td className="p-1.5 border border-gray-300">{st.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Staff & Teachers List */}
          <div className="section-block">
            <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-[#0B6B4B]">
              <span className="w-2 h-2 rounded-full bg-[#0B6B4B]"></span>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                3. शिक्षक एवं स्टाफ पदस्थापना सूची ({staff.length} पदस्थ)
              </h3>
            </div>
            {staff.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-500 italic bg-gray-50 border rounded">
                कोई स्टाफ रिकॉर्ड उपलब्ध नहीं है
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 font-bold text-gray-900 border-b border-gray-300">
                      <th className="p-1.5 border border-gray-300 w-10 text-center">क्र.</th>
                      <th className="p-1.5 border border-gray-300">कर्मचारी कोड</th>
                      <th className="p-1.5 border border-gray-300">नाम</th>
                      <th className="p-1.5 border border-gray-300">पदनाम</th>
                      <th className="p-1.5 border border-gray-300">विषय</th>
                      <th className="p-1.5 border border-gray-300">मोबाइल</th>
                      <th className="p-1.5 border border-gray-300">योग्यता</th>
                      <th className="p-1.5 border border-gray-300">स्थिति</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((t, idx) => (
                      <tr key={t.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                        <td className="p-1.5 border border-gray-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-1.5 border border-gray-300 font-mono text-[11px]">{t.employeeId || t.employeeCode || '-'}</td>
                        <td className="p-1.5 border border-gray-300 font-bold">{t.name}</td>
                        <td className="p-1.5 border border-gray-300">{t.designation}</td>
                        <td className="p-1.5 border border-gray-300">{t.subject || 'समस्त'}</td>
                        <td className="p-1.5 border border-gray-300 font-mono text-[11px]">{t.mobile}</td>
                        <td className="p-1.5 border border-gray-300">{t.qualification || '-'}</td>
                        <td className="p-1.5 border border-gray-300">
                          <span className="text-[#0B6B4B] font-semibold">{t.status === 'ACTIVE' ? 'सक्रिय' : t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: 16-point Physical Facilities */}
          <div className="section-block">
            <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-[#0B6B4B]">
              <span className="w-2 h-2 rounded-full bg-[#0B6B4B]"></span>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                4. 16-सूत्रीय भौतिक अधोसंरचना स्थिति ({facilities.filter((f) => f.available === 'YES').length} / 16 उपलब्ध)
              </h3>
            </div>
            {facilities.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-500 italic bg-gray-50 border rounded">
                भौतिक अधोसंरचना प्रपत्र उपलब्ध नहीं है
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 font-bold text-gray-900 border-b border-gray-300">
                      <th className="p-1.5 border border-gray-300 w-10 text-center">क्र.</th>
                      <th className="p-1.5 border border-gray-300">भौतिक सुविधा / पैरामीटर</th>
                      <th className="p-1.5 border border-gray-300 text-center">उपलब्धता</th>
                      <th className="p-1.5 border border-gray-300">स्थिति</th>
                      <th className="p-1.5 border border-gray-300">टिप्पणी / सत्यापन</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facilities.map((f, idx) => (
                      <tr key={f.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                        <td className="p-1.5 border border-gray-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-1.5 border border-gray-300 font-medium">{f.facilityName}</td>
                        <td className="p-1.5 border border-gray-300 text-center font-bold">
                          {f.available === 'YES' ? (
                            <span className="text-[#0B6B4B]">✓ उपलब्ध</span>
                          ) : (
                            <span className="text-rose-600">✗ अनुपलब्ध</span>
                          )}
                        </td>
                        <td className="p-1.5 border border-gray-300">{f.condition || 'संतोषजनक'}</td>
                        <td className="p-1.5 border border-gray-300 text-gray-600">{f.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 5: MDM Register */}
          <div className="section-block">
            <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-[#0B6B4B]">
              <span className="w-2 h-2 rounded-full bg-[#0B6B4B]"></span>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                5. मध्याह्न भोजन (MDM) वितरण व खाद्यान्न स्थिति
              </h3>
            </div>
            {mdmRecords.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-500 italic bg-gray-50 border rounded">
                एमडीएम वितरण रिकॉर्ड उपलब्ध नहीं है
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 font-bold text-gray-900 border-b border-gray-300">
                      <th className="p-1.5 border border-gray-300">दिनांक</th>
                      <th className="p-1.5 border border-gray-300">मीनू</th>
                      <th className="p-1.5 border border-gray-300 text-center">पात्र छात्र</th>
                      <th className="p-1.5 border border-gray-300 text-center">लाभान्वित छात्र</th>
                      <th className="p-1.5 border border-gray-300">रसोई स्वच्छता</th>
                      <th className="p-1.5 border border-gray-300 text-right">गेहूं स्टॉक</th>
                      <th className="p-1.5 border border-gray-300 text-right">चावल स्टॉक</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mdmRecords.slice(0, 8).map((m, idx) => (
                      <tr key={m.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                        <td className="p-1.5 border border-gray-300 font-mono">{m.date}</td>
                        <td className="p-1.5 border border-gray-300">{m.menuItem || '-'}</td>
                        <td className="p-1.5 border border-gray-300 text-center">{m.eligibleStudents}</td>
                        <td className="p-1.5 border border-gray-300 text-center font-bold text-[#0B6B4B]">{m.mealsServed}</td>
                        <td className="p-1.5 border border-gray-300">{m.kitchenHygiene}</td>
                        <td className="p-1.5 border border-gray-300 text-right font-mono">{m.wheatStockKg || 0} kg</td>
                        <td className="p-1.5 border border-gray-300 text-right font-mono">{m.riceStockKg || 0} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 6: Government Works & Grievances */}
          <div className="section-block">
            <div className="section-header flex items-center gap-2 mb-2 pb-1 border-b border-[#0B6B4B]">
              <span className="w-2 h-2 rounded-full bg-[#0B6B4B]"></span>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                6. लंबित शासकीय कार्य एवं शिकायत निवारण
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-700 mb-1">शासकीय कार्य एवं समयसीमा:</h4>
                <div className="p-2.5 bg-gray-50 border rounded text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span>कुल निर्धारित कार्य:</span>
                    <strong>{governmentWork.length}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>पूर्ण कार्य:</span>
                    <strong className="text-[#0B6B4B]">{governmentWork.filter((w) => w.status === 'COMPLETED').length}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>लंबित / प्रगतिरत कार्य:</span>
                    <strong className="text-amber-600">{governmentWork.filter((w) => w.status !== 'COMPLETED').length}</strong>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-700 mb-1">शिकायत निवारण स्थिति (Lifecycle):</h4>
                <div className="p-2 bg-gray-50 border rounded text-[11px] space-y-1">
                  <div className="flex justify-between py-0.5 border-b">
                    <span>कुल प्राप्त शिकायतें:</span>
                    <strong>{complaints.length}</strong>
                  </div>
                  <div className="flex justify-between py-0.5 border-b">
                    <span>नई / लंबित (Open):</span>
                    <strong className="text-amber-600">{complaints.filter((c) => c.status === 'OPEN' || c.status === 'PENDING').length}</strong>
                  </div>
                  <div className="flex justify-between py-0.5 border-b">
                    <span>कार्यवाही में (In Progress):</span>
                    <strong className="text-blue-600">{complaints.filter((c) => c.status === 'IN_PROGRESS').length}</strong>
                  </div>
                  <div className="flex justify-between py-0.5 border-b">
                    <span>समाधान किया गया (Resolved):</span>
                    <strong className="text-[#0B6B4B]">{complaints.filter((c) => c.status === 'RESOLVED').length}</strong>
                  </div>
                  <div className="flex justify-between py-0.5 border-b">
                    <span>बंद (Closed):</span>
                    <strong className="text-gray-700">{complaints.filter((c) => c.status === 'CLOSED').length}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>पुनः खोली गई (Re-opened):</span>
                    <strong className="text-purple-700">{complaints.filter((c) => c.status === 'REOPENED' || (c.status as string) === 'RE_OPENED').length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : singleEntityDetails && singleEntityDetails.length > 0 ? (
        /* Rich Key-Value Sections for Single Entity Profile Cards */
        <div className="space-y-4">
          {singleEntityDetails.map((sec, sIdx) => (
            <div key={sIdx} className={`section-block border rounded overflow-hidden ${canonicalStyle === 'high-contrast' ? 'border-2 border-black' : canonicalStyle === 'ink-saver' ? 'border-gray-400' : 'border-gray-300'}`}>
              <div className={`px-3 py-1.5 font-bold text-xs ${theme.ribbonBg} ${theme.accentColor}`}>
                {sec.sectionTitle}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 text-xs divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                {sec.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className={`p-2.5 flex flex-col justify-center ${
                      item.colSpan === 2 ? 'sm:col-span-2' : ''
                    } ${iIdx % 2 === 0 ? 'bg-white' : theme.tableRowAltBg}`}
                  >
                    <span className="text-[10px] text-gray-500 font-medium">{item.label}</span>
                    <span
                      className={`text-xs mt-0.5 ${
                        item.isHighlight
                          ? 'font-bold text-gray-900'
                          : 'text-gray-800'
                      } ${item.isMono ? 'font-mono' : ''}`}
                    >
                      {item.value === null || item.value === undefined || item.value === '' ? '-' : String(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Standard Single-Table Data Flow (Rendering ALL Rows with Unlimited Natural Flow) */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-gray-300">
            <thead>
              <tr className={`${theme.tableThead} border-b`}>
                {headers.map((h, i) => (
                  <th key={i} className={`p-2 ${theme.tableThBorder}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length || 1} className="p-4 text-center text-gray-500 italic">
                    इस चयन के लिए कोई डेटा उपलब्ध नहीं है।
                  </td>
                </tr>
              ) : (
                rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : theme.tableRowAltBg}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className={`p-2 font-normal text-[11px] ${theme.tableTdBorder}`}>
                        {cell === null || cell === undefined || cell === '' ? '-' : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dual Relation Table (When dualRows is provided) */}
      {dualRows && dualRows.length > 0 && (
        <div className="mt-6 pt-4 border-t-2 border-emerald-600 section-block">
          {dualSectionTitle && (
            <div className="mb-2 pb-1 border-b border-gray-200 flex items-center justify-between">
              <h3 className={`text-xs sm:text-sm font-bold ${theme.accentColor}`}>
                {dualSectionTitle}
              </h3>
              <span className="text-[10px] text-gray-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                {dualRows.length} रिकॉर्ड
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-gray-300">
              <thead>
                <tr className={`${theme.tableThead} border-b`}>
                  {dualHeaders.map((dh, di) => (
                    <th key={di} className={`p-2 text-[11px] ${theme.tableThBorder}`}>
                      {dh}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {dualRows.map((dRow, drIdx) => (
                  <tr key={drIdx} className={drIdx % 2 === 0 ? 'bg-white' : theme.tableRowAltBg}>
                    {dRow.map((dCell, dcIdx) => (
                      <td key={dcIdx} className={`p-2 font-normal text-[11px] ${theme.tableTdBorder}`}>
                        {dCell === null || dCell === undefined || dCell === '' ? '-' : String(dCell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Optional Official Signatures */}
      {options.includeSignature && (
        <div className={`mt-10 pt-6 ${theme.sigBorder} avoid-break`}>
          <div className="grid grid-cols-2 text-center text-xs">
            <div>
              <div className="h-10"></div>
              <div className="font-bold text-gray-900">हस्ताक्षर संस्था प्रधान / प्रभारी</div>
              <div className="text-[10px] text-gray-500">{schoolName || school?.name || school?.hindiName || 'शासकीय विद्यालय'}</div>
            </div>
            <div>
              <div className="h-10"></div>
              <div className={`font-bold ${theme.accentColor}`}>हस्ताक्षर जन शिक्षक / संकुल समन्वयक (CAC)</div>
              <div className="text-[10px] text-gray-500">{institutionConfig.institutionName} / {institutionConfig.sankulName}</div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Optional Footer */}
      {options.includeFooter && (
        <div className="mt-6 pt-2 border-t border-dashed border-gray-300 flex items-center justify-between text-[10px] text-gray-500 avoid-break">
          <span>
            {schoolName ? `${schoolName} (${udise || ''})` : `${institutionConfig.institutionName} (${institutionConfig.district})`}
          </span>
          <span>सत्र: {session} • दिनांक: {new Date().toLocaleDateString('hi-IN')}</span>
        </div>
      )}
    </div>
  );
};
