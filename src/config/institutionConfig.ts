export interface CACInfo {
  name: string;
  shortName: string;
  role: string;
  mobile: string;
  whatsapp: string;
  email: string;
}

export interface InstitutionConfig {
  department: string;
  institutionName: string;
  institutionShortName: string;
  fullTitle: string;
  subtitle: string;
  sankulName: string;
  jskName: string;
  block: string;
  blockEnglish: string;
  district: string;
  districtEnglish: string;
  state: string;
  stateEnglish: string;
  pinCode: string;
  diseCode: string;
  academicSession: string;
  cac1: CACInfo;
  cac2: CACInfo;
  systemVersion: string;
  copyrightYear: string;
  totalSchoolsCount: number;
}

export const institutionConfig: InstitutionConfig = {
  department: 'स्कूल शिक्षा विभाग, मध्य प्रदेश शासन',
  institutionName: 'संकुल एवं जन शिक्षा केंद्र मलगुवां',
  institutionShortName: 'संकुल मलगुवां',
  fullTitle: 'जन शिक्षा केंद्र / संकुल मलगुवां शैक्षिक एवं प्रशासनिक प्रबंधन प्रणाली',
  subtitle: 'शैक्षिक एवं प्रशासनिक प्रबंधन प्रणाली',
  sankulName: 'संकुल मलगुवां',
  jskName: 'जन शिक्षा केंद्र मलगुवां',
  block: 'बलदेवगढ़',
  blockEnglish: 'Baldeogarh',
  district: 'टीकमगढ़',
  districtEnglish: 'Tikamgarh',
  state: 'मध्य प्रदेश',
  stateEnglish: 'Madhya Pradesh',
  pinCode: '472115',
  diseCode: '23080113607',
  academicSession: '2026-27',
  cac1: {
    name: 'संजय कुमार जैन',
    shortName: 'संजय जैन',
    role: 'संकुल समन्वयक (CAC)',
    mobile: '7000382532',
    whatsapp: '9753679036',
    email: 'cac.malguwa@mp.gov.in',
  },
  cac2: {
    name: 'सन्मति कुमार जैन',
    shortName: 'सन्मति जैन',
    role: 'संकुल समन्वयक (CAC)',
    mobile: '9977323573',
    whatsapp: '9977323573',
    email: 'cac.sanmati@mp.gov.in',
  },
  systemVersion: 'v2.5',
  copyrightYear: '2026',
  totalSchoolsCount: 37,
};
