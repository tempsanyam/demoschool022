import React, { useState } from 'react';
import {
  BellRing,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Send,
  Building2,
  Users,
  Eye,
  Check
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    addNotification,
    markNotificationAsRead,
    schools,
    selectedSchoolUdise
  } = useData();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'NORMAL'>('ALL');
  const [targetFilter, setTargetFilter] = useState<'ALL' | 'TEACHERS' | 'PRINCIPALS' | 'SCHOOLS'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState(`ORDER/MALG/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [targetType, setTargetType] = useState<'ALL' | 'PRINCIPALS' | 'TEACHERS' | 'SPECIFIC_SCHOOL'>('ALL');
  const [targetSchoolUdise, setTargetSchoolUdise] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const isCAC = currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERATOR';

  // Filter notifications based on search, priority, target, and school context
  const filteredNotifications = notifications.filter((notif) => {
    // School context filter if a school is selected
    if (selectedSchoolUdise && notif.targetSchoolUdise && notif.targetSchoolUdise !== selectedSchoolUdise) {
      return false;
    }

    // Search filter
    if (
      searchTerm &&
      !notif.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !notif.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(notif.orderNumber && notif.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    ) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'ALL' && notif.priority !== priorityFilter) {
      return false;
    }

    // Target filter
    if (targetFilter !== 'ALL') {
      if (targetFilter === 'PRINCIPALS' && notif.targetAudience !== 'PRINCIPALS') return false;
      if (targetFilter === 'TEACHERS' && notif.targetAudience !== 'TEACHERS') return false;
      if (targetFilter === 'SCHOOLS' && notif.targetAudience !== 'SPECIFIC_SCHOOL') return false;
    }

    return true;
  });

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    addNotification({
      title: title.trim(),
      message: message.trim(),
      orderNumber: orderNumber.trim(),
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate || undefined,
      priority,
      targetAudience: targetType,
      targetSchoolUdise: targetType === 'SPECIFIC_SCHOOL' ? targetSchoolUdise : undefined,
      attachmentUrl: attachmentUrl.trim() || undefined,
      readBy: currentUser ? [currentUser.id] : [],
    });

    setIsCreateModalOpen(false);
    // Reset form
    setTitle('');
    setMessage('');
    setOrderNumber(`ORDER/MALG/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
    setPriority('NORMAL');
    setTargetType('ALL');
    setTargetSchoolUdise('');
    setDueDate('');
    setAttachmentUrl('');
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return <span className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 font-bold px-2 py-0.5 rounded text-[10px]">अति आवश्यक / तत्काल</span>;
      case 'HIGH':
        return <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold px-2 py-0.5 rounded text-[10px]">उच्च प्राथमिकता</span>;
      default:
        return <span className="bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">सामान्य सूचना</span>;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#0B6B4B]/10 text-[#0B6B4B] dark:text-emerald-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                शासकीय सूचनाएं, आदेश एवं परिपत्र
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                संकुल मलगुवां के सभी विद्यालयों, संस्था प्रभारियों एवं शिक्षकों हेतु आधिकारिक निर्देश
              </p>
            </div>
          </div>
        </div>

        {isCAC && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            नया आदेश / सूचना जारी करें
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="आदेश क्रमांक, शीर्षक या विवरण खोजें..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
          >
            <option value="ALL">सभी प्राथमिकता</option>
            <option value="URGENT">🚨 अति आवश्यक</option>
            <option value="HIGH">⚠️ उच्च प्राथमिकता</option>
            <option value="NORMAL">ℹ️ सामान्य</option>
          </select>

          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
          >
            <option value="ALL">सभी लक्ष्य समूह</option>
            <option value="PRINCIPALS">🏫 संस्था प्रभारी (Principals)</option>
            <option value="TEACHERS">✍️ शिक्षक (Teachers)</option>
            <option value="SCHOOLS">🏛️ विशिष्ट विद्यालय</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-[#17211C] p-12 text-center rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-500">
            <BellRing className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="font-semibold text-sm">कोई सूचना या आदेश उपलब्ध नहीं है।</p>
            <p className="text-xs text-gray-400 mt-1">फ़िल्टर बदलकर पुनः प्रयास करें या नया आदेश जारी करें।</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isRead = currentUser ? notif.readBy.includes(currentUser.id) : false;
            const targetSchool = notif.targetSchoolUdise
              ? schools.find((s) => s.udise === notif.targetSchoolUdise)
              : null;

            return (
              <div
                key={notif.id}
                className={`bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border transition-all ${
                  isRead
                    ? 'border-[#DDE7E2] dark:border-[#2B3933]'
                    : 'border-[#0B6B4B]/40 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(notif.priority)}
                      {notif.orderNumber && (
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[10px] px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                          {notif.orderNumber}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {notif.date}
                      </span>
                      {notif.dueDate && (
                        <span className="text-[11px] text-[#FF7A00] font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          अंतिम तिथि: {notif.dueDate}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {notif.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                        <Users className="w-3 h-3 text-[#0B6B4B]" />
                        लक्ष्य: {
                          notif.targetAudience === 'ALL'
                            ? 'समस्त विद्यालय व शिक्षक'
                            : notif.targetAudience === 'PRINCIPALS'
                            ? 'केवल संस्था प्रभारी'
                            : notif.targetAudience === 'TEACHERS'
                            ? 'केवल शिक्षक'
                            : `विशिष्ट विद्यालय: ${targetSchool ? (targetSchool.hindiName || targetSchool.name) : notif.targetSchoolUdise}`
                        }
                      </span>

                      {notif.attachmentUrl && (
                        <a
                          href={notif.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[#0B6B4B] dark:text-emerald-400 font-semibold hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800"
                        >
                          <FileText className="w-3 h-3" />
                          संलग्न दस्तावेज देखें
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0">
                    {!isRead && currentUser && (
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="flex items-center gap-1.5 bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 hover:bg-[#0B6B4B] hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        पढ़ा गया चिह्नित करें
                      </button>
                    )}
                    {isRead && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        पढ़ा गया
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Notification Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0B6B4B] text-white">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  नया शासकीय आदेश / परिपत्र जारी करें
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    आदेश क्रमांक:
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    प्राथमिकता स्तर:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                  >
                    <option value="NORMAL">सामान्य सूचना</option>
                    <option value="HIGH">उच्च प्राथमिकता</option>
                    <option value="URGENT">अति आवश्यक / तत्काल</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  विषय / शीर्षक:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. सत्र 2026-27 के लिए छात्रवृत्ति सत्यापन के संबंध में"
                  required
                  className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  आदेश विवरण / निर्देश संदेश:
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="विस्तृत निर्देश एवं कार्यवाही के बिंदु यहाँ दर्ज करें..."
                  required
                  className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    लक्ष्य समूह (Target):
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="ALL">समस्त 37 विद्यालय (क्लस्टर)</option>
                    <option value="PRINCIPALS">केवल संस्था प्रभारी (Principals)</option>
                    <option value="TEACHERS">केवल शिक्षकगण (Teachers)</option>
                    <option value="SPECIFIC_SCHOOL">विशिष्ट विद्यालय (Single School)</option>
                  </select>
                </div>

                {targetType === 'SPECIFIC_SCHOOL' && (
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      विद्यालय चुनें:
                    </label>
                    <select
                      value={targetSchoolUdise}
                      onChange={(e) => setTargetSchoolUdise(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="">विद्यालय चुनें...</option>
                      {schools.map((s) => (
                        <option key={s.udise} value={s.udise}>
                          {s.hindiName || s.name} ({s.udise.slice(-4)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    पालन की अंतिम तिथि (वैकल्पिक):
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  संलग्न दस्तावेज लिंक (PDF/Document URL - वैकल्पिक):
                </label>
                <input
                  type="text"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://educationportal.mp.gov.in/orders/2026/malguwa_order.pdf"
                  className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                >
                  आदेश जारी करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
