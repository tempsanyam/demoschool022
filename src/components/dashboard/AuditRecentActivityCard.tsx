import React from 'react';
import { Clock, ArrowRight, User, Shield, Activity } from 'lucide-react';
import { AuditLog } from '../../types';

interface AuditRecentActivityCardProps {
  activities: AuditLog[];
  onNavigate: (route: string) => void;
}

export const AuditRecentActivityCard: React.FC<AuditRecentActivityCardProps> = ({
  activities,
  onNavigate,
}) => {
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300';
      case 'UPDATE':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
      case 'DELETE':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300';
      case 'LOGIN':
      case 'LOGOUT':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300';
      case 'UPLOAD':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300';
      case 'SECURITY_ALERT':
        return 'bg-red-600 text-white font-black';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                हाल की गतिविधियां (Audit Log)
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                सिस्टम व प्रयोक्ता क्रियाकलाप रिकॉर्ड
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
          >
            <span>सभी देखें</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Audit List */}
        <div className="mt-3.5 space-y-2.5">
          {activities.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
              अभी कोई हालिया गतिविधि दर्ज नहीं है
            </div>
          ) : (
            activities.slice(0, 5).map((log, idx) => (
              <div
                key={log.id ? `${log.id}-${idx}` : `recent-act-${idx}`}
                className="p-3 rounded-xl bg-gray-50/80 dark:bg-[#111A16] border border-gray-100 dark:border-gray-800/80 hover:bg-white dark:hover:bg-[#17211C] hover:border-gray-200 dark:hover:border-gray-700 transition-all text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-gray-900 dark:text-white truncate">
                    {log.details}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.time || log.date}
                  </span>
                </div>

                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-gray-400" />
                    {log.userName} ({log.role})
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${getActionBadge(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span>सुरक्षित एवं अपरिवर्तनीय ऑडिट ट्रेल</span>
        <button
          onClick={() => onNavigate('history')}
          className="text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline"
        >
          पूर्ण ऑडिट लॉग देखें →
        </button>
      </div>
    </div>
  );
};
