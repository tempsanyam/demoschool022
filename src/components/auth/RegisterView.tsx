import React, { useState } from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ArrowLeft, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { institutionConfig } from '../../config/institutionConfig';

interface RegisterViewProps {
  onBackToLogin?: () => void;
  onNavigateToLogin?: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onBackToLogin, onNavigateToLogin }) => {
  const handleBack = () => {
    if (onNavigateToLogin) onNavigateToLogin();
    else if (onBackToLogin) onBackToLogin();
  };
  const { register } = useAuth();
  const { schools } = useData();

  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('TEACHER');
  const [employeeId, setEmployeeId] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [assignedSchoolUdise, setAssignedSchoolUdise] = useState(schools[0]?.udise || '');
  const [designation, setDesignation] = useState('माध्यमिक शिक्षक');
  const [subject, setSubject] = useState('गणित');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !employeeId.trim() || !mobile.trim()) {
      setErrorMsg('कृपया सभी आवश्यक जानकारी (*) सही रूप से भरें।');
      return;
    }

    if (mobile.trim().length !== 10) {
      setErrorMsg('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = register({
        username: employeeId.trim().toLowerCase(),
        name: name.trim(),
        role,
        employeeId: employeeId.trim().toUpperCase(),
        mobile: mobile.trim(),
        email: email.trim() || `${employeeId.toLowerCase()}@mp.gov.in`,
        assignedSchoolUdise,
        designation,
        subject,
      });

      setIsSubmitting(false);

      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F2] dark:bg-[#0E1511] py-8 px-4 sm:px-6 transition-colors">
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#17211C] rounded-2xl shadow-xl border border-[#DDE7E2] dark:border-[#2B3933] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B6B4B] p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-xs bg-emerald-800 text-emerald-100 px-2.5 py-0.5 rounded font-bold">
              पंजीकरण आवेदन
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">
              नया शिक्षक / कर्मचारी पंजीकरण
            </h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              {institutionConfig.institutionName} ({institutionConfig.district}) अंतर्गत पदस्थ शिक्षक एवं संस्था प्रधान
            </p>
          </div>
          <button
            onClick={handleBack}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>लॉगिन पर लौटें</span>
          </button>
        </div>

        {/* Success Banner */}
        {successMsg ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              आवेदन सफलतापूर्वक प्राप्त हुआ!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
              {successMsg}
            </p>
            <div className="pt-4">
              <button
                onClick={handleBack}
                className="bg-[#0B6B4B] hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                लॉगिन स्क्रीन पर वापस जाएं
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  पूरा नाम (Full Name) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. राजेश कुमार तिवारी"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  भूमिका (Role) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:outline-none"
                >
                  <option value="TEACHER">शिक्षक (Teacher)</option>
                  <option value="PRINCIPAL">प्रधानाध्यापक (Principal / Headmaster)</option>
                  <option value="OPERATOR">डेटा एंट्री ऑपरेटर (Operator)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  कर्मचारी कोड / यूनिक आईडी (Employee ID) *
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="उदा. EMP109 या BK3456"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मोबाइल नंबर (Mobile No.) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 अंकों का नंबर"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  पदस्थ विद्यालय का चयन (Assigned School) *
                </label>
                <select
                  value={assignedSchoolUdise}
                  onChange={(e) => setAssignedSchoolUdise(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:outline-none"
                >
                  {schools.map((s) => (
                    <option key={s.udise} value={s.udise}>
                      {s.name || s.hindiName} (UDISE: {s.udise})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  पदनाम (Designation)
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:outline-none"
                >
                  <option value="माध्यमिक शिक्षक">माध्यमिक शिक्षक</option>
                  <option value="प्राथमिक शिक्षक">प्राथमिक शिक्षक</option>
                  <option value="उच्च श्रेणी शिक्षक">उच्च श्रेणी शिक्षक</option>
                  <option value="प्रधानाध्यापक">प्रधानाध्यापक</option>
                  <option value="अतिथि शिक्षक">अतिथि शिक्षक (Guest Teacher)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  मुख्य विषय (Subject)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="उदा. गणित, विज्ञान, हिंदी, संस्कृत"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  ईमेल पता (Email ID - Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="उदा. teacher@mp.gov.in"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-[#FF7A00]" />
              <p>
                <strong>सत्यापन सूचना:</strong> पंजीकरण के उपरांत जन शिक्षक (CAC मलगुवां) द्वारा आपके क्रेडेंशियल्स का सत्यापन किया जाएगा। इसके बाद ही खाता लॉगिन हेतु सक्रिय होगा।
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0B6B4B] hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                {isSubmitting ? 'आवेदन भेजा जा रहा है...' : 'पंजीकरण आवेदन जमा करें'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
