import {
  DashboardWidgetConfig,
  DashboardMetricValue,
  UserRole,
  WidgetCategory
} from '../types';

export interface DynamicWidgetDefinition extends DashboardWidgetConfig {
  /**
   * Evaluates if this module is active, registered, and authorized in the system.
   * Future modules automatically appear if this evaluates to true with valid data.
   */
  isAvailable: (context: any) => boolean;

  /**
   * Computes strictly live dynamic values from the scoped data context.
   */
  computeMetric: (context: any) => DashboardMetricValue;
}

/**
 * Extensible Dynamic Dashboard Widgets Registry
 * 
 * Supports both present and future modules (e.g. Scholarship, Library, Transport, Sports).
 * Any module added here with `isAvailable: true` will automatically render on the dashboard
 * in its respective category without manual hardcoding in JSX.
 */
export const dashboardWidgetRegistry: DynamicWidgetDefinition[] = [
  // ==========================================
  // 1. CORE METRICS (Primary Top Grid)
  // ==========================================
  {
    id: 'schools',
    title: 'Schools',
    hindiTitle: 'संकुल विद्यालय',
    subtitle: 'मान्यता प्राप्त शासकीय शालाएं',
    category: 'CORE_METRIC',
    iconName: 'School',
    route: 'schools',
    order: 1,
    clusterOnly: true, // Only for Admin / CAC (never for School role)
    allowedRoles: ['ADMIN', 'CAC'],
    accentColor: 'emerald',
    isAvailable: (ctx) => !ctx.isSchoolUser,
    computeMetric: (ctx) => {
      const active = ctx.scopedStats.activeSchools;
      const inactive = ctx.scopedStats.inactiveSchools || 0;
      return {
        mainValue: active,
        subValue: inactive > 0 ? `सक्रिय शालाएं (${inactive} सुरक्षित निष्क्रिय / आर्काइव्ड)` : 'समस्त संकुल शालाएं सक्रिय',
        badge: {
          text: `${active} सक्रिय संचालित`,
          variant: 'success',
        },
        breakdown: [
          { label: 'सक्रिय शालाएं', count: active, color: '#0B6B4B' },
          ...(inactive > 0 ? [{ label: 'निष्क्रिय / आर्काइव', count: inactive, color: '#F59E0B' }] : []),
        ],
        isEmpty: active === 0,
        emptyMessage: 'कोई सक्रिय शाला रिकॉर्ड नहीं',
      };
    },
  },
  {
    id: 'school_profile',
    title: 'School Type',
    hindiTitle: 'शाला विवरण व श्रेणी',
    subtitle: 'दर्ज शाला का विवरण',
    category: 'CORE_METRIC',
    iconName: 'Building',
    route: 'profile',
    order: 1,
    schoolOnly: true, // Only for individual school user
    allowedRoles: ['SCHOOL'],
    accentColor: 'emerald',
    isAvailable: (ctx) => ctx.isSchoolUser,
    computeMetric: (ctx) => {
      const type = ctx.currentSchool?.schoolType || 'शासकीय प्राथमिक';
      const village = ctx.currentSchool?.village || '';
      return {
        mainValue: type,
        subValue: `ग्राम: ${village} | UDISE: ${ctx.currentSchoolUdise}`,
        badge: {
          text: 'सत्यापित शाला',
          variant: 'success',
        },
        isEmpty: !ctx.currentSchool,
        emptyMessage: 'शाला प्रोफ़ाइल अनुपलब्ध',
      };
    },
  },
  {
    id: 'students',
    title: 'Enrolled Students',
    hindiTitle: 'कुल दर्ज विद्यार्थी',
    subtitle: 'सत्र कुल नामांकन',
    category: 'CORE_METRIC',
    iconName: 'GraduationCap',
    route: 'students',
    order: 2,
    accentColor: 'blue',
    isAvailable: () => true,
    computeMetric: (ctx) => {
      const total = ctx.scopedStats.totalStudents;
      const boys = ctx.scopedStats.boys;
      const girls = ctx.scopedStats.girls;
      const cwsn = ctx.scopedStats.cwsn;
      const promoted = ctx.scopedStats.promotedCount || 0;
      return {
        mainValue: total,
        subValue: promoted > 0
          ? `सक्रिय: ${total} | कक्षोन्नत: ${promoted}`
          : `बालक: ${boys} | बालिका: ${girls}`,
        badge: {
          text: promoted > 0 ? `${promoted} कक्षोन्नत` : (cwsn > 0 ? `CWSN: ${cwsn}` : 'नामांकन अद्यतन'),
          variant: 'info',
        },
        breakdown: [
          { label: 'बालक', count: boys, color: '#2563EB' },
          { label: 'बालिका', count: girls, color: '#EC4899' },
          { label: 'दिव्यांग', count: cwsn, color: '#8B5CF6' },
        ],
        isEmpty: total === 0,
        emptyMessage: 'अभी कोई विद्यार्थी दर्ज नहीं है',
      };
    },
  },
  {
    id: 'teachers',
    title: 'Teachers & Staff',
    hindiTitle: 'शिक्षक एवं स्टाफ',
    subtitle: 'स्वीकृत एवं पदस्थ शैक्षणिक व सहयोगी स्टाफ',
    category: 'CORE_METRIC',
    iconName: 'Users',
    route: 'teachers',
    order: 3,
    accentColor: 'purple',
    isAvailable: () => true,
    computeMetric: (ctx) => {
      const total = ctx.scopedStats.totalStaff;
      const principals = ctx.scopedStats.principals;
      const teachers = ctx.scopedStats.teachers;
      const rasoiya = ctx.scopedStats.rasoiya;
      const academicStaff = principals + teachers;
      return {
        mainValue: total,
        subValue: `प्र.अ.: ${principals} | शिक्षक: ${teachers} | रसोइया: ${rasoiya}`,
        badge: {
          text: `${academicStaff} शैक्षणिक स्टाफ`,
          variant: total > 0 ? 'success' : 'warning',
        },
        breakdown: [
          { label: 'संस्था प्रधान', count: principals, color: '#7C3AED' },
          { label: 'शिक्षक', count: teachers, color: '#0B6B4B' },
          { label: 'रसोइया', count: rasoiya, color: '#F59E0B' },
        ],
        isEmpty: total === 0,
        emptyMessage: 'स्टाफ सूची उपलब्ध नहीं है',
      };
    },
  },
  {
    id: 'attendance',
    title: "Today's Attendance",
    hindiTitle: 'उपस्थिति स्थिति',
    subtitle: 'सत्र एवं दैनिक उपस्थिति अद्यतन',
    category: 'CORE_METRIC',
    iconName: 'CalendarCheck',
    route: 'attendance',
    order: 4,
    accentColor: 'amber',
    isAvailable: () => true,
    computeMetric: (ctx) => {
      const isCurrent = ctx.selectedSessionId === ctx.activeSessionId;
      const isRecorded = ctx.scopedStats.todayAttendanceRecorded;
      const hasSessionAtt = (ctx.scopedStats.sessionMarkedTotal || 0) > 0;

      if (!isCurrent) {
        if (hasSessionAtt) {
          const pct = ctx.scopedStats.sessionAttendancePct || 0;
          return {
            mainValue: `${pct}%`,
            subValue: `सत्र औसत उपस्थिति (${ctx.scopedStats.sessionPresentTotal} / ${ctx.scopedStats.sessionMarkedTotal} छात्र)`,
            badge: {
              text: `सत्र ${ctx.selectedSessionId} अभिलेख`,
              variant: pct >= 75 ? 'success' : 'warning',
            },
            isActionRequired: false,
            isEmpty: false,
          };
        }
        return {
          mainValue: '0%',
          subValue: `सत्र ${ctx.selectedSessionId} में उपस्थिति दर्ज नहीं है`,
          badge: {
            text: 'अभिलेख शेष',
            variant: 'warning',
          },
          isActionRequired: false,
          isEmpty: true,
          emptyMessage: `सत्र ${ctx.selectedSessionId} में उपस्थिति डेटा उपलब्ध नहीं`,
        };
      }

      // For current session:
      const pct = ctx.scopedStats.todayAttendancePct;
      const present = ctx.scopedStats.todayPresentStudents;
      const marked = ctx.scopedStats.todayTotalMarkedStudents;

      if (isRecorded) {
        return {
          mainValue: `${pct}%`,
          subValue: `उपस्थित: ${present} / ${marked} छात्र`,
          badge: {
            text: `${pct}% आज की उपस्थिति`,
            variant: pct >= 75 ? 'success' : 'warning',
          },
          isActionRequired: false,
          isEmpty: false,
        };
      }

      if (hasSessionAtt) {
        const sessPct = ctx.scopedStats.sessionAttendancePct || 0;
        return {
          mainValue: `${sessPct}%`,
          subValue: 'सत्र औसत उपस्थिति (आज की प्रविष्टि शेष)',
          badge: {
            text: 'आज प्रविष्टि शेष',
            variant: 'warning',
          },
          isActionRequired: true,
          isEmpty: false,
        };
      }

      return {
        mainValue: 'प्रतीक्षित',
        subValue: 'आज की उपस्थिति दर्ज नहीं हुई है',
        badge: {
          text: 'प्रविष्टि शेष',
          variant: 'danger',
        },
        isActionRequired: true,
        isEmpty: false,
        emptyMessage: 'उपस्थिति डेटा उपलब्ध नहीं',
      };
    },
  },

  // ==========================================
  // 2. SECONDARY METRICS (Operational Tiles)
  // ==========================================
  {
    id: 'mdm',
    title: 'Mid-Day Meal (MDM)',
    hindiTitle: 'मध्याह्न भोजन (MDM)',
    subtitle: 'दैनिक व सत्र पोषाहार वितरण',
    category: 'SECONDARY_METRIC',
    iconName: 'Utensils',
    route: 'mdm',
    order: 5,
    accentColor: 'emerald',
    isAvailable: () => true,
    computeMetric: (ctx) => {
      const isCurrent = ctx.selectedSessionId === ctx.activeSessionId;
      const isRecorded = ctx.scopedStats.mdmRecordedToday;
      const hasSessionMDM = (ctx.scopedStats.sessionMdmServedTotal || 0) > 0;

      if (!isCurrent) {
        if (hasSessionMDM) {
          return {
            mainValue: `${ctx.scopedStats.sessionMdmServedTotal} भोजन`,
            subValue: `सत्र ${ctx.selectedSessionId} कुल पोषाहार वितरण`,
            badge: {
              text: `सत्र ${ctx.selectedSessionId} अभिलेख`,
              variant: 'success',
            },
            isActionRequired: false,
            isEmpty: false,
          };
        }
        return {
          mainValue: '0 छात्र',
          subValue: `सत्र ${ctx.selectedSessionId} में MDM वितरण दर्ज नहीं`,
          badge: {
            text: 'अभिलेख शेष',
            variant: 'warning',
          },
          isActionRequired: false,
          isEmpty: true,
          emptyMessage: `सत्र ${ctx.selectedSessionId} में MDM रिकॉर्ड नहीं`,
        };
      }

      // Current session:
      const served = ctx.scopedStats.mdmServedCount;
      const menu = ctx.scopedStats.mdmMenuToday;

      if (isRecorded) {
        return {
          mainValue: `${served} छात्र`,
          subValue: `मेनू: ${menu || 'दाल-रोटी, हरी सब्जी'}`,
          badge: {
            text: 'वितरित (सत्यापित)',
            variant: 'success',
          },
          isActionRequired: false,
          isEmpty: false,
        };
      }

      if (hasSessionMDM) {
        return {
          mainValue: 'प्रतीक्षित',
          subValue: 'विगत वितरण सुरक्षित (आज की प्रविष्टि शेष)',
          badge: {
            text: 'आज प्रविष्टि शेष',
            variant: 'warning',
          },
          isActionRequired: true,
          isEmpty: false,
        };
      }

      return {
        mainValue: 'प्रविष्टि शेष',
        subValue: 'आज का MDM वितरण दर्ज करें',
        badge: {
          text: 'आज शेष',
          variant: 'warning',
        },
        isActionRequired: true,
        isEmpty: !isRecorded && ctx.scopedStats.totalStudents === 0,
        emptyMessage: 'MDM वितरण रिकॉर्ड उपलब्ध नहीं',
      };
    },
  },
  {
    id: 'work',
    title: 'Government Work & Orders',
    hindiTitle: 'शासकीय कार्य / आदेश',
    subtitle: 'समय-सीमा व प्रगति स्थिति',
    category: 'SECONDARY_METRIC',
    iconName: 'ClipboardList',
    route: 'work',
    order: 6,
    accentColor: 'blue',
    isAvailable: () => true,
    computeMetric: (ctx) => {
      const pending = ctx.scopedStats.pendingWorkCount;
      const inProgress = ctx.scopedStats.inProgressWorkCount;
      const overdue = ctx.scopedStats.overdueWorkCount;
      const completed = ctx.scopedStats.completedWorkCount;
      const activeTotal = pending + inProgress + overdue;

      return {
        mainValue: `${activeTotal} कार्य`,
        subValue: overdue > 0 ? `${overdue} अति-लंबित कार्य!` : `पूर्ण: ${completed} कार्य`,
        badge: {
          text: overdue > 0 ? `${overdue} समय-सीमा पार` : `${completed} पूर्ण`,
          variant: overdue > 0 ? 'danger' : activeTotal > 0 ? 'warning' : 'success',
        },
        isActionRequired: overdue > 0 || pending > 0,
        isEmpty: ctx.scopedStats.totalGovernmentWork === 0,
        emptyMessage: 'कोई शासकीय कार्य पंजीकृत नहीं',
      };
    },
  },
  {
    id: 'complaints',
    title: 'Grievances & Complaints',
    hindiTitle: 'शिकायत निवारण',
    subtitle: 'सी.एम. हेल्पलाइन व जनसुनवाई',
    category: 'SECONDARY_METRIC',
    iconName: 'AlertTriangle',
    route: 'complaints',
    order: 7,
    accentColor: 'rose',
    isAvailable: () => true,
    computeMetric: (ctx) => {
      const pending = ctx.scopedStats.pendingComplaints;
      const total = ctx.scopedStats.totalComplaints;
      const resolved = ctx.scopedStats.resolvedComplaints;

      return {
        mainValue: `${pending} लंबित`,
        subValue: `कुल: ${total} | निराकृत: ${resolved}`,
        badge: {
          text: pending === 0 ? 'सभी निराकृत' : `${pending} प्रक्रियाधीन`,
          variant: pending === 0 ? 'success' : 'danger',
        },
        isActionRequired: pending > 0,
        isEmpty: total === 0,
        emptyMessage: 'कोई शिकायत दर्ज नहीं है',
      };
    },
  },
  {
    id: 'facilities',
    title: 'Physical Facilities',
    hindiTitle: 'भौतिक अधोसंरचना',
    subtitle: 'पेयजल, विद्युत, शौचालय व सुरक्षा',
    category: 'SECONDARY_METRIC',
    iconName: 'ShieldCheck',
    route: 'facilities',
    order: 8,
    accentColor: 'teal',
    isAvailable: () => true,
    computeMetric: (ctx) => {
      const pct = ctx.scopedStats.facilityCompletenessPct;
      const available = ctx.scopedStats.availableFacilities;
      const total = ctx.scopedStats.totalFacilities;
      const critical = ctx.scopedStats.criticalNeedFacilities;

      return {
        mainValue: `${pct}% उपलब्ध`,
        subValue: critical > 0 ? `${critical} सुविधाओं में सुधार आवश्यक` : `सत्यापित: ${available}/${total}`,
        badge: {
          text: critical > 0 ? `${critical} मरम्मत आवश्यक` : 'संतोषजनक',
          variant: critical > 0 ? 'warning' : 'success',
        },
        isActionRequired: critical > 0,
        isEmpty: total === 0,
        emptyMessage: 'भौतिक सुविधाएं डेटा अनुपलब्ध',
      };
    },
  },
  {
    id: 'documents',
    title: 'Circulars & Documents',
    hindiTitle: 'दस्तावेज व परिपत्र',
    subtitle: 'विभागीय आदेश, प्रपत्र व सूचनाएं',
    category: 'SECONDARY_METRIC',
    iconName: 'FileText',
    route: 'documents',
    order: 9,
    accentColor: 'indigo',
    isAvailable: () => true,
    computeMetric: (ctx) => {
      const total = ctx.scopedStats.totalDocuments;
      return {
        mainValue: `${total} दस्तावेज`,
        subValue: 'नवीनतम शासकीय परिपत्र व आदेश',
        badge: {
          text: total > 0 ? `${total} उपलब्ध` : 'अपलोड शेष',
          variant: total > 0 ? 'info' : 'neutral',
        },
        isEmpty: total === 0,
        emptyMessage: 'कोई दस्तावेज अपलोड नहीं',
      };
    },
  },
  {
    id: 'notifications',
    title: 'System Notifications',
    hindiTitle: 'सूचनाएं व अलर्ट',
    subtitle: 'संकुल एवं शाला स्तरीय सूचनाएं',
    category: 'SECONDARY_METRIC',
    iconName: 'Bell',
    route: 'notifications',
    order: 10,
    accentColor: 'orange',
    isAvailable: () => true,
    computeMetric: (ctx) => {
      const unread = ctx.scopedStats.unreadNotificationsCount;
      return {
        mainValue: `${unread} अपठित`,
        subValue: 'विभागीय अलर्ट व समय-सीमा रिमाइंडर',
        badge: {
          text: unread > 0 ? `${unread} नवीन` : 'अद्यतन',
          variant: unread > 0 ? 'warning' : 'neutral',
        },
        isActionRequired: unread > 0,
        isEmpty: unread === 0,
        emptyMessage: 'कोई नई सूचना नहीं है',
      };
    },
  },

  // ==========================================
  // 3. EXTENSIBLE FUTURE MODULE CONFIGURATIONS
  // (Automatically activate whenever respective data entity exists in context/config)
  // ==========================================
  {
    id: 'scholarships',
    title: 'Scholarship Tracking',
    hindiTitle: 'छात्रवृत्ति व हितग्राही',
    subtitle: 'समेकित छात्रवृत्ति पोर्टल सत्यापन',
    category: 'SECONDARY_METRIC',
    iconName: 'Award',
    route: 'scholarships',
    order: 11,
    accentColor: 'yellow',
    isAvailable: (ctx) => Boolean(ctx.scholarships && ctx.scholarships.length > 0),
    computeMetric: (ctx) => {
      const total = ctx.scholarships?.length || 0;
      const approved = ctx.scholarships?.filter((s: any) => s.status === 'APPROVED')?.length || 0;
      return {
        mainValue: `${total} स्वीकृत`,
        subValue: `सत्यापित: ${approved} / ${total}`,
        badge: {
          text: approved === total ? 'शत-प्रतिशत' : 'प्रक्रियाधीन',
          variant: 'success',
        },
        isEmpty: total === 0,
        emptyMessage: 'छात्रवृत्ति विवरण उपलब्ध नहीं',
      };
    },
  },
  {
    id: 'library',
    title: 'Digital Library & Books',
    hindiTitle: 'पुस्तकालय व पुस्तक वितरण',
    subtitle: 'पाठ्यपुस्तक एवं वाचनालय रिकॉर्ड',
    category: 'SECONDARY_METRIC',
    iconName: 'BookOpen',
    route: 'library',
    order: 12,
    accentColor: 'teal',
    isAvailable: (ctx) => Boolean(ctx.libraryBooks && ctx.libraryBooks.length > 0),
    computeMetric: (ctx) => {
      const count = ctx.libraryBooks?.length || 0;
      return {
        mainValue: `${count} पुस्तकें`,
        subValue: 'पुस्तकालय पंजी अद्यतन',
        badge: { text: 'सक्रिय', variant: 'success' },
        isEmpty: count === 0,
        emptyMessage: 'पुस्तकालय डेटा उपलब्ध नहीं',
      };
    },
  },
  {
    id: 'transport',
    title: 'School Transport & Bus',
    hindiTitle: 'परिवहन व्यवस्था',
    subtitle: 'वाहन एवं छात्र आवागमन सुरक्षा',
    category: 'SECONDARY_METRIC',
    iconName: 'Bus',
    route: 'transport',
    order: 13,
    accentColor: 'blue',
    isAvailable: (ctx) => Boolean(ctx.transportRoutes && ctx.transportRoutes.length > 0),
    computeMetric: (ctx) => {
      const count = ctx.transportRoutes?.length || 0;
      return {
        mainValue: `${count} रूट`,
        subValue: 'वाहन सुरक्षा प्रमाणित',
        badge: { text: 'प्रमाणित', variant: 'success' },
        isEmpty: count === 0,
        emptyMessage: 'परिवहन व्यवस्था उपलब्ध नहीं',
      };
    },
  },
];

/**
 * Filter and retrieve dynamic widgets based on current user role, scope, and data availability.
 */
export const getActiveDashboardWidgets = (
  context: any,
  category?: WidgetCategory
): DynamicWidgetDefinition[] => {
  return dashboardWidgetRegistry
    .filter((widget) => {
      // 1. Role Filter
      if (widget.allowedRoles && context.currentUser) {
        if (!widget.allowedRoles.includes(context.currentUser.role)) {
          return false;
        }
      }
      // 2. School vs Cluster exclusivity
      if (widget.schoolOnly && !context.isSchoolUser) return false;
      if (widget.clusterOnly && context.isSchoolUser) return false;

      // 3. Category Filter (if specified)
      if (category && widget.category !== category) return false;

      // 4. Data / Module Availability Check
      return widget.isAvailable(context);
    })
    .sort((a, b) => a.order - b.order);
};
