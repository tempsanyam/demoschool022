import React, { useState } from 'react';
import {
  FileBarChart,
  Printer,
  Download,
  School,
  GraduationCap,
  Users,
  CalendarCheck,
  Building2,
  Utensils,
  ClipboardList,
  AlertTriangle,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { institutionConfig } from '../../config/institutionConfig';

export const ReportsView: React.FC = () => {
  const {
    schools,
    scopedSchools,
    scopedStudents,
    scopedStaff,
    scopedAttendance,
    scopedFacilities,
    scopedMDM,
    scopedWork,
    scopedComplaints,
    stats,
    selectedSchoolUdise,
    selectedSchool
  } = useData();

  const [activeReportId, setActiveReportId] = useState<string>('CONSOLIDATED');

  const reportList = [
    { id: 'CONSOLIDATED', title: 'संकुल समेकित कार्यपालन रिपोर्ट', subtitle: '37 विद्यालयों का समग्र विश्लेषणात्मक सारांश', icon: Layers },
    { id: 'SCHOOL_PROFILE', title: 'विद्यालयवार प्रोफ़ाइल रिपोर्ट', subtitle: 'UDISE, ग्राम, प्रधान पाठक व संपर्क विवरण', icon: School },
    { id: 'STUDENTS', title: 'विद्यार्थी नामांकन व सामाजिक वर्ग रिपोर्ट', subtitle: 'कक्षावार, जेंडर, SC/ST/OBC एवं CWSN स्थिति', icon: GraduationCap },
    { id: 'STAFF', title: 'शिक्षक पदस्थापना व विषयवार रिपोर्ट', subtitle: 'स्वीकृत, कार्यरत शिक्षक एवं विषयवार उपलब्धता', icon: Users },
    { id: 'ATTENDANCE', title: 'दैनिक व मासिक उपस्थिति विश्लेषण', subtitle: 'छात्र व शिक्षक उपस्थिति प्रतिशत व औसत', icon: CalendarCheck },
    { id: 'FACILITIES', title: 'भौतिक संसाधन एवं अधोसंरचना रिपोर्ट', subtitle: 'भवन, शौचालय, पेयजल, बिजली, बाउंड्रीवाल', icon: Building2 },
    { id: 'MDM', title: 'मध्याह्न भोजन (MDM) वितरण व स्टॉक', subtitle: 'लाभान्वित छात्र, खाद्यान्न भंडार व रसोइया विवरण', icon: Utensils },
    { id: 'WORK', title: 'शासकीय कार्य एवं समय-सीमा प्रगति', subtitle: 'लंबित, प्रगतिरत व पूर्ण शासकीय कार्यों की स्थिति', icon: ClipboardList },
    { id: 'COMPLAINTS', title: 'शिकायत निवारण एवं समाधान रिपोर्ट', subtitle: 'दर्ज शिकायतें, निराकरण स्तर व लंबित प्रकरण', icon: AlertTriangle },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvData = '';
    let fileName = `${activeReportId}_Report_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReportId === 'CONSOLIDATED' || activeReportId === 'SCHOOL_PROFILE') {
      csvData = 'UDISE,SchoolName,Village,Panchayat,Type,Principal,Mobile,Status\n';
      scopedSchools.forEach((s) => {
        csvData += `"${s.udise}","${s.hindiName || s.name}","${s.village}","${s.gramPanchayat}","${s.schoolType}","${s.principalName}","${s.principalMobile}","${s.status}"\n`;
      });
    } else if (activeReportId === 'STUDENTS') {
      csvData = 'SamagraId,Name,FatherName,Class,Gender,Category,SchoolUDISE,Status\n';
      scopedStudents.forEach((st) => {
        csvData += `"${st.samagraId}","${st.name}","${st.fatherName}","${st.class}","${st.gender}","${st.category}","${st.schoolUdise}","${st.status}"\n`;
      });
    } else if (activeReportId === 'STAFF') {
      csvData = 'EmployeeID,Name,Designation,Subject,Mobile,SchoolUDISE,Status\n';
      scopedStaff.forEach((t) => {
        csvData += `"${t.employeeId}","${t.name}","${t.designation}","${t.subject}","${t.mobile}","${t.assignedSchoolUdise}","${t.status}"\n`;
      });
    } else {
      csvData = `Report,GeneratedAt,Context\n"${activeReportId}","${new Date().toLocaleString('hi-IN')}","${selectedSchool?.name || selectedSchool?.hindiName || 'सभी 37 विद्यालय'}"\n`;
    }

    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#0B6B4B]/10 text-[#0B6B4B] dark:text-emerald-400">
            <FileBarChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              शासकीय रिपोर्ट एवं विश्लेषणात्मक केंद्र (Official Reports Center)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              सत्र 2026-27 | {selectedSchool ? `${selectedSchool.name || selectedSchool.hindiName} (${selectedSchool.udise})` : 'समस्त 37 विद्यालय (क्लस्टर मलगुवां)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 hover:bg-[#0B6B4B] hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV निर्यात
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#0B6B4B] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            रिपोर्ट प्रिंट / PDF
          </button>
        </div>
      </div>

      {/* Reports Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 no-print">
        {reportList.map((rep) => {
          const Icon = rep.icon;
          const isActive = activeReportId === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setActiveReportId(rep.id)}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all text-left ${
                isActive
                  ? 'border-[#0B6B4B] bg-[#EAF6F0] dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-300 ring-2 ring-[#0B6B4B]/30 font-bold shadow-xs'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#17211C] text-gray-700 dark:text-gray-300 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B6B4B] dark:text-emerald-400' : 'text-gray-400'}`} />
                <span className="text-[11px] font-bold truncate">{rep.title}</span>
              </div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 line-clamp-1">{rep.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Active Report Preview Canvas */}
      <div className="print-report-container unicode-safe bg-white dark:bg-[#17211C] p-6 sm:p-8 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-sm print:p-0 print:border-none print:shadow-none space-y-6">
        {/* Printable Official Header */}
        <div className="border-b-2 border-[#0B6B4B] pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0B6B4B] text-white flex items-center justify-center text-xl font-bold shadow-xs">
              🏛️
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0B6B4B] dark:text-emerald-400">
                {institutionConfig.institutionName} ({institutionConfig.district})
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                विकास खंड {institutionConfig.block} • शैक्षिक एवं प्रशासनिक प्रबंधन प्रणाली • सत्र: {institutionConfig.academicSession}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                रिपोर्ट जनरेशन दिनांक: {new Date().toLocaleDateString('hi-IN')} | संदर्भ: {selectedSchool ? (selectedSchool.name || selectedSchool.hindiName) : 'समस्त संकुल'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="bg-[#FF7A00] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
              आधिकारिक रिकॉर्ड
            </span>
            <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 mt-1">
              प्रपत्र क्र.: MALG-REP-{activeReportId}
            </div>
          </div>
        </div>

        {/* Report Content Body based on activeReportId */}
        {activeReportId === 'CONSOLIDATED' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-l-4 border-[#0B6B4B] pl-2.5">
              कार्यपालन सारांश (Executive Summary)
            </h3>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">संबद्ध विद्यालय</div>
                <div className="text-xl font-bold text-[#0B6B4B] dark:text-emerald-400 mt-1">{stats.totalSchools}</div>
                <div className="text-[10px] text-gray-500">सक्रिय: {stats.activeSchools}</div>
              </div>

              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="text-[11px] text-blue-800 dark:text-blue-300 font-semibold">कुल विद्यार्थी</div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">{stats.totalStudents}</div>
                <div className="text-[10px] text-gray-500">बालक: {stats.boys} | बालिका: {stats.girls}</div>
              </div>

              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">शिक्षक एवं स्टाफ</div>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">{stats.totalStaff}</div>
                <div className="text-[10px] text-gray-500">शिक्षक: {stats.teachers} | रसोइया: {stats.rasoiya}</div>
              </div>

              <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="text-[11px] text-purple-800 dark:text-purple-300 font-semibold">दैनिक उपस्थिति</div>
                <div className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1">{stats.todayAttendancePct}%</div>
                <div className="text-[10px] text-gray-500">उपस्थित: {stats.todayPresentStudents} छात्र</div>
              </div>
            </div>

            {/* Schools Breakdown Table */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                संबद्ध विद्यालयों की सूची एवं संक्षेप विवरण
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="p-2.5">क्र.</th>
                      <th className="p-2.5">विद्यालय का नाम</th>
                      <th className="p-2.5">UDISE कोड</th>
                      <th className="p-2.5">ग्राम / पंचायत</th>
                      <th className="p-2.5">प्रकार</th>
                      <th className="p-2.5">संस्था प्रभारी</th>
                      <th className="p-2.5">मोबाइल</th>
                      <th className="p-2.5">स्थिति</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                    {scopedSchools.map((s, idx) => (
                      <tr key={s.udise} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="p-2.5 font-semibold text-gray-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-gray-900 dark:text-white">{s.hindiName || s.name}</td>
                        <td className="p-2.5 font-mono text-[11px] text-[#0B6B4B]">{s.udise}</td>
                        <td className="p-2.5">{s.village} / {s.gramPanchayat}</td>
                        <td className="p-2.5">{s.schoolType}</td>
                        <td className="p-2.5 font-medium">{s.principalName}</td>
                        <td className="p-2.5 font-mono text-[11px]">{s.principalMobile}</td>
                        <td className="p-2.5">
                          <span className="bg-emerald-100 text-[#0B6B4B] text-[10px] font-bold px-2 py-0.5 rounded">
                            {s.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रीय'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeReportId === 'STUDENTS' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-l-4 border-[#0B6B4B] pl-2.5">
              विद्यार्थी नामांकन एवं सामाजिक वर्ग विवरण
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <span className="text-gray-500">कुल छात्र: </span>
                <span className="font-bold text-gray-900 dark:text-white">{scopedStudents.length}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <span className="text-gray-500">SC: </span>
                <span className="font-bold text-gray-900 dark:text-white">{scopedStudents.filter(s => s.category === 'SC').length}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <span className="text-gray-500">ST: </span>
                <span className="font-bold text-gray-900 dark:text-white">{scopedStudents.filter(s => s.category === 'ST').length}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <span className="text-gray-500">OBC: </span>
                <span className="font-bold text-gray-900 dark:text-white">{scopedStudents.filter(s => s.category === 'OBC').length}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <span className="text-gray-500">दिव्यांग (CWSN): </span>
                <span className="font-bold text-gray-900 dark:text-white">{scopedStudents.filter(s => s.isCwsn).length}</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 font-bold border-b">
                  <tr>
                    <th className="p-2.5">समग्र आईडी</th>
                    <th className="p-2.5">विद्यार्थी का नाम</th>
                    <th className="p-2.5">पिता का नाम</th>
                    <th className="p-2.5">कक्षा</th>
                    <th className="p-2.5">जेंडर</th>
                    <th className="p-2.5">वर्ग</th>
                    <th className="p-2.5">UDISE कोड</th>
                    <th className="p-2.5">स्थिति</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700 dark:text-gray-300">
                  {scopedStudents.slice(0, 25).map((st) => (
                    <tr key={st.id}>
                      <td className="p-2.5 font-mono text-[#0B6B4B]">{st.samagraId}</td>
                      <td className="p-2.5 font-bold">{st.name}</td>
                      <td className="p-2.5">{st.fatherName}</td>
                      <td className="p-2.5">कक्षा {st.class}</td>
                      <td className="p-2.5">{st.gender}</td>
                      <td className="p-2.5">{st.category}</td>
                      <td className="p-2.5 font-mono text-[11px]">{st.schoolUdise}</td>
                      <td className="p-2.5">{st.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Generic Report View for Other Options */}
        {activeReportId !== 'CONSOLIDATED' && activeReportId !== 'STUDENTS' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-l-4 border-[#0B6B4B] pl-2.5">
              {reportList.find(r => r.id === activeReportId)?.title}
            </h3>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              सत्र 2026-27 के अंतर्गत संकुल मलगुवां के संदर्भित डेटाबेस से प्राप्त अद्यतन विश्लेषणात्मक विवरण।
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="text-gray-500">संबद्ध विद्यालय</div>
                <div className="text-base font-bold text-[#0B6B4B] dark:text-emerald-400 mt-0.5">{scopedSchools.length} विद्यालय</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-gray-500">कुल विद्यार्थी</div>
                <div className="text-base font-bold text-blue-700 dark:text-blue-400 mt-0.5">{scopedStudents.length} छात्र</div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-gray-500">शिक्षक संख्या</div>
                <div className="text-base font-bold text-amber-700 dark:text-amber-400 mt-0.5">{scopedStaff.length} शिक्षक</div>
              </div>
            </div>
          </div>
        )}

        {/* Official Signature Footer for Prints */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 text-center text-xs">
          <div>
            <div className="h-10"></div>
            <div className="font-bold text-gray-900 dark:text-white">हस्ताक्षर संस्था प्रभारी</div>
            <div className="text-[11px] text-gray-500">शासकीय विद्यालय मलगुवां संकुल</div>
          </div>
          <div>
            <div className="h-10"></div>
            <div className="font-bold text-[#0B6B4B] dark:text-emerald-400">हस्ताक्षर जन शिक्षक / संकुल समन्वयक (CAC)</div>
            <div className="text-[11px] text-gray-500">{institutionConfig.institutionName} ({institutionConfig.district})</div>
          </div>
        </div>
      </div>
    </div>
  );
};
