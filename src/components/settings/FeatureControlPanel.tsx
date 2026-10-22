import React, { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  CalendarClock,
  Layers,
  Sliders,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  Play,
  Filter,
} from 'lucide-react';
import { useFeatureControl } from '../../context/FeatureControlContext';
import {
  FeatureControlItemConfig,
  ControlTargetScope,
  formatRemainingDurationHi,
} from '../../config/featureControlRegistry';

export const FeatureControlPanel: React.FC = () => {
  const {
    store,
    registry,
    nowMs,
    getFeatureEvaluation,
    toggleFeature,
    scheduleTemporaryDeactivation,
    extendDeactivationDuration,
    reactivateNow,
    toggleModuleCascade,
    resetAllControlsToDefault,
  } = useFeatureControl();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CAC' | 'SCHOOL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED' | 'SCHEDULED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MODULE' | 'SUB_OPTION' | 'ACTION'>('ALL');

  // Expanded modules state (by default expand all modules so Admin sees granular sub-options & actions clearly)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    registry.filter((i) => i.itemType === 'MODULE').forEach((m) => {
      map[m.key] = true;
    });
    return map;
  });

  // Schedule Modal State
  const [scheduleModalItem, setScheduleModalItem] = useState<FeatureControlItemConfig | null>(null);
  const [scheduleScope, setScheduleScope] = useState<ControlTargetScope>('BOTH');
  const [schedulePreset, setSchedulePreset] = useState<string>('1h');
  const [customStartDateTime, setCustomStartDateTime] = useState<string>('');
  const [customEndDateTime, setCustomEndDateTime] = useState<string>('');
  const [autoReactivate, setAutoReactivate] = useState<boolean>(true);
  const [scheduleReason, setScheduleReason] = useState<string>('');
  const [scheduleMessage, setScheduleMessage] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [confirmResetModal, setConfirmResetModal] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackBanner({ type, text });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Group registry items by top-level module
  const modulesWithChildren = useMemo(() => {
    const modules = registry.filter((item) => item.itemType === 'MODULE');
    return modules.map((mod) => {
      const children = registry.filter(
        (item) => item.moduleKey === mod.key && item.itemType !== 'MODULE'
      );
      return {
        module: mod,
        children,
      };
    });
  }, [registry]);

  // Summary Statistics
  const summaryStats = useMemo(() => {
    let totalItems = registry.length;
    let cacActive = 0;
    let cacDisabled = 0;
    let schoolActive = 0;
    let schoolDisabled = 0;
    let scheduledCount = 0;

    for (const item of registry) {
      if (item.cacApplicable) {
        const ev = getFeatureEvaluation(item.key, 'CAC');
        if (ev.allowed) cacActive++;
        else cacDisabled++;
        if (ev.isTemporarilyDisabled) scheduledCount++;
      }
      if (item.schoolApplicable) {
        const ev = getFeatureEvaluation(item.key, 'SCHOOL');
        if (ev.allowed) schoolActive++;
        else schoolDisabled++;
        if (ev.isTemporarilyDisabled) scheduledCount++;
      }
    }

    return {
      totalItems,
      cacActive,
      cacDisabled,
      schoolActive,
      schoolDisabled,
      scheduledCount,
    };
  }, [registry, getFeatureEvaluation, nowMs]);

  // Filter items based on search, role, status, and itemType
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return modulesWithChildren
      .map(({ module, children }) => {
        const matchesItem = (item: FeatureControlItemConfig): boolean => {
          if (roleFilter === 'CAC' && !item.cacApplicable) return false;
          if (roleFilter === 'SCHOOL' && !item.schoolApplicable) return false;
          if (typeFilter !== 'ALL' && item.itemType !== typeFilter) return false;

          const cacEval = getFeatureEvaluation(item.key, 'CAC');
          const schoolEval = getFeatureEvaluation(item.key, 'SCHOOL');

          if (statusFilter === 'ACTIVE') {
            const isAnyActive =
              (item.cacApplicable && cacEval.allowed) ||
              (item.schoolApplicable && schoolEval.allowed);
            if (!isAnyActive) return false;
          } else if (statusFilter === 'DISABLED') {
            const isAnyDisabled =
              (item.cacApplicable && !cacEval.allowed) ||
              (item.schoolApplicable && !schoolEval.allowed);
            if (!isAnyDisabled) return false;
          } else if (statusFilter === 'SCHEDULED') {
            const isAnyScheduled =
              cacEval.isTemporarilyDisabled || schoolEval.isTemporarilyDisabled;
            if (!isAnyScheduled) return false;
          }

          if (!q) return true;
          return (
            item.labelHi.toLowerCase().includes(q) ||
            item.labelEn.toLowerCase().includes(q) ||
            item.descriptionHi.toLowerCase().includes(q) ||
            item.key.toLowerCase().includes(q)
          );
        };

        const moduleMatches = matchesItem(module);
        const matchingChildren = children.filter(matchesItem);

        if (!moduleMatches && matchingChildren.length === 0) {
          return null;
        }

        return {
          module,
          children: q || statusFilter !== 'ALL' || typeFilter !== 'ALL' ? matchingChildren : children,
        };
      })
      .filter(Boolean) as Array<{
      module: FeatureControlItemConfig;
      children: FeatureControlItemConfig[];
    }>;
  }, [
    modulesWithChildren,
    searchQuery,
    roleFilter,
    statusFilter,
    typeFilter,
    getFeatureEvaluation,
    nowMs,
  ]);

  const openScheduleModal = (item: FeatureControlItemConfig, defaultScope: ControlTargetScope = 'BOTH') => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const toLocalIsoInput = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const effectiveScope: ControlTargetScope =
      !item.schoolApplicable ? 'CAC' : !item.cacApplicable ? 'SCHOOL' : defaultScope;

    setScheduleModalItem(item);
    setScheduleScope(effectiveScope);
    setSchedulePreset('1h');
    setCustomStartDateTime(toLocalIsoInput(now));
    setCustomEndDateTime(toLocalIsoInput(oneHourLater));
    setAutoReactivate(true);
    const existingRule = store.rules[item.key];
    setScheduleReason(existingRule?.reason || 'डेटा सत्यापन / पोर्टल रखरखाव कार्य');
    setScheduleMessage(existingRule?.customMessage || '');
  };

  const handleApplySchedule = async () => {
    if (!scheduleModalItem) return;

    const now = Date.now();
    let startIso: string = new Date().toISOString();
    let endIso: string = '';

    if (schedulePreset === '1m') {
      endIso = new Date(now + 60 * 1000).toISOString();
    } else if (schedulePreset === '30m') {
      endIso = new Date(now + 30 * 60 * 1000).toISOString();
    } else if (schedulePreset === '1h') {
      endIso = new Date(now + 60 * 60 * 1000).toISOString();
    } else if (schedulePreset === '3h') {
      endIso = new Date(now + 3 * 60 * 60 * 1000).toISOString();
    } else if (schedulePreset === '1d') {
      endIso = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    } else if (schedulePreset === '3d') {
      endIso = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
    } else if (schedulePreset === '7d') {
      endIso = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      // Custom date/time
      if (!customEndDateTime) {
        showToast('कृपया समाप्ति दिनांक एवं समय (End Date/Time) चुनें।', 'info');
        return;
      }
      const parsedEnd = new Date(customEndDateTime);
      if (isNaN(parsedEnd.getTime()) || parsedEnd.getTime() <= now) {
        showToast('समाप्ति समय वर्तमान समय से आगे का होना चाहिए।', 'info');
        return;
      }
      if (customStartDateTime) {
        const parsedStart = new Date(customStartDateTime);
        if (!isNaN(parsedStart.getTime())) {
          startIso = parsedStart.toISOString();
        }
      }
      endIso = parsedEnd.toISOString();
    }

    await scheduleTemporaryDeactivation(scheduleModalItem.key, scheduleScope, {
      startTime: startIso,
      endTime: endIso,
      autoReactivate,
      reason: scheduleReason.trim() || 'निर्धारित समय तक अस्थायी रोक',
      customMessage: scheduleMessage.trim(),
    });

    const formattedEnd = new Date(endIso).toLocaleString('hi-IN', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    showToast(
      `“${scheduleModalItem.labelHi}” को [${scheduleScope}] के लिए ${formattedEnd} तक अस्थायी रूप से बंद किया गया। समय पूर्ण होने पर यह स्वतः चालू हो जाएगा।`
    );
    setScheduleModalItem(null);
  };

  const renderTypeBadge = (type: FeatureControlItemConfig['itemType']) => {
    if (type === 'MODULE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0B6B4B]/10 text-[#0B6B4B] dark:bg-emerald-950/80 dark:text-emerald-300 border border-[#0B6B4B]/20">
          <Layers className="w-3 h-3" />
          मुख्य मॉड्यूल
        </span>
      );
    }
    if (type === 'SUB_OPTION') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Sliders className="w-3 h-3" />
          उप-विकल्प / टैब
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
        <Zap className="w-3 h-3" />
        बटन / एक्शन
      </span>
    );
  };

  const renderRoleControlCell = (item: FeatureControlItemConfig, role: 'CAC' | 'SCHOOL') => {
    const applicable = role === 'CAC' ? item.cacApplicable : item.schoolApplicable;
    if (!applicable) {
      return (
        <div className="text-[11px] text-gray-400 dark:text-gray-500 italic px-2 py-1">
          लागू नहीं (N/A)
        </div>
      );
    }

    const evaluation = getFeatureEvaluation(item.key, role);
    const isAllowed = evaluation.allowed;
    const isTemp = evaluation.isTemporarilyDisabled;
    const isParentOff = evaluation.parentModuleDisabled;

    return (
      <div className="flex flex-col gap-1.5 min-w-[165px]">
        <div className="flex items-center gap-2">
          {/* Toggle Switch */}
          <button
            type="button"
            disabled={isParentOff}
            onClick={async () => {
              if (isTemp) {
                await reactivateNow(item.key, role, 'व्यवस्थापक द्वारा सीधा पुनः सक्रियण');
                showToast(`“${item.labelHi}” को ${role} पैनल के लिए पुनः सक्रिय (ACTIVE) कर दिया गया।`);
              } else {
                const nextState = !isAllowed;
                await toggleFeature(item.key, role, nextState);
                showToast(
                  `“${item.labelHi}” को ${role} पैनल के लिए ${nextState ? 'सक्रिय (ON)' : 'निष्क्रिय (OFF)'} किया गया।`
                );
              }
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isParentOff
                ? 'bg-gray-200 dark:bg-gray-800 cursor-not-allowed opacity-50'
                : isAllowed
                ? 'bg-emerald-600 cursor-pointer'
                : isTemp
                ? 'bg-amber-500 cursor-pointer'
                : 'bg-red-500 cursor-pointer'
            }`}
            title={
              isParentOff
                ? 'मुख्य मॉड्यूल बंद होने के कारण यह विकल्प स्वतः बंद है'
                : isAllowed
                ? `${role} के लिए बंद (OFF) करने हेतु क्लिक करें`
                : `${role} के लिए चालू (ON) करने हेतु क्लिक करें`
            }
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                isAllowed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          {/* Status Pill */}
          {isAllowed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              सक्रिय (ON)
            </span>
          ) : isParentOff ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
              <Lock className="w-3 h-3" />
              मॉड्यूल बंद
            </span>
          ) : isTemp ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <Clock className="w-3 h-3 animate-spin" />
              समयबद्ध बंद
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-800">
              <XCircle className="w-3 h-3" />
              बंद (OFF)
            </span>
          )}
        </div>

        {/* Countdown & Instant Reactivate Button if Temporarily Deactivated */}
        {isTemp && !isParentOff && (
          <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-lg p-1.5 text-[10px] space-y-1">
            {evaluation.remainingMs !== null && evaluation.remainingMs !== undefined && (
              <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <CalendarClock className="w-3 h-3 shrink-0" />
                <span>शेष: {formatRemainingDurationHi(evaluation.remainingMs)}</span>
              </div>
            )}
            {evaluation.reactivateAt && (
              <div className="text-gray-600 dark:text-gray-400">
                स्वतः चालू: {new Date(evaluation.reactivateAt).toLocaleString('hi-IN', { dateStyle: 'short', timeStyle: 'short' })}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1">
              <button
                type="button"
                onClick={async () => {
                  await reactivateNow(item.key, role, 'व्यवस्थापक द्वारा तत्काल पुनः सक्रिय');
                  showToast(`“${item.labelHi}” को ${role} पैनल के लिए तुरंत पुनः सक्रिय कर दिया गया।`);
                }}
                className="flex-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
              >
                <Play className="w-2.5 h-2.5" />
                <span>अभी चालू करें</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await extendDeactivationDuration(item.key, role, 15, 'व्यवस्थापक द्वारा अवधि +15 मिनट बढ़ाई गई');
                  showToast(`“${item.labelHi}” की रोक अवधि ${role} पैनल के लिए +15 मिनट बढ़ा दी गई।`);
                }}
                className="px-2 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                title="रोक की समय-सीमा 15 मिनट आगे बढ़ाएं (Extend Duration)"
              >
                <Clock className="w-2.5 h-2.5" />
                <span>+15m</span>
              </button>
            </div>
          </div>
        )}

        {/* Manual Reactivate button when permanently OFF */}
        {!isAllowed && !isTemp && !isParentOff && (
          <button
            type="button"
            onClick={async () => {
              await reactivateNow(item.key, role, 'व्यवस्थापक द्वारा मैनुअल सक्रियण');
              showToast(`“${item.labelHi}” को ${role} पैनल के लिए पुनः सक्रिय कर दिया गया।`);
            }}
            className="self-start text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Unlock className="w-3 h-3" />
            <span>पुनः चालू करें</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B6B4B] to-[#084D36] text-white p-5 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>केवल संकुल व्यवस्थापक (ADMIN) हेतु विशेषाधिकार</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <span>🔐 मॉड्यूल एवं विकल्प नियंत्रण (Granular Feature & Option Control System)</span>
          </h2>
          <p className="text-emerald-100 text-xs max-w-3xl">
            यहाँ से आप बिना कोड बदले CAC Panel एवं SCHOOL Panel के प्रत्येक मुख्य मॉड्यूल, अंदर के उप-विकल्प (Sub-options/Tabs) तथा छोटे-से-छोटे बटन/एक्शन को स्थायी या निर्धारित समय-सीमा (Auto-Reactivate Timer) के लिए ON/OFF कर सकते हैं।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const allExpanded: Record<string, boolean> = {};
              registry.filter((i) => i.itemType === 'MODULE').forEach((m) => {
                allExpanded[m.key] = true;
              });
              setExpandedModules(allExpanded);
            }}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs cursor-pointer"
          >
            सभी खोलें (Expand All)
          </button>
          <button
            type="button"
            onClick={() => setExpandedModules({})}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs cursor-pointer"
          >
            सभी संक्षिप्त करें (Collapse)
          </button>
          <button
            type="button"
            onClick={() => setConfirmResetModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white text-[#0B6B4B] hover:bg-emerald-50 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>सभी डिफ़ॉल्ट चालू करें (Reset All ON)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
          >
            बंद करें
          </button>
        </div>
      )}

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <div className="text-gray-500 dark:text-gray-400 text-[11px]">कुल नियंत्रित विकल्प</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
            {summaryStats.totalItems}
          </div>
          <div className="text-[10px] text-gray-500">{modulesWithChildren.length} मॉड्यूल + उप-विकल्प + बटन</div>
        </div>

        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <div className="text-gray-500 dark:text-gray-400 text-[11px]">CAC पैनल (सक्रिय / बंद)</div>
          <div className="text-lg font-bold mt-0.5 flex items-center gap-2">
            <span className="text-emerald-600">{summaryStats.cacActive} ON</span>
            <span className="text-gray-300">/</span>
            <span className={summaryStats.cacDisabled > 0 ? 'text-red-600' : 'text-gray-400'}>
              {summaryStats.cacDisabled} OFF
            </span>
          </div>
          <div className="text-[10px] text-gray-500">जन शिक्षक (CAC) अधिकार</div>
        </div>

        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <div className="text-gray-500 dark:text-gray-400 text-[11px]">SCHOOL पैनल (सक्रिय / बंद)</div>
          <div className="text-lg font-bold mt-0.5 flex items-center gap-2">
            <span className="text-emerald-600">{summaryStats.schoolActive} ON</span>
            <span className="text-gray-300">/</span>
            <span className={summaryStats.schoolDisabled > 0 ? 'text-red-600' : 'text-gray-400'}>
              {summaryStats.schoolDisabled} OFF
            </span>
          </div>
          <div className="text-[10px] text-gray-500">शाला प्रभारी (SCHOOL) अधिकार</div>
        </div>

        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs">
          <div className="text-gray-500 dark:text-gray-400 text-[11px]">समयबद्ध अस्थायी रोक</div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{summaryStats.scheduledCount}</span>
          </div>
          <div className="text-[10px] text-gray-500">टाइमर समाप्त होने पर स्वतः चालू</div>
        </div>

        <div className="bg-white dark:bg-[#17211C] p-3.5 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-gray-500 dark:text-gray-400 text-[11px]">अंतिम संशोधन</div>
          <div className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1 truncate">
            {store.updatedByName || 'System'}
          </div>
          <div className="text-[10px] text-gray-500">
            {new Date(store.updatedAt).toLocaleString('hi-IN', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="मॉड्यूल, उप-विकल्प या बटन खोजें (उदा. छात्र, उपस्थिति, प्रिंट, नया जोड़ें, MDM)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F6F9F7] dark:bg-[#111A16] text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F6F9F7] dark:bg-[#111A16] p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <Filter className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
            {(['ALL', 'CAC', 'SCHOOL'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  roleFilter === r
                    ? 'bg-[#0B6B4B] text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                }`}
              >
                {r === 'ALL' ? 'दोनों पैनल' : r === 'CAC' ? 'केवल CAC' : 'केवल SCHOOL'}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F6F9F7] dark:bg-[#111A16] text-gray-800 dark:text-gray-200 font-semibold text-xs"
          >
            <option value="ALL">सभी स्थितियाँ (All Status)</option>
            <option value="ACTIVE">केवल सक्रिय (Active ON)</option>
            <option value="DISABLED">केवल बंद (Disabled OFF)</option>
            <option value="SCHEDULED">समयबद्ध रोक (Scheduled Timer)</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F6F9F7] dark:bg-[#111A16] text-gray-800 dark:text-gray-200 font-semibold text-xs"
          >
            <option value="ALL">सभी स्तर (मॉड्यूल + सब-ऑप्शन + बटन)</option>
            <option value="MODULE">केवल मुख्य मॉड्यूल (Modules)</option>
            <option value="SUB_OPTION">केवल उप-विकल्प / टैब (Sub-options)</option>
            <option value="ACTION">केवल बटन / एक्शन (Buttons/Actions)</option>
          </select>
        </div>
      </div>

      {/* Hierarchical Module Control List */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="bg-white dark:bg-[#17211C] p-8 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] text-center text-gray-500">
            आपकी खोज या फ़िल्टर के अनुरूप कोई मॉड्यूल/विकल्प नहीं मिला।
          </div>
        ) : (
          filteredGroups.map(({ module, children }) => {
            const isExpanded = expandedModules[module.key] ?? true;
            const rule = store.rules[module.key];

            return (
              <div
                key={module.key}
                className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-2xs overflow-hidden"
              >
                {/* Top-Level Module Row */}
                <div className="p-4 bg-[#F6F9F7]/80 dark:bg-[#131C18] border-b border-[#DDE7E2] dark:border-[#2B3933] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedModules((prev) => ({
                          ...prev,
                          [module.key]: !isExpanded,
                        }))
                      }
                      className="mt-0.5 p-1.5 rounded-lg bg-white dark:bg-[#17211C] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 cursor-pointer shrink-0"
                      title={isExpanded ? 'उप-विकल्प संक्षिप्त करें' : 'उप-विकल्प देखें'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderTypeBadge(module.itemType)}
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                          {module.labelHi}
                        </h3>
                        <span className="text-[11px] font-mono text-gray-400">
                          ({children.length} आंतरिक विकल्प/बटन)
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        {module.descriptionHi}
                      </p>
                      {(rule?.reason || rule?.customMessage) && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5 pt-0.5">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {rule.reason ? `कारण: ${rule.reason}` : ''}{' '}
                            {rule.customMessage ? `| संदेश: "${rule.customMessage}"` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Module Controls for CAC, SCHOOL, and Timer */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-6 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-200/70 dark:border-gray-800">
                    {(roleFilter === 'ALL' || roleFilter === 'CAC') && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          CAC पैनल (जन शिक्षक)
                        </div>
                        {renderRoleControlCell(module, 'CAC')}
                      </div>
                    )}

                    {(roleFilter === 'ALL' || roleFilter === 'SCHOOL') && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          SCHOOL पैनल (शाला)
                        </div>
                        {renderRoleControlCell(module, 'SCHOOL')}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => openScheduleModal(module, 'BOTH')}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span>समय-सीमा / टाइमर</span>
                      </button>

                      {children.length > 0 && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async () => {
                              await toggleModuleCascade(module.key, 'BOTH', true);
                              showToast(`“${module.labelHi}” के सभी विकल्प दोनों पैनल के लिए चालू (ON) किए गए।`);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold cursor-pointer"
                            title="इस मॉड्यूल और इसके सभी सब-ऑप्शन को एक साथ ON करें"
                          >
                            सब ON
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await toggleModuleCascade(module.key, 'BOTH', false);
                              showToast(`“${module.labelHi}” और इसके सभी उप-विकल्प बंद (OFF) किए गए।`);
                            }}
                            className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-[10px] font-bold cursor-pointer"
                            title="इस मॉड्यूल और इसके सभी सब-ऑप्शन को एक साथ OFF करें"
                          >
                            सब OFF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Child Sub-Options & Granular Action Buttons */}
                {isExpanded && children.length > 0 && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800/70">
                    {children.map((child) => {
                      const childRule = store.rules[child.key];
                      return (
                        <div
                          key={child.key}
                          className="px-4 py-3 pl-8 sm:pl-11 hover:bg-gray-50/60 dark:hover:bg-gray-800/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {renderTypeBadge(child.itemType)}
                              <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                                {child.labelHi}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {child.descriptionHi}
                            </p>
                            {(childRule?.reason || childRule?.customMessage) && (
                              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                {childRule.reason ? `कारण: ${childRule.reason}` : ''}{' '}
                                {childRule.customMessage ? `| संदेश: "${childRule.customMessage}"` : ''}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 lg:gap-6 shrink-0">
                            {(roleFilter === 'ALL' || roleFilter === 'CAC') && (
                              <div>{renderRoleControlCell(child, 'CAC')}</div>
                            )}

                            {(roleFilter === 'ALL' || roleFilter === 'SCHOOL') && (
                              <div>{renderRoleControlCell(child, 'SCHOOL')}</div>
                            )}

                            <button
                              type="button"
                              onClick={() => openScheduleModal(child, 'BOTH')}
                              className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-amber-50 dark:bg-gray-800 dark:hover:bg-amber-950/50 text-gray-700 hover:text-amber-800 dark:text-gray-300 dark:hover:text-amber-300 border border-gray-200 dark:border-gray-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                              title="इस विकल्प/बटन को कुछ समय के लिए बंद करने का टाइमर सेट करें"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>टाइमर सेट करें</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Time-Based Temporary Deactivation Modal */}
      {scheduleModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#17211C] border border-[#DDE7E2] dark:border-[#2B3933] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>समय-आधारित अस्थायी निष्क्रियण (Time-Based Control)</span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  {scheduleModalItem.labelHi}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalItem(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Role Selection */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-700 dark:text-gray-300">
                1. किस पैनल के लिए अस्थायी रूप से बंद करना है?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {scheduleModalItem.cacApplicable && scheduleModalItem.schoolApplicable && (
                  <button
                    type="button"
                    onClick={() => setScheduleScope('BOTH')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs cursor-pointer ${
                      scheduleScope === 'BOTH'
                        ? 'bg-[#0B6B4B] text-white border-[#0B6B4B]'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    दोनों (CAC + SCHOOL)
                  </button>
                )}
                {scheduleModalItem.cacApplicable && (
                  <button
                    type="button"
                    onClick={() => setScheduleScope('CAC')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs cursor-pointer ${
                      scheduleScope === 'CAC'
                        ? 'bg-[#0B6B4B] text-white border-[#0B6B4B]'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    केवल CAC पैनल
                  </button>
                )}
                {scheduleModalItem.schoolApplicable && (
                  <button
                    type="button"
                    onClick={() => setScheduleScope('SCHOOL')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs cursor-pointer ${
                      scheduleScope === 'SCHOOL'
                        ? 'bg-[#0B6B4B] text-white border-[#0B6B4B]'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    केवल SCHOOL पैनल
                  </button>
                )}
              </div>
            </div>

            {/* Duration Presets */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-700 dark:text-gray-300">
                2. कितनी अवधि के लिए बंद रखना है? (Quick Duration Presets)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[
                  { id: '1m', label: '1 मिनट (Test)' },
                  { id: '30m', label: '30 मिनट' },
                  { id: '1h', label: '1 घंटा' },
                  { id: '3h', label: '3 घंटे' },
                  { id: '1d', label: '1 दिन (24h)' },
                  { id: '3d', label: '3 दिन' },
                  { id: '7d', label: '7 दिन' },
                  { id: 'custom', label: 'कस्टम समय' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSchedulePreset(preset.id)}
                    className={`py-2 px-2.5 rounded-xl font-bold border text-xs cursor-pointer ${
                      schedulePreset === preset.id
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-amber-50/40'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date/Time Picker */}
            {schedulePreset === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F6F9F7] dark:bg-[#111A16] p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300">
                    प्रारंभ दिनांक एवं समय (Start)
                  </label>
                  <input
                    type="datetime-local"
                    value={customStartDateTime}
                    onChange={(e) => setCustomStartDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#17211C] text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300">
                    समाप्ति / पुनः सक्रियण समय (End) *
                  </label>
                  <input
                    type="datetime-local"
                    value={customEndDateTime}
                    onChange={(e) => setCustomEndDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#17211C] text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Auto-reactivate toggle */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={autoReactivate}
                onChange={(e) => setAutoReactivate(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0B6B4B] focus:ring-[#0B6B4B]"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                  निर्धारित समय समाप्त होते ही सुविधा अपने आप पुनः ACTIVE करें (Auto-Reactivate)
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">
                  समय पूरा होने पर बिना किसी मैनुअल हस्तक्षेप के यह विकल्प स्वतः उपयोगकर्ताओं के लिए खुल जाएगा।
                </span>
              </div>
            </label>

            {/* Reason & Custom Hindi Message */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block font-bold text-gray-700 dark:text-gray-300">
                  3. प्रशासनिक कारण (Reason for Deactivation)
                </label>
                <input
                  type="text"
                  value={scheduleReason}
                  onChange={(e) => setScheduleReason(e.target.value)}
                  placeholder="उदा. वार्षिक डेटा मिलान / सत्र लॉक कार्यवाही"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F6F9F7] dark:bg-[#111A16] text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-700 dark:text-gray-300">
                  4. उपयोगकर्ता के लिए कस्टम सूचना संदेश (Optional Custom Banner Message)
                </label>
                <textarea
                  rows={2}
                  value={scheduleMessage}
                  onChange={(e) => setScheduleMessage(e.target.value)}
                  placeholder="यह सुविधा वर्तमान में व्यवस्थापक (ADMIN) द्वारा अस्थायी रूप से बंद की गई है।"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F6F9F7] dark:bg-[#111A16] text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setScheduleModalItem(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleApplySchedule}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>समयबद्ध रोक लागू करें</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Bulk Reset Modal */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#17211C] border border-[#DDE7E2] dark:border-[#2B3933] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                सभी मॉड्यूल व विकल्प डिफ़ॉल्ट स्थिति में चालू करें?
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              इससे CAC पैनल और SCHOOL पैनल के लिए लगाए गए सभी अस्थायी टाइमर और रोक हट जाएंगे तथा सभी मॉड्यूल व बटन अपनी मूल प्राधिकृत स्थिति (Default Active) में आ जाएंगे।
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={async () => {
                  await resetAllControlsToDefault('व्यवस्थापक द्वारा सभी नियंत्रण डिफ़ॉल्ट रीसेट');
                  setConfirmResetModal(false);
                  showToast('समस्त मॉड्यूल एवं विकल्प डिफ़ॉल्ट रूप से पुनः सक्रिय (ON) कर दिए गए हैं।');
                }}
                className="px-4 py-2 rounded-xl bg-[#0B6B4B] hover:bg-[#09563C] text-white font-bold cursor-pointer"
              >
                हाँ, सभी डिफ़ॉल्ट चालू करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
