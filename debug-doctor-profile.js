/**
 * Debug script for doctor profile in localStorage
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

// Target email and ID
const TARGET_EMAIL = 'morabah@gmail.com';
const TARGET_ID = 'd09c1994-d295-49f1-be2b-e940d99754d7';

// Verification statuses
const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
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

// Check if the user exists
function checkUser() {
  console.log(`🔍 Checking for user with email: ${TARGET_EMAIL}, ID: ${TARGET_ID}`);
  
  const users = getStorageData(STORAGE_KEYS.USERS) || [];
  const user = users.find(u => u.id === TARGET_ID || u.email === TARGET_EMAIL);
  
  if (!user) {
    console.log('❌ User not found in localStorage');
    return false;
  }
  
  console.log('✅ User found:', user);
  return true;
}

// Check if the doctor profile exists
function checkDoctorProfile() {
  console.log(`🔍 Checking for doctor profile with userId: ${TARGET_ID}`);
  
  const profiles = getStorageData(STORAGE_KEYS.DOCTOR_PROFILES) || [];
  const profile = profiles.find(p => p.userId === TARGET_ID);
  
  if (!profile) {
    console.log('❌ Doctor profile not found in localStorage');
    return false;
  }
  
  console.log('✅ Doctor profile found:', profile);
  
  // Check if the profile has all required fields
  const requiredFields = ['firstName', 'lastName', 'specialty', 'licenseNumber', 'verificationStatus'];
  const missingFields = requiredFields.filter(field => !profile[field]);
  
  if (missingFields.length > 0) {
    console.log(`⚠️ Doctor profile is missing required fields: ${missingFields.join(', ')}`);
    return { found: true, complete: false, profile };
  }
  
  // Check verification status
  if (profile.verificationStatus !== VERIFICATION_STATUS.APPROVED) {
    console.log(`⚠️ Doctor profile verification status is not approved: ${profile.verificationStatus}`);
    return { found: true, complete: false, profile };
  }
  
  console.log('✅ Doctor profile is complete and approved');
  return { found: true, complete: true, profile };
}

// Check if the verification details exist
function checkVerificationDetails() {
  console.log(`🔍 Checking for verification details with doctorId: ${TARGET_ID}`);
  
  const details = getStorageData(STORAGE_KEYS.VERIFICATION_DETAILS) || [];
  const verification = details.find(d => d.doctorId === TARGET_ID);
  
  if (!verification) {
    console.log('❌ Verification details not found in localStorage');
    return false;
  }
  
  console.log('✅ Verification details found:', verification);
  
  // Check if verification is approved
  if (verification.status !== VERIFICATION_STATUS.APPROVED) {
    console.log(`⚠️ Verification status is not approved: ${verification.status}`);
    return { found: true, complete: false, verification };
  }
  
  // Check if documents exist and are verified
  if (!verification.documents || verification.documents.length === 0) {
    console.log('⚠️ No verification documents found');
    return { found: true, complete: false, verification };
  }
  
  const unverifiedDocs = verification.documents.filter(doc => !doc.verified);
  if (unverifiedDocs.length > 0) {
    console.log(`⚠️ Some documents are not verified: ${unverifiedDocs.length} documents`);
    return { found: true, complete: false, verification };
  }
  
  console.log('✅ Verification details are complete and approved');
  return { found: true, complete: true, verification };
}

// Fix doctor profile if needed
function fixDoctorProfile() {
  console.log('🔧 Attempting to fix doctor profile...');
  
  const profileCheck = checkDoctorProfile();
  
  if (!profileCheck || !profileCheck.found) {
    // Create a new profile
    const newProfile = {
      userId: TARGET_ID,
      firstName: 'Mohamed',
      lastName: 'Rabah',
      email: TARGET_EMAIL,
      phone: '555-123-4567',
      specialty: 'Cardiology',
      experience: '10+ years',
      languages: ['English', 'Arabic', 'French'],
      fee: 200,
      location: 'New York, NY',
      bio: 'Experienced cardiologist with focus on preventative care and heart health management.',
      licenseNumber: 'NY12345',
      profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
      verificationStatus: VERIFICATION_STATUS.APPROVED
    };
    
    const profiles = getStorageData(STORAGE_KEYS.DOCTOR_PROFILES) || [];
    profiles.push(newProfile);
    
    if (saveStorageData(STORAGE_KEYS.DOCTOR_PROFILES, profiles)) {
      console.log('✅ Created new doctor profile:', newProfile);
      return true;
    } else {
      console.log('❌ Failed to create new doctor profile');
      return false;
    }
  } else if (!profileCheck.complete) {
    // Update existing profile
    const profiles = getStorageData(STORAGE_KEYS.DOCTOR_PROFILES) || [];
    const profileIndex = profiles.findIndex(p => p.userId === TARGET_ID);
    
    const updatedProfile = {
      ...profileCheck.profile,
      firstName: profileCheck.profile.firstName || 'Mohamed',
      lastName: profileCheck.profile.lastName || 'Rabah',
      specialty: profileCheck.profile.specialty || 'Cardiology',
      licenseNumber: profileCheck.profile.licenseNumber || 'NY12345',
      verificationStatus: VERIFICATION_STATUS.APPROVED
    };
    
    profiles[profileIndex] = updatedProfile;
    
    if (saveStorageData(STORAGE_KEYS.DOCTOR_PROFILES, profiles)) {
      console.log('✅ Updated doctor profile:', updatedProfile);
      return true;
    } else {
      console.log('❌ Failed to update doctor profile');
      return false;
    }
  } else {
    console.log('✅ Doctor profile is already complete and valid');
    return true;
  }
}

// Fix verification details if needed
function fixVerificationDetails() {
  console.log('🔧 Attempting to fix verification details...');
  
  const verificationCheck = checkVerificationDetails();
  
  if (!verificationCheck || !verificationCheck.found) {
    // Create new verification details
    const newVerification = {
      doctorId: TARGET_ID,
      status: VERIFICATION_STATUS.APPROVED,
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
    };
    
    const details = getStorageData(STORAGE_KEYS.VERIFICATION_DETAILS) || [];
    details.push(newVerification);
    
    if (saveStorageData(STORAGE_KEYS.VERIFICATION_DETAILS, details)) {
      console.log('✅ Created new verification details:', newVerification);
      return true;
    } else {
      console.log('❌ Failed to create new verification details');
      return false;
    }
  } else if (!verificationCheck.complete) {
    // Update existing verification details
    const details = getStorageData(STORAGE_KEYS.VERIFICATION_DETAILS) || [];
    const detailIndex = details.findIndex(d => d.doctorId === TARGET_ID);
    
    const updatedVerification = {
      ...verificationCheck.verification,
      status: VERIFICATION_STATUS.APPROVED,
      notes: verificationCheck.verification.notes || 'All documents verified and approved',
      documents: verificationCheck.verification.documents || [
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
    };
    
    // Ensure all documents are verified
    if (updatedVerification.documents) {
      updatedVerification.documents = updatedVerification.documents.map(doc => ({
        ...doc,
        verified: true
      }));
    }
    
    details[detailIndex] = updatedVerification;
    
    if (saveStorageData(STORAGE_KEYS.VERIFICATION_DETAILS, details)) {
      console.log('✅ Updated verification details:', updatedVerification);
      return true;
    } else {
      console.log('❌ Failed to update verification details');
      return false;
    }
  } else {
    console.log('✅ Verification details are already complete and valid');
    return true;
  }
}

// Run diagnostics
function runDiagnostics() {
  console.log('=====================================================');
  console.log('🔍 RUNNING DIAGNOSTICS');
  console.log('=====================================================');
  
  const userExists = checkUser();
  const profileCheck = checkDoctorProfile();
  const verificationCheck = checkVerificationDetails();
  
  console.log('=====================================================');
  console.log('📊 DIAGNOSTICS SUMMARY');
  console.log('=====================================================');
  console.log('User exists:', userExists);
  console.log('Doctor profile found:', profileCheck ? profileCheck.found : false);
  console.log('Doctor profile complete:', profileCheck ? profileCheck.complete : false);
  console.log('Verification details found:', verificationCheck ? verificationCheck.found : false);
  console.log('Verification details complete:', verificationCheck ? verificationCheck.complete : false);
  
  const allGood = userExists && 
    profileCheck && profileCheck.found && profileCheck.complete && 
    verificationCheck && verificationCheck.found && verificationCheck.complete;
  
  if (allGood) {
    console.log('✅ All checks passed! Doctor profile is properly set up.');
  } else {
    console.log('⚠️ Some issues were found. Run fixAllIssues() to attempt to fix them.');
  }
  
  return allGood;
}

// Fix all issues
function fixAllIssues() {
  console.log('=====================================================');
  console.log('🔧 FIXING ALL ISSUES');
  console.log('=====================================================');
  
  // First, check if the user exists, and create if not
  if (!checkUser()) {
    const users = getStorageData(STORAGE_KEYS.USERS) || [];
    const newUser = {
      id: TARGET_ID,
      email: TARGET_EMAIL,
      password: 'password123',
      userType: 'doctor',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    if (saveStorageData(STORAGE_KEYS.USERS, users)) {
      console.log('✅ Created new user:', newUser);
    } else {
      console.log('❌ Failed to create new user');
      return false;
    }
  }
  
  // Fix doctor profile
  const profileFixed = fixDoctorProfile();
  
  // Fix verification details
  const verificationFixed = fixVerificationDetails();
  
  console.log('=====================================================');
  console.log('📊 FIX SUMMARY');
  console.log('=====================================================');
  console.log('Doctor profile fixed:', profileFixed);
  console.log('Verification details fixed:', verificationFixed);
  
  if (profileFixed && verificationFixed) {
    console.log('✅ All issues fixed successfully! Please refresh the page to see the changes.');
    return true;
  } else {
    console.log('⚠️ Some issues could not be fixed. See details above.');
    return false;
  }
}

// Run diagnostics when the script loads
runDiagnostics(); 