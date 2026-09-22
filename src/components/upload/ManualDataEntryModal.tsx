import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { UploadDataType, School, Student, Staff, PhysicalFacility, AttendanceRecord, MDMRecord, Complaint, GovernmentWork } from '../../types';
import { DATA_TYPE_CONFIGS } from './uploadConfig';
import {
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Building2,
  GraduationCap,
  Users,
  ClipboardCheck,
  Utensils,
  AlertTriangle,
  ClipboardList,
  Save,
  School as SchoolIcon
} from 'lucide-react';

interface ManualDataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: UploadDataType;
  onSuccess?: () => void;
}

export const ManualDataEntryModal: React.FC<ManualDataEntryModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'STUDENT',
  onSuccess
}) => {
  const {
    schools,
    addSchool,
    addStudent,
    addStaff,
    updateFacility,
    markAttendance,
    saveMDMRecord,
    addComplaint,
    addGovernmentWork,
    scopedSchools
  } = useData();

  const { currentUser } = useAuth();
  const [selectedType, setSelectedType] = useState<UploadDataType>(defaultType);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const config = DATA_TYPE_CONFIGS[selectedType];
  const allowedSchools = scopedSchools.length > 0 ? scopedSchools : schools;

  // Handle input change
  const handleChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
    setErrorMsg('');
  };

  // Reset form when type changes
  const handleTypeChange = (type: UploadDataType) => {
    setSelectedType(type);
    setFormData({});
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      // 1. Check required fields
      for (const field of config.fields) {
        if (field.required) {
          const val = formData[field.key];
          if (val === undefined || val === null || String(val).trim() === '') {
            throw new Error(`कृपया अनिवार्य फ़ील्ड '${field.labelHi}' भरें।`);
          }
        }
      }

      // 2. Perform entity-specific insert
      if (selectedType === 'SCHOOL') {
        const udise = String(formData.udise || '').trim();
        if (!/^\d{8,12}$/.test(udise)) {
          throw new Error('यू-डायस कोड 8 से 12 अंकों का होना चाहिए।');
        }
        if (schools.some((s) => s.udise === udise)) {
          throw new Error(`यू-डायस कोड ${udise} पहले से दर्ज है।`);
        }

        const newSchool: School = {
          udise,
          name: formData.name || '',
          hindiName: formData.name || '',
          schoolType: formData.schoolType || 'प्राथमिक',
          village: formData.village || '',
          gramPanchayat: formData.gramPanchayat || formData.village || '',
          sankul: formData.sankul || 'संकुल मलगुवां',
          jsk: formData.jsk || 'जन शिक्षा केंद्र मलगुवां',
          block: formData.block || 'बल्देवगढ़',
          district: formData.district || 'टीकमगढ़',
          pin: formData.pin || '472001',
          address: formData.address || '',
          mobile: formData.mobile || '',
          email: formData.email || '',
          establishmentYear: Number(formData.establishmentYear) || 2005,
          principalName: formData.principalName || '',
          principalMobile: formData.principalMobile || '',
          principalEmployeeId: formData.principalEmployeeId || `EMP-${Date.now().toString().slice(-4)}`,
          principalAssignmentDate: formData.principalAssignmentDate || '2020-01-01',
          status: formData.status || 'ACTIVE'
        };
        addSchool(newSchool);
      } else if (selectedType === 'STUDENT') {
        const samagra = String(formData.samagraId || '').trim();
        const udise = String(formData.schoolUdise || '').trim();

        const newStudent: Omit<Student, 'id'> = {
          samagraId: samagra,
          schoolUdise: udise,
          name: formData.name || '',
          srNumber: formData.srNumber || `SR-${Date.now().toString().slice(-4)}`,
          apaarId: formData.apaarId || '',
          gender: formData.gender || 'बालक',
          dob: formData.dob || '2017-01-01',
          fatherName: formData.fatherName || '',
          motherName: formData.motherName || '',
          class: formData.class || '1',
          section: formData.section || 'A',
          category: formData.category || 'OBC',
          isCwsn: Boolean(formData.isCwsn),
          mobile: formData.mobile || '',
          address: formData.address || '',
          status: formData.status || 'ACTIVE',
          admissionDate: formData.admissionDate || new Date().toISOString().split('T')[0]
        };
        addStudent(newStudent);
      } else if (selectedType === 'TEACHER') {
        const newStaff: Omit<Staff, 'id'> = {
          employeeId: formData.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
          name: formData.name || '',
          assignedSchoolUdise: formData.assignedSchoolUdise || '',
          designation: formData.designation || 'प्राथमिक शिक्षक',
          subject: formData.subject || '',
          mobile: formData.mobile || '',
          email: formData.email || '',
          gender: formData.gender || 'बालक',
          assignedClasses: formData.assignedClasses || ['1', '2', '3', '4', '5'],
          joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
          qualification: formData.qualification || '',
          dob: formData.dob || '1985-01-01',
          category: formData.category || 'OBC',
          duty: formData.duty || 'अध्यापन',
          status: formData.status || 'ACTIVE'
        };
        addStaff(newStaff);
      } else if (selectedType === 'FACILITY') {
        const fac: PhysicalFacility = {
          schoolUdise: formData.schoolUdise || '',
          facilityKey: formData.facilityKey || 'facility_' + Date.now().toString().slice(-4),
          facilityName: formData.facilityName || 'भौतिक सुविधा',
          available: formData.available || 'YES',
          condition: formData.condition || 'संतोषजनक',
          count: Number(formData.count) || 1,
          usableCount: Number(formData.usableCount) || 1,
          repairRequiredCount: Number(formData.repairRequiredCount) || 0,
          remarks: formData.remarks || '',
          requirementDetails: formData.requirementDetails || ''
        };
        updateFacility(fac);
      } else if (selectedType === 'ATTENDANCE') {
        const att: AttendanceRecord = {
          id: `ATT-${Date.now().toString().slice(-5)}`,
          date: formData.date || new Date().toISOString().split('T')[0],
          schoolUdise: formData.schoolUdise || '',
          type: formData.type || 'STUDENT',
          class: formData.class || 'ALL',
          totalCount: Number(formData.totalCount) || 0,
          presentCount: Number(formData.presentCount) || 0,
          absentCount: Number(formData.absentCount) || 0,
          markedBy: formData.markedBy || currentUser?.name || 'Authorized User',
          markedAt: new Date().toISOString()
        };
        markAttendance(att);
      } else if (selectedType === 'MDM') {
        const mdm: MDMRecord = {
          id: `MDM-${Date.now().toString().slice(-5)}`,
          date: formData.date || new Date().toISOString().split('T')[0],
          schoolUdise: formData.schoolUdise || '',
          eligibleStudents: Number(formData.eligibleStudents) || 0,
          presentStudents: Number(formData.presentStudents) || 0,
          mealsServed: Number(formData.mealsServed) || 0,
          mealsNotServed: Number(formData.mealsNotServed) || 0,
          cookPresent: Boolean(formData.cookPresent),
          fuelAvailable: true,
          shgName: formData.shgName || '',
          wheatStockKg: Number(formData.wheatStockKg) || 0,
          riceStockKg: Number(formData.riceStockKg) || 0,
          kitchenHygiene: formData.kitchenHygiene || 'उत्कृष्ट',
          menuItem: formData.menuItem || 'रोटी, दाल, मौसमी सब्जी',
          problemsReported: formData.problemsReported || ''
        };
        saveMDMRecord(mdm);
      } else if (selectedType === 'COMPLAINT') {
        const cmp: Omit<Complaint, 'id' | 'complaintId'> = {
          schoolUdise: formData.schoolUdise || '',
          category: formData.category || 'प्रशासनिक व अन्य',
          subject: formData.subject || '',
          description: formData.description || '',
          submittedBy: formData.submittedBy || currentUser?.name || 'नागरिक',
          submitterRole: formData.submitterRole || 'पालक',
          submitterMobile: formData.submitterMobile || '',
          date: formData.date || new Date().toISOString().split('T')[0],
          priority: formData.priority || 'HIGH',
          status: formData.status || 'PENDING',
          actionTaken: formData.actionTaken || ''
        };
        addComplaint(cmp);
      } else if (selectedType === 'WORK') {
        const work: Omit<GovernmentWork, 'id'> = {
          workName: formData.workName || '',
          orderNumber: formData.orderNumber || `ORD-${Date.now().toString().slice(-4)}`,
          schoolUdise: formData.schoolUdise || '',
          description: formData.description || '',
          assignedDate: formData.assignedDate || new Date().toISOString().split('T')[0],
          dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
          status: formData.status || 'IN_PROGRESS',
          priority: formData.priority || 'HIGH',
          responsiblePerson: formData.responsiblePerson || currentUser?.name || 'संस्था प्रभारी',
          remarks: formData.remarks || ''
        };
        addGovernmentWork(work);
      }

      setSuccessMsg(`प्रविष्टि सफलतापूर्वक सुरक्षित की गई (${config.titleHi})। डेटाबेस व डैशबोर्ड तुरंत अपडेट हो गया है।`);
      setFormData({});
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'प्रविष्टि सुरक्षित करने में त्रुटि।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEntityIcon = (type: UploadDataType) => {
    switch (type) {
      case 'SCHOOL': return <SchoolIcon className="w-4 h-4" />;
      case 'STUDENT': return <GraduationCap className="w-4 h-4" />;
      case 'TEACHER': return <Users className="w-4 h-4" />;
      case 'FACILITY': return <Building2 className="w-4 h-4" />;
      case 'ATTENDANCE': return <ClipboardCheck className="w-4 h-4" />;
      case 'MDM': return <Utensils className="w-4 h-4" />;
      case 'COMPLAINT': return <AlertTriangle className="w-4 h-4" />;
      case 'WORK': return <ClipboardList className="w-4 h-4" />;
    }
  };

  return (
    <div id="manual-data-entry-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-blue-700 to-indigo-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">एकल डेटा प्रविष्टि (Manual Single Record Entry)</h2>
              <p className="text-xs text-blue-100">डेटाबेस में सीधे नया रिकॉर्ड दर्ज करें</p>
            </div>
          </div>
          <button
            id="close-manual-modal-btn"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Type Selector Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar">
          {(Object.keys(DATA_TYPE_CONFIGS) as UploadDataType[]).map((type) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                id={`select-entity-btn-${type.toLowerCase()}`}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {getEntityIcon(type)}
                <span>{DATA_TYPE_CONFIGS[type].titleHi.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-in fade-in">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
              <div className="flex-1">
                <span className="font-semibold">{successMsg}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getEntityIcon(selectedType)}
              <span className="text-sm font-bold text-blue-900">{config.titleHi}</span>
            </div>
            <span className="text-xs text-blue-700">{config.description}</span>
          </div>

          {/* Dynamic Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.fields.map((field) => {
              const isSchoolField = field.key === 'schoolUdise' || field.key === 'assignedSchoolUdise';

              return (
                <div key={field.key} className={field.key === 'description' || field.key === 'address' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {field.labelHi}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                    <span className="text-slate-400 font-normal ml-1">({field.labelEn})</span>
                  </label>

                  {/* School UDISE dropdown selector */}
                  {isSchoolField ? (
                    <select
                      id={`input-${field.key}`}
                      required={field.required}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- शाला का चयन करें --</option>
                      {allowedSchools.map((s) => (
                        <option key={s.udise} value={s.udise}>
                          {s.udise} - {s.name} ({s.village})
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'select' ? (
                    <select
                      id={`input-${field.key}`}
                      required={field.required}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- चयन करें --</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <div className="flex items-center gap-4 py-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={field.key}
                          checked={formData[field.key] === true}
                          onChange={() => handleChange(field.key, true)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>हाँ (Yes)</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={field.key}
                          checked={formData[field.key] === false}
                          onChange={() => handleChange(field.key, false)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>नहीं (No)</span>
                      </label>
                    </div>
                  ) : field.key === 'description' || field.key === 'address' ? (
                    <textarea
                      id={`input-${field.key}`}
                      rows={2}
                      required={field.required}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={`${field.labelHi} दर्ज करें...`}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <input
                      id={`input-${field.key}`}
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      required={field.required}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={`${field.labelHi} दर्ज करें...`}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              id="cancel-manual-entry-btn"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              रद्द करें (Cancel)
            </button>
            <button
              id="submit-manual-entry-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'सुरक्षित हो रहा है...' : 'रिकॉर्ड सुरक्षित करें (Save Record)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
