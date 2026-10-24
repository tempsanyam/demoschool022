import React, { useState, useRef, useEffect } from 'react';
import {
  FolderLock,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  FileText,
  Building2,
  Calendar,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Printer,
  FileSpreadsheet,
  Image as ImageIcon,
  File as FileGenericIcon,
  HardDrive
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { enforceRuntimeFeatureAccess } from '../../config/featureControlRegistry';
import { DocumentCategory, DocumentItem } from '../../types';
import { institutionConfig } from '../../config/institutionConfig';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import {
  validateDocumentFile,
  formatDocumentSize,
  readFileAsDataURL,
  saveDocumentBinary,
  getDocumentBinary,
  downloadFile,
  StoredDocumentBinary
} from '../../utils/documentStorage';

export const DocumentsView: React.FC = () => {
  const {
    scopedDocuments,
    addDocument,
    deleteDocument,
    schools,
    selectedSchoolUdise,
    selectedSessionId,
  } = useData();
  const { currentUser } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewBinary, setPreviewBinary] = useState<StoredDocumentBinary | null>(null);
  const [isLoadingBinary, setIsLoadingBinary] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'error' | 'info' | 'success'; message: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('GOV_ORDER');
  const [schoolUdise, setSchoolUdise] = useState<string>(selectedSchoolUdise || 'ALL');
  const [documentNumber, setDocumentNumber] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'PDF' | 'EXCEL' | 'WORD' | 'IMAGE' | 'OTHER'>('PDF');
  const [fileSize, setFileSize] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessBanner, setUploadSuccessBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef<number>(0);

  const isCAC = currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN';
  const isSchoolUser = currentUser?.role === 'SCHOOL';

  const categoryOptions: { key: DocumentCategory; label: string }[] = [
    { key: 'GOV_ORDER', label: 'शासकीय आदेश (Gov Orders)' },
    { key: 'CIRCULAR', label: 'परिपत्र (Circulars)' },
    { key: 'CERTIFICATE', label: 'प्रमाण पत्र / UC (Certificates)' },
    { key: 'SCHOOL_DOC', label: 'विद्यालय दस्तावेज (School Docs)' },
    { key: 'INSPECTION', label: 'निरीक्षण फोटोग्राफ (Inspection)' },
    { key: 'MDM_DOC', label: 'MDM दस्तावेज (MDM Docs)' },
    { key: 'WORK_DOC', label: 'कार्य दस्तावेज (Work Docs)' },
    { key: 'STUDENT_DOC', label: 'विद्यार्थी प्रपत्र (Student Docs)' },
    { key: 'TEACHER_DOC', label: 'शिक्षक सेवा अभिलेख (Teacher Docs)' },
    { key: 'OTHER', label: 'अन्य प्रपत्र (Other Docs)' },
  ];

  // Filter documents
  const term = (searchTerm || '').trim().toLowerCase();
  const filteredDocs = scopedDocuments.filter((doc) => {
    if (categoryFilter !== 'ALL' && doc.category !== categoryFilter) return false;
    if (
      term &&
      !(doc.title || '').toLowerCase().includes(term) &&
      !(doc.documentNumber && doc.documentNumber.toLowerCase().includes(term)) &&
      !(doc.description && doc.description.toLowerCase().includes(term)) &&
      !(doc.fileName && doc.fileName.toLowerCase().includes(term))
    ) {
      return false;
    }
    return true;
  });

  // Load preview binary on selection
  useEffect(() => {
    if (!previewDoc) {
      setPreviewBinary(null);
      setIsLoadingBinary(false);
      return;
    }
    setIsLoadingBinary(true);
    getDocumentBinary(
      previewDoc.id,
      previewDoc.schoolUdise,
      currentUser?.role,
      currentUser?.assignedSchoolUdise
    )
      .then((bin) => {
        setPreviewBinary(bin);
      })
      .catch((err) => {
        console.warn('Binary preview load error:', err);
        setPreviewBinary(null);
      })
      .finally(() => {
        setIsLoadingBinary(false);
      });
  }, [previewDoc, currentUser]);

  // Handle File Chosen (via file picker or drop)
  const handleFileChosen = (file: File) => {
    setFileError(null);
    const validation = validateDocumentFile(file);
    if (!validation.isValid) {
      setFileError(validation.errorMessage || 'यह फाइल प्रकार समर्थित नहीं है।');
      setSelectedFile(null);
      setSelectedFileDataUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setFileSize(formatDocumentSize(file.size));
    setFileType(validation.normalizedFileType);

    // Auto-populate document title if not set
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      setTitle(cleanName);
    }

    // Read Data URL for persistence and immediate preview
    readFileAsDataURL(file)
      .then((dataUrl) => {
        setSelectedFileDataUrl(dataUrl);
      })
      .catch((err) => {
        console.warn('FileReader warning:', err);
      });
  };

  // Drag and Drop Event Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDraggingOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileChosen(file);
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    setSelectedFileDataUrl(null);
    setFileError(null);
    setFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload Submit Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (!selectedFile) {
      setFileError('कृपया अपलोड करने हेतु पहले एक फाइल का चयन करें।');
      return;
    }

    if (!title.trim()) {
      setFileError('कृपया दस्तावेज का शीर्षक / नाम दर्ज करें।');
      return;
    }

    if (!category) {
      setFileError('दस्तावेज़ प्रकार चुनें');
      return;
    }

    const effectiveSchoolUdise = isSchoolUser
      ? (currentUser?.assignedSchoolUdise || 'ALL')
      : (schoolUdise || 'ALL');

    try {
      setIsUploading(true);

      // 1. Read binary Data URL
      const dataUrl = selectedFileDataUrl || (await readFileAsDataURL(selectedFile));

      // 2. Generate unique Document ID
      const newDocId = `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // 3. Save actual binary into IndexedDB with UDISE scoping
      await saveDocumentBinary(newDocId, selectedFile, dataUrl, effectiveSchoolUdise);

      // 4. Save metadata into DataContext state & localStorage
      addDocument({
        id: newDocId,
        title: title.trim(),
        category,
        schoolUdise: effectiveSchoolUdise,
        sessionId: selectedSessionId,
        documentNumber: documentNumber.trim() || undefined,
        date: new Date().toISOString().split('T')[0],
        uploadedBy: currentUser?.name || 'प्राधिकृत अधिकारी',
        fileType: fileType,
        fileSize: formatDocumentSize(selectedFile.size),
        fileSizeBytes: selectedFile.size,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        hasStoredBinary: true,
        description: description.trim() || undefined,
        uploadedAt: new Date().toISOString(),
        isUserUploaded: true,
      });

      // 5. Success feedback
      setUploadSuccessBanner('फाइल सफलतापूर्वक अपलोड हो गई।');

      setTimeout(() => {
        setIsUploadModalOpen(false);
        setTitle('');
        setDocumentNumber('');
        setDescription('');
        handleClearSelectedFile();
        setUploadSuccessBanner(null);
        setIsUploading(false);
      }, 1000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setFileError(err.message || 'दस्तावेज सुरक्षित करने में तकनीकी त्रुटि हुई।');
      setIsUploading(false);
    }
  };

  // Download Handler (Real Binary Download)
  const handleDownload = async (doc: DocumentItem) => {
    setActionNotice(null);
    const fcCheck = enforceRuntimeFeatureAccess('module.documents.action.download', currentUser?.role, 'दस्तावेज डाउनलोड करना (downloadDocument)');
    if (!fcCheck.allowed) {
      setActionNotice({ type: 'error', message: fcCheck.message });
      return;
    }

    // School security check
    if (isSchoolUser) {
      const userUdise = currentUser?.assignedSchoolUdise;
      if (doc.schoolUdise && doc.schoolUdise !== 'ALL' && doc.schoolUdise !== userUdise) {
        setActionNotice({
          type: 'error',
          message: 'ACCESS_DENIED: आप केवल अपने विद्यालय के दस्तावेज ही डाउनलोड कर सकते हैं।',
        });
        return;
      }
    }

    try {
      // 1. Check IndexedDB / memory with strict role & UDISE verification
      const binary = await getDocumentBinary(
        doc.id,
        doc.schoolUdise,
        currentUser?.role,
        currentUser?.assignedSchoolUdise
      );
      if (binary && binary.dataUrl) {
        const ext = binary.fileName.split('.').pop() || doc.fileType.toLowerCase();
        const safeName = doc.fileName || `${doc.title.replace(/[/\\?%*:|"<>]/g, '_')}.${ext}`;
        downloadFile(binary.dataUrl, safeName, binary.mimeType, currentUser?.role);
        return;
      }

      // 2. Check doc.fileData
      if (doc.fileData) {
        const safeName = doc.fileName || `${doc.title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
        downloadFile(doc.fileData, safeName, doc.mimeType || 'application/pdf', currentUser?.role);
        return;
      }

      // 3. Fallback for cloud metadata-only or seed records without local IndexedDB binary
      const storageNote = doc.hasStoredBinary
        ? 'नोट: इस दस्तावेज़ का मेटाडेटा क्लाउड (Firestore) से सिंक है, परंतु मूल बाइनरी फाइल अपलोड करने वाले डिवाइस के स्थानीय IndexedDB में सुरक्षित है।'
        : 'यह आधिकारिक डिजिटल अभिलेखागार मेटाडेटा प्रमाणिक प्रतिलिपि है।';
      const textContent = `${institutionConfig.institutionName} (${institutionConfig.block}, ${institutionConfig.district}) - शैक्षिक एवं प्रशासनिक प्रबंधन प्रणाली\n\nशासकीय डिजिटल अभिलेखागार रिकॉर्ड:\n----------------------------------------\nदस्तावेज शीर्षक: ${doc.title}\nक्रमांक: ${doc.documentNumber || 'लागू नहीं'}\nश्रेणी: ${getCategoryBadgeLabel(doc.category)}\nसंबद्ध विद्यालय यूडाइस: ${doc.schoolUdise || 'समस्त संकुल'}\nशैक्षणिक सत्र: ${doc.sessionId || selectedSessionId}\nदिनांक: ${doc.date}\nअपलोडकर्ता: ${doc.uploadedBy}\nप्रारूप: ${doc.fileType}\nआकार: ${doc.fileSize}\n\nविवरण:\n${doc.description || 'कोई अतिरिक्त विवरण दर्ज नहीं है।'}\n\n----------------------------------------\n${storageNote}`;
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title.replace(/[/\\?%*:|"<>]/g, '_')}_Metadata_Record.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      setActionNotice({
        type: 'error',
        message: err?.message || 'दस्तावेज डाउनलोड करने में त्रुटि हुई।',
      });
    }
  };

  // Delete Handler with Authorization Check
  const handleDelete = (doc: DocumentItem) => {
    setActionNotice(null);
    if (isSchoolUser) {
      const userUdise = currentUser?.assignedSchoolUdise;
      if (doc.schoolUdise !== userUdise) {
        setActionNotice({
          type: 'error',
          message: 'ACCESS_DENIED: आप केवल अपने विद्यालय के दस्तावेज ही हटा सकते हैं।',
        });
        return;
      }
    }

    const confirmed = window.confirm(`क्या आप निश्चित रूप से "${doc.title}" को डिजिटल अभिलेखागार से हटाना चाहते हैं?`);
    if (confirmed) {
      deleteDocument(doc.id);
      if (previewDoc?.id === doc.id) {
        setPreviewDoc(null);
      }
    }
  };

  const getCategoryBadgeLabel = (cat: DocumentCategory) => {
    const found = categoryOptions.find((c) => c.key === cat);
    return found ? found.label.split(' (')[0] : cat;
  };

  const getDocumentsExportPayload = () => {
    const headers = [
      'क्रमांक',
      'दस्तावेज शीर्षक',
      'मूल फाइल नाम',
      'श्रेणी',
      'आदेश क्रमांक',
      'विद्यालय यूडाइस',
      'शैक्षणिक सत्र',
      'अपलोड दिनांक',
      'फाइल प्रकार',
      'आकार',
      'अपलोडकर्ता'
    ];
    const rows = filteredDocs.map((doc, idx) => [
      idx + 1,
      doc.title,
      doc.fileName || '-',
      getCategoryBadgeLabel(doc.category),
      doc.documentNumber || '-',
      doc.schoolUdise || 'समस्त संकुल',
      doc.sessionId || selectedSessionId,
      doc.date,
      doc.fileType,
      doc.fileSize,
      doc.uploadedBy
    ]);
    return {
      title: 'जन शिक्षा केंद्र मलगुवां - डिजिटल दस्तावेज अभिलेखागार पंजी',
      subtitle: `कुल दस्तावेज: ${filteredDocs.length} | सत्र: ${selectedSessionId} | दिनांक: ${new Date().toLocaleDateString('hi-IN')}`,
      headers,
      rows,
      fileName: `Documents_Archive_${selectedSessionId}_${Date.now()}`
    };
  };

  const renderFileIcon = (type: string, className = 'w-4 h-4') => {
    switch (type) {
      case 'PDF':
        return <FileText className={className} />;
      case 'EXCEL':
        return <FileSpreadsheet className={className} />;
      case 'IMAGE':
        return <ImageIcon className={className} />;
      case 'WORD':
        return <FileText className={className} />;
      default:
        return <FileGenericIcon className={className} />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#0B6B4B]/10 text-[#0B6B4B] dark:text-emerald-400">
            <FolderLock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                दस्तावेज, प्रपत्र एवं डिजिटल अभिलेखागार
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                सत्र: {selectedSessionId}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              शासकीय आदेश, परिपत्र, स्कूल रिकॉर्ड, निरीक्षण फोटो एवं उपयोगिता प्रमाण पत्र
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isFeatureEnabled('module.documents.action.print_export') && (
            <UnifiedPrintButton
              id="documents-unified-print"
              onPrintCurrentView={() => window.print()}
              currentViewLabel="Print Current View"
              currentViewSubtext="दस्तावेज अभिलेखागार सूची व स्थिति तालिका का त्वरित प्रिंट"
              exportPayload={getDocumentsExportPayload}
            />
          )}
          {isFeatureEnabled('module.documents.action.upload') && (
            <button
              id="open-upload-modal-btn"
              onClick={() => {
                handleClearSelectedFile();
                setIsUploadModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              नया दस्तावेज अपलोड करें
            </button>
          )}
        </div>
      </div>

      {/* Action / Security Feedback Banner */}
      {actionNotice && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in ${
            actionNotice.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            id="documents-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="दस्तावेज का नाम, क्रमांक, फाइल या विवरण खोजें..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="documents-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
          >
            <option value="ALL">समस्त श्रेणियां</option>
            {categoryOptions.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#17211C] p-12 text-center rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-500">
            <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="font-semibold text-sm">कोई दस्तावेज उपलब्ध नहीं है।</p>
            <p className="text-xs text-gray-400 mt-1">फ़िल्टर बदलकर पुनः प्रयास करें या नया दस्तावेज अपलोड करें।</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const school = doc.schoolUdise && doc.schoolUdise !== 'ALL'
              ? schools.find((s) => s.udise === doc.schoolUdise)
              : null;
            const canDelete = isCAC || (isSchoolUser && doc.schoolUdise === currentUser?.assignedSchoolUdise);

            return (
              <div
                key={doc.id}
                id={`document-card-${doc.id}`}
                className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs hover:border-[#0B6B4B] dark:hover:border-emerald-600 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {getCategoryBadgeLabel(doc.category)}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                      {renderFileIcon(doc.fileType, 'w-3 h-3')}
                      <span>{doc.fileType} • {doc.fileSize}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2" title={doc.title}>
                    {doc.title}
                  </h3>

                  {doc.fileName && (
                    <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 truncate flex items-center gap-1">
                      <span>📄</span>
                      <span className="truncate">{doc.fileName}</span>
                    </div>
                  )}

                  {doc.documentNumber && (
                    <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                      क्रमांक: {doc.documentNumber}
                    </div>
                  )}

                  {school ? (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#0B6B4B]" />
                      <span className="truncate">{school.name || school.hindiName} ({school.udise})</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#0B6B4B]" />
                      <span>समस्त संकुल</span>
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-wrap">
                    <Calendar className="w-3 h-3" />
                    <span>दिनांक: {doc.date}</span>
                    <span>• {doc.uploadedBy}</span>
                  </div>

                  {doc.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 pt-1">
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 mt-3">
                  <button
                    id={`view-doc-btn-${doc.id}`}
                    onClick={() => setPreviewDoc(doc)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#EAF6F0] dark:bg-emerald-950 hover:bg-[#0B6B4B] hover:text-white text-[#0B6B4B] dark:text-emerald-300 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    अवलोकन (View)
                  </button>

                  {isFeatureEnabled('module.documents.action.download') && (
                    <button
                      id={`download-doc-btn-${doc.id}`}
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      title="डाउनलोड करें"
                    >
                      <Download className="w-4 h-4 text-[#FF7A00]" />
                    </button>
                  )}

                  {canDelete && isFeatureEnabled('module.documents.action.delete') && (
                    <button
                      id={`delete-doc-btn-${doc.id}`}
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="हटाएं"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Document View Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0B6B4B] text-white">
                  {renderFileIcon(previewDoc.fileType, 'w-4 h-4')}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    दस्तावेज पूर्वावलोकन एवं विवरण
                  </h3>
                  <span className="text-[11px] text-gray-500 font-mono">
                    ID: {previewDoc.id} • सत्र: {previewDoc.sessionId || selectedSessionId}
                  </span>
                </div>
              </div>
              <button
                id="close-preview-modal-btn"
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {/* Document Details Box */}
              <div className="p-4 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
                <div className="font-bold text-sm text-gray-900 dark:text-white">
                  {previewDoc.title}
                </div>
                {previewDoc.fileName && (
                  <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                    मूल फाइल: {previewDoc.fileName}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-gray-600 dark:text-gray-300 pt-1">
                  <div>श्रेणी: <span className="font-semibold text-gray-900 dark:text-white">{getCategoryBadgeLabel(previewDoc.category)}</span></div>
                  <div>क्रमांक: <span className="font-semibold text-gray-900 dark:text-white">{previewDoc.documentNumber || 'लागू नहीं'}</span></div>
                  <div>प्रारूप: <span className="font-semibold uppercase text-gray-900 dark:text-white">{previewDoc.fileType}</span></div>
                  <div>दिनांक: <span className="font-semibold text-gray-900 dark:text-white">{previewDoc.date}</span></div>
                  <div>आकार: <span className="font-semibold text-gray-900 dark:text-white">{previewDoc.fileSize}</span></div>
                  <div>अपलोडकर्ता: <span className="font-semibold text-gray-900 dark:text-white">{previewDoc.uploadedBy}</span></div>
                </div>
                {previewDoc.description && (
                  <div className="pt-2 text-gray-700 dark:text-gray-200 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-semibold">विवरण / टिप्पणी:</span> {previewDoc.description}
                  </div>
                )}
              </div>

              {/* Embedded File Viewer Area */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-100 dark:bg-black/40 min-h-[160px] flex items-center justify-center">
                {isLoadingBinary ? (
                  <div className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0B6B4B] mb-2" />
                    <span>फाइल लोड हो रही है...</span>
                  </div>
                ) : previewBinary?.dataUrl ? (
                  previewBinary.mimeType.startsWith('image/') ? (
                    <div className="p-2 w-full flex justify-center">
                      <img
                        src={previewBinary.dataUrl}
                        alt={previewDoc.title}
                        className="max-h-80 w-auto rounded-lg object-contain shadow-xs"
                      />
                    </div>
                  ) : previewBinary.mimeType === 'application/pdf' ? (
                    <div className="w-full flex flex-col">
                      <iframe
                        src={previewBinary.dataUrl}
                        title={previewDoc.title}
                        className="w-full h-80 border-0 bg-white"
                      />
                      <div className="p-2 bg-gray-200 dark:bg-gray-800 text-center text-xs">
                        <button
                          onClick={() => handleDownload(previewDoc)}
                          className="inline-flex items-center gap-1 text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          मूल PDF फाइल डाउनलोड करें
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-2">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-[#0B6B4B]">
                        {renderFileIcon(previewDoc.fileType, 'w-6 h-6')}
                      </div>
                      <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
                        {previewDoc.fileName || previewDoc.title}
                      </div>
                      <p className="text-xs text-gray-500">
                        यह ऑफिस / डेटा दस्तावेज सीधे डाउनलोड करने हेतु उपलब्ध है।
                      </p>
                      <button
                        onClick={() => handleDownload(previewDoc)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        डाउनलोड करें ({previewDoc.fileSize})
                      </button>
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center space-y-2 text-gray-500">
                    <HardDrive className="w-8 h-8 mx-auto text-amber-500" />
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {previewDoc.hasStoredBinary
                        ? 'मेटाडेटा क्लाउड से सिंक है • मूल बाइनरी अपलोडर डिवाइस के IndexedDB में सुरक्षित है'
                        : 'डिजिटल अभिलेखागार मेटाडेटा रिकॉर्ड सुरक्षित है'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      {previewDoc.hasStoredBinary
                        ? 'Firebase Storage की अनुपस्थिति में दस्तावेज़ मेटाडेटा Firestore में सिंक होता है और 25 MB तक की बाइनरी फाइल स्थानीय ब्राउज़र IndexedDB में रहती है। आप नीचे दिए बटन से प्रमाणिक मेटाडेटा रिकॉर्ड कॉपी डाउनलोड कर सकते हैं।'
                        : 'प्रशासनिक मेटाडेटा रिकॉर्ड कॉपी डाउनलोड करने हेतु नीचे दिए बटन का उपयोग करें।'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                प्रिंट
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="preview-close-btn"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  बंद करें
                </button>
                <button
                  id="preview-download-btn"
                  onClick={() => handleDownload(previewDoc)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डिजिटल कॉपी डाउनलोड करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Working Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0B6B4B] text-white">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    नया शासकीय दस्तावेज / प्रपत्र अपलोड करें
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    सत्र: {selectedSessionId}
                  </p>
                </div>
              </div>
              <button
                id="close-upload-modal-btn"
                onClick={() => {
                  if (!isUploading) {
                    setIsUploadModalOpen(false);
                    handleClearSelectedFile();
                  }
                }}
                disabled={isUploading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {uploadSuccessBanner && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccessBanner}</span>
              </div>
            )}

            {fileError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300 text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs sm:text-sm">
              {/* Actual Working Dropzone */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  दस्तावेज फाइल अपलोड करें: <span className="text-red-500">*</span>
                </label>

                {!selectedFile ? (
                  <div
                    id="document-upload-dropzone"
                    role="button"
                    tabIndex={0}
                    aria-label="दस्तावेज़ फाइल अपलोड करें"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4B] ${
                      isDraggingOver
                        ? 'border-[#0B6B4B] bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-[#0B6B4B] scale-[1.01]'
                        : 'border-gray-300 dark:border-gray-700 hover:border-[#0B6B4B] dark:hover:border-emerald-500 bg-gray-50/70 dark:bg-[#0F1713]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      id="document-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
                      className="hidden"
                      tabIndex={-1}
                      aria-hidden="true"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChosen(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <div
                        className={`p-2.5 rounded-full transition-transform ${
                          isDraggingOver
                            ? 'bg-[#0B6B4B] text-white scale-110'
                            : 'bg-[#0B6B4B]/10 text-[#0B6B4B] dark:text-emerald-400'
                        }`}
                      >
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">
                        {isDraggingOver
                          ? 'यहाँ फाइल छोड़ें (Drop file here)'
                          : 'फाइल खींचें अथवा क्लिक करके अपलोड करें'}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG (अधिकतम 25 MB)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-[#0B6B4B] text-white shrink-0">
                        {renderFileIcon(fileType, 'w-5 h-5')}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate"
                          title={selectedFile.name}
                        >
                          📄 {selectedFile.name}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span className="font-semibold text-[#0B6B4B] dark:text-emerald-400">
                            {formatDocumentSize(selectedFile.size)}
                          </span>
                          <span>•</span>
                          <span className="uppercase font-mono font-bold text-gray-700 dark:text-gray-300">
                            {fileType}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      id="remove-selected-file-btn"
                      type="button"
                      onClick={handleClearSelectedFile}
                      className="px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      हटाएँ
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  दस्तावेज शीर्षक / नाम: <span className="text-red-500">*</span>
                </label>
                <input
                  id="document-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. उपयोगिता प्रमाण पत्र (UC) - प्राथमिक शाला जनकपुर"
                  required
                  className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    दस्तावेज श्रेणी: <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="document-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    संबद्ध विद्यालय:
                  </label>
                  {isSchoolUser ? (
                    <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold text-xs truncate">
                      {schools.find((s) => s.udise === currentUser.assignedSchoolUdise)?.name ||
                        schools.find((s) => s.udise === currentUser.assignedSchoolUdise)?.hindiName ||
                        currentUser.assignedSchoolUdise}{' '}
                      ({currentUser.assignedSchoolUdise})
                    </div>
                  ) : (
                    <select
                      id="document-school-select"
                      value={schoolUdise}
                      onChange={(e) => setSchoolUdise(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="ALL">समस्त संकुल / सामान्य</option>
                      {schools.map((s) => (
                        <option key={s.udise} value={s.udise}>
                          {s.name || s.hindiName} ({s.udise})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    दस्तावेज / पत्र क्रमांक (वैकल्पिक):
                  </label>
                  <input
                    id="document-number-input"
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="उदा. MALG/2026/104"
                    className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    फाइल प्रारूप:
                  </label>
                  <select
                    id="document-filetype-select"
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="PDF">PDF (.pdf)</option>
                    <option value="EXCEL">Excel / CSV (.xlsx / .csv)</option>
                    <option value="WORD">Word (.docx / .doc)</option>
                    <option value="IMAGE">Image (.jpg / .png)</option>
                    <option value="OTHER">अन्य प्रारूप</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  दस्तावेज का संक्षिप्त विवरण / टिप्पणी:
                </label>
                <textarea
                  id="document-description-textarea"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="दस्तावेज का उद्देश्य व आवश्यक विवरण यहाँ दर्ज करें..."
                  className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  id="cancel-upload-btn"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    handleClearSelectedFile();
                  }}
                  disabled={isUploading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  रद्द करें
                </button>
                <button
                  id="submit-upload-btn"
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>अपलोड हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>दस्तावेज सुरक्षित करें</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
