'use client';
import { useState } from 'react';
import { mockApproveDoctor, mockFindDoctors } from '@/lib/mockApiService';
import { persistDoctorProfiles, persistAllData } from '@/lib/mockDataPersistence';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

export default function ApproveDoctor() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    if (!email.trim()) {
      setMessage({text: 'Please enter an email', type: 'error'});
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Run the approval function
      const result = mockApproveDoctor(email);
      
      if (result) {
        // Force data persistence
        persistDoctorProfiles();
        persistAllData();
        
        // Refresh the doctor list to verify our changes
        await mockFindDoctors({});
        
        setMessage({text: `Doctor with email ${email} has been approved!`, type: 'success'});
      } else {
        setMessage({text: `Failed to approve doctor with email ${email}`, type: 'error'});
      }
    } catch (error) {
      console.error('Error approving doctor:', error);
      setMessage({text: 'An error occurred while approving the doctor', type: 'error'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Admin Utility</h1>
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-medium mb-4">Approve Doctor</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enter the doctor's email to approve their account and make them visible on the find page.
        </p>
        
        <div className="space-y-4">
          <Input
            label="Doctor Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@example.com"
          />
          
          {message && (
            <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              label="Back"
              pageName="ApproveDoctor"
              onClick={() => router.push('/admin')}
            >
              Back to Admin
            </Button>
            <Button
              variant="primary"
              label="Approve Doctor"
              pageName="ApproveDoctor"
              onClick={handleApprove}
              isLoading={loading}
              disabled={loading || !email.trim()}
            >
              Approve Doctor
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 