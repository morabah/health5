import { getDoctorDataSource } from '@/config/appConfig';
import { mockDoctorUser } from '@/types/mockData';
// import { db } from '@/lib/firebaseClient';
// import { doc, getDoc } from 'firebase/firestore';

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  location: string;
  bio: string;
}

/**
 * Loads the doctor profile based on the current authenticated user
 * @param userId Optional user ID to load a specific doctor profile
 * @returns The doctor profile data
 */
export async function loadDoctorProfile(userId?: string): Promise<DoctorProfile> {
  // If we're running on the client and localStorage is available, try to get stored profile
  if (typeof window !== 'undefined') {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedProfile = localStorage.getItem('auth_profile');
      
      if (storedUser && storedProfile) {
        const parsedUser = JSON.parse(storedUser);
        const parsedProfile = JSON.parse(storedProfile);
        
        // Check if user is a doctor
        if (parsedUser.userType === 'doctor') {
          return {
            id: parsedUser.uid || 'mockDoctorId',
            name: `Dr. ${parsedProfile.firstName} ${parsedProfile.lastName}`,
            email: parsedProfile.email || mockDoctorUser.email || '',
            phone: parsedProfile.phone || '123-456-7890',
            specialty: parsedProfile.specialty || 'General Medicine',
            location: parsedProfile.location || 'New York',
            bio: parsedProfile.bio || 'Experienced doctor with a passion for patient care.'
          };
        }
      }
    } catch (error) {
      console.error('Error loading stored doctor profile', error);
    }
  }
  
  const dataSource = getDoctorDataSource();
  if (dataSource === 'mock') {
    return {
      id: 'mockDoctorId',
      name: 'Dr. John Doe',
      email: mockDoctorUser.email || 'johndoe@example.com',
      phone: '123-456-7890',
      specialty: 'Cardiology',
      location: 'New York',
      bio: 'Experienced cardiologist with a passion for patient care.'
    };
  }
  // Uncomment and implement Firestore logic as needed
  // if (dataSource === 'firestore') {
  //   const ref = doc(db, 'mockDoctorProfiles', 'mockDoctorId');
  //   const snap = await getDoc(ref);
  //   if (snap.exists()) {
  //     return { id: snap.id, ...snap.data() } as DoctorProfile;
  //   }
  //   throw new Error('Profile not found');
  // }
  throw new Error('No valid data source configured for doctor profile.');
}
