import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

try {
  const app = initializeApp({
    projectId: 'celestial-byway-ft8c4',
  });
  console.log('Admin App initialized');
  const db = getFirestore(app, 'ai-studio-dc9d25e5-4549-4c58-a5ef-80cffe3f0e04');
  const snap = await db.collection('schools').limit(5).get();
  console.log('Admin query schools success, count:', snap.size);
  snap.docs.forEach(d => console.log('Doc:', d.id, d.data().name));
} catch (e: any) {
  console.log('Admin SDK query error:', e.message);
}
process.exit(0);
