/** Placeholder page for Main Dynamic Route */
import React from 'react';
import { useRouter } from 'next/router';
const MainIdPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  return <div>Main Dynamic Route: {id}</div>;
};
export default MainIdPage;
