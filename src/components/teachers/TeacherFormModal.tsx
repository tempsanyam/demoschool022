import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Briefcase,
  ShieldCheck,
  Building2,
  Phone,
  Calendar,
  Award,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';
import { Staff, School as SchoolType } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Staff | null;
  isEdit?: boolean;
  onChangeCategory?: () => void;
  schools: SchoolType[];
  currentSchoolUdise?: string;
  isSchoolRestricted?: boolean;
  selectedSessionId: string;
  onSave: (data: Staff) => void;
  existingStaff: Staff[];
}

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  isEdit = false,
  onChangeCategory,
  schools,
  currentSchoolUdise,
  isSchoolRestricted = false,
  selectedSessionId,
  onSave,
  existingStaff
}) => {
  const defaultUdise = currentSchoolUdise || schools[0]?.udise || '';

  const getFreshTeacherState = (): Partial<Staff> => {
    const genId = `EMP-TCH-${Math.floor(100 + Math.random() * 900)}`;
    const genUid = `UID-MP-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      employeeId: genId,
      employeeCode: genId,
      uniqueId: genUid,
      name: '',
      gender: 'MALE',
      designation: 'माध्यमिक शिक्षक',
      teacherType: 'वर्ग 2',
      subject: 'गणित',
      qualification: 'B.Sc., B.Ed.',
      mobile: '',
      email: '',
      caste: '',
      aadhaarNumber: '',
      voterIdNumber: '',
      joiningDate: '2016-07-15',
      postingDate: new Date().toISOString().split('T')[0],
      isBlo: false,
      isCensus: false,
      isOd: false,
      employmentType: 'REGULAR',
      assignedSchoolUdise: defaultUdise,
      status: 'ACTIVE',
      dob: '1988-06-15',
      category: 'OBC',
    };
  };

  const [formData, setFormData] = useState<Partial<Staff>>(getFreshTeacherState);
  const [formError, setFormError] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showCategoryChangeConfirm, setShowCategoryChangeConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData && isEdit) {
        setFormData({
          ...initialData,
          employeeCode: initialData.employeeCode || initialData.employeeId,
          employeeId: initialData.employeeId || initialData.employeeCode,
          uniqueId: initialData.uniqueId || '',
          caste: initialData.caste || '',
          aadhaarNumber: initialData.aadhaarNumber || '',
          voterIdNumber: initialData.voterIdNumber || '',
          teacherType: initialData.teacherType || 'वर्ग 2',
          postingDate: initialData.postingDate || initialData.joiningDate || new Date().toISOString().split('T')[0],
          isBlo: !!initialData.isBlo,
          isCensus: !!initialData.isCensus,
          isOd: !!initialData.isOd,
        });
        setIsDirty(false);
      } else {
        setFormData(getFreshTeacherState());
        setIsDirty(false);
      }
      setFormError('');
    }
  }, [isOpen, initialData, isEdit, defaultUdise]);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof Staff, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleChangeCategoryClick = () => {
    if (isDirty && (formData.name?.trim() || formData.mobile?.trim())) {
      setShowCategoryChangeConfirm(true);
    } else if (onChangeCategory) {
      onChangeCategory();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const code = (formData.employeeId || formData.employeeCode || '').trim();
    const name = (formData.name || '').trim();
    const effectiveUdise = isSchoolRestricted
      ? (currentSchoolUdise || formData.assignedSchoolUdise || '')
      : (formData.assignedSchoolUdise || '');

    if (!name) {
      setFormError('कृपया शिक्षक का नाम दर्ज करें।');
      return;
    }
    if (!code) {
      setFormError('कृपया कर्मचारी कोड (Employee Code / ID) दर्ज करें।');
      return;
    }
    if (!effectiveUdise) {
      setFormError('कृपया पदस्थ विद्यालय का चयन करें।');
      return;
    }

    // Aadhaar number validation (12 digits, optional)
    const rawAadhaar = (formData.aadhaarNumber || '').trim().replace(/\s+/g, '');
    if (rawAadhaar && !/^\d{12}$/.test(rawAadhaar)) {
      setFormError('आधार नंबर अनिवार्य नहीं है, किंतु यदि दर्ज किया गया है तो वह पूरे 12 अंकों का होना चाहिए।');
      return;
    }

    // Mobile validation (10 digits)
    const rawMobile = (formData.mobile || '').trim();
    if (rawMobile && !/^\d{10}$/.test(rawMobile)) {
      setFormError('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
      return;
    }

    // Duplicate Employee code check
    const isDuplicate = existingStaff.some(
      (s) =>
        (s.employeeId?.toUpperCase() === code.toUpperCase() ||
          s.employeeCode?.toUpperCase() === code.toUpperCase()) &&
        (!initialData || s.id !== initialData.id)
    );

    if (isDuplicate) {
      setFormError(`कर्मचारी कोड (${code}) पूर्व से ही पंजीकृत है। कृपया दूसरा कोड दर्ज करें।`);
      return;
    }

    const payload: Staff = {
      ...(formData as Staff),
      id: initialData?.id || `stf-${Date.now()}`,
      employeeId: code.toUpperCase(),
      employeeCode: code.toUpperCase(),
      uniqueId: formData.uniqueId?.trim() || undefined,
      name,
      mobile: rawMobile,
      subject: (formData.subject || 'सामान्य').trim(),
      designation: formData.designation || 'माध्यमिक शिक्षक',
      teacherType: formData.teacherType || 'वर्ग 2',
      caste: formData.caste?.trim() || undefined,
      aadhaarNumber: rawAadhaar || undefined,
      voterIdNumber: formData.voterIdNumber?.trim() || undefined,
      assignedSchoolUdise: effectiveUdise,
      status: formData.status || 'ACTIVE',
      employmentType: formData.employmentType || 'REGULAR',
      gender: formData.gender || 'MALE',
      qualification: (formData.qualification || '').trim(),
      dob: formData.dob || '1988-06-15',
      category: formData.category || 'OBC',
      joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
      postingDate: formData.postingDate || formData.joiningDate || new Date().toISOString().split('T')[0],
      isBlo: !!formData.isBlo,
      isCensus: !!formData.isCensus,
      isOd: !!formData.isOd,
    };

    onSave(payload);
  };

  return (
    <div
      id="teacher-form-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print animate-in fade-in duration-150"
    >
      <div
        id="teacher-form-modal"
        className="bg-white dark:bg-[#17211C] rounded-2xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] max-h-[92vh] overflow-y-auto"
      >
        {/* Header with Clear Category Badge and Change Category Button */}
        <div className="pb-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isEdit ? 'शिक्षक विवरण संशोधित करें' : 'नया शिक्षक जोड़ें'}
                </h3>
                <span
                  id="teacher-category-badge"
                  className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-xs font-bold rounded-full border border-purple-200 dark:border-purple-800"
                >
                  श्रेणी: शिक्षक
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono font-medium">
                  शैक्षणिक सत्र: {selectedSessionId}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                प्रधानाध्यापक, नियमित, संविदा अथवा अतिथि शिक्षक की शासकीय पदस्थापना जानकारी
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {!isEdit && onChangeCategory && (
              <button
                id="btn-teacher-change-category"
                type="button"
                onClick={handleChangeCategoryClick}
                className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1"
                title="श्रेणी चयन पर वापस जाएं"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← श्रेणी बदलें</span>
              </button>
            )}
            <button
              id="btn-close-teacher-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {formError && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6 text-xs">
          {/* Section 1: व्यक्तिगत विवरण */}
          <div className="bg-gray-50/70 dark:bg-[#0F1713]/70 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <User className="w-4 h-4 text-[#0B6B4B]" />
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">१. शिक्षक व्यक्तिगत विवरण (Personal Details)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  शिक्षक का नाम (Teacher Name) *
                </label>
                <input
                  id="teacher-input-name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="शिक्षक का पूरा नाम दर्ज करें"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0B6B4B]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मोबाइल नंबर (Mobile) *
                </label>
                <input
                  id="teacher-input-mobile"
                  type="tel"
                  maxLength={10}
                  value={formData.mobile || ''}
                  onChange={(e) => handleFieldChange('mobile', e.target.value.replace(/\D/g, ''))}
                  placeholder="98260XXXXX"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  आधार नंबर (Aadhaar Number) <span className="text-gray-400 font-normal">(वैकल्पिक, 12 अंक)</span>
                </label>
                <input
                  id="teacher-input-aadhaar"
                  type="text"
                  maxLength={12}
                  value={formData.aadhaarNumber || ''}
                  onChange={(e) => handleFieldChange('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                  placeholder="12 अंकों का आधार नंबर"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मतदाता परिचय पत्र (Voter ID / EPIC) <span className="text-gray-400 font-normal">(वैकल्पिक)</span>
                </label>
                <input
                  id="teacher-input-voter-id"
                  type="text"
                  value={formData.voterIdNumber || ''}
                  onChange={(e) => handleFieldChange('voterIdNumber', e.target.value.toUpperCase())}
                  placeholder="उदा. MPTK1234567"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  सामाजिक संवर्ग (Social Category)
                </label>
                <select
                  id="teacher-select-category"
                  value={formData.category || 'OBC'}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="GENERAL">General (सामान्य)</option>
                  <option value="OBC">OBC (अन्य पिछड़ा वर्ग)</option>
                  <option value="SC">SC (अनुसूचित जाति)</option>
                  <option value="ST">ST (अनुसूचित जनजाति)</option>
                  <option value="EWS">EWS (आर्थिक रूप से कमजोर)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  जाति (Caste) <span className="text-gray-400 font-normal">(वैकल्पिक)</span>
                </label>
                <input
                  id="teacher-input-caste"
                  type="text"
                  value={formData.caste || ''}
                  onChange={(e) => handleFieldChange('caste', e.target.value)}
                  placeholder="उदा. सोनी, पटेल, अहिरवार"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  लिंग (Gender)
                </label>
                <select
                  id="teacher-select-gender"
                  value={formData.gender || 'MALE'}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="MALE">पुरुष (Male)</option>
                  <option value="FEMALE">महिला (Female)</option>
                  <option value="OTHER">अन्य (Other)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  जन्म दिनांक (Date of Birth)
                </label>
                <input
                  id="teacher-input-dob"
                  type="date"
                  value={formData.dob || '1988-06-15'}
                  onChange={(e) => handleFieldChange('dob', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: पदस्थापना एवं सेवा विवरण */}
          <div className="bg-gray-50/70 dark:bg-[#0F1713]/70 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <Briefcase className="w-4 h-4 text-[#0B6B4B]" />
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">२. पदस्थापना एवं सेवा विवरण (Posting & Service Details)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  कर्मचारी कोड (Employee Code / ID) *
                </label>
                <input
                  id="teacher-input-emp-code"
                  type="text"
                  value={formData.employeeId || formData.employeeCode || ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setFormData((prev) => ({ ...prev, employeeId: val, employeeCode: val }));
                    setIsDirty(true);
                  }}
                  placeholder="उदा. EMP-TCH-301"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono focus:ring-2 focus:ring-[#0B6B4B]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  स्थायी यूनिक आईडी (Unique ID) <span className="text-gray-400 font-normal">(वैकल्पिक)</span>
                </label>
                <input
                  id="teacher-input-unique-id"
                  type="text"
                  value={formData.uniqueId || ''}
                  onChange={(e) => handleFieldChange('uniqueId', e.target.value.toUpperCase())}
                  placeholder="उदा. UNQ-MP-4512"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  शिक्षक प्रकार (Teacher Type) *
                </label>
                <select
                  id="teacher-select-teacher-type"
                  value={formData.teacherType || 'वर्ग 2'}
                  onChange={(e) => handleFieldChange('teacherType', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold"
                >
                  <option value="वर्ग 1">वर्ग 1 (उच्च माध्यमिक शिक्षक)</option>
                  <option value="वर्ग 2">वर्ग 2 (माध्यमिक शिक्षक)</option>
                  <option value="वर्ग 3">वर्ग 3 (प्राथमिक शिक्षक)</option>
                  <option value="अन्य">अन्य (Other / Special)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  वर्तमान पद / पदस्थापना (Designation) *
                </label>
                <select
                  id="teacher-select-designation"
                  value={formData.designation}
                  onChange={(e) => handleFieldChange('designation', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                >
                  <option value="माध्यमिक शिक्षक">माध्यमिक शिक्षक (Middle Teacher)</option>
                  <option value="प्राथमिक शिक्षक">प्राथमिक शिक्षक (Primary Teacher)</option>
                  <option value="उच्च माध्यमिक शिक्षक">उच्च माध्यमिक शिक्षक (HS Lecturer)</option>
                  <option value="उच्च श्रेणी शिक्षक">उच्च श्रेणी शिक्षक (UDT)</option>
                  <option value="प्रधानाध्यापक">प्रधानाध्यापक (Headmaster)</option>
                  <option value="प्राचार्य">प्राचार्य (Principal)</option>
                  <option value="अतिथि शिक्षक">अतिथि शिक्षक (Guest Teacher)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मुख्य विषय (Subject)
                </label>
                <input
                  id="teacher-input-subject"
                  type="text"
                  value={formData.subject || ''}
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  placeholder="उदा. गणित, विज्ञान, सामाजिक विज्ञान, हिंदी"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  वर्तमान पदस्थापना दिनांक (Posting Date)
                </label>
                <input
                  id="teacher-input-posting-date"
                  type="date"
                  value={formData.postingDate || formData.joiningDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleFieldChange('postingDate', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  वर्तमान पदस्थ विद्यालय (Posting School) & UDISE Code *
                </label>
                {isSchoolRestricted ? (
                  <div
                    id="teacher-locked-school-display"
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-bold flex items-center justify-between"
                  >
                    <span className="truncate">
                      {schools.find((s) => s.udise === currentSchoolUdise)?.hindiName ||
                        schools.find((s) => s.udise === currentSchoolUdise)?.name ||
                        currentSchoolUdise}
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                      UDISE: {currentSchoolUdise} (School Locked)
                    </span>
                  </div>
                ) : (
                  <select
                    id="teacher-select-school"
                    value={formData.assignedSchoolUdise}
                    onChange={(e) => handleFieldChange('assignedSchoolUdise', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                  >
                    {schools.map((s) => (
                      <option key={s.udise} value={s.udise}>
                        {s.hindiName || s.name} (UDISE: {s.udise})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मूल नियुक्ति तिथि (Initial Joining Date)
                </label>
                <input
                  id="teacher-input-joining-date"
                  type="date"
                  value={formData.joiningDate || '2016-07-15'}
                  onChange={(e) => handleFieldChange('joiningDate', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  शैक्षणिक योग्यता (Qualification)
                </label>
                <input
                  id="teacher-input-qualification"
                  type="text"
                  value={formData.qualification || ''}
                  onChange={(e) => handleFieldChange('qualification', e.target.value)}
                  placeholder="उदा. M.Sc., B.Ed."
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  रोजगार / सेवा प्रकार (Employment Type)
                </label>
                <select
                  id="teacher-select-employment-type"
                  value={formData.employmentType || 'REGULAR'}
                  onChange={(e) => handleFieldChange('employmentType', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="REGULAR">नियमित (Regular)</option>
                  <option value="GUEST">अतिथि शिक्षक (Guest Teacher)</option>
                  <option value="CONTRACT">संविदा (Contract)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  सेवा स्थिति (Service Status)
                </label>
                <select
                  id="teacher-select-status"
                  value={formData.status || 'ACTIVE'}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                >
                  <option value="ACTIVE">सक्रिय (Active)</option>
                  <option value="ON_LEAVE">अवकाश पर (On Leave)</option>
                  <option value="TRANSFERRED">स्थानांतरित (Transferred)</option>
                  <option value="INACTIVE">निष्क्रिय (Inactive)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: शासकीय दायित्व (BLO, Census, OD) */}
          <div className="bg-gray-50/70 dark:bg-[#0F1713]/70 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <ShieldCheck className="w-4 h-4 text-[#0B6B4B]" />
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">३. अन्य शासकीय दायित्व (Additional Government Duties)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formData.isBlo
                    ? 'bg-blue-50 border-blue-400 dark:bg-blue-950/60 dark:border-blue-600 text-blue-900 dark:text-blue-200 shadow-2xs'
                    : 'bg-white dark:bg-[#17211C] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  id="teacher-checkbox-blo"
                  type="checkbox"
                  checked={!!formData.isBlo}
                  onChange={(e) => handleFieldChange('isBlo', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold">बी.एल.ओ. (BLO)</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">बूथ लेवल अधिकारी कर्तव्य</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formData.isCensus
                    ? 'bg-indigo-50 border-indigo-400 dark:bg-indigo-950/60 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                    : 'bg-white dark:bg-[#17211C] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  id="teacher-checkbox-census"
                  type="checkbox"
                  checked={!!formData.isCensus}
                  onChange={(e) => handleFieldChange('isCensus', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold">जनगणना (Census)</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">जनगणना सर्वेक्षण कार्य</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  formData.isOd
                    ? 'bg-amber-50 border-amber-400 dark:bg-amber-950/60 dark:border-amber-600 text-amber-900 dark:text-amber-200 shadow-2xs'
                    : 'bg-white dark:bg-[#17211C] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  id="teacher-checkbox-od"
                  type="checkbox"
                  checked={!!formData.isOd}
                  onChange={(e) => handleFieldChange('isOd', e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold">OD (Other Duty)</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">अन्य शासकीय कार्य/ड्यूटी</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              id="btn-teacher-cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-300 dark:border-gray-700"
            >
              रद्द करें
            </button>
            <button
              id="btn-teacher-submit"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              {isEdit ? 'परिवर्तन सुरक्षित करें' : 'नया शिक्षक पंजीकृत करें'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation when switching category with entered data */}
      <ConfirmDialog
        isOpen={showCategoryChangeConfirm}
        title="श्रेणी बदलने की पुष्टि"
        message="आप श्रेणी बदल रहे हैं। वर्तमान फॉर्म में भरी जानकारी इस श्रेणी के लिए लागू नहीं हो सकती। क्या आप श्रेणी बदलना चाहते हैं?"
        confirmText="श्रेणी बदलें"
        cancelText="रद्द करें"
        onConfirm={() => {
          setShowCategoryChangeConfirm(false);
          if (onChangeCategory) onChangeCategory();
        }}
        onCancel={() => setShowCategoryChangeConfirm(false)}
      />
    </div>
  );
};
