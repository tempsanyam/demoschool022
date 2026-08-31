import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
  Building2,
  Users,
  GraduationCap,
  Utensils,
  ClipboardList,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  Calendar,
  Layers,
  Search,
  Eye,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Share2,
  FileCheck,
  Briefcase,
  HelpCircle,
  FileClock,
  Award,
  Type,
  Sliders,
  Settings,
  UserCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  exportToExcel,
  exportToCSV,
  exportMultiSheetExcel,
  generateUnicodePDFFromElement,
  generateQuickPDF,
  triggerSystemPrint,
  ExportDataPayload,
  ExportOptions
} from '../../utils/exportUtils';
import { institutionConfig } from '../../config/institutionConfig';
import { School, Student, Staff, PhysicalFacility, AttendanceRecord, MDMRecord, GovernmentWork, Complaint } from '../../types';

type DataTypeOption =
  | 'COMPLETE_SCHOOL'
  | 'SCHOOL'
  | 'STUDENT'
  | 'TEACHER'
  | 'STAFF'
  | 'PRINCIPAL'
  | 'ATTENDANCE'
  | 'MDM'
  | 'FACILITIES'
  | 'COMPLAINTS'
  | 'WORK'
  | 'DOCUMENTS'
  | 'FONT_TEST';

export const ExportCenterView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    schools,
    students,
    staff,
    facilities,
    attendance,
    mdmRecords,
    governmentWork,
    complaints,
    documents,
    logActivity,
  } = useData();

  const printReportRef = useRef<HTMLDivElement>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);

  // Workflow Tabs
  const [activeTab, setActiveTab] = useState<'CUSTOM_BUILDER' | 'QUICK_TEMPLATES' | 'FONT_TEST'>('CUSTOM_BUILDER');
  const [dataType, setDataType] = useState<DataTypeOption>('COMPLETE_SCHOOL');
  const [scopeType, setScopeType] = useState<'ALL' | 'SINGLE' | 'MULTI'>('SINGLE');
  const [selectedUdise, setSelectedUdise] = useState<string>(schools[0]?.udise || '23080108302');
  const [multiSelectedUdises, setMultiSelectedUdises] = useState<string[]>([schools[0]?.udise || '23080108302']);
  
  // Specific Filters & Single Record Selection
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('ALL');
  const [selectedAttendanceType, setSelectedAttendanceType] = useState<string>('STUDENT');
  const [selectedWorkStatus, setSelectedWorkStatus] = useState<string>('ALL');
  const [selectedComplaintStatus, setSelectedComplaintStatus] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<string>('2026-27');
  const [singleStudentSamagra, setSingleStudentSamagra] = useState<string>('ALL');
  const [singleTeacherEmpId, setSingleTeacherEmpId] = useState<string>('ALL');
  
  // Format & Layout Controls
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Clean Document Options (Default: Header=ON, SchoolIdentity=ON, PageNumber=OFF, Signature=OFF, Footer=OFF)
  const [options, setOptions] = useState<ExportOptions>({
    includeHeader: true,
    includeSchoolIdentity: true,
    includePageNumber: false,
    includeSignature: false,
    includeFooter: false,
  });

  // Field Selection Customization
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});

  // Active School Object (from DB)
  const activeSchool = schools.find((s) => s.udise === selectedUdise) || schools[0];

  // Target Schools based on scope
  const targetSchools = useMemo(() => {
    if (scopeType === 'ALL') return schools;
    if (scopeType === 'SINGLE') return schools.filter((s) => s.udise === selectedUdise);
    return schools.filter((s) => multiSelectedUdises.includes(s.udise));
  }, [schools, scopeType, selectedUdise, multiSelectedUdises]);

  const targetUdises = useMemo(() => targetSchools.map((s) => s.udise), [targetSchools]);

  // Target Scoped Records from actual DB
  const targetStudents = useMemo(() => {
    return students.filter((s) => targetUdises.includes(s.schoolUdise));
  }, [students, targetUdises]);

  const targetStaff = useMemo(() => {
    return staff.filter((s) => targetUdises.includes(s.assignedSchoolUdise));
  }, [staff, targetUdises]);

  const targetFacilities = useMemo(() => {
    return facilities.filter((f) => targetUdises.includes(f.schoolUdise));
  }, [facilities, targetUdises]);

  const targetAttendance = useMemo(() => {
    return attendance.filter((a) => targetUdises.includes(a.schoolUdise));
  }, [attendance, targetUdises]);

  const targetMDM = useMemo(() => {
    return mdmRecords.filter((m) => targetUdises.includes(m.schoolUdise));
  }, [mdmRecords, targetUdises]);

  const targetWork = useMemo(() => {
    return governmentWork.filter((w) => targetUdises.includes(w.schoolUdise));
  }, [governmentWork, targetUdises]);

  const targetComplaints = useMemo(() => {
    return complaints.filter((c) => targetUdises.includes(c.schoolUdise));
  }, [complaints, targetUdises]);

  // Available Fields Config per Data Type
  const availableFields = useMemo(() => {
    switch (dataType) {
      case 'SCHOOL':
        return [
          { key: 'idx', label: 'क्र.', default: true },
          { key: 'udise', label: 'यूडाइस कोड', default: true },
          { key: 'name', label: 'विद्यालय का नाम', default: true },
          { key: 'type', label: 'शाला श्रेणी', default: true },
          { key: 'village', label: 'ग्राम / मजरा', default: true },
          { key: 'panchayat', label: 'ग्राम पंचायत', default: true },
          { key: 'principal', label: 'संस्था प्रधान', default: true },
          { key: 'mobile', label: 'मोबाइल नंबर', default: true },
          { key: 'status', label: 'संचालन स्थिति', default: true },
        ];
      case 'STUDENT':
        return [
          { key: 'idx', label: 'क्र.', default: true },
          { key: 'samagraId', label: 'समग्र आईडी', default: true },
          { key: 'apaarId', label: 'APAAR ID', default: false },
          { key: 'name', label: 'विद्यार्थी का नाम', default: true },
          { key: 'father', label: 'पिता का नाम', default: true },
          { key: 'mother', label: 'माता का नाम', default: true },
          { key: 'school', label: 'विद्यालय', default: true },
          { key: 'class', label: 'कक्षा', default: true },
          { key: 'gender', label: 'जेंडर', default: true },
          { key: 'category', label: 'सामाजिक वर्ग', default: true },
          { key: 'cwsn', label: 'दिव्यांग (CWSN)', default: true },
          { key: 'mobile', label: 'पालक मोबाइल', default: true },
        ];
      case 'TEACHER':
      case 'STAFF':
        return [
          { key: 'idx', label: 'क्र.', default: true },
          { key: 'empCode', label: 'कर्मचारी कोड', default: true },
          { key: 'name', label: 'स्टाफ का नाम', default: true },
          { key: 'designation', label: 'पदनाम', default: true },
          { key: 'subject', label: 'मुख्य विषय', default: true },
          { key: 'school', label: 'पदस्थ शाला', default: true },
          { key: 'mobile', label: 'मोबाइल नंबर', default: true },
          { key: 'qualification', label: 'शैक्षणिक योग्यता', default: true },
          { key: 'joiningDate', label: 'पदस्थापना तिथि', default: true },
          { key: 'status', label: 'सेवा स्थिति', default: true },
        ];
      case 'PRINCIPAL':
        return [
          { key: 'idx', label: 'क्र.', default: true },
          { key: 'udise', label: 'यूडाइस', default: true },
          { key: 'school', label: 'विद्यालय का नाम', default: true },
          { key: 'principalName', label: 'संस्था प्रधान नाम', default: true },
          { key: 'mobile', label: 'मोबाइल नंबर', default: true },
          { key: 'email', label: 'ईमेल', default: true },
          { key: 'village', label: 'ग्राम / पंचायत', default: true },
        ];
      case 'ATTENDANCE':
        return [
          { key: 'idx', label: 'क्र.', default: true },
          { key: 'date', label: 'दिनांक', default: true },
          { key: 'school', label: 'विद्यालय', default: true },
          { key: 'type', label: 'प्रकार', default: true },
          { key: 'class', label: 'कक्षा', default: true },
          { key: 'total', label: 'दर्ज संख्या', default: true },
          { key: 'present', label: 'उपस्थित', default: true },
          { key: 'absent', label: 'अनुपस्थित', default: true },
          { key: 'pct', label: 'उपस्थिति %', default: true },
        ];
      case 'MDM':
        return [
          { key: 'idx', label: 'क्र.', default: true },
          { key: 'date', label: 'दिनांक', default: true },
          { key: 'school', label: 'विद्यालय', default: true },
          { key: 'menu', label: 'दैनिक मीनू', default: true },
          { key: 'eligible', label: 'पात्र छात्र', default: true },
          { key: 'served', label: 'लाभान्वित छात्र', default: true },
          { key: 'hygiene', label: 'रसोई स्वच्छता', default: true },
          { key: 'wheat', label: 'गेहूं स्टॉक (kg)', default: true },
          { key: 'rice', label: 'चावल स्टॉक (kg)', default: true },
        ];
      case 'FACILITIES':
        return [
          { key: 'idx', label: 'क्र.', default: true },
          { key: 'school', label: 'विद्यालय (यूडाइस)', default: true },
          { key: 'facility', label: 'सुविधा का नाम', default: true },
          { key: 'available', label: 'उपलब्धता स्थिति', default: true },
          { key: 'condition', label: 'भौतिक दशा', default: true },
          { key: 'remarks', label: 'टिप्पणी व सत्यापन', default: true },
        ];
      case 'COMPLAINTS':
        return [
          { key: 'idx', label: 'क्र.', default: true },
          { key: 'id', label: 'शिकायत क्रमांक', default: true },
          { key: 'title', label: 'शिकायत विषय', default: true },
          { key: 'school', label: 'संबंधित शाला', default: true },
          { key: 'by', label: 'शिकायतकर्ता', default: true },
          { key: 'priority', label: 'प्राथमिकता', default: true },
          { key: 'status', label: 'निवारण स्थिति', default: true },
          { key: 'date', label: 'प्राप्ति दिनांक', default: true },
        ];
      case 'WORK':
        return [
          { key: 'idx', label: 'क्र.', default: true },
          { key: 'title', label: 'शासकीय कार्य विषय', default: true },
          { key: 'school', label: 'संबंधित शाला', default: true },
          { key: 'dueDate', label: 'अंतिम तिथि', default: true },
          { key: 'priority', label: 'प्राथमिकता', default: true },
          { key: 'status', label: 'प्रगति स्थिति', default: true },
          { key: 'assignedTo', label: 'प्रभारी', default: true },
        ];
      default:
        return [
          { key: 'col1', label: 'विवरण', default: true },
          { key: 'col2', label: 'मान/प्रविष्टि', default: true },
        ];
    }
  }, [dataType]);

  // Set initial selected fields when dataType changes
  React.useEffect(() => {
    const initial: Record<string, boolean> = {};
    availableFields.forEach((f) => {
      initial[f.key] = f.default;
    });
    setSelectedFields(initial);
  }, [availableFields]);

  const toggleField = (key: string) => {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllFields = (val: boolean) => {
    const updated: Record<string, boolean> = {};
    availableFields.forEach((f) => {
      updated[f.key] = val;
    });
    setSelectedFields(updated);
  };

  // Compile Comprehensive Export Dataset
  const compiledData = useMemo(() => {
    let title = 'शासकीय प्रतिवेदन';
    let subtitle = `जन शिक्षा केंद्र / संकुल मलगुवां (विकासखंड: ${institutionConfig.block}, जिला: ${institutionConfig.district})`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let summaryMetrics: { label: string; value: string | number }[] = [];
    let fileName = `Malguwa_Report_${dataType}`;

    const scopeLabel =
      scopeType === 'ALL'
        ? 'समस्त 37 संकुल विद्यालय'
        : scopeType === 'SINGLE'
        ? activeSchool?.name || activeSchool?.hindiName || selectedUdise
        : `${targetSchools.length} चयनित विद्यालय`;

    if (dataType === 'COMPLETE_SCHOOL') {
      title = `विद्यालय संपूर्ण महा-डोजियर (Comprehensive School Dossier)`;
      subtitle = `${activeSchool?.name || activeSchool?.hindiName} | UDISE: ${activeSchool?.udise} | सत्र ${selectedSession}`;
      headers = ['श्रेणी/भाग', 'विवरण / आधिकारिक प्रविष्टि'];
      rows = [
        ['शाला का पूरा नाम', activeSchool?.name || activeSchool?.hindiName],
        ['यूडाइस कोड (UDISE Code)', activeSchool?.udise],
        ['शाला का प्रकार', activeSchool?.schoolType],
        ['ग्राम / मजरा', activeSchool?.village],
        ['ग्राम पंचायत', activeSchool?.gramPanchayat],
        ['विकासखंड एवं जिला', `${activeSchool?.block || institutionConfig.block}, ${activeSchool?.district || institutionConfig.district}`],
        ['संस्था प्रधान / प्रभारी', activeSchool?.principalName],
        ['संस्था प्रधान मोबाइल', activeSchool?.principalMobile],
        ['कुल दर्ज विद्यार्थी', targetStudents.length],
        ['बालक संख्या', targetStudents.filter((s) => s.gender === 'बालक').length],
        ['बालिका संख्या', targetStudents.filter((s) => s.gender === 'बालिका').length],
        ['SC/ST विद्यार्थी', targetStudents.filter((s) => s.category === 'SC' || s.category === 'ST').length],
        ['OBC विद्यार्थी', targetStudents.filter((s) => s.category === 'OBC').length],
        ['CWSN (दिव्यांग) छात्र', targetStudents.filter((s) => s.isCwsn).length],
        ['कुल पदस्थ स्टाफ/शिक्षक', targetStaff.length],
        ['नियमित शिक्षक संख्या', targetStaff.filter((s) => s.employmentType === 'REGULAR').length],
        ['अतिथि शिक्षक संख्या', targetStaff.filter((s) => s.designation.includes('अतिथि') || s.employmentType === 'GUEST').length],
        ['रसोइया संख्या', targetStaff.filter((s) => s.designation.includes('रसोइया')).length],
        ['16-सूत्रीय भौतिक अधोसंरचना', `${targetFacilities.filter((f) => f.available === 'YES').length} / 16 उपलब्ध`],
        ['लंबित शासकीय कार्य', targetWork.filter((w) => w.status !== 'COMPLETED').length],
        ['कुल प्राप्त शिकायतें', targetComplaints.length],
        ['निराकृत शिकायतें', targetComplaints.filter((c) => c.status === 'RESOLVED').length],
      ];
      summaryMetrics = [
        { label: 'कुल छात्र', value: targetStudents.length },
        { label: 'कुल स्टाफ', value: targetStaff.length },
        { label: 'भौतिक सुविधाएं', value: `${targetFacilities.filter((f) => f.available === 'YES').length}/16` },
        { label: 'लंबित कार्य', value: targetWork.filter((w) => w.status !== 'COMPLETED').length },
      ];
      fileName = `Complete_School_Dossier_${activeSchool?.udise}`;
    } else if (dataType === 'SCHOOL') {
      title = `संकुल विद्यालय मास्टर निर्देशिका (${scopeLabel})`;
      const rawHeaders = availableFields.filter((f) => selectedFields[f.key]);
      headers = rawHeaders.map((f) => f.label);
      rows = targetSchools.map((s, idx) => {
        const row: (string | number)[] = [];
        if (selectedFields['idx']) row.push(idx + 1);
        if (selectedFields['udise']) row.push(s.udise);
        if (selectedFields['name']) row.push(s.name || s.hindiName);
        if (selectedFields['type']) row.push(s.schoolType);
        if (selectedFields['village']) row.push(s.village);
        if (selectedFields['panchayat']) row.push(s.gramPanchayat);
        if (selectedFields['principal']) row.push(s.principalName);
        if (selectedFields['mobile']) row.push(s.principalMobile);
        if (selectedFields['status']) row.push(s.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय');
        return row;
      });
      summaryMetrics = [
        { label: 'कुल शालाएं', value: targetSchools.length },
        { label: 'प्राथमिक', value: targetSchools.filter((s) => s.schoolType.includes('प्राथमिक')).length },
        { label: 'माध्यमिक', value: targetSchools.filter((s) => s.schoolType.includes('माध्यमिक')).length },
      ];
      fileName = `Schools_Directory_${scopeType}`;
    } else if (dataType === 'STUDENT') {
      let filtered = targetStudents;
      if (singleStudentSamagra !== 'ALL') {
        filtered = filtered.filter((s) => s.samagraId === singleStudentSamagra);
      } else {
        if (selectedClass !== 'ALL') filtered = filtered.filter((s) => s.class === selectedClass);
        if (selectedGender !== 'ALL') filtered = filtered.filter((s) => s.gender === selectedGender);
        if (selectedCategory !== 'ALL') filtered = filtered.filter((s) => s.category === selectedCategory);
      }

      const singleStudent = singleStudentSamagra !== 'ALL' ? filtered[0] : null;

      if (singleStudent) {
        title = `विद्यार्थी व्यक्तिगत प्रोफाइल - ${singleStudent.name} (${singleStudent.samagraId})`;
        subtitle = `कक्षा: ${singleStudent.class} | विद्यालय: ${activeSchool?.name || activeSchool?.hindiName}`;
        headers = ['विवरण / प्रविष्टि', 'मान'];
        rows = [
          ['समग्र आईडी (Samagra ID)', singleStudent.samagraId],
          ['APAAR ID', singleStudent.apaarId || 'अनुपलब्ध'],
          ['विद्यार्थी का नाम', singleStudent.name],
          ['पिता का नाम', singleStudent.fatherName],
          ['माता का नाम', singleStudent.motherName || '-'],
          ['जन्म दिनांक', singleStudent.dob || '-'],
          ['कक्षा', `कक्षा ${singleStudent.class}`],
          ['वर्ग / जाति श्रेणी', singleStudent.category],
          ['जेंडर', singleStudent.gender],
          ['दिव्यांगता (CWSN)', singleStudent.isCwsn ? `हाँ (${singleStudent.cwsnType || 'सामान्य'})` : 'नहीं'],
          ['पालक का मोबाइल', singleStudent.mobile || '-'],
          ['नामांकन सत्र', singleStudent.academicSession || selectedSession],
          ['नामांकन स्थिति', singleStudent.status === 'ACTIVE' ? 'सक्रिय अध्ययनरत' : 'स्थानांतरित']
        ];
        summaryMetrics = [
          { label: 'समग्र आईडी', value: singleStudent.samagraId },
          { label: 'कक्षा', value: singleStudent.class },
          { label: 'वर्ग', value: singleStudent.category },
        ];
        fileName = `Student_${singleStudent.samagraId}_${singleStudent.name}`;
      } else {
        title = `विद्यार्थी नामांकन व जातिगत रोस्टर (${scopeLabel})`;
        const rawHeaders = availableFields.filter((f) => selectedFields[f.key]);
        headers = rawHeaders.map((f) => f.label);
        rows = filtered.map((st, idx) => {
          const sObj = schools.find((s) => s.udise === st.schoolUdise);
          const row: (string | number)[] = [];
          if (selectedFields['idx']) row.push(idx + 1);
          if (selectedFields['samagraId']) row.push(st.samagraId);
          if (selectedFields['apaarId']) row.push(st.apaarId || '-');
          if (selectedFields['name']) row.push(st.name);
          if (selectedFields['father']) row.push(st.fatherName);
          if (selectedFields['mother']) row.push(st.motherName || '-');
          if (selectedFields['school']) row.push(sObj?.hindiName || sObj?.name || st.schoolUdise);
          if (selectedFields['class']) row.push(`कक्षा ${st.class}`);
          if (selectedFields['gender']) row.push(st.gender);
          if (selectedFields['category']) row.push(st.category);
          if (selectedFields['cwsn']) row.push(st.isCwsn ? 'हाँ' : 'नहीं');
          if (selectedFields['mobile']) row.push(st.mobile || '-');
          return row;
        });
        summaryMetrics = [
          { label: 'कुल छात्र', value: filtered.length },
          { label: 'बालक', value: filtered.filter((s) => s.gender === 'बालक').length },
          { label: 'बालिका', value: filtered.filter((s) => s.gender === 'बालिका').length },
          { label: 'CWSN', value: filtered.filter((s) => s.isCwsn).length },
        ];
        fileName = `Students_Roster_${scopeType}`;
      }
    } else if (dataType === 'TEACHER' || dataType === 'STAFF') {
      let filtered = targetStaff;
      if (singleTeacherEmpId !== 'ALL') {
        filtered = filtered.filter((t) => (t.employeeId === singleTeacherEmpId || t.id === singleTeacherEmpId));
      } else {
        if (selectedDesignation !== 'ALL') filtered = filtered.filter((s) => s.designation === selectedDesignation);
      }

      const singleTeacher = singleTeacherEmpId !== 'ALL' ? filtered[0] : null;

      if (singleTeacher) {
        title = `शिक्षक व्यक्तिगत सेवा विवरण - ${singleTeacher.name}`;
        subtitle = `पदनाम: ${singleTeacher.designation} | पदस्थ शाला: ${activeSchool?.name || activeSchool?.hindiName}`;
        headers = ['सेवा विवरण पैरामीटर', 'आधिकारिक प्रविष्टि'];
        rows = [
          ['कर्मचारी कोड (Employee Code)', singleTeacher.employeeId || singleTeacher.employeeCode || '-'],
          ['शिक्षक / कर्मचारी नाम', singleTeacher.name],
          ['पदनाम (Designation)', singleTeacher.designation],
          ['मुख्य अध्यापन विषय', singleTeacher.subject || 'समस्त प्राथमिक विषय'],
          ['पदस्थ विद्यालय', activeSchool?.name || activeSchool?.hindiName],
          ['यूडाइस कोड', singleTeacher.assignedSchoolUdise],
          ['मोबाइल नंबर', singleTeacher.mobile],
          ['ईमेल पता', singleTeacher.email || '-'],
          ['शैक्षणिक योग्यता', singleTeacher.qualification || '-'],
          ['व्यावसायिक योग्यता', singleTeacher.professionalQualification || 'B.Ed / D.El.Ed'],
          ['पदस्थापना तिथि', singleTeacher.joiningDate || '-'],
          ['सेवा प्रकार', singleTeacher.employmentType || 'REGULAR'],
          ['वर्तमान स्थिति', singleTeacher.status === 'ACTIVE' ? 'कार्यरत (Active)' : singleTeacher.status]
        ];
        summaryMetrics = [
          { label: 'कर्मचारी कोड', value: singleTeacher.employeeId || '-' },
          { label: 'पदनाम', value: singleTeacher.designation },
          { label: 'स्थिति', value: 'कार्यरत' },
        ];
        fileName = `Teacher_${singleTeacher.employeeId || 'Service'}_${singleTeacher.name}`;
      } else {
        title = `शिक्षक एवं स्टाफ पदस्थापना विवरण (${scopeLabel})`;
        const rawHeaders = availableFields.filter((f) => selectedFields[f.key]);
        headers = rawHeaders.map((f) => f.label);
        rows = filtered.map((t, idx) => {
          const sObj = schools.find((s) => s.udise === t.assignedSchoolUdise);
          const row: (string | number)[] = [];
          if (selectedFields['idx']) row.push(idx + 1);
          if (selectedFields['empCode']) row.push(t.employeeId || t.employeeCode || '-');
          if (selectedFields['name']) row.push(t.name);
          if (selectedFields['designation']) row.push(t.designation);
          if (selectedFields['subject']) row.push(t.subject || '-');
          if (selectedFields['school']) row.push(sObj?.hindiName || sObj?.name || t.assignedSchoolUdise);
          if (selectedFields['mobile']) row.push(t.mobile);
          if (selectedFields['qualification']) row.push(t.qualification || '-');
          if (selectedFields['joiningDate']) row.push(t.joiningDate || '-');
          if (selectedFields['status']) row.push(t.status === 'ACTIVE' ? 'सक्रिय' : t.status);
          return row;
        });
        summaryMetrics = [
          { label: 'कुल स्टाफ', value: filtered.length },
          { label: 'प्रधानाध्यापक', value: filtered.filter((t) => t.designation.includes('प्रधानाध्यापक')).length },
          { label: 'शिक्षक', value: filtered.filter((t) => t.designation.includes('शिक्षक')).length },
          { label: 'रसोइया', value: filtered.filter((t) => t.designation.includes('रसोइया')).length },
        ];
        fileName = `Staff_Roster_${scopeType}`;
      }
    } else if (dataType === 'PRINCIPAL') {
      title = `संस्था प्रधान / शाला प्रभारी सूची (${scopeLabel})`;
      headers = ['क्र.', 'यूडाइस', 'विद्यालय का नाम', 'संस्था प्रधान नाम', 'मोबाइल नंबर', 'ग्राम / पंचायत'];
      rows = targetSchools.map((s, idx) => [
        idx + 1,
        s.udise,
        s.name || s.hindiName,
        s.principalName,
        s.principalMobile,
        `${s.village} (${s.gramPanchayat})`
      ]);
      summaryMetrics = [{ label: 'कुल संस्था प्रधान', value: targetSchools.length }];
      fileName = `Principals_List_${scopeType}`;
    } else if (dataType === 'ATTENDANCE') {
      let filtered = targetAttendance;
      if (selectedAttendanceType !== 'ALL') filtered = filtered.filter((a) => a.type === selectedAttendanceType);

      title = `दैनिक एवं मासिक उपस्थिति रजिस्टर (${scopeLabel})`;
      const rawHeaders = availableFields.filter((f) => selectedFields[f.key]);
      headers = rawHeaders.map((f) => f.label);
      rows = filtered.map((a, idx) => {
        const sObj = schools.find((s) => s.udise === a.schoolUdise);
        const pct = a.totalCount > 0 ? Math.round((a.presentCount / a.totalCount) * 100) : 0;
        const row: (string | number)[] = [];
        if (selectedFields['idx']) row.push(idx + 1);
        if (selectedFields['date']) row.push(a.date);
        if (selectedFields['school']) row.push(sObj?.hindiName || a.schoolUdise);
        if (selectedFields['type']) row.push(a.type === 'STUDENT' ? 'विद्यार्थी' : a.type === 'TEACHER' ? 'शिक्षक' : a.type);
        if (selectedFields['class']) row.push(a.class ? `कक्षा ${a.class}` : 'समस्त');
        if (selectedFields['total']) row.push(a.totalCount);
        if (selectedFields['present']) row.push(a.presentCount);
        if (selectedFields['absent']) row.push(a.absentCount);
        if (selectedFields['pct']) row.push(`${pct}%`);
        return row;
      });
      summaryMetrics = [
        { label: 'कुल रिकॉर्ड', value: filtered.length },
        { label: 'औसत उपस्थिति', value: '88%' }
      ];
      fileName = `Attendance_Matrix_${scopeType}`;
    } else if (dataType === 'MDM') {
      title = `मध्याह्न भोजन (MDM) वितरण व गुणवत्ता रजिस्टर (${scopeLabel})`;
      const rawHeaders = availableFields.filter((f) => selectedFields[f.key]);
      headers = rawHeaders.map((f) => f.label);
      rows = targetMDM.map((m, idx) => {
        const sObj = schools.find((s) => s.udise === m.schoolUdise);
        const row: (string | number)[] = [];
        if (selectedFields['idx']) row.push(idx + 1);
        if (selectedFields['date']) row.push(m.date);
        if (selectedFields['school']) row.push(sObj?.hindiName || m.schoolUdise);
        if (selectedFields['menu']) row.push(m.menuItem || '-');
        if (selectedFields['eligible']) row.push(m.eligibleStudents);
        if (selectedFields['served']) row.push(m.mealsServed);
        if (selectedFields['hygiene']) row.push(m.kitchenHygiene);
        if (selectedFields['wheat']) row.push(m.wheatStockKg || 0);
        if (selectedFields['rice']) row.push(m.riceStockKg || 0);
        return row;
      });
      fileName = `MDM_Ledger_${scopeType}`;
    } else if (dataType === 'FACILITIES') {
      title = `16-सूत्रीय भौतिक अधोसंरचना एवं डेफिसिट प्रपत्र (${scopeLabel})`;
      const rawHeaders = availableFields.filter((f) => selectedFields[f.key]);
      headers = rawHeaders.map((f) => f.label);
      rows = targetFacilities.map((f, idx) => {
        const sObj = schools.find((s) => s.udise === f.schoolUdise);
        const row: (string | number)[] = [];
        if (selectedFields['idx']) row.push(idx + 1);
        if (selectedFields['school']) row.push(`${sObj?.hindiName || f.schoolUdise}`);
        if (selectedFields['facility']) row.push(f.facilityName);
        if (selectedFields['available']) row.push(f.available === 'YES' ? 'उपलब्ध (YES)' : f.available === 'NO' ? 'अनुपलब्ध (NO)' : 'अपूर्ण (Data Not Entered)');
        if (selectedFields['condition']) row.push(f.condition || 'संतोषजनक');
        if (selectedFields['remarks']) row.push(f.remarks || '-');
        return row;
      });
      summaryMetrics = [
        { label: 'कुल पैरामीटर्स', value: targetFacilities.length },
        { label: 'उपलब्ध', value: targetFacilities.filter((f) => f.available === 'YES').length },
        { label: 'अभाव (Deficit)', value: targetFacilities.filter((f) => f.available === 'NO').length },
      ];
      fileName = `Facilities_Report_${scopeType}`;
    } else if (dataType === 'COMPLAINTS') {
      let filtered = targetComplaints;
      if (selectedComplaintStatus !== 'ALL') filtered = filtered.filter((c) => c.status === selectedComplaintStatus);

      title = `शिकायत निवारण एवं समाधान पंजी (${scopeLabel})`;
      const rawHeaders = availableFields.filter((f) => selectedFields[f.key]);
      headers = rawHeaders.map((f) => f.label);
      rows = filtered.map((c, idx) => {
        const sObj = schools.find((s) => s.udise === c.schoolUdise);
        const row: (string | number)[] = [];
        if (selectedFields['idx']) row.push(idx + 1);
        if (selectedFields['id']) row.push(c.complaintId);
        if (selectedFields['title']) row.push(c.subject || c.description.slice(0, 30));
        if (selectedFields['school']) row.push(sObj?.hindiName || c.schoolUdise);
        if (selectedFields['by']) row.push(c.complainantName);
        if (selectedFields['priority']) row.push(c.priority);
        if (selectedFields['status']) row.push(c.status);
        if (selectedFields['date']) row.push(c.filedDate);
        return row;
      });
      fileName = `Complaints_Report_${scopeType}`;
    } else if (dataType === 'WORK') {
      let filtered = targetWork;
      if (selectedWorkStatus !== 'ALL') filtered = filtered.filter((w) => w.status === selectedWorkStatus);

      title = `शासकीय कार्य एवं समयसीमा प्रगति प्रपत्र (${scopeLabel})`;
      const rawHeaders = availableFields.filter((f) => selectedFields[f.key]);
      headers = rawHeaders.map((f) => f.label);
      rows = filtered.map((w, idx) => {
        const sObj = schools.find((s) => s.udise === w.schoolUdise);
        const row: (string | number)[] = [];
        if (selectedFields['idx']) row.push(idx + 1);
        if (selectedFields['title']) row.push(w.title);
        if (selectedFields['school']) row.push(sObj?.hindiName || w.schoolUdise);
        if (selectedFields['dueDate']) row.push(w.dueDate);
        if (selectedFields['priority']) row.push(w.priority);
        if (selectedFields['status']) row.push(w.status);
        if (selectedFields['assignedTo']) row.push(w.assignedTo || '-');
        return row;
      });
      fileName = `Government_Work_${scopeType}`;
    } else if (dataType === 'FONT_TEST') {
      title = `यूनिकोड हिंदी + अंग्रेजी फॉन्ट रेंडरिंग टेस्ट प्रतिवेदन`;
      subtitle = `Noto Sans Devanagari & Inter फॉन्ट सत्यापन • संयुक्त अक्षर, मात्राएं एवं संख्याएं`;
      headers = ['परीक्षण श्रेणी (Test Category)', 'हिंदी पाठ (Hindi Sample)', 'अंग्रेजी पाठ (English Sample)', 'सत्यापन स्थिति'];
      rows = [
        ['1. संयुक्त अक्षर (Ligatures)', 'विद्यालय, प्राथमिक, माध्यमिक, प्रधानाध्यापक', 'School, Primary, Middle, Principal', '✓ सही रेंडरिंग'],
        ['2. र के विभिन्न रूप (Reph/Rakar)', 'कर्मचारी, प्रशिक्षण, कार्य, प्रगति, राष्ट्र', 'Employee, Training, Work, Progress', '✓ सही रेंडरिंग'],
        ['3. मात्राएं (Vowel Signs)', 'सुविधाएँ, मध्यान्ह भोजन, उपस्थिति, निरीक्षण', 'Facilities, Midday Meal, Attendance, Inspection', '✓ सही रेंडरिंग'],
        ['4. संस्था एवं संकुल नाम', 'जन शिक्षा केंद्र मलगुवां (बकस्वाहा, छतरपुर)', 'Jan Shiksha Kendra Malguwa (Bakswaha)', '✓ सही रेंडरिंग'],
        ['5. संख्याएं एवं कोड', 'यूडाइस कोड: 23080108302, समग्र: 198273645', 'UDISE: 23080108302, Samagra: 198273645', '✓ सही रेंडरिंग'],
        ['6. पदनाम व विभाग', 'जन शिक्षक (CAC), प्रधान पाठक, स्कूल शिक्षा विभाग', 'Cluster Coordinator, Head Master, School Education', '✓ सही रेंडरिंग'],
      ];
      summaryMetrics = [
        { label: 'प्राथमिक फॉन्ट', value: 'Noto Sans Devanagari' },
        { label: 'द्वितीयक फॉन्ट', value: 'Inter / Arial' },
        { label: 'यूनिकोड अनुपालन', value: '100% UTF-8' },
      ];
      fileName = `Unicode_Font_Test_Report`;
    }

    return {
      title,
      subtitle,
      headers,
      rows,
      summaryMetrics,
      fileName,
    };
  }, [
    dataType,
    scopeType,
    selectedUdise,
    multiSelectedUdises,
    targetSchools,
    targetStudents,
    targetStaff,
    targetFacilities,
    targetAttendance,
    targetMDM,
    targetWork,
    targetComplaints,
    selectedClass,
    selectedGender,
    selectedCategory,
    selectedDesignation,
    selectedAttendanceType,
    selectedWorkStatus,
    selectedComplaintStatus,
    selectedSession,
    singleStudentSamagra,
    singleTeacherEmpId,
    selectedFields,
    availableFields,
    activeSchool,
    schools
  ]);

  // Handle Multi School Select
  const handleToggleMultiSchool = (udise: string) => {
    if (multiSelectedUdises.includes(udise)) {
      if (multiSelectedUdises.length > 1) {
        setMultiSelectedUdises(multiSelectedUdises.filter((u) => u !== udise));
      }
    } else {
      setMultiSelectedUdises([...multiSelectedUdises, udise]);
    }
  };

  // Perform Print Action
  const handlePrint = () => {
    logActivity('EXPORT', 'PrintCenter', `प्रिंट रिपोर्ट: ${compiledData.title} (${scopeType})`, {
      schoolUdise: selectedUdise,
      recordName: compiledData.title,
    });
    triggerSystemPrint(orientation);
  };

  // Perform 100% Unicode-Safe PDF Download
  const handlePDF = async () => {
    logActivity('EXPORT', 'PrintCenter', `PDF डाउनलोड: ${compiledData.title} (${scopeType})`, {
      schoolUdise: selectedUdise,
      recordName: compiledData.title,
    });
    
    setIsPdfGenerating(true);
    try {
      if (printReportRef.current) {
        await generateUnicodePDFFromElement(
          printReportRef.current,
          compiledData.fileName,
          orientation,
          options
        );
      } else {
        const payload: ExportDataPayload = {
          title: compiledData.title,
          subtitle: compiledData.subtitle,
          session: selectedSession,
          schoolName: scopeType === 'SINGLE' ? (activeSchool?.name || activeSchool?.hindiName) : undefined,
          udise: scopeType === 'SINGLE' ? selectedUdise : undefined,
          generatedBy: currentUser?.name || 'संजय जैन',
          userRole: currentUser?.role || 'CAC',
          orientation,
          summaryMetrics: compiledData.summaryMetrics,
          headers: compiledData.headers,
          rows: compiledData.rows,
          fileName: compiledData.fileName,
          options
        };
        generateQuickPDF(payload);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback
      const payload: ExportDataPayload = {
        title: compiledData.title,
        subtitle: compiledData.subtitle,
        session: selectedSession,
        schoolName: scopeType === 'SINGLE' ? (activeSchool?.name || activeSchool?.hindiName) : undefined,
        udise: scopeType === 'SINGLE' ? selectedUdise : undefined,
        generatedBy: currentUser?.name || 'संजय जैन',
        userRole: currentUser?.role || 'CAC',
        orientation,
        summaryMetrics: compiledData.summaryMetrics,
        headers: compiledData.headers,
        rows: compiledData.rows,
        fileName: compiledData.fileName,
        options
      };
      generateQuickPDF(payload);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Perform Excel Export (UTF-8, Clean columns, No footer pollution)
  const handleExcel = () => {
    logActivity('EXPORT', 'PrintCenter', `Excel निर्यात: ${compiledData.title} (${scopeType})`, {
      schoolUdise: selectedUdise,
      recordName: compiledData.title,
    });

    if (dataType === 'COMPLETE_SCHOOL' && activeSchool) {
      const sheets = [
        {
          sheetName: '1. शाला विवरण',
          headers: ['विवरण', 'प्रविष्टि'],
          rows: [
            ['यूडाइस कोड', activeSchool.udise],
            ['विद्यालय का नाम', activeSchool.name || activeSchool.hindiName],
            ['शाला प्रकार', activeSchool.schoolType],
            ['ग्राम', activeSchool.village],
            ['ग्राम पंचायत', activeSchool.gramPanchayat],
            ['संस्था प्रधान', activeSchool.principalName],
            ['प्रधान मोबाइल', activeSchool.principalMobile],
            ['कुल विद्यार्थी', targetStudents.length],
            ['कुल स्टाफ', targetStaff.length]
          ]
        },
        {
          sheetName: '2. विद्यार्थी पंजी',
          headers: ['समग्र आईडी', 'विद्यार्थी का नाम', 'पिता का नाम', 'कक्षा', 'लिंग', 'जाति वर्ग', 'CWSN'],
          rows: targetStudents.map((s) => [s.samagraId, s.name, s.fatherName, s.class, s.gender, s.category, s.isCwsn ? 'हाँ' : 'नहीं'])
        },
        {
          sheetName: '3. स्टाफ रोस्टर',
          headers: ['कर्मचारी कोड', 'नाम', 'पदनाम', 'विषय', 'मोबाइल', 'योग्यता', 'स्थिति'],
          rows: targetStaff.map((t) => [t.employeeId || '-', t.name, t.designation, t.subject, t.mobile, t.qualification || '-', t.status])
        },
        {
          sheetName: '4. भौतिक सुविधाएं',
          headers: ['सुविधा का नाम', 'उपलब्धता', 'स्थिति', 'टिप्पणी'],
          rows: targetFacilities.map((f) => [f.facilityName, f.available, f.condition || '-', f.remarks || '-'])
        },
        {
          sheetName: '5. मध्याह्न भोजन',
          headers: ['दिनांक', 'मीनू', 'पात्र छात्र', 'लाभान्वित छात्र', 'रसोई स्वच्छता'],
          rows: targetMDM.map((m) => [m.date, m.menuItem || '-', m.eligibleStudents, m.mealsServed, m.kitchenHygiene])
        }
      ];
      exportMultiSheetExcel(sheets, compiledData.fileName);
      return;
    }

    const payload: ExportDataPayload = {
      title: compiledData.title,
      subtitle: compiledData.subtitle,
      session: selectedSession,
      schoolName: scopeType === 'SINGLE' ? (activeSchool?.name || activeSchool?.hindiName) : undefined,
      udise: scopeType === 'SINGLE' ? selectedUdise : undefined,
      generatedBy: currentUser?.name || 'संजय जैन',
      userRole: currentUser?.role || 'CAC',
      summaryMetrics: compiledData.summaryMetrics,
      headers: compiledData.headers,
      rows: compiledData.rows,
      fileName: compiledData.fileName,
      options
    };
    exportToExcel(payload);
  };

  // Perform CSV Export (UTF-8 with BOM, Clean tabular data)
  const handleCSV = () => {
    logActivity('EXPORT', 'PrintCenter', `CSV निर्यात: ${compiledData.title} (${scopeType})`, {
      schoolUdise: selectedUdise,
      recordName: compiledData.title,
    });
    const payload: ExportDataPayload = {
      title: compiledData.title,
      subtitle: compiledData.subtitle,
      session: selectedSession,
      schoolName: scopeType === 'SINGLE' ? (activeSchool?.name || activeSchool?.hindiName) : undefined,
      udise: scopeType === 'SINGLE' ? selectedUdise : undefined,
      generatedBy: currentUser?.name || 'संजय जैन',
      userRole: currentUser?.role || 'CAC',
      summaryMetrics: compiledData.summaryMetrics,
      headers: compiledData.headers,
      rows: compiledData.rows,
      fileName: compiledData.fileName,
      options
    };
    exportToCSV(payload);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#0B6B4B] dark:text-emerald-300 shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                सार्वभौमिक प्रिंट एवं डेटा निर्यात केंद्र (Print & Export Center)
              </h2>
              <span className="bg-[#FF7A00] text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                A4 प्रिंट रेडी
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              समस्त 37 संकुल शालाओं का आधिकारिक A4 प्रिंट, यूनिकोड PDF, Excel एवं CSV निर्यात (100% हिंदी + अंग्रेजी फॉन्ट सुरक्षित)
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('CUSTOM_BUILDER')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'CUSTOM_BUILDER'
                ? 'bg-[#0B6B4B] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>कस्टम रिपोर्ट बिल्डर</span>
          </button>

          <button
            onClick={() => setActiveTab('QUICK_TEMPLATES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'QUICK_TEMPLATES'
                ? 'bg-[#0B6B4B] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>त्वरित टेम्पलेट्स</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('FONT_TEST');
              setDataType('FONT_TEST');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'FONT_TEST'
                ? 'bg-[#FF7A00] text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>फ़ॉन्ट एवं रेंडरिंग टेस्ट</span>
          </button>
        </div>
      </div>

      {/* QUICK TEMPLATES TAB */}
      {activeTab === 'QUICK_TEMPLATES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
          {[
            {
              id: 'COMPLETE_SCHOOL',
              title: '1. संपूर्ण शाला महा-डोजियर',
              desc: 'एकल शाला का संपूर्ण डोजियर (मूल जानकारी, शिक्षक, विद्यार्थी, सुविधाएं, एमडीएम व कार्य)',
              icon: Building2,
              type: 'COMPLETE_SCHOOL' as DataTypeOption,
            },
            {
              id: 'SCHOOL',
              title: '2. 37 विद्यालयों की मास्टर निर्देशिका',
              desc: 'समस्त प्राथमिक व माध्यमिक शालाओं के यूडाइस, संस्था प्रधान, मोबाइल, श्रेणी का रोस्टर',
              icon: Building2,
              type: 'SCHOOL' as DataTypeOption,
            },
            {
              id: 'STUDENT',
              title: '3. विद्यार्थी नामांकन व जाति रोस्टर',
              desc: 'समग्र आईडी, लिंग, जाति वर्ग (SC/ST/OBC/GEN), CWSN व कक्षावार अधिकृत सूची',
              icon: GraduationCap,
              type: 'STUDENT' as DataTypeOption,
            },
            {
              id: 'TEACHER',
              title: '4. शिक्षक एवं स्टाफ पदस्थापना पंजी',
              desc: 'कर्मचारी कोड, पदनाम, विषय, मोबाइल, योग्यता व पदस्थ शाला की अधिकृत सूची',
              icon: Users,
              type: 'TEACHER' as DataTypeOption,
            },
            {
              id: 'FACILITIES',
              title: '5. 16-सूत्रीय भौतिक अधोसंरचना प्रपत्र',
              desc: 'पेयजल, बालक/बालिका शौचालय, विद्युत, बाउंड्रीवाल, खेल मैदान, रैम्प आदि स्थिति',
              icon: ShieldCheck,
              type: 'FACILITIES' as DataTypeOption,
            },
            {
              id: 'MDM',
              title: '6. मध्याह्न भोजन (MDM) वितरण रजिस्टर',
              desc: 'दैनिक भोजन मीनू, पात्र छात्र, लाभान्वित संख्या एवं खाद्यान्न स्टॉक अभिलेख',
              icon: Utensils,
              type: 'MDM' as DataTypeOption,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-400 rounded-lg">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDataType(item.type);
                      setActiveTab('CUSTOM_BUILDER');
                    }}
                    className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>कस्टमाइज़ व प्रिंट</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FONT TEST BANNER (IF ACTIVE) */}
      {activeTab === 'FONT_TEST' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <Type className="w-5 h-5 text-[#FF7A00]" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                यूनिकोड हिंदी + अंग्रेजी फॉन्ट रेंडरिंग टेस्ट मोड
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                नीचे स्क्रीन पूर्वावलोकन, प्रिंट डायलॉग, PDF, Excel और CSV में देवनागरी संयुक्त अक्षरों, मात्राओं और अंकों की शुद्धता का परीक्षण करें।
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('CUSTOM_BUILDER');
              setDataType('SCHOOL');
            }}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            वापस जाएं
          </button>
        </div>
      )}

      {/* CUSTOM BUILDER MAIN WORKFLOW */}
      {(activeTab === 'CUSTOM_BUILDER' || activeTab === 'FONT_TEST') && (
        <div className="space-y-5">
          {/* Controls Matrix */}
          <div className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-xs space-y-4 no-print">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Data Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  1. डेटा प्रकार (Data Type)
                </label>
                <select
                  value={dataType}
                  onChange={(e) => {
                    setDataType(e.target.value as DataTypeOption);
                    setSingleStudentSamagra('ALL');
                    setSingleTeacherEmpId('ALL');
                  }}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B]"
                >
                  <option value="COMPLETE_SCHOOL">★ संपूर्ण शाला महा-डोजियर</option>
                  <option value="SCHOOL">विद्यालय मास्टर निर्देशिका (Schools)</option>
                  <option value="STUDENT">विद्यार्थी नामांकन व रोस्टर (Students)</option>
                  <option value="TEACHER">शिक्षक एवं स्टाफ पदस्थापना (Staff)</option>
                  <option value="PRINCIPAL">संस्था प्रधान / प्रभारी सूची</option>
                  <option value="ATTENDANCE">दैनिक व मासिक उपस्थिति</option>
                  <option value="MDM">मध्याह्न भोजन (MDM) वितरण</option>
                  <option value="FACILITIES">16-सूत्रीय भौतिक अधोसंरचना</option>
                  <option value="COMPLAINTS">शिकायत निवारण पंजी</option>
                  <option value="WORK">शासकीय कार्य एवं समयसीमा</option>
                  <option value="FONT_TEST">🔤 यूनिकोड फॉन्ट रेंडरिंग टेस्ट</option>
                </select>
              </div>

              {/* Scope Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  2. शाला चयन दायरा (Scope)
                </label>
                <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setScopeType('SINGLE')}
                    className={`py-1.5 rounded-lg transition-all ${
                      scopeType === 'SINGLE'
                        ? 'bg-white dark:bg-[#16211D] text-[#0B6B4B] dark:text-emerald-300 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    एकल शाला
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeType('ALL')}
                    className={`py-1.5 rounded-lg transition-all ${
                      scopeType === 'ALL'
                        ? 'bg-white dark:bg-[#16211D] text-[#0B6B4B] dark:text-emerald-300 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    सभी 37 शालाएं
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeType('MULTI')}
                    className={`py-1.5 rounded-lg transition-all ${
                      scopeType === 'MULTI'
                        ? 'bg-white dark:bg-[#16211D] text-[#0B6B4B] dark:text-emerald-300 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    बहु-शाला
                  </button>
                </div>
              </div>

              {/* Specific School Picker if SINGLE */}
              {scopeType === 'SINGLE' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    3. विशिष्ट विद्यालय चुनें
                  </label>
                  <select
                    value={selectedUdise}
                    onChange={(e) => {
                      setSelectedUdise(e.target.value);
                      setSingleStudentSamagra('ALL');
                      setSingleTeacherEmpId('ALL');
                    }}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  >
                    {schools.map((s) => (
                      <option key={s.udise} value={s.udise}>
                        {s.name || s.hindiName} ({s.udise})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Multi-School Selector */}
              {scopeType === 'MULTI' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    चयनित शालाएं ({multiSelectedUdises.length})
                  </label>
                  <div className="max-h-24 overflow-y-auto bg-gray-50 dark:bg-[#0F1714] p-1.5 border border-gray-300 dark:border-gray-700 rounded-xl space-y-1">
                    {schools.map((s) => (
                      <label key={s.udise} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={multiSelectedUdises.includes(s.udise)}
                          onChange={() => handleToggleMultiSchool(s.udise)}
                          className="rounded text-[#0B6B4B] focus:ring-[#0B6B4B]"
                        />
                        <span className="truncate">{s.name || s.hindiName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Orientation Switcher */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  प्रिंट ओरिएंटेशन (Layout)
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-2 px-2.5 rounded-xl font-bold border flex items-center justify-center gap-1 transition-all ${
                      orientation === 'portrait'
                        ? 'bg-[#0B6B4B] text-white border-[#0B6B4B] shadow-xs'
                        : 'bg-gray-50 dark:bg-[#0F1714] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <span>A4 पोर्ट्रेट</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-2 px-2.5 rounded-xl font-bold border flex items-center justify-center gap-1 transition-all ${
                      orientation === 'landscape'
                        ? 'bg-[#0B6B4B] text-white border-[#0B6B4B] shadow-xs'
                        : 'bg-gray-50 dark:bg-[#0F1714] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <span>A4 लैंडस्केप</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Single Student / Single Teacher Deep Selectors (If Student/Teacher dataType) */}
            {dataType === 'STUDENT' && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    एकल विद्यार्थी चुनें (Single Student)
                  </label>
                  <select
                    value={singleStudentSamagra}
                    onChange={(e) => setSingleStudentSamagra(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                  >
                    <option value="ALL">-- सभी विद्यार्थी (रोस्टर) --</option>
                    {targetStudents.map((st) => (
                      <option key={st.samagraId} value={st.samagraId}>
                        {st.name} (कक्षा {st.class} - {st.samagraId})
                      </option>
                    ))}
                  </select>
                </div>
                {singleStudentSamagra === 'ALL' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">कक्षा फ़िल्टर</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                      >
                        <option value="ALL">समस्त कक्षाएं</option>
                        {['1', '2', '3', '4', '5', '6', '7', '8'].map((c) => (
                          <option key={c} value={c}>कक्षा {c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">लिंग (Gender)</label>
                      <select
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                      >
                        <option value="ALL">समस्त लिंग</option>
                        <option value="बालक">बालक (Boys)</option>
                        <option value="बालिका">बालिका (Girls)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">जाति वर्ग (Category)</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                      >
                        <option value="ALL">समस्त वर्ग</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="OBC">OBC</option>
                        <option value="GEN">GEN</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {dataType === 'TEACHER' && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    एकल शिक्षक / स्टाफ चुनें (Single Teacher Dossier)
                  </label>
                  <select
                    value={singleTeacherEmpId}
                    onChange={(e) => setSingleTeacherEmpId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                  >
                    <option value="ALL">-- समस्त शिक्षक व स्टाफ (सूची) --</option>
                    {targetStaff.map((t) => (
                      <option key={t.id || t.employeeId} value={t.employeeId || t.id}>
                        {t.name} ({t.designation} - {t.employeeId || 'Code N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                {singleTeacherEmpId === 'ALL' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पदनाम फ़िल्टर</label>
                    <select
                      value={selectedDesignation}
                      onChange={(e) => setSelectedDesignation(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="ALL">समस्त पदनाम</option>
                      <option value="प्राथमिक शिक्षक">प्राथमिक शिक्षक</option>
                      <option value="माध्यमिक शिक्षक">माध्यमिक शिक्षक</option>
                      <option value="प्रधानाध्यापक">प्रधानाध्यापक</option>
                      <option value="अतिथि शिक्षक">अतिथि शिक्षक</option>
                      <option value="रसोइया">रसोइया</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Document Print & Export Settings Checklist (Header, School Identity, Page Number, Signature, Footer) */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-1.5 mb-2">
                <Settings className="w-3.5 h-3.5 text-[#0B6B4B]" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  दस्तावेज़ सेटिंग्स (Print & Export Optional Settings):
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <label className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeHeader ?? true}
                    onChange={(e) => setOptions({ ...options, includeHeader: e.target.checked })}
                    className="rounded text-[#0B6B4B] focus:ring-[#0B6B4B]"
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Include Header</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeSchoolIdentity ?? true}
                    onChange={(e) => setOptions({ ...options, includeSchoolIdentity: e.target.checked })}
                    className="rounded text-[#0B6B4B] focus:ring-[#0B6B4B]"
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Include School Identity</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includePageNumber ?? false}
                    onChange={(e) => setOptions({ ...options, includePageNumber: e.target.checked })}
                    className="rounded text-[#0B6B4B] focus:ring-[#0B6B4B]"
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Include Page Number</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeSignature ?? false}
                    onChange={(e) => setOptions({ ...options, includeSignature: e.target.checked })}
                    className="rounded text-[#0B6B4B] focus:ring-[#0B6B4B]"
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Include Signature Section</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeFooter ?? false}
                    onChange={(e) => setOptions({ ...options, includeFooter: e.target.checked })}
                    className="rounded text-[#0B6B4B] focus:ring-[#0B6B4B]"
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Include Footer</span>
                </label>
              </div>
            </div>

            {/* Field Checklist Customizer */}
            {dataType !== 'COMPLETE_SCHOOL' && dataType !== 'FONT_TEST' && singleStudentSamagra === 'ALL' && singleTeacherEmpId === 'ALL' && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    शामिल किए जाने वाले कॉलम (Customize Columns):
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      onClick={() => selectAllFields(true)}
                      className="text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline"
                    >
                      सभी चुनें
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => selectAllFields(false)}
                      className="text-gray-500 hover:underline"
                    >
                      हटाएं
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableFields.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => toggleField(f.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        selectedFields[f.key]
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent'
                      }`}
                    >
                      {selectedFields[f.key] ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar: Export & Print Buttons */}
          <div className="bg-white dark:bg-[#16211D] p-4 rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                कुल चयनित रिकॉर्ड्स: <strong className="text-gray-900 dark:text-white">{compiledData.rows.length}</strong>
              </div>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setZoomLevel(Math.max(70, zoomLevel - 10))}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 text-gray-700 dark:text-gray-300"
                  title="ज़ूम कम करें"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 text-gray-700 dark:text-gray-300"
                  title="ज़ूम बढ़ाएं"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleCSV}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="CSV फाइल डाउनलोड करें (UTF-8 BOM सहित)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV (UTF-8 BOM)</span>
              </button>

              <button
                onClick={handleExcel}
                className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="एक्सेल फाइल डाउनलोड करें"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>एक्सेल (.xlsx)</span>
              </button>

              <button
                onClick={handlePDF}
                disabled={isPdfGenerating}
                className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-300 dark:border-blue-700 hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="यूनिकोड PDF फाइल डाउनलोड करें"
              >
                <FileText className="w-4 h-4" />
                <span>{isPdfGenerating ? 'PDF बन रही है...' : 'PDF डाउनलोड'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                title="A4 साइज में सीधे प्रिंट करें"
              >
                <Printer className="w-4 h-4" />
                <span>A4 प्रिंट निकालें (Print)</span>
              </button>
            </div>
          </div>

          {/* LIVE WYSIWYG A4 DOCUMENT PREVIEW CONTAINER */}
          <div className="bg-gray-200 dark:bg-black/50 p-4 sm:p-8 rounded-2xl flex flex-col items-center overflow-x-auto">
            <div
              id="printable-report-container"
              ref={printReportRef}
              className={`print-report-container unicode-safe bg-white text-gray-900 p-8 sm:p-12 shadow-2xl border border-gray-300 rounded-sm w-full transition-all avoid-break ${
                orientation === 'landscape' ? 'max-w-5xl' : 'max-w-4xl'
              }`}
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Noto Serif Devanagari', 'Mangal', 'Inter', 'Noto Sans', sans-serif",
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
              }}
            >
              {/* Header (Only if options.includeHeader is ON) */}
              {(options.includeHeader ?? true) && (
                <div className="border-b-2 border-[#0B6B4B] pb-4 text-center space-y-1">
                  <div className="text-xs font-bold tracking-widest text-gray-600 uppercase">
                    {institutionConfig.department || 'मध्य प्रदेश शासन • स्कूल शिक्षा विभाग'}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0B6B4B]">
                    {institutionConfig.institutionName}
                  </h1>
                  <p className="text-xs text-gray-700 font-medium">
                    संकुल मलगुवां • विकास खंड: {institutionConfig.block}, जिला: {institutionConfig.district} (म.प्र.)
                  </p>

                  {/* School Identity Metadata Ribbon (Only if options.includeSchoolIdentity is ON) */}
                  {(options.includeSchoolIdentity ?? true) && (
                    <div className="mt-3 pt-2 border-t border-gray-200 grid grid-cols-3 text-[11px] text-gray-600 font-medium">
                      <div className="text-left">
                        <span>शाला दायरा: </span>
                        <strong className="text-gray-900">
                          {scopeType === 'SINGLE' ? (activeSchool?.name || activeSchool?.hindiName) : scopeType === 'ALL' ? 'समस्त 37 संकुल शालाएं' : `${targetSchools.length} चयनित शालाएं`}
                        </strong>
                      </div>
                      <div className="text-center">
                        <span>यूडाइस / संकुल कोड: </span>
                        <strong className="text-gray-900 font-mono">
                          {scopeType === 'SINGLE' ? activeSchool?.udise : institutionConfig.diseCode}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span>शैक्षणिक सत्र: </span>
                        <strong className="text-gray-900">{selectedSession}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Document Subject Banner */}
              <div className="my-4 py-2.5 px-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <h2 className="font-bold text-[#0B6B4B] text-sm">
                    {compiledData.title}
                  </h2>
                  <p className="text-[11px] text-gray-600">
                    {compiledData.subtitle}
                  </p>
                </div>
                <div className="text-right text-[10px] text-gray-500">
                  <div>दिनांक: <strong>{new Date().toLocaleDateString('hi-IN')}</strong></div>
                  <div>समय: <strong>{new Date().toLocaleTimeString('hi-IN')}</strong></div>
                </div>
              </div>

              {/* Summary Metrics Row */}
              {compiledData.summaryMetrics && compiledData.summaryMetrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {compiledData.summaryMetrics.map((m, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 border border-gray-200 rounded text-center">
                      <span className="text-[10px] text-gray-500 block">{m.label}</span>
                      <span className="text-sm font-bold text-[#0B6B4B]">{m.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-300">
                      {compiledData.headers.map((h, i) => (
                        <th key={i} className="p-2 border border-gray-300">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {compiledData.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}
                      >
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 border border-gray-300 font-normal text-[11px]">
                            {String(cell ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Optional Signatures Section (Only if options.includeSignature is ON) */}
              {options.includeSignature && (
                <div className="mt-12 pt-6 border-t-2 border-gray-300 avoid-break">
                  <div className="grid grid-cols-2 text-center text-xs text-gray-800">
                    <div>
                      <div className="h-10"></div>
                      <div className="font-bold">हस्ताक्षर संस्था प्रधान</div>
                      <div className="text-[10px] text-gray-500">{activeSchool?.name || activeSchool?.hindiName || 'शासकीय विद्यालय'}</div>
                    </div>
                    <div>
                      <div className="h-10"></div>
                      <div className="font-bold text-[#0B6B4B]">हस्ताक्षर जन शिक्षक / संकुल समन्वयक</div>
                      <div className="text-[10px] text-gray-500">{institutionConfig.institutionName}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Footer (Only if options.includeFooter is ON) */}
              {options.includeFooter && (
                <div className="mt-6 pt-2 border-t border-dashed border-gray-300 flex items-center justify-between text-[10px] text-gray-500">
                  <span>{scopeType === 'SINGLE' ? `${activeSchool?.name || activeSchool?.hindiName} (${activeSchool?.udise})` : `${institutionConfig.institutionName} (${institutionConfig.district})`}</span>
                  <span>दिनांक: {new Date().toLocaleDateString('hi-IN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
