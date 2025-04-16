import { getDoctorDataSource } from '@/config/appConfig';
import { VerificationStatus } from '@/types/enums';
// import { db } from '@/lib/firebaseClient';
// import { collection, getDocs } from 'firebase/firestore';

export interface DoctorFormSubmission {
  id: string;
  patientName: string;
  formType: string;
  submittedAt: string;
  status: VerificationStatus;
}

export async function loadDoctorForms(): Promise<DoctorFormSubmission[]> {
  const dataSource = getDoctorDataSource();
  if (dataSource === 'mock') {
    return [
      { id: 'form1', patientName: 'John Doe', formType: 'Consent', submittedAt: '2025-04-16', status: VerificationStatus.PENDING },
      { id: 'form2', patientName: 'Jane Smith', formType: 'History', submittedAt: '2025-04-15', status: VerificationStatus.VERIFIED }
    ];
  }
  // Uncomment and implement Firestore logic as needed
  // if (dataSource === 'firestore') {
  //   const snapshot = await getDocs(collection(db, 'mockDoctorForms'));
  //   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DoctorFormSubmission[];
  // }
  throw new Error('No valid data source configured for doctor forms.');
}
