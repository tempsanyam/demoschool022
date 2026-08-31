import React, { useState } from 'react';
import {
  School,
  ArrowLeft,
  Printer,
  FileSpreadsheet,
  Edit2,
  MapPin,
  GraduationCap,
  Users,
  Building2,
  Utensils,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { SchoolBanner } from '../common/SchoolBanner';
import { exportToExcel, triggerSystemPrint } from '../../utils/exportUtils';
import { SmartExportModal } from '../export/SmartExportModal';

interface SchoolProfileViewProps {
  udise: string;
  onBack: () => void;
  onNavigateToStudent?: (id: string) => void;
  onNavigateToStaff?: (id: string) => void;
}

type ProfileTab = 'OVERVIEW' | 'STUDENTS' | 'STAFF' | 'FACILITIES' | 'MDM_ATTENDANCE';

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({
  udise,
  onBack,
  onNavigateToStudent,
  onNavigateToStaff,
}) => {
  const { currentUser } = useAuth();
  const {
    schools,
    students,
    staff,
    facilities,
    attendance,
    mdmRecords,
    updateFacility,
    updateSchool
  } = useData();

  const [activeTab, setActiveTab] = useState<ProfileTab>('OVERVIEW');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const school = schools.find((s) => s.udise === udise);

  if (!school) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#17211C] rounded-2xl border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          विद्यालय विवरण नहीं मिला (यूडाइस: {udise})
        </h3>
        <button
          onClick={onBack}
          className="mt-4 bg-[#0B6B4B] text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          वापस सूची पर जाएं
        </button>
      </div>
    );
  }

  const schoolStudents = students.filter((st) => st.schoolUdise === udise);
  const schoolStaff = staff.filter((stf) => stf.assignedSchoolUdise === udise);
  const schoolFacilities = facilities.filter((f) => f.schoolUdise === udise);
  const schoolAttendance = attendance.filter((a) => a.schoolUdise === udise);
  const schoolMDM = mdmRecords.filter((m) => m.schoolUdise === udise);

  const boysCount = schoolStudents.filter((s) => s.gender === 'बालक').length;
  const girlsCount = schoolStudents.filter((s) => s.gender === 'बालिका').length;

  const handlePrintDossier = () => {
    triggerSystemPrint();
  };

  const handleExportDossier = () => {
    const headers = ['श्रेणी', 'विवरण / मान'];
    const rows = [
      ['यूडाइस कोड (UDISE)', school.udise],
      ['विद्यालय का नाम (School Name)', school.name],
      ['शाला श्रेणी / प्रकार', school.schoolType],
      ['ग्राम / मजरा', school.village],
      ['ग्राम पंचायत', school.gramPanchayat],
      ['विकासखंड / जिला', `${school.block}, ${school.district}`],
      ['संस्था प्रधान', school.principalName],
      ['प्रधान का मोबाइल', school.principalMobile],
      ['स्थापना वर्ष', school.establishmentYear],
      ['कुल दर्ज विद्यार्थी', schoolStudents.length],
      ['बालक', boysCount],
      ['बालिका', girlsCount],
      ['कुल स्टाफ / शिक्षक', schoolStaff.length],
    ];

    exportToExcel({
      title: `विद्यालय डोजियर: ${school.name || school.hindiName}`,
      subtitle: `सत्र 2026-27 | यूडाइस: ${school.udise}`,
      schoolName: school.name || school.hindiName,
      udise: school.udise,
      headers,
      rows,
      fileName: `School_Dossier_${school.udise}`,
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-[#17211C] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>सूची पर वापस जाएं</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg border border-purple-300 dark:border-purple-700 hover:bg-purple-100 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>स्मार्ट एक्सपोर्ट व प्रिंट</span>
          </button>
          <button
            onClick={handleExportDossier}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>एक्सेल डोजियर</span>
          </button>
          <button
            onClick={handlePrintDossier}
            className="px-3 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>डोजियर प्रिंट करें</span>
          </button>
        </div>
      </div>

      {/* Official Identity Banner */}
      <SchoolBanner
        schoolName={school.name}
        hindiName={school.hindiName}
        udise={school.udise}
        village={school.village}
        gramPanchayat={school.gramPanchayat}
        block={school.block}
        district={school.district}
        schoolType={school.schoolType}
        principalName={school.principalName}
        principalMobile={school.principalMobile}
      />

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-[#17211C] p-2 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap gap-1.5 text-xs no-print">
        {[
          { id: 'OVERVIEW' as ProfileTab, label: 'सामान्य विवरण (Overview)', icon: Building2 },
          { id: 'STUDENTS' as ProfileTab, label: `नामांकित छात्र (${schoolStudents.length})`, icon: GraduationCap },
          { id: 'STAFF' as ProfileTab, label: `पदस्थ शिक्षक व स्टाफ (${schoolStaff.length})`, icon: Users },
          { id: 'FACILITIES' as ProfileTab, label: `भौतिक अधोसंरचना (${schoolFacilities.length})`, icon: ShieldCheck },
          { id: 'MDM_ATTENDANCE' as ProfileTab, label: 'उपस्थिति व MDM रिकॉर्ड', icon: Utensils },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#0B6B4B] text-white shadow-xs'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Key Facts Card */}
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0B6B4B]" />
              <span>प्रशासनिक एवं भौगोलिक विवरण</span>
            </h3>
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">यूडाइस कोड (UDISE):</span>
                <span className="font-mono font-bold text-[#0B6B4B] dark:text-emerald-400">{school.udise}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">शाला प्रकार / श्रेणी:</span>
                <span className="font-bold text-gray-900 dark:text-white">{school.schoolType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">ग्राम / मजरा:</span>
                <span className="font-bold text-gray-900 dark:text-white">{school.village}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">स्थापना वर्ष:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{school.establishmentYear}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">प्रबंधन विभाग:</span>
                <span className="font-semibold text-gray-900 dark:text-white">स्कूल शिक्षा विभाग, म.प्र. शासन</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">ग्राम पंचायत:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{school.gramPanchayat}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-gray-400">जन शिक्षा केंद्र (संकुल):</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">मलगुवां (टीकमगढ़)</span>
              </div>
            </div>
          </div>

          {/* Quick Enrolment Summary Card */}
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>नामांकन व स्टाफ सांख्यिकी</span>
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-100 dark:border-blue-900">
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block">कुल छात्र</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{schoolStudents.length}</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl border border-purple-100 dark:border-purple-900">
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold block">कुल स्टाफ</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{schoolStaff.length}</span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">बालक</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{boysCount}</span>
              </div>
              <div className="p-3 bg-pink-50 dark:bg-pink-950/50 rounded-xl border border-pink-100 dark:border-pink-900">
                <span className="text-[11px] text-pink-600 dark:text-pink-400 font-bold block">बालिका</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{girlsCount}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-[#0F1713] rounded-xl text-xs space-y-1">
              <div className="font-bold text-gray-700 dark:text-gray-300">संस्था प्रधान संपर्क:</div>
              <div className="text-gray-600 dark:text-gray-400">👤 {school.principalName}</div>
              <div className="text-gray-600 dark:text-gray-400">📞 {school.principalMobile || 'मोबाइल नंबर दर्ज नहीं है'}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. STUDENTS */}
      {activeTab === 'STUDENTS' && (
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              नामांकित विद्यार्थियों की सूची ({schoolStudents.length})
            </h3>
            <span className="text-xs text-gray-500">सत्र 2026-27</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-2.5 font-bold">क्र.</th>
                  <th className="p-2.5 font-bold">समग्र आईडी</th>
                  <th className="p-2.5 font-bold">विद्यार्थी का नाम</th>
                  <th className="p-2.5 font-bold">पिता का नाम</th>
                  <th className="p-2.5 font-bold">कक्षा</th>
                  <th className="p-2.5 font-bold">लिंग</th>
                  <th className="p-2.5 font-bold">सामाजिक वर्ग</th>
                  <th className="p-2.5 font-bold">CWSN</th>
                  <th className="p-2.5 font-bold">प्रवेश क्रमांक</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {schoolStudents.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                    <td className="p-2.5 text-gray-400">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-semibold text-blue-600">{st.samagraId}</td>
                    <td className="p-2.5 font-bold text-gray-900 dark:text-white">{st.name}</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-300">{st.fatherName}</td>
                    <td className="p-2.5 font-bold text-[#0B6B4B]">{st.class}</td>
                    <td className="p-2.5">{st.gender}</td>
                    <td className="p-2.5">
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-medium">
                        {st.category}
                      </span>
                    </td>
                    <td className="p-2.5">{st.isCwsn ? 'हाँ (CWSN)' : 'नहीं'}</td>
                    <td className="p-2.5 font-mono text-gray-500">{st.scholarNo || 'SR-01'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. STAFF */}
      {activeTab === 'STAFF' && (
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              पदस्थ शिक्षक एवं गैर-शैक्षणिक स्टाफ ({schoolStaff.length})
            </h3>
            <span className="text-xs text-gray-500">संकुल मलगुवां</span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {schoolStaff.map((stf) => (
              <div
                key={stf.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#0F1713] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded">
                      {stf.employeeId || stf.employeeCode || '-'}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {stf.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    {stf.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    पद: <strong className="text-gray-700 dark:text-gray-200">{stf.designation}</strong> | विषय: {stf.subject}
                  </p>
                  <div className="mt-2 text-xs space-y-1 text-gray-600 dark:text-gray-300">
                    <div>📞 मोबाइल: <span className="font-mono">{stf.mobile}</span></div>
                    <div>🎓 योग्यता: {stf.qualification || 'B.Ed, M.A.'}</div>
                    <div>📅 पदस्थापना तिथि: {stf.joiningDate || '15/07/2016'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. FACILITIES (16 KEY INFRASTRUCTURE CHECKLIST) */}
      {activeTab === 'FACILITIES' && (
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                भौतिक अधोसंरचना एवं सुविधाएं (16 सूत्रीय चेकलिस्ट)
              </h3>
              <p className="text-xs text-gray-400">
                Data Not Entered स्थिति को स्पष्ट रूप से दर्शाया गया है (ऑटोमेटिक No नहीं माना जाता)।
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {schoolFacilities.map((fac) => {
              const isYes = fac.available === 'YES';
              const isNo = fac.available === 'NO';
              const isUnknown = fac.available === 'UNKNOWN';

              return (
                <div
                  key={fac.facilityKey}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#0F1713] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">
                      {fac.facilityName}
                    </span>
                    {fac.remarks && (
                      <span className="text-[11px] text-gray-500 block">{fac.remarks}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isYes && (
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2.5 py-1 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> उपलब्ध (YES)
                      </span>
                    )}
                    {isNo && (
                      <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold px-2.5 py-1 rounded flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> अनुपलब्ध (NO)
                      </span>
                    )}
                    {isUnknown && (
                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-2.5 py-1 rounded flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" /> Data Not Entered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. MDM & ATTENDANCE */}
      {activeTab === 'MDM_ATTENDANCE' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
              मध्याह्न भोजन (MDM) वितरण रिकॉर्ड
            </h3>
            <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {schoolMDM.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">दिनांक: {m.date}</span>
                    <span className="text-gray-500 block">मेनू: {m.menuItem}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {m.mealsServed} / {m.eligibleStudents} छात्र लाभान्वित
                    </span>
                    <span className="text-[11px] text-gray-400 block">निरीक्षक: {m.inspectedBy || 'संस्था प्रधान'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Smart Export Modal */}
      <SmartExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialType="COMPLETE_SCHOOL"
        initialUdise={school.udise}
      />
    </div>
  );
};
