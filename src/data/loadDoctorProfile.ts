import { getDoctorDataSource } from '@/config/appConfig';
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

export async function loadDoctorProfile(): Promise<DoctorProfile> {
  const dataSource = getDoctorDataSource();
  if (dataSource === 'mock') {
    return {
      id: 'mockDoctorId',
      name: 'Dr. John Doe',
      email: 'johndoe@example.com',
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
