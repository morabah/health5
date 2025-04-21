import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function fixAllUserTypes() {
  const usersSnap = await db.collection("users").get();
  let updated = 0;
  let alreadyCorrect = 0;
  let invalid = 0;
  const updatePromises: Promise<any>[] = [];

  usersSnap.forEach((doc) => {
    const data = doc.data();
    if (typeof data.userType === "string") {
      const correctType = data.userType.toUpperCase();
      if (["PATIENT", "DOCTOR", "ADMIN"].includes(correctType)) {
        if (data.userType !== correctType) {
          updatePromises.push(
            doc.ref.update({ userType: correctType }).then(() => {
              console.log(`Updated userType for ${doc.id}: ${data.userType} → ${correctType}`);
              updated++;
            })
          );
        } else {
          console.log(`Already correct for ${doc.id}: ${data.userType}`);
          alreadyCorrect++;
        }
      } else {
        console.log(`Invalid userType for ${doc.id}: ${data.userType}`);
        invalid++;
      }
    } else {
      console.log(`Missing or non-string userType for ${doc.id}`);
      invalid++;
    }
  });

  await Promise.all(updatePromises);
  console.log(`\nChecked ${usersSnap.size} users.`);
  console.log(`Updated: ${updated}`);
  console.log(`Already correct: ${alreadyCorrect}`);
  console.log(`Invalid/missing userType: ${invalid}`);
}

fixAllUserTypes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
