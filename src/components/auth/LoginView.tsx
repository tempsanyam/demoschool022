import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { institutionConfig } from '../../config/institutionConfig';
import {
  Shield,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertCircle,
  HelpCircle,
  X,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: () => void;
  onNavigateToRegister?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { activeSchools } = useData();

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals & Panels
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Client-side quick validation and login dispatch
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    // Validation checks
    if (!cleanId && !cleanPass) {
      setErrorMessage('कृपया यूज़रनेम और पासवर्ड दोनों दर्ज करें (Please enter username and password)');
      return;
    }
    if (!cleanId) {
      setErrorMessage('कृपया यूज़रनेम दर्ज करें (Username required)');
      return;
    }
    if (/^\d{11}$/.test(cleanId)) {
      setErrorMessage('शाला (UDISE) लॉगिन सुविधा उपलब्ध नहीं है। केवल मुख्य व्यवस्थापक (Admin) एवं 2 जन शिक्षक (CAC 1 व CAC 2) अधिकृत हैं।');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('कृपया पासवर्ड दर्ज करें (Password required)');
      return;
    }

    setLoading(true);

    // Short delay for authentication feedback
    setTimeout(async () => {
      const res = await login(cleanId, cleanPass);
      setLoading(false);

      if (res.success) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setErrorMessage(
          res.message === 'Invalid username or password'
            ? 'अमान्य यूज़रनेम या पासवर्ड (Invalid username or password)'
            : res.message
        );
      }
    }, 350);
  };

  return (
    <div
      id="login-page-container"
      className="min-h-screen bg-[#F8FAF8] dark:bg-[#0F1714] text-[#17211C] dark:text-[#F4F7F5] flex flex-col justify-between transition-colors duration-200"
    >
      {/* Top Header Bar */}
      <header id="login-top-bar" className="w-full border-b border-[#DDE7E2] dark:border-[#263930] bg-white/80 dark:bg-[#16221D]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0B6B4B] dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{institutionConfig.department}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#0F1714] px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700">
              सत्र: {institutionConfig.academicSession}
            </span>

            {/* Theme Toggle */}
            <button
              id="login-theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'लाइट मोड चालू करें' : 'डार्क मोड चालू करें'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Area */}
      <main id="login-main-section" className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4 sm:my-8">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div
            id="login-card"
            className="bg-white dark:bg-[#16221D] rounded-2xl shadow-xl border border-[#DDE7E2] dark:border-[#263930] overflow-hidden"
          >
            {/* Institution Brand Header */}
            <div className="bg-gradient-to-b from-[#0B6B4B] to-[#074731] p-6 sm:p-7 text-white text-center relative overflow-hidden">
              {/* Decorative background overlay */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

              {/* Institution Seal Emblem */}
              <div className="w-16 h-16 rounded-2xl bg-white text-[#0B6B4B] mx-auto flex items-center justify-center text-3xl shadow-lg mb-3 border-2 border-emerald-300 transform transition-transform hover:scale-105">
                🏛️
              </div>

              {/* Brand Titles */}
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-serif drop-shadow-xs">
                {institutionConfig.jskName}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-emerald-100 mt-1">
                {institutionConfig.sankulName} | विकासखंड: {institutionConfig.block} | जिला: {institutionConfig.district}
              </p>
              
              <div className="mt-3 inline-flex items-center gap-1.5 bg-black/25 text-emerald-200 border border-emerald-400/30 text-[11px] font-bold px-3 py-1 rounded-full">
                <span>सत्र {institutionConfig.academicSession}</span>
                <span>•</span>
                <span>{activeSchools.length > 0 ? `${activeSchools.length} संकुल शालाएं` : 'प्रशासकीय निगरानी पोर्टल'}</span>
              </div>
            </div>

            {/* Sub-header Banner: Login Portal */}
            <div className="bg-[#EAF6F0] dark:bg-[#0C1E17] border-b border-[#DDE7E2] dark:border-[#263930] px-6 py-2.5 text-center">
              <div className="text-xs font-bold text-[#0B6B4B] dark:text-emerald-300 flex items-center justify-center gap-1.5">
                <Shield className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400" />
                <span>प्रशासकीय लॉगिन पोर्टल (Admin & CAC Secure Login)</span>
              </div>
              <p className="text-[10.5px] text-gray-600 dark:text-gray-400 mt-0.5">
                केवल मुख्य व्यवस्थापक (Admin) एवं 2 जन शिक्षक (CAC 1 व CAC 2) अधिकृत हैं।
              </p>
            </div>

            {/* Login Form Body */}
            <div className="p-6 sm:p-7 space-y-5">
              {/* Error Message Box */}
              {errorMessage && (
                <div
                  id="login-error-alert"
                  className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage('')}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-200 ml-1 cursor-pointer"
                    aria-label="त्रुटि संदेश बंद करें"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* 1. Username Field */}
                <div>
                  <label
                    htmlFor="login-identifier-input"
                    className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    यूज़रनेम या डाइस कोड <span className="text-gray-400 font-normal">(Admin / CAC / School Username / UDISE)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="login-identifier-input"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="यूज़रनेम या 11-अंकीय UDISE दर्ज करें (उदा. HSHIRAPUR या 23080100303)"
                      disabled={loading}
                      autoFocus
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#0F1714] border border-gray-300 dark:border-[#263930] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0B6B4B] focus:border-transparent transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* 2. Password Field with Show/Hide Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password-input"
                      className="block text-xs font-bold text-gray-700 dark:text-gray-300"
                    >
                      पासवर्ड <span className="text-gray-400 font-normal">(Password)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-semibold text-[#0B6B4B] dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="पासवर्ड दर्ज करें"
                      disabled={loading}
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-white dark:bg-[#0F1714] border border-gray-300 dark:border-[#263930] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0B6B4B] focus:border-transparent transition-all disabled:opacity-60"
                    />
                    <button
                      id="toggle-password-visibility-btn"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer focus:outline-none"
                      title={showPassword ? 'पासवर्ड छुपाएं' : 'पासवर्ड दिखाएं'}
                      aria-label={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 3. Submit Button */}
                <button
                  id="login-submit-button"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#0B6B4B] hover:bg-[#08543A] active:bg-[#063F2C] text-white font-bold py-2.5 sm:py-3 px-4 rounded-xl text-sm transition-all duration-150 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>सत्यापन हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <span>लॉगिन करें (Login)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Authorized Logins Policy */}
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-[11px] space-y-1 text-emerald-950 dark:text-emerald-200">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <Shield className="w-3.5 h-3.5 text-[#0B6B4B] dark:text-emerald-400 shrink-0" />
                  <span>अधिकृत लॉगिन दायरा (Authorized Logins):</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[10.5px]">
                  इस शासकीय पोर्टल पर मुख्य व्यवस्थापक (Admin), 2 जन शिक्षक (CAC 1 व CAC 2) एवं संकुल मलगुवां की समस्त 37 शालाओं (School Username या 11-अंकीय UDISE) का लॉगिन अधिकृत है।
                </p>
              </div>

              {/* Security notice footer */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>सुरक्षित शासकीय पोर्टल • अनधिकृत प्रवेश दंडनीय है</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Official Government Institutional Footer */}
      <footer id="login-footer" className="w-full border-t border-[#DDE7E2] dark:border-[#263930] bg-white/60 dark:bg-[#16221D]/60 py-4 px-4 text-center">
        <div className="max-w-md mx-auto space-y-1">
          <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {institutionConfig.jskName}
          </div>
          <div className="text-[11px] text-gray-600 dark:text-gray-400">
            {institutionConfig.sankulName} | विकासखंड: {institutionConfig.block} | जिला: {institutionConfig.district}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 pt-0.5">
            © 2026 {institutionConfig.department} • सर्वाधिकार सुरक्षित
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          id="forgot-password-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="bg-white dark:bg-[#16221D] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <HelpCircle className="w-5 h-5 text-[#FF7A00]" />
                <span>पासवर्ड सहायता (Password Help)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                aria-label="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-[#0B6B4B] dark:text-emerald-300">
                पासवर्ड रीसेट अथवा सहायता हेतु व्यवस्थापक से संपर्क करें:
              </p>
              <p>
                सुरक्षा कारणों से ऑनलाइन स्वतः रीसेट प्रतिबंधित है। सहायता हेतु संकुल कार्यालय अथवा व्यवस्थापक से संपर्क करें:
              </p>

              <div className="space-y-2 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-[11.5px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-gray-200">संयम जैन (System Admin):</span>
                  <span className="font-mono text-[#0B6B4B] dark:text-emerald-400 font-bold">9826088159</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-gray-200">{institutionConfig.cac1.name} (CAC 1):</span>
                  <span className="font-mono text-[#0B6B4B] dark:text-emerald-400 font-bold">{institutionConfig.cac1.mobile}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-gray-200">{institutionConfig.cac2.name} (CAC 2):</span>
                  <span className="font-mono text-[#0B6B4B] dark:text-emerald-400 font-bold">{institutionConfig.cac2.mobile}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-[#0B6B4B] text-white font-bold py-2 rounded-xl text-xs hover:bg-[#08543A] transition-colors cursor-pointer"
            >
              समझ गया / बंद करें (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
