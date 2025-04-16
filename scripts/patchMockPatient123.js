// patchMockPatient123.js
// Usage: node scripts/patchMockPatient123.js [offlineMockData.json]
// Ensures mockPatient123 exists in both users and patients arrays in the offline mock data file.

const fs = require('fs');
const path = process.argv[2] || './offlineMockData.json';

const USER_OBJ = {
  id: 'mockPatient123',
  userType: 'PATIENT',
  uid: 'mockPatient123',
  displayName: 'Jane Patient',
  firstName: 'Jane',
  lastName: 'Patient',
  role: 'patient',
  email: 'jane@example.com',
  isActive: true,
  phone: '',
  phoneNumber: '',
  emailVerified: true,
  phoneVerified: false,
  createdAt: { seconds: 1744834088, nanoseconds: 0 }
};

const PATIENT_OBJ = {
  id: 'mockPatient123',
  userId: 'mockPatient123',
  displayName: 'Jane Patient',
  firstName: 'Jane',
  lastName: 'Patient',
  gender: 'Female',
  dateOfBirth: { seconds: 631152000, nanoseconds: 0 },
  medicalHistory: 'None',
  bloodType: 'O+',
  emergencyContact: {
    name: 'John Patient',
    relation: 'Spouse',
    phone: '123-456-7890'
  },
  isActive: true
};

if (!fs.existsSync(path)) {
  console.error('File not found:', path);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
let changed = false;

// Patch users array
if (Array.isArray(data.users)) {
  const idx = data.users.findIndex(u => u.id === USER_OBJ.id);
  if (idx === -1) {
    data.users.push(USER_OBJ);
    changed = true;
    console.log('[patch] Added mockPatient123 to users');
  } else {
    data.users[idx] = { ...data.users[idx], ...USER_OBJ };
    changed = true;
    console.log('[patch] Updated mockPatient123 in users');
  }
}

// Patch patients array
if (Array.isArray(data.patients)) {
  const idx = data.patients.findIndex(p => p.id === PATIENT_OBJ.id);
  if (idx === -1) {
    data.patients.push(PATIENT_OBJ);
    changed = true;
    console.log('[patch] Added mockPatient123 to patients');
  } else {
    data.patients[idx] = { ...data.patients[idx], ...PATIENT_OBJ };
    changed = true;
    console.log('[patch] Updated mockPatient123 in patients');
  }
}

if (changed) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('Patched mockPatient123 successfully:', path);
} else {
  console.log('No changes needed. mockPatient123 already present.');
}
