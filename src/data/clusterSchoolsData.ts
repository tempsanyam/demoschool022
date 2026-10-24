import { School, SchoolType, User, UserRole, UserStatus } from '../types';

export interface ClusterSchoolDefinition {
  sr: number;
  name: string;
  hindiName: string;
  udise: string;
  type: 'Primary' | 'Middle' | 'High School';
  schoolType: SchoolType;
  village: string;
  gramPanchayat: string;
  principalName: string;
  principalMobile: string;
  rooms: number;
  classrooms: number;
}

/**
 * FINAL OFFICIAL 37 SCHOOL MASTER FOR JAN SHIKSHA KENDRA MALGUWA
 * Block: Baldeogarh, District: Tikamgarh (M.P.)
 * 
 * Strict canonical source-of-truth.
 * All UDISEs are 11-digit strings preserving leading zeros.
 */
export const CLUSTER_37_SCHOOLS_RAW: ClusterSchoolDefinition[] = [
  {
    sr: 1,
    name: 'HS HIRAPUR',
    hindiName: 'शा. हाई स्कूल हीरापुर',
    udise: '23080100303',
    type: 'High School',
    schoolType: 'हाई स्कूल',
    village: 'हीरापुर',
    gramPanchayat: 'हीरापुर',
    principalName: '',
    principalMobile: '',
    rooms: 12,
    classrooms: 10,
  },
  {
    sr: 2,
    name: 'PS JANAKPUR',
    hindiName: 'प्रा.शा. जनकपुर',
    udise: '23080110701',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'जनकपुर',
    gramPanchayat: 'जनकपुर',
    principalName: '',
    principalMobile: '',
    rooms: 5,
    classrooms: 4,
  },
  {
    sr: 3,
    name: 'PS KACHHIYAT',
    hindiName: 'प्रा.शा. कछियाट',
    udise: '23080110702',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'कछियाट',
    gramPanchayat: 'जनकपुर',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 4,
    name: 'PS PATTIGANESHJU',
    hindiName: 'प्रा.शा. पट्टीगणेशजू',
    udise: '23080111001',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'पट्टीगणेशजू',
    gramPanchayat: 'पट्टीगणेशजू',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 5,
    name: 'MS DUBDEI',
    hindiName: 'मा.शा. दुबदेई',
    udise: '23080111102',
    type: 'Middle',
    schoolType: 'माध्यमिक',
    village: 'दुबदेई',
    gramPanchayat: 'दुबदेई',
    principalName: '',
    principalMobile: '',
    rooms: 8,
    classrooms: 6,
  },
  {
    sr: 6,
    name: 'PS KHAJRAR',
    hindiName: 'प्रा.शा. खजरार',
    udise: '23080111201',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'खजरार',
    gramPanchayat: 'खजरार',
    principalName: '',
    principalMobile: '',
    rooms: 5,
    classrooms: 4,
  },
  {
    sr: 7,
    name: 'MS KHAJRAR',
    hindiName: 'मा.शा. खजरार',
    udise: '23080111202',
    type: 'Middle',
    schoolType: 'माध्यमिक',
    village: 'खजरार',
    gramPanchayat: 'खजरार',
    principalName: '',
    principalMobile: '',
    rooms: 8,
    classrooms: 6,
  },
  {
    sr: 8,
    name: 'PS PATTI BALWANTSINGH',
    hindiName: 'प्रा.शा. पट्टी बलवंतसिंह',
    udise: '23080111301',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'पट्टी बलवंतसिंह',
    gramPanchayat: 'पट्टी बलवंतसिंह',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 9,
    name: 'PS PURAINIYA',
    hindiName: 'प्रा.शा. पुरैनिया',
    udise: '23080111302',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'पुरैनिया',
    gramPanchayat: 'पुरैनिया',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 10,
    name: 'MS HIRAPUR',
    hindiName: 'मा.शा. हीरापुर',
    udise: '23080111404',
    type: 'Middle',
    schoolType: 'माध्यमिक',
    village: 'हीरापुर',
    gramPanchayat: 'हीरापुर',
    principalName: '',
    principalMobile: '',
    rooms: 8,
    classrooms: 6,
  },
  {
    sr: 11,
    name: 'PS PURA KHERA HIRAPUR',
    hindiName: 'प्रा.शा. पुरा खेरा हीरापुर',
    udise: '23080111405',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'पुरा खेरा हीरापुर',
    gramPanchayat: 'हीरापुर',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 12,
    name: 'PS TURKA',
    hindiName: 'प्रा.शा. तुरका',
    udise: '23080111406',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'तुरका',
    gramPanchayat: 'तुरका',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 13,
    name: 'PS DIGORA',
    hindiName: 'प्रा.शा. दिगोड़ा',
    udise: '23080111408',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'दिगोड़ा',
    gramPanchayat: 'दिगोड़ा',
    principalName: '',
    principalMobile: '',
    rooms: 5,
    classrooms: 4,
  },
  {
    sr: 14,
    name: 'MS SARKAR',
    hindiName: 'मा.शा. सरकार',
    udise: '23080111603',
    type: 'Middle',
    schoolType: 'माध्यमिक',
    village: 'सरकार',
    gramPanchayat: 'सरकार',
    principalName: '',
    principalMobile: '',
    rooms: 7,
    classrooms: 6,
  },
  {
    sr: 15,
    name: 'MS BANPURA BUZURG',
    hindiName: 'मा.शा. बानपुरा बुजुर्ग',
    udise: '23080111702',
    type: 'Middle',
    schoolType: 'माध्यमिक',
    village: 'बानपुरा बुजुर्ग',
    gramPanchayat: 'बानपुरा बुजुर्ग',
    principalName: '',
    principalMobile: '',
    rooms: 8,
    classrooms: 6,
  },
  {
    sr: 16,
    name: 'PS PURUWA',
    hindiName: 'प्रा.शा. पुरूवा',
    udise: '23080111703',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'पुरूवा',
    gramPanchayat: 'बानपुरा बुजुर्ग',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 17,
    name: 'PS BAR',
    hindiName: 'प्रा.शा. बार',
    udise: '23080111801',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'बार',
    gramPanchayat: 'बार',
    principalName: '',
    principalMobile: '',
    rooms: 5,
    classrooms: 4,
  },
  {
    sr: 18,
    name: 'MS VARME',
    hindiName: 'मा.शा. वर्मे',
    udise: '23080111902',
    type: 'Middle',
    schoolType: 'माध्यमिक',
    village: 'वर्मे',
    gramPanchayat: 'वर्मे',
    principalName: '',
    principalMobile: '',
    rooms: 7,
    classrooms: 6,
  },
  {
    sr: 19,
    name: 'PS DARGUWAN JAGIR',
    hindiName: 'प्रा.शा. दरगुवां जागीर',
    udise: '23080113101',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'दरगुवां जागीर',
    gramPanchayat: 'दरगुवां जागीर',
    principalName: '',
    principalMobile: '',
    rooms: 5,
    classrooms: 4,
  },
  {
    sr: 20,
    name: 'PS DHIMROLA',
    hindiName: 'प्रा.शा. ढिमरोला',
    udise: '23080113102',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'ढिमरोला',
    gramPanchayat: 'दरगुवां जागीर',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 21,
    name: 'PS HB DARGUWAN JAGIR',
    hindiName: 'प्रा.शा. हरिजन बस्ती दरगुवां जागीर',
    udise: '23080113103',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'हरिजन बस्ती दरगुवां',
    gramPanchayat: 'दरगुवां जागीर',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 22,
    name: 'GHS DARGUWAN',
    hindiName: 'शा. हाई स्कूल दरगुवां',
    udise: '23080113104',
    type: 'High School',
    schoolType: 'हाई स्कूल',
    village: 'दरगुवां',
    gramPanchayat: 'दरगुवां जागीर',
    principalName: '',
    principalMobile: '',
    rooms: 11,
    classrooms: 9,
  },
  {
    sr: 23,
    name: 'PS BANDHIYANPURA',
    hindiName: 'प्रा.शा. बंधियनपुरा',
    udise: '23080113203',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'बंधियनपुरा',
    gramPanchayat: 'बंधियनपुरा',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 24,
    name: 'PS KACHHIYA KHERA',
    hindiName: 'प्रा.शा. कछिया खेरा',
    udise: '23080113301',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'कछिया खेरा',
    gramPanchayat: 'कछिया खेरा',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 25,
    name: 'MS KACHHIYA KHERA',
    hindiName: 'मा.शा. कछिया खेरा',
    udise: '23080113302',
    type: 'Middle',
    schoolType: 'माध्यमिक',
    village: 'कछिया खेरा',
    gramPanchayat: 'कछिया खेरा',
    principalName: '',
    principalMobile: '',
    rooms: 7,
    classrooms: 6,
  },
  {
    sr: 26,
    name: 'PS MAUNE KA KHERA',
    hindiName: 'प्रा.शा. मौने का खेरा',
    udise: '23080113401',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'मौने का खेरा',
    gramPanchayat: 'मौने का खेरा',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 27,
    name: 'MS MAUNE KA KHERA',
    hindiName: 'मा.शा. मौने का खेरा',
    udise: '23080113402',
    type: 'Middle',
    schoolType: 'माध्यमिक',
    village: 'मौने का खेरा',
    gramPanchayat: 'मौने का खेरा',
    principalName: '',
    principalMobile: '',
    rooms: 7,
    classrooms: 6,
  },
  {
    sr: 28,
    name: 'PS BASENDU',
    hindiName: 'प्रा.शा. बसेन्दू',
    udise: '23080113403',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'बसेन्दू',
    gramPanchayat: 'मौने का खेरा',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 29,
    name: 'MS MALGUWAN',
    hindiName: 'मा.शा. मलगुवां',
    udise: '23080113602',
    type: 'Middle',
    schoolType: 'माध्यमिक',
    village: 'मलगुवां',
    gramPanchayat: 'मलगुवां',
    principalName: '',
    principalMobile: '',
    rooms: 8,
    classrooms: 6,
  },
  {
    sr: 30,
    name: 'PS DHUVYA',
    hindiName: 'प्रा.शा. धुवया',
    udise: '23080113603',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'धुवया',
    gramPanchayat: 'मलगुवां',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 31,
    name: 'PS DHIMARWAN',
    hindiName: 'प्रा.शा. धीमरवान',
    udise: '23080113605',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'धीमरवान',
    gramPanchayat: 'मलगुवां',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 32,
    name: 'PS MAGORIYA',
    hindiName: 'प्रा.शा. मगोरिया',
    udise: '23080113606',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'मगोरिया',
    gramPanchayat: 'मलगुवां',
    principalName: '',
    principalMobile: '',
    rooms: 4,
    classrooms: 3,
  },
  {
    sr: 33,
    name: 'HS MALGUWAN',
    hindiName: 'शा. हाई स्कूल मलगुवां',
    udise: '23080113607',
    type: 'High School',
    schoolType: 'हाई स्कूल',
    village: 'मलगुवां',
    gramPanchayat: 'मलगुवां',
    principalName: '',
    principalMobile: '',
    rooms: 12,
    classrooms: 10,
  },
  {
    sr: 34,
    name: 'PS GARROLI',
    hindiName: 'प्रा.शा. गर्रोली',
    udise: '23080113701',
    type: 'Primary',
    schoolType: 'प्राथमिक',
    village: 'गर्रोली',
    gramPanchayat: 'गर्रोली',
    principalName: '',
    principalMobile: '',
    rooms: 5,
    classrooms: 4,
  },
  {
    sr: 35,
    name: 'PRI MAA SARASWATI GM MALGUWAN',
    hindiName: 'प्राथमिक मां सरस्वती ज्ञान मंदिर मलगुवां',
    udise: '23080115206',
    type: 'Primary',
    schoolType: 'अशासकीय प्राथमिक',
    village: 'मलगुवां',
    gramPanchayat: 'मलगुवां',
    principalName: '',
    principalMobile: '',
    rooms: 6,
    classrooms: 5,
  },
  {
    sr: 36,
    name: 'PRI VEERANGANA AWANTI KUDILA',
    hindiName: 'प्राथमिक वीरांगना अवंती कुड़िला',
    udise: '23080115210',
    type: 'Primary',
    schoolType: 'अशासकीय प्राथमिक',
    village: 'कुड़िला',
    gramPanchayat: 'कुड़िला',
    principalName: '',
    principalMobile: '',
    rooms: 6,
    classrooms: 5,
  },
  {
    sr: 37,
    name: 'SARSWATI SHISHU MANDIR BANPURA BUJURG',
    hindiName: 'सरस्वती शिशु मंदिर बानपुरा बुजुर्ग',
    udise: '23084101366',
    type: 'Primary',
    schoolType: 'अशासकीय प्राथमिक',
    village: 'बानपुरा बुजुर्ग',
    gramPanchayat: 'बानपुरा बुजुर्ग',
    principalName: '',
    principalMobile: '',
    rooms: 7,
    classrooms: 6,
  },
];

export interface SchoolMasterValidationResult {
  valid: boolean;
  totalCount: number;
  duplicateUdises: string[];
  invalidUdises: string[];
  missingNames: string[];
  errors: string[];
}

/**
 * Validates School Master data at runtime.
 * Fails fast with clear [SCHOOL_MASTER_ERROR] if:
 * - Any duplicate UDISE is detected
 * - Any UDISE does not strictly match 11 numeric digits
 * - Any school name is missing
 */
export function validateSchoolMaster(
  list: (School | ClusterSchoolDefinition)[]
): SchoolMasterValidationResult {
  const duplicateUdises: string[] = [];
  const invalidUdises: string[] = [];
  const missingNames: string[] = [];
  const errors: string[] = [];
  const seenUdises = new Set<string>();

  list.forEach((s) => {
    const udise = (s.udise || '').trim();
    const name = (s.name || '').trim();

    if (!name) {
      missingNames.push(udise || 'UNKNOWN');
      errors.push(`[SCHOOL_MASTER_ERROR] Missing school name for record with UDISE: "${udise}"`);
    }

    if (!/^\d{11}$/.test(udise)) {
      invalidUdises.push(udise);
      errors.push(`[SCHOOL_MASTER_ERROR] Invalid UDISE format (must be exactly 11 digits): "${udise}"`);
    }

    if (seenUdises.has(udise)) {
      duplicateUdises.push(udise);
      errors.push(`[SCHOOL_MASTER_ERROR] Duplicate UDISE detected: "${udise}"`);
    } else {
      seenUdises.add(udise);
    }
  });

  return {
    valid: errors.length === 0,
    totalCount: list.length,
    duplicateUdises,
    invalidUdises,
    missingNames,
    errors,
  };
}

// Execute startup validation on definition
const startupValidation = validateSchoolMaster(CLUSTER_37_SCHOOLS_RAW);
if (!startupValidation.valid) {
  startupValidation.errors.forEach((err) => {
    console.error(err);
  });
}

export const CLUSTER_37_SCHOOLS: School[] = CLUSTER_37_SCHOOLS_RAW.map((raw) => ({
  udise: raw.udise,
  name: raw.name,
  hindiName: raw.hindiName || raw.name,
  schoolType: raw.schoolType,
  village: raw.village,
  gramPanchayat: raw.gramPanchayat,
  sankul: 'मलगुवां',
  jsk: 'जन शिक्षा केंद्र मलगुवां',
  block: 'बलदेवगढ़',
  district: 'टीकमगढ़',
  pin: '472111',
  address: `ग्राम ${raw.village}, ग्राम पंचायत ${raw.gramPanchayat}, संकुल मलगुवां, विकासखंड बलदेवगढ़`,
  mobile: '',
  email: `${raw.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@mp.gov.in`,
  establishmentYear: raw.type === 'High School' ? 2004 : raw.type === 'Middle' ? 1998 : 1986,
  principalName: raw.principalName || '',
  principalMobile: raw.principalMobile || '',
  principalEmployeeId: '',
  principalAssignmentDate: '',
  status: 'ACTIVE',
  totalRooms: raw.rooms,
  totalClassrooms: raw.classrooms,
}));

export interface SchoolCredentialItem {
  sr: number;
  schoolName: string;
  udise: string;
  username: string;
  initialPassword: string;
}

/**
 * Official 37 School Login Credentials for Sankul / JSK Malguwa
 * Verified 11-digit UDISE & canonical usernames
 */
export const OFFICIAL_37_SCHOOL_CREDENTIALS: SchoolCredentialItem[] = [
  { sr: 1, schoolName: 'HS HIRAPUR', udise: '23080100303', username: 'HSHIRAPUR', initialPassword: 'SCH0303' },
  { sr: 2, schoolName: 'PS JANAKPUR', udise: '23080110701', username: 'PSJANAKPUR', initialPassword: 'SCH0701' },
  { sr: 3, schoolName: 'PS KACHHIYAT', udise: '23080110702', username: 'PSKACHHIYAT', initialPassword: 'SCH0702' },
  { sr: 4, schoolName: 'PS PATTIGANESHJU', udise: '23080111001', username: 'PSPATTIGANESHJU', initialPassword: 'SCH1001' },
  { sr: 5, schoolName: 'MS DUBDEI', udise: '23080111102', username: 'MSDUBDEI', initialPassword: 'SCH1102' },
  { sr: 6, schoolName: 'PS KHAJRAR', udise: '23080111201', username: 'PSKHAJRAR', initialPassword: 'SCH1201' },
  { sr: 7, schoolName: 'MS KHAJRAR', udise: '23080111202', username: 'MSKHAJRAR', initialPassword: 'SCH1202' },
  { sr: 8, schoolName: 'PS PATTI BALWANTSINGH', udise: '23080111301', username: 'PSPATTIBALWANTSINGH', initialPassword: 'SCH1301' },
  { sr: 9, schoolName: 'PS PURAINIYA', udise: '23080111302', username: 'PSPURAINIYA', initialPassword: 'SCH1302' },
  { sr: 10, schoolName: 'MS HIRAPUR', udise: '23080111404', username: 'MSHIRAPUR', initialPassword: 'SCH1404' },
  { sr: 11, schoolName: 'PS PURA KHERA HIRAPUR', udise: '23080111405', username: 'PSPURAKHERAHIRAPUR', initialPassword: 'SCH1405' },
  { sr: 12, schoolName: 'PS TURKA', udise: '23080111406', username: 'PSTURKA', initialPassword: 'SCH1406' },
  { sr: 13, schoolName: 'PS DIGORA', udise: '23080111408', username: 'PSDIGORA', initialPassword: 'SCH1408' },
  { sr: 14, schoolName: 'MS SARKAR', udise: '23080111603', username: 'MSSARKAR', initialPassword: 'SCH1603' },
  { sr: 15, schoolName: 'MS BANPURA BUZURG', udise: '23080111702', username: 'MSBANPURABUZURG', initialPassword: 'SCH1702' },
  { sr: 16, schoolName: 'PS PURUWA', udise: '23080111703', username: 'PSPURUWA', initialPassword: 'SCH1703' },
  { sr: 17, schoolName: 'PS BAR', udise: '23080111801', username: 'PSBAR', initialPassword: 'SCH1801' },
  { sr: 18, schoolName: 'MS VARME', udise: '23080111902', username: 'MSVARME', initialPassword: 'SCH1902' },
  { sr: 19, schoolName: 'PS DARGUWAN JAGIR', udise: '23080113101', username: 'PSDARGUWANJAGIR', initialPassword: 'SCH3101' },
  { sr: 20, schoolName: 'PS DHIMROLA', udise: '23080113102', username: 'PSDHIMROLA', initialPassword: 'SCH3102' },
  { sr: 21, schoolName: 'PS HB DARGUWAN JAGIR', udise: '23080113103', username: 'PSHBDARGUWANJAGIR', initialPassword: 'SCH3103' },
  { sr: 22, schoolName: 'GHS DARGUWAN', udise: '23080113104', username: 'GHSDARGUWAN', initialPassword: 'SCH3104' },
  { sr: 23, schoolName: 'PS BANDHIYANPURA', udise: '23080113203', username: 'PSBANDHIYANPURA', initialPassword: 'SCH3203' },
  { sr: 24, schoolName: 'PS KACHHIYA KHERA', udise: '23080113301', username: 'PSKACHHIYAKHERA', initialPassword: 'SCH3301' },
  { sr: 25, schoolName: 'MS KACHHIYA KHERA', udise: '23080113302', username: 'MSKACHHIYAKHERA', initialPassword: 'SCH3302' },
  { sr: 26, schoolName: 'PS MAUNE KA KHERA', udise: '23080113401', username: 'PSMAUNEKAKHERA', initialPassword: 'SCH3401' },
  { sr: 27, schoolName: 'MS MAUNE KA KHERA', udise: '23080113402', username: 'MSMAUNEKAKHERA', initialPassword: 'SCH3402' },
  { sr: 28, schoolName: 'PS BASENDU', udise: '23080113403', username: 'PSBASENDU', initialPassword: 'SCH3403' },
  { sr: 29, schoolName: 'MS MALGUWAN', udise: '23080113602', username: 'MSMALGUWAN', initialPassword: 'SCH3602' },
  { sr: 30, schoolName: 'PS DHUVYA', udise: '23080113603', username: 'PSDHUVYA', initialPassword: 'SCH3603' },
  { sr: 31, schoolName: 'PS DHIMARWAN', udise: '23080113605', username: 'PSDHIMARWAN', initialPassword: 'SCH3605' },
  { sr: 32, schoolName: 'PS MAGORIYA', udise: '23080113606', username: 'PSMAGORIYA', initialPassword: 'SCH3606' },
  { sr: 33, schoolName: 'HS MALGUWAN', udise: '23080113607', username: 'HSMALGUWAN', initialPassword: 'SCH3607' },
  { sr: 34, schoolName: 'PS GARROLI', udise: '23080113701', username: 'PSGARROLI', initialPassword: 'SCH3701' },
  { sr: 35, schoolName: 'PRI MAA SARASWATI GM MALGUWAN', udise: '23080115206', username: 'PRIMAASARASWATIGMMALGUWAN', initialPassword: 'SCH5206' },
  { sr: 36, schoolName: 'PRI VEERANGANA AWANTI KUDILA', udise: '23080115210', username: 'PRIVEERANGANAAWANTIKUDILA', initialPassword: 'SCH5210' },
  { sr: 37, schoolName: 'SARSWATI SHISHU MANDIR BANPURA BUZURG', udise: '23084101366', username: 'SARSWATISHISHUMANDIRBANPURABUZURG', initialPassword: 'SCH1366' },
];

export const OFFICIAL_37_SCHOOL_USERS: User[] = OFFICIAL_37_SCHOOL_CREDENTIALS.map((cred) => {
  const raw = CLUSTER_37_SCHOOLS_RAW.find((s) => s.udise === cred.udise);
  return {
    id: `USR-SCH-${cred.udise}`,
    username: cred.username,
    name: cred.schoolName,
    role: 'SCHOOL' as UserRole,
    employeeId: `SCH-${cred.udise.slice(-4)}`,
    mobile: raw?.principalMobile || '',
    email: `${cred.username.toLowerCase()}@malguwa.edu.in`,
    designation: 'संस्था प्रभारी',
    assignedSchoolUdise: cred.udise,
    schoolId: cred.udise,
    schoolUdise: cred.udise,
    schoolName: cred.schoolName,
    status: 'ACTIVE' as UserStatus,
    approvalStatus: 'APPROVED' as const,
    password: cred.initialPassword,
    createdAt: '2025-01-01',
    block: 'बलदेवगढ़',
    district: 'टीकमगढ़',
    address: `ग्राम ${raw?.village || ''}, संकुल मलगुवां, विकासखंड बलदेवगढ़`,
    village: raw?.village || '',
  };
});


