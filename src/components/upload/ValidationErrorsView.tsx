import React, { useState } from 'react';
import { ValidationErrorItem, downloadErrorReport } from './uploadUtils';
import {
  AlertCircle,
  AlertTriangle,
  Download,
  Search,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface ValidationErrorsViewProps {
  errors: ValidationErrorItem[];
  originalFileName?: string;
  onClearErrors?: () => void;
  onGoToUpload?: () => void;
}

export const ValidationErrorsView: React.FC<ValidationErrorsViewProps> = ({
  errors,
  originalFileName = 'upload_file.xlsx',
  onClearErrors,
  onGoToUpload
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFieldFilter, setSelectedFieldFilter] = useState('ALL');

  const uniqueFields = Array.from(new Set(errors.map((e) => e.fieldLabel)));

  const filteredErrors = errors.filter((err) => {
    const matchesSearch =
      err.rowNumber.toString().includes(searchTerm) ||
      err.fieldLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      err.errorMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      err.suggestedFix.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(err.uploadedValue).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesField = selectedFieldFilter === 'ALL' || err.fieldLabel === selectedFieldFilter;

    return matchesSearch && matchesField;
  });

  return (
    <div id="validation-errors-view" className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border ${
        errors.length > 0
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl text-white shadow-xs ${
              errors.length > 0 ? 'bg-rose-600' : 'bg-emerald-600'
            }`}>
              {errors.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {errors.length > 0
                  ? `त्रुटि विश्लेषण रिपोर्ट (${errors.length} अमान्य प्रविष्टियां पाई गईं)`
                  : 'कोई सत्यापन त्रुटि नहीं है (All Validations Clean)'}
              </h3>
              <p className="text-xs opacity-85 mt-0.5">
                {errors.length > 0
                  ? 'नीचे दी गई पंक्तियों में अमान्य या रिक्त डेटा पाया गया है। कृपया कारण व समाधान देखकर अपनी फ़ाइल सुधारें।'
                  : 'वर्तमान में कोई लंबित फ़ाइल त्रुटि नहीं है। आप सीधे डेटा अपलोड कर सकते हैं।'}
              </p>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                id="download-error-report-xlsx-btn"
                onClick={() => downloadErrorReport(errors, originalFileName, 'xlsx')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-700 bg-white hover:bg-rose-100/50 border border-rose-300 rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>एक्सेल एरर रिपोर्ट डाउनलोड (.xlsx)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {errors.length > 0 ? (
        <>
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-validation-errors-input"
                  type="text"
                  placeholder="पंक्ति संख्या, फ़ील्ड, त्रुटि संदेश या सुझाव खोजें..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  id="filter-error-field"
                  value={selectedFieldFilter}
                  onChange={(e) => setSelectedFieldFilter(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ALL">सभी फ़ील्ड्स ({errors.length})</option>
                  {uniqueFields.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {onClearErrors && (
              <button
                id="clear-validation-errors-btn"
                onClick={onClearErrors}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                त्रुटियां साफ़ करें
              </button>
            )}
          </div>

          {/* Detailed Error Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-center">पंक्ति</th>
                    <th className="px-4 py-3">फ़ील्ड नाम</th>
                    <th className="px-4 py-3">अपलोड किया गया मान</th>
                    <th className="px-4 py-3">त्रुटि का कारण</th>
                    <th className="px-4 py-3">सुधार का सुझाव</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredErrors.map((err, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/40 transition-colors">
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-700 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded bg-rose-100/70 border border-rose-200 text-xs">
                          पंक्ति #{err.rowNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                        {err.fieldLabel}
                        <span className="text-slate-400 text-xs block font-normal font-mono">{err.field}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600 max-w-xs truncate">
                        <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                          {String(err.uploadedValue || 'रिक्त')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-rose-700 font-semibold max-w-sm">
                        <div className="flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                          <span>{err.errorMessage}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-emerald-800 max-w-sm">
                        <div className="flex items-start gap-1.5 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                          <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                          <span>{err.suggestedFix}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">सब कुछ सही है! कोई त्रुटि नहीं मिली।</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            पिछली अपलोड प्रक्रिया में सभी सत्यापन सफलतापूर्वक पूर्ण हुए। आप नया डेटा अपलोड कर सकते हैं।
          </p>
          {onGoToUpload && (
            <button
              onClick={onGoToUpload}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <span>नया डेटा अपलोड करें</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
