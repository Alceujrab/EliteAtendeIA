import admin from 'firebase-admin';
import config from './firebase-applet-config.json' assert { type: 'json' };

admin.initializeApp({
  projectId: config.projectId,
});

const db = admin.firestore();
db.settings({ databaseId: config.firestoreDatabaseId });

async function test() {
  try {
    const doc = await db.collection('settings').doc('integrations').get();
    console.log('Success:', doc.exists);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
