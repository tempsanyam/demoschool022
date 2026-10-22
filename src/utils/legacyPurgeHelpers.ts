/**
 * Helper functions to identify and purge confirmed legacy demo/test data
 * while preserving 100% of master data and genuine user-entered records.
 */

export function isLegacyFakeStudent(s: any): boolean {
  if (!s || typeof s !== 'object') return false;

  // 1. Check characteristic mock parents
  if (s.motherName && typeof s.motherName === 'string' && s.motherName.trim() === 'शांति देवी') {
    return true;
  }
  if (s.fatherName && typeof s.fatherName === 'string') {
    const fn = s.fatherName.trim();
    if (fn === 'राम दीक्षित' || fn === 'राम पटेल' || fn === 'राम अहिरवार' || fn === 'राम गौड़') {
      return true;
    }
  }

  // 2. Check characteristic mock Samagra IDs (109340xxx, 109360xxx)
  if (s.samagraId && typeof s.samagraId === 'string') {
    const sid = s.samagraId.trim();
    if (sid.startsWith('109340') || sid.startsWith('109360') || sid.startsWith('109801')) {
      return true;
    }
  }

  // 3. Check characteristic mock mobiles (98262xxxxx, 98263xxxxx)
  if (s.mobile && typeof s.mobile === 'string') {
    const mob = s.mobile.trim();
    if (mob.startsWith('98262') || mob.startsWith('98263')) {
      return true;
    }
  }

  // 4. Check characteristic mock IDs
  if (s.id && typeof s.id === 'string' && (s.id.startsWith('STU-') || s.id.startsWith('DEMO-STU-'))) {
    return true;
  }

  // 5. Check characteristic mock names
  const mockNames = [
    'सोनम दीक्षित', 'तनु दीक्षित', 'आर्यन पटेल', 'सोनम अहिरवार', 'सुमित गौड़',
    'पूजा दीक्षित', 'दीपक पटेल', 'काजल अहिरवार', 'शिवम गौड़', 'सुमित पटेल',
    'पूजा अहिरवार', 'दीपक गौड़', 'काजल दीक्षित', 'शिवम पटेल', 'अंजलि अहिरवार',
    'अंजलि दीक्षित', 'हर्ष पटेल', 'रचना अहिरवार', 'मनोज गौड़', 'संध्या दीक्षित',
    'अंकित पटेल', 'हर्ष गौड़', 'रचना दीक्षित', 'मनोज पटेल', 'संध्या अहिरवार',
    'अंकित गौड़', 'शिवानी दीक्षित', 'शिवानी अहिरवार', 'राहुल गौड़', 'मोहिनी दीक्षित',
    'आयुष पटेल', 'राहुल पटेल', 'मोहिनी अहिरवार', 'आयुष गौड़', 'प्राची दीक्षित',
    'आदित्य पटेल', 'तनु अहिरवार', 'प्राची अहिरवार', 'आदित्य गौड़',
  ];
  if (s.name && typeof s.name === 'string' && mockNames.includes(s.name.trim())) {
    return true;
  }

  return false;
}

export function isLegacyFakeEnrollment(e: any): boolean {
  if (!e || typeof e !== 'object') return false;
  if (e.id && typeof e.id === 'string' && (e.id.startsWith('ENR-') || e.id.startsWith('DEMO-ENR-'))) {
    return true;
  }
  if (e.rollNumber && typeof e.rollNumber === 'string' && e.rollNumber.startsWith('R-')) {
    return true;
  }
  if (e.studentId && typeof e.studentId === 'string' && e.studentId.startsWith('STU-')) {
    return true;
  }
  return false;
}

export function isLegacyFakeStaff(s: any): boolean {
  if (!s || typeof s !== 'object') return false;
  if (s.id && typeof s.id === 'string' && (s.id.startsWith('STF-') || s.id.startsWith('DEMO-STF-'))) {
    return true;
  }
  if (s.employeeCode && typeof s.employeeCode === 'string' && s.employeeCode.startsWith('EMP-')) {
    return true;
  }
  if (s.employeeId && typeof s.employeeId === 'string' && s.employeeId.startsWith('EMP-')) {
    return true;
  }
  if (s.uniqueId && typeof s.uniqueId === 'string' && s.uniqueId.startsWith('UID-MP-')) {
    return true;
  }
  if (s.mobile && typeof s.mobile === 'string' && (s.mobile.startsWith('98261') || s.mobile.startsWith('98264'))) {
    return true;
  }
  return false;
}

export function isLegacyFakeStaffPosting(p: any): boolean {
  if (!p || typeof p !== 'object') return false;
  if (p.id && typeof p.id === 'string' && (p.id.startsWith('PST-') || p.id.startsWith('DEMO-PST-'))) {
    return true;
  }
  if (p.staffId && typeof p.staffId === 'string' && p.staffId.startsWith('STF-')) {
    return true;
  }
  return false;
}

export function isLegacyFakeAttendance(a: any): boolean {
  if (!a || typeof a !== 'object') return false;
  if (a.id && typeof a.id === 'string' && (a.id.startsWith('ATT-') || a.id.startsWith('DEMO-ATT-'))) {
    return true;
  }
  return false;
}

export function isLegacyFakeMDM(m: any): boolean {
  if (!m || typeof m !== 'object') return false;
  if (m.id && typeof m.id === 'string' && (m.id.startsWith('MDM-') || m.id.startsWith('DEMO-MDM-'))) {
    return true;
  }
  return false;
}

export function isLegacyFakeRasoiya(r: any): boolean {
  if (!r || typeof r !== 'object') return false;
  if (r.id && typeof r.id === 'string' && (r.id.startsWith('RAS-') || r.id.startsWith('DEMO-RAS-'))) {
    return true;
  }
  if (r.branchName === 'खिरकिया') return true;
  if (r.shgName === 'माँ शारदा स्व-सहायता समूह') return true;
  return false;
}

export function isLegacyFakeSHG(s: any): boolean {
  if (!s || typeof s !== 'object') return false;
  if (s.id && typeof s.id === 'string' && (s.id.startsWith('SHG-') || s.id.startsWith('DEMO-SHG-'))) {
    return true;
  }
  if (s.name && typeof s.name === 'string' && s.name.startsWith('माँ शारदा')) {
    return true;
  }
  return false;
}

export function isLegacyFakeGovernmentWork(w: any): boolean {
  if (!w || typeof w !== 'object') return false;
  if (w.id && typeof w.id === 'string' && (w.id.startsWith('WRK-') || w.id.startsWith('DEMO-WRK-'))) {
    return true;
  }
  if (w.orderNumber && typeof w.orderNumber === 'string' && w.orderNumber.startsWith('RSK/2026/')) {
    return true;
  }
  return false;
}

export function isLegacyFakeComplaint(c: any): boolean {
  if (!c || typeof c !== 'object') return false;
  if (c.id && typeof c.id === 'string' && (c.id.startsWith('CMP-') || c.id.startsWith('DEMO-CMP-'))) {
    return true;
  }
  return false;
}
