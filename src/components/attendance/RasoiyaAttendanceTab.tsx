import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  School,
  Save,
  Users,
  Building2,
  Phone
} from 'lucide-react';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import { AttendanceRecord, Rasoiya } from '../../types';

interface RasoiyaAttendanceTabProps {
  selectedDate: string;
  selectedSchoolUdise: string;
  onSaved?: () => void;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'OD';

interface RasoiyaEntryState {
  status: AttendanceStatus;
  remarks: string;
}

export const RasoiyaAttendanceTab: React.FC<RasoiyaAttendanceTabProps> = ({
  selectedDate,
  selectedSchoolUdise,
  onSaved
}) => {
  const {
    rasoiya: scopedRasoiya,
    schools,
    attendance: scopedAttendance,
    markAttendanceBatch,
    currentUser,
    selectedSessionId,
    isSchoolUser,
    currentSchoolUdise
  } = useSchoolScope();

  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceState, setAttendanceState] = useState<Record<string, RasoiyaEntryState>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter rasoiya by school filter
  const effectiveRasoiya = useMemo(() => {
    return scopedRasoiya.filter((r) => {
      const matchSchool =
        !selectedSchoolUdise ||
        selectedSchoolUdise === 'ALL' ||
        r.schoolUdise === selectedSchoolUdise;
      return matchSchool;
    });
  }, [scopedRasoiya, selectedSchoolUdise]);

  // Load saved attendance for the selected date and session
  useEffect(() => {
    const existingRecords = scopedAttendance.filter(
      (a) =>
        a.type === 'RASOIYA' &&
        a.date === selectedDate &&
        (!a.sessionId || a.sessionId === selectedSessionId)
    );

    const newState: Record<string, RasoiyaEntryState> = {};
    const entityMap = new Map<string, { status: AttendanceStatus; remarks: string }>();

    existingRecords.forEach((rec) => {
      if (rec.records && Array.isArray(rec.records)) {
        rec.records.forEach((r) => {
          let st: AttendanceStatus = 'PRESENT';
          if (r.status === 'ABSENT') st = 'ABSENT';
          else if (['LEAVE', 'CL', 'ML', 'EL'].includes(r.status)) st = 'LEAVE';
          else if (r.status === 'OD') st = 'OD';
          else st = 'PRESENT';

          entityMap.set(r.entityId, {
            status: st,
            remarks: r.remarks || ''
          });
        });
      }
    });

    effectiveRasoiya.forEach((r) => {
      const existing = entityMap.get(r.id) || (r.name ? entityMap.get(r.name) : undefined);
      if (existing) {
        newState[r.id] = {
          status: existing.status,
          remarks: existing.remarks
        };
      } else {
        newState[r.id] = {
          status: 'PRESENT',
          remarks: ''
        };
      }
    });

    setAttendanceState(newState);
    setSuccessMessage(null);
  }, [selectedDate, selectedSessionId, effectiveRasoiya, scopedAttendance]);

  // Search filter
  const filteredRasoiya = useMemo(() => {
    return effectiveRasoiya.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.shgName && r.shgName.toLowerCase().includes(q)) ||
        (r.mobile && r.mobile.includes(q)) ||
        (r.schoolName && r.schoolName.toLowerCase().includes(q));

      return matchQuery;
    });
  }, [effectiveRasoiya, searchQuery]);

  // Live metrics
  const stats = useMemo(() => {
    const total = filteredRasoiya.length;
    let present = 0;
    let absent = 0;
    let leave = 0;
    let od = 0;

    filteredRasoiya.forEach((r) => {
      const st = attendanceState[r.id]?.status || 'PRESENT';
      if (st === 'PRESENT') present++;
      else if (st === 'ABSENT') absent++;
      else if (st === 'LEAVE') leave++;
      else if (st === 'OD') od++;
    });

    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, leave, od, pct };
  }, [filteredRasoiya, attendanceState]);

  // Bulk action
  const handleSetAllStatus = (newStatus: AttendanceStatus) => {
    setAttendanceState((prev) => {
      const updated = { ...prev };
      filteredRasoiya.forEach((r) => {
        updated[r.id] = {
          ...(updated[r.id] || { remarks: '' }),
          status: newStatus
        };
      });
      return updated;
    });
  };

  // Individual toggle
  const handleStatusChange = (rasoiyaId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [rasoiyaId]: {
        ...(prev[rasoiyaId] || { remarks: '' }),
        status
      }
    }));
  };

  // Individual remarks
  const handleRemarksChange = (rasoiyaId: string, remarks: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [rasoiyaId]: {
        ...(prev[rasoiyaId] || { status: 'PRESENT' }),
        remarks
      }
    }));
  };

  // Save attendance
  const handleSave = () => {
    if (filteredRasoiya.length === 0) return;
    setIsSaving(true);

    try {
      // Group by schoolUdise
      const bySchool = new Map<string, Rasoiya[]>();
      filteredRasoiya.forEach((r) => {
        const udise = r.schoolUdise || (isSchoolUser ? currentSchoolUdise : schools[0]?.udise || '');
        if (!bySchool.has(udise)) {
          bySchool.set(udise, []);
        }
        bySchool.get(udise)!.push(r);
      });

      const recordsToSave: Omit<AttendanceRecord, 'id' | 'markedAt'>[] = [];

      bySchool.forEach((cookList, schoolUdise) => {
        let pCount = 0;
        let aCount = 0;
        let lCount = 0;
        let oCount = 0;

        const records = cookList.map((r) => {
          const entry = attendanceState[r.id] || { status: 'PRESENT', remarks: '' };
          if (entry.status === 'PRESENT') pCount++;
          else if (entry.status === 'ABSENT') aCount++;
          else if (entry.status === 'LEAVE') lCount++;
          else if (entry.status === 'OD') oCount++;

          return {
            entityId: r.id,
            name: r.name,
            status: entry.status as any,
            remarks: entry.remarks
          };
        });

        const total = cookList.length;
        const percentage = total > 0 ? Math.round((pCount / total) * 100) : 0;

        recordsToSave.push({
          date: selectedDate,
          schoolUdise,
          sessionId: selectedSessionId,
          type: 'RASOIYA',
          totalCount: total,
          presentCount: pCount,
          absentCount: aCount,
          leaveCount: lCount,
          onDutyCount: oCount,
          percentage,
          markedBy: currentUser?.name || 'संस्था प्रधान',
          recordedBy: currentUser?.name || 'संस्था प्रधान',
          remarks: `मध्याह्न भोजन रसोइया उपस्थिति (${pCount}/${total} उपस्थित)`,
          records
        });
      });

      markAttendanceBatch(recordsToSave);
      setSuccessMessage('रसोइया की उपस्थिति सफलतापूर्वक सुरक्षित की गई।');
      if (onSaved) onSaved();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error('Failed to save rasoiya attendance:', err);
      alert(err.message || 'रसोइया उपस्थिति सुरक्षित करने में त्रुटि आई।');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Success Notification Banner */}
      {successMessage && (
        <div
          id="rasoiya-attendance-success-toast"
          className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <span className="text-[11px] opacity-80 font-mono">
            {selectedDate} | सत्र: {selectedSessionId}
          </span>
        </div>
      )}

      {/* Summary Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-medium">कुल रसोइया</span>
          <span className="text-xl font-black text-gray-900 dark:text-white mt-0.5 block">{stats.total}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">उपस्थित (P)</span>
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">{stats.present}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-red-600 block font-medium">अनुपस्थित (A)</span>
          <span className="text-xl font-black text-red-600 mt-0.5 block">{stats.absent}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-amber-600 block font-medium">अवकाश (L)</span>
          <span className="text-xl font-black text-amber-600 mt-0.5 block">{stats.leave}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-blue-600 block font-medium">कर्तव्य पर (OD)</span>
          <span className="text-xl font-black text-blue-600 mt-0.5 block">{stats.od}</span>
        </div>
        <div className="bg-white dark:bg-[#17211C] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <span className="text-[11px] text-purple-600 block font-medium">उपस्थिति दर</span>
          <span className="text-xl font-black text-purple-700 dark:text-purple-400 mt-0.5 block">{stats.pct}%</span>
        </div>
      </div>

      {/* Search & Bulk Action Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="रसोइया का नाम, समूह या शाला खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSetAllStatus('PRESENT')}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-[#0B6B4B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-bold flex items-center gap-1 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>सभी उपस्थित करें</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetAllStatus('ABSENT')}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg font-bold flex items-center gap-1 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>सभी अनुपस्थित करें</span>
          </button>
        </div>
      </div>

      {/* Rasoiya Attendance List Table */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-bold w-12 text-center">क्र.</th>
                <th className="p-3 font-bold min-w-[200px]">रसोइया का नाम</th>
                <th className="p-3 font-bold min-w-[180px]">पदस्थ शाला (School)</th>
                <th className="p-3 font-bold min-w-[150px]">संबद्ध स्व-सहायता समूह (SHG)</th>
                <th className="p-3 font-bold min-w-[110px]">मोबाइल</th>
                <th className="p-3 font-bold text-center min-w-[260px]">उपस्थिति स्थिति (Status)</th>
                <th className="p-3 font-bold min-w-[180px]">टिप्पणी / विवरण</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRasoiya.length > 0 ? (
                filteredRasoiya.map((r, idx) => {
                  const currentEntry = attendanceState[r.id] || { status: 'PRESENT', remarks: '' };
                  const schoolObj = schools.find((sc) => sc.udise === r.schoolUdise);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors ${
                        currentEntry.status === 'ABSENT'
                          ? 'bg-red-50/30 dark:bg-red-950/20'
                          : currentEntry.status === 'LEAVE'
                          ? 'bg-amber-50/30 dark:bg-amber-950/20'
                          : currentEntry.status === 'OD'
                          ? 'bg-blue-50/30 dark:bg-blue-950/20'
                          : ''
                      }`}
                    >
                      {/* Index */}
                      <td className="p-3 text-center text-gray-400 font-mono">{idx + 1}</td>

                      {/* Cook Name */}
                      <td className="p-3">
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                            <Utensils className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <div>{r.name}</div>
                            <div className="text-[10px] text-gray-400 font-normal">
                              {r.category ? `संवर्ग: ${r.category}` : 'मध्याह्न भोजन रसोइया'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* School */}
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        <div className="font-medium truncate max-w-[200px]" title={r.schoolName || schoolObj?.name}>
                          {r.schoolName || schoolObj?.name || schoolObj?.hindiName || r.schoolUdise}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400">{r.schoolUdise}</div>
                      </td>

                      {/* SHG */}
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{r.shgName || 'संबद्ध समूह'}</div>
                      </td>

                      {/* Mobile */}
                      <td className="p-3 text-gray-600 dark:text-gray-400 font-mono">
                        {r.mobile ? `📞 ${r.mobile}` : '-'}
                      </td>

                      {/* Controls: P / A / L / OD */}
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5 p-1 bg-gray-100 dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-700 w-fit mx-auto">
                          {/* Present (P) */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.id, 'PRESENT')}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                              currentEntry.status === 'PRESENT'
                                ? 'bg-[#0B6B4B] text-white shadow-xs'
                                : 'text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                            }`}
                            title="उपस्थित (Present)"
                          >
                            <span>P</span>
                            <span className="text-[10px] font-normal hidden md:inline">उपस्थित</span>
                          </button>

                          {/* Absent (A) */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.id, 'ABSENT')}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                              currentEntry.status === 'ABSENT'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
                            }`}
                            title="अनुपस्थित (Absent)"
                          >
                            <span>A</span>
                            <span className="text-[10px] font-normal hidden md:inline">अनुपस्थित</span>
                          </button>

                          {/* Leave (L) */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.id, 'LEAVE')}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                              currentEntry.status === 'LEAVE'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-gray-600 dark:text-gray-400 hover:text-amber-600'
                            }`}
                            title="अवकाश (Leave)"
                          >
                            <span>L</span>
                            <span className="text-[10px] font-normal hidden md:inline">अवकाश</span>
                          </button>

                          {/* On Duty (OD) */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.id, 'OD')}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                              currentEntry.status === 'OD'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-gray-600 dark:text-gray-400 hover:text-blue-600'
                            }`}
                            title="कर्तव्य पर (On Duty)"
                          >
                            <span>OD</span>
                            <span className="text-[10px] font-normal hidden md:inline">कर्तव्य</span>
                          </button>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="टिप्पणी..."
                          value={currentEntry.remarks}
                          onChange={(e) => handleRemarksChange(r.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-xs"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Utensils className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
                        कोई रसोइया रिकॉर्ड उपलब्ध नहीं है।
                      </p>
                      <p className="text-xs text-gray-400">
                        मॉड्यूल 06 (रसोइया) में दर्ज रसोइया यहाँ स्वतः दिखाई देंगे।
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Action Bar */}
        {filteredRasoiya.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-[#0F1713] border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              दिनांक: <span className="font-bold text-gray-800 dark:text-gray-200">{selectedDate}</span> | कुल रसोइया:{' '}
              <span className="font-bold text-[#0B6B4B] dark:text-emerald-400">{filteredRasoiya.length}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0B6B4B] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'सुरक्षित हो रहा है...' : 'उपस्थिति सुरक्षित करें'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
