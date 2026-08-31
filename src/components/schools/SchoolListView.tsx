import React, { useState, useMemo } from 'react';
import {
  School as SchoolIcon,
  Search,
  Filter,
  Plus,
  ArrowRight,
  MapPin,
  Users,
  GraduationCap,
  Download,
  Printer,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { School, SchoolType } from '../../types';
import { exportToExcel, exportToCSV } from '../../utils/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { institutionConfig } from '../../config/institutionConfig';

interface SchoolListViewProps {
  onSelectSchool: (udise: string) => void;
}

export const SchoolListView: React.FC<SchoolListViewProps> = ({ onSelectSchool }) => {
  const { currentUser } = useAuth();
  const { scopedSchools, addSchool, updateSchool, deleteSchool, students, staff } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterVillage, setFilterVillage] = useState<string>('ALL');

  // Modal State for Add / Edit School
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState<Partial<School>>({
    schoolType: 'प्राथमिक',
    status: 'ACTIVE',
    district: institutionConfig.district,
    block: institutionConfig.block,
    sankul: 'मलगुवां',
    jsk: 'मलगुवां',
    establishmentYear: 2005,
    pin: institutionConfig.pinCode,
    address: 'ग्राम मलगुवां',
    mobile: institutionConfig.cac1.mobile,
    email: '',
    principalEmployeeId: '',
    principalAssignmentDate: '2020-01-01',
  });

  // Delete Confirm Dialog state
  const [deleteTargetUdise, setDeleteTargetUdise] = useState<string | null>(null);

  const canEdit = currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN';

  // Village list for dropdown
  const villageList = useMemo(() => {
    const set = new Set(scopedSchools.map((s) => s.village));
    return Array.from(set).sort();
  }, [scopedSchools]);

  // Filtered schools
  const filteredSchools = useMemo(() => {
    return scopedSchools.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.hindiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.udise.includes(searchTerm) ||
        s.village.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'ALL' || s.schoolType === filterType;
      const matchVillage = filterVillage === 'ALL' || s.village === filterVillage;

      return matchSearch && matchType && matchVillage;
    });
  }, [scopedSchools, searchTerm, filterType, filterVillage]);

  const handleOpenAdd = () => {
    setEditingSchool(null);
    setFormData({
      udise: '230801107',
      name: 'GPS ',
      hindiName: 'शा.प्रा.शा. ',
      village: 'मलगुवां',
      gramPanchayat: 'मलगुवां',
      block: institutionConfig.block,
      district: institutionConfig.district,
      sankul: 'मलगुवां',
      jsk: 'मलगुवां',
      schoolType: 'प्राथमिक',
      status: 'ACTIVE',
      establishmentYear: 2008,
      pin: institutionConfig.pinCode,
      address: `ग्राम मलगुवां, ${institutionConfig.block}`,
      mobile: '',
      email: '',
      principalName: '',
      principalMobile: '',
      principalEmployeeId: 'EMP-HM-NEW',
      principalAssignmentDate: '2022-01-01',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (school: School, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSchool(school);
    setFormData(school);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.udise || formData.udise.length !== 11) {
      alert('यूडाइस कोड 11 अंकों का होना अनिवार्य है।');
      return;
    }
    if (!formData.hindiName || !formData.village) {
      alert('विद्यालय का नाम एवं ग्राम आवश्यक हैं।');
      return;
    }

    if (editingSchool) {
      updateSchool(formData as School);
    } else {
      addSchool(formData as School);
    }
    setIsModalOpen(false);
  };

  const handleExport = (type: 'EXCEL' | 'CSV') => {
    const headers = [
      'क्रमांक',
      'यूडाइस कोड',
      'विद्यालय का नाम (हिंदी)',
      'अंग्रेजी नाम',
      'प्रकार',
      'ग्राम / मजरा',
      'ग्राम पंचायत',
      'प्रधानाध्यापक',
      'मोबाइल',
      'छात्र संख्या',
      'स्टाफ संख्या'
    ];

    const rows = filteredSchools.map((s, idx) => {
      const sStudents = students.filter((st) => st.schoolUdise === s.udise).length;
      const sStaff = staff.filter((stf) => stf.assignedSchoolUdise === s.udise).length;
      return [
        idx + 1,
        s.udise,
        s.hindiName,
        s.name,
        s.schoolType,
        s.village,
        s.gramPanchayat,
        s.principalName,
        s.principalMobile,
        sStudents,
        sStaff
      ];
    });

    const payload = {
      title: 'जन शिक्षा केंद्र मलगुवां - विद्यालय मास्टर डेटा सूची',
      subtitle: `सत्र 2026-27 | कुल विद्यालय: ${filteredSchools.length}`,
      headers,
      rows,
      fileName: 'Malguwa_Schools_Master',
    };

    if (type === 'EXCEL') exportToExcel(payload);
    else exportToCSV(payload);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header & Controls Bar */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              संकुल अंतर्गत विद्यालय सूची (Schools Directory)
            </h2>
            <span className="bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              कुल {filteredSchools.length} विद्यालय
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {institutionConfig.institutionName} ({institutionConfig.district}) अंतर्गत समस्त {scopedSchools.length || institutionConfig.totalSchoolsCount} प्राथमिक, माध्यमिक एवं संयुक्त शालाएं
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleExport('EXCEL')}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>एक्सेल निर्यात (Excel)</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>नया विद्यालय जोड़ें</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="नाम, यूडाइस या ग्राम से खोजें..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B6B4B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-200 focus:outline-none"
          >
            <option value="ALL">सभी शाला प्रकार</option>
            <option value="प्राथमिक">प्राथमिक शाला (PS)</option>
            <option value="माध्यमिक">माध्यमिक शाला (MS)</option>
            <option value="हाई स्कूल">हाई स्कूल (HS/GHS)</option>
            <option value="उच्चतर माध्यमिक">उच्चतर माध्यमिक शाला (HSS)</option>
            <option value="अशासकीय प्राथमिक">अशासकीय प्राथमिक (Private)</option>
            <option value="कस्तूरबा गांधी बालिका विद्यालय">KGBV</option>
          </select>

          <select
            value={filterVillage}
            onChange={(e) => setFilterVillage(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-200 focus:outline-none"
          >
            <option value="ALL">सभी ग्राम / मजरे</option>
            {villageList.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* School Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchools.map((school) => {
          const sStudents = students.filter((st) => st.schoolUdise === school.udise).length;
          const sStaff = staff.filter((stf) => stf.assignedSchoolUdise === school.udise).length;

          return (
            <div
              key={school.udise}
              onClick={() => onSelectSchool(school.udise)}
              className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs hover:border-[#0B6B4B] dark:hover:border-emerald-600 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    यूडाइस: {school.udise}
                  </span>
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold px-2 py-0.5 rounded">
                    {school.schoolType}
                  </span>
                </div>

                <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-[#0B6B4B] dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {school.name || school.hindiName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                  {school.village} • {school.schoolType}
                </p>

                <div className="mt-3 text-xs space-y-1 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">ग्राम: {school.village} (पंचायत: {school.gramPanchayat})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">प्र.अ.: {school.principalName} ({school.principalMobile || 'मोबाइल अप्राप्त'})</span>
                  </div>
                </div>
              </div>

              {/* Bottom stats & action */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" /> {sStudents} छात्र
                  </span>
                  <span className="text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {sStaff} स्टाफ
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      onClick={(e) => handleOpenEdit(school, e)}
                      className="p-1 text-gray-400 hover:text-emerald-600 rounded"
                      title="संपादित करें"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetUdise(school.udise);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="p-1 text-[#0B6B4B] group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit School Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              {editingSchool ? 'विद्यालय विवरण संशोधित करें' : 'नया विद्यालय पंजीकृत करें'}
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    यूडाइस कोड (11 अंक) *
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={formData.udise || ''}
                    onChange={(e) => setFormData({ ...formData, udise: e.target.value })}
                    disabled={!!editingSchool}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-[#0B6B4B]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    शाला प्रकार (School Type) *
                  </label>
                  <select
                    value={formData.schoolType || 'प्राथमिक'}
                    onChange={(e) => setFormData({ ...formData, schoolType: e.target.value as SchoolType })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="प्राथमिक">प्राथमिक शाला (1-5)</option>
                    <option value="माध्यमिक">माध्यमिक शाला (6-8)</option>
                    <option value="हाई स्कूल">हाई स्कूल (9-10)</option>
                    <option value="उच्चतर माध्यमिक">उच्चतर माध्यमिक शाला (9-12)</option>
                    <option value="अशासकीय प्राथमिक">अशासकीय प्राथमिक (मान्यता प्राप्त)</option>
                    <option value="कस्तूरबा गांधी बालिका विद्यालय">कस्तूरबा गांधी बालिका विद्यालय (KGBV)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    विद्यालय का नाम (हिंदी) *
                  </label>
                  <input
                    type="text"
                    value={formData.hindiName || ''}
                    onChange={(e) => setFormData({ ...formData, hindiName: e.target.value })}
                    placeholder="उदा. शा.प्रा.शा. मलगुवां"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    विद्यालय का नाम (English)
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. GPS MALGUWA"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ग्राम / मजरा *
                  </label>
                  <input
                    type="text"
                    value={formData.village || ''}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ग्राम पंचायत
                  </label>
                  <input
                    type="text"
                    value={formData.gramPanchayat || ''}
                    onChange={(e) => setFormData({ ...formData, gramPanchayat: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    संस्था प्रधान का नाम
                  </label>
                  <input
                    type="text"
                    value={formData.principalName || ''}
                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    placeholder="उदा. श्री हरिशंकर चौबे"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    प्रधान का मोबाइल नंबर
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.principalMobile || ''}
                    onChange={(e) => setFormData({ ...formData, principalMobile: e.target.value.replace(/\D/g, '') })}
                    placeholder="10 अंकों का नंबर"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
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
                  सुरक्षित करें (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetUdise}
        title="विद्यालय हटाने की पुष्टि"
        message="क्या आप वास्तव में इस विद्यालय का रिकॉर्ड हटाना चाहते हैं? इससे संबद्ध छात्र, शिक्षक एवं भौतिक सुविधाएं भी प्रभावित हो सकती हैं।"
        confirmText="हटाएं"
        cancelText="रद्द करें"
        isDestructive
        onConfirm={() => {
          if (deleteTargetUdise) {
            deleteSchool(deleteTargetUdise);
            setDeleteTargetUdise(null);
          }
        }}
        onCancel={() => setDeleteTargetUdise(null)}
      />
    </div>
  );
};
