import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Briefcase,
  Building2,
  Phone,
  Calendar,
  Award,
  ArrowLeft,
  Users
} from 'lucide-react';
import { Staff, School as SchoolType } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface OtherStaffFormModalProps {
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

export const OtherStaffFormModal: React.FC<OtherStaffFormModalProps> = ({
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

  const getFreshOtherStaffState = (): Partial<Staff> => {
    return {
      employeeId: '',
      employeeCode: '',
      uniqueId: '',
      name: '',
      gender: 'MALE',
      designation: 'भृत्य',
      teacherType: 'अन्य',
      subject: '',
      duty: '',
      qualification: '',
      mobile: '',
      email: '',
      caste: '',
      aadhaarNumber: '',
      voterIdNumber: '',
      joiningDate: '',
      postingDate: new Date().toISOString().split('T')[0],
      isBlo: false,
      isCensus: false,
      isOd: false,
      employmentType: 'REGULAR',
      assignedSchoolUdise: defaultUdise,
      status: 'ACTIVE',
      dob: '',
      category: 'OBC',
    };
  };

  const [formData, setFormData] = useState<Partial<Staff>>(getFreshOtherStaffState);
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
          teacherType: 'अन्य',
          postingDate: initialData.postingDate || initialData.joiningDate || new Date().toISOString().split('T')[0],
          duty: initialData.duty || initialData.subject || 'कार्यालयीन कार्य',
        });
        setIsDirty(false);
      } else {
        setFormData(getFreshOtherStaffState());
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
      setFormError('कृपया कर्मचारी का नाम दर्ज करें।');
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

    // Aadhaar validation (12 digits, optional)
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

    const dutyOrSubject = (formData.duty || formData.subject || 'कार्यालयीन कार्य').trim();

    const payload: Staff = {
      ...(formData as Staff),
      id: initialData?.id || `stf-oth-${Date.now()}`,
      employeeId: code.toUpperCase(),
      employeeCode: code.toUpperCase(),
      uniqueId: formData.uniqueId?.trim() || undefined,
      name,
      mobile: rawMobile,
      designation: formData.designation || 'भृत्य',
      teacherType: 'अन्य',
      subject: dutyOrSubject,
      duty: dutyOrSubject,
      caste: formData.caste?.trim() || undefined,
      aadhaarNumber: rawAadhaar || undefined,
      voterIdNumber: formData.voterIdNumber?.trim() || undefined,
      assignedSchoolUdise: effectiveUdise,
      status: formData.status || 'ACTIVE',
      employmentType: formData.employmentType || 'REGULAR',
      gender: formData.gender || 'MALE',
      qualification: (formData.qualification || '').trim(),
      dob: formData.dob || '1990-08-20',
      category: formData.category || 'OBC',
      joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
      postingDate: formData.postingDate || formData.joiningDate || new Date().toISOString().split('T')[0],
      isBlo: false,
      isCensus: false,
      isOd: false,
    };

    onSave(payload);
  };

  return (
    <div
      id="other-staff-form-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print animate-in fade-in duration-150"
    >
      <div
        id="other-staff-form-modal"
        className="bg-white dark:bg-[#17211C] rounded-2xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] max-h-[92vh] overflow-y-auto"
      >
        {/* Header with Clear Category Badge and Change Category Button */}
        <div className="pb-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#0B6B4B] dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isEdit ? 'अन्य स्टाफ विवरण संशोधित करें' : 'अन्य स्टाफ जोड़ें'}
                </h3>
                <span
                  id="other-staff-category-badge"
                  className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800"
                >
                  श्रेणी: अन्य स्टाफ
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono font-medium">
                  शैक्षणिक सत्र: {selectedSessionId}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                भृत्य, कार्यालय सहायक, चौकीदार, प्रयोगशाला सहायक, सफाई कर्मी एवं गैर-शैक्षणिक संवर्ग
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {!isEdit && onChangeCategory && (
              <button
                id="btn-other-staff-change-category"
                type="button"
                onClick={handleChangeCategoryClick}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#0B6B4B] dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1"
                title="श्रेणी चयन पर वापस जाएं"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← श्रेणी बदलें</span>
              </button>
            )}
            <button
              id="btn-close-other-staff-modal"
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
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">१. कर्मचारी व्यक्तिगत विवरण (Personal Details)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  कर्मचारी का नाम (Staff Name) *
                </label>
                <input
                  id="other-staff-input-name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="कर्मचारी का पूरा नाम दर्ज करें"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0B6B4B]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मोबाइल नंबर (Mobile) *
                </label>
                <input
                  id="other-staff-input-mobile"
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
                  id="other-staff-input-aadhaar"
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
                  id="other-staff-input-voter-id"
                  type="text"
                  value={formData.voterIdNumber || ''}
                  onChange={(e) => handleFieldChange('voterIdNumber', e.target.value.toUpperCase())}
                  placeholder="उदा. MPTK7654321"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  सामाजिक संवर्ग (Social Category)
                </label>
                <select
                  id="other-staff-select-category"
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
                  id="other-staff-input-caste"
                  type="text"
                  value={formData.caste || ''}
                  onChange={(e) => handleFieldChange('caste', e.target.value)}
                  placeholder="उदा. मालवीय, बंसल"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  लिंग (Gender)
                </label>
                <select
                  id="other-staff-select-gender"
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
                  id="other-staff-input-dob"
                  type="date"
                  value={formData.dob || '1990-08-20'}
                  onChange={(e) => handleFieldChange('dob', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: पद एवं कार्य दायित्व */}
          <div className="bg-gray-50/70 dark:bg-[#0F1713]/70 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <Briefcase className="w-4 h-4 text-[#0B6B4B]" />
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">२. पद एवं कार्य दायित्व (Designation & Duties)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  कर्मचारी कोड (Employee Code / ID) *
                </label>
                <input
                  id="other-staff-input-emp-code"
                  type="text"
                  value={formData.employeeId || formData.employeeCode || ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setFormData((prev) => ({ ...prev, employeeId: val, employeeCode: val }));
                    setIsDirty(true);
                  }}
                  placeholder="उदा. EMP-STF-205"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono focus:ring-2 focus:ring-[#0B6B4B]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  स्थायी यूनिक आईडी (Unique ID) <span className="text-gray-400 font-normal">(वैकल्पिक)</span>
                </label>
                <input
                  id="other-staff-input-unique-id"
                  type="text"
                  value={formData.uniqueId || ''}
                  onChange={(e) => handleFieldChange('uniqueId', e.target.value.toUpperCase())}
                  placeholder="उदा. UNQ-STF-8871"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  पद / Designation *
                </label>
                <select
                  id="other-staff-select-designation"
                  value={formData.designation}
                  onChange={(e) => handleFieldChange('designation', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold"
                >
                  <option value="भृत्य">भृत्य (Peon / Attendant)</option>
                  <option value="कार्यालय सहायक">कार्यालय सहायक (Office Assistant)</option>
                  <option value="चौकीदार">चौकीदार (Watchman / Security Guard)</option>
                  <option value="प्रयोगशाला सहायक">प्रयोगशाला सहायक (Lab Assistant)</option>
                  <option value="सफाई कर्मचारी">सफाई कर्मचारी (Sanitation Worker)</option>
                  <option value="सहायक ग्रेड-3">सहायक ग्रेड-3 (Assistant Grade-3)</option>
                  <option value="अन्य कर्मचारी">अन्य कर्मचारी (Other Non-Teaching Staff)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मुख्य कार्य / दायित्व (Work Responsibility)
                </label>
                <input
                  id="other-staff-input-duty"
                  type="text"
                  value={formData.duty || formData.subject || ''}
                  onChange={(e) => {
                    handleFieldChange('duty', e.target.value);
                    handleFieldChange('subject', e.target.value);
                  }}
                  placeholder="उदा. दैनिक कार्यालयीन डाक, घंटी बजाना, स्वच्छता व पंजी संधारण"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  नियुक्ति / पदस्थापना दिनांक
                </label>
                <input
                  id="other-staff-input-posting-date"
                  type="date"
                  value={formData.postingDate || formData.joiningDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleFieldChange('postingDate', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  पदस्थ विद्यालय & UDISE Code *
                </label>
                {isSchoolRestricted ? (
                  <div
                    id="other-staff-locked-school-display"
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
                    id="other-staff-select-school"
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
                  शैक्षणिक / तकनीकी योग्यता
                </label>
                <input
                  id="other-staff-input-qualification"
                  type="text"
                  value={formData.qualification || ''}
                  onChange={(e) => handleFieldChange('qualification', e.target.value)}
                  placeholder="उदा. 12वीं उत्तीर्ण, DCA"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  सेवा प्रकार (Employment Type)
                </label>
                <select
                  id="other-staff-select-employment-type"
                  value={formData.employmentType || 'REGULAR'}
                  onChange={(e) => handleFieldChange('employmentType', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="REGULAR">नियमित (Regular)</option>
                  <option value="CONTRACT">संविदा (Contract)</option>
                  <option value="DAILY_WAGE">दैनिक वेतनभोगी (Daily Wage)</option>
                  <option value="OUTSOURCED">आउटसोर्स (Outsourced)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  सेवा स्थिति (Status)
                </label>
                <select
                  id="other-staff-select-status"
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              id="btn-other-staff-cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-300 dark:border-gray-700"
            >
              रद्द करें
            </button>
            <button
              id="btn-other-staff-submit"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              {isEdit ? 'परिवर्तन सुरक्षित करें' : 'अन्य स्टाफ पंजीकृत करें'}
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
