# छात्र एवं शिक्षक PII डेटा पृथक्करण वास्तुकला एवं स्कीमा दस्तावेज़
## (Architecture & Schema Design Document: PII Data Isolation)

**दस्तावेज़ संस्करण:** 1.0 (प्रस्तावित डिज़ाइन — केवल वास्तुकला, कोई सक्रिय कोड बदलाव नहीं)  
**प्रोजेक्ट:** संकुल प्रबंधन प्रणाली (JSK Malguwa)  
**लक्षित कलेक्शंस:** `studentMasters`, `staffMasters`  
**लक्षित संवेदनशील फ़ील्ड्स (PII):** आधार नंबर (Aadhaar), बैंक खाता एवं IFSC, जन्मतिथि (DOB), समग्र आईडी, मोबाइल नंबर, आवासीय पता, पिता/माता का नाम, जाति/श्रेणी, पैन नंबर (PAN), वेतन/पीएफ विवरण।

---

## 1. वास्तुकला तुलना: Subcollection बनाम Top-Level Collection

| मानदंड | विकल्प A: Subcollection (`/studentMasters/{id}/restricted/pii`) | विकल्प B: Top-Level Collection (`/studentPiiRecords/{id}`) | चयनित निर्णय |
| :--- | :--- | :--- | :--- |
| **Firestore Data Model** | पैरेंट दस्तावेज़ के नीचे एक एकल सब-कलेक्शन दस्तावेज़ | स्वतंत्र टॉप-लेवल कलेक्शन (Keyed by `studentId` / `staffId`) | **विकल्प B (Top-Level Collection)** |
| **Rules Scoping & Complexity** | `match /studentMasters/{id}/restricted/pii` — पैरेंट दस्तावेज़ की `schoolUdise` जाँचने के लिए `get()` कॉल की आवश्यकता पड़ सकती है (अतिरिक्त रीड लागत व लेटेंसी)। | `match /studentPiiRecords/{id}` — दस्तावेज़ के भीतर सीधे `schoolUdise` उपलब्ध होती है; बिना किसी `get()` कॉल के शून्य-विलंबता सत्यापन संभव। | **विकल्प B श्रेष्ठ** |
| **कलेक्शन ग्रुप क्वेरी जोखिम** | सब-कलेक्शन में भूलवश `collectionGroup('pii')` क्वेरी से सभी स्कूलों का संवेदनशील डेटा एक साथ लीक होने का जोखिम रहता है। | टॉप-लेवल कलेक्शन में `where('schoolUdise', '==', getUserData().assignedSchoolUdise)` साफ़ और नियंत्रित रहता है। | **विकल्प B श्रेष्ठ** |
| **कलेक्शन लिस्टिंग / डिक्शनरी** | छात्र सूची लोड करते समय केवल मूल पहचान (Name, Class, Gender, Roll) फेच होती है; भारी व संवेदनशील PII मेमोरी में नहीं आती। | छात्र सूची लोड करते समय केवल मूल पहचान फेच होती है; PII केवल 'View/Edit Profile' पर मांग पर (on-demand) फेच होती है। | **समान लाभ** |
| **राइट ट्रांजेक्शन / बैचिंग** | पैरेंट और सब-दस्तावेज़ दोनों को एक साथ राइट करना पड़ता है। | `writeBatch` द्वारा दोनों कलेक्शंस में समकालिक (atomic) राइट किया जा सकता है। | **समान** |

### अंतिम वास्तुकला निर्णय:
**विकल्प B (`studentPiiRecords` एवं `staffPiiRecords`) को अपनाया जाए।**
- **सार्वजनिक/सामान्य कलेक्शंस (Cluster-wide read for roster):**
  - `/studentMasters/{studentId}`: केवल गैर-संवेदनशील फ़ील्ड्स (`id`, `name`, `fatherNameInitial`, `gender`, `class`, `section`, `rollNo`, `schoolUdise`, `status`, `academicYear`).
  - `/staffMasters/{staffId}`: केवल गैर-संवेदनशील फ़ील्ड्स (`id`, `name`, `designation`, `subject`, `schoolUdise`, `status`, `employmentType`).
- **प्रतिबंधित PII कलेक्शंस (Strictly Scoped PII):**
  - `/studentPiiRecords/{studentId}`: `studentId`, `schoolUdise`, `aadhaarNumber`, `samagraId`, `bankAccountNo`, `ifscCode`, `bankName`, `dob`, `fatherName`, `motherName`, `address`, `mobileNo`, `casteCategory`, `updatedAt`.
  - `/staffPiiRecords/{staffId}`: `staffId`, `schoolUdise`, `aadhaarNumber`, `panNumber`, `bankAccountNo`, `ifscCode`, `bankName`, `dob`, `mobile`, `alternateMobile`, `email`, `homeAddress`, `pfNumber`, `updatedAt`.

---

## 2. प्रस्तावित Firestore सुरक्षा नियम (Security Rules for PII)

```javascript
// ===============================================================
// Restricted PII Collections (Zero Cross-School Leakage)
// ===============================================================

// 1. Student PII Records
match /studentPiiRecords/{studentId} {
  // Read:
  // - ADMIN and CAC can read for administrative/monitoring purposes
  // - SCHOOL can ONLY read PII of students enrolled in their assigned school (UDISE match)
  allow read: if isSignedIn() && (
    isAdmin() ||
    isCAC() ||
    (isSchool() && resource.data.schoolUdise == getUserData().assignedSchoolUdise)
  );

  // Create / Update:
  // - ADMIN has sovereign write access
  // - SCHOOL can ONLY write/update PII for their own school's students
  // - Must strictly maintain schoolUdise binding (cannot reassign school via PII update)
  allow create: if isSignedIn() && isValidId(studentId) && (
    isAdmin() ||
    (isSchool() &&
     request.resource.data.schoolUdise == getUserData().assignedSchoolUdise &&
     request.resource.data.studentId == studentId &&
     isFeatureAllowed('module.students.action.add_student', 'module.students'))
  );

  allow update: if isSignedIn() && isValidId(studentId) && (
    isAdmin() ||
    (isSchool() &&
     resource.data.schoolUdise == getUserData().assignedSchoolUdise &&
     request.resource.data.schoolUdise == resource.data.schoolUdise &&
     request.resource.data.studentId == studentId &&
     isFeatureAllowed('module.students.action.edit_student', 'module.students'))
  );

  // Delete:
  // - ADMIN sovereign delete
  // - SCHOOL allowed only with explicit feature permission
  allow delete: if isSignedIn() && isValidId(studentId) && (
    isAdmin() ||
    (isSchool() &&
     resource.data.schoolUdise == getUserData().assignedSchoolUdise &&
     isFeatureAllowed('module.students.action.delete_student', 'module.students'))
  );
}

// 2. Staff PII Records
match /staffPiiRecords/{staffId} {
  allow read: if isSignedIn() && (
    isAdmin() ||
    isCAC() ||
    (isSchool() && resource.data.schoolUdise == getUserData().assignedSchoolUdise)
  );

  allow create: if isSignedIn() && isValidId(staffId) && (
    isAdmin() ||
    (isSchool() &&
     request.resource.data.schoolUdise == getUserData().assignedSchoolUdise &&
     request.resource.data.staffId == staffId &&
     isFeatureAllowed('module.staff.action.add_staff', 'module.staff'))
  );

  allow update: if isSignedIn() && isValidId(staffId) && (
    isAdmin() ||
    (isSchool() &&
     resource.data.schoolUdise == getUserData().assignedSchoolUdise &&
     request.resource.data.schoolUdise == resource.data.schoolUdise &&
     request.resource.data.staffId == staffId &&
     isFeatureAllowed('module.staff.action.edit_staff', 'module.staff'))
  );

  allow delete: if isSignedIn() && isValidId(staffId) && (
    isAdmin() ||
    (isSchool() &&
     resource.data.schoolUdise == getUserData().assignedSchoolUdise &&
     isFeatureAllowed('module.staff.action.delete_staff', 'module.staff'))
  );
}
```

---

## 3. यूज़र इंटरफ़ेस (UI Screens) पर प्रभाव एवं आवश्यक बदलाव

### A. प्रभावित स्क्रीन्स:
1. **`StudentsView.tsx` (छात्र सूची व प्रोफाइल):**
   - *वर्तमान:* पूरी छात्र सूची लोड करते समय आधार, बैंक खाता, जन्मतिथि सभी फ़ील्ड्स एक ही ऑब्जेक्ट में आ जाते हैं।
   - *प्रस्तावित बदलाव:* सूची व्यू (Table/Card) केवल `studentMasters` से नाम, कक्षा, रोल नंबर, जेंडर प्रदर्शित करेगा। जब उपयोगकर्ता किसी छात्र के "विवरण देखें / संपादित करें" (Modal/Drawer) पर क्लिक करेगा, तब `fetchStudentPii(studentId)` द्वारा सीधे `studentPiiRecords/{studentId}` से डेटा सुरक्षित लोड होगा।
2. **`StaffView.tsx` (शिक्षक सूची व प्रोफाइल):**
   - *वर्तमान:* पैन नंबर, बैंक खाता, मोबाइल नंबर सूची में ही लोड हो जाते हैं।
   - *प्रस्तावित बदलाव:* टेबल में केवल पद, विषय और संस्था दिखाई देगी। व्यक्तिगत संपर्क एवं वित्तीय विवरण केवल अधिकृत स्कूल/सीएसी/एडमिन द्वारा 'विवरण' खोलने पर `staffPiiRecords/{staffId}` से फेच होंगे।
3. **`DataContext.tsx`:**
   - नए हुक्स और ऑपरेशंस:
     - `fetchStudentPii(studentId: string): Promise<StudentPiiRecord | null>`
     - `fetchStaffPii(staffId: string): Promise<StaffPiiRecord | null>`
     - `saveStudentWithPii(master: StudentMaster, pii: StudentPii): Promise<void>`
     - `saveStaffWithPii(master: StaffMaster, pii: StaffPii): Promise<void>`
4. **Offline / Cache:**
   - लोकल स्टोरेज में केवल चालू स्कूल (Active Assigned School) का PII कैश होगा, अन्य स्कूलों का नहीं।

---

## 4. डेटा माइग्रेशन योजना (Zero-Downtime Migration Plan)

1. **चरण 1: दोहरी लिखाई (Dual-Write Phase):**
   - नया डेटा सेव करते समय ऐप `studentMasters` और `studentPiiRecords` दोनों में राइट करेगा।
2. **चरण 2: बैकग्राउंड बैकफिल स्क्रिप्ट (`scripts/migrate-pii-isolation.ts`):**
   - केवल Firebase Admin SDK द्वारा चलेगा (Service Account Key से)।
   - डिफ़ॉल्ट `--dry-run` मोड: कितने रिकॉर्ड्स में आधार/बैंक/मोबाइल मौजूद है, उसकी गिनती और स्कीमा सत्यापन करेगा।
   - `--apply` मोड:
     - 500-दस्तावेज़ों के चंक्स में `writeBatch` चलाएगा।
     - `studentMasters` के PII फ़ील्ड्स को `studentPiiRecords` में कॉपी करेगा।
     - सत्यापन के बाद `studentMasters` से संवेदनशील फ़ील्ड्स को `FieldValue.delete()` से हटा देगा।
3. **चरण 3: समाधान एवं सामंजस्य (Reconciliation):**
   - `studentMasters.count()` === `studentPiiRecords.count()` की स्वचालित पुष्टि।
4. **चरण 4: रीड स्विचओवर (Read Cutover):**
   - UI कोड को केवल नए सेपरेटेड कलेक्शंस पढ़ने पर स्विच किया जाएगा।

---

## 5. रोलबैक योजना (Rollback & Contingency Plan)

1. **सुरक्षा स्नैपशॉट (Pre-Migration Backup):**
   - माइग्रेशन शुरू होने से ठीक पहले सभी `studentMasters` और `staffMasters` का स्थानीय एनक्रिप्टेड JSON बैकअप लिया जाएगा।
2. **कम्पैटिबिलिटी लेयर (Backward Compatibility Adapter):**
   - यदि किसी कारणवश PII फेच विफल होता है, तो `DataContext` में फ़ॉलबैक लॉजिक रहेगा जो मास्टर रिकॉर्ड के पुराने फ़ील्ड्स (यदि बचे हों) को री-रीड कर सके।
3. **रोलबैक ट्रिगर शर्तें:**
   - यदि 1% से अधिक छात्रों का PII रिकॉर्ड मिसमैच होता है।
   - यदि स्कूल उपयोगकर्ताओं को अपनी ही शाला के छात्रों का विवरण देखने में परमिशन एरर आए।
4. **रोलबैक स्क्रिप्ट (`scripts/rollback-pii-isolation.ts`):**
   - `studentPiiRecords` से डेटा को वापस `studentMasters` के दस्तावेज़ों में मर्ज कर देगा।
