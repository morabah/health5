import { useState, useEffect } from 'react';
import { loadDoctorAvailability, DoctorAvailabilitySlot } from '@/data/loadDoctorAvailability';
import { formatDate, formatTimeString } from '@/utils/helpers';

/**
 * Hook to fetch the next available appointment slot for a given doctor from Firestore.
 * @param doctorId - The doctor userId
 */
export function useNextAvailable(doctorId: string) {
  const [nextAvailable, setNextAvailable] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchNext() {
      setLoading(true);
      try {
        const slots: DoctorAvailabilitySlot[] = await loadDoctorAvailability(doctorId);
        const upcoming = slots
          .filter(slot => slot.available)
          .map(slot => ({
            ...slot,
            dateTime: new Date(`${slot.date}T${slot.time}`)
          }))
          .filter(slot => slot.dateTime > new Date())
          .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
        if (upcoming.length > 0 && isMounted) {
          const first = upcoming[0];
          setNextAvailable(
            `${formatDate(first.dateTime, 'medium')} ${formatTimeString(first.time)}`
          );
        } else if (isMounted) {
          setNextAvailable(null);
        }
      } catch (e) {
        if (isMounted) setError(e as Error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchNext();
    return () => {
      isMounted = false;
    };
  }, [doctorId]);

  return { nextAvailable, loading, error };
}
