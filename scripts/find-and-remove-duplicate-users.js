/**
 * Script: find-and-remove-duplicate-users.js
 * Description: Audits the Firestore 'users' collection for duplicate emails (case-insensitive, trimmed),
 *              prints a report, and can optionally delete duplicates (keeping the oldest or newest).
 *
 * Usage (read-only):
 *   node scripts/find-and-remove-duplicate-users.js
 * Usage (delete duplicates):
 *   node scripts/find-and-remove-duplicate-users.js --delete --keep oldest|newest
 */

const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = getFirestore();

// Parse CLI arguments
const args = process.argv.slice(2);
const shouldDelete = args.includes('--delete');
const keepOption = args.includes('--keep') ? args[args.indexOf('--keep') + 1] : 'oldest'; // 'oldest' or 'newest'

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

async function main() {
  console.log('Auditing Firestore users collection for duplicate emails...');
  const snapshot = await db.collection('users').get();
  const usersByEmail = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const email = normalizeEmail(data.email);
    if (!email) return;
    if (!usersByEmail[email]) usersByEmail[email] = [];
    usersByEmail[email].push({ id: doc.id, ...data });
  });

  let duplicatesFound = 0;
  Object.entries(usersByEmail).forEach(([email, users]) => {
    if (users.length > 1) {
      duplicatesFound++;
      console.log(`\nDuplicate email: ${email}`);
      users.forEach(user => {
        console.log(`  - ID: ${user.id} | Name: ${user.firstName} ${user.lastName} | Created: ${user.createdAt}`);
      });
    }
  });

  if (duplicatesFound === 0) {
    console.log('No duplicate emails found.');
    return;
  }

  if (!shouldDelete) {
    console.log('\nRun with --delete to remove duplicates. Use --keep oldest|newest to specify which to keep.');
    return;
  }

  // Delete duplicates, keeping one per email
  for (const [email, users] of Object.entries(usersByEmail)) {
    if (users.length <= 1) continue;
    // Sort by createdAt (oldest first)
    users.sort((a, b) => {
      const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
      return aTime - bTime;
    });
    let toKeep, toDelete;
    if (keepOption === 'newest') {
      toKeep = users[users.length - 1];
      toDelete = users.slice(0, users.length - 1);
    } else {
      toKeep = users[0];
      toDelete = users.slice(1);
    }
    console.log(`\nKeeping: ${toKeep.id} (${email})`);
    for (const user of toDelete) {
      console.log(`Deleting: ${user.id} (${email})`);
      await db.collection('users').doc(user.id).delete();
    }
  }
  console.log('Duplicate removal complete.');
}

main().catch(err => {
  console.error('Error running duplicate user audit:', err);
  process.exit(1);
});
