// scripts/cleanExpiredSubscriptions.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Parse the service account JSON from the environment variable (set via GitHub Secrets)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function cleanExpiredSubscriptions() {
  const now = new Date();
  // Query for subscriptions whose 'expiresAt' is less than or equal to now and that are still active.
  const snapshot = await db.collection('subscriptions')
                           .where('expiresAt', '<=', now)
                           .where('active', '==', true)
                           .get();

  if (snapshot.empty) {
    console.log("No expired subscriptions found.");
    return;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    // Option 1: Mark the subscription as inactive
    batch.update(doc.ref, { active: false });
    
    // Option 2 (alternative): Delete the subscription document entirely
    // batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`${snapshot.size} expired subscriptions have been deactivated.`);
}

cleanExpiredSubscriptions().catch(error => {
  console.error("Error during cleaning process:", error);
});