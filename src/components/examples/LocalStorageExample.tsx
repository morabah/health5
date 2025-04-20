'use client';

import React, { useState, useEffect } from 'react';
import { 
  saveFormResponses, 
  getFormResponses, 
  clearFormResponses,
  saveUserPreferences,
  getUserPreferences
} from '@/utils/localStorage';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

// Define the types for our form responses
interface QuestionnaireResponses {
  name: string;
  symptoms: string;
  duration: string;
  lastUpdated: string;
}

// Define the types for user preferences
interface UserPreferences {
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  notificationsEnabled: boolean;
}

export default function LocalStorageExample() {
  // Initial state for the form
  const [formResponses, setFormResponses] = useState<QuestionnaireResponses>({
    name: '',
    symptoms: '',
    duration: '',
    lastUpdated: ''
  });

  // Initial state for user preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    darkMode: false,
    fontSize: 'medium',
    notificationsEnabled: true
  });

  // Form ID and user ID for this example
  const FORM_ID = 'medical-questionnaire';
  const USER_ID = 'current-user';

  // Load saved data on component mount
  useEffect(() => {
    // Load form responses
    const savedResponses = getFormResponses<QuestionnaireResponses>(FORM_ID);
    if (savedResponses) {
      setFormResponses(savedResponses);
    }

    // Load user preferences
    const savedPreferences = getUserPreferences<UserPreferences>(USER_ID);
    if (savedPreferences) {
      setPreferences(savedPreferences);
    }
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormResponses(prev => ({
      ...prev,
      [name]: value,
      lastUpdated: new Date().toISOString()
    }));
  };

  // Handle saving the form
  const handleSaveForm = () => {
    const success = saveFormResponses(FORM_ID, formResponses);
    if (success) {
      alert('Form responses saved successfully!');
    } else {
      alert('Failed to save form responses.');
    }
  };

  // Handle clearing the form
  const handleClearForm = () => {
    clearFormResponses(FORM_ID);
    setFormResponses({
      name: '',
      symptoms: '',
      duration: '',
      lastUpdated: ''
    });
    alert('Form responses cleared!');
  };

  // Handle preference changes
  const handlePreferenceChange = (
    key: keyof UserPreferences, 
    value: boolean | 'small' | 'medium' | 'large'
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      saveUserPreferences(USER_ID, updated);
      return updated;
    });
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">LocalStorage Example</h1>
      
      {/* Form Responses Section */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Medical Questionnaire</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Your Name</label>
            <Input
              type="text"
              name="name"
              value={formResponses.name}
              onChange={handleInputChange}
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block mb-1">Symptoms</label>
            <Input
              type="text"
              name="symptoms"
              value={formResponses.symptoms}
              onChange={handleInputChange}
              placeholder="Describe your symptoms"
            />
          </div>
          
          <div>
            <label className="block mb-1">Duration of Symptoms</label>
            <Input
              type="text"
              name="duration"
              value={formResponses.duration}
              onChange={handleInputChange}
              placeholder="How long have you had these symptoms?"
            />
          </div>
          
          {formResponses.lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {new Date(formResponses.lastUpdated).toLocaleString()}
            </p>
          )}
          
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={handleSaveForm}
              label="Save Responses"
              pageName="LocalStorageExample"
            >
              Save Responses
            </Button>
            <Button
              onClick={handleClearForm}
              variant="secondary"
              label="Clear Responses"
              pageName="LocalStorageExample"
            >
              Clear Responses
            </Button>
          </div>
        </div>
      </Card>
      
      {/* User Preferences Section */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">User Preferences</h2>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="darkMode"
              checked={preferences.darkMode}
              onChange={e => handlePreferenceChange('darkMode', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="darkMode">Dark Mode</label>
          </div>
          
          <div>
            <label className="block mb-1">Font Size</label>
            <select
              value={preferences.fontSize}
              onChange={e => handlePreferenceChange('fontSize', e.target.value as 'small' | 'medium' | 'large')}
              className="w-full p-2 border rounded"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="notifications"
              checked={preferences.notificationsEnabled}
              onChange={e => handlePreferenceChange('notificationsEnabled', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="notifications">Enable Notifications</label>
          </div>
          
          <p className="text-sm text-gray-500">
            Preferences are automatically saved when changed.
          </p>
        </div>
      </Card>

      {/* Technical Details */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-2">Technical Details</h2>
        <p className="text-sm">
          This component demonstrates two ways to use localStorage:
        </p>
        <ul className="list-disc pl-5 text-sm mt-2">
          <li>Form responses - saved only when you click the save button</li>
          <li>User preferences - saved automatically when changed</li>
        </ul>
        <p className="text-sm mt-2">
          Open your browser's developer tools and check the Application tab 
          to see the localStorage entries being created.
        </p>
      </Card>
    </div>
  );
} 