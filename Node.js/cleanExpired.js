const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp({
  credential: admin.credential.applicationDefault(), // یا استفاده از service account
});

const db = getFirestore();

(async () => {
  const now = new Date();

  const snapshot = await db.collection("subscriptions")
    .where("active", "==", true)
    .get();

  snapshot.forEach(async (doc) => {
    const data = doc.data();
    const expireDate = new Date(data.expireAt);

    if (expireDate <= now) {
      await db.collection("subscriptions").doc(doc.id).update({ active: false });
      console.log(`Deactivated: ${data.url}`);
    }
  });
})();