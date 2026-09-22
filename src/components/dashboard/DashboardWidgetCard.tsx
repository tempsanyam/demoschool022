import React from 'react';
import {
  School,
  Building,
  GraduationCap,
  Users,
  CalendarCheck,
  Utensils,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Bell,
  Award,
  BookOpen,
  Bus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  LucideIcon,
} from 'lucide-react';
import { DynamicWidgetDefinition } from '../../config/dashboardWidgets';

const iconMap: Record<string, LucideIcon> = {
  School,
  Building,
  GraduationCap,
  Users,
  CalendarCheck,
  Utensils,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Bell,
  Award,
  BookOpen,
  Bus,
  TrendingUp,
};

interface DashboardWidgetCardProps {
  widget: DynamicWidgetDefinition;
  scopeContext: any;
  onNavigate: (route: string) => void;
  variant?: 'core' | 'secondary';
}

export const DashboardWidgetCard: React.FC<DashboardWidgetCardProps> = ({
  widget,
  scopeContext,
  onNavigate,
  variant = 'core',
}) => {
  const metric = widget.computeMetric(scopeContext);
  const IconComponent = iconMap[widget.iconName] || ClipboardList;

  const getBadgeStyle = (variantType?: string) => {
    switch (variantType) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'danger':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getAccentIconBg = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-400 group-hover:bg-[#0B6B4B] group-hover:text-white';
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white';
      case 'purple':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950/60 text-[#FF7A00] group-hover:bg-[#FF7A00] group-hover:text-white';
      case 'rose':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white';
      case 'teal':
        return 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white';
      case 'indigo':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white';
      default:
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-400 group-hover:bg-[#0B6B4B] group-hover:text-white';
    }
  };

  if (variant === 'core') {
    return (
      <div
        onClick={() => onNavigate(widget.route)}
        className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs hover:border-[#0B6B4B] dark:hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {widget.hindiTitle}
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${getAccentIconBg(
                widget.accentColor
              )}`}
            >
              <IconComponent className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {metric.mainValue}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-1 text-[11px]">
          <span className="text-gray-500 dark:text-gray-400 font-medium truncate">
            {metric.subValue || widget.subtitle}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0B6B4B] group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </div>
    );
  }

  // Secondary Widget Tile
  return (
    <div
      onClick={() => onNavigate(widget.route)}
      className={`bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs hover:border-[#0B6B4B] dark:hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between ${
        metric.isActionRequired
          ? 'ring-1 ring-amber-400/40 dark:ring-amber-500/20'
          : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
            {widget.hindiTitle}
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${getAccentIconBg(
              widget.accentColor
            )}`}
          >
            <IconComponent className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 text-xl font-black text-gray-900 dark:text-white">
          {metric.mainValue}
        </div>

        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
          {metric.subValue || widget.subtitle}
        </p>
      </div>

      {metric.badge && (
        <div className="mt-2.5 flex items-center justify-between">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBadgeStyle(
              metric.badge.variant
            )}`}
          >
            {metric.badge.text}
          </span>
          <ArrowRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </div>
  );
};
