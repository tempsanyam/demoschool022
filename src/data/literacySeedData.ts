import {
  LiteracyRegister,
  IlliteratePerson,
  AksharSathi,
  ExamCycle,
  LiteracyExamResult,
  SupportingInstitution
} from '../types/literacy';
import { INITIAL_MASTER_EXAM_CYCLES } from '../config/literacyExamCycles';

/**
 * Default Configurable Exam Cycles from Centralized Master (Preserved Master)
 */
export const initialExamCycles: ExamCycle[] = INITIAL_MASTER_EXAM_CYCLES;

/**
 * Cleaned Seed Literacy Registers (Ready for verified real data entry)
 */
export const initialLiteracyRegisters: LiteracyRegister[] = [];

/**
 * Cleaned Seed Akshar Sathis (Ready for verified real data entry)
 */
export const initialAksharSathis: AksharSathi[] = [];

/**
 * Cleaned Seed Illiterate Persons (Ready for verified real data entry)
 */
export const initialIlliteratePersons: IlliteratePerson[] = [];

/**
 * Cleaned Seed Literacy Exam Results (Ready for verified real data entry)
 */
export const initialLiteracyExamResults: LiteracyExamResult[] = [];

/**
 * Cleaned Seed Supporting Institutions (Ready for verified real data entry)
 */
export const initialSupportingInstitutions: SupportingInstitution[] = [];
