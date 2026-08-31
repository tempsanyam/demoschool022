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

export const AuditLogView: React.FC = () => {
  const { currentUser } = useAuth();
  const { auditLogs } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.schoolUdise && log.schoolUdise.includes(searchTerm));

      const matchModule = selectedModule === 'ALL' || log.module === selectedModule;
      const matchAction = selectedAction === 'ALL' || log.action === selectedAction;

      return matchSearch && matchModule && matchAction;
    });
  }, [auditLogs, searchTerm, selectedModule, selectedAction]);

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
      log.userRole,
      log.module,
      log.action,
      log.schoolUdise || 'समस्त संकुल',
      log.details
    ]);

    exportToExcel({
      title: 'जन शिक्षा केंद्र मलगुवां - डिजिटल ऑडिट एवं एक्टिविटी लॉग',
      subtitle: `सत्र 2026-27 | कुल दर्ज रिकॉर्ड: ${filteredLogs.length}`,
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
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>एक्सेल (Excel)</span>
          </button>
          <button
            onClick={() => triggerSystemPrint()}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>प्रिंट (Print)</span>
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
            <option value="AUTH">प्रमाणीकरण (Auth)</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium"
          >
            <option value="ALL">सभी कार्यवाहियां</option>
            <option value="CREATE">नया निर्माण (CREATE)</option>
            <option value="UPDATE">संशोधन (UPDATE)</option>
            <option value="DELETE">विलोपन (DELETE)</option>
            <option value="LOGIN">लॉगिन (LOGIN)</option>
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
              {filteredLogs.map((log) => {
                return (
                  <tr key={log.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                    <td className="p-3 whitespace-nowrap font-mono text-gray-500">
                      {log.timestamp}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-gray-900 dark:text-white">{log.userName}</div>
                      <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded font-semibold">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                      {log.module}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : log.action === 'UPDATE'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : log.action === 'DELETE'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                      {log.schoolUdise || '—'}
                    </td>
                    <td className="p-3 text-gray-800 dark:text-gray-200">
                      <div>{log.details}</div>
                      {log.newValue && (
                        <details className="mt-1 text-[10px] text-gray-400 cursor-pointer">
                          <summary className="hover:text-emerald-600">डेटा पेलोड देखें</summary>
                          <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto font-mono text-gray-700 dark:text-gray-300">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
