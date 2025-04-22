import { getDoctorDataSource, CRM_API_CONFIG } from '@/config/appConfig';
import { mockDoctorUser, mockDoctorProfilesArray } from '@/types/mockData';
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
    return mockDoctorProfilesArray.map((profile) => ({
      id: profile.userId,
      userId: profile.userId,
      name: `Dr. ${profile.specialty}`,
      specialty: profile.specialty,
      experience: profile.yearsOfExperience,
      location: profile.location,
      languages: profile.languages,
      fee: profile.consultationFee,
      available: true,
      profilePicUrl: profile.profilePictureUrl || `https://ui-avatars.com/api/?name=Doctor&background=0D8ABC&color=fff`,
    }));
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
