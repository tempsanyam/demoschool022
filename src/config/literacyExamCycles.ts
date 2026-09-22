import { ExamCycle } from '../types/literacy';

/**
 * Centralized Master Definition for Literacy Examination Cycles (ULLAS / Navbharat Literacy)
 * Source of truth across all modules, forms, filters, and reports.
 */
export interface ExamCycleMasterItem {
  id?: string;
  cycleId: string;
  cycleName: string;
  examName: string;
  examDate: string; // YYYY-MM-DD
  examDateDisplay: string; // Hindi readable date, e.g. "21 मार्च 2027"
  sessionId: string; // e.g. "2026-27"
  academicYear: string; // e.g. "2026-27"
  isCompleted: boolean;
  remarks?: string;
}

export const LITERACY_EXAM_CYCLE_MASTER: readonly ExamCycleMasterItem[] = [
  {
    cycleId: 'CYCLE-2027-01',
    cycleName: 'नवभारत साक्षरता मूल्यांकन परीक्षा 2026-27',
    examName: 'नवभारत साक्षरता मूल्यांकन परीक्षा 2026-27',
    examDate: '2027-03-21',
    examDateDisplay: '21 मार्च 2027',
    sessionId: '2026-27',
    academicYear: '2026-27',
    isCompleted: false,
    remarks: 'वर्तमान सक्रिय सत्र 2026-27 निर्धारित साक्षरता परीक्षा चक्र',
  },
  {
    cycleId: 'CYCLE-2026-01',
    cycleName: 'नवभारत साक्षरता मूल्यांकन परीक्षा 2025-26',
    examName: 'नवभारत साक्षरता मूल्यांकन महापरीक्षा 2026',
    examDate: '2026-03-22',
    examDateDisplay: '22 मार्च 2026',
    sessionId: '2025-26',
    academicYear: '2025-26',
    isCompleted: true,
    remarks: 'सत्र 2025-26 के अंतर्गत आयोजित साक्षरता मूल्यांकन परीक्षा',
  },
  {
    cycleId: 'CYCLE-2025-01',
    cycleName: 'नवभारत साक्षरता मूल्यांकन परीक्षा 2024-25',
    examName: 'नवभारत साक्षरता मूल्यांकन परीक्षा 2025',
    examDate: '2025-03-23',
    examDateDisplay: '23 मार्च 2025',
    sessionId: '2024-25',
    academicYear: '2024-25',
    isCompleted: true,
    remarks: 'सत्र 2024-25 साक्षरता मूल्यांकन परीक्षा',
  },
  {
    cycleId: 'CYCLE-2024-01',
    cycleName: 'नवभारत साक्षरता मूल्यांकन परीक्षा 2024 (2023-24)',
    examName: 'उल्लास - नवभारत साक्षरता कार्यक्रम परीक्षा',
    examDate: '2024-03-17',
    examDateDisplay: '17 मार्च 2024',
    sessionId: '2023-24',
    academicYear: '2023-24',
    isCompleted: true,
    remarks: 'उल्लास - नवभारत साक्षरता कार्यक्रम अंतर्गत बुनियादी साक्षरता एवं संख्याज्ञान मूल्यांकन',
  },
  {
    cycleId: 'CYCLE-2023-02',
    cycleName: 'नवभारत साक्षरता 26 मार्च परीक्षा (2022-23)',
    examName: 'नवभारत साक्षरता कार्यक्रम महा-मूल्यांकन परीक्षा',
    examDate: '2023-03-26',
    examDateDisplay: '26 मार्च 2023',
    sessionId: '2022-23',
    academicYear: '2022-23',
    isCompleted: true,
    remarks: '26 मार्च 2023 को आयोजित राज्य स्तरीय साक्षरता महापरीक्षा',
  },
  {
    cycleId: 'CYCLE-2023-01',
    cycleName: 'नवभारत साक्षरता 19 मार्च परीक्षा (2022-23)',
    examName: 'नवभारत साक्षरता कार्यक्रम बुनियादी साक्षरता मूल्यांकन',
    examDate: '2023-03-19',
    examDateDisplay: '19 मार्च 2023',
    sessionId: '2022-23',
    academicYear: '2022-23',
    isCompleted: true,
    remarks: '19 मार्च 2023 को आयोजित संकुल स्तरीय साक्षरता परीक्षा',
  },
  {
    cycleId: 'CYCLE-2022-01',
    cycleName: 'पढ़ना लिखना अभियान परीक्षा 2022 (2021-22)',
    examName: 'पढ़ना लिखना अभियान मूल्यांकन परीक्षा',
    examDate: '2022-03-27',
    examDateDisplay: '27 मार्च 2022',
    sessionId: '2021-22',
    academicYear: '2021-22',
    isCompleted: true,
    remarks: 'राष्ट्रीय स्तर पर आयोजित पढ़ना-लिखना अभियान प्रथम चरण परीक्षा',
  },
] as const;

/**
 * Convert master item to runtime ExamCycle format
 */
export const toRuntimeExamCycle = (item: ExamCycleMasterItem): ExamCycle => ({
  id: item.cycleId,
  cycleId: item.cycleId,
  examCycleName: item.cycleName,
  cycleName: item.cycleName,
  examName: item.examName,
  examDate: item.examDate,
  sessionId: item.sessionId,
  academicYear: item.academicYear,
  isCompleted: item.isCompleted,
  remarks: item.remarks,
  createdBy: 'संयम जैन (Admin)',
  createdAt: `${item.examDate}T09:00:00.000Z`,
  updatedBy: 'संयम जैन (Admin)',
  updatedAt: `${item.examDate}T17:00:00.000Z`,
});

/**
 * Initial ExamCycles mapped from master definition
 */
export const INITIAL_MASTER_EXAM_CYCLES: ExamCycle[] = LITERACY_EXAM_CYCLE_MASTER.map(toRuntimeExamCycle);

/**
 * Retrieve cycles belonging strictly to a specific session
 */
export const getExamCyclesBySession = (sessionId?: string): ExamCycleMasterItem[] => {
  if (!sessionId) return [...LITERACY_EXAM_CYCLE_MASTER];
  return LITERACY_EXAM_CYCLE_MASTER.filter((c) => c.sessionId === sessionId);
};

/**
 * Retrieve a specific cycle by cycleId or examCycleName or examName
 */
export const findExamCycleMaster = (identifier?: string): ExamCycleMasterItem | undefined => {
  if (!identifier) return undefined;
  const found = LITERACY_EXAM_CYCLE_MASTER.find(
    (c) => c.cycleId === identifier || c.cycleName === identifier || c.examName === identifier
  );
  if (found) {
    return { ...found, id: found.cycleId };
  }
  return undefined;
};
