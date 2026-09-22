import React from 'react';
import {
  X,
  School as SchoolIcon,
  GraduationCap,
  Users,
  Utensils,
  Calendar,
  CheckCircle2,
  Clock,
  Palmtree,
  AlertTriangle,
  MapPin,
  Tag
} from 'lucide-react';
import { SchoolAttendanceSummary } from '../../services/dailyAttendanceMonitoringService';
import { useAuth } from '../../context/AuthContext';

interface SchoolAttendanceDetailModalProps {
  summary: SchoolAttendanceSummary | null;
  selectedDate: string;
  selectedSessionId: string;
  onClose: () => void;
}

export const SchoolAttendanceDetailModal: React.FC<SchoolAttendanceDetailModalProps> = ({
  summary,
  selectedDate,
  selectedSessionId,
  onClose
}) => {
  const { currentUser } = useAuth();

  if (!summary) return null;

  // Security Guard: SCHOOL users cannot drill down into other schools
  if (currentUser?.role === 'SCHOOL' && currentUser.assignedSchoolUdise !== summary.udise) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">अनधिकृत पहुँच (Access Denied)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            सुरक्षा नीति के अनुसार आप केवल अपनी आवंटित शाला का विस्तृत विवरण देख सकते हैं।
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            बंद करें
          </button>
        </div>
      </div>
    );
  }

  const { school, udise, name, hindiName, village, schoolType, student, staff, rasoiya, overall } = summary;

  const getStatusBadge = (status: string, isHoliday?: boolean) => {
    if (isHoliday || status === 'HOLIDAY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
          <Palmtree className="w-3.5 h-3.5" />
          <span>अवकाश</span>
        </span>
      );
    }
    if (status === 'SUBMITTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>जमा</span>
        </span>
      );
    }
    if (status === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>आंशिक जमा</span>
        </span>
      );
    }
    if (status === 'ERROR') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span>डेटा त्रुटि</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>लंबित</span>
      </span>
    );
  };

  const getIndividualStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            P (उपस्थित)
          </span>
        );
      case 'ABSENT':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300">
            A (अनुपस्थित)
          </span>
        );
      case 'LEAVE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
            L (अवकाश)
          </span>
        );
      case 'OD':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
            OD (ऑन ड्यूटी)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            दर्ज नहीं
          </span>
        );
    }
  };

  return (
    <div
      id="school-attendance-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#16221D] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0B6B4B] to-[#08543A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-sm">
              <SchoolIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold">
                  {name}
                </h2>
                {name !== hindiName && (
                  <span className="text-xs text-emerald-200">({hindiName})</span>
                )}
                <span className="px-2 py-0.5 rounded bg-white/20 text-white font-mono text-xs font-bold">
                  {udise}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-emerald-100 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  <span>ग्राम: {village || 'मलगुवां'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-300" />
                  <span>संवर्ग: {schoolType}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                  <span>दिनांक: {selectedDate} | सत्र: {selectedSessionId}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overall Status Banner */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span className="font-bold">समग्र उपस्थिति स्थिति (Overall Status):</span>
            {getStatusBadge(overall.status)}
            <span className="text-gray-500 dark:text-gray-400">({overall.description})</span>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Card 1: Student Attendance Card */}
          <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    विद्यार्थी उपस्थिति (Student Attendance)
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    गोपनीयता नियम: केंद्रीय अवलोकन में केवल समग्र योग दिखाया जाता है
                  </p>
                </div>
              </div>
              <div>
                {getStatusBadge(student.status, student.isHoliday)}
              </div>
            </div>

            {student.status === 'ERROR' && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{student.errorMessage}</span>
              </div>
            )}

            {student.isHoliday ? (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
                <Palmtree className="w-4 h-4 text-purple-600 shrink-0" />
                <span>शाला में आधिकारिक अवकाश घोषित: <strong>{student.holidayReason || 'अवकाश'}</strong></span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                    {student.registered}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">कुल दर्ज विद्यार्थी</div>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {student.present !== null ? student.present : '—'}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">आज उपस्थित</div>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-red-600 dark:text-red-400 font-mono">
                    {student.absent !== null ? student.absent : '—'}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">आज अनुपस्थित</div>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-[#0B6B4B] dark:text-emerald-400 font-mono">
                    {student.percentage !== null ? `${student.percentage}%` : '—'}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">उपस्थिति प्रतिशत</div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Teacher & Staff Attendance Card */}
          <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    शिक्षक एवं स्टाफ उपस्थिति (Teacher & Staff Attendance)
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    शाला में पदस्थ समस्त शिक्षकों व कर्मचारियों की दैनिक उपस्थिति
                  </p>
                </div>
              </div>
              <div>
                {getStatusBadge(staff.status, staff.isHoliday)}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-gray-900 dark:text-white font-mono">{staff.total}</div>
                <div className="text-[10px] text-gray-500">कुल पदस्थ</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {staff.present !== null ? staff.present : '—'}
                </div>
                <div className="text-[10px] text-gray-500">उपस्थित</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-red-600 dark:text-red-400 font-mono">
                  {staff.absent !== null ? staff.absent : '—'}
                </div>
                <div className="text-[10px] text-gray-500">अनुपस्थित</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {staff.leave !== null ? staff.leave : '—'}
                </div>
                <div className="text-[10px] text-gray-500">अवकाश (Leave)</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {staff.od !== null ? staff.od : '—'}
                </div>
                <div className="text-[10px] text-gray-500">ऑन ड्यूटी (OD)</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-[#0B6B4B] dark:text-emerald-400 font-mono">
                  {staff.percentage !== null ? `${staff.percentage}%` : '—'}
                </div>
                <div className="text-[10px] text-gray-500">उपस्थिति %</div>
              </div>
            </div>

            {/* Individual Staff Table */}
            {staff.individualRecords.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2 px-3 w-10 text-center">क्र.</th>
                      <th className="py-2 px-3">शिक्षक / कर्मचारी का नाम</th>
                      <th className="py-2 px-3">पदनाम (Designation)</th>
                      <th className="py-2 px-3">आज की स्थिति</th>
                      <th className="py-2 px-3">रिमार्क</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                    {staff.individualRecords.map((stf, idx) => (
                      <tr key={stf.entityId || idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                        <td className="py-2 px-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold">{stf.name}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{stf.designation || 'प्राथमिक शिक्षक'}</td>
                        <td className="py-2 px-3">{getIndividualStatusBadge(stf.status)}</td>
                        <td className="py-2 px-3 text-gray-500">{stf.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card 3: Rasoiya Attendance Card */}
          <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    मध्याह्न भोजन रसोइया उपस्थिति (MDM Rasoiya Attendance)
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    शाला में कार्यरत मध्याह्न भोजन रसोइयों की उपस्थिति स्थिति
                  </p>
                </div>
              </div>
              <div>
                {getStatusBadge(rasoiya.status, rasoiya.isHoliday)}
              </div>
            </div>

            {/* MDM Meal Preparation Status */}
            {summary.mdm && (
              <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                summary.mdm.status === 'SERVED'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : summary.mdm.status === 'NOT_SERVED'
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold">मध्याह्न भोजन (MDM) स्थिति: </span>
                    <span>
                      {summary.mdm.status === 'SERVED'
                        ? 'भोजन तैयार एवं वितरित किया गया'
                        : summary.mdm.status === 'NOT_SERVED'
                        ? 'भोजन वितरित नहीं हुआ'
                        : 'दैनिक भोजन रिकॉर्ड लंबित'}
                    </span>
                    {summary.mdm.menuItem && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1">({summary.mdm.menuItem})</span>
                    )}
                    {summary.mdm.reasonNotServed && (
                      <span className="text-red-600 font-medium ml-1">कारण: {summary.mdm.reasonNotServed}</span>
                    )}
                  </div>
                </div>
                {summary.mdm.mealsServed > 0 && (
                  <div className="font-mono font-bold shrink-0">
                    लाभान्वित छात्र: {summary.mdm.mealsServed}
                  </div>
                )}
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-gray-900 dark:text-white font-mono">{rasoiya.total}</div>
                <div className="text-[10px] text-gray-500">कुल रसोइया</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {rasoiya.present !== null ? rasoiya.present : '—'}
                </div>
                <div className="text-[10px] text-gray-500">उपस्थित</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-red-600 dark:text-red-400 font-mono">
                  {rasoiya.absent !== null ? rasoiya.absent : '—'}
                </div>
                <div className="text-[10px] text-gray-500">अनुपस्थित</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {rasoiya.leave !== null ? rasoiya.leave : '—'}
                </div>
                <div className="text-[10px] text-gray-500">अवकाश</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {rasoiya.od !== null ? rasoiya.od : '—'}
                </div>
                <div className="text-[10px] text-gray-500">अन्य कार्य</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-bold text-[#0B6B4B] dark:text-emerald-400 font-mono">
                  {rasoiya.percentage !== null ? `${rasoiya.percentage}%` : '—'}
                </div>
                <div className="text-[10px] text-gray-500">उपस्थिति %</div>
              </div>
            </div>

            {/* Individual Rasoiya Table */}
            {rasoiya.individualRecords.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2 px-3 w-10 text-center">क्र.</th>
                      <th className="py-2 px-3">रसोइया का नाम</th>
                      <th className="py-2 px-3">आज की स्थिति</th>
                      <th className="py-2 px-3">रिमार्क</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                    {rasoiya.individualRecords.map((r, idx) => (
                      <tr key={r.entityId || idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                        <td className="py-2 px-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold">{r.name}</td>
                        <td className="py-2 px-3">{getIndividualStatusBadge(r.status)}</td>
                        <td className="py-2 px-3 text-gray-500">{r.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
