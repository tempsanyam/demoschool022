import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { Lock, ShieldAlert, CheckCircle2, Eye, EyeOff, LogOut, ArrowRight, Loader2 } from 'lucide-react';

interface MandatoryPasswordChangeViewProps {
  user: User;
}

export const MandatoryPasswordChangeView: React.FC<MandatoryPasswordChangeViewProps> = ({ user }) => {
  const { updatePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCurrent) {
      setError('कृपया वर्तमान अस्थायी पासवर्ड दर्ज करें।');
      return;
    }

    if (!cleanNew || cleanNew.length < 8) {
      setError('नया पासवर्ड कम से कम 8 अक्षरों का होना अनिवार्य है।');
      return;
    }

    if (cleanNew === cleanCurrent) {
      setError('नया पासवर्ड वर्तमान अस्थायी पासवर्ड से भिन्न होना चाहिए।');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError('नए पासवर्ड और पुष्टि पासवर्ड में मेल नहीं है।');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePassword(cleanCurrent, cleanNew);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'पासवर्ड परिवर्तन में त्रुटि हुई।');
      }
    } catch (err: any) {
      setError(err?.message || 'प्रमाणीकरण त्रुटि। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0F1714] text-[#17211C] dark:text-[#F4F7F5] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#16221D] rounded-2xl shadow-xl border border-amber-300 dark:border-amber-700/60 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-white text-amber-600 mx-auto flex items-center justify-center text-2xl shadow-md mb-3 border border-amber-200">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            प्रथम लॉगिन: पासवर्ड बदलना अनिवार्य है
          </h2>
          <p className="text-xs text-amber-100 mt-1">
            (Mandatory Password Change on First Login)
          </p>
        </div>

        {/* User identification info */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/60 px-6 py-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">लॉगिन उपयोगकर्ता:</span>
            <span className="font-bold text-gray-900 dark:text-white font-mono">{user.username}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-gray-600 dark:text-gray-400">नाम / भूमिका:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{user.name} ({user.role})</span>
          </div>
          {user.assignedSchoolUdise && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-gray-600 dark:text-gray-400">संबद्ध यू-डायस:</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{user.assignedSchoolUdise}</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800/60 text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              सुरक्षा नियमों के अनुसार प्रारंभिक खाते का पासवर्ड बदले बिना सिस्टम के किसी भी मॉड्यूल का उपयोग प्रतिबंधित है।
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                पासवर्ड सफलतापूर्वक बदल दिया गया है!
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                प्रणाली अब आपके लिए अनलॉक हो रही है...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  वर्तमान पासवर्ड (Current Password)
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="वर्तमान पासवर्ड दर्ज करें"
                    disabled={loading}
                    className="w-full px-3.5 pr-10 py-2.5 text-sm bg-white dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  नया सुरक्षित पासवर्ड (New Password - न्यूनतम 8 अक्षर)
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="नया पासवर्ड दर्ज करें (कम से कम 8 अक्षर)"
                    disabled={loading}
                    className="w-full px-3.5 pr-10 py-2.5 text-sm bg-white dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  नए पासवर्ड की पुष्टि (Confirm New Password)
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="नए पासवर्ड की पुनः पुष्टि करें"
                    disabled={loading}
                    className="w-full px-3.5 pr-10 py-2.5 text-sm bg-white dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>प्रमाणीकरण एवं अद्यतन हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <span>पासवर्ड बदलें एवं आगे बढ़ें</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={logout}
                  disabled={loading}
                  className="px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5 cursor-pointer"
                  title="लॉगआउट करें"
                >
                  <LogOut className="w-4 h-4" />
                  <span>लॉगआउट</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
