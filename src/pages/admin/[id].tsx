/** Placeholder page for Admin Dynamic Route */
import React from 'react';
import { useRouter } from 'next/router';
const AdminIdPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  return <div>Admin Dynamic Route: {id}</div>;
};
export default AdminIdPage;
