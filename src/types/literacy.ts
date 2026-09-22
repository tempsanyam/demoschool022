/**
 * Navbharat Literacy Program (नवभारत साक्षरता कार्यक्रम) Types
 * Strict schema matching official government reference forms
 */

export type LiteracyGender = 'पुरुष' | 'महिला' | 'अन्य';
export type LiteracyCategory = 'SC' | 'ST' | 'OBC' | 'General';
export type LiteracyMaritalStatus = 'विवाहित' | 'अविवाहित' | 'विधवा' | 'विधुर' | 'अन्य';
export type LiteracyExamResultStatus = 'उत्तीर्ण' | 'सुधार की आवश्यकता' | 'अनुत्तीर्ण' | 'परीक्षा में सम्मिलित नहीं';

/**
 * 1. साक्षरता पंजी का प्रथम पृष्ठ (Literacy Register Front Page)
 */
export interface LiteracyRegister {
  id: string;
  sessionId?: string;
  academicYear?: string;
  schoolId?: string;
  schoolUdise: string; // शाला का DISECODE
  schoolName: string; // सामाजिक चेतना केंद्र / शाला का नाम
  schoolAddress?: string; // शाला का पूर्ण पता
  sankul?: string; // संकुल केंद्र का नाम
  block?: string; // विकासखंड का नाम
  district?: string; // जिले का नाम
  villageWard?: string; // बसाहट ग्राम / वार्ड का नाम
  villageOrWard?: string; // ग्राम / वार्ड (उर्फ)
  gramPanchayat?: string; // ग्राम पंचायत का नाम
  janpadPanchayatUrbanBody?: string; // जनपद पंचायत / नगरीय निकाय का नाम
  totalHouseholds?: number; // कुल परिवार
  totalPopulation?: number; // कुल जनसंख्या (अनुमानित / भौतिक)
  population2011?: number; // 2011 की जनगणना के अनुसार बसाहट में कुल जनसंख्या
  literacyRate2011?: number; // 2011 के अनुसार साक्षरता प्रतिशत
  illiterateCount2011?: number; // 2011 के अनुसार बसाहट में असाक्षरों की संख्या
  currentIdentifiedIlliterate?: number; // वर्तमान में चिह्नांकित असाक्षरों की संख्या
  surveyedMaleIlliterates?: number; // सर्वेक्षित असाक्षर (पुरुष)
  surveyedFemaleIlliterates?: number; // सर्वेक्षित असाक्षर (महिला)
  totalSurveyedIlliterates?: number; // कुल सर्वेक्षित असाक्षर
  registeredOnApp?: number; // उल्लास ऐप पर पंजीकृत
  totalAksharSathis?: number; // कुल अक्षर साथी
  aksharSathiCount?: number; // अक्षर साथियों की संख्या
  teachingCentersCount?: number; // संचालित अध्ययन केंद्र
  socialAwarenessCenterCount?: number; // संचालित सामाजिक चेतना केंद्र
  examRegisteredLearners?: number; // परीक्षा हेतु पंजीकृत
  examAppearedLearners?: number; // परीक्षा में सम्मिलित
  passedLearners?: number; // उत्तीर्ण नवसाक्षर
  remainingIlliterates?: number; // शेष असाक्षर
  isCertified?: boolean; // प्रमाणीकरण स्थिति
  certifiedBy?: string; // सत्यापनकर्ता / प्रधान पाठक का नाम
  certificationDate?: string; // सत्यापन तिथि
  remarks?: string; // विशेष विवरण / टीप
  isRegisterMaintained?: boolean; // साक्षरता पंजी संधारित — हाँ/नहीं
  centerOrSchoolName?: string; // सामाजिक चेतना केंद्र / शाला का नाम
  nodalOfficerDesignation?: string; // नोडल अधिकारी / शाला प्रभारी
  nodalOfficerName?: string; // नोडल अधिकारी / केंद्र प्रभारी का नाम
  nodalOfficerMobile?: string; // नोडल अधिकारी / केंद्र प्रभारी का मोबाइल नंबर
  currentEstimatedPopulation?: number; // वर्तमान में अनुमानित जनसंख्या
  programDetails?: string; // सभी के लिए शिक्षा अंतर्गत नवभारत साक्षरता कार्यक्रम की जानकारी
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * 2. असाक्षर व्यक्ति (Illiterate Person Master)
 */
export interface IlliteratePerson {
  id: string;
  sessionId?: string;
  academicYear?: string;
  schoolId?: string;
  schoolUdise: string;
  schoolName?: string;
  srNo?: number; // क्रमांक
  name: string; // नाम
  fatherOrHusbandName: string; // पिता/पति का नाम
  motherName?: string; // माता का नाम
  maritalStatus?: LiteracyMaritalStatus; // वैवाहिक स्थिति
  dob?: string; // जन्मतिथि (YYYY-MM-DD)
  age?: number;
  gender: LiteracyGender; // लिंग
  isDisability?: boolean; // दिव्यांगता हाँ/नहीं
  disability?: string;
  disabilityType?: string;
  category: LiteracyCategory; // वर्ग
  mobile?: string; // मोबाइल
  mobileNumber?: string; // मोबाइल नंबर (उर्फ)
  samagraId?: string; // समग्र ID
  authorizedIdType?: 'आधार' | 'आधार वर्चुअल ID' | 'अन्य अधिकृत पहचान पत्र';
  authorizedIdNumber?: string; // आधार संबंधित अधिकृत field
  aadhaarNumber?: string; // आधार नंबर (उर्फ)
  isRegistered?: boolean; // पंजीकृत हाँ/नहीं
  isExamParticipated?: boolean; // परीक्षा में सम्मिलित हाँ/नहीं
  examResult?: LiteracyExamResultStatus | string; // परीक्षा परिणाम
  aksharSathiId?: string; // अक्षर साथी ID
  aksharSathiName?: string; // अक्षर साथी का नाम
  assignedAksharSathiName?: string; // टैग किए गए अक्षर साथी का नाम
  photo?: string; // फोटो (वैकल्पिक)
  address?: string; // पता
  villageWard?: string; // ग्राम / वार्ड
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * 3. अक्षर साथी (Volunteer / Akshar Sathi Master)
 */
export interface AksharSathi {
  id: string;
  sessionId?: string;
  academicYear?: string;
  schoolId?: string;
  schoolUdise: string;
  schoolName?: string;
  srNo?: number; // क्रमांक
  name: string; // अक्षर साथी का नाम
  fatherOrHusbandName?: string; // पिता / पति का नाम
  mobile?: string; // मोबाइल नंबर
  mobileNumber?: string; // मोबाइल नंबर (उर्फ)
  dob?: string; // जन्मतिथि
  age?: number; // आयु
  qualification?: string; // शैक्षणिक योग्यता
  educationalQualification?: string; // शैक्षणिक योग्यता (उर्फ)
  institution?: string; // संस्था
  institutionName?: string; // संस्था का नाम (उर्फ)
  teachingPlace?: string; // अध्यापन स्थल (उर्फ)
  teachingLocationAddress?: string; // नवसाक्षरों को अध्ययन कराने का स्थान / पता
  identifiedLearnersCount?: number; // चिह्नांकित असाक्षरों की संख्या
  mappedLearnerCount?: number; // टैग किए गए शिक्षार्थियों की संख्या
  examParticipatedLearnersCount?: number; // परीक्षा में सम्मिलित नवसाक्षरों की संख्या
  examParticipatedLearnerCount?: number;
  passedLearnersCount?: number; // उत्तीर्ण नवसाक्षरों की संख्या
  passedLearnerCount?: number;
  villageWard?: string;
  photo?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * 4. परीक्षा चक्र मास्टर (Exam Cycle Configuration)
 */
export interface ExamCycle {
  id: string; // e.g. "CYCLE-2027-01"
  cycleId?: string; // alias
  examCycleName: string; // e.g. "नवभारत साक्षरता मूल्यांकन परीक्षा 2026-27"
  cycleName?: string; // alias
  examName: string; // e.g. "नवभारत साक्षरता मूल्यांकन परीक्षा 2026-27"
  examDate: string; // YYYY-MM-DD
  sessionId?: string; // e.g. "2026-27"
  academicYear?: string; // e.g. "2026-27"
  isCompleted: boolean;
  remarks?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * 5. परीक्षा परिणाम संकलन (Literacy Exam Result Compilation per school/cycle)
 */
export interface LiteracyExamResult {
  id: string;
  schoolId?: string;
  schoolUdise: string;
  schoolName?: string;
  cycleId?: string; // alias for examCycleId
  examCycleId?: string;
  cycleName?: string; // alias for examCycleName
  examCycleName?: string;
  examName: string;
  examDate: string;
  sessionId?: string; // Academic Session (e.g. "2026-27")
  academicYear?: string; // Academic Year (e.g. "2026-27")
  femaleCount?: number; // महिला परीक्षार्थी
  femaleLearners?: number; // महिला परीक्षार्थी (alias)
  maleCount?: number; // पुरुष परीक्षार्थी
  maleLearners?: number; // पुरुष परीक्षार्थी (alias)
  totalCount?: number; // कुल परीक्षार्थी
  totalLearners?: number; // कुल परीक्षार्थी (alias)
  participatedCount?: number; // सम्मिलित
  participatedLearners?: number; // सम्मिलित (alias)
  passedCount?: number; // उत्तीर्ण
  passedLearners?: number; // उत्तीर्ण (alias)
  failedCount?: number; // अनुत्तीर्ण
  failedLearners?: number; // अनुत्तीर्ण (alias)
  remainingCount?: number; // शेष/अन्य
  remainingIlliterateLearners?: number; // शेष/अन्य (alias)
  successRate?: number; // सफलता प्रतिशत
  remarks?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * 6. सहयोगी विभाग / संस्थाएँ (Supporting Institutions / Departments)
 */
export interface SupportingInstitution {
  id: string;
  schoolId?: string;
  schoolUdise: string;
  schoolName?: string;
  srNo?: number; // क्रमांक
  institutionType?: string; // संस्था का प्रकार (e.g. जन अभियान परिषद, नेहरू युवा केंद्र, महाविद्यालय, NSS)
  institutionName: string; // सहयोगी अन्य विभागों / संस्थाओं का नाम
  contactPersonName?: string; // सहयोगी व्यक्ति का नाम
  nodalPersonName?: string; // नोडल व्यक्ति का नाम (उर्फ)
  mobile?: string; // मोबाइल नंबर
  mobileNumber?: string; // मोबाइल नंबर (उर्फ)
  contactNumber?: string; // संपर्क नंबर (उर्फ)
  designation?: string; // पद
  workDescription?: string; // किये गए कार्य का विवरण
  totalMembersCount?: number; // कुल सदस्यों की संख्या
  aksharSathiCount?: number; // अक्षर साथियों की संख्या
  teachingCentersCount?: number; // संचालित अध्ययन केंद्रों की संख्या
  totalLearnersCount?: number; // कुल शिक्षार्थियों की संख्या
  passedLearnersCount?: number; // उत्तीर्ण शिक्षार्थियों की संख्या
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * 7. साक्षरता डैशबोर्ड सारांश स्टेट्स
 */
export interface LiteracyDashboardStats {
  totalIdentifiedIlliterate: number; // कुल चिह्नांकित असाक्षर
  femaleCount: number; // महिला
  maleCount: number; // पुरुष
  otherGenderCount: number; // अन्य
  totalRegistered: number; // कुल पंजीकृत
  unregisteredCount: number; // अपंजीकृत
  totalAksharSathi: number; // अक्षर साथी
  socialCentersCount: number; // सामाजिक चेतना केंद्र / अध्ययन केंद्र
  examParticipated: number; // परीक्षा में सम्मिलित
  passedCount: number; // उत्तीर्ण
  failedCount: number; // अनुत्तीर्ण
  remainingIlliterate: number; // शेष असाक्षर
  totalSupportingInstitutions: number; // सहयोगी संस्थाएँ
  passPercentage: number;
}
