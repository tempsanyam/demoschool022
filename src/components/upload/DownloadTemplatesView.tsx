import React from 'react';
import { UploadDataType } from '../../types';
import { DATA_TYPE_CONFIGS } from './uploadConfig';
import { downloadTemplateFile } from './uploadUtils';
import {
  Download,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  School,
  GraduationCap,
  Users,
  Building2,
  ClipboardCheck,
  Utensils,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

export const DownloadTemplatesView: React.FC = () => {
  const getIcon = (type: UploadDataType) => {
    switch (type) {
      case 'SCHOOL': return <School className="w-5 h-5 text-blue-600" />;
      case 'STUDENT': return <GraduationCap className="w-5 h-5 text-emerald-600" />;
      case 'TEACHER': return <Users className="w-5 h-5 text-violet-600" />;
      case 'FACILITY': return <Building2 className="w-5 h-5 text-amber-600" />;
      case 'ATTENDANCE': return <ClipboardCheck className="w-5 h-5 text-cyan-600" />;
      case 'MDM': return <Utensils className="w-5 h-5 text-orange-600" />;
      case 'COMPLAINT': return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'WORK': return <ClipboardList className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div id="download-templates-view" className="space-y-6">
      {/* Informative Guidance Card */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-950">मानक डेटा आयात टेम्पलेट्स (Official Import Templates)</h3>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              डेटा अपलोड करने से पहले कृपया नीचे दिए गए मानक टेम्पलेट्स डाउनलोड करें। इन टेम्पलेट्स में सही हेडर, डेटा प्रारूप एवं नमूना पंक्तियां पूर्व-निर्धारित हैं, जिससे डेटा बिना किसी त्रुटि के अपलोड हो सके।
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-blue-900">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> हिंदी व अंग्रेजी फॉन्ट समर्थित</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> अनिवार्य फ़ील्ड्स में (*) चिन्हित</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> मानक Excel (.xlsx) डेटा प्रारूप उपलब्ध</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Templates for All 8 Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(DATA_TYPE_CONFIGS) as UploadDataType[]).map((type) => {
          const config = DATA_TYPE_CONFIGS[type];
          return (
            <div
              key={type}
              id={`template-card-${type.toLowerCase()}`}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                      {getIcon(type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{config.titleHi}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">{config.titleEn}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-slate-100 text-slate-600">
                    {config.fields.length} कॉलम
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  {config.description}
                </p>

                {/* Key Columns Preview */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">प्रमुख हेडर:</span>
                  <div className="flex flex-wrap gap-1">
                    {config.fields.slice(0, 6).map((f) => (
                      <span
                        key={f.key}
                        className={`text-[11px] px-2 py-0.5 rounded border ${
                          f.required
                            ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {f.labelHi}
                      </span>
                    ))}
                    {config.fields.length > 6 && (
                      <span className="text-[11px] px-1.5 py-0.5 text-slate-400">
                        +{config.fields.length - 6} अन्य
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  id={`download-template-xlsx-${type.toLowerCase()}`}
                  onClick={() => downloadTemplateFile(type, 'xlsx')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx) टेम्पलेट डाउनलोड करें</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
