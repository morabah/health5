/** Placeholder page for Patient Dynamic Route */
import React from 'react';
import { useRouter } from 'next/router';
const PatientIdPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  return <div>Patient Dynamic Route: {id}</div>;
};
export default PatientIdPage;
