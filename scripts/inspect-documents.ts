import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspectDocuments() {
  try {
    const snap = await getDocs(collection(db, 'documents'));
    console.log('Total documents in Firestore:', snap.size);
    snap.docs.forEach((d) => {
      console.log('Doc ID:', d.id, JSON.stringify(d.data()));
    });
  } catch (e) {
    console.error('Error fetching documents:', e);
  }
}

inspectDocuments().then(() => process.exit(0));
