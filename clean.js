// File: clean.js const admin = require('firebase-admin'); const fs = require('fs');

const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), }); const db = admin.firestore();

async function cleanExpiredSubscriptions() { const now = new Date(); const snapshot = await db.collection('subscriptions').get();

for (const doc of snapshot.docs) { const data = doc.data(); const expireDate = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);

if (expireDate <= now && data.status === 'active') {
  await db.collection('subscriptions').doc(doc.id).update({
    status: 'expired'
  });

  const fileUrl = data.url;
  const fileName = fileUrl.split('/').pop();
  const path = `./files-to-delete/${fileName}`;
  fs.writeFileSync(path, ''); // Mark for deletion

  console.log(`Marked ${fileName} as expired.`);
}

} }

cleanExpiredSubscriptions();

