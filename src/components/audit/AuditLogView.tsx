import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Printer,
  Clock,
  User,
  Activity,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types';
import { exportToExcel, triggerSystemPrint } from '../../utils/exportUtils';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { SmartExportModal } from '../export/SmartExportModal';

export const AuditLogView: React.FC = () => {
  const { currentUser } = useAuth();
  const { auditLogs, selectedSessionId } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [isSmartExportOpen, setIsSmartExportOpen] = useState(false);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // School role isolation: School user can ONLY see audit logs for their school or their own user actions
      if (currentUser?.role === 'SCHOOL') {
        const isMySchool = Boolean(log.schoolUdise && currentUser.assignedSchoolUdise && log.schoolUdise === currentUser.assignedSchoolUdise);
        const isMyAction = log.userId === currentUser.username || log.userId === currentUser.id;
        if (!isMySchool && !isMyAction) {
          return false;
        }
      }

      const matchSearch =
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.schoolUdise && log.schoolUdise.includes(searchTerm));

      const matchModule = selectedModule === 'ALL' || log.module === selectedModule;
      const matchAction = selectedAction === 'ALL' || log.action === selectedAction;

      return matchSearch && matchModule && matchAction;
    });
  }, [auditLogs, searchTerm, selectedModule, selectedAction, currentUser]);

  const handleExport = () => {
    const headers = [
      'क्रमांक',
      'दिनांक व समय',
      'उपयोगकर्ता नाम',
      'भूमिका (Role)',
      'मॉड्यूल (Module)',
      'कार्यवाही (Action)',
      'यूडाइस कोड',
      'विस्तृत विवरण'
    ];

    const rows = filteredLogs.map((log, idx) => [
      idx + 1,
      log.timestamp,
      log.userName,
      log.role || (log as any).userRole || 'USER',
      log.module,
      log.action,
      log.schoolUdise || 'समस्त संकुल',
      log.details
    ]);

    exportToExcel({
      title: 'जन शिक्षा केंद्र मलगुवां - डिजिटल ऑडिट एवं एक्टिविटी लॉग',
      subtitle: `सत्र ${selectedSessionId} | कुल दर्ज रिकॉर्ड: ${filteredLogs.length}`,
      headers,
      rows,
      fileName: 'Malguwa_Audit_Logs',
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              ऑडिट ट्रेल एवं एक्टिविटी लॉग (Audit & History Log)
            </h2>
            <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              कुल {filteredLogs.length} घटनाएं
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            सिस्टम में हुए प्रत्येक संशोधन, निर्माण, विलोपन एवं लॉगिन का अपरिवर्तनीय डिजिटल साक्ष्य
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <UnifiedPrintButton
            id="audit-log-unified-print"
            onPrintCurrentView={() => triggerSystemPrint()}
            onPrintReport={() => setIsSmartExportOpen(true)}
            currentViewLabel="Print Current View"
            currentViewSubtext="वर्तमान ऑडिट ट्रेल व सुरक्षा लॉग का त्वरित प्रिंट"
            reportLabel="Print Report"
            reportSubtext="सुरक्षा व सिस्टम ऑडिट रिपोर्ट / आधिकारिक A4 प्रारूप"
          />
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>एक्सेल (Excel)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="उपयोगकर्ता, विवरण, यूडाइस..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B6B4B]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium"
          >
            <option value="ALL">सभी मॉड्यूल</option>
            <option value="SCHOOLS">विद्यालय (Schools)</option>
            <option value="STUDENTS">विद्यार्थी (Students)</option>
            <option value="STAFF">शिक्षक/स्टाफ (Staff)</option>
            <option value="ATTENDANCE">उपस्थिति (Attendance)</option>
            <option value="MDM">मध्याह्न भोजन (MDM)</option>
            <option value="FACILITIES">भौतिक सुविधाएं (Facilities)</option>
            <option value="WORK">शासकीय कार्य (Work)</option>
            <option value="COMPLAINTS">शिकायतें (Complaints)</option>
            <option value="LITERACY">नवभारत साक्षरता (Literacy)</option>
            <option value="ACADEMICSESSION">शैक्षणिक सत्र (Session)</option>
            <option value="AUTH">प्रमाणीकरण व सुरक्षा (Auth/Security)</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium"
          >
            <option value="ALL">सभी कार्यवाहियां</option>
            <option value="SECURITY_ALERT">सुरक्षा अलर्ट (SECURITY_ALERT)</option>
            <option value="SCHOOL_DEACTIVATED">विद्यालय निष्क्रिय (SCHOOL_DEACTIVATED)</option>
            <option value="SCHOOL_RESTORED">विद्यालय रिस्टोर (SCHOOL_RESTORED)</option>
            <option value="UPLOAD">डेटा आयात / अपलोड (UPLOAD)</option>
            <option value="CREATE">नया निर्माण (CREATE)</option>
            <option value="UPDATE">संशोधन (UPDATE)</option>
            <option value="DELETE">विलोपन (DELETE)</option>
            <option value="LOGIN">लॉगिन (LOGIN)</option>
            <option value="LOGOUT">लॉगआउट (LOGOUT)</option>
            <option value="EXPORT">निर्यात (EXPORT)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-bold">समय व दिनांक</th>
                <th className="p-3 font-bold">उपयोगकर्ता</th>
                <th className="p-3 font-bold">मॉड्यूल</th>
                <th className="p-3 font-bold">कार्यवाही (Action)</th>
                <th className="p-3 font-bold">यूडाइस कोड</th>
                <th className="p-3 font-bold">विस्तृत विवरण (Audit Details)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLogs.map((log, idx) => {
                const isSecurityAlert = log.action === 'SECURITY_ALERT';
                const roleDisplay = log.role || (log as any).userRole || 'USER';
                const beforeVal = log.before || log.oldValue;
                const afterVal = log.after || log.newValue;
                return (
                  <tr
                    key={log.id ? `${log.id}-${idx}` : `log-${idx}`}
                    className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 ${
                      isSecurityAlert ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="p-3 whitespace-nowrap font-mono text-gray-500">
                      <div>{log.date || (log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-GB') : '')}</div>
                      <div className="text-[10px] text-gray-400">{log.time || (log.timestamp ? new Date(log.timestamp).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) : '')}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-gray-900 dark:text-white">{log.userName}</div>
                      <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded font-semibold">
                        {roleDisplay}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                      {log.module}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.action === 'SECURITY_ALERT'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 font-extrabold'
                          : log.action === 'SCHOOL_DEACTIVATED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 font-bold'
                          : log.action === 'SCHOOL_RESTORED'
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 font-bold'
                          : log.action === 'UPLOAD'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : log.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : log.action === 'UPDATE'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : log.action === 'DELETE'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : log.action === 'LOGOUT'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                      <div>{log.schoolUdise || '—'}</div>
                      {log.schoolName && log.schoolName !== log.schoolUdise && (
                        <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{log.schoolName}</div>
                      )}
                    </td>
                    <td className="p-3 text-gray-800 dark:text-gray-200">
                      <div className="font-medium">{log.details}</div>
                      {log.reason && (
                        <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          कारण (Reason): {log.reason}
                        </div>
                      )}
                      <div className="flex gap-2 mt-1">
                        {beforeVal && (
                          <details className="text-[10px] text-gray-500 cursor-pointer">
                            <summary className="hover:text-blue-600 font-semibold">पूर्व मान (Before)</summary>
                            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto font-mono text-gray-700 dark:text-gray-300 max-h-32">
                              {typeof beforeVal === 'string' ? beforeVal : JSON.stringify(beforeVal, null, 2)}
                            </pre>
                          </details>
                        )}
                        {afterVal && (
                          <details className="text-[10px] text-gray-500 cursor-pointer">
                            <summary className="hover:text-emerald-600 font-semibold">नवीन मान (After)</summary>
                            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto font-mono text-gray-700 dark:text-gray-300 max-h-32">
                              {typeof afterVal === 'string' ? afterVal : JSON.stringify(afterVal, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Smart Export Modal for Audit Logs */}
      <SmartExportModal
        isOpen={isSmartExportOpen}
        onClose={() => setIsSmartExportOpen(false)}
        initialType="COMPLETE_SCHOOL"
      />
    </div>
  );
};
