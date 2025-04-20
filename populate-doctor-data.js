/**
 * Script to populate doctor data in localStorage
 * Run this in your browser console while on any page of the application
 */

// Storage keys used by the application
const STORAGE_KEYS = {
  USERS: 'health_app_data_users',
  USER_PROFILES: 'health_app_data_user_profiles',
  DOCTOR_PROFILES: 'health_app_data_doctor_profiles',
  APPOINTMENTS: 'health_app_data_appointments',
  VERIFICATION_DETAILS: 'health_app_data_verification_details'
};

// Doctor data to populate
const doctorData = {
  user: {
    id: 'd09c1994-d295-49f1-be2b-e940d99754d7',
    email: 'morabah@gmail.com',
    password: 'password123',
    userType: 'doctor',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  profile: {
    userId: 'd09c1994-d295-49f1-be2b-e940d99754d7',
    firstName: 'Mohamed',
    lastName: 'Rabah',
    email: 'morabah@gmail.com',
    phone: '555-123-4567',
    specialty: 'Cardiology',
    experience: '10+ years',
    languages: ['English', 'Arabic', 'French'],
    fee: 200,
    location: 'New York, NY',
    bio: 'Experienced cardiologist with focus on preventative care and heart health management.',
    licenseNumber: 'NY12345',
    profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
    verificationStatus: 'approved'
  },
  verification: {
    doctorId: 'd09c1994-d295-49f1-be2b-e940d99754d7',
    status: 'approved',
    notes: 'All documents verified and approved',
    documents: [
      {
        type: 'license',
        url: 'https://example.com/license.pdf',
        verified: true
      },
      {
        type: 'certification',
        url: 'https://example.com/certification.pdf',
        verified: true
      }
    ]
  }
};

// Function to get data from localStorage
function getStorageData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
}

// Function to save data to localStorage
function saveStorageData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`✅ Successfully saved ${key} to localStorage`);
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
}

// Add or update user data
function updateUser() {
  const users = getStorageData(STORAGE_KEYS.USERS) || [];
  const userIndex = users.findIndex(u => u.id === doctorData.user.id);
  
  if (userIndex === -1) {
    users.push(doctorData.user);
    console.log('✅ Added new user to users list');
  } else {
    users[userIndex] = {
      ...users[userIndex],
      ...doctorData.user
    };
    console.log('✅ Updated existing user in users list');
  }
  
  return saveStorageData(STORAGE_KEYS.USERS, users);
}

// Add or update doctor profile
function updateDoctorProfile() {
  const profiles = getStorageData(STORAGE_KEYS.DOCTOR_PROFILES) || [];
  const profileIndex = profiles.findIndex(p => p.userId === doctorData.profile.userId);
  
  if (profileIndex === -1) {
    profiles.push(doctorData.profile);
    console.log('✅ Added new doctor profile');
  } else {
    profiles[profileIndex] = {
      ...profiles[profileIndex],
      ...doctorData.profile
    };
    console.log('✅ Updated existing doctor profile');
  }
  
  return saveStorageData(STORAGE_KEYS.DOCTOR_PROFILES, profiles);
}

// Add or update verification details
function updateVerificationDetails() {
  const details = getStorageData(STORAGE_KEYS.VERIFICATION_DETAILS) || [];
  const detailIndex = details.findIndex(d => d.doctorId === doctorData.verification.doctorId);
  
  if (detailIndex === -1) {
    details.push(doctorData.verification);
    console.log('✅ Added new verification details');
  } else {
    details[detailIndex] = {
      ...details[detailIndex],
      ...doctorData.verification
    };
    console.log('✅ Updated existing verification details');
  }
  
  return saveStorageData(STORAGE_KEYS.VERIFICATION_DETAILS, details);
}

// Populate all data
function populateAllData() {
  console.log('=====================================================');
  console.log('🔧 POPULATING DOCTOR DATA');
  console.log('=====================================================');
  
  const userUpdated = updateUser();
  const profileUpdated = updateDoctorProfile();
  const verificationUpdated = updateVerificationDetails();
  
  console.log('=====================================================');
  console.log('📊 POPULATION SUMMARY');
  console.log('=====================================================');
  console.log('User data updated:', userUpdated);
  console.log('Doctor profile updated:', profileUpdated);
  console.log('Verification details updated:', verificationUpdated);
  
  if (userUpdated && profileUpdated && verificationUpdated) {
    console.log('✅ All data populated successfully. Please refresh the page to see the changes.');
  } else {
    console.log('⚠️ Some data could not be populated. See details above.');
  }
}

// Run the population process
populateAllData(); 