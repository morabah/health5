// fixOfflineMockData.js (robust fix, handles missing fields even at end of object)
// Usage: node scripts/fixOfflineMockData.js /path/to/offlineMockData.json
// This script auto-fixes data integrity errors for 'patients' and 'doctors' in offlineMockData.json

const fs = require('fs');
const path = process.argv[2] || './offlineMockData.json';

if (!fs.existsSync(path)) {
  console.error('File not found:', path);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
let changed = false;

// --- PATIENTS ---
if (Array.isArray(data.patients)) {
  data.patients = data.patients.map((p, idx) => {
    const id = p.id || p.userId || idx;
    
    // Fix gender - ensure it's one of the allowed enum values
    const allowedGenders = ['Male', 'Female', 'Other'];
    if (!p.gender || !allowedGenders.includes(p.gender)) {
      console.log(`[patients][${id}] Set gender to 'Other' (was: ${JSON.stringify(p.gender)})`);
      p.gender = 'Other';
      changed = true;
    }
    
    // Fix medicalHistory (robust: add if missing or not string)
    if (p.medicalHistory === undefined || typeof p.medicalHistory !== 'string') {
      console.log(`[patients][${id}] Set medicalHistory to default string (was: ${JSON.stringify(p.medicalHistory)})`);
      p.medicalHistory = 'No major illnesses';
      changed = true;
    }
    
    // Ensure other nullable fields exist to prevent undefined errors
    if (p.dateOfBirth === undefined) {
      console.log(`[patients][${id}] Set dateOfBirth to null (was: undefined)`);
      p.dateOfBirth = null;
      changed = true;
    }
    
    if (p.bloodType === undefined) {
      console.log(`[patients][${id}] Set bloodType to null (was: undefined)`);
      p.bloodType = null;
      changed = true;
    }
    
    return p;
  });
}

// --- DOCTORS ---
if (Array.isArray(data.doctors)) {
  data.doctors = data.doctors.map((d, idx) => {
    const id = d.id || d.userId || idx;
    
    // Fix profilePictureUrl - ensure it's a string
    if (!d.profilePictureUrl || typeof d.profilePictureUrl !== 'string') {
      console.log(`[doctors][${id}] Set profilePictureUrl (was: ${JSON.stringify(d.profilePictureUrl)})`);
      d.profilePictureUrl = `https://example.com/profile/${(d.firstName||'doctor').toLowerCase()}.jpg`;
      changed = true;
    }
    
    // Fix licenseDocumentUrl - ensure it's a string
    if (!d.licenseDocumentUrl || typeof d.licenseDocumentUrl !== 'string') {
      console.log(`[doctors][${id}] Set licenseDocumentUrl (was: ${JSON.stringify(d.licenseDocumentUrl)})`);
      d.licenseDocumentUrl = `https://example.com/docs/${(d.firstName||'doctor').toLowerCase()}_license.pdf`;
      changed = true;
    }
    
    // Fix certificateUrl - ensure it's a string
    if (!d.certificateUrl || typeof d.certificateUrl !== 'string') {
      console.log(`[doctors][${id}] Set certificateUrl (was: ${JSON.stringify(d.certificateUrl)})`);
      d.certificateUrl = `https://example.com/docs/${(d.firstName||'doctor').toLowerCase()}_certificate.pdf`;
      changed = true;
    }
    
    // Make sure required fields are present
    const requiredFields = [
      'userId', 'specialty', 'licenseNumber', 'yearsOfExperience', 
      'education', 'bio', 'verificationStatus', 'location',
      'consultationFee'
    ];
    
    requiredFields.forEach(field => {
      if (d[field] === undefined) {
        changed = true;
        switch (field) {
          case 'specialty':
            d.specialty = 'General Medicine';
            break;
          case 'licenseNumber':
            d.licenseNumber = `LIC-${Date.now().toString().slice(-6)}`;
            break;
          case 'yearsOfExperience':
            d.yearsOfExperience = 5;
            break;
          case 'education':
            d.education = 'Medical University';
            break;
          case 'bio':
            d.bio = 'Experienced healthcare professional';
            break;
          case 'verificationStatus':
            d.verificationStatus = 'PENDING';
            break;
          case 'location':
            d.location = 'Main Clinic';
            break;
          case 'consultationFee':
            d.consultationFee = 100;
            break;
        }
        console.log(`[doctors][${id}] Set missing ${field} to default value`);
      }
    });
    
    // Ensure languages is an array
    if (!Array.isArray(d.languages)) {
      console.log(`[doctors][${id}] Set languages to default array (was: ${JSON.stringify(d.languages)})`);
      d.languages = ['English'];
      changed = true;
    }
    
    return d;
  });
}

if (changed) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('Data integrity fixes applied and file saved:', path);
} else {
  console.log('No changes needed. Data already compliant.');
}
