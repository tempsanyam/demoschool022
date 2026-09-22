import { School } from '../types';

/**
 * Standardized school password generator:
 * Format: SCH + last 4 digits of UDISE code (e.g., UDISE 23080110702 -> SCH0702)
 */
export function generateSchoolPassword(schoolOrUdise: School | string): string {
  const udise = typeof schoolOrUdise === 'string' ? schoolOrUdise : schoolOrUdise?.udise || '';
  const cleanUdise = udise.trim();
  if (cleanUdise.length >= 4) {
    return `SCH${cleanUdise.slice(-4)}`;
  }
  return 'SCH0000';
}

/**
 * Helper to validate if a password matches the expected SCHXXXX format for a school
 */
export function verifySchoolPassword(udise: string, inputPass: string, customPass?: string | null): boolean {
  const cleanInput = (inputPass || '').trim();
  if (customPass && cleanInput === customPass.trim()) {
    return true;
  }
  const expectedDefault = generateSchoolPassword(udise);
  return cleanInput.toUpperCase() === expectedDefault.toUpperCase();
}
