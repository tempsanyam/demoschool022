import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { UploadHistoryItem } from '../../types';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  Calendar,
  User,
  ArrowUpDown,
  Building2,
  Download,
  Eye,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const UploadHistoryView: React.FC = () => {
  const { uploadHistory, clearUploadHistory } = useData();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState<UploadHistoryItem | null>(null);

  const filteredHistory = uploadHistory.filter((item) => {
    // School role isolation
    if (currentUser?.role === 'SCHOOL') {
      const isMySchool = Boolean(
        currentUser.assignedSchoolUdise &&
        item.targetSchools &&
        item.targetSchools.includes(currentUser.assignedSchoolUdise)
      );
      const isMyUpload = item.userId === currentUser.id || item.uploadedBy === currentUser.name;
      if (!isMySchool && !isMyUpload) {
        return false;
      }
    }

    const searchTarget = `${item.fileName} ${item.uploadedBy || ''} ${item.dataType} ${item.dataTypeLabel || ''} ${(item.targetSchools || []).join(' ')}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'ALL' || item.dataType === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleExportHistory = () => {
    if (filteredHistory.length === 0) return;

    const data = filteredHistory.map((h, i) => ({
      'क्र.': i + 1,
      'दिनांक व समय': `${h.date || ''} ${h.time || ''}`,
      'फ़ाइल का नाम': h.fileName,
      'डेटा प्रकार': h.dataTypeLabel || h.dataType,
      'अपलोडकर्ता': h.uploadedBy,
      'भूमिका': h.userRole,
      'कुल पंक्तियाँ': h.totalRows,
      'नए जोड़े गए': h.addedCount,
      'अपडेट किए गए': h.updatedCount,
      'छोड़े गए': h.skippedCount,
      'विफल / त्रुटियां': h.failedCount,
      'स्थिति': h.status,
      'लक्ष्य शालाएं': (h.targetSchools || []).join(', ')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Upload_History');
    XLSX.writeFile(wb, `upload_history_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div id="upload-history-view" className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-upload-history-input"
              type="text"
              placeholder="फ़ाइल नाम, अपलोडकर्ता, डेटा प्रकार खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              id="filter-upload-history-type"
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">सभी प्रकार (All Types)</option>
              <option value="SCHOOL">विद्यालय मास्टर (School)</option>
              <option value="STUDENT">विद्यार्थी मास्टर (Student)</option>
              <option value="TEACHER">शिक्षक मास्टर (Teacher)</option>
              <option value="FACILITY">भौतिक सुविधाएं (Facility)</option>
              <option value="ATTENDANCE">उपस्थिति (Attendance)</option>
              <option value="MDM">मध्याह्न भोजन (MDM)</option>
              <option value="COMPLAINT">शिकायतें (Complaints)</option>
              <option value="WORK">शासकीय कार्य (Work)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-upload-history-btn"
            onClick={handleExportHistory}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>इतिहास एक्सेल एक्सपोर्ट</span>
          </button>

          {currentUser?.role === 'ADMIN' && uploadHistory.length > 0 && (
            <button
              id="clear-upload-history-btn"
              onClick={() => {
                if (window.confirm('क्या आप निश्चित रूप से अपलोड इतिहास साफ करना चाहते हैं?')) {
                  clearUploadHistory();
                }
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
              title="इतिहास साफ़ करें (केवल मुख्य व्यवस्थापक)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">दिनांक एवं समय</th>
                <th className="px-5 py-3.5">डेटा प्रकार</th>
                <th className="px-5 py-3.5">फ़ाइल का नाम</th>
                <th className="px-5 py-3.5">अपलोडकर्ता</th>
                <th className="px-5 py-3.5 text-center">कुल पंक्तियां</th>
                <th className="px-5 py-3.5 text-center">परिणाम (जोड़े / अपडेट / छोड़े)</th>
                <th className="px-5 py-3.5 text-center">स्थिति</th>
                <th className="px-5 py-3.5 text-right">विवरण</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>कोई अपलोड इतिहास उपलब्ध नहीं है।</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const isSuccess = item.status === 'SUCCESS';
                  const isPartial = item.status === 'PARTIAL';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-800">
                            {item.date || new Date(item.timestamp).toLocaleDateString('hi-IN')}
                          </span>
                          <span className="text-xs text-slate-400">
                            {item.time || new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.dataTypeLabel || item.dataType}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs truncate">
                        <span className="font-semibold text-slate-700">{item.fileName}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-800 font-medium">{item.uploadedBy}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.userRole}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-slate-700">{item.totalRows}</td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" title="नए जोड़े गए">
                            +{item.addedCount}
                          </span>
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200" title="अपडेट किए गए">
                            ~{item.updatedCount}
                          </span>
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200" title="छोड़े गए">
                            -{item.skippedCount}
                          </span>
                          {item.failedCount > 0 && (
                            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200" title="विफल त्रुटियां">
                              !{item.failedCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPartial
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          id={`view-history-detail-${item.id}`}
                          onClick={() => setSelectedItem(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="विस्तृत लॉग देखें"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">अपलोड इतिहास विवरण</h3>
                  <p className="text-xs text-slate-500">{selectedItem.fileName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-xs text-slate-500 block">दिनांक व समय:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.date} {selectedItem.time}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">डेटा प्रकार:</span>
                  <span className="font-semibold text-blue-700">{selectedItem.dataTypeLabel || selectedItem.dataType}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">अपलोडकर्ता:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.uploadedBy} ({selectedItem.userRole})</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">डुप्लीकेट मोड:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.duplicateMode || 'यथावत'}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center pt-2">
                <div className="p-3 bg-slate-100 rounded-xl">
                  <span className="text-xs text-slate-500 block">कुल</span>
                  <span className="text-lg font-bold text-slate-800">{selectedItem.totalRows}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-xs text-emerald-600 block">नए जोड़े</span>
                  <span className="text-lg font-bold text-emerald-700">+{selectedItem.addedCount}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-xs text-blue-600 block">अपडेट</span>
                  <span className="text-lg font-bold text-blue-700">~{selectedItem.updatedCount}</span>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">छोड़े गए</span>
                  <span className="text-lg font-bold text-slate-700">{selectedItem.skippedCount}</span>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-xs text-red-600 block">विफल/त्रुटियां</span>
                  <span className="text-lg font-bold text-red-700">{selectedItem.failedCount}</span>
                </div>
              </div>

              {selectedItem.securityRejectedCount && selectedItem.securityRejectedCount > 0 ? (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span>सुरक्षा कारणों से अस्वीकृत रिकॉर्ड्स: {selectedItem.securityRejectedCount}</span>
                  </div>
                  {selectedItem.rejectedReasons && selectedItem.rejectedReasons.length > 0 && (
                    <ul className="text-[11px] text-rose-700 space-y-1 pl-4 list-disc max-h-24 overflow-y-auto">
                      {selectedItem.rejectedReasons.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {selectedItem.targetSchools && selectedItem.targetSchools.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">प्रभावित यू-डायस कोड:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {selectedItem.targetSchools.map((udise) => (
                      <span key={udise} className="text-xs font-mono px-2 py-0.5 bg-white rounded border border-slate-300 text-slate-700">
                        {udise}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
