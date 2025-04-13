const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteExpired() {
  const snapshot = await db.collection('subscription').get();
  const now = new Date();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const expiry = new Date(data.expiryDate); // فرض بر این است که فیلد expiryDate در دیتابیس هست

    if (expiry < now) {
      console.log(`Deleting expired subscription: ${doc.id}`);
      await doc.ref.delete();
    }
  }
}

deleteExpired()
  .then(() => console.log('Done!'))
  .catch(console.error);