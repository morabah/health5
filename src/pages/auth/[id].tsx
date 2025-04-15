/** Placeholder page for Auth Dynamic Route */
import React from 'react';
import { useRouter } from 'next/router';
const AuthIdPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  return <div>Auth Dynamic Route: {id}</div>;
};
export default AuthIdPage;
