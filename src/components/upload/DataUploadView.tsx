import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  School,
  GraduationCap,
  Users,
  Building2,
  Utensils,
  ClipboardList,
  AlertTriangle,
  Award,
  RefreshCw,
  FolderLock
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export const DataUploadView: React.FC = () => {
  const {
    addStudent,
    addStaff,
    schools,
    addGovernmentWork,
    addComplaint,
    logActivity,
    resetToSampleData
  } = useData();
  const { currentUser } = useAuth();

  const [activeModule, setActiveModule] = useState<'STUDENTS' | 'STAFF' | 'WORK' | 'COMPLAINT' | 'RESET'>('STUDENTS');
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [jsonInput, setJsonInput] = useState('');

  // Sample CSV Templates for Download
  const handleDownloadTemplate = (moduleName: string) => {
    let headers = '';
    let sampleRow = '';
    let fileName = '';

    if (moduleName === 'STUDENTS') {
      fileName = 'student_upload_template.csv';
      headers = 'samagraId,apaarId,name,fatherName,motherName,gender,dob,class,section,category,isCwsn,schoolUdise,mobile,status';
      sampleRow = '109823451,APA98234,राहुल अहिरवार,रमेश अहिरवार,सुनीता अहिरवार,बालक,2017-05-12,3,A,SC,false,23080401201,9826011111,ACTIVE';
    } else if (moduleName === 'STAFF') {
      fileName = 'teacher_upload_template.csv';
      headers = 'employeeId,name,gender,designation,subject,mobile,joiningDate,assignedSchoolUdise,qualification,dob,category';
      sampleRow = 'EMP199,सुरेश कुमार तिवारी,बालक,माध्यमिक शिक्षक,गणित,9826199999,2018-07-15,23080401201,M.Sc. B.Ed.,1988-03-20,GENERAL';
    } else if (moduleName === 'WORK') {
      fileName = 'government_work_template.csv';
      headers = 'title,category,schoolUdise,assignedTo,dueDate,priority,description';
      sampleRow = 'समग्र छात्रवृत्ति ई-केवाईसी सत्यापन,छात्रवृत्ति,23080401201,प्रधानाध्यापक,2026-09-15,HIGH,शत-प्रतिशत विद्यार्थियों की ई-केवाईसी पूर्ण करें';
    }

    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${sampleRow}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateBatchUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadStatus(null);

    if (activeModule === 'STUDENTS') {
      // Add sample students batch
      const randomId = Math.floor(1000 + Math.random() * 9000);
      addStudent({
        srNumber: `SR-${randomId}`,
        samagraId: `109${randomId}45`,
        apaarId: `APAAR${randomId}`,
        name: `नया विद्यार्थी (${randomId})`,
        fatherName: 'रामप्रसाद',
        motherName: 'कमला देवी',
        gender: 'बालक',
        dob: '2016-04-10',
        class: '4',
        section: 'A',
        category: 'OBC',
        isCwsn: false,
        schoolUdise: schools[0]?.udise || '23080401201',
        address: 'मलगुवां, टीकमगढ़',
        mobile: '9826000000',
        status: 'ACTIVE',
        admissionDate: '2026-06-15'
      });

      logActivity('CREATE', 'Students', `एक्सेल/CSV अपलोड द्वारा नवीन विद्यार्थी डेटा संकलित किया गया।`);
      setUploadStatus({ type: 'success', message: 'विद्यार्थी डेटा सफलतापूर्वक प्रोसेस एवं डेटाबेस में सुरक्षित किया गया।' });
    } else if (activeModule === 'STAFF') {
      const randomEmp = `EMP${Math.floor(200 + Math.random() * 800)}`;
      addStaff({
        employeeId: randomEmp,
        name: `अतिथि शिक्षक (${randomEmp})`,
        gender: 'बालक',
        designation: 'अतिथि शिक्षक',
        subject: 'विज्ञान',
        mobile: '9826555555',
        joiningDate: '2026-07-01',
        assignedSchoolUdise: schools[0]?.udise || '23080401201',
        assignedClasses: ['6', '7', '8'],
        duty: 'शैक्षणिक कार्य',
        status: 'ACTIVE',
        qualification: 'B.Sc. B.Ed.',
        dob: '1995-02-14',
        category: 'OBC'
      });

      logActivity('CREATE', 'Staff', `बैच डेटा अपलोड द्वारा शिक्षक प्रोफाइल जोड़ी गई।`);
      setUploadStatus({ type: 'success', message: 'शिक्षक डेटा सफलतापूर्वक प्रोसेस एवं सुरक्षित किया गया।' });
    } else {
      setUploadStatus({ type: 'success', message: 'डेटा प्रविष्टि सफलतापूर्वक अद्यतन की गई।' });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#0B6B4B]/10 text-[#0B6B4B] dark:text-emerald-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              डेटा अपलोड, प्रविष्टि एवं आयात केंद्र (Data Upload & Entry)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              एक्सेल (Excel), CSV अथवा त्वरित प्रपत्र द्वारा विद्यालय, विद्यार्थी एवं शिक्षक डेटा आयात करें
            </p>
          </div>
        </div>
      </div>

      {/* Module Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'STUDENTS', label: 'विद्यार्थी डेटा आयात', icon: GraduationCap },
          { id: 'STAFF', label: 'शिक्षक व स्टाफ प्रविष्टि', icon: Users },
          { id: 'WORK', label: 'शासकीय कार्य आयात', icon: ClipboardList },
          { id: 'RESET', label: 'डेटा रीसेट / बैकअप', icon: RefreshCw },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveModule(tab.id as any);
                setUploadStatus(null);
              }}
              className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                isActive
                  ? 'border-[#0B6B4B] bg-[#EAF6F0] dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-300 font-bold shadow-xs'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#17211C] text-gray-700 dark:text-gray-300 hover:border-emerald-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B6B4B] dark:text-emerald-400' : 'text-gray-400'}`} />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Action Box */}
      <div className="bg-white dark:bg-[#17211C] p-5 sm:p-6 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-5">
        {uploadStatus && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm ${
              uploadStatus.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            {uploadStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold">स्थिति सूचना: </span>
              {uploadStatus.message}
            </div>
          </div>
        )}

        {activeModule === 'RESET' ? (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-xs sm:text-sm text-amber-800 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FF7A00] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold mb-1">मास्टर सैंपल डेटा रीस्टोर (Reset Data)</h4>
                <p>
                  यदि आप परीक्षण के दौरान दर्ज किए गए सभी रिकॉर्ड को संकुल मलगुवां के मानक 37 विद्यालयों, विद्यार्थियों, शिक्षकों एवं भौतिक संसाधनों के वास्तविक डेटाबेस में रीसेट करना चाहते हैं तो नीचे क्लिक करें।
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                resetToSampleData();
                setUploadStatus({ type: 'success', message: 'समस्त डेटाबेस संकुल मलगुवां के प्रारंभिक 37 विद्यालयों के अधिकृत डेटा में सफलतापूर्वक रीसेट हो गया।' });
              }}
              className="flex items-center gap-2 bg-[#FF7A00] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              डेटाबेस रीसेट एवं मानक डेटा लोड करें
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Download Template */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F8FAF8] dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#0B6B4B]" />
                  चरण 1: मानक CSV / Excel टेम्पलेट डाउनलोड करें
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  सटीक कॉलम हेडर एवं डेटा फॉर्मेट के लिए पूर्व-निर्धारित टेम्पलेट का उपयोग करें
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadTemplate(activeModule)}
                className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#0B6B4B]" />
                टेम्पलेट डाउनलोड (.CSV)
              </button>
            </div>

            {/* Step 2: Upload or Process */}
            <form onSubmit={handleSimulateBatchUpload} className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                चरण 2: तैयार फाइल अपलोड अथवा रिकॉर्ड आयात करें
              </h4>

              {/* Drag and Drop Zone */}
              <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-[#0B6B4B] bg-[#EAF6F0]/30 dark:bg-emerald-950/20 rounded-2xl p-8 text-center transition-colors">
                <UploadCloud className="w-10 h-10 mx-auto text-[#0B6B4B] dark:text-emerald-400 mb-2" />
                <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">
                  अपनी CSV / XLSX फाइल यहाँ खींचें अथवा चुनें
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  अधिकतम फाइल आकार: 20 MB | समर्थित फॉर्मेट: .CSV, .XLSX
                </p>

                <div className="mt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-colors"
                  >
                    <UploadCloud className="w-4 h-4" />
                    फाइल प्रोसेस एवं डेटा सुरक्षित करें
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
