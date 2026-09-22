import { UploadDataType } from '../../types';

export interface FieldDefinition {
  key: string;
  labelHi: string;
  labelEn: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  aliases: string[];
  description?: string;
  sampleValue?: string | number | boolean;
}

export interface DataTypeConfig {
  type: UploadDataType;
  titleHi: string;
  titleEn: string;
  description: string;
  iconName: string;
  primaryKey: string;
  fields: FieldDefinition[];
  sampleRows: Record<string, any>[];
}

export const DATA_TYPE_CONFIGS: Record<UploadDataType, DataTypeConfig> = {
  SCHOOL: {
    type: 'SCHOOL',
    titleHi: 'विद्यालय डेटा (School Master)',
    titleEn: 'School Master Data',
    description: 'संकुल के समस्त विद्यालयों का मास्टर विवरण, यू-डायस कोड, शाला प्रकार, पता, प्रधान अध्यापक आदि।',
    iconName: 'School',
    primaryKey: 'udise',
    fields: [
      { key: 'udise', labelHi: 'यू-डायस कोड *', labelEn: 'UDISE Code *', required: true, type: 'string', aliases: ['udise', 'udisecode', 'schooludise', 'यू-डायस', 'यूडायस', 'यूडाइस कोड', 'udise code', 'शासकीय यूडायस'] },
      { key: 'name', labelHi: 'विद्यालय का नाम *', labelEn: 'School Name *', required: true, type: 'string', aliases: ['name', 'schoolname', 'school_name', 'विद्यालय', 'शाला का नाम', 'स्कूल का नाम', 'school'] },
      { key: 'schoolType', labelHi: 'शाला प्रकार *', labelEn: 'School Type *', required: true, type: 'select', options: ['प्राथमिक', 'माध्यमिक', 'हाई स्कूल', 'उच्चतर माध्यमिक', 'कस्तूरबा गांधी बालिका विद्यालय', 'अशासकीय प्राथमिक'], aliases: ['schooltype', 'type', 'प्रकार', 'शाला प्रकार', 'वर्ग'] },
      { key: 'village', labelHi: 'ग्राम / बसाहट *', labelEn: 'Village *', required: true, type: 'string', aliases: ['village', 'ग्राम', 'गाँव', 'बसाहट', 'village_name'] },
      { key: 'gramPanchayat', labelHi: 'ग्राम पंचायत', labelEn: 'Gram Panchayat', required: false, type: 'string', aliases: ['grampanchayat', 'panchayat', 'ग्राम पंचायत', 'पंचायत'] },
      { key: 'sankul', labelHi: 'संकुल केंद्र', labelEn: 'Sankul', required: false, type: 'string', aliases: ['sankul', 'संकुल', 'संकुल केंद्र', 'cluster'] },
      { key: 'jsk', labelHi: 'जन शिक्षा केंद्र', labelEn: 'Jan Shiksha Kendra', required: false, type: 'string', aliases: ['jsk', 'जन शिक्षा केंद्र', 'जनशिक्षा केंद्र'] },
      { key: 'block', labelHi: 'विकासखंड (Block)', labelEn: 'Block', required: false, type: 'string', aliases: ['block', 'विकासखंड', 'ब्लॉक'] },
      { key: 'district', labelHi: 'जिला (District)', labelEn: 'District', required: false, type: 'string', aliases: ['district', 'जिला'] },
      { key: 'pin', labelHi: 'पिन कोड', labelEn: 'PIN Code', required: false, type: 'string', aliases: ['pin', 'pincode', 'pin_code', 'पिन कोड', 'पिन'] },
      { key: 'address', labelHi: 'पूर्ण पता', labelEn: 'Address', required: false, type: 'string', aliases: ['address', 'पता', 'स्थान'] },
      { key: 'mobile', labelHi: 'शाला संपर्क मोबाइल', labelEn: 'School Mobile', required: false, type: 'string', aliases: ['mobile', 'schoolmobile', 'फ़ोन', 'मोबाइल'] },
      { key: 'email', labelHi: 'शाला ईमेल', labelEn: 'School Email', required: false, type: 'string', aliases: ['email', 'ईमेल', 'school_email'] },
      { key: 'principalName', labelHi: 'प्रधानाध्यापक का नाम', labelEn: 'Principal/HM Name', required: false, type: 'string', aliases: ['principalname', 'principal', 'hm', 'hmname', 'प्रधानाध्यापक', 'प्राचार्य'] },
      { key: 'principalMobile', labelHi: 'प्रधानाध्यापक मोबाइल', labelEn: 'Principal Mobile', required: false, type: 'string', aliases: ['principalmobile', 'hmmobile', 'प्रधानाध्यापक मोबाइल'] },
      { key: 'status', labelHi: 'स्थिति (ACTIVE/INACTIVE)', labelEn: 'Status', required: false, type: 'select', options: ['ACTIVE', 'INACTIVE'], aliases: ['status', 'स्थिति', 'सक्रियता'] },
    ],
    sampleRows: [
      {
        udise: '23080110701',
        name: 'PS JANAKPUR',
        schoolType: 'प्राथमिक',
        village: 'जनकपुर',
        gramPanchayat: 'जनकपुर',
        sankul: 'संकुल मलगुवां',
        jsk: 'जन शिक्षा केंद्र मलगुवां',
        block: 'बल्देवगढ़',
        district: 'टीकमगढ़',
        pin: '472001',
        address: 'ग्राम जनकपुर, पोस्ट मलगुवां, टीकमगढ़',
        mobile: '9826011111',
        email: 'ps.janakpur@mp.gov.in',
        principalName: 'दिनेश कुमार पटेल',
        principalMobile: '9826011111',
        status: 'ACTIVE',
      },
      {
        udise: '23080113602',
        name: 'MS MALGUWAN',
        schoolType: 'माध्यमिक',
        village: 'मलगुवां',
        gramPanchayat: 'मलगुवां',
        sankul: 'संकुल मलगुवां',
        jsk: 'जन शिक्षा केंद्र मलगुवां',
        block: 'बल्देवगढ़',
        district: 'टीकमगढ़',
        pin: '472001',
        address: 'ग्राम मलगुवां, बल्देवगढ़, टीकमगढ़',
        mobile: '9826022222',
        email: 'ms.malguwan@mp.gov.in',
        principalName: 'सुरेश कुमार पाठक',
        principalMobile: '9826022222',
        status: 'ACTIVE',
      }
    ]
  },

  STUDENT: {
    type: 'STUDENT',
    titleHi: 'विद्यार्थी डेटा (Student Master)',
    titleEn: 'Student Master Data',
    description: 'छात्र-छात्राओं का विवरण, समग्र आईडी, अपार आईडी, कक्षा, वर्ग, पिता/माता का नाम, सी.डब्ल्यू.एस.एन आदि।',
    iconName: 'GraduationCap',
    primaryKey: 'samagraId',
    fields: [
      { key: 'samagraId', labelHi: 'समग्र सदस्य आईडी *', labelEn: 'Samagra ID *', required: true, type: 'string', aliases: ['samagraid', 'samagra_id', 'समग्र', 'समग्र आईडी', 'समग्र सदस्य आईडी', 'samagra'] },
      { key: 'schoolUdise', labelHi: 'शाला यू-डायस कोड *', labelEn: 'School UDISE *', required: true, type: 'string', aliases: ['schooludise', 'udise', 'udisecode', 'यूडायस', 'शाला यूडायस', 'school_udise'] },
      { key: 'name', labelHi: 'विद्यार्थी का नाम *', labelEn: 'Student Name *', required: true, type: 'string', aliases: ['name', 'studentname', 'student_name', 'विद्यार्थी नाम', 'छात्र का नाम', 'नाम'] },
      { key: 'srNumber', labelHi: 'दाखिल खारिज / SR नंबर', labelEn: 'SR / Admission No.', required: false, type: 'string', aliases: ['srnumber', 'sr_no', 'srno', 'दाखिल खारिज', 'प्रवेश क्रमांक', 'sr'] },
      { key: 'apaarId', labelHi: 'अपार आईडी (APAAR ID)', labelEn: 'APAAR ID', required: false, type: 'string', aliases: ['apaarid', 'apaar_id', 'अपार', 'अपार आईडी', 'apaar'] },
      { key: 'gender', labelHi: 'लिंग (बालक/बालिका/अन्य) *', labelEn: 'Gender *', required: true, type: 'select', options: ['बालक', 'बालिका', 'अन्य'], aliases: ['gender', 'लिंग', 'sex'] },
      { key: 'dob', labelHi: 'जन्म तिथि (YYYY-MM-DD)', labelEn: 'DOB', required: false, type: 'date', aliases: ['dob', 'dateofbirth', 'जन्म तिथि', 'जन्मतिथि', 'birthdate'] },
      { key: 'fatherName', labelHi: 'पिता का नाम *', labelEn: 'Father Name *', required: true, type: 'string', aliases: ['fathername', 'father_name', 'पिता का नाम', 'पिता', 'guardianname'] },
      { key: 'motherName', labelHi: 'माता का नाम', labelEn: 'Mother Name', required: false, type: 'string', aliases: ['mothername', 'mother_name', 'माता का नाम', 'माता'] },
      { key: 'class', labelHi: 'कक्षा (1 से 12) *', labelEn: 'Class *', required: true, type: 'string', aliases: ['class', 'classnumber', 'कक्षा', 'कक्षा क्रमांक', 'std'] },
      { key: 'section', labelHi: 'वर्ग / सेक्शन', labelEn: 'Section', required: false, type: 'string', aliases: ['section', 'सेक्शन', 'वर्ग', 'शाखा'] },
      { key: 'category', labelHi: 'सामाजिक संवर्ग (SC/ST/OBC/GENERAL) *', labelEn: 'Category *', required: true, type: 'select', options: ['SC', 'ST', 'OBC', 'GENERAL'], aliases: ['category', 'जाति संवर्ग', 'वर्ग', 'सामाजिक वर्ग', 'caste'] },
      { key: 'isCwsn', labelHi: 'दिव्यांग (CWSN) हाँ/नहीं', labelEn: 'CWSN (Yes/No)', required: false, type: 'boolean', aliases: ['iscwsn', 'cwsn', 'दिव्यांग', 'विशेष आवश्यकता', 'handicapped'] },
      { key: 'mobile', labelHi: 'अभिभावक मोबाइल नंबर', labelEn: 'Mobile Number', required: false, type: 'string', aliases: ['mobile', 'mobile_no', 'फ़ोन', 'अभिभावक मोबाइल', 'phone'] },
      { key: 'address', labelHi: 'निवास का पता / ग्राम', labelEn: 'Address', required: false, type: 'string', aliases: ['address', 'पता', 'ग्राम', 'निवास'] },
      { key: 'status', labelHi: 'स्थिति (ACTIVE/TC_ISSUED/DROPOUT)', labelEn: 'Status', required: false, type: 'select', options: ['ACTIVE', 'TC_ISSUED', 'DROPOUT'], aliases: ['status', 'स्थिति', 'छात्र स्थिति'] },
      { key: 'admissionDate', labelHi: 'प्रवेश दिनांक', labelEn: 'Admission Date', required: false, type: 'date', aliases: ['admissiondate', 'प्रवेश दिनांक', 'प्रवेश तिथि'] }
    ],
    sampleRows: [
      {
        samagraId: '109823451',
        schoolUdise: '23080110701',
        name: 'आर्यन पटेल',
        srNumber: 'SR-101',
        apaarId: 'APA-98234510',
        gender: 'बालक',
        dob: '2017-05-12',
        fatherName: 'रमेश कुमार पटेल',
        motherName: 'सुनीता पटेल',
        class: '3',
        section: 'A',
        category: 'OBC',
        isCwsn: false,
        mobile: '9826011111',
        address: 'ग्राम जनकपुर, टीकमगढ़',
        status: 'ACTIVE',
        admissionDate: '2026-06-15'
      },
      {
        samagraId: '109823452',
        schoolUdise: '23080110701',
        name: 'प्रिया अहिरवार',
        srNumber: 'SR-102',
        apaarId: 'APA-98234511',
        gender: 'बालिका',
        dob: '2016-08-20',
        fatherName: 'संतोष अहिरवार',
        motherName: 'कमला अहिरवार',
        class: '4',
        section: 'A',
        category: 'SC',
        isCwsn: false,
        mobile: '9826012222',
        address: 'ग्राम जनकपुर, टीकमगढ़',
        status: 'ACTIVE',
        admissionDate: '2026-06-16'
      }
    ]
  },

  TEACHER: {
    type: 'TEACHER',
    titleHi: 'शिक्षक एवं स्टाफ डेटा (Teacher / Staff Master)',
    titleEn: 'Teacher / Staff Master Data',
    description: 'संकुल शिक्षकों, प्राचार्यों, माध्यमिक/प्राथमिक शिक्षकों, अतिथि शिक्षकों एवं रसोइयों का विवरण।',
    iconName: 'Users',
    primaryKey: 'employeeId',
    fields: [
      { key: 'employeeId', labelHi: 'कर्मचारी यूनिक आईडी / कोड *', labelEn: 'Employee ID *', required: true, type: 'string', aliases: ['employeeid', 'empid', 'emp_id', 'कर्मचारी कोड', 'यूनिक आईडी', 'employee_code', 'id'] },
      { key: 'name', labelHi: 'शिक्षक / स्टाफ का नाम *', labelEn: 'Staff Name *', required: true, type: 'string', aliases: ['name', 'staffname', 'teachername', 'नाम', 'शिक्षक का नाम', 'कर्मचारी नाम'] },
      { key: 'assignedSchoolUdise', labelHi: 'पदस्थ शाला यू-डायस कोड *', labelEn: 'Assigned School UDISE *', required: true, type: 'string', aliases: ['assignedschooludise', 'schooludise', 'udise', 'पदस्थ शाला', 'यूडायस', 'school_udise'] },
      { key: 'designation', labelHi: 'पदनाम *', labelEn: 'Designation *', required: true, type: 'select', options: ['प्राचार्य', 'प्रधानाध्यापक', 'उच्च माध्यमिक शिक्षक', 'उच्च श्रेणी शिक्षक', 'माध्यमिक शिक्षक', 'प्राथमिक शिक्षक', 'अतिथि शिक्षक', 'रसोइया', 'सफाई कर्मचारी', 'सहायक ग्रेड-3'], aliases: ['designation', 'पद', 'पदनाम', 'पदवी'] },
      { key: 'subject', labelHi: 'अध्यापन विषय', labelEn: 'Subject', required: false, type: 'string', aliases: ['subject', 'विषय', 'मुख्य विषय'] },
      { key: 'mobile', labelHi: 'मोबाइल नंबर *', labelEn: 'Mobile Number *', required: true, type: 'string', aliases: ['mobile', 'phone', 'मोबाइल', 'फ़ोन नंबर'] },
      { key: 'email', labelHi: 'ईमेल पता', labelEn: 'Email', required: false, type: 'string', aliases: ['email', 'ईमेल'] },
      { key: 'gender', labelHi: 'लिंग (बालक/बालिका/अन्य)', labelEn: 'Gender', required: false, type: 'select', options: ['बालक', 'बालिका', 'अन्य'], aliases: ['gender', 'लिंग'] },
      { key: 'joiningDate', labelHi: 'प्रथम नियुक्ति दिनांक', labelEn: 'Joining Date', required: false, type: 'date', aliases: ['joiningdate', 'नियुक्ति दिनांक', 'प्रथम नियुक्ति'] },
      { key: 'qualification', labelHi: 'शैक्षणिक योग्यता', labelEn: 'Qualification', required: false, type: 'string', aliases: ['qualification', 'योग्यता', 'शैक्षणिक योग्यता'] },
      { key: 'dob', labelHi: 'जन्म तिथि', labelEn: 'DOB', required: false, type: 'date', aliases: ['dob', 'जन्मतिथि', 'जन्म दिनांक'] },
      { key: 'category', labelHi: 'संवर्ग (SC/ST/OBC/GENERAL)', labelEn: 'Category', required: false, type: 'select', options: ['SC', 'ST', 'OBC', 'GENERAL'], aliases: ['category', 'संवर्ग', 'जाति'] },
      { key: 'duty', labelHi: 'प्रभार / अतिरिक्त दायित्व', labelEn: 'Duty / Charge', required: false, type: 'string', aliases: ['duty', 'प्रभार', 'दायित्व', 'कार्य'] },
      { key: 'status', labelHi: 'स्थिति (ACTIVE/ON_LEAVE/TRANSFERRED)', labelEn: 'Status', required: false, type: 'select', options: ['ACTIVE', 'ON_LEAVE', 'TRANSFERRED'], aliases: ['status', 'स्थिति'] }
    ],
    sampleRows: [
      {
        employeeId: 'EMP-HM-102',
        name: 'दिनेश कुमार पटेल',
        assignedSchoolUdise: '23080110701',
        designation: 'प्रधानाध्यापक',
        subject: 'गणित व विज्ञान',
        mobile: '9826011111',
        email: 'dinesh.patel@mp.gov.in',
        gender: 'बालक',
        joiningDate: '2012-08-10',
        qualification: 'M.Sc. B.Ed.',
        dob: '1982-04-15',
        category: 'OBC',
        duty: 'संस्था प्रभारी',
        status: 'ACTIVE'
      },
      {
        employeeId: 'EMP-TCH-103',
        name: 'सुनीता त्रिपाठी',
        assignedSchoolUdise: '23080110701',
        designation: 'प्राथमिक शिक्षक',
        subject: 'हिंदी व सामाजिक विज्ञान',
        mobile: '9826011122',
        email: 'sunita.tripathi@mp.gov.in',
        gender: 'बालिका',
        joiningDate: '2016-07-01',
        qualification: 'M.A. D.El.Ed.',
        dob: '1989-11-05',
        category: 'GENERAL',
        duty: 'अध्यापन कार्य',
        status: 'ACTIVE'
      }
    ]
  },

  FACILITY: {
    type: 'FACILITY',
    titleHi: 'भौतिक सुविधाएं (Physical Facilities)',
    titleEn: 'Physical Facilities Data',
    description: 'शाला भवन, कुल कक्ष, अध्यापन कक्ष, बालक/बालिका शौचालय, पेयजल, विद्युत, बाउंड्री वॉल, ICT लैब आदि।',
    iconName: 'Building2',
    primaryKey: 'facilityKey',
    fields: [
      { key: 'schoolUdise', labelHi: 'शाला यू-डायस कोड *', labelEn: 'School UDISE *', required: true, type: 'string', aliases: ['schooludise', 'udise', 'यूडायस', 'school_udise'] },
      { key: 'facilityKey', labelHi: 'सुविधा कोड (Facility Key) *', labelEn: 'Facility Key *', required: true, type: 'string', aliases: ['facilitykey', 'key', 'सुविधा कोड', 'facility_key'] },
      { key: 'facilityName', labelHi: 'सुविधा का नाम *', labelEn: 'Facility Name *', required: true, type: 'string', aliases: ['facilityname', 'name', 'सुविधा नाम', 'सुविधा'] },
      { key: 'available', labelHi: 'उपलब्धता (YES / NO / UNKNOWN) *', labelEn: 'Available *', required: true, type: 'select', options: ['YES', 'NO', 'UNKNOWN'], aliases: ['available', 'availability', 'उपलब्धता', 'उपलब्ध', 'status'] },
      { key: 'condition', labelHi: 'भौतिक स्थिति (उत्कृष्ट/संतोषजनक/मरम्मत योग्य/अनुपयोगी)', labelEn: 'Condition', required: false, type: 'select', options: ['उत्कृष्ट', 'संतोषजनक', 'मरम्मत योग्य', 'अनुपयोगी'], aliases: ['condition', 'स्थिति', 'भौतिक स्थिति'] },
      { key: 'count', labelHi: 'कुल संख्या', labelEn: 'Total Count', required: false, type: 'number', aliases: ['count', 'total', 'संख्या', 'कुल संख्या'] },
      { key: 'usableCount', labelHi: 'क्रियाशील / उपयोगी संख्या', labelEn: 'Usable Count', required: false, type: 'number', aliases: ['usablecount', 'usable', 'उपयोगी संख्या', 'चालू संख्या'] },
      { key: 'repairRequiredCount', labelHi: 'मरम्मत योग्य संख्या', labelEn: 'Repair Required Count', required: false, type: 'number', aliases: ['repairrequiredcount', 'repair', 'मरम्मत संख्या'] },
      { key: 'remarks', labelHi: 'टिप्पणी / विवरण', labelEn: 'Remarks', required: false, type: 'string', aliases: ['remarks', 'टिप्पणी', 'विवरण'] },
      { key: 'requirementDetails', labelHi: 'मांग / आवश्यकता का कारण', labelEn: 'Requirement Details', required: false, type: 'string', aliases: ['requirementdetails', 'requirement', 'मांग', 'आवश्यकता'] }
    ],
    sampleRows: [
      {
        schoolUdise: '23080110701',
        facilityKey: 'drinkingWater',
        facilityName: 'पेयजल सुविधा (Drinking Water)',
        available: 'YES',
        condition: 'उत्कृष्ट',
        count: 1,
        usableCount: 1,
        repairRequiredCount: 0,
        remarks: 'नल-जल कनेक्शन चालू स्थिति में है',
        requirementDetails: ''
      },
      {
        schoolUdise: '23080110701',
        facilityKey: 'toilets',
        facilityName: 'शौचालय सुविधा (Toilets)',
        available: 'YES',
        condition: 'संतोषजनक',
        count: 2,
        usableCount: 2,
        repairRequiredCount: 0,
        remarks: 'बालक व बालिका पृथक शौचालय उपलब्ध',
        requirementDetails: ''
      }
    ]
  },

  ATTENDANCE: {
    type: 'ATTENDANCE',
    titleHi: 'दैनिक उपस्थिति (Attendance Record)',
    titleEn: 'Attendance Record Data',
    description: 'विद्यार्थी, शिक्षक एवं रसोइया दैनिक उपस्थिति डेटा आयात।',
    iconName: 'ClipboardCheck',
    primaryKey: 'date',
    fields: [
      { key: 'date', labelHi: 'उपस्थिति दिनांक (YYYY-MM-DD) *', labelEn: 'Attendance Date *', required: true, type: 'date', aliases: ['date', 'दिनांक', 'तारीख', 'attendancedate'] },
      { key: 'schoolUdise', labelHi: 'शाला यू-डायस कोड *', labelEn: 'School UDISE *', required: true, type: 'string', aliases: ['schooludise', 'udise', 'यूडायस', 'school_udise'] },
      { key: 'type', labelHi: 'संवर्ग प्रकार (STUDENT/TEACHER/PRINCIPAL/RASOIYA) *', labelEn: 'Type *', required: true, type: 'select', options: ['STUDENT', 'TEACHER', 'PRINCIPAL', 'RASOIYA'], aliases: ['type', 'संवर्ग', 'प्रकार', 'category'] },
      { key: 'class', labelHi: 'कक्षा (यदि विद्यार्थी हो)', labelEn: 'Class', required: false, type: 'string', aliases: ['class', 'कक्षा'] },
      { key: 'totalCount', labelHi: 'कुल दर्ज संख्या *', labelEn: 'Total Count *', required: true, type: 'number', aliases: ['totalcount', 'total', 'कुल दर्ज', 'कुल संख्या'] },
      { key: 'presentCount', labelHi: 'उपस्थित संख्या *', labelEn: 'Present Count *', required: true, type: 'number', aliases: ['presentcount', 'present', 'उपस्थित', 'उपस्थित संख्या'] },
      { key: 'absentCount', labelHi: 'अनुपस्थित संख्या', labelEn: 'Absent Count', required: false, type: 'number', aliases: ['absentcount', 'absent', 'अनुपस्थित', 'अनुपस्थित संख्या'] },
      { key: 'markedBy', labelHi: 'उपस्थिति दर्जकर्ता नाम / आईडी', labelEn: 'Marked By', required: false, type: 'string', aliases: ['markedby', 'दर्जकर्ता', 'शिक्षक'] }
    ],
    sampleRows: [
      {
        date: '2026-08-31',
        schoolUdise: '23080110701',
        type: 'STUDENT',
        class: 'ALL',
        totalCount: 6,
        presentCount: 5,
        absentCount: 1,
        markedBy: 'दिनेश कुमार पटेल (HM)'
      },
      {
        date: '2026-08-31',
        schoolUdise: '23080110701',
        type: 'TEACHER',
        class: '',
        totalCount: 3,
        presentCount: 3,
        absentCount: 0,
        markedBy: 'दिनेश कुमार पटेल (HM)'
      }
    ]
  },

  MDM: {
    type: 'MDM',
    titleHi: 'मध्याह्न भोजन (MDM Daily Log)',
    titleEn: 'MDM Daily Distribution Data',
    description: 'दैनिक भोजन वितरण, लाभान्वित विद्यार्थी, रसोइया उपस्थिति, खाद्यान्न उपलब्धता व स्वच्छता।',
    iconName: 'Utensils',
    primaryKey: 'date',
    fields: [
      { key: 'date', labelHi: 'वितरण दिनांक (YYYY-MM-DD) *', labelEn: 'Distribution Date *', required: true, type: 'date', aliases: ['date', 'दिनांक', 'तारीख', 'mdmdate'] },
      { key: 'schoolUdise', labelHi: 'शाला यू-डायस कोड *', labelEn: 'School UDISE *', required: true, type: 'string', aliases: ['schooludise', 'udise', 'यूडायस', 'school_udise'] },
      { key: 'eligibleStudents', labelHi: 'पात्र दर्ज विद्यार्थी *', labelEn: 'Eligible Students *', required: true, type: 'number', aliases: ['eligiblestudents', 'eligible', 'पात्र', 'कुल दर्ज'] },
      { key: 'presentStudents', labelHi: 'उपस्थित विद्यार्थी *', labelEn: 'Present Students *', required: true, type: 'number', aliases: ['presentstudents', 'present', 'उपस्थित'] },
      { key: 'mealsServed', labelHi: 'भोजन परोसा गया *', labelEn: 'Meals Served *', required: true, type: 'number', aliases: ['mealsserved', 'served', 'वितरित भोजन', 'परोसा गया'] },
      { key: 'mealsNotServed', labelHi: 'भोजन न पाने वाले', labelEn: 'Meals Not Served', required: false, type: 'number', aliases: ['mealsnotserved', 'अवितरित'] },
      { key: 'cookPresent', labelHi: 'रसोइया उपस्थित (हाँ/नहीं)', labelEn: 'Cook Present', required: false, type: 'boolean', aliases: ['cookpresent', 'रसोइया उपस्थित', 'cook'] },
      { key: 'shgName', labelHi: 'स्व-सहायता समूह का नाम', labelEn: 'SHG Name', required: false, type: 'string', aliases: ['shgname', 'समूह', 'स्व सहायता समूह'] },
      { key: 'wheatStockKg', labelHi: 'गेहूं स्टॉक (किलो)', labelEn: 'Wheat Stock (Kg)', required: false, type: 'number', aliases: ['wheatstockkg', 'wheat', 'गेहूं'] },
      { key: 'riceStockKg', labelHi: 'चावल स्टॉक (किलो)', labelEn: 'Rice Stock (Kg)', required: false, type: 'number', aliases: ['ricestockkg', 'rice', 'चावल'] },
      { key: 'kitchenHygiene', labelHi: 'रसोई स्वच्छता (उत्कृष्ट/संतोषजनक/सुधार आवश्यक)', labelEn: 'Kitchen Hygiene', required: false, type: 'select', options: ['उत्कृष्ट', 'संतोषजनक', 'सुधार आवश्यक'], aliases: ['kitchenhygiene', 'स्वच्छता', 'hygiene'] },
      { key: 'menuItem', labelHi: 'मेनू अनुसार भोजन', labelEn: 'Menu Item', required: false, type: 'string', aliases: ['menuitem', 'मेनू', 'व्यंजन'] },
      { key: 'problemsReported', labelHi: 'समस्या / टिप्पणी', labelEn: 'Problems / Remarks', required: false, type: 'string', aliases: ['problemsreported', 'remarks', 'समस्या', 'टिप्पणी'] }
    ],
    sampleRows: [
      {
        date: '2026-08-31',
        schoolUdise: '23080110701',
        eligibleStudents: 6,
        presentStudents: 5,
        mealsServed: 5,
        mealsNotServed: 0,
        cookPresent: true,
        shgName: 'जय मां शारदा स्व-सहायता समूह',
        wheatStockKg: 85,
        riceStockKg: 120,
        kitchenHygiene: 'उत्कृष्ट',
        menuItem: 'रोटी, दाल, मौसमी सब्जी',
        problemsReported: 'कोई समस्या नहीं'
      }
    ]
  },

  COMPLAINT: {
    type: 'COMPLAINT',
    titleHi: 'शिकायत एवं निवारण (Grievances & Complaints)',
    titleEn: 'Complaint & Grievance Data',
    description: 'संकुल स्तर पर प्राप्त जनशिकायतें, शिक्षक अनुपस्थिति, मध्याह्न भोजन गुणवत्ता, भवन मरम्मत मांग आदि।',
    iconName: 'AlertTriangle',
    primaryKey: 'complaintId',
    fields: [
      { key: 'complaintId', labelHi: 'शिकायत क्रमांक (Complaint ID)', labelEn: 'Complaint ID', required: false, type: 'string', aliases: ['complaintid', 'id', 'शिकायत क्रमांक', 'क्रमांक'] },
      { key: 'schoolUdise', labelHi: 'संबंधित शाला यू-डायस *', labelEn: 'School UDISE *', required: true, type: 'string', aliases: ['schooludise', 'udise', 'यूडायस', 'school_udise'] },
      { key: 'category', labelHi: 'शिकायत श्रेणी *', labelEn: 'Category *', required: true, type: 'select', options: ['शिक्षक अनुपस्थिति/लेट', 'मध्याह्न भोजन गुणवत्ता', 'पेयजल/शौचालय समस्या', 'भवन व विद्युत मरम्मत', 'छात्रवृत्ति/गणवेश वितरण', 'प्रशासनिक व अन्य'], aliases: ['category', 'श्रेणी', 'शिकायत प्रकार'] },
      { key: 'subject', labelHi: 'शिकायत का विषय *', labelEn: 'Subject *', required: true, type: 'string', aliases: ['subject', 'विषय', 'title'] },
      { key: 'description', labelHi: 'शिकायत का विस्तृत विवरण', labelEn: 'Description', required: false, type: 'string', aliases: ['description', 'विवरण', 'विस्तार'] },
      { key: 'submittedBy', labelHi: 'शिकायतकर्ता का नाम *', labelEn: 'Submitted By *', required: true, type: 'string', aliases: ['submittedby', 'शिकायतकर्ता', 'नाम'] },
      { key: 'submitterRole', labelHi: 'शिकायतकर्ता का पद/संबद्धता', labelEn: 'Submitter Role', required: false, type: 'string', aliases: ['submitterrole', 'पद', 'संबद्धता'] },
      { key: 'submitterMobile', labelHi: 'शिकायतकर्ता मोबाइल', labelEn: 'Mobile', required: false, type: 'string', aliases: ['submittermobile', 'mobile', 'मोबाइल'] },
      { key: 'date', labelHi: 'पंजीयन दिनांक (YYYY-MM-DD)', labelEn: 'Date', required: false, type: 'date', aliases: ['date', 'दिनांक', 'पंजीयन दिनांक'] },
      { key: 'priority', labelHi: 'प्राथमिकता (HIGH/MEDIUM/LOW)', labelEn: 'Priority', required: false, type: 'select', options: ['HIGH', 'MEDIUM', 'LOW'], aliases: ['priority', 'प्राथमिकता'] },
      { key: 'status', labelHi: 'स्थिति (PENDING/IN_PROGRESS/RESOLVED/REJECTED)', labelEn: 'Status', required: false, type: 'select', options: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'], aliases: ['status', 'स्थिति'] },
      { key: 'actionTaken', labelHi: 'की गई कार्यवाही', labelEn: 'Action Taken', required: false, type: 'string', aliases: ['actiontaken', 'कार्यवाही', 'निवारण'] }
    ],
    sampleRows: [
      {
        complaintId: 'COMP-2026-101',
        schoolUdise: '23080110701',
        category: 'पेयजल/शौचालय समस्या',
        subject: 'हैंडपंप में मोटर खराबी',
        description: 'शाला परिसर के बोरवेल की मोटर में वोल्टेज समस्या के कारण पानी आपूर्ति बाधित।',
        submittedBy: 'रामेश्वर दयाल (पालक)',
        submitterRole: 'पालक (SMC सदस्य)',
        submitterMobile: '9826033333',
        date: '2026-08-28',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        actionTaken: 'पीएचई विभाग एवं ग्राम पंचायत को मरम्मत पत्र प्रेषित'
      }
    ]
  },

  WORK: {
    type: 'WORK',
    titleHi: 'शासकीय कार्य एवं आदेश (Government Tasks & Orders)',
    titleEn: 'Government Tasks & Orders Data',
    description: 'विभाग द्वारा जारी निर्देश, ई-केवाईसी अभियान, समग्र प्रोफाइल अपडेशन, शाला अनुदान व्यय आदि।',
    iconName: 'ClipboardList',
    primaryKey: 'orderNumber',
    fields: [
      { key: 'workName', labelHi: 'कार्य का शीर्षक / नाम *', labelEn: 'Task Name *', required: true, type: 'string', aliases: ['workname', 'title', 'कार्य का नाम', 'कार्य', 'आदेश'] },
      { key: 'orderNumber', labelHi: 'शासकीय आदेश क्रमांक *', labelEn: 'Order Number *', required: true, type: 'string', aliases: ['ordernumber', 'order_no', 'आदेश क्रमांक', 'क्रमांक'] },
      { key: 'schoolUdise', labelHi: 'संबंधित शाला यू-डायस *', labelEn: 'School UDISE *', required: true, type: 'string', aliases: ['schooludise', 'udise', 'यूडायस', 'school_udise'] },
      { key: 'description', labelHi: 'कार्य का विवरण', labelEn: 'Description', required: false, type: 'string', aliases: ['description', 'विवरण'] },
      { key: 'assignedDate', labelHi: 'आवंटन दिनांक (YYYY-MM-DD)', labelEn: 'Assigned Date', required: false, type: 'date', aliases: ['assigneddate', 'आवंटन दिनांक', 'दिनांक'] },
      { key: 'dueDate', labelHi: 'अंतिम तिथि (Due Date) *', labelEn: 'Due Date *', required: true, type: 'date', aliases: ['duedate', 'अंतिम तिथि', 'लक्ष्य दिनांक', 'targetdate'] },
      { key: 'status', labelHi: 'स्थिति (PENDING/IN_PROGRESS/COMPLETED/OVERDUE)', labelEn: 'Status', required: false, type: 'select', options: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'], aliases: ['status', 'स्थिति'] },
      { key: 'priority', labelHi: 'प्राथमिकता (HIGH/MEDIUM/LOW)', labelEn: 'Priority', required: false, type: 'select', options: ['HIGH', 'MEDIUM', 'LOW'], aliases: ['priority', 'प्राथमिकता'] },
      { key: 'responsiblePerson', labelHi: 'उत्तरदायी अधिकारी / शिक्षक', labelEn: 'Responsible Person', required: false, type: 'string', aliases: ['responsibleperson', 'उत्तरदायी', 'प्रभारी'] },
      { key: 'remarks', labelHi: 'प्रगति टिप्पणी', labelEn: 'Remarks', required: false, type: 'string', aliases: ['remarks', 'टिप्पणी'] }
    ],
    sampleRows: [
      {
        workName: 'समग्र ई-केवाईसी एवं अपार (APAAR) आईडी निर्माण',
        orderNumber: 'RSK/2026/4102',
        schoolUdise: '23080110701',
        description: 'कक्षा 1 से 8 तक के सभी दर्ज विद्यार्थियों की शत-प्रतिशत ई-केवाईसी व आधार सीडिंग पूर्ण करना।',
        assignedDate: '2026-08-01',
        dueDate: '2026-09-05',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        responsiblePerson: 'दिनेश कुमार पटेल (प्रधानाध्यापक)',
        remarks: '85% कार्य पूर्ण'
      }
    ]
  },

  LITERACY_LEARNERS: {
    type: 'LITERACY_LEARNERS',
    titleHi: 'असाक्षर व्यक्ति सूची (प्रपत्र 1)',
    titleEn: 'Illiterate Learners Master',
    description: '15+ आयु वर्ग के असाक्षर व्यक्तियों की प्रविष्टि, समग्र आईडी, अक्षर साथी टैगिंग एवं परीक्षा परिणाम।',
    iconName: 'BookOpen',
    primaryKey: 'samagraId',
    fields: [
      { key: 'name', labelHi: 'असाक्षर का नाम *', labelEn: 'Learner Name *', required: true, type: 'string', aliases: ['name', 'नाम', 'असाक्षर का नाम'] },
      { key: 'fatherOrHusbandName', labelHi: 'पिता/पति का नाम *', labelEn: 'Father/Husband Name *', required: true, type: 'string', aliases: ['fathername', 'पिता का नाम', 'पति का नाम'] },
      { key: 'gender', labelHi: 'लिंग *', labelEn: 'Gender *', required: true, type: 'select', options: ['महिला', 'पुरुष', 'अन्य'], aliases: ['gender', 'लिंग'] },
      { key: 'age', labelHi: 'आयु', labelEn: 'Age', required: false, type: 'number', aliases: ['age', 'उम्र', 'आयु'] },
      { key: 'category', labelHi: 'वर्ग', labelEn: 'Category', required: false, type: 'select', options: ['SC', 'ST', 'OBC', 'General'], aliases: ['category', 'वर्ग', 'जाति'] },
      { key: 'samagraId', labelHi: 'समग्र आईडी', labelEn: 'Samagra ID', required: false, type: 'string', aliases: ['samagraid', 'समग्र', 'समग्र आईडी'] },
      { key: 'schoolUdise', labelHi: 'संबंधित शाला यू-डायस *', labelEn: 'School UDISE *', required: true, type: 'string', aliases: ['schooludise', 'udise', 'यूडायस'] },
      { key: 'mobileNumber', labelHi: 'मोबाइल नंबर', labelEn: 'Mobile', required: false, type: 'string', aliases: ['mobile', 'mobileNumber', 'मोबाइल'] }
    ],
    sampleRows: [
      {
        name: 'रामकली बाई',
        fatherOrHusbandName: 'महेन्द्र सिंह',
        gender: 'महिला',
        age: 38,
        category: 'OBC',
        samagraId: '104829104',
        schoolUdise: '23080108302',
        mobileNumber: '9826012345'
      }
    ]
  },

  LITERACY_VOLUNTEERS: {
    type: 'LITERACY_VOLUNTEERS',
    titleHi: 'अक्षर साथी सूची (प्रपत्र 2)',
    titleEn: 'Akshar Sathi Volunteers',
    description: 'नवभारत साक्षरता कार्यक्रम हेतु पंजीकृत स्वयंसेवक, महाविद्यालयीन छात्र एवं अक्षर साथी।',
    iconName: 'Users',
    primaryKey: 'mobileNumber',
    fields: [
      { key: 'name', labelHi: 'अक्षर साथी का नाम *', labelEn: 'Volunteer Name *', required: true, type: 'string', aliases: ['name', 'अक्षर साथी', 'नाम'] },
      { key: 'fatherOrHusbandName', labelHi: 'पिता/पति का नाम', labelEn: 'Father/Husband Name', required: false, type: 'string', aliases: ['fathername', 'पिता का नाम'] },
      { key: 'mobileNumber', labelHi: 'मोबाइल नंबर *', labelEn: 'Mobile Number *', required: true, type: 'string', aliases: ['mobile', 'mobileNumber', 'फ़ोन'] },
      { key: 'qualification', labelHi: 'योग्यता', labelEn: 'Qualification', required: false, type: 'string', aliases: ['qualification', 'योग्यता', 'शिक्षा'] },
      { key: 'institution', labelHi: 'संस्था', labelEn: 'Institution', required: false, type: 'string', aliases: ['institution', 'संस्था'] },
      { key: 'schoolUdise', labelHi: 'शाला यू-डायस *', labelEn: 'School UDISE *', required: true, type: 'string', aliases: ['schooludise', 'udise'] }
    ],
    sampleRows: [
      {
        name: 'अमित कुमार पटैल',
        fatherOrHusbandName: 'हरिशंकर पटैल',
        mobileNumber: '9425112233',
        qualification: 'स्नातक (B.Sc.)',
        institution: 'महाविद्यालयीन छात्र',
        schoolUdise: '23080108302'
      }
    ]
  },

  LITERACY_EXAMS: {
    type: 'LITERACY_EXAMS',
    titleHi: 'साक्षरता परीक्षा परिणाम (प्रपत्र 4)',
    titleEn: 'Literacy Exam Results',
    description: 'सत्रवार आयोजित बुनियादी साक्षरता एवं संख्यात्मकता मूल्यांकन परीक्षा का विद्यालयवार परिणाम।',
    iconName: 'Award',
    primaryKey: 'examName',
    fields: [
      { key: 'examName', labelHi: 'परीक्षा का नाम *', labelEn: 'Exam Name *', required: true, type: 'string', aliases: ['examname', 'परीक्षा'] },
      { key: 'examDate', labelHi: 'परीक्षा दिनांक *', labelEn: 'Exam Date *', required: true, type: 'date', aliases: ['examdate', 'दिनांक'] },
      { key: 'schoolUdise', labelHi: 'शाला यू-डायस *', labelEn: 'School UDISE *', required: true, type: 'string', aliases: ['schooludise', 'udise'] },
      { key: 'participatedCount', labelHi: 'सम्मिलित शिक्षार्थी', labelEn: 'Participated', required: false, type: 'number', aliases: ['participated', 'सम्मिलित'] },
      { key: 'passedCount', labelHi: 'उत्तीर्ण शिक्षार्थी', labelEn: 'Passed', required: false, type: 'number', aliases: ['passed', 'उत्तीर्ण'] }
    ],
    sampleRows: [
      {
        examName: 'मूल्यांकन परीक्षा मार्च 2024',
        examDate: '2024-03-17',
        schoolUdise: '23080108302',
        participatedCount: 14,
        passedCount: 12
      }
    ]
  },

  LITERACY_PARTNERS: {
    type: 'LITERACY_PARTNERS',
    titleHi: 'सहयोगी विभाग / संस्थाएँ (प्रपत्र 5)',
    titleEn: 'Supporting Institutions',
    description: 'जन अभियान परिषद, नेहरू युवा केंद्र, महाविद्यालय, एनएसएस एवं स्वैच्छिक संगठन।',
    iconName: 'Building2',
    primaryKey: 'institutionName',
    fields: [
      { key: 'institutionName', labelHi: 'संस्था का नाम *', labelEn: 'Institution Name *', required: true, type: 'string', aliases: ['institutionName', 'संस्था'] },
      { key: 'contactPersonName', labelHi: 'प्रभारी व्यक्ति का नाम', labelEn: 'Contact Person', required: false, type: 'string', aliases: ['contactPerson', 'प्रभारी'] },
      { key: 'mobile', labelHi: 'मोबाइल नंबर', labelEn: 'Mobile', required: false, type: 'string', aliases: ['mobile', 'फ़ोन'] },
      { key: 'schoolUdise', labelHi: 'शाला यू-डायस *', labelEn: 'School UDISE *', required: true, type: 'string', aliases: ['schooludise', 'udise'] }
    ],
    sampleRows: [
      {
        institutionName: 'म.प्र. जन अभियान परिषद',
        contactPersonName: 'राजेश पाठक (समन्वयक)',
        mobile: '9827011223',
        schoolUdise: '23080108302'
      }
    ]
  }
};
