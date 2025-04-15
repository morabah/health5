/** Placeholder page for Doctor Dynamic Route */
import React from 'react';
import { useRouter } from 'next/router';
const DoctorIdPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  return <div>Doctor Dynamic Route: {id}</div>;
};
export default DoctorIdPage;
