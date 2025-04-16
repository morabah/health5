import { getDoctorDataSource, CRM_API_CONFIG } from '@/config/appConfig';
import { mockDoctorUser, mockDoctorProfileData1, mockDoctorProfileData2, mockDoctorProfileData3, mockDoctorProfileData4, mockDoctorProfileData5 } from '@/types/mockData';
// import { db } from '@/lib/firebase';
// import { collection, getDocs } from 'firebase/firestore';

/**
 * Loads doctors from the configured data source (mock, CRM API, or Firestore).
 * Throws if no valid source is configured.
 */
export async function loadDoctors() {
  const dataSource = getDoctorDataSource();
  if (dataSource === 'mock') {
    console.log('[loadDoctors] Using mock data source');
    
    // Combine all available doctor mocks into a list with placeholder images for testing
    return [
      {
        id: mockDoctorUser.id,
        userId: mockDoctorUser.id,
        name: `${mockDoctorUser.firstName} ${mockDoctorUser.lastName}`,
        firstName: mockDoctorUser.firstName,
        lastName: mockDoctorUser.lastName,
        specialty: mockDoctorProfileData1.specialty,
        experience: mockDoctorProfileData1.yearsOfExperience,
        location: mockDoctorProfileData1.location,
        languages: mockDoctorProfileData1.languages,
        fee: mockDoctorProfileData1.consultationFee,
        available: true,
        profilePicUrl: mockDoctorProfileData1.profilePictureUrl || 'https://ui-avatars.com/api/?name=Bob+Johnson&background=0D8ABC&color=fff',
      },
      {
        id: mockDoctorProfileData2.userId,
        userId: mockDoctorProfileData2.userId,
        name: "Dr. Jane Lee",
        firstName: "Jane",
        lastName: "Lee",
        specialty: mockDoctorProfileData2.specialty,
        experience: mockDoctorProfileData2.yearsOfExperience,
        location: mockDoctorProfileData2.location,
        languages: mockDoctorProfileData2.languages,
        fee: mockDoctorProfileData2.consultationFee,
        available: true,
        profilePicUrl: mockDoctorProfileData2.profilePictureUrl || 'https://ui-avatars.com/api/?name=Jane+Lee&background=0D8ABC&color=fff',
      },
      {
        id: mockDoctorProfileData3.userId,
        userId: mockDoctorProfileData3.userId,
        name: "Dr. Emily Carter",
        firstName: "Emily",
        lastName: "Carter",
        specialty: mockDoctorProfileData3.specialty,
        experience: mockDoctorProfileData3.yearsOfExperience,
        location: mockDoctorProfileData3.location,
        languages: mockDoctorProfileData3.languages,
        fee: mockDoctorProfileData3.consultationFee,
        available: true,
        profilePicUrl: mockDoctorProfileData3.profilePictureUrl || 'https://ui-avatars.com/api/?name=Emily+Carter&background=0D8ABC&color=fff',
      },
      {
        id: mockDoctorProfileData4.userId,
        userId: mockDoctorProfileData4.userId,
        name: "Dr. Michael Kim",
        firstName: "Michael",
        lastName: "Kim",
        specialty: mockDoctorProfileData4.specialty,
        experience: mockDoctorProfileData4.yearsOfExperience,
        location: mockDoctorProfileData4.location,
        languages: mockDoctorProfileData4.languages,
        fee: mockDoctorProfileData4.consultationFee,
        available: true,
        profilePicUrl: mockDoctorProfileData4.profilePictureUrl || 'https://ui-avatars.com/api/?name=Michael+Kim&background=0D8ABC&color=fff',
      },
      {
        id: mockDoctorProfileData5.userId,
        userId: mockDoctorProfileData5.userId,
        name: "Dr. Ana Souza",
        firstName: "Ana",
        lastName: "Souza",
        specialty: mockDoctorProfileData5.specialty,
        experience: mockDoctorProfileData5.yearsOfExperience,
        location: mockDoctorProfileData5.location,
        languages: mockDoctorProfileData5.languages,
        fee: mockDoctorProfileData5.consultationFee,
        available: true,
        profilePicUrl: mockDoctorProfileData5.profilePictureUrl || 'https://ui-avatars.com/api/?name=Ana+Souza&background=0D8ABC&color=fff',
      },
    ];
  }
  if (dataSource === 'crm' && CRM_API_CONFIG.endpoint && CRM_API_CONFIG.apiKey) {
    console.log('[loadDoctors] Using CRM API data source');
    try {
      const res = await fetch(`${CRM_API_CONFIG.endpoint}/doctors`, {
        headers: { 'Authorization': `Bearer ${CRM_API_CONFIG.apiKey}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch doctors from CRM: ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error('[loadDoctors] Error fetching from CRM API:', error);
      throw error;
    }
  }
  // Add Firestore logic here if needed
  throw new Error('No valid data source configured');
}
