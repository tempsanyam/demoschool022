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
import { institutionConfig } from '../../config/institutionConfig';
import { UserRole, Gender } from '../../types';
import { jsPDF } from 'jspdf';

export const ProfileView: React.FC = () => {
  const { currentUser, registeredUsers, updateCurrentUser, updatePassword, quickSwitchUser } = useAuth();
  const { schools, auditLogs, logActivity, settings } = useData();

  // Active sub-tab inside Profile
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'activity' | 'directory'>('overview');

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
  const assignedSchoolObj = schools.find((s) => s.udise === currentUser?.assignedSchoolUdise);
  const totalAssignedSchools =
    currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERATOR'
      ? schools.length
      : 1;

  // Open Edit Modal with fresh currentUser values
  const handleOpenEditModal = () => {
    if (!currentUser) return;
    setEditFormData({
      name: currentUser.name || '',
      fatherName: currentUser.fatherName || '',
      gender: currentUser.gender || 'बालक',
      dob: currentUser.dob || '',
      mobile: currentUser.mobile || '',
      alternateMobile: currentUser.alternateMobile || '',
      email: currentUser.email || '',
      address: currentUser.address || '',
      village: currentUser.village || '',
      pinCode: currentUser.pinCode || '472115',
      department: currentUser.department || 'स्कूल शिक्षा विभाग म.प्र.',
      subject: currentUser.subject || '',
      avatar: currentUser.avatar || '',
    });
    setSaveErrorMsg('');
    setIsEditModalOpen(true);
  };

  // Handle Photo Upload (Base64)
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
      // If directly uploading without full modal, also save to user
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
  const handlePasswordSubmit = (e: React.FormEvent) => {
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

    const res = updatePassword(passData.currentPass, passData.newPass);
    if (res.success) {
      logActivity('UPDATE', 'Auth', `${currentUser?.name} द्वारा खाता सुरक्षा पासवर्ड बदला गया।`);
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

  // Generate and Download PDF
  const handleDownloadPDF = () => {
    if (!currentUser) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const margin = 14;
      let y = 18;

      // Header Banner
      doc.setFillColor(11, 107, 75); // #0B6B4B
      doc.rect(margin, y - 6, 182, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(institutionConfig.institutionName, margin + 4, y + 2);
      doc.setFontSize(9);
      doc.text(
        `स्कूल शिक्षा विभाग म.प्र. | विकास खंड: ${institutionConfig.block}, जिला: ${institutionConfig.district} | सत्र ${institutionConfig.academicSession}`,
        margin + 4,
        y + 9
      );

      y += 28;
      doc.setTextColor(23, 33, 28);
      doc.setFontSize(13);
      doc.text('अधिकारी / कर्मचारी विस्तृत प्रोफ़ाइल विवरण (Official Profile Dossier)', margin, y);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`जारी दिनांक: ${new Date().toLocaleDateString('hi-IN')} | समय: ${new Date().toLocaleTimeString('hi-IN')}`, 130, y);

      y += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, margin + 182, y);
      y += 6;

      // 1. Personal Details Box
      doc.setFontSize(11);
      doc.setTextColor(11, 107, 75);
      doc.text('1. व्यक्तिगत एवं संपर्क जानकारी (Personal Details)', margin, y);
      y += 6;

      const personalFields = [
        ['पूरा नाम (Full Name)', currentUser.name || '-'],
        ['पिता / पति का नाम', currentUser.fatherName || 'श्री रमेश चंद्र जैन'],
        ['लिंग (Gender)', currentUser.gender || 'बालक'],
        ['जन्म तिथि (DOB)', currentUser.dob || '15/07/1982'],
        ['प्राथमिक मोबाइल', currentUser.mobile || '-'],
        ['अतिरिक्त संपर्क', currentUser.alternateMobile || '-'],
        ['ईमेल आईडी', currentUser.email || '-'],
        ['स्थाई निवास पता', currentUser.address || 'मलगुवां रोड'],
        ['ग्राम / नगर', currentUser.village || 'मलगुवां'],
        ['पिन कोड', currentUser.pinCode || '472115'],
      ];

      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      personalFields.forEach(([lbl, val], idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const posX = margin + col * 92;
        const posY = y + row * 6;
        doc.text(`${lbl}: ${val}`, posX, posY);
      });

      y += Math.ceil(personalFields.length / 2) * 6 + 8;
      doc.line(margin, y, margin + 182, y);
      y += 6;

      // 2. Official / Employment Details Box
      doc.setFontSize(11);
      doc.setTextColor(11, 107, 75);
      doc.text('2. सेवा एवं पदीय जानकारी (Official & Service Information)', margin, y);
      y += 6;

      const officialFields = [
        ['यूनिक कर्मचारी आईडी', currentUser.employeeId || '-'],
        ['पदनाम (Designation)', currentUser.designation || '-'],
        ['प्रशासनिक भूमिका (Role)', currentUser.role || '-'],
        ['मूल विभाग', currentUser.department || 'स्कूल शिक्षा विभाग म.प्र.'],
        ['प्रथम नियुक्ति दिनांक', currentUser.joiningDate || '12/09/2008'],
        ['वर्तमान पदस्थापना', currentUser.currentPosting || 'जन शिक्षा केंद्र मलगुवां'],
        ['संकुल केंद्र', institutionConfig.institutionName],
        ['विकास खंड', institutionConfig.block],
        ['जिला', institutionConfig.district],
        ['कार्यक्षेत्र / शालाएं', `${totalAssignedSchools} शालाएं`],
        ['खाता स्थिति', currentUser.status === 'ACTIVE' ? 'सक्रिय (Active & Verified)' : currentUser.status],
        ['अंतिम प्रोफ़ाइल अद्यतन', currentUser.lastProfileUpdate || '-'],
      ];

      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      officialFields.forEach(([lbl, val], idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const posX = margin + col * 92;
        const posY = y + row * 6;
        doc.text(`${lbl}: ${val}`, posX, posY);
      });

      y += Math.ceil(officialFields.length / 2) * 6 + 18;

      // Signatures
      doc.setDrawColor(150, 150, 150);
      doc.line(margin, y, margin + 50, y);
      doc.text('कर्मचारी / अधिकारी के हस्ताक्षर', margin, y + 5);

      doc.line(margin + 130, y, margin + 180, y);
      doc.text('सत्यापन अधिकारी (सील व हस्ताक्षर)', margin + 130, y + 5);

      doc.save(`Profile_${currentUser.employeeId || currentUser.username}_${Date.now()}.pdf`);
      logActivity('EXPORT', 'Profile', `${currentUser.name} की प्रोफ़ाइल PDF डाउनलोड की गई।`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      window.print();
    }
  };

  // Filter User Activities
  const userActivities = auditLogs
    .filter(
      (log) =>
        log.userId === currentUser?.id ||
        log.userName?.toLowerCase() === currentUser?.name.toLowerCase() ||
        log.module === 'Auth' ||
        log.module === 'Profile'
    )
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

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Hidden Native File Input for Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

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
              {/* Profile Avatar with Photo Upload Trigger */}
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

                {/* Photo Change Button Overlay */}
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

              {/* Identity Header Text */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {currentUser.name}
                  </h1>
                  <span className="bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    <span>{currentUser.role === 'CAC' ? 'जन शिक्षक (CAC)' : currentUser.role === 'PRINCIPAL' ? 'प्रधानाध्यापक' : currentUser.role === 'TEACHER' ? 'शिक्षक' : 'डेटा ऑपरेटर'}</span>
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
              </div>
            </div>

            {/* Quick Header Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenEditModal}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#0B6B4B] font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>प्रोफ़ाइल संपादित करें</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <Key className="w-4 h-4 text-amber-300" />
                <span>पासवर्ड</span>
              </button>

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
            </div>
          </div>
        </div>

        {/* Quick Testing Bar (Role Switcher for Testing/Demonstration) */}
        <div className="p-3 bg-gray-50 dark:bg-[#0F1713] border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-semibold">
            <RefreshCw className="w-3.5 h-3.5 text-[#0B6B4B] dark:text-emerald-400 shrink-0" />
            <span>त्वरित भूमिका स्विच (Role Test):</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => quickSwitchUser('cac')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                currentUser.role === 'CAC'
                  ? 'bg-[#0B6B4B] text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              जन शिक्षक (CAC)
            </button>
            <button
              onClick={() => quickSwitchUser('principal')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                currentUser.role === 'PRINCIPAL'
                  ? 'bg-[#0B6B4B] text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              प्रधान पाठक
            </button>
            <button
              onClick={() => quickSwitchUser('teacher')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                currentUser.role === 'TEACHER'
                  ? 'bg-[#0B6B4B] text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              शिक्षक
            </button>
            <button
              onClick={() => quickSwitchUser('operator')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                currentUser.role === 'OPERATOR'
                  ? 'bg-[#0B6B4B] text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              डेटा ऑपरेटर
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SANKUL & INSTITUTIONAL JURISDICTION IDENTITY CARD         */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <SchoolIcon className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400" />
          <span>संस्था एवं अधिकार क्षेत्र पहचान (Institutional & Sankul Identity)</span>
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
            <span className="font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
              {settings?.academicSession || institutionConfig.academicSession}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-[#0F1713] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400 block text-[11px]">अधिकार क्षेत्र (Scope)</span>
            <span className="font-bold text-purple-700 dark:text-purple-400 block mt-0.5">
              {totalAssignedSchools > 1 ? `समस्त ${totalAssignedSchools} शालाएं` : 'आवंटित शाला'}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-[#0F1713] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400 block text-[11px]">सत्र स्थिति</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>सक्रिय सत्र</span>
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
          <User className="w-4 h-4" />
          <span>प्रोफ़ाइल एवं सेवा विवरण</span>
        </button>

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

        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'border-[#0B6B4B] text-[#0B6B4B] dark:text-emerald-400 dark:border-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>मेरी गतिविधियां व ऑडिट लॉग ({userActivities.length})</span>
        </button>

        {(currentUser.role === 'CAC' || currentUser.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'border-[#0B6B4B] text-[#0B6B4B] dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>संकुल उपयोगकर्ता डायरेक्टरी ({registeredUsers.length})</span>
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. TAB 1: OVERVIEW (PERSONAL & OFFICIAL SERVICE DOSSIER)     */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal Information Card */}
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400" />
                <span>व्यक्तिगत जानकारी (Personal Information)</span>
              </h3>
              <button
                onClick={handleOpenEditModal}
                className="text-xs font-bold text-[#0B6B4B] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>संपादित करें</span>
              </button>
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
                  <span>सक्रिय एवं सत्यापित (Active)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
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
                  {userActivities.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
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
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400" />
                <span>संकुल पंजीकृत उपयोगकर्ता डायरेक्टरी (User Directory - {registeredUsers.length})</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                संकुल मलगुवां के सभी अधिकृत जन शिक्षक, प्रधान पाठक, शिक्षक एवं ऑपरेटर।
              </p>
            </div>
            <span className="text-[11px] bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full">
              कुल {registeredUsers.length} उपयोगकर्ता
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-2.5 font-bold">क्र.</th>
                  <th className="p-2.5 font-bold">उपयोगकर्ता</th>
                  <th className="p-2.5 font-bold">कर्मचारी आईडी</th>
                  <th className="p-2.5 font-bold">भूमिका (Role)</th>
                  <th className="p-2.5 font-bold">पदनाम / शाला</th>
                  <th className="p-2.5 font-bold">मोबाइल</th>
                  <th className="p-2.5 font-bold">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {registeredUsers.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                    <td className="p-2.5 text-gray-400">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#0B6B4B] text-white flex items-center justify-center font-bold text-[10px]">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        <div className="font-mono text-[10px] text-blue-600 font-normal">@{u.username}</div>
                      </div>
                    </td>
                    <td className="p-2.5 font-mono text-gray-600 dark:text-gray-400">{u.employeeId}</td>
                    <td className="p-2.5">
                      <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2.5 text-gray-700 dark:text-gray-300">
                      <div>{u.designation}</div>
                      <div className="text-[10px] text-gray-400">
                        {u.assignedSchoolUdise || 'समस्त 37 विद्यालय (क्लस्टर)'}
                      </div>
                    </td>
                    <td className="p-2.5 font-mono text-gray-600 dark:text-gray-400">{u.mobile}</td>
                    <td className="p-2.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>सक्रिय</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                    व्यक्तिगत प्रोफ़ाइल संपादित करें (Edit Profile)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    आवश्यक फ़ील्ड अपडेट कर सुरक्षित करें। संवेदनशील पदीय फ़ील्ड केवल व्यवस्थापक द्वारा संपादन योग्य हैं।
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
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase">{institutionConfig.institutionName}</h1>
          <p className="text-xs">
            स्कूल शिक्षा विभाग, मध्य प्रदेश शासन | विकास खंड: {institutionConfig.block}, जिला: {institutionConfig.district}
          </p>
          <p className="text-xs font-bold mt-1">
            अधिकारी / शिक्षक व्यक्तिगत एवं सेवा प्रोफ़ाइल (Official Profile Dossier - सत्र {institutionConfig.academicSession})
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
    </div>
  );
};
