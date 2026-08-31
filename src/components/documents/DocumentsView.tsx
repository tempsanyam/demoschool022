import React, { useState } from 'react';
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
  Upload
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { DocumentCategory, DocumentItem } from '../../types';
import { institutionConfig } from '../../config/institutionConfig';

export const DocumentsView: React.FC = () => {
  const {
    scopedDocuments,
    addDocument,
    deleteDocument,
    schools,
    selectedSchoolUdise
  } = useData();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('GOV_ORDER');
  const [schoolUdise, setSchoolUdise] = useState<string>(selectedSchoolUdise || 'ALL');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('1.2 MB');
  const [fileType, setFileType] = useState('PDF');
  const [description, setDescription] = useState('');

  const isCAC = currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERATOR';

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

  const filteredDocs = scopedDocuments.filter((doc) => {
    if (categoryFilter !== 'ALL' && doc.category !== categoryFilter) return false;
    if (
      searchTerm &&
      !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(doc.documentNumber && doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !(doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addDocument({
      title: title.trim(),
      category,
      schoolUdise: schoolUdise || 'ALL',
      documentNumber: documentNumber.trim() || undefined,
      date: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser?.name || 'प्राधिकृत अधिकारी',
      fileType: fileType || 'PDF',
      fileSize: fileSize || '1.5 MB',
      fileUrl: fileUrl.trim() || 'https://educationportal.mp.gov.in/docs/sample.pdf',
      description: description.trim() || undefined,
    });

    setIsUploadModalOpen(false);
    setTitle('');
    setDocumentNumber('');
    setDescription('');
    setFileUrl('');
  };

  const handleSimulateDownload = (doc: DocumentItem) => {
    const textContent = `${institutionConfig.institutionName} (${institutionConfig.block}, ${institutionConfig.district}) - शैक्षिक एवं प्रशासनिक प्रबंधन प्रणाली\n\nदस्तावेज विवरण:\nशीर्षक: ${doc.title}\nक्रमांक: ${doc.documentNumber || 'N/A'}\nश्रेणी: ${doc.category}\nदिनांक: ${doc.date}\nअपलोडकर्ता: ${doc.uploadedBy}\nआकार: ${doc.fileSize}\n\nयह ${institutionConfig.institutionName} का आधिकारिक डिजिटल रिकॉर्ड है।`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryBadgeLabel = (cat: DocumentCategory) => {
    const found = categoryOptions.find((c) => c.key === cat);
    return found ? found.label.split(' (')[0] : cat;
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              दस्तावेज, प्रपत्र एवं डिजिटल अभिलेखागार
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              शासकीय आदेश, परिपत्र, स्कूल रिकॉर्ड, निरीक्षण फोटो एवं उपयोगिता प्रमाण पत्र
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          नया दस्तावेज अपलोड करें
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="दस्तावेज का नाम, क्रमांक या विवरण खोजें..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <select
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
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs hover:border-[#0B6B4B] dark:hover:border-emerald-600 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {getCategoryBadgeLabel(doc.category)}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {doc.fileType} • {doc.fileSize}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                    {doc.title}
                  </h3>

                  {doc.documentNumber && (
                    <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                      क्रमांक: {doc.documentNumber}
                    </div>
                  )}

                  {school ? (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#0B6B4B]" />
                      <span className="truncate">{school.name || school.hindiName}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#0B6B4B]" />
                      <span>समस्त संकुल</span>
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
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
                    onClick={() => setPreviewDoc(doc)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#EAF6F0] dark:bg-emerald-950 hover:bg-[#0B6B4B] hover:text-white text-[#0B6B4B] dark:text-emerald-300 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    अवलोकन (View)
                  </button>

                  <button
                    onClick={() => handleSimulateDownload(doc)}
                    className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="डाउनलोड करें"
                  >
                    <Download className="w-4 h-4 text-[#FF7A00]" />
                  </button>

                  {isCAC && (
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0B6B4B] text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  दस्तावेज पूर्वावलोकन
                </h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
              <div className="font-bold text-sm text-gray-900 dark:text-white">
                {previewDoc.title}
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
                <div>श्रेणी: <span className="font-semibold">{getCategoryBadgeLabel(previewDoc.category)}</span></div>
                <div>क्रमांक: <span className="font-semibold">{previewDoc.documentNumber || 'लागू नहीं'}</span></div>
                <div>प्रारूप: <span className="font-semibold">{previewDoc.fileType}</span></div>
                <div>दिनांक: <span className="font-semibold">{previewDoc.date}</span></div>
                <div>आकार: <span className="font-semibold">{previewDoc.fileSize}</span></div>
                <div>अपलोडकर्ता: <span className="font-semibold">{previewDoc.uploadedBy}</span></div>
              </div>
              {previewDoc.description && (
                <div className="pt-2 text-gray-700 dark:text-gray-200 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-semibold">विवरण:</span> {previewDoc.description}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                बंद करें
              </button>
              <button
                onClick={() => {
                  handleSimulateDownload(previewDoc);
                  setPreviewDoc(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                डिजिटल कॉपी डाउनलोड करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0B6B4B] text-white">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  नया शासकीय दस्तावेज / प्रपत्र अपलोड करें
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  दस्तावेज शीर्षक / नाम:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. उपयोगिता प्रमाण पत्र (UC) - प्राथमिक शाला जनकपुर"
                  required
                  className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    दस्तावेज श्रेणी:
                  </label>
                  <select
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
                  <select
                    value={schoolUdise}
                    onChange={(e) => setSchoolUdise(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="ALL">समस्त संकुल / सामान्य</option>
                    {schools.map((s) => (
                      <option key={s.udise} value={s.udise}>
                        {s.name || s.hindiName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    दस्तावेज / पत्र क्रमांक (वैकल्पिक):
                  </label>
                  <input
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
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="PDF">PDF (.pdf)</option>
                    <option value="EXCEL">Excel (.xlsx)</option>
                    <option value="WORD">Word (.docx)</option>
                    <option value="IMAGE">Image (.jpg / .png)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  दस्तावेज का संक्षिप्त विवरण / टिप्पणी:
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="दस्तावेज का उद्देश्य व आवश्यक विवरण यहाँ दर्ज करें..."
                  className="w-full px-3 py-2 bg-[#F8FAF8] dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              {/* Fake file picker mockup */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 text-center hover:border-[#0B6B4B] transition-colors cursor-pointer bg-gray-50 dark:bg-[#0F1713]">
                <Upload className="w-6 h-6 mx-auto text-[#0B6B4B] mb-1" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                  फाइल खींचें अथवा क्लिक करके अपलोड करें
                </span>
                <span className="text-[10px] text-gray-400">PDF, JPG, XLSX (अधिकतम 25 MB)</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                >
                  दस्तावेज सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
