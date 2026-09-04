import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import localConfig from './firebase-applet-config.json';

const app = initializeApp(localConfig);
const db = getFirestore(app, localConfig.firestoreDatabaseId || '(default)');

async function checkCollections() {
  const collections = ['clients', 'editors', 'projects', 'payments', 'expenses', 'notifications', 'activities', 'settings'];
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`Collection "${col}": ${snap.size} documents`);
      snap.forEach((doc) => {
        console.log(`  [${col}/${doc.id}] =>`, JSON.stringify(doc.data()).slice(0, 150));
      });
    } catch (err: any) {
      console.error(`Collection "${col}" ERROR:`, err.message);
    }
  }
  process.exit(0);
}

checkCollections();
