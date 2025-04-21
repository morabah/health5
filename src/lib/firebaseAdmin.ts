/**
 * Firebase Admin SDK Initialization
 * Initializes the Admin SDK using serviceAccountKey.json
 */
import admin from 'firebase-admin';
const serviceAccount = require('/Volumes/Rabah_SSD/enrpreneurship/Health 5/health-appointment-system/service-account-key.json');

// Prevent reinitialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

export default admin;
