import { CLUSTER_37_SCHOOLS } from './clusterSchoolsData';
import {
  School,
  Student,
  Staff,
  PhysicalFacility,
  AttendanceRecord,
  MDMRecord,
  GovernmentWork,
  NotificationItem,
  Complaint,
  DocumentItem,
  AuditLog,
  User,
  AppSettings,
  SocialCategory,
  SchoolType,
  UploadHistoryItem,
  Rasoiya,
  SHG
} from '../types';

export const initialSettings: AppSettings = {
  academicSession: '2026-27',
  sankulName: 'संकुल मलगुवां',
  jskName: 'जन शिक्षा केंद्र मलगुवां',
  blockName: 'बलदेवगढ़',
  districtName: 'टीकमगढ़ (म.प्र.)',
  allowSelfRegistration: false,
  requireApprovalForRegistration: true,
  enableAuditLogging: true,
  defaultPrintOrientation: 'PORTRAIT',
};

export const initialUsers: User[] = [
  {
    id: 'USR-ADMIN-01',
    username: 'SANYAMJAIN88',
    password: 'ADMIN88159',
    name: 'संयम जैन',
    role: 'ADMIN',
    employeeId: 'EMP-ADM-88',
    mobile: '9826088159',
    email: 'admin.malguwa@mp.gov.in',
    designation: 'मुख्य व्यवस्थापक (System Admin)',
    assignedSchoolUdise: '',
    status: 'ACTIVE',
    lastLogin: '2026-08-31 09:00 AM',
    createdAt: '2025-01-01',
    block: 'बलदेवगढ़',
    district: 'टीकमगढ़',
  },
  {
    id: 'USR-CAC-01',
    username: 'Sanjayjain1979',
    password: 'CAC700038',
    name: 'संजय कुमार जैन',
    role: 'CAC',
    employeeId: 'EMP-CAC-201',
    mobile: '7000382532',
    alternateMobile: '9753679036',
    email: 'cac.malguwa@mp.gov.in',
    designation: 'संकul समन्वयक (CAC)',
    assignedSchoolUdise: '',
    status: 'ACTIVE',
    lastLogin: '2026-08-31 08:30 AM',
    createdAt: '2025-06-01',
    block: 'बलदेवगढ़',
    district: 'टीकमगढ़',
  },
  {
    id: 'USR-CAC-02',
    username: 'Sanmatijain99',
    password: 'CAC997732',
    name: 'सन्मति कुमार जैन',
    role: 'CAC',
    employeeId: 'EMP-CAC-202',
    mobile: '9977323573',
    alternateMobile: '9977323573',
    email: 'cac.sanmati@mp.gov.in',
    designation: 'संकुल समन्वयक (CAC)',
    assignedSchoolUdise: '',
    status: 'ACTIVE',
    lastLogin: '2026-08-31 08:15 AM',
    createdAt: '2025-06-01',
    block: 'बलदेवगढ़',
    district: 'टीकमगढ़',
  }
];

// EXACT 37 SCHOOLS OF JAN SHIKSHA KENDRA MALGUWA
export const initialSchools: School[] = CLUSTER_37_SCHOOLS;

// Initial Students seeded across the 37 schools
export const initialStudents: Student[] = [];

const sampleFirstNamesBoys = ['आर्यन', 'अमित', 'सुमित', 'पंकज', 'दीपक', 'अभिषेक', 'शिवम', 'आलोक', 'हर्ष', 'संजय', 'मनोज', 'रोहित', 'अंकित', 'विकास', 'राहुल', 'अजय', 'आयुष', 'समीर', 'आदित्य', 'कृष्णा'];
const sampleFirstNamesGirls = ['प्रिया', 'सोनम', 'खुशी', 'पूजा', 'दीक्षा', 'काजल', 'नेहा', 'अंजलि', 'स्वाति', 'रचना', 'आरती', 'संध्या', 'कामिनी', 'शिवानी', 'दिव्या', 'मोहिनी', 'रिया', 'प्राची', 'श्रेया', 'तनु'];
const categories: SocialCategory[] = ['OBC', 'SC', 'ST', 'GENERAL'];

// Generate clean, authentic student rosters for all 37 schools
initialSchools.forEach((school, sIdx) => {
  const isHighSchool = school.schoolType === 'हाई स्कूल';
  const isMiddleSchool = school.schoolType === 'माध्यमिक';
  const count = isHighSchool ? 10 : isMiddleSchool ? 8 : 6;

  for (let i = 1; i <= count; i++) {
    const isBoy = (i + sIdx) % 2 === 0;
    const firstName = isBoy
      ? sampleFirstNamesBoys[(sIdx * 3 + i) % sampleFirstNamesBoys.length]
      : sampleFirstNamesGirls[(sIdx * 3 + i) % sampleFirstNamesGirls.length];
    const cat = categories[(sIdx + i) % categories.length];
    const surname = cat === 'SC' ? 'अहिरवार' : cat === 'ST' ? 'गौड़' : cat === 'OBC' ? 'पटेल' : 'दीक्षित';
    let fullName = `${firstName} ${surname}`;
    let fatherName = `राम ${surname}`;
    let motherName = `शांति देवी`;
    let boyGirl: 'बालक' | 'बालिका' = isBoy ? 'बालक' : 'बालिका';
    let catSocial: SocialCategory = cat;
    let cls = '1';
    if (isHighSchool) {
      cls = (9 + (i % 2)).toString(); // 9 or 10
    } else if (isMiddleSchool) {
      cls = (6 + (i % 3)).toString(); // 6, 7, 8
    } else {
      cls = ((i % 5) + 1).toString(); // 1 to 5
    }

    // Special authentic configuration for PS KACHHIYAT (23080110702)
    if (school.udise === '23080110702') {
      const kachhiyatStudents = [
        { name: 'आरव कुशवाहा', father: 'महेश कुशवाहा', mother: 'सुनीता कुशवाहा', gender: 'बालक' as const, cat: 'OBC' as SocialCategory, cls: '5' },
        { name: 'प्रिया अहिरवार', father: 'कमलेश अहिरवार', mother: 'मंजू अहिरवार', gender: 'बालिका' as const, cat: 'SC' as SocialCategory, cls: '5' },
        { name: 'अंकित रैकवार', father: 'दिनेश रैकवार', mother: 'ऊषा रैकवार', gender: 'बालक' as const, cat: 'OBC' as SocialCategory, cls: '4' },
        { name: 'दीक्षा पटेल', father: 'राजेश पटेल', mother: 'ममता पटेल', gender: 'बालिका' as const, cat: 'OBC' as SocialCategory, cls: '3' },
        { name: 'मोहित अहिरवार', father: 'सूरज अहिरवार', mother: 'गीता अहिरवार', gender: 'बालक' as const, cat: 'SC' as SocialCategory, cls: '2' },
        { name: 'काजल प्रजापति', father: 'मुकेश प्रजापति', mother: 'आशा प्रजापति', gender: 'बालिका' as const, cat: 'OBC' as SocialCategory, cls: '1' }
      ];
      const ks = kachhiyatStudents[i - 1];
      if (ks) {
        fullName = ks.name;
        fatherName = ks.father;
        motherName = ks.mother;
        boyGirl = ks.gender;
        catSocial = ks.cat;
        cls = ks.cls;
      }
    }

    const isCwsn = i === 3 && sIdx % 5 === 0;

    initialStudents.push({
      id: `STU-${school.udise.slice(-5)}-${i}`,
      srNumber: `SR-2025-${school.udise.slice(-3)}${i.toString().padStart(2, '0')}`,
      samagraId: `109${school.udise.slice(-4)}${i.toString().padStart(2, '0')}`,
      apaarId: `APAAR-${school.udise.slice(-4)}-${i.toString().padStart(3, '0')}`,
      name: fullName,
      fatherName,
      motherName,
      gender: boyGirl,
      dob: isHighSchool ? `2010-0${(i % 9) + 1}-12` : isMiddleSchool ? `2013-0${(i % 9) + 1}-15` : `2017-0${(i % 9) + 1}-20`,
      class: cls,
      section: 'A',
      category: catSocial,
      isCwsn,
      cwsnType: isCwsn ? 'दृष्टिबाधित (लो विजन)' : undefined,
      schoolUdise: school.udise,
      address: `ग्राम ${school.village}, संकुल मलग़ुवां`,
      mobile: `9826${(sIdx * 1000 + i * 111).toString().slice(0, 6)}`,
      status: 'ACTIVE',
      admissionDate: '2023-07-01',
      bankAccount: {
        accountNumber: `3049${school.udise.slice(-4)}${i.toString().padStart(3, '0')}`,
        ifsc: 'SBIN0001234',
        bankName: 'भारतीय स्टेट बैंक मलग़ुवां'
      }
    });
  }
});

// Initial Staff for all 37 schools
export const initialStaff: Staff[] = [];

initialSchools.forEach((school, sIdx) => {
  const isHighSchool = school.schoolType === 'हाई स्कूल';
  const isMiddleSchool = school.schoolType === 'माध्यमिक';

  // 1. Principal / HM
  initialStaff.push({
    id: `STF-${school.udise.slice(-5)}-1`,
    employeeId: school.principalEmployeeId,
    employeeCode: school.principalEmployeeId,
    uniqueId: `UID-MP-${8200 + sIdx}`,
    name: school.principalName,
    gender: 'बालक',
    designation: isHighSchool ? 'प्राचार्य' : 'प्रधानाध्यापक',
    subject: isHighSchool ? 'प्रशासन / गणित' : isMiddleSchool ? 'विज्ञान / गणित' : 'भाषा एवं गणित',
    mobile: school.principalMobile,
    email: school.email,
    joiningDate: '2010-07-15',
    postingDate: '2019-06-18',
    assignedSchoolUdise: school.udise,
    assignedClasses: isHighSchool ? ['9', '10'] : isMiddleSchool ? ['7', '8'] : ['4', '5'],
    duty: 'संस्था प्रभारी व समग्र शाला प्रबंधन',
    status: 'ACTIVE',
    qualification: isHighSchool ? 'M.Sc., M.Ed.' : 'M.A., B.Ed.',
    dob: '1976-05-10',
    category: 'OBC',
    caste: 'कुशवाहा',
    aadhaarNumber: `92841029384${sIdx % 10}`,
    voterIdNumber: `MP/06/042/${100200 + sIdx}`,
    teacherType: isHighSchool ? 'वर्ग 1' : 'वर्ग 2',
    isBlo: sIdx === 0,
    isCensus: false,
    isOd: false,
  });

  // 2. Teacher
  const teacherNames = ['सुनीता त्रिपाठी', 'आनंद खरे', 'प्रियंका सोनी', 'राजकुमार अहिरवार', 'कमलेश कुशवाहा', 'रीना राजपूत', 'सुधाकर पाठक', 'आशा खरे'];
  const teacherCastes = ['ब्राह्मण', 'कायस्थ', 'सोनी', 'अहिरवार', 'कुशवाहा', 'राजपूत', 'ब्राह्मण', 'खरे'];
  const teacherName = teacherNames[sIdx % teacherNames.length];
  const teacherCaste = teacherCastes[sIdx % teacherCastes.length];

  initialStaff.push({
    id: `STF-${school.udise.slice(-5)}-2`,
    employeeId: `EMP-TCH-${300 + sIdx}`,
    employeeCode: `EMP-TCH-${300 + sIdx}`,
    uniqueId: `UID-MP-${9400 + sIdx}`,
    name: teacherName,
    gender: sIdx % 2 === 0 ? 'बालिका' : 'बालक',
    designation: isHighSchool ? 'उच्च माध्यमिक शिक्षक' : isMiddleSchool ? 'माध्यमिक शिक्षक' : 'प्राथमिक शिक्षक',
    subject: isHighSchool ? 'भौतिकी / रसायन' : isMiddleSchool ? 'गणित / विज्ञान' : 'पर्यावरण व हिंदी',
    mobile: `9754${(sIdx * 1111 + 2222).toString().slice(0, 6)}`,
    email: `${teacherName.replace(/\s+/g, '.').toLowerCase()}@mp.gov.in`,
    joiningDate: '2015-08-01',
    postingDate: '2021-07-01',
    assignedSchoolUdise: school.udise,
    assignedClasses: isHighSchool ? ['9', '10'] : isMiddleSchool ? ['6', '7'] : ['1', '2', '3'],
    duty: 'अध्यापन व MDM नोडल प्रभारी',
    status: 'ACTIVE',
    qualification: isHighSchool ? 'M.Sc., B.Ed.' : 'B.Sc., B.Ed.',
    dob: '1985-11-20',
    category: sIdx % 4 === 3 ? 'SC' : sIdx % 3 === 0 ? 'GENERAL' : 'OBC',
    caste: teacherCaste,
    aadhaarNumber: `83920194857${(sIdx + 1) % 10}`,
    voterIdNumber: `MP/06/042/${200300 + sIdx}`,
    teacherType: isHighSchool ? 'वर्ग 1' : isMiddleSchool ? 'वर्ग 2' : 'वर्ग 3',
    isBlo: sIdx % 2 === 1,
    isCensus: sIdx % 3 === 0,
    isOd: sIdx === 2,
  });

  // 3. Cook / Rasoiya (for Government Schools having MDM)
  if (!school.schoolType.includes('अशासकीय')) {
    const cookNames = ['गीता बाई रसोइया', 'कमला बाई', 'कस्तूरी बाई', 'फुंदी बाई', 'राधा बाई', 'मंजू बाई', 'शांति बाई', 'सुमित्रा बाई'];
    initialStaff.push({
      id: `STF-${school.udise.slice(-5)}-3`,
      employeeId: `EMP-RSY-${500 + sIdx}`,
      name: cookNames[sIdx % cookNames.length],
      gender: 'बालिका',
      designation: 'रसोइया',
      subject: 'मध्याह्न भोजन',
      mobile: `9179${(sIdx * 2222 + 3333).toString().slice(0, 6)}`,
      joiningDate: '2016-07-01',
      assignedSchoolUdise: school.udise,
      assignedClasses: [],
      duty: 'MDM भोजन निर्माण व रसोई स्वच्छता',
      status: 'ACTIVE',
      qualification: 'साक्षर / 5वीं उत्तीर्ण',
      dob: '1982-08-15',
      category: 'OBC',
    });
  }
});

// All 22 Physical Facilities Master definition
export const facilityMasterList = [
  { key: 'building', name: 'भवन (Building)' },
  { key: 'rooms', name: 'कुल कक्ष (Total Rooms)' },
  { key: 'classrooms', name: 'अध्यापन कक्ष (Classrooms)' },
  { key: 'toilets', name: 'शौचालय सुविधा (Toilets)' },
  { key: 'drinkingWater', name: 'पेयजल सुविधा (Drinking Water)' },
  { key: 'electricity', name: 'विद्युत संयोजन (Electricity)' },
  { key: 'furniture', name: 'फर्नीचर/डेस्क-बेंच (Furniture)' },
  { key: 'boundaryWall', name: 'चारदीवारी/बाउंड्री वॉल (Boundary Wall)' },
  { key: 'playground', name: 'खेल का मैदान (Playground)' },
  { key: 'ramp', name: 'दिव्यांग रैंप व रेलिंग (Ramp with Railing)' },
  { key: 'kitchen', name: 'रसोई शेड (Kitchen Shed)' },
  { key: 'poshanVatika', name: 'पोषण वाटिका (Poshan Vatika)' },
  { key: 'playEquipment', name: 'खेल सामग्री (Play Equipment)' },
  { key: 'laboratory', name: 'विज्ञान प्रयोगशाला (Laboratory)' },
  { key: 'library', name: 'पुस्तकालय/रीडिंग कॉर्नर (Library)' },
  { key: 'ict', name: 'कंप्यूटर/ICT लैब (ICT Facility)' },
  { key: 'internet', name: 'इंटरनेट कनेक्टिविटी (Internet)' },
  { key: 'handwash', name: 'हैंडवॉश यूनिट (Handwash Unit)' },
  { key: 'safety', name: 'अग्नि सुरक्षा उपकरण (Fire Safety)' },
  { key: 'communication', name: 'साउंड सिस्टम/माइक (Sound System)' },
  { key: 'sanitation', name: 'कूड़ेदान व स्वच्छता (Sanitation/Dustbin)' },
  { key: 'otherFacilities', name: 'अन्य सुविधाएं (Other Facilities)' }
];

export const initialFacilities: PhysicalFacility[] = [];

// Seed facilities for all 37 schools
initialSchools.forEach((school, sIdx) => {
  facilityMasterList.forEach((fac) => {
    let available: 'YES' | 'NO' | 'UNKNOWN' = 'YES';
    let condition: 'उत्कृष्ट' | 'संतोषजनक' | 'मरम्मत योग्य' | 'अनुपयोगी' = 'संतोषजनक';
    let count = 1;
    let usableCount = 1;
    let repairRequired = 0;
    let remarks = '';
    let reqDetails = '';

    if (fac.key === 'ict' || fac.key === 'internet') {
      if (school.schoolType === 'प्राथमिक' || school.schoolType === 'अशासकीय प्राथमिक') {
        available = sIdx % 3 === 0 ? 'UNKNOWN' : 'NO';
        reqDetails = 'प्राथमिक स्तर पर कंप्यूटर लैब व नेट कनेक्शन प्रस्तावित';
      } else {
        available = 'YES';
        condition = 'संतोषजनक';
        count = 10;
        usableCount = 8;
        repairRequired = 2;
      }
    } else if (fac.key === 'boundaryWall') {
      if (sIdx % 4 === 0) {
        available = 'NO';
        reqDetails = 'बाउंड्री वॉल निर्माण हेतु ग्राम पंचायत को पत्र प्रेषित';
      } else {
        available = 'YES';
        condition = sIdx % 2 === 0 ? 'उत्कृष्ट' : 'मरम्मत योग्य';
      }
    } else if (fac.key === 'laboratory') {
      if (school.schoolType === 'प्राथमिक' || school.schoolType === 'अशासकीय प्राथमिक') {
        available = 'NO';
        reqDetails = 'प्राथमिक शाला में लैब का प्रावधान नहीं है';
      } else {
        available = 'YES';
        condition = 'संतोषजनक';
      }
    } else if (fac.key === 'toilets') {
      available = 'YES';
      count = school.schoolType === 'हाई स्कूल' ? 6 : school.schoolType === 'माध्यमिक' ? 4 : 2;
      usableCount = count;
      condition = 'उत्कृष्ट';
    } else if (fac.key === 'rooms') {
      available = 'YES';
      count = school.totalRooms || 4;
      usableCount = count;
      condition = 'संतोषजनक';
    } else if (fac.key === 'classrooms') {
      available = 'YES';
      count = school.totalClassrooms || 3;
      usableCount = count;
      condition = 'संतोषजनक';
    }

    initialFacilities.push({
      schoolUdise: school.udise,
      facilityKey: fac.key,
      facilityName: fac.name,
      available,
      condition: available === 'YES' ? condition : undefined,
      count: available === 'YES' ? count : undefined,
      usableCount: available === 'YES' ? usableCount : undefined,
      repairRequiredCount: available === 'YES' ? repairRequired : undefined,
      details: available === 'YES' ? 'नियमित रूप से उपयोग में' : undefined,
      remarks: remarks || (available === 'YES' ? 'स्थिति संतोषजनक है' : ''),
      requirementDetails: available === 'NO' ? reqDetails : undefined,
      lastInspectionDate: '2026-08-15',
    });
  });
});

// Seed live daily attendance for top schools
const currentDayStr = new Date().toISOString().split('T')[0];

export const initialAttendance: AttendanceRecord[] = [
  // 1. Current Session (2026-27) Today's Attendance
  {
    id: `ATT-${currentDayStr}-101`,
    sessionId: '2026-27',
    date: currentDayStr,
    schoolUdise: '23080110701', // PS JANAKPUR
    type: 'STUDENT',
    totalCount: 6,
    presentCount: 6,
    absentCount: 0,
    markedBy: 'EMP-HM-102',
    markedAt: `${currentDayStr} 09:10 AM`,
    records: [
      { entityId: 'STU-10701-1', name: 'आर्यन पटेल', status: 'PRESENT' },
      { entityId: 'STU-10701-2', name: 'प्रिया अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10701-3', name: 'अंकित गौड़', status: 'PRESENT' },
      { entityId: 'STU-10701-4', name: 'सोनम दीक्षित', status: 'PRESENT' },
      { entityId: 'STU-10701-5', name: 'रोहित अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10701-6', name: 'खुशी पटेल', status: 'PRESENT' },
    ]
  },
  {
    id: `ATT-${currentDayStr}-102`,
    sessionId: '2026-27',
    date: currentDayStr,
    schoolUdise: '23080110701',
    type: 'TEACHER',
    totalCount: 3,
    presentCount: 3,
    absentCount: 0,
    markedBy: 'EMP-HM-102',
    markedAt: `${currentDayStr} 08:30 AM`,
    records: [
      { entityId: 'STF-10701-1', name: 'दिनेश कुमार पटेल', status: 'PRESENT' },
      { entityId: 'STF-10701-2', name: 'सुनीता त्रिपाठी', status: 'PRESENT' },
      { entityId: 'STF-10701-3', name: 'गीता बाई रसोइया', status: 'PRESENT' },
    ]
  },
  {
    id: `ATT-${currentDayStr}-10702-STU`,
    sessionId: '2026-27',
    date: currentDayStr,
    schoolUdise: '23080110702', // PS KACHHIYAT
    type: 'STUDENT',
    class: '5',
    totalCount: 6,
    presentCount: 6,
    absentCount: 0,
    markedBy: 'रामसहाय अहिरवार (प्र.अ.)',
    markedAt: `${currentDayStr} 09:05 AM`,
    records: [
      { entityId: 'STU-10702-1', name: 'आदित्य अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10702-2', name: 'कविता रैकवार', status: 'PRESENT' },
      { entityId: 'STU-10702-3', name: 'दीपक कुशवाहा', status: 'PRESENT' },
      { entityId: 'STU-10702-4', name: 'नीलम अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10702-5', name: 'विवेक साहू', status: 'PRESENT' },
      { entityId: 'STU-10702-6', name: 'संध्या अहिरवार', status: 'PRESENT' },
    ]
  },
  {
    id: `ATT-${currentDayStr}-10702-STF`,
    sessionId: '2026-27',
    date: currentDayStr,
    schoolUdise: '23080110702', // PS KACHHIYAT
    type: 'TEACHER',
    totalCount: 3,
    presentCount: 3,
    absentCount: 0,
    markedBy: 'रामसहाय अहिरवार (प्र.अ.)',
    markedAt: `${currentDayStr} 08:30 AM`,
    records: [
      { entityId: 'STF-10702-1', name: 'रामसहाय अहिरवार', status: 'PRESENT' },
      { entityId: 'STF-10702-2', name: 'संगीता राजपूत', status: 'PRESENT' },
      { entityId: 'STF-10702-3', name: 'ममता बाई रसोइया', status: 'PRESENT' },
    ]
  },
  {
    id: `ATT-${currentDayStr}-201`,
    sessionId: '2026-27',
    date: currentDayStr,
    schoolUdise: '23080100303', // HS HIRAPUR
    type: 'STUDENT',
    totalCount: 8,
    presentCount: 7,
    absentCount: 1,
    markedBy: 'EMP-HM-129',
    markedAt: `${currentDayStr} 09:15 AM`,
    records: [
      { entityId: 'STU-13602-1', name: 'विकास अवस्थी', status: 'PRESENT' },
      { entityId: 'STU-13602-2', name: 'पूजा रैकवार', status: 'PRESENT' },
      { entityId: 'STU-13602-3', name: 'राहुल बाल्मीकि', status: 'PRESENT' },
      { entityId: 'STU-13602-4', name: 'दीक्षा सहरिया', status: 'PRESENT' },
      { entityId: 'STU-13602-5', name: 'अजय यादव', status: 'PRESENT' },
      { entityId: 'STU-13602-6', name: 'काजल प्रजापति', status: 'PRESENT' },
      { entityId: 'STU-13602-7', name: 'संदीप पटेल', status: 'PRESENT' },
      { entityId: 'STU-13602-8', name: 'रश्मि शर्मा', status: 'ABSENT' },
    ]
  },
  // 2. Current Session (2026-27) Historical Records
  {
    id: 'ATT-20260830-101',
    sessionId: '2026-27',
    date: '2026-08-30',
    schoolUdise: '23080110701', // PS JANAKPUR
    type: 'STUDENT',
    totalCount: 6,
    presentCount: 5,
    absentCount: 1,
    markedBy: 'EMP-HM-102',
    markedAt: '2026-08-30 09:15 AM',
    records: [
      { entityId: 'STU-10701-1', name: 'आर्यन पटेल', status: 'PRESENT' },
      { entityId: 'STU-10701-2', name: 'प्रिया अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10701-3', name: 'अंकित गौड़', status: 'PRESENT' },
      { entityId: 'STU-10701-4', name: 'सोनम दीक्षित', status: 'PRESENT' },
      { entityId: 'STU-10701-5', name: 'रोहित अहिरवार', status: 'ABSENT', remarks: 'अस्वस्थता के कारण' },
      { entityId: 'STU-10701-6', name: 'खुशी पटेल', status: 'PRESENT' },
    ]
  },
  {
    id: 'ATT-20260830-102',
    sessionId: '2026-27',
    date: '2026-08-30',
    schoolUdise: '23080110701',
    type: 'TEACHER',
    totalCount: 3,
    presentCount: 3,
    absentCount: 0,
    markedBy: 'EMP-HM-102',
    markedAt: '2026-08-30 08:30 AM',
    records: [
      { entityId: 'STF-10701-1', name: 'दिनेश कुमार पटेल', status: 'PRESENT' },
      { entityId: 'STF-10701-2', name: 'सुनीता त्रिपाठी', status: 'PRESENT' },
      { entityId: 'STF-10701-3', name: 'गीता बाई रसोइया', status: 'PRESENT' },
    ]
  },
  {
    id: 'ATT-20260830-201',
    sessionId: '2026-27',
    date: '2026-08-30',
    schoolUdise: '23080100303', // HS HIRAPUR
    type: 'STUDENT',
    totalCount: 8,
    presentCount: 7,
    absentCount: 1,
    markedBy: 'EMP-HM-129',
    markedAt: '2026-08-30 09:20 AM',
    records: [
      { entityId: 'STU-13602-1', name: 'विकास अवस्थी', status: 'PRESENT' },
      { entityId: 'STU-13602-2', name: 'पूजा रैकवार', status: 'PRESENT' },
      { entityId: 'STU-13602-3', name: 'राहुल बाल्मीकि', status: 'PRESENT' },
      { entityId: 'STU-13602-4', name: 'दीक्षा सहरिया', status: 'PRESENT' },
      { entityId: 'STU-13602-5', name: 'अजय यादव', status: 'PRESENT' },
      { entityId: 'STU-13602-6', name: 'काजल प्रजापति', status: 'PRESENT' },
      { entityId: 'STU-13602-7', name: 'संदीप पटेल', status: 'PRESENT' },
      { entityId: 'STU-13602-8', name: 'रश्मि शर्मा', status: 'ABSENT' },
    ]
  },
  // 3. Past Session (2025-26) Historical Attendance Records
  {
    id: 'ATT-20260215-101',
    sessionId: '2025-26',
    date: '2026-02-15',
    schoolUdise: '23080110701',
    type: 'STUDENT',
    totalCount: 6,
    presentCount: 6,
    absentCount: 0,
    markedBy: 'EMP-HM-102',
    markedAt: '2026-02-15 09:10 AM',
    records: [
      { entityId: 'STU-10701-1', name: 'आर्यन पटेल', status: 'PRESENT' },
      { entityId: 'STU-10701-2', name: 'प्रिया अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10701-3', name: 'अंकित गौड़', status: 'PRESENT' },
      { entityId: 'STU-10701-4', name: 'सोनम दीक्षित', status: 'PRESENT' },
      { entityId: 'STU-10701-5', name: 'रोहित अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10701-6', name: 'खुशी पटेल', status: 'PRESENT' },
    ]
  },
  {
    id: 'ATT-20260215-201',
    sessionId: '2025-26',
    date: '2026-02-15',
    schoolUdise: '23080100303',
    type: 'STUDENT',
    totalCount: 8,
    presentCount: 8,
    absentCount: 0,
    markedBy: 'EMP-HM-129',
    markedAt: '2026-02-15 09:15 AM',
    records: [
      { entityId: 'STU-13602-1', name: 'विकास अवस्थी', status: 'PRESENT' },
      { entityId: 'STU-13602-2', name: 'पूजा रैकवार', status: 'PRESENT' },
      { entityId: 'STU-13602-3', name: 'राहुल बाल्मीकि', status: 'PRESENT' },
      { entityId: 'STU-13602-4', name: 'दीक्षा सहरिया', status: 'PRESENT' },
      { entityId: 'STU-13602-5', name: 'अजय यादव', status: 'PRESENT' },
      { entityId: 'STU-13602-6', name: 'काजल प्रजापति', status: 'PRESENT' },
      { entityId: 'STU-13602-7', name: 'संदीप पटेल', status: 'PRESENT' },
      { entityId: 'STU-13602-8', name: 'रश्मि शर्मा', status: 'PRESENT' },
    ]
  },
  {
    id: 'ATT-20251120-101',
    sessionId: '2025-26',
    date: '2025-11-20',
    schoolUdise: '23080110701',
    type: 'STUDENT',
    totalCount: 6,
    presentCount: 5,
    absentCount: 1,
    markedBy: 'EMP-HM-102',
    markedAt: '2025-11-20 09:20 AM',
    records: [
      { entityId: 'STU-10701-1', name: 'आर्यन पटेल', status: 'PRESENT' },
      { entityId: 'STU-10701-2', name: 'प्रिया अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10701-3', name: 'अंकित गौड़', status: 'PRESENT' },
      { entityId: 'STU-10701-4', name: 'सोनम दीक्षित', status: 'PRESENT' },
      { entityId: 'STU-10701-5', name: 'रोहित अहिरवार', status: 'ABSENT' },
      { entityId: 'STU-10701-6', name: 'खुशी पटेल', status: 'PRESENT' },
    ]
  },
  // 3. Past Session (2024-25) Historical Attendance Records
  {
    id: 'ATT-20250210-101',
    sessionId: '2024-25',
    date: '2025-02-10',
    schoolUdise: '23080110701',
    type: 'STUDENT',
    class: '3',
    totalCount: 6,
    presentCount: 6,
    absentCount: 0,
    markedBy: 'EMP-HM-102',
    markedAt: '2025-02-10 09:15 AM',
    records: [
      { entityId: 'STU-10701-1', name: 'आर्यन पटेल', status: 'PRESENT' },
      { entityId: 'STU-10701-2', name: 'प्रिया अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10701-3', name: 'अंकित गौड़', status: 'PRESENT' },
      { entityId: 'STU-10701-4', name: 'सोनम दीक्षित', status: 'PRESENT' },
      { entityId: 'STU-10701-5', name: 'रोहित अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10701-6', name: 'खुशी पटेल', status: 'PRESENT' },
    ]
  },
  {
    id: 'ATT-20250210-201',
    sessionId: '2024-25',
    date: '2025-02-10',
    schoolUdise: '23080100303',
    type: 'STUDENT',
    class: '6',
    totalCount: 8,
    presentCount: 7,
    absentCount: 1,
    markedBy: 'EMP-T-201',
    markedAt: '2025-02-10 09:30 AM',
    records: [
      { entityId: 'STU-00303-1', name: 'आदित्य लोधी', status: 'PRESENT' },
      { entityId: 'STU-00303-2', name: 'अंशिका यादव', status: 'PRESENT' },
      { entityId: 'STU-00303-3', name: 'दीपक अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-00303-4', name: 'काजल रजक', status: 'PRESENT' },
      { entityId: 'STU-00303-5', name: 'मानसी चौरसिया', status: 'ABSENT' },
      { entityId: 'STU-00303-6', name: 'निखिल साहू', status: 'PRESENT' },
      { entityId: 'STU-00303-7', name: 'पूजा विश्वकर्मा', status: 'PRESENT' },
      { entityId: 'STU-00303-8', name: 'राहुल यादव', status: 'PRESENT' },
    ]
  },
  {
    id: 'ATT-20241115-101',
    sessionId: '2024-25',
    date: '2024-11-15',
    schoolUdise: '23080110701',
    type: 'STUDENT',
    class: '3',
    totalCount: 6,
    presentCount: 5,
    absentCount: 1,
    markedBy: 'EMP-HM-102',
    markedAt: '2024-11-15 09:20 AM',
    records: [
      { entityId: 'STU-10701-1', name: 'आर्यन पटेल', status: 'PRESENT' },
      { entityId: 'STU-10701-2', name: 'प्रिया अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10701-3', name: 'अंकित गौड़', status: 'PRESENT' },
      { entityId: 'STU-10701-4', name: 'सोनम दीक्षित', status: 'PRESENT' },
      { entityId: 'STU-10701-5', name: 'रोहित अहिरवार', status: 'ABSENT' },
      { entityId: 'STU-10701-6', name: 'खुशी पटेल', status: 'PRESENT' },
    ]
  },
  // 4. Historical Session (2018-19) Records
  {
    id: 'ATT-20181012-101',
    sessionId: '2018-19',
    date: '2018-10-12',
    schoolUdise: '23080110701',
    type: 'STUDENT',
    class: '5',
    totalCount: 4,
    presentCount: 4,
    absentCount: 0,
    markedBy: 'EMP-HM-102',
    markedAt: '2018-10-12 09:30 AM',
    records: [
      { entityId: 'STU-10701-1', name: 'आर्यन पटेल', status: 'PRESENT' },
      { entityId: 'STU-10701-2', name: 'प्रिया अहिरवार', status: 'PRESENT' },
      { entityId: 'STU-10701-3', name: 'अंकित गौड़', status: 'PRESENT' },
      { entityId: 'STU-10701-4', name: 'सोनम दीक्षित', status: 'PRESENT' },
    ]
  },
  {
    id: 'ATT-20181012-102',
    sessionId: '2018-19',
    date: '2018-10-12',
    schoolUdise: '23080110702',
    type: 'STUDENT',
    class: '3',
    totalCount: 2,
    presentCount: 2,
    absentCount: 0,
    markedBy: 'EMP-HM-103',
    markedAt: '2018-10-12 09:40 AM',
    records: [
      { entityId: 'STU-10702-1', name: 'शिवम कुशवाहा', status: 'PRESENT' },
      { entityId: 'STU-10702-2', name: 'रागिनी रैकवार', status: 'PRESENT' },
    ]
  },
  {
    id: 'ATT-20181012-102-STF',
    sessionId: '2018-19',
    date: '2018-10-12',
    schoolUdise: '23080110702', // PS KACHHIYAT
    type: 'TEACHER',
    totalCount: 2,
    presentCount: 2,
    absentCount: 0,
    markedBy: 'रामसहाय अहिरवार',
    markedAt: '2018-10-12 08:30 AM',
    records: [
      { entityId: 'STF-10702-1', name: 'रामसहाय अहिरवार', status: 'PRESENT' },
      { entityId: 'STF-10702-2', name: 'संगीता राजपूत', status: 'PRESENT' },
    ]
  }
];

// Initial MDM Records
export const initialMDM: MDMRecord[] = [
  // 1. Current Session (2026-27) Today's MDM
  {
    id: `MDM-${currentDayStr}-101`,
    sessionId: '2026-27',
    date: currentDayStr,
    schoolUdise: '23080110701',
    eligibleStudents: 6,
    presentStudents: 6,
    mealsServed: 6,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'जय मां शारदा स्व-सहायता समूह',
    wheatStockKg: 80,
    riceStockKg: 115,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'संजय जैन (CAC)',
    menuItem: 'रोटी, दाल, मौसमी हरी सब्जी व सलाद (ताजा गर्म भोजन)',
    problemsReported: 'कोई समस्या नहीं'
  },
  {
    id: `MDM-${currentDayStr}-102`,
    sessionId: '2026-27',
    date: currentDayStr,
    schoolUdise: '23080100303',
    eligibleStudents: 8,
    presentStudents: 7,
    mealsServed: 7,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'दुर्गा महिला स्व-सहायता समूह',
    wheatStockKg: 135,
    riceStockKg: 200,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'महेश प्रसाद अवस्थी (प्र.अ.)',
    menuItem: 'चावल, कढ़ी, पकौड़ा व खीर',
    problemsReported: 'संतुष्टिजनक वितरण'
  },
  {
    id: `MDM-${currentDayStr}-10702`,
    sessionId: '2026-27',
    date: currentDayStr,
    schoolUdise: '23080110702', // PS KACHHIYAT
    eligibleStudents: 6,
    presentStudents: 6,
    mealsServed: 6,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'मां सरस्वती महिला स्व-सहायता समूह',
    wheatStockKg: 75,
    riceStockKg: 95,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'रामसहाय अहिरवार (प्र.अ.)',
    menuItem: 'रोटी, दाल, हरी मौसमी सब्जी व सलाद',
    problemsReported: 'कोई समस्या नहीं'
  },
  // 2. Current Session (2026-27) Historical Records
  {
    id: 'MDM-20260830-101',
    sessionId: '2026-27',
    date: '2026-08-30',
    schoolUdise: '23080110701',
    eligibleStudents: 6,
    presentStudents: 5,
    mealsServed: 5,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'जय मां शारदा स्व-सहायता समूह',
    wheatStockKg: 85,
    riceStockKg: 120,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'संजय जैन (CAC)',
    menuItem: 'दाल, चावल, हरी सब्जी (मेनू अनुसार)',
    problemsReported: 'कोई समस्या नहीं'
  },
  {
    id: 'MDM-20260830-102',
    sessionId: '2026-27',
    date: '2026-08-30',
    schoolUdise: '23080100303',
    eligibleStudents: 8,
    presentStudents: 7,
    mealsServed: 7,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'दुर्गा महिला स्व-सहायता समूह',
    wheatStockKg: 140,
    riceStockKg: 210,
    fuelAvailable: true,
    kitchenHygiene: 'संतोषजनक',
    menuItem: 'कढ़ी, पकौड़ा व चावल',
    problemsReported: 'गेहूं स्टॉक अगले सप्ताह मंगाना आवश्यक'
  },
  // 3. Past Session (2025-26) Historical MDM Records
  {
    id: 'MDM-20260215-101',
    sessionId: '2025-26',
    date: '2026-02-15',
    schoolUdise: '23080110701',
    eligibleStudents: 6,
    presentStudents: 6,
    mealsServed: 6,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'जय मां शारदा स्व-सहायता समूह',
    wheatStockKg: 95,
    riceStockKg: 130,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'दिनेश कुमार पटेल',
    menuItem: 'सब्जी पुलाव, रायता व पापड़',
    problemsReported: 'सत्र 2025-26 द्वितीय सत्र वितरण संपन्न'
  },
  {
    id: 'MDM-20260215-102',
    sessionId: '2025-26',
    date: '2026-02-15',
    schoolUdise: '23080100303',
    eligibleStudents: 8,
    presentStudents: 8,
    mealsServed: 8,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'दुर्गा महिला स्व-सहायता समूह',
    wheatStockKg: 150,
    riceStockKg: 225,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'महेश प्रसाद अवस्थी',
    menuItem: 'रोटी, अरहर दाल व आलू-गोभी सब्जी',
    problemsReported: 'पूर्ण उपस्थिति अनुसार वितरण'
  },
  {
    id: 'MDM-20251120-101',
    sessionId: '2025-26',
    date: '2025-11-20',
    schoolUdise: '23080110701',
    eligibleStudents: 6,
    presentStudents: 5,
    mealsServed: 5,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'जय मां शारदा स्व-सहायता समूह',
    wheatStockKg: 110,
    riceStockKg: 145,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'संजय जैन (CAC)',
    menuItem: 'रोटी, दाल, लौकी चना व सलाद',
    problemsReported: 'नियमित वितरण'
  },
  // 4. Past Session (2024-25) Historical MDM Records
  {
    id: 'MDM-20250210-101',
    sessionId: '2024-25',
    date: '2025-02-10',
    schoolUdise: '23080110701',
    eligibleStudents: 6,
    presentStudents: 6,
    mealsServed: 6,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'जय मां शारदा स्व-सहायता समूह',
    wheatStockKg: 105,
    riceStockKg: 135,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'दिनेश कुमार पटेल',
    menuItem: 'सब्जी पुलाव व रायता',
    problemsReported: 'सत्र 2024-25 सुचारू वितरण'
  },
  {
    id: 'MDM-20250210-102',
    sessionId: '2024-25',
    date: '2025-02-10',
    schoolUdise: '23080100303',
    eligibleStudents: 8,
    presentStudents: 7,
    mealsServed: 7,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'दुर्गा महिला स्व-सहायता समूह',
    wheatStockKg: 160,
    riceStockKg: 240,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'महेश प्रसाद अवस्थी',
    menuItem: 'रोटी, चना दाल व हरी सब्जी',
    problemsReported: 'सत्र 2024-25 नियमित वितरण'
  },
  {
    id: 'MDM-20241115-101',
    sessionId: '2024-25',
    date: '2024-11-15',
    schoolUdise: '23080110701',
    eligibleStudents: 6,
    presentStudents: 5,
    mealsServed: 5,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'जय मां शारदा स्व-सहायता समूह',
    wheatStockKg: 120,
    riceStockKg: 155,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'संजय जैन (CAC)',
    menuItem: 'दाल, चावल व कद्दू सब्जी',
    problemsReported: 'संतोषजनक'
  },
  // 4. Historical Session (2018-19) MDM Record
  {
    id: 'MDM-20181012-101',
    sessionId: '2018-19',
    date: '2018-10-12',
    schoolUdise: '23080110701',
    eligibleStudents: 4,
    presentStudents: 4,
    mealsServed: 4,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'जय मां शारदा स्व-सहायता समूह',
    wheatStockKg: 85,
    riceStockKg: 110,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'संजय जैन (CAC)',
    menuItem: 'रोटी, दाल व मौसमी सब्जी',
    problemsReported: 'संतोषजनक'
  },
  {
    id: 'MDM-20181012-102',
    sessionId: '2018-19',
    date: '2018-10-12',
    schoolUdise: '23080110702',
    eligibleStudents: 2,
    presentStudents: 2,
    mealsServed: 2,
    mealsNotServed: 0,
    cookPresent: true,
    shgName: 'मां सरस्वती महिला स्व-सहायता समूह',
    wheatStockKg: 60,
    riceStockKg: 80,
    fuelAvailable: true,
    kitchenHygiene: 'उत्कृष्ट',
    inspectedBy: 'कमलेश कुमार अहिरवार (CAC)',
    menuItem: 'सब्जी पुलाव एवं कढ़ी',
    problemsReported: 'संतोषजनक'
  }
];

// Government Work Tasks
export const initialGovernmentWork: GovernmentWork[] = [
  // 1. Current Session (2026-27) Tasks
  {
    id: 'GW-001',
    sessionId: '2026-27',
    workName: 'समग्र ई-केवाईसी एवं अपार (APAAR) आईडी निर्माण',
    orderNumber: 'RSK/2026/4102',
    schoolUdise: '23080110701',
    description: 'कक्षा 1 से 8 तक के सभी दर्ज विद्यार्थियों की शत-प्रतिशत ई-केवाईसी व आधार सीडिंग पूर्ण करना।',
    assignedDate: '2026-08-01',
    dueDate: '2026-09-05',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    responsiblePerson: 'दिनेश कुमार पटेल (प्रधानाध्यापक)',
    remarks: '85% कार्य पूर्ण, शेष विद्यार्थियों के आधार अपडेट प्रक्रियाधीन।',
  },
  {
    id: 'GW-002',
    sessionId: '2026-27',
    workName: 'वार्षिक शाला अनुदान (Composite Grant) व्यय वाउचर संधारण',
    orderNumber: 'DPC/CHT/2026/891',
    schoolUdise: '23080110701',
    description: 'रंगाई-पुताई, स्वच्छता सामग्री व लघु मरम्मत कार्य के बिल व वाउचर संकुल में जमा करना।',
    assignedDate: '2026-08-10',
    dueDate: '2026-08-31',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    responsiblePerson: 'दिनेश कुमार पटेल',
    completionDate: '2026-08-28',
    remarks: 'सभी वाउचर संकुल कार्यालय में जमा व सत्यापित।',
  },
  {
    id: 'GW-002-10702',
    sessionId: '2026-27',
    workName: 'वार्षिक शाला अनुदान (Composite Grant) व्यय वाउचर संधारण',
    orderNumber: 'DPC/CHT/2026/892',
    schoolUdise: '23080110702', // PS KACHHIYAT
    description: 'रंगाई-पुताई, स्वच्छता सामग्री व लघु मरम्मत कार्य के बिल व वाउचर संकुल में जमा करना।',
    assignedDate: '2026-08-10',
    dueDate: '2026-08-31',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    responsiblePerson: 'रामसहाय अहिरवार',
    completionDate: '2026-08-28',
    remarks: 'सभी वाउचर संकुल कार्यालय में जमा व सत्यापित।',
  },
  {
    id: 'GW-003',
    sessionId: '2026-27',
    workName: 'निःशुल्क पाठ्यपुस्तक वितरण सत्यापन व पोर्टल प्रविष्टि',
    orderNumber: 'RSK/TXT/2026/110',
    schoolUdise: '23080100303',
    description: 'समस्त छात्रों को प्राप्त पुस्तकों का छात्रवार वितरण व ट्रैकिंग पोर्टल पर लॉक करना।',
    assignedDate: '2026-07-15',
    dueDate: '2026-08-20',
    status: 'COMPLETED',
    priority: 'HIGH',
    responsiblePerson: 'महेश प्रसाद अवस्थी',
    completionDate: '2026-08-18',
    remarks: '100% वितरण पूर्ण व पोर्टल पर प्रविष्टि संपन्न।',
  },
  {
    id: 'GW-004',
    sessionId: '2026-27',
    workName: 'पेयजल हैंडपंप मोटर व वाटर फिल्टर मरम्मत',
    orderNumber: 'JSK/MLG/2026/34',
    schoolUdise: '23080104102',
    description: 'वर्षा ऋतु में स्वच्छ जल आपूर्ति हेतु वाटर प्यूरीफायर की सर्विसिंग व पाइपलाइन मरम्मत।',
    assignedDate: '2026-08-22',
    dueDate: '2026-09-02',
    status: 'PENDING',
    priority: 'HIGH',
    responsiblePerson: 'राजेश कुमार त्रिपाठी',
    remarks: 'मैकेनिक को कॉल किया गया है, कल कार्य प्रारंभ होगा।',
  },
  // 2. Past Session (2025-26) Completed Tasks
  {
    id: 'GW-2025-01',
    sessionId: '2025-26',
    workName: 'सत्र 2025-26 वार्षिक परीक्षा संपादन एवं मूल्यांकन प्रपत्र संकलन',
    orderNumber: 'RSK/EXAM/2026/102',
    schoolUdise: '23080110701',
    description: 'कक्षा 5 व 8 वार्षिक मूल्यांकन उत्तर पुस्तिकाओं का संकुल संग्रहण केंद्र पर जमा एवं अंक प्रविष्टि।',
    assignedDate: '2026-03-01',
    dueDate: '2026-03-25',
    status: 'COMPLETED',
    priority: 'HIGH',
    responsiblePerson: 'दिनेश कुमार पटेल (प्रधानाध्यापक)',
    completionDate: '2026-03-22',
    remarks: 'सत्र 2025-26 का परीक्षा कार्य शत-प्रतिशत समय सीमा में पूर्ण।',
  },
  {
    id: 'GW-2025-02',
    sessionId: '2025-26',
    workName: 'सत्र 2025-26 समग्र छात्रवृत्ति एवं गणवेश वितरण सत्यापन',
    orderNumber: 'DPC/SCHOLAR/2025/78',
    schoolUdise: '23080100303',
    description: 'पात्र छात्र-छात्राओं के बैंक खातों में डीबीटी भुगतान की स्थिति का भौतिक सत्यापन।',
    assignedDate: '2025-11-10',
    dueDate: '2025-12-15',
    status: 'COMPLETED',
    priority: 'HIGH',
    responsiblePerson: 'महेश प्रसाद अवस्थी',
    completionDate: '2025-12-10',
    remarks: 'सभी पात्र विद्यार्थियों के खातों में राशि अंतरित व सत्यापित।',
  },
  {
    id: 'GW-2025-03',
    sessionId: '2025-26',
    workName: 'सत्र 2025-26 संकुल स्तरीय खेलकूद एवं सांस्कृतिक प्रतियोगिता आयोजन',
    orderNumber: 'JSK/MLG/SPORTS/2025/45',
    schoolUdise: '23080100303',
    description: 'संकुल मलग़ुवां अंतर्गत समस्त 37 विद्यालयों के छात्र-छात्राओं हेतु वार्षिक क्रीड़ा प्रतियोगिता का संपादन।',
    assignedDate: '2025-12-01',
    dueDate: '2025-12-20',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    responsiblePerson: 'संजय जैन (CAC)',
    completionDate: '2025-12-18',
    remarks: 'सफल आयोजन संपन्न, 120 विजेता छात्रों को प्रमाण-पत्र वितरित।',
  },
  // 3. Past Session (2024-25) Completed Tasks
  {
    id: 'GW-2024-01',
    sessionId: '2024-25',
    workName: 'सत्र 2024-25 वार्षिक परीक्षा संपादन एवं परिणाम घोषणा',
    orderNumber: 'RSK/EXAM/2025/89',
    schoolUdise: '23080110701',
    description: 'कक्षा 5 व 8 वार्षिक मूल्यांकन उत्तर पुस्तिकाओं का संकुल संग्रहण केंद्र पर जमा एवं परिणाम तैयार करना।',
    assignedDate: '2025-03-01',
    dueDate: '2025-03-25',
    status: 'COMPLETED',
    priority: 'HIGH',
    responsiblePerson: 'दिनेश कुमार पटेल (प्रधानाध्यापक)',
    completionDate: '2025-03-24',
    remarks: 'सत्र 2024-25 का परीक्षा कार्य शत-प्रतिशत समय सीमा में पूर्ण।',
  },
  {
    id: 'GW-2024-02',
    sessionId: '2024-25',
    workName: 'सत्र 2024-25 छात्रवृत्ति एवं गणवेश वितरण सत्यापन',
    orderNumber: 'DPC/SCHOLAR/2024/54',
    schoolUdise: '23080100303',
    description: 'पात्र छात्र-छात्राओं के खातों में डीबीटी अंतरण का भौतिक सत्यापन।',
    assignedDate: '2024-11-05',
    dueDate: '2024-12-10',
    status: 'COMPLETED',
    priority: 'HIGH',
    responsiblePerson: 'महेश प्रसाद अवस्थी',
    completionDate: '2024-12-08',
    remarks: 'सत्र 2024-25 वितरण सत्यापित।',
  },
  // 4. Historical Session (2018-19) Completed Tasks
  {
    id: 'GW-2018-01',
    sessionId: '2018-19',
    workName: 'सत्र 2018-19 समग्र छात्रवृत्ति वितरण सत्यापन',
    orderNumber: 'DPC/SCHOLAR/2018/12',
    schoolUdise: '23080110701',
    description: 'सत्र 2018-19 में अध्ययनरत समस्त पात्र विद्यार्थियों के बैंक खातों में छात्रवृत्ति अंतरण का भौतिक सत्यापन।',
    assignedDate: '2018-11-10',
    dueDate: '2018-12-15',
    status: 'COMPLETED',
    priority: 'HIGH',
    responsiblePerson: 'दिनेश कुमार पटेल (प्रधानाध्यापक)',
    completionDate: '2018-12-10',
    remarks: 'सत्र 2018-19 छात्रवृत्ति सत्यापन कार्य शत-प्रतिशत पूर्ण।',
  },
  {
    id: 'GW-2018-02',
    sessionId: '2018-19',
    workName: 'सत्र 2018-19 निःशुल्क गणवेश वितरण भौतिक सत्यापन',
    orderNumber: 'RSK/UNIFORM/2018/45',
    schoolUdise: '23080110702',
    description: 'कक्षा 1 से 5 के सभी दर्ज छात्र-छात्राओं को दो-दो जोड़ी गणवेश वितरण व पावती संकलन।',
    assignedDate: '2018-09-15',
    dueDate: '2018-10-15',
    status: 'COMPLETED',
    priority: 'HIGH',
    responsiblePerson: 'किशन लाल कुशवाहा',
    completionDate: '2018-10-10',
    remarks: 'सत्र 2018-19 गणवेश वितरण शत-प्रतिशत सत्यापित।',
  }
];

// Notifications and Circulars
export const initialNotifications: NotificationItem[] = [
  {
    id: 'NOTIF-001',
    title: 'मासिक संकुल समीक्षा बैठक (CAC Monthly Review Meeting)',
    message: 'संकुल मलग़ुवां अंतर्गत समस्त 37 विद्यालयों के संस्था प्रभारियों की मासिक समीक्षा बैठक दिनांक 05 सितंबर 2026 को दोपहर 01:00 बजे संकुल केंद्र पर आयोजित है। यूडाइस एवं ई-केवाईसी प्रगति रिपोर्ट साथ लाएं।',
    orderNumber: 'JSK/MLG/NOTIF/2026/88',
    date: '2026-08-29',
    priority: 'HIGH',
    targetType: 'ALL',
    publishedBy: 'USR-001',
    publishedByName: 'संजय जैन (जन शिक्षक CAC)',
    dueDate: '2026-09-05',
    readBy: ['USR-002', 'USR-003'],
  },
  {
    id: 'NOTIF-002',
    title: 'स्वच्छता पखवाड़ा एवं पोषण वाटिका संधारण निर्देश',
    message: 'समस्त 37 विद्यालयों में 01 से 15 सितंबर तक स्वच्छता पखवाड़ा का आयोजन किया जाए। दैनिक प्रार्थना सभा में स्वच्छता शपथ एवं हाथ धोने की सही विधि का अभ्यास कराया जाए।',
    orderNumber: 'DPC/SWACHH/2026/304',
    date: '2026-08-28',
    priority: 'NORMAL',
    targetType: 'ALL',
    publishedBy: 'USR-001',
    publishedByName: 'संजय जैन (जन शिक्षक CAC)',
    readBy: ['USR-002'],
  },
  {
    id: 'NOTIF-003',
    title: 'कक्षा 5 व 8 बोर्ड पैटर्न वार्षिक परीक्षा प्रपत्र संकलन',
    message: 'माध्यमिक व प्राथमिक शाला प्रधान अपने छात्रों के परीक्षा फॉर्म का अंतिम मिलान कर पोर्टल पर लॉक करें।',
    orderNumber: 'RSK/EXAM/2026/912',
    date: '2026-08-25',
    priority: 'MEDIUM',
    targetType: 'ALL',
    publishedBy: 'USR-001',
    publishedByName: 'संजय जैन (जन शिक्षक CAC)',
    dueDate: '2026-09-10',
    readBy: ['USR-002'],
  }
];

// Grievances / Complaints
export const initialComplaints: Complaint[] = [
  {
    id: 'CMP-001',
    complaintId: 'COMP-2026-001',
    sessionId: '2026-27',
    schoolUdise: '23080110701',
    category: 'भवन व विद्युत मरम्मत',
    subject: 'कक्षा 4-5 के कमरे में वर्षा का पानी टपकने संबंधी',
    description: 'भारी बारिश के दौरान छत के कॉर्नर से पानी का रिसाव हो रहा है जिससे पठन-पाठन प्रभावित हो रहा है।',
    submittedBy: 'दिनेश कुमार पटेल',
    complainantName: 'दिनेश कुमार पटेल',
    submitterRole: 'प्रधानाध्यापक',
    submitterMobile: '9425198765',
    date: '2026-08-24',
    complaintDate: '2026-08-24',
    createdAt: '2026-08-24',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedTo: 'संजय जैन (CAC)',
    actionTaken: 'ग्राम पंचायत सचिव एवं उपयंत्री को संयुक्त निरीक्षण हेतु पत्र दिया गया। वाटरप्रूफिंग हेतु प्राक्कलन तैयार।',
    remarks: 'कार्य शीघ्र स्वीकृत होने की संभावना है।',
  },
  {
    id: 'CMP-002',
    complaintId: 'COMP-2026-002',
    sessionId: '2026-27',
    schoolUdise: '23080104102',
    category: 'पेयजल/शौचालय समस्या',
    subject: 'बालक शौचालय में नल की टोटियां टूटने की शिकायत',
    description: 'असामाजिक तत्वों द्वारा नल की टोंटियां तोड़ दी गई हैं, तत्काल मरम्मत आवश्यक है।',
    submittedBy: 'राजेश कुमार त्रिपाठी',
    complainantName: 'राजेश कुमार त्रिपाठी',
    submitterRole: 'प्रधानाध्यापक',
    submitterMobile: '9425110005',
    date: '2026-08-20',
    complaintDate: '2026-08-20',
    createdAt: '2026-08-20',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    assignedTo: 'राजेश कुमार त्रिपाठी',
    actionTaken: 'शाला प्रबंधन समिति (SMC) के आकस्मिक निधि से नए पीवीसी नल फिट करा दिए गए।',
    resolutionDate: '2026-08-22',
    resolvedByName: 'राजेश कुमार त्रिपाठी',
    resolverRole: 'SCHOOL / Teacher',
    resolutionOutcome: 'RESOLVED',
    remarks: 'निरीक्षण उपरांत समस्या का पूर्ण समाधान पाया गया।',
  },
  {
    id: 'CMP-003',
    complaintId: 'COMP-2026-003',
    sessionId: '2026-27',
    schoolUdise: '23080105202',
    category: 'मध्याह्न भोजन गुणवत्ता',
    subject: 'समूह द्वारा मेनू अनुसार खीर/फल वितरण न करने संबंधी',
    description: 'मंगलवार को निर्धारित मेनू के अनुसार खीर का वितरण नहीं किया गया।',
    submittedBy: 'कमल किशोर शर्मा',
    complainantName: 'कमल किशोर शर्मा',
    submitterRole: 'प्रधानाध्यापक',
    submitterMobile: '9425110007',
    date: '2026-08-27',
    complaintDate: '2026-08-27',
    createdAt: '2026-08-27',
    priority: 'HIGH',
    status: 'OPEN',
    assignedTo: 'संजय जैन (CAC)',
    remarks: 'समूह अध्यक्ष को नोटिस जारी किया गया है। 3 दिवस में जवाब मांगा गया।',
  },
  // 4. Historical Session (2018-19) Complaint - CLOSED
  {
    id: 'CMP-2018-01',
    complaintId: 'COMP-2018-001',
    sessionId: '2018-19',
    schoolUdise: '23080110701',
    category: 'पेयजल/शौचालय समस्या',
    subject: 'हैंडपंप पाइपलाइन में लीकेज की समस्या',
    description: 'प्राथमिक शाला जनकपुर परिसर के हैंडपंप में लीकेज होने से जल भराव हो रहा था।',
    submittedBy: 'दिनेश कुमार पटेल',
    complainantName: 'दिनेश कुमार पटेल',
    submitterRole: 'प्रधानाध्यापक',
    submitterMobile: '9425198765',
    date: '2018-09-10',
    complaintDate: '2018-09-10',
    createdAt: '2018-09-10',
    priority: 'MEDIUM',
    status: 'CLOSED',
    assignedTo: 'ग्राम पंचायत सचिव',
    actionTaken: 'पंचायत के प्लंबर द्वारा पाइप रिप्लेस कर समाधान किया गया।',
    resolutionDate: '2018-09-14',
    resolvedByName: 'दिनेश कुमार पटेल',
    resolverRole: 'प्रधानाध्यापक',
    closeDate: '2018-09-15',
    closedByName: 'दिनेश कुमार पटेल',
    closerRole: 'प्रधानाध्यापक',
    closeRemark: 'कार्य का भौतिक सत्यापन पूर्ण, शिकायत नस्तीबद्ध की गई।',
    remarks: 'सत्र 2018-19 में समस्या का त्वरित निस्तारण कर बंद किया गया।',
  },
  {
    id: 'CMP-2026-10702',
    complaintId: 'COMP-2026-10702',
    sessionId: '2026-27',
    schoolUdise: '23080110702', // PS KACHHIYAT
    category: 'पेयजल/शौचालय समस्या',
    subject: 'शौचालय रनिंग वाटर नल कनेक्शन मरम्मत',
    title: 'शौचालय रनिंग वाटर नल कनेक्शन मरम्मत',
    description: 'बालिका शौचालय में नल की टोटियां टूटने से जलापूर्ति बाधित हो रही थी।',
    submittedBy: 'रामसहाय अहिरवार',
    complainantName: 'रामसहाय अहिरवार',
    submitterRole: 'प्रधानाध्यापक',
    submitterMobile: '9425110702',
    complainantMobile: '9425110702',
    date: '2026-08-20',
    complaintDate: '2026-08-20',
    createdAt: '2026-08-20',
    priority: 'HIGH',
    status: 'RESOLVED',
    assignedTo: 'रामसहाय अहिरवार (प्र.अ.)',
    actionTaken: 'SMC आकस्मिक निधि से नई टोटियां लगवाकर जलापूर्ति बहाल की गई।',
    resolutionNotes: 'SMC आकस्मिक निधि से नई टोटियां लगवाकर जलापूर्ति बहाल की गई।',
    resolutionDate: '2026-08-22',
    resolvedBy: 'USR-SCH-23080110702',
    resolvedByName: 'रामसहाय अहिरवार',
    resolverRole: 'SCHOOL / Teacher',
    resolutionOutcome: 'RESOLVED',
    remarks: 'कार्य पूर्ण व सत्यापित।',
  },
  {
    id: 'CMP-2026-10702-02',
    complaintId: 'COMP-2026-10702-02',
    sessionId: '2026-27',
    schoolUdise: '23080110702', // PS KACHHIYAT
    category: 'भवन व विद्युत मरम्मत',
    subject: 'कक्षा 3-5 कक्ष में ट्यूबलाइट व पंखा मरम्मत',
    title: 'कक्षा 3-5 कक्ष में ट्यूबलाइट व पंखा मरम्मत',
    description: 'कक्षा 3-5 कक्ष का सीलिंग फैन खराब होने व ट्यूबलाइट चोक होने से शिक्षण कार्य में असुविधा।',
    submittedBy: 'रामसहाय अहिरवार',
    complainantName: 'रामसहाय अहिरवार',
    submitterRole: 'प्रधानाध्यापक',
    submitterMobile: '9425110702',
    complainantMobile: '9425110702',
    date: '2026-08-25',
    complaintDate: '2026-08-25',
    createdAt: '2026-08-25',
    priority: 'HIGH',
    status: 'OPEN',
    remarks: 'विद्युत मिस्त्री से सुधार कार्य अपेक्षित।',
  },
  {
    id: 'CMP-2026-10702-03',
    complaintId: 'COMP-2026-10702-03',
    sessionId: '2026-27',
    schoolUdise: '23080110702', // PS KACHHIYAT
    category: 'पेयजल/शौचालय समस्या',
    subject: 'वॉशबेसिन ड्रेनेज पाइप अवरोध एवं रिसाव',
    title: 'वॉशबेसिन ड्रेनेज पाइप अवरोध एवं रिसाव',
    description: 'हाथ धोने के स्थान पर ड्रेनेज पाइप चोक होने से जलजमाव की स्थिति उत्पन्न हुई।',
    submittedBy: 'रामसहाय अहिरवार',
    complainantName: 'रामसहाय अहिरवार',
    submitterRole: 'प्रधानाध्यापक',
    submitterMobile: '9425110702',
    complainantMobile: '9425110702',
    date: '2026-08-10',
    complaintDate: '2026-08-10',
    createdAt: '2026-08-10',
    priority: 'MEDIUM',
    status: 'REOPENED',
    assignedTo: 'रामसहाय अहिरवार',
    actionTaken: 'ड्रेनेज पाइप की सफाई कराई गई थी।',
    resolutionNotes: 'ड्रेनेज पाइप की सफाई कराई गई थी।',
    resolutionDate: '2026-08-12',
    resolvedByName: 'रामसहाय अहिरवार',
    resolverRole: 'SCHOOL / Teacher',
    closeDate: '2026-08-14',
    closedByName: 'रामसहाय अहिरवार',
    closerRole: 'SCHOOL / Teacher',
    closeRemark: 'कार्य पूर्ण माना गया था।',
    reopenedDate: '2026-08-18',
    reopenedBy: 'रामसहाय अहिरवार',
    reopenerRole: 'SCHOOL / Teacher',
    reopenReason: 'सफाई उपरांत पुनः पानी का ठहराव हो रहा है, नया पाइप लगाना आवश्यक है।',
    remarks: 'शिकायत पुनः खोली गई (2026-08-18): सफाई उपरांत पुनः पानी का ठहराव हो रहा है, नया पाइप लगाना आवश्यक है। पूर्व स्थिति: CLOSED.',
  },
  {
    id: 'CMP-2018-10702',
    complaintId: 'COMP-2018-10702',
    sessionId: '2018-19',
    schoolUdise: '23080110702', // PS KACHHIYAT
    category: 'भवन व विद्युत मरम्मत',
    subject: 'कक्षा कक्ष में खिड़की पल्ले की मरम्मत',
    title: 'कक्षा कक्ष में खिड़की पल्ले की मरम्मत',
    description: 'सत्र 2018-19 में तेज आंधी से खिड़की का पल्ला क्षतिग्रस्त हो गया था।',
    submittedBy: 'रामसहाय अहिरवार',
    complainantName: 'रामसहाय अहिरवार',
    submitterRole: 'प्रधानाध्यापक',
    submitterMobile: '9425110702',
    complainantMobile: '9425110702',
    date: '2018-09-05',
    complaintDate: '2018-09-05',
    createdAt: '2018-09-05',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    assignedTo: 'ग्राम पंचायत सचिव',
    actionTaken: 'स्थानीय बढ़ई द्वारा मरम्मत कार्य कराया गया।',
    resolutionNotes: 'स्थानीय बढ़ई द्वारा मरम्मत कार्य कराया गया।',
    resolutionDate: '2018-09-08',
    resolvedBy: 'USR-SCH-23080110702',
    resolvedByName: 'रामसहाय अहिरवार',
    resolverRole: 'SCHOOL / Teacher',
    resolutionOutcome: 'RESOLVED',
    remarks: 'सत्र 2018-19 में निस्तारित।',
  }
];

// Document Repository
export const initialDocuments: DocumentItem[] = [
  {
    id: 'DOC-001',
    sessionId: '2026-27',
    title: 'शैक्षणिक कैलेंडर एवं अवकाश तालिका सत्र 2026-27',
    schoolUdise: 'ALL',
    category: 'CIRCULAR',
    documentNumber: 'DPI/ACAD/2026/102',
    date: '2026-06-15',
    uploadedBy: 'संजय जैन (जन शिक्षक CAC)',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    description: 'लोक शिक्षण संचालनालय द्वारा जारी आधिकारिक शैक्षणिक पंचांग',
  },
  {
    id: 'DOC-002',
    sessionId: '2026-27',
    title: 'शाला प्रबंधन समिति (SMC) गठन बैठक कार्यवाही विवरण',
    schoolUdise: '23080110701',
    category: 'SCHOOL_DOC',
    documentNumber: 'PS-JNK/SMC/2026/01',
    date: '2026-07-10',
    uploadedBy: 'दिनेश कुमार पटेल',
    fileType: 'PDF',
    fileSize: '840 KB',
    description: 'सत्र 2026-27 हेतु नवनिर्वाचित SMC सदस्यों की सूची व प्रस्ताव',
  },
  {
    id: 'DOC-003',
    sessionId: '2026-27',
    title: 'मध्याह्न भोजन खाद्यान्न आवंटन आदेश अगस्त-सितंबर 2026',
    schoolUdise: 'ALL',
    category: 'MDM_DOC',
    documentNumber: 'MDM/ALLOT/2026/55',
    date: '2026-08-01',
    uploadedBy: 'संजय जैन (जन शिक्षक CAC)',
    fileType: 'PDF',
    fileSize: '620 KB',
    description: 'उचित मूल्य दुकान से खाद्यान्न उठाव हेतु अधिकृत आदेश',
  },
  // Historical Session (2018-19) Documents
  {
    id: 'DOC-2018-01',
    sessionId: '2018-19',
    title: 'शैक्षणिक कैलेंडर एवं अवकाश तालिका सत्र 2018-19',
    schoolUdise: 'ALL',
    category: 'CIRCULAR',
    documentNumber: 'DPI/ACAD/2018/74',
    date: '2018-06-15',
    uploadedBy: 'संकुल प्राचार्य (मलगुवां)',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    description: 'राज्य शिक्षा केंद्र द्वारा जारी आधिकारिक शैक्षणिक पंचांग सत्र 2018-19',
  },
  {
    id: 'DOC-2018-02',
    sessionId: '2018-19',
    title: 'सत्र 2018-19 शाला प्रबंधन समिति (SMC) गठन बैठक कार्यवाही',
    schoolUdise: '23080110701',
    category: 'SCHOOL_DOC',
    documentNumber: 'PS-JNK/SMC/2018/01',
    date: '2018-07-15',
    uploadedBy: 'दिनेश कुमार पटेल',
    fileType: 'PDF',
    fileSize: '650 KB',
    description: 'सत्र 2018-19 SMC गठन एवं सदस्यों का अनुमोदन प्रस्ताव',
  },
  {
    id: 'DOC-2026-10702',
    sessionId: '2026-27',
    title: 'सत्र 2026-27 शाला प्रबंधन समिति (SMC) गठन बैठक कार्यवाही',
    schoolUdise: '23080110702', // PS KACHHIYAT
    category: 'SCHOOL_DOC',
    documentNumber: 'PS-KCH/SMC/2026/01',
    date: '2026-07-12',
    uploadedBy: 'रामसहाय अहिरवार',
    fileType: 'PDF',
    fileSize: '780 KB',
    description: 'सत्र 2026-27 हेतु नवनिर्वाचित SMC सदस्यों की सूची व प्रस्ताव',
  },
  {
    id: 'DOC-2018-10702',
    sessionId: '2018-19',
    title: 'सत्र 2018-19 शाला प्रबंधन समिति (SMC) बैठक कार्यवाही विवरण',
    schoolUdise: '23080110702', // PS KACHHIYAT
    category: 'SCHOOL_DOC',
    documentNumber: 'PS-KCH/SMC/2018/01',
    date: '2018-07-18',
    uploadedBy: 'रामसहाय अहिरवार',
    fileType: 'PDF',
    fileSize: '620 KB',
    description: 'सत्र 2018-19 SMC गठन एवं सदस्यों का अनुमोदन प्रस्ताव',
  }
];

// Audit History Logs
export const initialAuditLogs: AuditLog[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-08-30T09:30:00.000Z',
    date: '30/08/2026',
    time: '09:30 AM',
    userId: 'USR-001',
    userName: 'संजय जैन',
    role: 'CAC',
    action: 'LOGIN',
    module: 'Authentication',
    details: 'जन शिक्षक संजय जैन ने संकुल पोर्टल में सुरक्षित लॉगिन किया।',
    ip: '192.168.1.102',
  },
  {
    id: 'AUD-002',
    timestamp: '2026-08-30T09:15:00.000Z',
    date: '30/08/2026',
    time: '09:15 AM',
    userId: 'USR-002',
    userName: 'दिनेश कुमार पटेल',
    role: 'SCHOOL',
    action: 'CREATE',
    module: 'Attendance',
    recordId: 'ATT-20260830-101',
    schoolUdise: '23080110701',
    schoolName: 'PS JANAKPUR',
    details: 'PS JANAKPUR के 6 विद्यार्थियों की आज की दैनिक उपस्थिति दर्ज की गई।',
    ip: '192.168.1.155',
  },
  {
    id: 'AUD-003',
    timestamp: '2026-08-29T14:30:00.000Z',
    date: '29/08/2026',
    time: '02:30 PM',
    userId: 'USR-001',
    userName: 'संजय जैन',
    role: 'CAC',
    action: 'CREATE',
    module: 'Notifications',
    recordId: 'NOTIF-001',
    details: 'मासिक संकुल समीक्षा बैठक का नया शासकीय आदेश प्रकाशित किया गया।',
    ip: '192.168.1.102',
  }
];

// Initial Upload History
export const initialUploadHistory: UploadHistoryItem[] = [
  {
    id: 'UPL-20260825-01',
    timestamp: '2026-08-25T11:45:00.000Z',
    date: '25/08/2026',
    time: '11:45 AM',
    uploadedBy: 'संजय जैन (जन शिक्षक CAC)',
    userId: 'USR-001',
    userRole: 'CAC',
    dataType: 'STUDENT',
    dataTypeLabel: 'विद्यार्थी डेटा (Student Data)',
    fileName: 'students_master_baldeogarh.xlsx',
    fileSize: '1.4 MB',
    totalRows: 148,
    addedCount: 140,
    updatedCount: 8,
    skippedCount: 0,
    failedCount: 0,
    status: 'SUCCESS',
    targetSchools: ['23080110701', '23080100303', '23080104601'],
    remarks: 'संकुल मलगुवां के विद्यार्थियों की समग्र व अपार प्रोफाइल आयात पूर्ण।'
  },
  {
    id: 'UPL-20260820-02',
    timestamp: '2026-08-20T10:15:00.000Z',
    date: '20/08/2026',
    time: '10:15 AM',
    uploadedBy: 'संजय जैन (जन शिक्षक CAC)',
    userId: 'USR-001',
    userRole: 'CAC',
    dataType: 'TEACHER',
    dataTypeLabel: 'शिक्षक एवं स्टाफ डेटा (Teacher/Staff Data)',
    fileName: 'sankul_teachers_list_aug2026.csv',
    fileSize: '450 KB',
    totalRows: 78,
    addedCount: 74,
    updatedCount: 4,
    skippedCount: 0,
    failedCount: 0,
    status: 'SUCCESS',
    targetSchools: ['23080110701', '23080100303'],
    remarks: '37 विद्यालयों के शिक्षकों व अतिथि शिक्षकों की यूनिक आईडी मैपिंग।'
  }
];

// Seeded SHG & Rasoiya records for Cluster Schools
const shgGroupNames = [
  'जय मां शारदा महिला स्व-सहायता समूह',
  'दुर्गा महिला स्व-सहायता समूह',
  'मां सरस्वती महिला स्व-सहायता समूह',
  'राधा रानी स्व-सहायता समूह',
  'लक्ष्मी महिला स्व-सहायता समूह',
  'गायत्री महिला स्व-सहायता समूह',
  'संत रविदास महिला स्व-सहायता समूह',
  'जय बजरंग महिला स्व-सहायता समूह'
];

const shgPresidents = [
  'श्रीमती सुशीला बाई',
  'श्रीमती रामकली लोधी',
  'श्रीमती अनीता अहिरवार',
  'श्रीमती श्यामा बाई',
  'श्रीमती कस्तूरी देवी',
  'श्रीमती प्रेमरानी यादव',
  'श्रीमती विमला पटेल',
  'श्रीमती कमला राजपूत'
];

const shgSecretaries = [
  'श्रीमती ममता देवी',
  'श्रीमती रेखा कुशवाहा',
  'श्रीमती उर्मिला सेन',
  'श्रीमती गीता अहिरवार',
  'श्रीमती सरोज बाई',
  'श्रीमती मीरा लोधी',
  'श्रीमती पूजा यादव',
  'श्रीमती राधा बाई'
];

const seedCookNames = [
  'गीता बाई रसोइया',
  'कमला बाई',
  'कस्तूरी बाई',
  'फुंदी बाई',
  'राधा बाई',
  'मंजू बाई',
  'शांति बाई',
  'सुमित्रा बाई'
];

const SEED_SESSIONS = ['2026-27', '2025-26', '2024-25', '2018-19'];

export const initialSHGs: SHG[] = SEED_SESSIONS.flatMap((sess) => {
  return CLUSTER_37_SCHOOLS.map((school, idx) => {
    const shgId = sess === '2026-27' ? `SHG-${school.udise}` : `SHG-${school.udise}-${sess}`;
    const groupName = `${shgGroupNames[idx % shgGroupNames.length]} ${school.village || ''}`.trim();
    const president = shgPresidents[idx % shgPresidents.length];
    const secretary = shgSecretaries[idx % shgSecretaries.length];
    const cook = seedCookNames[idx % seedCookNames.length];
    const presMobile = `9826${(idx * 1317 + 1000).toString().slice(0, 6)}`;
    const secMobile = `9754${(idx * 1421 + 2000).toString().slice(0, 6)}`;

    return {
      id: shgId,
      name: groupName,
      presidentName: president,
      presidentMobile: presMobile,
      secretaryName: secretary,
      secretaryMobile: secMobile,
      schoolUdise: school.udise,
      schoolName: school.hindiName || school.name,
      accountNumber: `31980100${20000 + idx}`,
      ifsc: 'SBIN0001234',
      bankName: 'भारतीय स्टेट बैंक (शाखा बलदेवगढ़)',
      registrationNumber: `MP/TK/SHG/2018/${100 + idx}`,
      status: 'ACTIVE',
      sessionId: sess,
      members: [
        { id: `MEM-${school.udise}-${sess}-1`, name: cook, role: 'मुख्य रसोइया', mobile: `9179${(idx * 2222 + 3333).toString().slice(0, 6)}` },
        { id: `MEM-${school.udise}-${sess}-2`, name: president, role: 'अध्यक्ष', mobile: presMobile },
        { id: `MEM-${school.udise}-${sess}-3`, name: secretary, role: 'सचिव', mobile: secMobile },
        { id: `MEM-${school.udise}-${sess}-4`, name: 'रामकली बाई', role: 'सहायक रसोइया / सदस्य' },
        { id: `MEM-${school.udise}-${sess}-5`, name: 'सुमित्रा देवी', role: 'सदस्य' }
      ]
    };
  });
});

export const initialRasoiya: Rasoiya[] = SEED_SESSIONS.flatMap((sess) => {
  return CLUSTER_37_SCHOOLS.map((school, idx) => {
    const cook = seedCookNames[idx % seedCookNames.length];
    const shgId = sess === '2026-27' ? `SHG-${school.udise}` : `SHG-${school.udise}-${sess}`;
    const groupName = `${shgGroupNames[idx % shgGroupNames.length]} ${school.village || ''}`.trim();

    return {
      id: sess === '2026-27' ? `RSY-${school.udise}-1` : `RSY-${school.udise}-${sess}-1`,
      name: cook,
      workLocation: 'विद्यालय परिसर - मध्याह्न भोजन रसोई शेड',
      status: 'ACTIVE',
      schoolUdise: school.udise,
      schoolName: school.hindiName || school.name,
      bankAccount: `3198020100${12300 + idx}`,
      ifsc: 'SBIN0001234',
      bankName: 'भारतीय स्टेट बैंक (SBI)',
      mobile: `9179${(idx * 2222 + 3333).toString().slice(0, 6)}`,
      aadhaarNumber: `9281746201${(idx + 10).toString().slice(0, 2)}`,
      samagraId: `1892${(idx * 1111 + 2222).toString().slice(0, 5)}`,
      panNumber: `BNZPB${1200 + idx}K`,
      shgId: shgId,
      shgName: groupName,
      sessionId: sess
    };
  });
});


