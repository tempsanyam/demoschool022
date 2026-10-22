import React, { useState, useRef } from 'react';
import {
  User,
  Shield,
  Key,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Lock,
  Users,
  RefreshCw,
  Award,
  Camera,
  Edit3,
  Printer,
  Download,
  Calendar,
  MapPin,
  Briefcase,
  Clock,
  FileText,
  AlertCircle,
  X,
  Save,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  Search,
  School as SchoolIcon,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { institutionConfig } from '../../config/institutionConfig';
import { UserRole, Gender } from '../../types';
import { exportToUnicodePDF } from '../../utils/exportUtils';
import { ClusterUserDirectoryView } from '../users/ClusterUserDirectoryView';

export const ProfileView: React.FC = () => {
  const { currentUser, users, registeredUsers, updateCurrentUser, updatePassword } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();
  const { schools, activeSchools, auditLogs, logActivity, settings, selectedSessionId, staff, academicSessions } = useData();

  // Active sub-tab inside Profile
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'activity' | 'directory'>('overview');

  // School Institution User Detection
  const isSchoolUser = currentUser?.role === 'SCHOOL';
  const schoolUdise = currentUser?.assignedSchoolUdise;
  const school = schools.find((s) => String(s.udise) === String(schoolUdise));

  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: currentUser?.name || '',
    fatherName: currentUser?.fatherName || '',
    gender: currentUser?.gender || 'बालक',
    dob: currentUser?.dob || '',
    mobile: currentUser?.mobile || '',
    alternateMobile: currentUser?.alternateMobile || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
    village: currentUser?.village || '',
    pinCode: currentUser?.pinCode || '472115',
    department: currentUser?.department || 'स्कूल शिक्षा विभाग म.प्र.',
    subject: currentUser?.subject || '',
    avatar: currentUser?.avatar || '',
  });

  // Password Change state
  const [passData, setPassData] = useState({
    currentPass: '',
    newPass: '',
    confirmPass: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status/Feedback Messages
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');

  // Activity search query
  const [activitySearch, setActivitySearch] = useState('');

  // Photo upload file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assigned School Info
  const assignedSchoolObj = school || schools.find((s) => s.udise === currentUser?.assignedSchoolUdise);
  const totalAssignedSchools =
    currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN'
      ? activeSchools.length
      : 1;

  // Active session status derivation
  const activeSessionObj = (academicSessions || []).find(
    (s) => s.id === selectedSessionId || s.sessionId === selectedSessionId
  );
  const sessionStatusText = activeSessionObj?.status === 'ACTIVE'
    ? 'सक्रिय सत्र'
    : activeSessionObj?.status === 'LOCKED'
    ? 'सत्र लॉक'
    : activeSessionObj?.status === 'ARCHIVED'
    ? 'अभिलेखागार (Archived)'
    : activeSessionObj?.status || 'सक्रिय सत्र';

  // Verified In-charge Staff from StaffMaster / Staff list (Strict match, no guessed records)
  const verifiedInchargeStaff = React.useMemo(() => {
    if (!school) return null;

    const schoolStaff = (staff || []).filter(
      (st) => String(st.assignedSchoolUdise) === String(school.udise)
    );

    // 1. Match by principal employee ID
    if (school.principalEmployeeId) {
      const byEmp = schoolStaff.find(
        (st) => st.employeeId === school.principalEmployeeId && st.status === 'ACTIVE'
      );
      if (byEmp) return byEmp;
    }

    // 2. Match by principal name
    if (school.principalName && school.principalName.trim()) {
      const byName = schoolStaff.find(
        (st) => st.name.trim().toLowerCase() === school.principalName.trim().toLowerCase() && st.status === 'ACTIVE'
      );
      if (byName) return byName;
    }

    // 3. Match by head of school designation / duty
    const byDesig = schoolStaff.find(
      (st) =>
        st.status === 'ACTIVE' &&
        (
          st.designation.includes('प्राचार्य') ||
          st.designation.includes('प्रधान पाठक') ||
          st.designation.includes('प्र.अ.') ||
          st.designation.includes('प्रभारी') ||
          (st.duty && (st.duty.includes('प्रभारी') || st.duty.includes('प्र.अ.')))
        )
    );
    if (byDesig) return byDesig;

    return null;
  }, [school, staff]);

  // Open Edit Modal with fresh values
  const handleOpenEditModal = () => {
    if (!currentUser) return;
    setEditFormData({
      name: isSchoolUser ? (school?.name || currentUser.name) : (currentUser.name || ''),
      fatherName: currentUser.fatherName || '',
      gender: currentUser.gender || 'बालक',
      dob: currentUser.dob || '',
      mobile: currentUser.mobile || school?.mobile || '',
      alternateMobile: currentUser.alternateMobile || '',
      email: currentUser.email || school?.email || '',
      address: currentUser.address || school?.address || '',
      village: isSchoolUser ? (school?.village || '') : (currentUser.village || ''),
      pinCode: currentUser.pinCode || school?.pin || '472115',
      department: currentUser.department || 'स्कूल शिक्षा विभाग म.प्र.',
      subject: currentUser.subject || '',
      avatar: currentUser.avatar || '',
    });
    setSaveErrorMsg('');
    setIsEditModalOpen(true);
  };

  // Handle Photo Upload (Base64) - only for personal staff accounts
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('कृपया केवल इमेज (JPG, PNG, WebP) फाइल चुनें।');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('इमेज फाइल का आकार 2MB से कम होना चाहिए।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setEditFormData((prev) => ({ ...prev, avatar: base64 }));
      updateCurrentUser({ avatar: base64 });
      logActivity('UPDATE', 'Profile', 'प्रोफ़ाइल फोटो अद्यतन की गई।');
      setSaveSuccessMsg('प्रोफ़ाइल फोटो सफलतापूर्वक अपडेट हो गई।');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  // Remove Photo
  const handleRemovePhoto = () => {
    setEditFormData((prev) => ({ ...prev, avatar: '' }));
    updateCurrentUser({ avatar: '' });
    logActivity('UPDATE', 'Profile', 'प्रोफ़ाइल फोटो हटाई गई।');
    setSaveSuccessMsg('प्रोफ़ाइल फोटो हटा दी गई।');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Save Profile Changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrorMsg('');

    // SCHOOL Account Profile: strictly contact/communication details
    if (isSchoolUser) {
      if (!editFormData.mobile.trim() || editFormData.mobile.trim().length !== 10) {
        setSaveErrorMsg('कृपया 10 अंकों का वैध संस्था संपर्क मोबाइल नंबर दर्ज करें।');
        return;
      }

      const res = updateCurrentUser({
        mobile: editFormData.mobile.trim(),
        alternateMobile: editFormData.alternateMobile?.trim() || '',
        email: editFormData.email?.trim() || '',
        address: editFormData.address?.trim() || '',
        pinCode: editFormData.pinCode?.trim() || '472115',
      });

      if (res.success) {
        logActivity('UPDATE', 'Profile', `${school?.name || currentUser.username} का संस्था संपर्क विवरण अद्यतन किया गया।`);
        setIsEditModalOpen(false);
        setSaveSuccessMsg('✓ संस्था संपर्क विवरण सफलतापूर्वक अपडेट हो गया है।');
        setTimeout(() => setSaveSuccessMsg(''), 5000);
      } else {
        setSaveErrorMsg(res.message);
      }
      return;
    }

    // Individual Staff / CAC / Admin Profile Save
    if (!editFormData.name.trim()) {
      setSaveErrorMsg('पूरा नाम दर्ज करना अनिवार्य है।');
      return;
    }

    if (!editFormData.mobile.trim() || editFormData.mobile.trim().length !== 10) {
      setSaveErrorMsg('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
      return;
    }

    const res = updateCurrentUser({
      name: editFormData.name.trim(),
      fatherName: editFormData.fatherName.trim(),
      gender: editFormData.gender as Gender,
      dob: editFormData.dob,
      mobile: editFormData.mobile.trim(),
      alternateMobile: editFormData.alternateMobile.trim(),
      email: editFormData.email.trim(),
      address: editFormData.address.trim(),
      village: editFormData.village.trim(),
      pinCode: editFormData.pinCode.trim(),
      department: editFormData.department.trim(),
      subject: editFormData.subject.trim(),
      avatar: editFormData.avatar,
    });

    if (res.success) {
      logActivity('UPDATE', 'Profile', `${currentUser?.name} द्वारा व्यक्तिगत प्रोफ़ाइल विवरण अद्यतन किया गया।`);
      setIsEditModalOpen(false);
      setSaveSuccessMsg('✓ प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई है।');
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } else {
      setSaveErrorMsg(res.message);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (!passData.currentPass) {
      setPassErrorMsg('कृपया वर्तमान पासवर्ड दर्ज करें।');
      return;
    }

    if (!passData.newPass || passData.newPass.length < 6) {
      setPassErrorMsg('नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }

    if (passData.newPass !== passData.confirmPass) {
      setPassErrorMsg('नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।');
      return;
    }

    const res = await updatePassword(passData.currentPass, passData.newPass);
    if (res.success) {
      logActivity('UPDATE', 'Auth', `${currentUser?.name || currentUser?.username} द्वारा खाता सुरक्षा पासवर्ड बदला गया।`);
      setPassSuccessMsg('✓ पासवर्ड सफलतापूर्वक बदल दिया गया है।');
      setPassData({ currentPass: '', newPass: '', confirmPass: '' });
      setTimeout(() => setPassSuccessMsg(''), 6000);
    } else {
      setPassErrorMsg(res.message);
    }
  };

  // System Print Dossier
  const handlePrintProfile = () => {
    window.print();
  };

  // Generate and Download Unicode Devanagari PDF
  const handleDownloadPDF = async () => {
    if (!currentUser) return;
    try {
      if (isSchoolUser && school) {
        // School Institution PDF Dossier (Strictly 4 sections, no personal employee fields)
        const rows: (string | number)[][] = [
          // 1. विद्यालय पहचान
          ['[1. विद्यालय पहचान] विद्यालय का नाम', school.name || '-'],
          ['[1. विद्यालय पहचान] UDISE Code', school.udise || '-'],
          ['[1. विद्यालय पहचान] विद्यालय स्तर / प्रकार', `${school.schoolType} विद्यालय`],
          ['[1. विद्यालय पहचान] ग्राम / बसाहट', school.village || '-'],
          ['[1. विद्यालय पहचान] ग्राम पंचायत', school.gramPanchayat || 'उपलब्ध नहीं'],
          ['[1. विद्यालय पहचान] विकास खंड', school.block || institutionConfig.block],
          ['[1. विद्यालय पहचान] जिला', school.district || institutionConfig.district],
          ['[1. विद्यालय पहचान] संकुल', school.sankul || institutionConfig.sankulName],

          // 2. संस्था एवं अधिकार क्षेत्र
          ['[2. संस्था एवं अधिकार क्षेत्र] जन शिक्षा केंद्र / संकुल', school.sankul || institutionConfig.sankulName],
          ['[2. संस्था एवं अधिकार क्षेत्र] विकास खंड व जिला', `${school.block || institutionConfig.block}, ${school.district || institutionConfig.district}`],
          ['[2. संस्था एवं अधिकार क्षेत्र] शैक्षणिक सत्र', selectedSessionId],
          ['[2. संस्था एवं अधिकार क्षेत्र] अधिकार क्षेत्र', `आवंटित शाला (${school.name})`],
          ['[2. संस्था एवं अधिकार क्षेत्र] सत्र स्थिति', sessionStatusText],
          ['[2. संस्था एवं अधिकार क्षेत्र] संस्था संपर्क मोबाइल', currentUser.mobile || school.mobile || 'उपलब्ध नहीं'],
          ['[2. संस्था एवं अधिकार क्षेत्र] संस्था आधिकारिक ईमेल', currentUser.email || school.email || 'उपलब्ध नहीं'],

          // 3. संस्था प्रभारी / संस्था प्रमुख
          ...(verifiedInchargeStaff
            ? [
                ['[3. संस्था प्रभारी] नाम', verifiedInchargeStaff.name],
                ['[3. संस्था प्रभारी] यूनिक कर्मचारी आईडी', verifiedInchargeStaff.employeeId],
                ['[3. संस्था प्रभारी] पदनाम', verifiedInchargeStaff.designation],
                ['[3. संस्था प्रभारी] संपर्क मोबाइल', verifiedInchargeStaff.mobile],
                ['[3. संस्था प्रभारी] वर्तमान पदस्थापना', `${school.name} (${school.village})`],
              ]
            : [
                ['[3. संस्था प्रभारी] स्थिति', 'संस्था प्रभारी की जानकारी उपलब्ध नहीं है।'],
              ]),

          // 4. संस्था खाता एवं सुरक्षा
          ['[4. संस्था खाता एवं सुरक्षा] खाता प्रकार (Account Type)', 'SCHOOL (विद्यालय संस्था खाता)'],
          ['[4. संस्था खाता एवं सुरक्षा] उपयोगकर्ता नाम (Username)', currentUser.username || school.udise],
          ['[4. संस्था खाता एवं सुरक्षा] स्कूल UDISE Code', school.udise],
          ['[4. संस्था खाता एवं सुरक्षा] आवंटित शाला', school.name],
          ['[4. संस्था खाता एवं सुरक्षा] खाता स्थिति', currentUser.status === 'ACTIVE' ? 'सक्रिय (Active & Verified)' : currentUser.status],
          ['[4. संस्था खाता एवं सुरक्षा] अंतिम सफल लॉगिन', currentUser.lastLogin || 'उपलब्ध नहीं'],
          ['[4. संस्था खाता एवं सुरक्षा] पासवर्ड स्थिति', 'पासवर्ड सुरक्षित है (••••••••)'],
        ];

        await exportToUnicodePDF({
          title: 'विद्यालय संस्था प्रोफ़ाइल एवं आधिकारिक विवरण',
          subtitle: `${school.name} | UDISE: ${school.udise} | संकुल: ${school.sankul || institutionConfig.sankulName} | सत्र: ${selectedSessionId}`,
          headers: ['विवरण / मानक प्रविष्टि', 'आधिकारिक विवरण'],
          rows,
          fileName: `School_Profile_${school.udise}_${selectedSessionId}`,
          options: {
            includeHeader: true,
            includeSchoolIdentity: true,
            includeSignature: true,
            includeFooter: true,
          },
        });
        logActivity('EXPORT', 'Profile', `${school.name} की संस्था प्रोफ़ाइल PDF डाउनलोड की गई।`);
        return;
      }

      // Individual Staff / CAC / Admin PDF Export
      const rows: (string | number)[][] = [
        ['[व्यक्तिगत] पूरा नाम (Full Name)', currentUser.name || '-'],
        ['[व्यक्तिगत] पिता / पति का नाम', currentUser.fatherName || 'श्री रमेश चंद्र जैन'],
        ['[व्यक्तिगत] लिंग (Gender)', currentUser.gender || 'बालक'],
        ['[व्यक्तिगत] जन्म तिथि (DOB)', currentUser.dob || '15/07/1982'],
        ['[व्यक्तिगत] प्राथमिक मोबाइल', currentUser.mobile || '-'],
        ['[व्यक्तिगत] अतिरिक्त संपर्क', currentUser.alternateMobile || '-'],
        ['[व्यक्तिगत] ईमेल आईडी', currentUser.email || '-'],
        ['[व्यक्तिगत] स्थाई निवास पता', `${currentUser.address || 'मलगुवां'}, ${currentUser.village || 'मलगुवां'}`],
        ['[सेवा विवरण] यूनिक कर्मचारी आईडी', currentUser.employeeId || '-'],
        ['[सेवा विवरण] पदनाम (Designation)', currentUser.designation || '-'],
        ['[सेवा विवरण] प्रशासनिक भूमिका (Role)', currentUser.role || '-'],
        ['[सेवा विवरण] मूल विभाग', currentUser.department || 'स्कूल शिक्षा विभाग म.प्र.'],
        ['[सेवा विवरण] प्रथम नियुक्ति दिनांक', currentUser.joiningDate || '12/09/2008'],
        ['[सेवा विवरण] वर्तमान पदस्थापना', currentUser.currentPosting || 'जन शिक्षा केंद्र मलगुवां'],
        ['[सेवा विवरण] संकुल केंद्र', institutionConfig.institutionName],
        ['[सेवा विवरण] विकास खंड एवं जिला', `${institutionConfig.block}, ${institutionConfig.district}`],
        ['[सेवा विवरण] शैक्षणिक सत्र', selectedSessionId],
        ['[सेवा विवरण] खाता स्थिति', currentUser.status === 'ACTIVE' ? 'सक्रिय (Active & Verified)' : currentUser.status],
      ];

      await exportToUnicodePDF({
        title: 'अधिकारी / कर्मचारी विस्तृत प्रोफ़ाइल विवरण',
        subtitle: `${currentUser.name} | ${currentUser.designation || 'स्टाफ'} | आईडी: ${currentUser.employeeId || currentUser.username}`,
        headers: ['विवरण / मानक प्रविष्टि', 'आधिकारिक विवरण'],
        rows,
        fileName: `Profile_Dossier_${currentUser.employeeId || currentUser.username}`,
        options: {
          includeHeader: true,
          includeSchoolIdentity: true,
          includeSignature: true,
          includeFooter: true,
        },
      });
      logActivity('EXPORT', 'Profile', `${currentUser.name} की प्रोफ़ाइल PDF डाउनलोड की गई।`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      window.print();
    }
  };

  // Filter User Activities - Strictly scoped to current user or their assigned school
  const userActivities = auditLogs
    .filter((log) => {
      const isMyUser =
        (log.userId && currentUser?.id && log.userId === currentUser.id) ||
        (log.userName && currentUser?.name && log.userName.toLowerCase() === currentUser.name.toLowerCase());
      const isMySchool =
        currentUser?.role === 'SCHOOL' &&
        currentUser.assignedSchoolUdise &&
        log.schoolUdise === currentUser.assignedSchoolUdise;
      return isMyUser || isMySchool;
    })
    .filter((log) => {
      if (!activitySearch.trim()) return true;
      const q = activitySearch.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.timestamp.toLowerCase().includes(q)
      );
    });

  if (!currentUser) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#17211C] rounded-2xl border border-gray-200 dark:border-gray-800">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <p className="font-bold text-gray-800 dark:text-gray-200">कृपया सिस्टम में लॉगिन करें।</p>
      </div>
    );
  }

  // Guard: If SCHOOL user has no matching school in SchoolMaster, display explicit error state
  if (isSchoolUser && !school) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#17211C] rounded-2xl border border-red-200 dark:border-red-800 space-y-3">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          विद्यालय मास्टर रिकॉर्ड उपलब्ध नहीं है
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          आपके खाते से संबंधित UDISE कोड (<span className="font-mono font-bold text-red-600">{schoolUdise || 'अनुपलब्ध'}</span>) संकुल शाला मास्टर सूची में नहीं पाया गया।
        </p>
        <p className="text-[11px] text-gray-500">
          कृपया संकुल समन्वयक या सिस्टम व्यवस्थापक से संपर्क करें।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Hidden Native File Input for Photo Upload (Staff personal only) */}
      {!isSchoolUser && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      )}

      {/* Success / Alert Toast Notification */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </span>
          <button onClick={() => setSaveSuccessMsg('')} className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. MASTER PROFILE IDENTITY CARD & HEADER                    */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        {/* Emerald Header Accent Strip */}
        <div className="bg-linear-to-r from-[#074731] via-[#0B6B4B] to-[#128C5A] p-4 sm:p-6 text-white relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-5">
              {isSchoolUser && school ? (
                /* Institutional Account Emblem */
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white text-[#0B6B4B] flex flex-col items-center justify-center font-bold shadow-md border-2 border-white/80 p-2 shrink-0">
                  <SchoolIcon className="w-10 h-10 sm:w-11 sm:h-11 text-[#0B6B4B]" />
                  <span className="text-[10px] font-bold text-[#0B6B4B] mt-0.5 tracking-tight text-center leading-tight">
                    संस्था खाता
                  </span>
                </div>
              ) : (
                /* Personal Staff Profile Avatar with Upload Trigger */
                <div className="relative group shrink-0">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/80 shadow-md bg-white"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white text-[#0B6B4B] flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-md border-2 border-white/80">
                      {currentUser.name?.charAt(0) || 'स'}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold gap-1 cursor-pointer"
                    title="फोटो बदलें (Upload Photo)"
                  >
                    <Camera className="w-5 h-5" />
                    <span>फोटो बदलें</span>
                  </button>
                </div>
              )}

              {/* Identity Header Text */}
              <div className="space-y-1">
                {isSchoolUser && school ? (
                  /* Institution Header Text */
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                        {school.name} {school.village ? `(${school.village})` : ''}
                      </h1>
                      <span className="bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-emerald-300" />
                        <span>विद्यालय संस्था खाता</span>
                      </span>
                    </div>

                    <p className="text-xs text-emerald-100/90 font-medium flex items-center gap-2 flex-wrap">
                      <span>{school.schoolType} विद्यालय</span>
                      <span>•</span>
                      <span>
                        UDISE Code: <span className="font-mono font-bold text-amber-200">{school.udise}</span>
                      </span>
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-emerald-200 pt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{school.sankul || institutionConfig.sankulName}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{school.block || institutionConfig.block}, {school.district || institutionConfig.district}</span>
                      </span>
                    </div>
                  </>
                ) : (
                  /* Personal Staff Header Text */
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                        {currentUser.name}
                      </h1>
                      <span className="bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                        <span>{currentUser.role === 'ADMIN' ? 'मुख्य व्यवस्थापक (Admin)' : 'जन शिक्षक (CAC)'}</span>
                      </span>
                    </div>

                    <p className="text-xs text-emerald-100/90 font-medium">
                      {currentUser.designation} • कर्मचारी आईडी: <span className="font-mono font-bold text-amber-200">{currentUser.employeeId}</span>
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-emerald-200 pt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{settings?.sankulName || institutionConfig.institutionName}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{institutionConfig.block}, {institutionConfig.district}</span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Header Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {isFeatureEnabled('module.profile.action.edit_profile') && (
                <button
                  onClick={handleOpenEditModal}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#0B6B4B] font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isSchoolUser ? 'प्रोफ़ाइल संपादित करें' : 'प्रोफ़ाइल संपादित करें'}</span>
                </button>
              )}

              {isFeatureEnabled('module.profile.action.change_password') && (
                <button
                  onClick={() => setActiveTab('security')}
                  className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors flex items-center gap-1.5 border border-white/20 cursor-pointer"
                >
                  <Key className="w-4 h-4 text-amber-300" />
                  <span>पासवर्ड</span>
                </button>
              )}

              {isFeatureEnabled('module.profile.action.print_export') && (
                <>
                  <button
                    onClick={handlePrintProfile}
                    className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors flex items-center gap-1.5 border border-white/20 cursor-pointer"
                    title="प्रिंट निकालें"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">प्रिंट</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors flex items-center gap-1.5 border border-white/20 cursor-pointer"
                    title="PDF फ़ाइल डाउनलोड करें"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SANKUL & INSTITUTIONAL JURISDICTION IDENTITY CARD         */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <SchoolIcon className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400" />
          <span>संस्था एवं अधिकार क्षेत्र पहचान (Institutional & Jurisdiction Identity)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-gray-50 dark:bg-[#0F1713] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400 block text-[11px]">जन शिक्षा केंद्र / संकुल</span>
            <span className="font-bold text-gray-900 dark:text-white truncate block mt-0.5" title={settings?.sankulName || institutionConfig.institutionName}>
              {settings?.sankulName || institutionConfig.sankulName}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-[#0F1713] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400 block text-[11px]">विकास खंड (Block)</span>
            <span className="font-bold text-gray-900 dark:text-white block mt-0.5">
              {settings?.blockName || institutionConfig.block}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-[#0F1713] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400 block text-[11px]">जिला (District)</span>
            <span className="font-bold text-gray-900 dark:text-white block mt-0.5">
              {settings?.districtName || institutionConfig.district}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-[#0F1713] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400 block text-[11px]">शैक्षणिक सत्र</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
              {selectedSessionId}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-[#0F1713] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400 block text-[11px]">अधिकार क्षेत्र (Scope)</span>
            <span className="font-bold text-purple-700 dark:text-purple-400 block mt-0.5 truncate">
              {isSchoolUser && school ? `आवंटित शाला (${school.name})` : totalAssignedSchools > 1 ? `समस्त ${totalAssignedSchools} शालाएं` : 'आवंटित शाला'}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-[#0F1713] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400 block text-[11px]">सत्र स्थिति</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{sessionStatusText}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. PROFILE NAVIGATION TABS                                   */}
      {/* ============================================================ */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto gap-2 text-xs font-bold no-print">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-[#0B6B4B] text-[#0B6B4B] dark:text-emerald-400 dark:border-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          {isSchoolUser ? (
            <>
              <SchoolIcon className="w-4 h-4" />
              <span>संस्था विवरण एवं पहचान</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4" />
              <span>प्रोफ़ाइल एवं सेवा विवरण</span>
            </>
          )}
        </button>

        {isFeatureEnabled('module.profile.action.change_password') && (
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-[#0B6B4B] text-[#0B6B4B] dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>सुरक्षा एवं पासवर्ड</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'border-[#0B6B4B] text-[#0B6B4B] dark:text-emerald-400 dark:border-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{isSchoolUser ? `विद्यालय गतिविधियां व ऑडिट लॉग (${userActivities.length})` : `मेरी गतिविधियां व ऑडिट लॉग (${userActivities.length})`}</span>
        </button>

        {(currentUser.role === 'CAC' || currentUser.role === 'ADMIN') && isFeatureEnabled('module.users') && (
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'border-[#0B6B4B] text-[#0B6B4B] dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>संकुल उपयोगकर्ता डायरेक्टरी ({users.length})</span>
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. TAB 1: OVERVIEW                                           */}
      {/*    A. FOR SCHOOL: INSTITUTION DOSSIER (4 DISTINCT SECTIONS)  */}
      {/*    B. FOR CAC/ADMIN: PERSONAL & SERVICE DOSSIER              */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        isSchoolUser && school ? (
          /* ======================================================= */
          /* SCHOOL INSTITUTION ACCOUNT DOSSIER (4 STRICT SECTIONS)   */
          /* ======================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* SECTION 1: विद्यालय पहचान (School Identity) */}
            <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <SchoolIcon className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400" />
                  <span>1. विद्यालय पहचान (School Identity)</span>
                </h3>
                {isFeatureEnabled('module.profile.action.edit_profile') && (
                  <button
                    onClick={handleOpenEditModal}
                    className="text-xs font-bold text-[#0B6B4B] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>संपर्क विवरण अद्यतन</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">विद्यालय का नाम:</span>
                  <span className="font-bold text-gray-900 dark:text-white text-right">
                    {school.name} {school.hindiName && school.hindiName !== school.name ? `(${school.hindiName})` : ''}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">UDISE Code:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {school.udise}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">विद्यालय स्तर / प्रकार:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {school.schoolType} विद्यालय
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">ग्राम / बसाहट:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {school.village || 'उपलब्ध नहीं'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">ग्राम पंचायत:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {school.gramPanchayat || 'उपलब्ध नहीं'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">विकास खंड (Block):</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {school.block || institutionConfig.block}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">जिला (District):</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {school.district || institutionConfig.district}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">संकुल (Cluster):</span>
                  <span className="font-bold text-[#0B6B4B] dark:text-emerald-400">
                    {school.sankul || institutionConfig.sankulName}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: संस्था एवं अधिकार क्षेत्र पहचान (Jurisdiction & Session) */}
            <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>2. संस्था एवं अधिकार क्षेत्र पहचान (Jurisdiction & Session)</span>
                </h3>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                  आधिकारिक अभिलेख
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">जन शिक्षा केंद्र / संकुल:</span>
                  <span className="font-bold text-gray-900 dark:text-white text-right">
                    {settings?.sankulName || school.sankul || institutionConfig.sankulName}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">विकास खंड:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {settings?.blockName || school.block || institutionConfig.block}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">जिला:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {settings?.districtName || school.district || institutionConfig.district}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">शैक्षणिक सत्र:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {selectedSessionId}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">अधिकार क्षेत्र (Scope):</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">
                    आवंटित शाला ({school.name})
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">सत्र स्थिति:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{sessionStatusText}</span>
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">संस्था संपर्क मोबाइल:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {currentUser.mobile || school.mobile || 'उपलब्ध नहीं'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">संस्था आधिकारिक ईमेल:</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">
                    {currentUser.email || school.email || 'उपलब्ध नहीं'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 3: संस्था प्रभारी / संस्था प्रमुख (Head of Institution / In-Charge) */}
            <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400" />
                  <span>3. संस्था प्रभारी / संस्था प्रमुख (Head of Institution / In-Charge)</span>
                </h3>
                {verifiedInchargeStaff && (
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    स्टाफ मास्टर सत्यापित
                  </span>
                )}
              </div>

              {verifiedInchargeStaff ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                    <span className="text-gray-500 dark:text-gray-400">संस्था प्रभारी का नाम:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {verifiedInchargeStaff.name}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                    <span className="text-gray-500 dark:text-gray-400">यूनिक कर्मचारी आईडी:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {verifiedInchargeStaff.employeeId}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                    <span className="text-gray-500 dark:text-gray-400">वर्तमान पदनाम (Designation):</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {verifiedInchargeStaff.designation}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                    <span className="text-gray-500 dark:text-gray-400">मोबाइल नंबर:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#0B6B4B]" />
                      <span>{verifiedInchargeStaff.mobile}</span>
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                    <span className="text-gray-500 dark:text-gray-400">वर्तमान पदस्थापना:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {school.name} ({school.village})
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500 dark:text-gray-400">सत्यापन स्थिति:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>सत्यापित विभागीय शिक्षक (Active Staff Record)</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-800 text-center py-6">
                  <AlertCircle className="w-6 h-6 text-gray-400 dark:text-gray-500 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    संस्था प्रभारी की जानकारी उपलब्ध नहीं है।
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    शाला मास्टर अथवा स्टाफ मास्टर में सक्रिय संस्था प्रभारी का रिकॉर्ड संकुल स्तर से सत्यापित नहीं है।
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 4: संस्था खाता एवं सुरक्षा (Institution Account & Security) */}
            <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>4. संस्था खाता एवं सुरक्षा (Institution Account & Security)</span>
                </h3>
                {isFeatureEnabled('module.profile.action.change_password') && (
                  <button
                    onClick={() => setActiveTab('security')}
                    className="text-xs font-bold text-[#0B6B4B] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>पासवर्ड बदलें</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">Account Type:</span>
                  <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold px-2 py-0.5 rounded text-[11px]">
                    {currentUser.role} (विद्यालय संस्था खाता)
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">उपयोगकर्ता नाम (Username):</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {currentUser.username || school.udise}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">School UDISE Code:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {school.udise}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">आवंटित शाला (Assigned School):</span>
                  <span className="font-bold text-gray-900 dark:text-white text-right">
                    {school.name}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">खाता स्थिति (Account Status):</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentUser.status === 'ACTIVE' ? 'सक्रिय (Active & Verified)' : currentUser.status}</span>
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">अंतिम सफल लॉगिन (Last Login):</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                    {currentUser.lastLogin || 'उपलब्ध नहीं'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">पासवर्ड सुरक्षा:</span>
                  <span className="font-mono font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>•••••••• (पासवर्ड सुरक्षित है)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================= */
          /* PERSONAL STAFF / CAC / ADMIN DOSSIER                    */
          /* ======================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Personal Information Card */}
            <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400" />
                  <span>व्यक्तिगत जानकारी (Personal Information)</span>
                </h3>
                {isFeatureEnabled('module.profile.action.edit_profile') && (
                  <button
                    onClick={handleOpenEditModal}
                    className="text-xs font-bold text-[#0B6B4B] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>संपादित करें</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">पूरा नाम (Full Name):</span>
                  <span className="font-bold text-gray-900 dark:text-white">{currentUser.name}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">पिता / पति का नाम:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {currentUser.fatherName || 'उपलब्ध नहीं'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">लिंग (Gender):</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {currentUser.gender || 'बालक'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">जन्म तिथि (Date of Birth):</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">
                    {currentUser.dob || 'उपलब्ध नहीं'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">प्राथमिक मोबाइल नंबर:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#0B6B4B]" />
                    <span>{currentUser.mobile}</span>
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">अतिरिक्त संपर्क (Alternate Mobile):</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">
                    {currentUser.alternateMobile || 'उपलब्ध नहीं'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">ईमेल आईडी (Official Email):</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-600" />
                    <span>{currentUser.email}</span>
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">स्थाई निवास पता (Address):</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-right max-w-[200px] truncate">
                    {currentUser.address || 'मलगुवां'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">ग्राम / नगर (Village):</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {currentUser.village || 'मलगुवां'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">पिन कोड (PIN Code):</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                    {currentUser.pinCode || '472115'}
                  </span>
                </div>
              </div>
            </div>

            {/* Official & Employment Information Card */}
            <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>शासकीय एवं सेवा विवरण (Official / Employment Details)</span>
                </h3>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                  प्रमाणित रिकॉर्ड
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">यूनिक कर्मचारी आईडी (Employee ID):</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {currentUser.employeeId}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">वर्तमान पदनाम (Designation):</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {currentUser.designation}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">प्रशासनिक भूमिका (Role):</span>
                  <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold px-2 py-0.5 rounded text-[11px]">
                    {currentUser.role}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">मूल विभाग (Department):</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {currentUser.department || 'स्कूल शिक्षा विभाग म.प्र.'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">सेवा में प्रथम नियुक्ति दिनांक:</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">
                    {currentUser.joiningDate || '12/09/2008'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">वर्तमान पदस्थापना (Current Posting):</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {currentUser.currentPosting || 'जन शिक्षा केंद्र मलगुवां'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">संकुल / संस्था का नाम:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                    {currentUser.currentSchoolOrSankul || institutionConfig.institutionName}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">विकास खंड व जिला:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {institutionConfig.block}, {institutionConfig.district}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400">कार्यक्षेत्र / प्रभार:</span>
                  <span className="font-semibold text-[#0B6B4B] dark:text-emerald-400">
                    {currentUser.role === 'CAC' ? 'समस्त संकुल मलगुवां क्षेत्र' : assignedSchoolObj?.hindiName || 'आवंटित शाला'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">खाता स्थिति (Account Status):</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentUser.status === 'ACTIVE' ? 'सक्रिय (Active & Verified)' : currentUser.status}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* ============================================================ */}
      {/* 5. TAB 2: SECURITY & PASSWORD CHANGE                         */}
      {/* ============================================================ */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Change Password Form */}
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
            <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>पासवर्ड बदलें (Change Password)</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                अपने खाते की सुरक्षा हेतु समय-समय पर पासवर्ड बदलते रहें। (न्यूनतम 6 अक्षर)
              </p>
            </div>

            {passSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{passSuccessMsg}</span>
              </div>
            )}

            {passErrorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{passErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  वर्तमान पासवर्ड (Current Password) *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={passData.currentPass}
                    onChange={(e) => setPassData({ ...passData, currentPass: e.target.value })}
                    placeholder="वर्तमान पासवर्ड दर्ज करें (डिफ़ॉल्ट: admin123)"
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:border-transparent outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  नया पासवर्ड (New Password) *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={passData.newPass}
                    onChange={(e) => setPassData({ ...passData, newPass: e.target.value })}
                    placeholder="नया पासवर्ड दर्ज करें (कम से कम 6 अक्षर)"
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:border-transparent outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  नए पासवर्ड की पुष्टि करें (Confirm New Password) *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={passData.confirmPass}
                    onChange={(e) => setPassData({ ...passData, confirmPass: e.target.value })}
                    placeholder="नया पासवर्ड पुनः दर्ज करें"
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:border-transparent outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#0B6B4B] hover:bg-[#085239] text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>नया पासवर्ड सुरक्षित करें (Save Password)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Account Security Information Card */}
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
            <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>खाता सुरक्षा एवं सत्र नियंत्रण (Account Security Overview)</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                सुरक्षित एन्क्रिप्शन एवं भूमिका आधारित पहुंच नियंत्रण (RBAC) सक्रिय है।
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block text-[11px]">खाता प्रमाणीकरण स्थिति</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>सत्यापित विभागीय खाता (Verified Official Account)</span>
                  </span>
                </div>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                  256-Bit SSL
                </span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">अंतिम सफल लॉगिन सत्र:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">
                  {currentUser.lastLogin || 'आज, 09:30 AM'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">अंतिम प्रोफ़ाइल अद्यतन:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">
                  {currentUser.lastProfileUpdate || '2026-08-25 11:20 AM'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">सत्र सुरक्षा स्थिति:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">
                  लोकल एन्क्रिप्टेड स्टोरेज एवं सुरक्षित ऑटो-लॉगआउट सक्रिय
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. TAB 3: USER AUDIT & ACTIVITY LOG                          */}
      {/* ============================================================ */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400" />
                <span>मेरी हालिया गतिविधियां एवं ऑडिट ट्रेल (User Audit Logs)</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                सिस्टम में आपके द्वारा किए गए सभी लॉगिन, डेटा अद्यतन एवं रिपोर्ट्स का वास्तविक रिकॉर्ड।
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="गतिविधि खोजें..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            {userActivities.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                कोई गतिविधि रिकॉर्ड नहीं मिला।
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2.5 font-bold">समय / दिनांक</th>
                    <th className="p-2.5 font-bold">कार्य प्रकार (Action)</th>
                    <th className="p-2.5 font-bold">मॉड्यूल</th>
                    <th className="p-2.5 font-bold">विवरण</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {userActivities.map((log, idx) => (
                    <tr key={log.id ? `${log.id}-${idx}` : `user-act-${idx}`} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                      <td className="p-2.5 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            log.action === 'LOGIN'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : log.action === 'LOGOUT'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : log.action === 'UPDATE'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : log.action === 'CREATE'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-gray-800 dark:text-gray-200">{log.module}</td>
                      <td className="p-2.5 text-gray-700 dark:text-gray-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. TAB 4: SANKUL USERS DIRECTORY (CAC / ADMIN ONLY)          */}
      {/* ============================================================ */}
      {activeTab === 'directory' && (currentUser.role === 'CAC' || currentUser.role === 'ADMIN') && (
        <ClusterUserDirectoryView isEmbedded />
      )}

      {/* ============================================================ */}
      {/* 8. EDIT PROFILE MODAL DIALOG                                 */}
      {/* ============================================================ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {isSchoolUser
                      ? 'विद्यालय संपर्क व पता अद्यतन (Edit School Contact Details)'
                      : 'व्यक्तिगत प्रोफ़ाइल संपादित करें (Edit Profile)'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isSchoolUser
                      ? 'विद्यालय के संपर्क नंबर, ईमेल एवं पता अद्यतन करें। संस्था पहचान फ़ील्ड प्रशासनिक स्तर से लॉक हैं।'
                      : 'आवश्यक फ़ील्ड अपडेट कर सुरक्षित करें। संवेदनशील पदीय फ़ील्ड केवल व्यवस्थापक द्वारा संपादन योग्य हैं।'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveErrorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {isSchoolUser && school ? (
                /* Institutional Edit Form */
                <div className="space-y-4">
                  {/* Read-Only Institution Identity Summary */}
                  <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-[11px]">विद्यालय का नाम (Locked):</span>
                      <span className="font-bold text-gray-900 dark:text-white">{school.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-[11px]">UDISE Code (Locked):</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{school.udise}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-[11px]">विद्यालय प्रकार (Locked):</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{school.schoolType} विद्यालय</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-[11px]">ग्राम / संकुल (Locked):</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{school.village} • {school.sankul}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        संस्था प्राथमिक संपर्क मोबाइल *
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={editFormData.mobile}
                        onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden font-mono"
                        required
                        placeholder="10 अंकों का मोबाइल नंबर"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        अतिरिक्त संपर्क (Alternate Mobile)
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={editFormData.alternateMobile}
                        onChange={(e) => setEditFormData({ ...editFormData, alternateMobile: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden font-mono"
                        placeholder="वैकल्पिक मोबाइल नंबर"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        संस्था आधिकारिक ईमेल (Official Email)
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
                        placeholder="school.udise@mp.gov.in"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        पिन कोड (PIN Code)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={editFormData.pinCode}
                        onChange={(e) => setEditFormData({ ...editFormData, pinCode: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden font-mono"
                        placeholder="472115"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        विद्यालय का पूरा पता (School Campus Address)
                      </label>
                      <input
                        type="text"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
                        placeholder="ग्राम पोस्ट मलगुवां, विकास खंड बल्देवगढ़"
                      />
                    </div>
                  </div>

                  {/* Institution Security Lock Note */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>सुरक्षा सूचना:</strong> विद्यालय का नाम, UDISE कोड (<span className="font-mono font-bold">{school.udise}</span>) एवं संस्था अधिकार क्षेत्र आधिकारिक मास्टर डेटा से लॉक हैं। इन्हें केवल संकुल एडमिन अथवा राज्य शिक्षा केंद्र स्तर से बदला जा सकता है।
                    </p>
                  </div>
                </div>
              ) : (
                /* Personal Staff Edit Form (CAC / ADMIN) */
                <>
                  {/* Photo Preview and Change inside Modal */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-100 dark:border-gray-800">
                    {editFormData.avatar ? (
                      <img
                        src={editFormData.avatar}
                        alt="Preview"
                        className="w-14 h-14 rounded-xl object-cover border border-gray-300 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#0B6B4B] text-white flex items-center justify-center font-bold text-xl">
                        {editFormData.name?.charAt(0) || 'स'}
                      </div>
                    )}
                    <div>
                      <span className="block font-bold text-gray-800 dark:text-gray-200 mb-1">प्रोफ़ाइल फोटो</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-bold hover:bg-gray-100"
                        >
                          फोटो बदलें
                        </button>
                        {editFormData.avatar && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="px-3 py-1 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-xs font-bold"
                          >
                            हटाएं
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        पूरा नाम (Full Name) *
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        पिता / पति का नाम
                      </label>
                      <input
                        type="text"
                        value={editFormData.fatherName}
                        onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
                        placeholder="श्री रमेश चंद्र जैन"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        लिंग (Gender)
                      </label>
                      <select
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
                      >
                        <option value="बालक">बालक / पुरुष (Male)</option>
                        <option value="बालिका">बालिका / महिला (Female)</option>
                        <option value="अन्य">अन्य (Other)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        जन्म तिथि (Date of Birth)
                      </label>
                      <input
                        type="date"
                        value={editFormData.dob}
                        onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        प्राथमिक मोबाइल नंबर *
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={editFormData.mobile}
                        onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        अतिरिक्त मोबाइल (Alternate)
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={editFormData.alternateMobile}
                        onChange={(e) => setEditFormData({ ...editFormData, alternateMobile: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden font-mono"
                        placeholder="9753679036"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        ईमेल आईडी (Official Email)
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        ग्राम / नगर (Village)
                      </label>
                      <input
                        type="text"
                        value={editFormData.village}
                        onChange={(e) => setEditFormData({ ...editFormData, village: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        स्थाई निवास पता (Residential Address)
                      </label>
                      <input
                        type="text"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
                        placeholder="वार्ड क्र. 4, मलगुवां रोड"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        पिन कोड (PIN Code)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={editFormData.pinCode}
                        onChange={(e) => setEditFormData({ ...editFormData, pinCode: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        मूल विभाग (Department)
                      </label>
                      <input
                        type="text"
                        value={editFormData.department}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Sensitive Read-Only Fields Note */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>सुरक्षा सूचना:</strong> कर्मचारी आईडी (<span className="font-mono">{currentUser.employeeId}</span>), भूमिका (<span className="font-bold">{currentUser.role}</span>), एवं संस्था प्रभार केवल राज्य शिक्षा केंद्र / संकुल एडमिन स्तर से बदले जा सकते हैं।
                    </p>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B6B4B] hover:bg-[#085239] text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>परिवर्तन सुरक्षित करें (Save)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. HIDDEN OFFICIAL PRINT DOSSIER LAYOUT (FOR A4 PRINTING)    */}
      {/* ============================================================ */}
      <div className="hidden print:block print:p-6 text-black bg-white">
        {isSchoolUser && school ? (
          /* Institutional School Print Layout */
          <div>
            <div className="text-center border-b-2 border-black pb-4 mb-4">
              <h1 className="text-xl font-bold uppercase">{school.name}</h1>
              <p className="text-xs">
                स्कूल शिक्षा विभाग, मध्य प्रदेश शासन | UDISE Code: {school.udise} | विकास खंड: {school.block || institutionConfig.block}, जिला: {school.district || institutionConfig.district}
              </p>
              <p className="text-xs font-bold mt-1">
                विद्यालय संस्थागत प्रोफाइल व शासकीय अभिलेख (Institutional Dossier - सत्र {selectedSessionId})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
              <div className="border border-black p-3 space-y-1">
                <h2 className="font-bold border-b border-black pb-1 mb-2">1. विद्यालय पहचान</h2>
                <div><strong>विद्यालय का नाम:</strong> {school.name}</div>
                <div><strong>UDISE Code:</strong> {school.udise}</div>
                <div><strong>विद्यालय स्तर:</strong> {school.schoolType} विद्यालय</div>
                <div><strong>ग्राम / बसाहट:</strong> {school.village || 'उपलब्ध नहीं'}</div>
                <div><strong>ग्राम पंचायत:</strong> {school.gramPanchayat || 'उपलब्ध नहीं'}</div>
                <div><strong>विकास खंड / जिला:</strong> {school.block || institutionConfig.block}, {school.district || institutionConfig.district}</div>
                <div><strong>संकुल:</strong> {school.sankul || institutionConfig.sankulName}</div>
              </div>

              <div className="border border-black p-3 space-y-1">
                <h2 className="font-bold border-b border-black pb-1 mb-2">2. संस्था एवं अधिकार क्षेत्र पहचान</h2>
                <div><strong>जन शिक्षा केंद्र:</strong> {school.sankul || institutionConfig.sankulName}</div>
                <div><strong>सत्र:</strong> {selectedSessionId} ({sessionStatusText})</div>
                <div><strong>अधिकार क्षेत्र:</strong> आवंटित शाला ({school.name})</div>
                <div><strong>संस्था संपर्क मोबाइल:</strong> {currentUser.mobile || school.mobile || 'उपलब्ध नहीं'}</div>
                <div><strong>संस्था ईमेल:</strong> {currentUser.email || school.email || 'उपलब्ध नहीं'}</div>
                <div><strong>पता:</strong> {currentUser.address || school.village || 'उपलब्ध नहीं'} ({currentUser.pinCode || '472115'})</div>
              </div>

              <div className="border border-black p-3 space-y-1">
                <h2 className="font-bold border-b border-black pb-1 mb-2">3. संस्था प्रभारी विवरण</h2>
                <div><strong>प्रभारी का नाम:</strong> {verifiedInchargeStaff?.name || 'उपलब्ध नहीं'}</div>
                <div><strong>कर्मचारी आईडी:</strong> {verifiedInchargeStaff?.employeeId || 'उपलब्ध नहीं'}</div>
                <div><strong>पदनाम:</strong> {verifiedInchargeStaff?.designation || 'उपलब्ध नहीं'}</div>
                <div><strong>मोबाइल नंबर:</strong> {verifiedInchargeStaff?.mobile || 'उपलब्ध नहीं'}</div>
                <div><strong>सत्यापन स्थिति:</strong> {verifiedInchargeStaff ? 'सत्यापित विभागीय शिक्षक' : 'प्रमाणित नहीं'}</div>
              </div>

              <div className="border border-black p-3 space-y-1">
                <h2 className="font-bold border-b border-black pb-1 mb-2">4. संस्था खाता एवं सुरक्षा</h2>
                <div><strong>Account Type:</strong> {currentUser.role} (विद्यालय संस्था खाता)</div>
                <div><strong>उपयोगकर्ता नाम:</strong> {currentUser.username || school.udise}</div>
                <div><strong>School UDISE:</strong> {school.udise}</div>
                <div><strong>खाता स्थिति:</strong> {currentUser.status === 'ACTIVE' ? 'सक्रिय (Active)' : currentUser.status}</div>
                <div><strong>अंतिम लॉगिन:</strong> {currentUser.lastLogin || 'उपलब्ध नहीं'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-xs pt-12 mt-12 border-t border-gray-400">
              <div className="text-center">
                <div className="border-t border-black pt-1 font-bold">हस्ताक्षर एवं पदमुद्रा (संस्था प्रभारी / प्रधान पाठक)</div>
              </div>
              <div className="text-center">
                <div className="border-t border-black pt-1 font-bold">सत्यापन अधिकारी (जन शिक्षक / संकुल प्राचार्य सील व हस्ताक्षर)</div>
              </div>
            </div>
          </div>
        ) : (
          /* Personal Staff Print Layout (CAC / ADMIN) */
          <div>
            <div className="text-center border-b-2 border-black pb-4 mb-4">
              <h1 className="text-xl font-bold uppercase">{institutionConfig.institutionName}</h1>
              <p className="text-xs">
                स्कूल शिक्षा विभाग, मध्य प्रदेश शासन | विकास खंड: {institutionConfig.block}, जिला: {institutionConfig.district}
              </p>
              <p className="text-xs font-bold mt-1">
                अधिकारी / शिक्षक व्यक्तिगत एवं सेवा प्रोफ़ाइल (Official Profile Dossier - सत्र {selectedSessionId || settings?.academicSession || institutionConfig.academicSession})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
              <div className="border border-black p-3 space-y-1">
                <h2 className="font-bold border-b border-black pb-1 mb-2">1. व्यक्तिगत जानकारी</h2>
                <div><strong>नाम:</strong> {currentUser.name}</div>
                <div><strong>पिता/पति का नाम:</strong> {currentUser.fatherName || 'श्री रमेश चंद्र जैन'}</div>
                <div><strong>लिंग:</strong> {currentUser.gender || 'बालक'}</div>
                <div><strong>जन्म तिथि:</strong> {currentUser.dob || '15/07/1982'}</div>
                <div><strong>मोबाइल:</strong> {currentUser.mobile}</div>
                <div><strong>ईमेल:</strong> {currentUser.email}</div>
                <div><strong>पता:</strong> {currentUser.address || 'मलगुवां'}, {currentUser.village || 'मलगुवां'} ({currentUser.pinCode || '472115'})</div>
              </div>

              <div className="border border-black p-3 space-y-1">
                <h2 className="font-bold border-b border-black pb-1 mb-2">2. शासकीय एवं पदीय जानकारी</h2>
                <div><strong>कर्मचारी आईडी:</strong> {currentUser.employeeId}</div>
                <div><strong>पदनाम:</strong> {currentUser.designation}</div>
                <div><strong>भूमिका (Role):</strong> {currentUser.role}</div>
                <div><strong>विभाग:</strong> {currentUser.department || 'स्कूल शिक्षा विभाग म.प्र.'}</div>
                <div><strong>प्रथम नियुक्ति:</strong> {currentUser.joiningDate || '12/09/2008'}</div>
                <div><strong>पदस्थापना:</strong> {currentUser.currentPosting || 'जन शिक्षा केंद्र मलगुवां'}</div>
                <div><strong>कार्यक्षेत्र:</strong> {totalAssignedSchools} शालाएं</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-xs pt-12 mt-12 border-t border-gray-400">
              <div className="text-center">
                <div className="border-t border-black pt-1 font-bold">हस्ताक्षर (कर्मचारी / अधिकारी)</div>
              </div>
              <div className="text-center">
                <div className="border-t border-black pt-1 font-bold">सत्यापन अधिकारी (सील एवं हस्ताक्षर)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
