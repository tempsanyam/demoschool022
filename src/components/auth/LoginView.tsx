import React, { useState } from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ShieldCheck, UserCheck, KeyRound, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { institutionConfig } from '../../config/institutionConfig';

interface LoginViewProps {
  onNavigateToRegister?: () => void;
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onNavigateToRegister,
  onLoginSuccess,
}) => {
  const { login, users } = useAuth();
  const { logActivity } = useData();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('CAC');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('कृपया यूज़रनेम, कर्मचारी आईडी अथवा मोबाइल नंबर दर्ज करें।');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = login(identifier, password, selectedRole);
      setLoading(false);
      if (res.success) {
        logActivity('LOGIN', 'Auth', `${selectedRole} के रूप में सफलतापूर्वक लॉगिन किया गया।`);
        onLoginSuccess?.();
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  // Quick Demo account selector for instant role testing
  const handleQuickDemoLogin = (role: UserRole) => {
    const demoUser = users.find((u) => u.role === role);
    if (demoUser) {
      setIdentifier(demoUser.username);
      setPassword('admin123');
      setSelectedRole(role);
      const res = login(demoUser.username, 'admin123', role);
      if (res.success) {
        logActivity('LOGIN', 'Auth', `डेमो लॉगिन: ${demoUser.name} (${role})`);
        onLoginSuccess?.();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F2] dark:bg-[#0E1511] flex flex-col justify-between py-6 px-4 sm:px-6 select-none transition-colors">
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="font-semibold text-[#0B6B4B] dark:text-emerald-400">
          म.प्र. स्कूल शिक्षा विभाग
        </span>
        <span className="bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200">
          सत्र 2026-27
        </span>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-white dark:bg-[#17211C] rounded-2xl shadow-xl border border-[#DDE7E2] dark:border-[#2B3933] overflow-hidden">
        {/* Card Header */}
        <div className="bg-[#0B6B4B] p-6 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white text-[#0B6B4B] mx-auto flex items-center justify-center text-2xl font-bold shadow-md mb-3 border-2 border-emerald-300">
            🏛️
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {institutionConfig.institutionName}
          </h2>
          <p className="text-xs text-emerald-100 mt-1 font-medium">
            विकास खंड {institutionConfig.block}, जिला {institutionConfig.district} ({institutionConfig.totalSchoolsCount} विद्यालय)
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-6 pb-2">
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
            लॉगिन भूमिका का चयन करें (Select Role):
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { role: 'CAC' as UserRole, label: 'जन शिक्षक (CAC)', sub: 'संकुल प्रभारी' },
              { role: 'PRINCIPAL' as UserRole, label: 'प्रधानाध्यापक', sub: 'संस्था प्रधान' },
              { role: 'TEACHER' as UserRole, label: 'शिक्षक', sub: 'अध्यापक / अतिथि' },
              { role: 'OPERATOR' as UserRole, label: 'डेटा ऑपरेटर', sub: 'क्लर्क / एडमिन' },
            ].map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => setSelectedRole(r.role)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  selectedRole === r.role
                    ? 'border-[#0B6B4B] bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 ring-2 ring-[#0B6B4B]/30'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:border-emerald-300'
                }`}
              >
                <div className="text-xs font-bold truncate">{r.label}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-400 truncate">{r.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLoginSubmit} className="p-6 pt-3 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3 rounded-lg flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              यूज़रनेम / कर्मचारी आईडी / मोबाइल नंबर:
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="उदा. cac.malguwa या EMP101 या 9826012345"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
                required
              />
              <UserCheck className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              सुरक्षा पासवर्ड (Security Password):
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
              />
              <KeyRound className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B6B4B] hover:bg-emerald-800 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? 'सत्यापन जारी है...' : 'सुरक्षित लॉगिन करें (Secure Login)'}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Test Buttons */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>त्वरित डेमो लॉगिन (Quick Testing Accounts):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('CAC')}
                className="text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-[#0B6B4B] px-2.5 py-1 rounded transition-colors"
              >
                👤 जन शिक्षक (CAC)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('PRINCIPAL')}
                className="text-[11px] font-semibold bg-blue-100 hover:bg-blue-200 text-blue-800 px-2.5 py-1 rounded transition-colors"
              >
                🏫 प्रधानाध्यापक
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('TEACHER')}
                className="text-[11px] font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-1 rounded transition-colors"
              >
                ✍️ शिक्षक
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('OPERATOR')}
                className="text-[11px] font-semibold bg-purple-100 hover:bg-purple-200 text-purple-800 px-2.5 py-1 rounded transition-colors"
              >
                💻 ऑपरेटर
              </button>
            </div>
          </div>

          {/* Registration Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-xs text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline"
            >
              नया शिक्षक / कर्मचारी? यहाँ पंजीकरण हेतु आवेदन करें →
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-gray-500 dark:text-gray-400">
        हेल्पलाइन: {institutionConfig.cac1.mobile} | संकुल केंद्र: {institutionConfig.institutionName} ({institutionConfig.district})
      </div>
    </div>
  );
};
