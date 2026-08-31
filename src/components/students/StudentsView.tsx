import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Users,
  Eye,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Student, Gender, SocialCategory } from '../../types';
import { exportToExcel, exportToCSV, triggerSystemPrint } from '../../utils/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SmartExportModal } from '../export/SmartExportModal';

export const StudentsView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    scopedStudents,
    schools,
    selectedSchool,
    addStudent,
    updateStudent,
    deleteStudent
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    class: '5',
    gender: 'बालक',
    category: 'OBC',
    isCwsn: false,
    schoolUdise: selectedSchool?.udise || schools[0]?.udise || '',
    session: '2026-27',
  });

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Smart Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStudentTarget, setExportStudentTarget] = useState<Student | null>(null);

  const canEdit = currentUser?.role === 'CAC' || currentUser?.role === 'PRINCIPAL' || currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN';

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return scopedStudents.filter((st) => {
      const matchSearch =
        st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.samagraId.includes(searchTerm) ||
        st.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.schoolUdise.includes(searchTerm);

      const matchClass = selectedClass === 'ALL' || st.class === selectedClass;
      const matchGender = selectedGender === 'ALL' || st.gender === selectedGender;
      const matchCategory = selectedCategory === 'ALL' || st.category === selectedCategory;
      const matchSchool = selectedSchoolFilter === 'ALL' || st.schoolUdise === selectedSchoolFilter;

      return matchSearch && matchClass && matchGender && matchCategory && matchSchool;
    });
  }, [scopedStudents, searchTerm, selectedClass, selectedGender, selectedCategory, selectedSchoolFilter]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      samagraId: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      name: '',
      fatherName: '',
      motherName: '',
      dob: '2015-05-10',
      gender: 'बालक',
      category: 'OBC',
      class: '5',
      schoolUdise: selectedSchool?.udise || schools[0]?.udise || '',
      scholarNo: `SCH-${Date.now().toString().slice(-4)}`,
      isCwsn: false,
      mobile: '9826012345',
      session: '2026-27',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setFormData(st);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.samagraId || !formData.schoolUdise) {
      alert('कृपया नाम, समग्र आईडी एवं विद्यालय का चयन करें।');
      return;
    }

    if (editingStudent) {
      updateStudent(formData as Student);
    } else {
      addStudent(formData as Omit<Student, 'id'>);
    }
    setIsModalOpen(false);
  };

  const handleExport = (type: 'EXCEL' | 'CSV') => {
    const headers = [
      'क्रमांक',
      'समग्र आईडी',
      'विद्यार्थी का नाम',
      'पिता का नाम',
      'माता का नाम',
      'विद्यालय यूडाइस',
      'कक्षा',
      'लिंग',
      'सामाजिक वर्ग',
      'CWSN',
      'मोबाइल',
      'सत्र'
    ];

    const rows = filteredStudents.map((st, idx) => [
      idx + 1,
      st.samagraId,
      st.name,
      st.fatherName,
      st.motherName || '-',
      st.schoolUdise,
      st.class,
      st.gender,
      st.category,
      st.isCwsn ? 'हाँ' : 'नहीं',
      st.mobile || '-',
      st.session || '2026-27'
    ]);

    const payload = {
      title: 'जन शिक्षा केंद्र मलगुवां - विद्यार्थी नामांकन सूची',
      subtitle: `सत्र 2026-27 | कुल रिकॉर्ड: ${filteredStudents.length}`,
      headers,
      rows,
      fileName: 'Malguwa_Students_Report',
    };

    if (type === 'EXCEL') exportToExcel(payload);
    else exportToCSV(payload);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner & Control */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              विद्यार्थी प्रबंधन (Students Enrollment)
            </h2>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              कुल {filteredStudents.length} विद्यार्थी
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            समग्र शिक्षा अभियान अंतर्गत 9-अंकीय समग्र आईडी एवं सामाजिक वर्ग आधारित लाइव नामांकन
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setExportStudentTarget(null);
              setIsExportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg border border-purple-300 dark:border-purple-700 hover:bg-purple-100 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="स्मार्ट एक्सपोर्ट व A4 प्रिंट केंद्र"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>स्मार्ट एक्सपोर्ट</span>
          </button>
          <button
            onClick={() => handleExport('EXCEL')}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>एक्सेल (Excel)</span>
          </button>
          <button
            onClick={() => triggerSystemPrint()}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>प्रिंट (Print)</span>
          </button>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>नया विद्यार्थी दर्ज करें</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="नाम, 9-अंक समग्र आईडी, पिता का नाम..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B6B4B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium"
          >
            <option value="ALL">सभी कक्षाएं (1-12)</option>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((c) => (
              <option key={c} value={c}>
                कक्षा {c}
              </option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium"
          >
            <option value="ALL">सभी लिंग</option>
            <option value="बालक">बालक (Boys)</option>
            <option value="बालिका">बालिका (Girls)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium"
          >
            <option value="ALL">सभी सामाजिक वर्ग</option>
            <option value="SC">अनुसूचित जाति (SC)</option>
            <option value="ST">अनुसूचित जनजाति (ST)</option>
            <option value="OBC">अन्य पिछड़ा वर्ग (OBC)</option>
            <option value="GENERAL">सामान्य (General)</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-bold">क्र.</th>
                <th className="p-3 font-bold">समग्र आईडी</th>
                <th className="p-3 font-bold">विद्यार्थी का नाम</th>
                <th className="p-3 font-bold">पिता / माता का नाम</th>
                <th className="p-3 font-bold">विद्यालय (यूडाइस)</th>
                <th className="p-3 font-bold">कक्षा</th>
                <th className="p-3 font-bold">लिंग</th>
                <th className="p-3 font-bold">सामाजिक वर्ग</th>
                <th className="p-3 font-bold">CWSN</th>
                <th className="p-3 font-bold">मोबाइल</th>
                <th className="p-3 font-bold text-center">कार्यवाही</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredStudents.map((st, idx) => {
                const sObj = schools.find((s) => s.udise === st.schoolUdise);
                return (
                  <tr key={st.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                    <td className="p-3 text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {st.samagraId}
                    </td>
                    <td className="p-3 font-bold text-gray-900 dark:text-white">
                      {st.name}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      <div>{st.fatherName}</div>
                      {st.motherName && <div className="text-[11px] text-gray-400">{st.motherName}</div>}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">
                        {sObj?.name || sObj?.hindiName || st.schoolUdise}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400">{st.schoolUdise}</div>
                    </td>
                    <td className="p-3 font-bold text-[#0B6B4B] dark:text-emerald-400">
                      कक्षा {st.class}
                    </td>
                    <td className="p-3">{st.gender}</td>
                    <td className="p-3">
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-bold">
                        {st.category}
                      </span>
                    </td>
                    <td className="p-3">
                      {st.isCwsn ? (
                        <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded font-bold">
                          हाँ
                        </span>
                      ) : (
                        <span className="text-gray-400">नहीं</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-gray-500">{st.mobile || '-'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setExportStudentTarget(st);
                            setIsExportModalOpen(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                          title="प्रिंट व डोजियर निर्यात"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(st)}
                            className="p-1.5 text-gray-500 hover:text-[#0B6B4B] hover:bg-emerald-50 rounded"
                            title="संशोधित करें"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => setDeleteTargetId(st.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              {editingStudent ? 'विद्यार्थी विवरण संशोधित करें' : 'नया विद्यार्थी नामांकन दर्ज करें'}
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    समग्र आईडी (9 अंक) *
                  </label>
                  <input
                    type="text"
                    maxLength={9}
                    value={formData.samagraId || ''}
                    onChange={(e) => setFormData({ ...formData, samagraId: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-mono focus:ring-2 focus:ring-[#0B6B4B]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    विद्यार्थी का नाम *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    पिता का नाम *
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName || ''}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    माता का नाम
                  </label>
                  <input
                    type="text"
                    value={formData.motherName || ''}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    नामांकित विद्यालय *
                  </label>
                  <select
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
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    कक्षा *
                  </label>
                  <select
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((c) => (
                      <option key={c} value={c}>
                        कक्षा {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    लिंग *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="बालक">बालक (Male)</option>
                    <option value="बालिका">बालिका (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    सामाजिक वर्ग (Social Category) *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as SocialCategory })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="SC">अनुसूचित जाति (SC)</option>
                    <option value="ST">अनुसूचित जनजाति (ST)</option>
                    <option value="OBC">अन्य पिछड़ा वर्ग (OBC)</option>
                    <option value="GENERAL">सामान्य (General)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    दिव्यांगता स्थिति (CWSN)
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.isCwsn === true}
                        onChange={() => setFormData({ ...formData, isCwsn: true })}
                        className="text-[#0B6B4B]"
                      />
                      <span>हाँ (CWSN)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.isCwsn === false}
                        onChange={() => setFormData({ ...formData, isCwsn: false })}
                        className="text-[#0B6B4B]"
                      />
                      <span>नहीं (Normal)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="विद्यार्थी रिकॉर्ड हटाने की पुष्टि"
        message="क्या आप वास्तव में इस विद्यार्थी का नामांकन रिकॉर्ड हटाना चाहते हैं? यह कार्यवाही ऑडिट लॉग में दर्ज की जाएगी।"
        confirmText="हटाएं"
        cancelText="रद्द करें"
        isDestructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteStudent(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Smart Export & Print Modal */}
      <SmartExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportStudentTarget(null);
        }}
        initialType="STUDENT"
        initialStudentId={exportStudentTarget?.id}
        initialUdise={exportStudentTarget?.schoolUdise || (selectedSchoolFilter !== 'ALL' ? selectedSchoolFilter : undefined)}
      />
    </div>
  );
};
