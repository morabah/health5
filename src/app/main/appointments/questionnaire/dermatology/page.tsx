"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ApiModeIndicator from '@/components/ui/ApiModeIndicator';
import { toast } from 'react-hot-toast';
import { ChevronLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface QuestionResponse {
  id: string;
  question: string;
  answer: string;
  type: 'radio' | 'checkbox' | 'text' | 'scale';
  options?: string[];
}

const DermatologyQuestionnaireForm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Questionnaire responses
  const [responses, setResponses] = useState<QuestionResponse[]>([
    {
      id: 'skin_reason',
      question: 'What is the primary reason for your visit?',
      answer: '',
      type: 'radio',
      options: ['Rash or skin irritation', 'Acne', 'Skin growth or mole', 'Hair loss', 'Nail problems', 'Annual skin exam', 'Other']
    },
    {
      id: 'skin_duration',
      question: 'How long have you had this skin condition?',
      answer: '',
      type: 'radio',
      options: ['Less than a week', '1-4 weeks', '1-3 months', '3-6 months', '6-12 months', 'Over a year']
    },
    {
      id: 'skin_location',
      question: 'Where on your body is the condition located?',
      answer: '',
      type: 'checkbox',
      options: ['Face', 'Scalp', 'Neck', 'Chest', 'Back', 'Arms', 'Hands', 'Legs', 'Feet', 'Genital area']
    },
    {
      id: 'skin_symptoms',
      question: 'What symptoms are you experiencing?',
      answer: '',
      type: 'checkbox',
      options: ['Itching', 'Pain', 'Burning', 'Bleeding', 'Scaling', 'Dryness', 'Color change', 'Swelling']
    },
    {
      id: 'skin_triggers',
      question: 'Have you noticed any triggers that worsen your condition?',
      answer: '',
      type: 'checkbox',
      options: ['Stress', 'Food', 'Heat/sweating', 'Cold weather', 'Sun exposure', 'Certain products', 'Not sure', 'Other']
    },
    {
      id: 'previous_treatment',
      question: 'Have you tried any treatments for this condition?',
      answer: '',
      type: 'text'
    },
    {
      id: 'skin_allergies',
      question: 'Do you have any known allergies to medications, materials, or skincare products?',
      answer: '',
      type: 'text'
    },
    {
      id: 'family_history',
      question: 'Is there any family history of skin conditions?',
      answer: '',
      type: 'checkbox',
      options: ['Eczema', 'Psoriasis', 'Skin cancer', 'Acne', 'Rosacea', 'Other', 'None']
    },
    {
      id: 'skincare_routine',
      question: 'Describe your current skincare routine and products',
      answer: '',
      type: 'text'
    },
    {
      id: 'condition_impact',
      question: 'On a scale of 1-10, how much does this condition impact your daily life?',
      answer: '',
      type: 'scale'
    }
  ]);
  
  // Questions for each step
  const questionsPerStep = 3;
  const totalSteps = Math.ceil(responses.length / questionsPerStep);
  
  const getCurrentQuestions = () => {
    const startIdx = (step - 1) * questionsPerStep;
    return responses.slice(startIdx, startIdx + questionsPerStep);
  };
  
  // Update response
  const handleResponseChange = (id: string, value: string) => {
    setResponses(prev => 
      prev.map(r => r.id === id ? { ...r, answer: value } : r)
    );
  };
  
  // Handle checkbox responses (multiple selection)
  const handleCheckboxChange = (id: string, option: string, checked: boolean) => {
    setResponses(prev => 
      prev.map(r => {
        if (r.id === id) {
          let currentOptions = r.answer ? r.answer.split(',') : [];
          
          if (checked) {
            // Add option if not already selected
            if (!currentOptions.includes(option)) {
              currentOptions.push(option);
            }
          } else {
            // Remove option
            currentOptions = currentOptions.filter(o => o !== option);
          }
          
          return { ...r, answer: currentOptions.join(',') };
        }
        return r;
      })
    );
  };
  
  // Handle form navigation
  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    const unansweredQuestions = responses.filter(r => !r.answer && 
      // Skip validation for text fields that might be optional
      !(['skin_allergies', 'previous_treatment'].includes(r.id))
    );
    
    if (unansweredQuestions.length > 0) {
      toast.error("Please answer all required questions");
      return;
    }
    
    setIsSubmitting(true);
    
    // Save to localStorage for persistence
    try {
      // Get existing data or initialize empty array
      const existingData = localStorage.getItem('dermatology_questionnaires') 
        ? JSON.parse(localStorage.getItem('dermatology_questionnaires') || '[]') 
        : [];
      
      const formData = {
        id: `derm_${Date.now()}`,
        doctorId: 'user_doctor_002',
        doctorName: 'Dr. Jane Lee',
        patientId: user?.uid || 'unknown',
        date: new Date().toISOString(),
        responses
      };
      
      // Add to array and save back to localStorage
      existingData.push(formData);
      localStorage.setItem('dermatology_questionnaires', JSON.stringify(existingData));
      
      // Show success state
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccess(true);
      }, 1500);
    } catch (err) {
      console.error('Error saving questionnaire:', err);
      toast.error('Failed to save questionnaire');
      setIsSubmitting(false);
    }
  };
  
  // Return to appointments page
  const handleReturn = () => {
    router.push('/main/appointments');
  };
  
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Questionnaire Submitted</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Thank you for completing the dermatology pre-appointment questionnaire. Your responses have been saved and will be available to Dr. Jane Lee before your appointment.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleReturn}
                  label="Return to Appointments"
                  pageName="DermatologyQuestionnaire"
                >
                  Return to Appointments
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleReturn}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dermatology Pre-Visit Questionnaire</h1>
          </div>
          <ApiModeIndicator />
        </div>
        
        <Card className="p-6 mb-6">
          <div className="flex items-start border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mr-4">
              <span className="text-blue-700 dark:text-blue-300 font-bold">JL</span>
            </div>
            <div>
              <h2 className="font-medium text-gray-900 dark:text-white">Dr. Jane Lee - Dermatology</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Please complete this questionnaire before your appointment. Your answers will help Dr. Lee prepare for your visit and provide better care for your skin concerns.
              </p>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Step {step} of {totalSteps}
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full h-2 w-40">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-6">
            {getCurrentQuestions().map((question) => (
              <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <label className="block text-gray-800 dark:text-gray-200 font-medium mb-3">
                  {question.question}
                </label>
                
                {question.type === 'radio' && (
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name={question.id}
                          checked={question.answer === option}
                          onChange={() => handleResponseChange(question.id, option)}
                          className="w-4 h-4 text-blue-600 dark:text-blue-400"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {question.type === 'checkbox' && (
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          name={question.id}
                          checked={question.answer.split(',').includes(option)}
                          onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                          className="w-4 h-4 text-blue-600 dark:text-blue-400"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {question.type === 'text' && (
                  <textarea
                    value={question.answer}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    className="w-full px-3 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                    rows={3}
                    placeholder="Type your answer here..."
                  />
                )}
                
                {question.type === 'scale' && (
                  <div className="mt-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">No impact (1)</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Severe impact (10)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleResponseChange(question.id, value.toString())}
                          className={`w-9 h-9 rounded-md text-sm font-medium ${
                            question.answer === value.toString()
                              ? 'bg-blue-500 text-white dark:bg-blue-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-between items-center">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={step === 1}
              label="Previous"
              pageName="DermatologyQuestionnaire"
            >
              Previous
            </Button>
            
            {step < totalSteps ? (
              <Button
                variant="primary"
                onClick={handleNext}
                label="Next"
                pageName="DermatologyQuestionnaire"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                label="Submit"
                pageName="DermatologyQuestionnaire"
              >
                Submit
              </Button>
            )}
          </div>
        </Card>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          This information is protected by our privacy policy and will only be shared with your healthcare provider.
        </div>
      </div>
    </div>
  );
};

export default DermatologyQuestionnaireForm; 