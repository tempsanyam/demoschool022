import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Sparkles,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { FieldDefinition } from './ExportCenterView';

interface DynamicFieldSelectorProps {
  availableFields: FieldDefinition[];
  selectedFields: Record<string, boolean>;
  onToggleField: (key: string) => void;
  onSelectAll: (value: boolean) => void;
  onSelectMinimal: () => void;
  onResetDefault: () => void;
  scopeType: 'ALL' | 'SINGLE' | 'MULTI';
  dataTypeTitle: string;
}

export const DynamicFieldSelector: React.FC<DynamicFieldSelectorProps> = ({
  availableFields,
  selectedFields,
  onToggleField,
  onSelectAll,
  onSelectMinimal,
  onResetDefault,
  scopeType,
  dataTypeTitle,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedCount = useMemo(() => {
    return availableFields.filter((f) => selectedFields[f.key]).length;
  }, [availableFields, selectedFields]);

  const totalCount = availableFields.length;

  // Filtered fields based on search query
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return availableFields;
    const q = searchQuery.toLowerCase().trim();
    return availableFields.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        (f.category && f.category.toLowerCase().includes(q))
    );
  }, [availableFields, searchQuery]);

  // Group fields by category if present
  const groupedFields = useMemo(() => {
    const groups: { category: string; fields: FieldDefinition[] }[] = [];
    const uncategorized: FieldDefinition[] = [];

    filteredFields.forEach((field) => {
      if (field.category) {
        let group = groups.find((g) => g.category === field.category);
        if (!group) {
          group = { category: field.category, fields: [] };
          groups.push(group);
        }
        group.fields.push(field);
      } else {
        uncategorized.push(field);
      }
    });

    if (uncategorized.length > 0) {
      if (groups.length > 0) {
        groups.unshift({ category: 'सामान्य कॉलम', fields: uncategorized });
      } else {
        groups.push({ category: 'कॉलम सूची', fields: uncategorized });
      }
    }

    return groups;
  }, [filteredFields]);

  return (
    <div
      id="dynamic-field-selector-container"
      className="bg-white dark:bg-[#16211D] p-4 sm:p-5 rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-xs space-y-4"
    >
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                डायनामिक फ़ील्ड व कॉलम चयनकर्ता (Dynamic Field Selector)
              </h3>
              <span
                id="field-selection-badge"
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  selectedCount === totalCount
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#0B6B4B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : selectedCount > 0
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>
                  {selectedCount} / {totalCount} कॉलम चयनित
                </span>
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              निर्यात व प्रिंट हेतु आवश्यक कॉलम चेक/अनचेक करें ({dataTypeTitle} •{' '}
              {scopeType === 'ALL'
                ? 'समस्त संकुल शालाएं'
                : scopeType === 'SINGLE'
                ? 'एकल शाला'
                : 'कस्टम चयनित शालाएं'}
              )
            </p>
          </div>
        </div>

        {/* Quick Action Preset Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            type="button"
            id="btn-select-all-fields"
            onClick={() => onSelectAll(true)}
            className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="सभी फ़ील्ड्स को चेक करें"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>सभी चुनें</span>
          </button>

          <button
            type="button"
            id="btn-select-minimal-fields"
            onClick={onSelectMinimal}
            className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-200 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="केवल मुख्य आवश्यक कॉलम रखें"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>न्यूनतम (Core)</span>
          </button>

          <button
            type="button"
            id="btn-reset-default-fields"
            onClick={onResetDefault}
            className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="डिफ़ॉल्ट मानक कॉलम लोड करें"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>डिफ़ॉल्ट</span>
          </button>

          <button
            type="button"
            id="btn-clear-all-fields"
            onClick={() => onSelectAll(false)}
            className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="सभी कॉलम अनचेक करें"
          >
            <Square className="w-3.5 h-3.5" />
            <span>अनचेक</span>
          </button>
        </div>
      </div>

      {/* Search Input for Field Filtering (Especially helpful for large data sets) */}
      {availableFields.length > 8 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            id="input-field-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="कॉलम या फ़ील्ड नाम खोजें..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0B6B4B]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
            >
              हटाएं
            </button>
          )}
        </div>
      )}

      {/* Field Checkbox Groups */}
      <div className="space-y-3">
        {groupedFields.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            {groupedFields.length > 1 && (
              <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {group.category}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {group.fields.map((field) => {
                const isChecked = selectedFields[field.key] ?? false;
                return (
                  <label
                    key={field.key}
                    id={`field-toggle-${field.key}`}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-[#0B6B4B] dark:border-emerald-600 text-gray-900 dark:text-white shadow-2xs font-semibold'
                        : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleField(field.key)}
                      className="w-4 h-4 rounded text-[#0B6B4B] focus:ring-[#0B6B4B] border-gray-300 dark:border-gray-600 shrink-0"
                    />
                    <span className="truncate flex-1 leading-snug" title={field.label}>
                      {field.label}
                    </span>
                    {field.minimal && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold shrink-0">
                        मूल
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {filteredFields.length === 0 && (
          <div className="p-4 text-center text-xs text-gray-500 italic">
            '{searchQuery}' के लिए कोई कॉलम नहीं मिला।
          </div>
        )}
      </div>
    </div>
  );
};
