import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  Phone,
  Calendar,
  Award,
  ArrowLeft,
  Utensils,
  CreditCard,
  HeartPulse,
  Users
} from 'lucide-react';
import { Rasoiya, School as SchoolType } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface RasoiyaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Rasoiya | null;
  isEdit?: boolean;
  onChangeCategory?: () => void;
  schools: SchoolType[];
  currentSchoolUdise?: string;
  isSchoolRestricted?: boolean;
  selectedSessionId: string;
  onSave: (data: Rasoiya) => void;
}

export const RasoiyaFormModal: React.FC<RasoiyaFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  isEdit = false,
  onChangeCategory,
  schools,
  currentSchoolUdise,
  isSchoolRestricted = false,
  selectedSessionId,
  onSave
}) => {
  const defaultUdise = currentSchoolUdise || schools[0]?.udise || '';
  const defaultSchoolObj = schools.find((s) => s.udise === defaultUdise);

  const getFreshRasoiyaState = (): Partial<Rasoiya> => ({
    name: '',
    schoolUdise: defaultUdise,
    schoolName: defaultSchoolObj?.hindiName || defaultSchoolObj?.name || defaultUdise,
    mobile: '',
    aadhaarNumber: '',
    samagraId: '',
    panNumber: '',
    gender: 'FEMALE',
    category: 'OBC',
    caste: '',
    joiningDate: new Date().toISOString().split('T')[0],
    trainingStatus: 'TRAINED',
    healthCheckupStatus: 'UP_TO_DATE',
    lastHealthCheckupDate: new Date().toISOString().split('T')[0],
    bankName: '',
    bankAccount: '',
    ifsc: '',
    branchName: '',
    paymentStatus: 'PAID',
    monthlyHonorarium: 2000,
    shgName: '',
    shgId: '',
    status: 'ACTIVE',
    workLocation: 'विद्यालय परिसर - मध्याह्न भोजन रसोई शेड',
    remarks: ''
  });

  const [formData, setFormData] = useState<Partial<Rasoiya>>(getFreshRasoiyaState);
  const [formError, setFormError] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showCategoryChangeConfirm, setShowCategoryChangeConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData && isEdit) {
        setFormData({
          ...initialData,
          schoolUdise: initialData.schoolUdise || defaultUdise,
          workLocation: initialData.workLocation || 'विद्यालय परिसर - मध्याह्न भोजन रसोई शेड',
          trainingStatus: initialData.trainingStatus || 'TRAINED',
          healthCheckupStatus: initialData.healthCheckupStatus || 'UP_TO_DATE',
          status: initialData.status || 'ACTIVE',
          monthlyHonorarium: initialData.monthlyHonorarium ?? 2000,
        });
        setIsDirty(false);
      } else {
        setFormData(getFreshRasoiyaState());
        setIsDirty(false);
      }
      setFormError('');
    }
  }, [isOpen, initialData, isEdit, defaultUdise]);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof Rasoiya, value: any) => {
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

    const name = (formData.name || '').trim();
    const effectiveUdise = isSchoolRestricted
      ? (currentSchoolUdise || formData.schoolUdise || '')
      : (formData.schoolUdise || defaultUdise);

    if (!name) {
      setFormError('कृपया रसोइया का नाम दर्ज करें।');
      return;
    }
    if (!effectiveUdise) {
      setFormError('कृपया विद्यालय का चयन करें।');
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

    const sObj = schools.find((s) => s.udise === effectiveUdise);

    const payload: Rasoiya = {
      ...(formData as Rasoiya),
      id: initialData?.id || `cook-${Date.now()}`,
      name,
      schoolUdise: effectiveUdise,
      schoolName: sObj?.hindiName || sObj?.name || formData.schoolName || effectiveUdise,
      mobile: rawMobile,
      aadhaarNumber: rawAadhaar || undefined,
      samagraId: formData.samagraId?.trim() || undefined,
      panNumber: formData.panNumber?.trim() || undefined,
      caste: formData.caste?.trim() || undefined,
      gender: formData.gender || 'FEMALE',
      category: formData.category || 'OBC',
      joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
      trainingStatus: formData.trainingStatus || 'TRAINED',
      healthCheckupStatus: formData.healthCheckupStatus || 'UP_TO_DATE',
      lastHealthCheckupDate: formData.lastHealthCheckupDate || new Date().toISOString().split('T')[0],
      workLocation: formData.workLocation?.trim() || 'विद्यालय परिसर - मध्याह्न भोजन रसोई शेड',
      status: formData.status || 'ACTIVE',
      paymentStatus: formData.paymentStatus || 'PAID',
      monthlyHonorarium: Number(formData.monthlyHonorarium) || 2000,
      bankName: formData.bankName?.trim() || '',
      bankAccount: formData.bankAccount?.trim() || '',
      branchName: formData.branchName?.trim() || '',
      ifsc: formData.ifsc?.trim() || '',
      shgName: formData.shgName?.trim() || '',
      remarks: formData.remarks?.trim() || '',
      sessionId: selectedSessionId,
    };

    onSave(payload);
  };

  return (
    <div
      id="rasoiya-form-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print animate-in fade-in duration-150"
    >
      <div
        id="rasoiya-form-modal"
        className="bg-white dark:bg-[#17211C] rounded-2xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] max-h-[92vh] overflow-y-auto"
      >
        {/* Header with Clear Category Badge and Change Category Button */}
        <div className="pb-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isEdit ? 'रसोइया विवरण संशोधित करें' : 'नया रसोइया जोड़ें'}
                </h3>
                <span
                  id="rasoiya-category-badge"
                  className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-800"
                >
                  श्रेणी: रसोइया
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono font-medium">
                  शैक्षणिक सत्र: {selectedSessionId}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                मध्याह्न भोजन (पीएम-पोषण) रसोइया-सह-सहायक पंजी, मानदेय एवं स्वास्थ्य अभिलेख
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {!isEdit && onChangeCategory && (
              <button
                id="btn-rasoiya-change-category"
                type="button"
                onClick={handleChangeCategoryClick}
                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1"
                title="श्रेणी चयन पर वापस जाएं"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← श्रेणी बदलें</span>
              </button>
            )}
            <button
              id="btn-close-rasoiya-modal"
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
          {/* Section 1: रसोइया व्यक्तिगत विवरण */}
          <div className="bg-gray-50/70 dark:bg-[#0F1713]/70 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <User className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">१. व्यक्तिगत विवरण (Personal Details)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  रसोइया का नाम (Cook Name) *
                </label>
                <input
                  id="rasoiya-input-name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="उदा. श्रीमती कौशल्या बाई"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  लिंग (Gender)
                </label>
                <select
                  id="rasoiya-select-gender"
                  value={formData.gender || 'FEMALE'}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="FEMALE">महिला (Female)</option>
                  <option value="MALE">पुरुष (Male)</option>
                  <option value="OTHER">अन्य (Other)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मोबाइल नंबर (Mobile)
                </label>
                <input
                  id="rasoiya-input-mobile"
                  type="tel"
                  maxLength={10}
                  value={formData.mobile || ''}
                  onChange={(e) => handleFieldChange('mobile', e.target.value.replace(/\D/g, ''))}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  आधार नंबर (Aadhaar) <span className="text-gray-400 font-normal">(12 अंक)</span>
                </label>
                <input
                  id="rasoiya-input-aadhaar"
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
                  समग्र आईडी (Samagra ID) <span className="text-gray-400 font-normal">(9 अंक)</span>
                </label>
                <input
                  id="rasoiya-input-samagra"
                  type="text"
                  maxLength={9}
                  value={formData.samagraId || ''}
                  onChange={(e) => handleFieldChange('samagraId', e.target.value.replace(/\D/g, ''))}
                  placeholder="उदा. 123456789"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  पैन नंबर (PAN Number) <span className="text-gray-400 font-normal">(वैकल्पिक)</span>
                </label>
                <input
                  id="rasoiya-input-pan"
                  type="text"
                  maxLength={10}
                  value={formData.panNumber || ''}
                  onChange={(e) => handleFieldChange('panNumber', e.target.value.toUpperCase())}
                  placeholder="उदा. ABCDE1234F"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  सामाजिक संवर्ग (Social Category)
                </label>
                <select
                  id="rasoiya-select-category"
                  value={formData.category || 'OBC'}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="OBC">OBC (अन्य पिछड़ा वर्ग)</option>
                  <option value="SC">SC (अनुसूचित जाति)</option>
                  <option value="ST">ST (अनुसूचित जनजाति)</option>
                  <option value="GENERAL">General (सामान्य)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  जाति (Caste) <span className="text-gray-400 font-normal">(वैकल्पिक)</span>
                </label>
                <input
                  id="rasoiya-input-caste"
                  type="text"
                  value={formData.caste || ''}
                  onChange={(e) => handleFieldChange('caste', e.target.value)}
                  placeholder="उदा. माली, वर्मा, यादव"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: कार्यस्थल व संस्था पदस्थापना */}
          <div className="bg-gray-50/70 dark:bg-[#0F1713]/70 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <Building2 className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">२. कार्यस्थल व संस्था पदस्थापना (Work Location & School)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  संबंधित विद्यालय & UDISE Code *
                </label>
                {isSchoolRestricted ? (
                  <div
                    id="rasoiya-locked-school-display"
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-bold flex items-center justify-between"
                  >
                    <span className="truncate">
                      {schools.find((s) => s.udise === currentSchoolUdise)?.hindiName ||
                        schools.find((s) => s.udise === currentSchoolUdise)?.name ||
                        currentSchoolUdise}
                    </span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                      UDISE: {currentSchoolUdise} (School Locked)
                    </span>
                  </div>
                ) : (
                  <select
                    id="rasoiya-select-school"
                    value={formData.schoolUdise}
                    onChange={(e) => handleFieldChange('schoolUdise', e.target.value)}
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

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  कार्यस्थल / कहाँ कार्यरत हैं (Work Location)
                </label>
                <input
                  id="rasoiya-input-work-location"
                  type="text"
                  value={formData.workLocation || ''}
                  onChange={(e) => handleFieldChange('workLocation', e.target.value)}
                  placeholder="उदा. विद्यालय परिसर - मध्याह्न भोजन रसोई शेड"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  कार्यभार ग्रहण दिनांक (Joining Date)
                </label>
                <input
                  id="rasoiya-input-joining-date"
                  type="date"
                  value={formData.joiningDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleFieldChange('joiningDate', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  पाककला प्रशिक्षण स्थिति (Training Status)
                </label>
                <select
                  id="rasoiya-select-training-status"
                  value={formData.trainingStatus || 'TRAINED'}
                  onChange={(e) => handleFieldChange('trainingStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                >
                  <option value="TRAINED">प्रशिक्षित (TRAINED)</option>
                  <option value="UNTRAINED">अप्रशिक्षित (UNTRAINED)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  स्वास्थ्य परीक्षण स्थिति (Health Checkup)
                </label>
                <select
                  id="rasoiya-select-health-status"
                  value={formData.healthCheckupStatus || 'UP_TO_DATE'}
                  onChange={(e) => handleFieldChange('healthCheckupStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                >
                  <option value="UP_TO_DATE">अद्यतन प्रमाणित (UP TO DATE)</option>
                  <option value="PENDING">लंबित (PENDING)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  अंतिम स्वास्थ्य परीक्षण दिनांक
                </label>
                <input
                  id="rasoiya-input-last-health-date"
                  type="date"
                  value={formData.lastHealthCheckupDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleFieldChange('lastHealthCheckupDate', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  संबद्ध स्व-सहायता समूह का नाम (SHG Name)
                </label>
                <input
                  id="rasoiya-input-shg-name"
                  type="text"
                  value={formData.shgName || ''}
                  onChange={(e) => handleFieldChange('shgName', e.target.value)}
                  placeholder="उदा. माँ शारदा स्व-सहायता समूह"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  सेवा स्थिति (Status)
                </label>
                <select
                  id="rasoiya-select-status"
                  value={formData.status || 'ACTIVE'}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                >
                  <option value="ACTIVE">सक्रिय (Active)</option>
                  <option value="ON_LEAVE">अवकाश पर (On Leave)</option>
                  <option value="INACTIVE">निष्क्रिय (Inactive)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: बैंक खाता व मानदेय विवरण */}
          <div className="bg-gray-50/70 dark:bg-[#0F1713]/70 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">३. बैंक खाता एवं मानदेय विवरण (Bank & Honorarium)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  बैंक का नाम (Bank Name)
                </label>
                <input
                  id="rasoiya-input-bank-name"
                  type="text"
                  value={formData.bankName || ''}
                  onChange={(e) => handleFieldChange('bankName', e.target.value)}
                  placeholder="State Bank of India"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  बैंक खाता संख्या (Account Number)
                </label>
                <input
                  id="rasoiya-input-bank-account"
                  type="text"
                  value={formData.bankAccount || ''}
                  onChange={(e) => handleFieldChange('bankAccount', e.target.value)}
                  placeholder="खाता नंबर दर्ज करें"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  आईएफएससी कोड (IFSC Code)
                </label>
                <input
                  id="rasoiya-input-ifsc"
                  type="text"
                  value={formData.ifsc || ''}
                  onChange={(e) => handleFieldChange('ifsc', e.target.value.toUpperCase())}
                  placeholder="उदा. SBIN0001234"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  बैंक शाखा (Branch Name)
                </label>
                <input
                  id="rasoiya-input-branch"
                  type="text"
                  value={formData.branchName || ''}
                  onChange={(e) => handleFieldChange('branchName', e.target.value)}
                  placeholder="उदा. खिरकिया"
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मासिक मानदेय राशि (Honorarium Amount)
                </label>
                <input
                  id="rasoiya-input-honorarium"
                  type="number"
                  value={formData.monthlyHonorarium ?? 2000}
                  onChange={(e) => handleFieldChange('monthlyHonorarium', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मानदेय भुगतान स्थिति (Payment Status)
                </label>
                <select
                  id="rasoiya-select-payment-status"
                  value={formData.paymentStatus || 'PAID'}
                  onChange={(e) => handleFieldChange('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                >
                  <option value="PAID">भुगतान पूर्ण (Paid)</option>
                  <option value="PENDING">लंबित (Pending)</option>
                  <option value="PROCESSING">प्रक्रियाधीन (Processing)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              id="btn-rasoiya-cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-300 dark:border-gray-700"
            >
              रद्द करें
            </button>
            <button
              id="btn-rasoiya-submit"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
            >
              {isEdit ? 'परिवर्तन सुरक्षित करें' : 'नया रसोइया पंजीकृत करें'}
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
