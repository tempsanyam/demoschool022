import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unconditional purge of all legacy test/fake operational records, school logins, and default schools
const IMMEDIATE_WIPE_TOKEN = 'jsk_complete_wipe_2026_v23_all_schools_purged';
if (localStorage.getItem(IMMEDIATE_WIPE_TOKEN) !== 'PURGED') {
  const keysToPurge = [
    'jsk_schools', // Purge default schools from localStorage per user directive
    'jsk_student_masters',
    'jsk_student_academic_records',
    'jsk_student_transfers',
    'jsk_students',
    'jsk_staff_masters',
    'jsk_staff_postings',
    'jsk_staff',
    'jsk_attendance',
    'jsk_mdm',
    'jsk_work',
    'jsk_complaints',
    'jsk_documents',
    'jsk_upload_history',
    'jsk_facilities',
    'jsk_rasoiya',
    'jsk_shgs',
    'jsk_literacy_registers',
    'jsk_literacy_illiterates',
    'jsk_literacy_volunteers',
    'jsk_literacy_exam_results',
    'jsk_literacy_institutions',
    'jsk_phase2_migration_write_ok_v1',
    'jsk_cloud_seed_done',
    'jsk_malguwa_users', // Purge old users cache to eliminate any school logins
  ];
  keysToPurge.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  });

  // Also check if existing session is a school login and purge it
  try {
    const rawCur = localStorage.getItem('jsk_malguwa_current_user');
    if (rawCur) {
      const parsed = JSON.parse(rawCur);
      if (parsed && parsed.role === 'SCHOOL') {
        localStorage.removeItem('jsk_malguwa_current_user');
        localStorage.removeItem('jsk_malguwa_session_token');
        localStorage.removeItem('jsk_malguwa_session_timestamp');
      }
    }
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(IMMEDIATE_WIPE_TOKEN, 'PURGED');
  } catch {
    // ignore
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
