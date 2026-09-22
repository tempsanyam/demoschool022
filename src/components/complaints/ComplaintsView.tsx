import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  RotateCcw,
  CheckSquare,
  ShieldAlert,
  Send,
  User,
  Calendar,
  Building2,
  Check,
  FileText,
  History,
  Archive,
  ArrowRight,
  Phone,
  Tag,
  RefreshCw
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintStatus, ComplaintPriority, ComplaintHistoryItem } from '../../types';
import { triggerPrint } from '../../utils/printUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { SmartExportModal } from '../export/SmartExportModal';

export const ComplaintsView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    scopedComplaints,
    schools,
    selectedSchool,
    currentSchoolUdise,
    addComplaint,
    updateComplaint,
    resolveComplaint,
    closeComplaint,
    reopenComplaint,
    updateComplaintStatus,
    deleteComplaint,
    selectedSessionId
  } = useData();

  const isSchoolRestricted = currentUser?.role === 'SCHOOL';
  const userAssignedUdise = (currentUser?.assignedSchoolUdise || currentSchoolUdise || '').trim();

  const defaultComplaintUdise = isSchoolRestricted
    ? (userAssignedUdise || schools[0]?.udise || '')
    : (selectedSchool?.udise || schools[0]?.udise || '');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // New / Edit Complaint Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [formData, setFormData] = useState<Partial<Complaint>>({
    schoolUdise: defaultComplaintUdise,
    category: 'पेयजल/शौचालय समस्या',
    priority: 'HIGH',
    subject: '',
    title: '',
    description: '',
    submittedBy: currentUser?.name || 'पालक / शिक्षक',
    complainantName: currentUser?.name || 'पालक / शिक्षक',
    submitterMobile: currentUser?.mobile || '',
    complainantMobile: currentUser?.mobile || '',
    status: 'OPEN',
    resolutionNotes: '',
  });

  // Dedicated Resolution Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resolveForm, setResolveForm] = useState({
    resolutionNotes: '',
    resolutionDate: new Date().toISOString().split('T')[0],
    status: 'RESOLVED' as ComplaintStatus,
    resolutionOutcome: 'RESOLVED',
    forwardedToOfficer: '',
    forwardedRemarks: '',
  });

  // Dedicated Close Modal State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closingComplaint, setClosingComplaint] = useState<Complaint | null>(null);
  const [closeForm, setCloseForm] = useState({
    closeRemark: 'कार्य का भौतिक सत्यापन पूर्ण, शिकायत नस्तीबद्ध की गई।',
    closeDate: new Date().toISOString().split('T')[0],
  });

  // Dedicated Re-open Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopeningComplaint, setReopeningComplaint] = useState<Complaint | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  // Dedicated History / Timeline Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [viewingHistoryComplaint, setViewingHistoryComplaint] = useState<Complaint | null>(null);

  // Delete Confirm
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isSmartExportOpen, setIsSmartExportOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Role-wise Authorization Rules
  // ADMIN & CAC: Can perform actions across all authorized complaints
  // SCHOOL: Strictly restricted to their own school UDISE
  const canUserManage = (c: Complaint): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'CAC') return true;
    if (currentUser.role === 'SCHOOL') {
      return !!userAssignedUdise && c.schoolUdise === userAssignedUdise;
    }
    return false;
  };

  // 1. Can Start Progress (IN_PROGRESS): Allowed on OPEN, PENDING, or REOPENED
  const canUserStartProgress = (c: Complaint): boolean => {
    if (!canUserManage(c)) return false;
    return c.status === 'OPEN' || c.status === 'PENDING' || c.status === 'REOPENED' || (c.status as string) === 'RE_OPENED';
  };

  // 2. Can Resolve: Allowed on OPEN, PENDING, IN_PROGRESS, or REOPENED
  const canUserResolve = (c: Complaint): boolean => {
    if (!canUserManage(c)) return false;
    return c.status === 'OPEN' || c.status === 'PENDING' || c.status === 'IN_PROGRESS' || c.status === 'REOPENED' || (c.status as string) === 'RE_OPENED';
  };

  // 3. Can Close: Allowed ONLY on RESOLVED complaints
  const canUserClose = (c: Complaint): boolean => {
    if (!canUserManage(c)) return false;
    return c.status === 'RESOLVED';
  };

  // 4. Can Reopen: Allowed on RESOLVED or CLOSED complaints
  const canUserReopen = (c: Complaint): boolean => {
    if (!canUserManage(c)) return false;
    return c.status === 'RESOLVED' || c.status === 'CLOSED';
  };

  // 5. Can Delete: ADMIN/CAC or SCHOOL (only if still pending/open)
  const canUserDelete = (c: Complaint): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'CAC') return true;
    if (currentUser.role === 'SCHOOL') {
      return !!userAssignedUdise && c.schoolUdise === userAssignedUdise && (c.status === 'OPEN' || c.status === 'PENDING');
    }
    return false;
  };

  // Filtered Complaints (Strict Isolation Defense in Depth)
  const filteredComplaints = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return scopedComplaints.filter((c) => {
      if (isSchoolRestricted && userAssignedUdise && c.schoolUdise !== userAssignedUdise) {
        return false;
      }

      const matchSearch =
        !term ||
        (c.title || '').toLowerCase().includes(term) ||
        (c.subject || '').toLowerCase().includes(term) ||
        (c.complainantName || '').toLowerCase().includes(term) ||
        (c.submittedBy || '').toLowerCase().includes(term) ||
        (c.complainantMobile || '').toLowerCase().includes(term) ||
        (c.submitterMobile || '').toLowerCase().includes(term) ||
        (c.complaintId || '').toLowerCase().includes(term) ||
        (c.schoolUdise || '').toLowerCase().includes(term) ||
        (c.category || '').toLowerCase().includes(term) ||
        (c.actionTaken || '').toLowerCase().includes(term) ||
        (c.resolutionNotes || '').toLowerCase().includes(term) ||
        (c.closeRemark || '').toLowerCase().includes(term) ||
        (c.reopenReason || '').toLowerCase().includes(term);

      const matchStatus =
        selectedStatus === 'ALL' ||
        c.status === selectedStatus ||
        (selectedStatus === 'OPEN' && (c.status === 'OPEN' || c.status === 'PENDING')) ||
        (selectedStatus === 'REOPENED' && (c.status === 'REOPENED' || (c.status as string) === 'RE_OPENED'));

      const matchPriority = selectedPriority === 'ALL' || c.priority === selectedPriority;
      const matchCategory = selectedCategory === 'ALL' || c.category === selectedCategory;

      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [scopedComplaints, searchTerm, selectedStatus, selectedPriority, selectedCategory, isSchoolRestricted, userAssignedUdise]);

  // Lifecycle KPI Counts
  const counts = useMemo(() => {
    const total = scopedComplaints.length;
    const openCount = scopedComplaints.filter((c) => c.status === 'OPEN' || c.status === 'PENDING').length;
    const progressCount = scopedComplaints.filter((c) => c.status === 'IN_PROGRESS').length;
    const resolvedCount = scopedComplaints.filter((c) => c.status === 'RESOLVED').length;
    const closedCount = scopedComplaints.filter((c) => c.status === 'CLOSED').length;
    const reopenedCount = scopedComplaints.filter((c) => c.status === 'REOPENED' || (c.status as string) === 'RE_OPENED').length;
    return { total, openCount, progressCount, resolvedCount, closedCount, reopenedCount };
  }, [scopedComplaints]);

  // Handlers for Add / Edit
  const handleOpenAdd = () => {
    setEditingComplaint(null);
    setFormData({
      schoolUdise: defaultComplaintUdise,
      category: 'पेयजल/शौचालय समस्या',
      priority: 'HIGH',
      subject: '',
      title: '',
      description: '',
      submittedBy: currentUser?.name || 'प्रधानाध्यापक / शिक्षक',
      complainantName: currentUser?.name || 'प्रधानाध्यापक / शिक्षक',
      submitterMobile: currentUser?.mobile || '',
      complainantMobile: currentUser?.mobile || '',
      status: 'OPEN',
      resolutionNotes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Complaint) => {
    if (!canUserManage(c)) {
      alert('[ACCESS_DENIED] आपको केवल अपनी अधिकृत शाला की शिकायत संपादित करने की अनुमति है।');
      return;
    }
    setEditingComplaint(c);
    setFormData({
      ...c,
      subject: c.subject || c.title || '',
      title: c.title || c.subject || '',
      complainantName: c.complainantName || c.submittedBy || '',
      complainantMobile: c.complainantMobile || c.submitterMobile || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const titleVal = (formData.subject || formData.title || '').trim();
    if (!titleVal || !formData.schoolUdise) {
      alert('कृपया शिकायत का विषय/शीर्षक एवं विद्यालय का चयन करें।');
      return;
    }

    if (isSchoolRestricted && formData.schoolUdise !== userAssignedUdise) {
      alert('[ACCESS_DENIED] आप केवल अपनी अधिकृत शाला की शिकायत दर्ज या संपादित कर सकते हैं।');
      return;
    }

    try {
      if (editingComplaint) {
        updateComplaint({
          ...editingComplaint,
          ...formData,
          subject: titleVal,
          title: titleVal,
        } as Complaint);
        showToast('शिकायत विवरण सफलतापूर्वक अद्यतन किया गया।');
      } else {
        const today = new Date().toISOString().split('T')[0];
        addComplaint({
          ...formData,
          subject: titleVal,
          title: titleVal,
          submittedBy: formData.complainantName || currentUser?.name || 'प्रधानाध्यापक',
          complainantName: formData.complainantName || currentUser?.name || 'प्रधानाध्यापक',
          submitterRole: currentUser?.role === 'SCHOOL' ? 'प्रधानाध्यापक' : (currentUser?.role || 'अधिकृत अधिकारी'),
          date: today,
          complaintDate: today,
          status: 'OPEN',
        } as Omit<Complaint, 'id' | 'complaintId'>);
        showToast('नई जन शिकायत सफलतापूर्वक पंजीकृत की गई।');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'शिकायत सुरक्षित करने में त्रुटि हुई', 'error');
    }
  };

  // Handler for Start Progress (Quick transition to IN_PROGRESS)
  const handleStartProgress = (c: Complaint) => {
    if (!canUserStartProgress(c)) {
      alert('[ACCESS_DENIED] आपको केवल अपनी अधिकृत शाला की शिकायत पर कार्यवाही प्रारंभ करने की अनुमति है।');
      return;
    }
    try {
      updateComplaintStatus(c.id, 'IN_PROGRESS', 'सत्यापन उपरांत कार्यवाही प्रारंभ की गई।');
      showToast(`शिकायत ${c.complaintId || c.id} को 'कार्यवाही में (IN_PROGRESS)' स्थिति में अद्यतन किया गया।`);
    } catch (err: any) {
      showToast(err?.message || 'स्थिति अद्यतन में त्रुटि हुई', 'error');
    }
  };

  // Handlers for Resolution
  const handleOpenResolve = (c: Complaint) => {
    if (!canUserResolve(c)) {
      alert('[ACCESS_DENIED] आपको केवल अपनी अधिकृत शाला की शिकायत का निराकरण करने की अनुमति है।');
      return;
    }
    setResolvingComplaint(c);
    setResolveForm({
      resolutionNotes: c.actionTaken || c.resolutionNotes || '',
      resolutionDate: c.resolutionDate || new Date().toISOString().split('T')[0],
      status: 'RESOLVED',
      resolutionOutcome: 'RESOLVED',
      forwardedToOfficer: c.forwardedToOfficer || '',
      forwardedRemarks: c.forwardedRemarks || '',
    });
    setIsResolveModalOpen(true);
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint) return;

    if (isSchoolRestricted && resolvingComplaint.schoolUdise !== userAssignedUdise) {
      alert('[ACCESS_DENIED] आपको केवल अपनी अधिकृत शाला की शिकायत का निराकरण करने की अनुमति है।');
      setIsResolveModalOpen(false);
      return;
    }

    if (!resolveForm.resolutionNotes.trim()) {
      alert('कृपया निराकरण कार्यवाही का विवरण दर्ज करें।');
      return;
    }

    if (resolveForm.resolutionOutcome === 'FORWARDED' && !resolveForm.forwardedToOfficer.trim()) {
      alert('कृपया अग्रेषित किए जाने वाले अधिकारी का पद/विभाग दर्ज करें।');
      return;
    }

    try {
      const finalStatus: ComplaintStatus =
        resolveForm.resolutionOutcome === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS';

      resolveComplaint(resolvingComplaint.id, {
        resolutionNotes: resolveForm.resolutionNotes.trim(),
        resolutionDate: resolveForm.resolutionDate,
        status: finalStatus,
        resolutionOutcome: resolveForm.resolutionOutcome,
        forwardedToOfficer: resolveForm.forwardedToOfficer.trim(),
        forwardedRemarks: resolveForm.forwardedRemarks.trim(),
      });

      showToast(`शिकायत ${resolvingComplaint.complaintId || resolvingComplaint.id} का निराकरण सफलतापूर्वक दर्ज किया गया।`);
      setIsResolveModalOpen(false);
      setResolvingComplaint(null);
    } catch (err: any) {
      showToast(err?.message || 'निराकरण दर्ज करने में त्रुटि हुई', 'error');
    }
  };

  // Handlers for Close
  const handleOpenClose = (c: Complaint) => {
    if (!canUserClose(c)) {
      alert('[ACCESS_DENIED] केवल समाधान हो चुकी (RESOLVED) शिकायत को बंद (CLOSED) किया जा सकता है।');
      return;
    }
    setClosingComplaint(c);
    setCloseForm({
      closeRemark: 'कार्य का भौतिक सत्यापन पूर्ण, शिकायत नस्तीबद्ध की गई।',
      closeDate: new Date().toISOString().split('T')[0],
    });
    setIsCloseModalOpen(true);
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingComplaint) return;

    if (isSchoolRestricted && closingComplaint.schoolUdise !== userAssignedUdise) {
      alert('[ACCESS_DENIED] आपको केवल अपनी अधिकृत शाला की शिकायत बंद करने की अनुमति है।');
      setIsCloseModalOpen(false);
      return;
    }

    if (!closeForm.closeRemark.trim()) {
      alert('कृपया शिकायत बंद करने की टिप्पणी (Close Remark) दर्ज करें।');
      return;
    }

    try {
      closeComplaint(closingComplaint.id, {
        closeRemark: closeForm.closeRemark.trim(),
        closeDate: closeForm.closeDate,
      });
      showToast(`शिकायत ${closingComplaint.complaintId || closingComplaint.id} सफलतापूर्वक बंद (CLOSED) की गई।`);
      setIsCloseModalOpen(false);
      setClosingComplaint(null);
    } catch (err: any) {
      showToast(err?.message || 'शिकायत बंद करने में त्रुटि हुई', 'error');
    }
  };

  // Handlers for Re-opening
  const handleOpenReopen = (c: Complaint) => {
    if (!canUserReopen(c)) {
      alert('[ACCESS_DENIED] केवल समाधान हो चुकी (RESOLVED) या बंद (CLOSED) शिकायत को ही पुनः खोला जा सकता है।');
      return;
    }
    setReopeningComplaint(c);
    setReopenReason('');
    setIsReopenModalOpen(true);
  };

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopeningComplaint) return;

    if (isSchoolRestricted && reopeningComplaint.schoolUdise !== userAssignedUdise) {
      alert('[ACCESS_DENIED] आपको केवल अपनी अधिकृत शाला की शिकायत पुनः खोलने की अनुमति है।');
      setIsReopenModalOpen(false);
      return;
    }

    const trimmedReason = reopenReason.trim();
    if (trimmedReason.length < 5) {
      alert('कृपया शिकायत पुनः खोलने का स्पष्ट कारण (कम से कम 5 अक्षर) दर्ज करें।');
      return;
    }

    try {
      reopenComplaint(reopeningComplaint.id, trimmedReason);
      showToast(`शिकायत ${reopeningComplaint.complaintId || reopeningComplaint.id} पुनः सफलतापूर्वक खोली गई।`);
      setIsReopenModalOpen(false);
      setReopeningComplaint(null);
    } catch (err: any) {
      showToast(err?.message || 'शिकायत पुनः खोलने में त्रुटि हुई', 'error');
    }
  };

  // Handler for viewing history modal
  const handleOpenHistory = (c: Complaint) => {
    setViewingHistoryComplaint(c);
    setIsHistoryModalOpen(true);
  };

  // Export Payload for UnifiedPrintButton
  const getComplaintsExportPayload = () => {
    const headers = [
      'क्रमांक',
      'शिकायत क्र.',
      'शिकायत विषय / शीर्षक',
      'श्रेणी',
      'प्राथमिकता',
      'संबंधित विद्यालय UDISE',
      'शिकायतकर्ता',
      'मोबाइल',
      'मूल पंजीयन दिनांक',
      'वर्तमान स्थिति',
      'समाधान विवरण',
      'निराकरण दिनांक व कर्ता',
      'बंद दिनांक व कर्ता',
      'पुनः खोलने का विवरण',
      'इतिहास प्रविष्टियां'
    ];

    const rows = filteredComplaints.map((c, idx) => {
      let statusText = 'नई शिकायत (OPEN)';
      if (c.status === 'RESOLVED') statusText = 'समाधान किया गया (RESOLVED)';
      else if (c.status === 'CLOSED') statusText = 'बंद (CLOSED)';
      else if (c.status === 'REOPENED' || (c.status as string) === 'RE_OPENED') statusText = 'पुनः खोली गई (RE-OPENED)';
      else if (c.status === 'IN_PROGRESS') statusText = 'कार्यवाही में (IN_PROGRESS)';

      const resolutionInfo = c.resolutionDate
        ? `${c.resolutionDate} (${c.resolvedByName || ''}${c.resolverRole ? ` - ${c.resolverRole}` : ''})`
        : '-';
      const closeInfo = c.closeDate
        ? `${c.closeDate} (${c.closedByName || ''}${c.closerRole ? ` - ${c.closerRole}` : ''})`
        : '-';
      const reopenInfo = c.reopenedDate
        ? `${c.reopenedDate}${c.reopenReason ? `: ${c.reopenReason}` : ''} (${c.reopenedBy || ''})`
        : '-';

      return [
        idx + 1,
        c.complaintId || c.id,
        c.subject || c.title || '-',
        c.category,
        c.priority === 'HIGH' ? 'उच्च' : c.priority === 'MEDIUM' ? 'मध्यम' : 'सामान्य',
        c.schoolUdise,
        c.complainantName || c.submittedBy || '-',
        c.complainantMobile || c.submitterMobile || '-',
        c.complaintDate || c.date || c.createdAt || '-',
        statusText,
        c.actionTaken || c.resolutionNotes || c.remarks || '-',
        resolutionInfo,
        closeInfo,
        reopenInfo,
        Array.isArray(c.complaintHistory) ? `${c.complaintHistory.length} प्रविष्टियां` : '0'
      ];
    });

    return {
      title: 'जन शिक्षा केंद्र मलगुवां - जन शिकायत एवं समस्या निवारण पंजी (Lifecycle Register)',
      subtitle: `सत्र ${selectedSessionId} | कुल शिकायतें: ${filteredComplaints.length}`,
      session: selectedSessionId,
      headers,
      rows,
      fileName: `Complaints_Lifecycle_${selectedSessionId}`,
    };
  };

  // Helper for Status Badge Component
  const renderStatusBadge = (status: ComplaintStatus | string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>समाधान किया गया (RESOLVED)</span>
          </span>
        );
      case 'CLOSED':
        return (
          <span className="bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-gray-300 dark:border-gray-700">
            <Archive className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            <span>बंद (CLOSED)</span>
          </span>
        );
      case 'REOPENED':
      case 'RE_OPENED':
        return (
          <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-200 dark:border-purple-800">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            <span>पुनः खोली गई (RE-OPENED)</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>कार्यवाही में (IN_PROGRESS)</span>
          </span>
        );
      case 'OPEN':
      case 'PENDING':
      default:
        return (
          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>नई शिकायत (OPEN)</span>
          </span>
        );
    }
  };

  return (
    <div id="complaints-main-view" className="space-y-5 animate-in fade-in duration-150">
      {/* Notification Toast */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <span>जन शिकायत एवं समस्या निवारण (Grievance Redressal)</span>
            </h2>
            <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              कुल {filteredComplaints.length} प्रकरण
            </span>
            {isSchoolRestricted && (
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>केवल मेरी शाला: {userAssignedUdise}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            शिकायत जीवनचक्र (OPEN ➔ IN_PROGRESS ➔ RESOLVED ➔ CLOSED ➔ RE-OPENED) व पारदर्शी ऑडिट ट्रेल
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <UnifiedPrintButton
            id="complaints-unified-print"
            currentSession={selectedSessionId}
            onPrintCurrentView={() => triggerPrint()}
            onPrintReport={() => setIsSmartExportOpen(true)}
            currentViewLabel="प्रिंट पंजी"
            currentViewSubtext="वर्तमान जनशिकायत पंजी व स्थिति तालिका का प्रिंट"
            reportLabel="A4 रिपोर्ट"
            reportSubtext="शिकायत निवारण प्रतिवेदन / स्मार्ट रिपोर्ट प्रारूप"
            exportPayload={getComplaintsExportPayload}
          />
          <button
            id="btn-add-complaint"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#0B6B4B] hover:bg-[#09573D] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>नई शिकायत दर्ज करें</span>
          </button>
        </div>
      </div>

      {/* Interactive Lifecycle KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <button
          type="button"
          onClick={() => setSelectedStatus('ALL')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'ALL'
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-500 shadow-xs ring-2 ring-[#0B6B4B]'
              : 'bg-white dark:bg-[#17211C] border-gray-200 dark:border-gray-800 hover:border-gray-300'
          }`}
        >
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">कुल शिकायतें</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{counts.total}</div>
        </button>

        {/* OPEN */}
        <button
          type="button"
          onClick={() => setSelectedStatus('OPEN')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'OPEN'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 shadow-xs ring-2 ring-amber-500'
              : 'bg-white dark:bg-[#17211C] border-gray-200 dark:border-gray-800 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>नई / लंबित</span>
          </div>
          <div className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-0.5">{counts.openCount}</div>
        </button>

        {/* IN_PROGRESS */}
        <button
          type="button"
          onClick={() => setSelectedStatus('IN_PROGRESS')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'IN_PROGRESS'
              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 shadow-xs ring-2 ring-blue-500'
              : 'bg-white dark:bg-[#17211C] border-gray-200 dark:border-gray-800 hover:border-blue-300'
          }`}
        >
          <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            <span>कार्यवाही में</span>
          </div>
          <div className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-0.5">{counts.progressCount}</div>
        </button>

        {/* RESOLVED */}
        <button
          type="button"
          onClick={() => setSelectedStatus('RESOLVED')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'RESOLVED'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 shadow-xs ring-2 ring-emerald-500'
              : 'bg-white dark:bg-[#17211C] border-gray-200 dark:border-gray-800 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>समाधान किया गया</span>
          </div>
          <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">{counts.resolvedCount}</div>
        </button>

        {/* CLOSED */}
        <button
          type="button"
          onClick={() => setSelectedStatus('CLOSED')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'CLOSED'
              ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-500 shadow-xs ring-2 ring-gray-600'
              : 'bg-white dark:bg-[#17211C] border-gray-200 dark:border-gray-800 hover:border-gray-400'
          }`}
        >
          <div className="text-[11px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500 inline-block"></span>
            <span>बंद (Closed)</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-200 mt-0.5">{counts.closedCount}</div>
        </button>

        {/* REOPENED */}
        <button
          type="button"
          onClick={() => setSelectedStatus('REOPENED')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'REOPENED'
              ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-400 shadow-xs ring-2 ring-purple-500'
              : 'bg-white dark:bg-[#17211C] border-gray-200 dark:border-gray-800 hover:border-purple-300'
          }`}
        >
          <div className="text-[11px] font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
            <span>पुनः खोली गई</span>
          </div>
          <div className="text-xl font-bold text-purple-900 dark:text-purple-200 mt-0.5">{counts.reopenedCount}</div>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            id="input-search-complaints"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="विषय, शिकायत क्र., शाला, शिकायतकर्ता, फोन..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B6B4B]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown */}
          <select
            id="select-complaint-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-semibold text-gray-800 dark:text-gray-200"
          >
            <option value="ALL">सभी स्थितियां (All)</option>
            <option value="OPEN">नई / लंबित (OPEN)</option>
            <option value="IN_PROGRESS">कार्यवाही में (IN_PROGRESS)</option>
            <option value="RESOLVED">समाधान किया गया (RESOLVED)</option>
            <option value="CLOSED">बंद (CLOSED)</option>
            <option value="REOPENED">पुनः खोली गई (RE-OPENED)</option>
          </select>

          {/* Category Dropdown */}
          <select
            id="select-complaint-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-800 dark:text-gray-200"
          >
            <option value="ALL">सभी श्रेणियां</option>
            <option value="पेयजल/शौचालय समस्या">पेयजल / शौचालय</option>
            <option value="भवन व विद्युत मरम्मत">भवन व विद्युत मरम्मत</option>
            <option value="मध्याह्न भोजन">मध्याह्न भोजन</option>
            <option value="शिक्षक अनुपस्थिति/लेट">शिक्षक उपस्थिति</option>
            <option value="छात्रवृत्ति/गणवेश वितरण">छात्रवृत्ति / गणवेश</option>
            <option value="अधोसंरचना">अधोसंरचना</option>
            <option value="प्रशासनिक व अन्य">प्रशासनिक व अन्य</option>
          </select>

          {/* Priority Dropdown */}
          <select
            id="select-complaint-priority"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-800 dark:text-gray-200"
          >
            <option value="ALL">सभी प्राथमिकताएं</option>
            <option value="HIGH">उच्च प्राथमिकता (High)</option>
            <option value="MEDIUM">मध्यम (Medium)</option>
            <option value="LOW">सामान्य (Low)</option>
          </select>
        </div>
      </div>

      {/* Complaints Grid */}
      {filteredComplaints.length === 0 ? (
        <div className="bg-white dark:bg-[#17211C] p-12 text-center rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            कोई शिकायत प्रकरण नहीं मिला
          </p>
          <p className="text-xs text-gray-500 mt-1">
            दिए गए फ़िल्टर अथवा खोज मापदंड में कोई शिकायत दर्ज नहीं है।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredComplaints.map((c) => {
            const sObj = schools.find((s) => s.udise === c.schoolUdise);
            const isResolved = c.status === 'RESOLVED';
            const isClosed = c.status === 'CLOSED';
            const isReopened = c.status === 'REOPENED' || (c.status as string) === 'RE_OPENED';
            const isInProgress = c.status === 'IN_PROGRESS';
            const isOpen = c.status === 'OPEN' || c.status === 'PENDING';

            const canManageThis = canUserManage(c);
            const canStartThis = canUserStartProgress(c);
            const canResolveThis = canUserResolve(c);
            const canCloseThis = canUserClose(c);
            const canReopenThis = canUserReopen(c);
            const canDeleteThis = canUserDelete(c);

            const historyCount = Array.isArray(c.complaintHistory) ? c.complaintHistory.length : 0;

            return (
              <div
                key={c.id}
                id={`complaint-card-${c.id}`}
                className={`bg-white dark:bg-[#17211C] p-4 rounded-xl border shadow-xs flex flex-col justify-between transition-all ${
                  isClosed
                    ? 'border-gray-300 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 opacity-90'
                    : isResolved
                    ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10'
                    : isReopened
                    ? 'border-purple-200 dark:border-purple-900/50 bg-purple-50/10'
                    : isInProgress
                    ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/10'
                    : 'border-[#DDE7E2] dark:border-[#2B3933]'
                }`}
              >
                <div>
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-2.5 py-0.5 rounded">
                        {c.category}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                        {c.complaintId || c.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.priority === 'HIGH'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : c.priority === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {c.priority === 'HIGH' ? 'उच्च' : c.priority === 'MEDIUM' ? 'मध्यम' : 'सामान्य'}
                      </span>
                      {renderStatusBadge(c.status)}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {c.subject || c.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                    {c.description}
                  </p>

                  {/* Details Summary Box */}
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-[#0F1713] rounded-lg text-xs space-y-1.5 border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> शाला:
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {sObj?.name || sObj?.hindiName || c.schoolUdise} ({c.schoolUdise})
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> शिकायतकर्ता:
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {c.complainantName || c.submittedBy || 'अज्ञात'}{' '}
                        {c.submitterRole ? `(${c.submitterRole})` : ''} -{' '}
                        {c.complainantMobile || c.submitterMobile || 'मो. उपलब्ध नहीं'}
                      </span>
                    </div>

                    {/* Original Complaint Date - Strictly Immutable */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> मूल पंजीयन दिनांक:
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {c.complaintDate || c.date || c.createdAt || '-'}
                      </span>
                    </div>

                    {/* Re-opened Banner if currently REOPENED or was ever reopened */}
                    {(c.reopenedDate || isReopened) && (
                      <div className="p-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded text-purple-900 dark:text-purple-300 text-[11px] mt-1.5">
                        <div className="font-bold flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-purple-600" />
                          <span>पुनः खोली गई दिनांक: {c.reopenedDate || '-'}</span>
                          {c.reopenedBy && <span className="font-normal">({c.reopenedBy})</span>}
                        </div>
                        {c.reopenReason && (
                          <div className="mt-0.5 text-gray-700 dark:text-gray-300">
                            <strong>पुनः खोलने का कारण:</strong> {c.reopenReason}
                          </div>
                        )}
                        <div className="text-[10px] text-purple-700 dark:text-purple-400 mt-0.5 italic">
                          * मूल पंजीयन दिनांक ({c.complaintDate || c.date}) अपरिवर्तित रखी गई है।
                        </div>
                      </div>
                    )}

                    {/* Resolution Details Card */}
                    {(isResolved || c.resolutionDate) && (
                      <div className="pt-2 mt-2 border-t border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 rounded-lg space-y-1">
                        <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>निराकरण विवरण (Resolution Details)</span>
                          </span>
                          <span className="text-[11px] font-medium">
                            दिनांक: {c.resolutionDate || '-'}
                          </span>
                        </div>
                        <div className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                          {c.actionTaken || c.resolutionNotes || c.remarks || 'निराकरण कार्य पूर्ण किया गया।'}
                        </div>
                        {c.resolvedByName && (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 pt-0.5">
                            <strong>निराकरणकर्ता:</strong> {c.resolvedByName}{' '}
                            {c.resolverRole ? `(${c.resolverRole})` : ''}
                          </div>
                        )}
                        {c.forwardedToOfficer && (
                          <div className="text-[11px] text-blue-700 dark:text-blue-300">
                            <strong>अग्रेषित:</strong> {c.forwardedToOfficer}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Closed Details Card */}
                    {(isClosed || c.closeDate) && (
                      <div className="pt-2 mt-2 border-t border-gray-300 dark:border-gray-700 bg-gray-100/70 dark:bg-gray-800/50 p-2.5 rounded-lg space-y-1">
                        <div className="flex items-center justify-between text-gray-800 dark:text-gray-200 font-bold">
                          <span className="flex items-center gap-1">
                            <Archive className="w-3.5 h-3.5 text-gray-600" />
                            <span>शिकायत नस्तीबद्ध / बंद (Closed Details)</span>
                          </span>
                          <span className="text-[11px] font-medium">
                            दिनांक: {c.closeDate || '-'}
                          </span>
                        </div>
                        {c.closeRemark && (
                          <div className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-[11px]">
                            <strong>टिप्पणी:</strong> {c.closeRemark}
                          </div>
                        )}
                        {c.closedByName && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            <strong>सत्यापनकर्ता:</strong> {c.closedByName}{' '}
                            {c.closerRole ? `(${c.closerRole})` : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons Toolbar */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 flex-wrap">
                  {/* Timeline History Button - Always Available */}
                  <button
                    id={`btn-history-complaint-${c.id}`}
                    onClick={() => handleOpenHistory(c)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="कार्यवाही का पूरा इतिहास व ऑडिट देखें"
                  >
                    <History className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>कार्यवाही इतिहास</span>
                    {historyCount > 0 && (
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.2 rounded-full text-[10px]">
                        {historyCount}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 1. कार्यवाही प्रारंभ करें (Start Progress): Shown for OPEN or REOPENED */}
                    {canStartThis && (
                      <button
                        id={`btn-start-progress-${c.id}`}
                        onClick={() => handleStartProgress(c)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                        title="शिकायत पर कार्यवाही प्रारंभ करें"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>कार्यवाही प्रारंभ करें</span>
                      </button>
                    )}

                    {/* 2. निराकरण करें (Resolve): Shown for OPEN, IN_PROGRESS, REOPENED */}
                    {canResolveThis && (
                      <button
                        id={`btn-resolve-complaint-${c.id}`}
                        onClick={() => handleOpenResolve(c)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                        title="शिकायत का निराकरण दर्ज करें"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>निराकरण करें</span>
                      </button>
                    )}

                    {/* 3. शिकायत बंद करें (Close): Shown for RESOLVED */}
                    {canCloseThis && (
                      <button
                        id={`btn-close-complaint-${c.id}`}
                        onClick={() => handleOpenClose(c)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                        title="सत्यापन उपरांत शिकायत बंद करें"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>शिकायत बंद करें (Close)</span>
                      </button>
                    )}

                    {/* 4. पुनः खोलें (Re-open): Shown for RESOLVED or CLOSED */}
                    {canReopenThis && (
                      <button
                        id={`btn-reopen-complaint-${c.id}`}
                        onClick={() => handleOpenReopen(c)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                        title="असंतुष्ट होने पर शिकायत पुनः खोलें"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>पुनः खोलें (Re-open)</span>
                      </button>
                    )}

                    {/* 5. विवरण / संपादित करें */}
                    {canManageThis && (
                      <button
                        id={`btn-edit-complaint-${c.id}`}
                        onClick={() => handleOpenEdit(c)}
                        className="px-2 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-medium flex items-center gap-1"
                        title="शिकायत विवरण अद्यतन करें"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>संपादित</span>
                      </button>
                    )}

                    {/* 6. Delete Button */}
                    {canDeleteThis && (
                      <button
                        id={`btn-delete-complaint-${c.id}`}
                        onClick={() => setDeleteTargetId(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                        title="शिकायत हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DEDICATED RESOLUTION MODAL */}
      {/* ========================================================================= */}
      {isResolveModalOpen && resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    शिकायत का निराकरण दर्ज करें (Resolve)
                  </h3>
                  <p className="text-xs text-gray-500">
                    प्रकरण क्र.: {resolvingComplaint.complaintId || resolvingComplaint.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsResolveModalOpen(false);
                  setResolvingComplaint(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Complaint Summary Box */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">विषय / समस्या:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {resolvingComplaint.subject || resolvingComplaint.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">संबंधित शाला:</span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                  {schools.find((s) => s.udise === resolvingComplaint.schoolUdise)?.name || resolvingComplaint.schoolUdise}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">मूल पंजीयन दिनांक:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {resolvingComplaint.complaintDate || resolvingComplaint.date}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">शिकायतकर्ता:</span>
                <span>{resolvingComplaint.complainantName || resolvingComplaint.submittedBy}</span>
              </div>
            </div>

            {/* Resolution Form */}
            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs mt-4">
              {/* Resolution Action Notes */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  निराकरण विवरण (की गई कार्यवाही) *
                </label>
                <textarea
                  id="input-resolution-notes"
                  rows={4}
                  value={resolveForm.resolutionNotes}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
                  placeholder="उदा. शाला प्रबंधन समिति एवं आकस्मिक निधि से नल टोटियां बदलवाकर जलापूर्ति सुचारू रूप से चालू की गई।"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  समस्या समाधान हेतु उठाए गए कदमों एवं वर्तमान स्थिति का स्पष्ट विवरण दर्ज करें।
                </p>
              </div>

              {/* Resolution Date & Outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    निराकरण दिनांक *
                  </label>
                  <input
                    id="input-resolution-date"
                    type="date"
                    value={resolveForm.resolutionDate}
                    onChange={(e) => setResolveForm({ ...resolveForm, resolutionDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    निराकरण परिणाम (Outcome) *
                  </label>
                  <select
                    id="select-resolution-outcome"
                    value={resolveForm.resolutionOutcome}
                    onChange={(e) =>
                      setResolveForm({
                        ...resolveForm,
                        resolutionOutcome: e.target.value,
                        status: e.target.value === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS',
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold"
                  >
                    <option value="RESOLVED">✓ पूर्ण समाधान किया गया (RESOLVED)</option>
                    <option value="PARTIAL">◷ आंशिक समाधान / कार्य प्रगति पर (IN_PROGRESS)</option>
                    <option value="FORWARDED">➔ उच्चाधिकारी / अन्य विभाग को अग्रेषित (IN_PROGRESS)</option>
                  </select>
                </div>
              </div>

              {/* Conditional fields if Forwarded */}
              {resolveForm.resolutionOutcome === 'FORWARDED' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
                  <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    <span>उच्च अधिकारी / विभाग अग्रेषण विवरण</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      अधिकारी का पद / नाम / विभाग *
                    </label>
                    <input
                      id="input-forwarded-officer"
                      type="text"
                      value={resolveForm.forwardedToOfficer}
                      onChange={(e) => setResolveForm({ ...resolveForm, forwardedToOfficer: e.target.value })}
                      placeholder="उदा. सहायक यंत्री (RES) / BRC / PHE विभाग"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      required={resolveForm.resolutionOutcome === 'FORWARDED'}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      अग्रेषण टिप्पणी / विवरण
                    </label>
                    <input
                      id="input-forwarded-remarks"
                      type="text"
                      value={resolveForm.forwardedRemarks}
                      onChange={(e) => setResolveForm({ ...resolveForm, forwardedRemarks: e.target.value })}
                      placeholder="उदा. तकनीकी प्राक्कलन एवं बजटीय स्वीकृति हेतु प्रेषित"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* User Identity Display */}
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                <User className="w-4 h-4 text-emerald-600" />
                <span>
                  <strong>निराकरणकर्ता:</strong> {currentUser?.name || currentUser?.username} (
                  {currentUser?.role === 'SCHOOL' ? 'शिक्षक / संस्था प्रभारी (SCHOOL)' : currentUser?.role})
                </span>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsResolveModalOpen(false);
                    setResolvingComplaint(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  id="btn-submit-resolution"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>निराकरण सुरक्षित करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEDICATED CLOSE MODAL */}
      {/* ========================================================================= */}
      {isCloseModalOpen && closingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    शिकायत बंद करें (Close Complaint)
                  </h3>
                  <p className="text-xs text-gray-500">
                    प्रकरण क्र.: {closingComplaint.complaintId || closingComplaint.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCloseModalOpen(false);
                  setClosingComplaint(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 p-3 bg-gray-50 dark:bg-[#0F1713] rounded-lg text-xs space-y-1 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">समस्या:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {closingComplaint.subject || closingComplaint.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">समाधान विवरण:</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  {closingComplaint.actionTaken || closingComplaint.resolutionNotes || 'कार्य पूर्ण'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">मूल पंजीयन दिनांक:</span>
                <span>{closingComplaint.complaintDate || closingComplaint.date}</span>
              </div>
            </div>

            <form onSubmit={handleCloseSubmit} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  बंद करने का दिनांक *
                </label>
                <input
                  id="input-close-date"
                  type="date"
                  value={closeForm.closeDate}
                  onChange={(e) => setCloseForm({ ...closeForm, closeDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  सत्यापन एवं नस्तीबद्ध टिप्पणी (Close Remark) *
                </label>
                <textarea
                  id="input-close-remark"
                  rows={3}
                  value={closeForm.closeRemark}
                  onChange={(e) => setCloseForm({ ...closeForm, closeRemark: e.target.value })}
                  placeholder="उदा. कार्य का भौतिक सत्यापन पूर्ण, शिकायतकर्ता संतुष्ट, शिकायत नस्तीबद्ध की गई।"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                />
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-700 dark:text-slate-300">
                <strong>सत्यापनकर्ता:</strong> {currentUser?.name} ({currentUser?.role === 'SCHOOL' ? 'शिक्षक / संस्था प्रभारी' : currentUser?.role})
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCloseModalOpen(false);
                    setClosingComplaint(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  id="btn-confirm-close"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>शिकायत बंद करें (Confirm Close)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED RE-OPEN COMPLAINT MODAL */}
      {/* ========================================================================= */}
      {isReopenModalOpen && reopeningComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-700 dark:text-purple-300">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    शिकायत पुनः खोलें (Re-open Complaint)
                  </h3>
                  <p className="text-xs text-gray-500">
                    प्रकरण क्र.: {reopeningComplaint.complaintId || reopeningComplaint.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsReopenModalOpen(false);
                  setReopeningComplaint(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Immutability Notice Box */}
            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-900 dark:text-purple-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-purple-600" />
                <span>पंजीयन तिथि संरक्षण सूचना (Data Protection):</span>
              </div>
              <p className="leading-relaxed">
                शिकायत की <strong>मूल पंजीयन दिनांक ({reopeningComplaint.complaintDate || reopeningComplaint.date}) सदैव सुरक्षित व अपरिवर्तित रहेगी</strong>। पुराना समाधान विवरण नष्ट नहीं होगा बल्कि इतिहास में सुरक्षित रहेगा।
              </p>
            </div>

            <form onSubmit={handleReopenSubmit} className="space-y-4 text-xs mt-4">
              <div className="p-2.5 bg-gray-50 dark:bg-[#0F1713] rounded-lg text-gray-700 dark:text-gray-300">
                <strong>शिकायत:</strong> {reopeningComplaint.subject || reopeningComplaint.title}
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  पुनः खोलने का कारण / विवरण (कम से कम 5 अक्षर) *
                </label>
                <textarea
                  id="input-reopen-reason"
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="उदा. मरम्मत के 2 दिन पश्चात पुनः टोटियों से लीकेज शुरू हो गया है अथवा समस्या का पूर्ण निवारण नहीं हुआ।"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="p-2.5 bg-gray-50 dark:bg-[#0F1713] rounded-lg text-[11px] text-gray-600 dark:text-gray-400">
                <strong>पुनः खोलने वाले अधिकारी:</strong> {currentUser?.name} ({currentUser?.role})
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsReopenModalOpen(false);
                    setReopeningComplaint(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  id="btn-confirm-reopen"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>पुनः खोलें (Confirm Re-open)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DEDICATED HISTORY & TIMELINE MODAL */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && viewingHistoryComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>शिकायत कार्यवाही इतिहास एवं ऑडिट ट्रेल</span>
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    ID: {viewingHistoryComplaint.complaintId || viewingHistoryComplaint.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setViewingHistoryComplaint(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Complaint Meta Ribbon */}
            <div className="my-3 p-3 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-800 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {viewingHistoryComplaint.subject || viewingHistoryComplaint.title}
                </span>
                {renderStatusBadge(viewingHistoryComplaint.status)}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-gray-400 pt-1">
                <span>
                  <strong>शाला:</strong> {schools.find((s) => s.udise === viewingHistoryComplaint.schoolUdise)?.name || viewingHistoryComplaint.schoolUdise}
                </span>
                <span>•</span>
                <span>
                  <strong>मूल पंजीयन:</strong> {viewingHistoryComplaint.complaintDate || viewingHistoryComplaint.date}
                </span>
                <span>•</span>
                <span>
                  <strong>शिकायतकर्ता:</strong> {viewingHistoryComplaint.complainantName || viewingHistoryComplaint.submittedBy}
                </span>
              </div>
            </div>

            {/* Timeline Events Scroll Area */}
            <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-4">
              {!viewingHistoryComplaint.complaintHistory || viewingHistoryComplaint.complaintHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  इस शिकायत के लिए कोई विस्तृत इतिहास प्रविष्टि उपलब्ध नहीं है।
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
                  {viewingHistoryComplaint.complaintHistory.map((h: ComplaintHistoryItem, idx: number) => {
                    const isCreate = h.action === 'CREATED';
                    const isProgress = h.action === 'IN_PROGRESS';
                    const isResolve = h.action === 'RESOLVED';
                    const isClose = h.action === 'CLOSED';
                    const isReopen = h.action === 'REOPENED';

                    const dotColor = isClose
                      ? 'bg-gray-500'
                      : isReopen
                      ? 'bg-purple-600'
                      : isResolve
                      ? 'bg-emerald-600'
                      : isProgress
                      ? 'bg-blue-600'
                      : 'bg-amber-500';

                    const actionHindi =
                      isCreate
                        ? 'नई शिकायत पंजीकृत'
                        : isProgress
                        ? 'कार्यवाही प्रारंभ (In Progress)'
                        : isResolve
                        ? 'समाधान दर्ज किया गया (Resolved)'
                        : isClose
                        ? 'शिकायत बंद की गई (Closed)'
                        : isReopen
                        ? 'शिकायत पुनः खोली गई (Re-opened)'
                        : 'स्थिति अद्यतन';

                    return (
                      <div key={h.id || idx} className="relative group text-xs">
                        {/* Dot Icon */}
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#17211C] ${dotColor} flex items-center justify-center text-white shadow-xs`}
                        >
                          {isResolve ? (
                            <Check className="w-3 h-3" />
                          ) : isClose ? (
                            <Archive className="w-2.5 h-2.5" />
                          ) : isReopen ? (
                            <RotateCcw className="w-2.5 h-2.5" />
                          ) : isProgress ? (
                            <Clock className="w-2.5 h-2.5" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                        </div>

                        {/* Event Content Card */}
                        <div className="bg-gray-50 dark:bg-[#0F1713] p-3 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white">
                                {actionHindi}
                              </span>
                              {h.previousStatus && h.newStatus && h.previousStatus !== h.newStatus && (
                                <span className="bg-gray-200 dark:bg-gray-800 text-[10px] px-1.5 py-0.5 rounded font-mono text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                  <span>{h.previousStatus}</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                  <span>{h.newStatus}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-500 font-mono">
                              {h.dateTime || h.date || h.timestamp}
                            </span>
                          </div>

                          {(h.remark || h.reason) && (
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                              {h.remark || h.reason}
                            </p>
                          )}

                          {h.forwardedTo && (
                            <p className="text-blue-700 dark:text-blue-300 font-semibold">
                              अग्रेषित अधिकारी: {h.forwardedTo}
                            </p>
                          )}

                          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 pt-1 border-t border-gray-200/50 dark:border-gray-800">
                            <User className="w-3 h-3" />
                            <span>
                              {h.userName || h.userId || 'उपयोगकर्ता'} {h.userRole ? `(${h.userRole})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setViewingHistoryComplaint(null);
                }}
                className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD / EDIT COMPLAINT MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              {editingComplaint ? 'शिकायत विवरण संपादित करें' : 'नई जन शिकायत दर्ज करें'}
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  शिकायत का विषय / शीर्षक *
                </label>
                <input
                  id="input-complaint-title"
                  type="text"
                  value={formData.subject || formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value, title: e.target.value })}
                  placeholder="उदा. हैंडपंप खराब होने से पेयजल संकट"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    शिकायत श्रेणी *
                  </label>
                  <select
                    id="select-complaint-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="पेयजल/शौचालय समस्या">पेयजल / शौचालय समस्या</option>
                    <option value="भवन व विद्युत मरम्मत">भवन व विद्युत मरम्मत</option>
                    <option value="मध्याह्न भोजन">मध्याह्न भोजन गुणवत्ता</option>
                    <option value="शिक्षक अनुपस्थिति/लेट">शिक्षक उपस्थिति</option>
                    <option value="छात्रवृत्ति/गणवेश वितरण">छात्रवृत्ति एवं गणवेश</option>
                    <option value="अधोसंरचना">अधोसंरचना / निर्माण</option>
                    <option value="प्रशासनिक व अन्य">प्रशासनिक व अन्य</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    प्राथमिकता (Priority)
                  </label>
                  <select
                    id="select-complaint-form-priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as ComplaintPriority })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="HIGH">उच्च (High Priority)</option>
                    <option value="MEDIUM">मध्यम (Medium)</option>
                    <option value="LOW">सामान्य (Low)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  संबंधित विद्यालय *
                </label>
                {isSchoolRestricted ? (
                  <div className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-lg text-[#0B6B4B] dark:text-emerald-200 font-bold truncate">
                    {schools.find((s) => s.udise === defaultComplaintUdise)?.name ||
                      schools.find((s) => s.udise === defaultComplaintUdise)?.hindiName ||
                      'मेरी शाला'}{' '}
                    ({defaultComplaintUdise})
                  </div>
                ) : (
                  <select
                    id="select-complaint-school"
                    value={formData.schoolUdise}
                    onChange={(e) => setFormData({ ...formData, schoolUdise: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    {schools.map((s) => (
                      <option key={s.udise} value={s.udise}>
                        {s.name || s.hindiName} ({s.udise})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  समस्या का विस्तृत विवरण *
                </label>
                <textarea
                  id="input-complaint-description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    शिकायतकर्ता का नाम
                  </label>
                  <input
                    id="input-complainant-name"
                    type="text"
                    value={formData.complainantName || formData.submittedBy || ''}
                    onChange={(e) => setFormData({ ...formData, complainantName: e.target.value, submittedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    मोबाइल नंबर
                  </label>
                  <input
                    id="input-complainant-mobile"
                    type="tel"
                    value={formData.complainantMobile || formData.submitterMobile || ''}
                    onChange={(e) => setFormData({ ...formData, complainantMobile: e.target.value, submitterMobile: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  id="btn-submit-complaint"
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-[#0B6B4B] hover:bg-[#09573D] rounded-lg shadow-sm"
                >
                  सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DELETE CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="शिकायत रिकॉर्ड हटाने की पुष्टि"
        message="क्या आप वास्तव में इस शिकायत को हटाना चाहते हैं? यह कार्यवाही ऑडिट लॉग में दर्ज की जाएगी।"
        confirmText="हटाएं"
        cancelText="रद्द करें"
        isDestructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteComplaint(deleteTargetId);
            setDeleteTargetId(null);
            showToast('शिकायत रिकॉर्ड सफलतापूर्वक हटा दिया गया।');
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* ========================================================================= */}
      {/* 7. SMART EXPORT MODAL FOR COMPLAINTS */}
      {/* ========================================================================= */}
      <SmartExportModal
        isOpen={isSmartExportOpen}
        onClose={() => setIsSmartExportOpen(false)}
        initialType="COMPLETE_SCHOOL"
        initialUdise={defaultComplaintUdise}
      />
    </div>
  );
};
