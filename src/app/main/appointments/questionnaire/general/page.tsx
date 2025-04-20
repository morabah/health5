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

const GeneralHealthQuestionnaireForm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Questionnaire responses
  const [responses, setResponses] = useState<QuestionResponse[]>([
    {
      id: 'chief_complaint',
      question: 'What is your main reason for visiting today?',
      answer: '',
      type: 'text'
    },
    {
      id: 'symptoms_duration',
      question: 'How long have you been experiencing these symptoms?',
      answer: '',
      type: 'radio',
      options: ['Less than a week', '1-2 weeks', '2-4 weeks', '1-3 months', '3-6 months', 'Over 6 months']
    },
    {
      id: 'medication_allergies',
      question: 'Do you have any medication allergies?',
      answer: '',
      type: 'radio',
      options: ['Yes', 'No', 'Not sure']
    },
    {
      id: 'allergies_details',
      question: 'If yes, please list your medication allergies',
      answer: '',
      type: 'text'
    },
    {
      id: 'current_medications',
      question: 'Are you currently taking any medications?',
      answer: '',
      type: 'radio',
      options: ['Yes', 'No']
    },
    {
      id: 'medications_list',
      question: 'If yes, please list your current medications and dosages',
      answer: '',
      type: 'text'
    },
    {
      id: 'past_medical_history',
      question: 'Please check any conditions you have been diagnosed with',
      answer: '',
      type: 'checkbox',
      options: [
        'High blood pressure', 
        'Diabetes', 
        'Heart disease', 
        'Cancer', 
        'Asthma/COPD', 
        'Thyroid disorder', 
        'Arthritis',
        'Depression/Anxiety',
        'None of the above'
      ]
    },
    {
      id: 'family_history',
      question: 'Do you have any family history of:',
      answer: '',
      type: 'checkbox',
      options: [
        'Heart disease', 
        'Diabetes', 
        'Cancer', 
        'High blood pressure', 
        'Stroke', 
        'Mental illness',
        'None of the above'
      ]
    },
    {
      id: 'lifestyle_smoking',
      question: 'Do you smoke or use tobacco products?',
      answer: '',
      type: 'radio',
      options: ['Yes, currently', 'Previously, but quit', 'Never']
    },
    {
      id: 'lifestyle_alcohol',
      question: 'How often do you consume alcoholic beverages?',
      answer: '',
      type: 'radio',
      options: ['Daily', 'Several times a week', 'Occasionally', 'Rarely', 'Never']
    },
    {
      id: 'lifestyle_exercise',
      question: 'How often do you exercise?',
      answer: '',
      type: 'radio',
      options: ['Daily', '3-5 times a week', '1-2 times a week', 'Rarely', 'Never']
    },
    {
      id: 'health_goals',
      question: 'What are your health goals or concerns you would like to address?',
      answer: '',
      type: 'text'
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
      // Skip validation for text fields that might be conditional
      !(['allergies_details', 'medications_list'].includes(r.id))
    );
    
    if (unansweredQuestions.length > 0) {
      toast.error("Please answer all required questions");
      return;
    }
    
    setIsSubmitting(true);
    
    // Save to localStorage for persistence
    try {
      // Get existing data or initialize empty array
      const existingData = localStorage.getItem('general_health_questionnaires') 
        ? JSON.parse(localStorage.getItem('general_health_questionnaires') || '[]') 
        : [];
      
      const formData = {
        id: `general_${Date.now()}`,
        doctorId: 'user_doctor_001',
        doctorName: 'Dr. David Nguyen',
        patientId: user?.id || 'unknown',
        date: new Date().toISOString(),
        responses
      };
      
      // Add to array and save back to localStorage
      existingData.push(formData);
      localStorage.setItem('general_health_questionnaires', JSON.stringify(existingData));
      
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
                Thank you for completing the general health questionnaire. Your responses have been saved and will be available to Dr. David Nguyen before your appointment.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleReturn}
                  label="Return to Appointments"
                  pageName="GeneralHealthQuestionnaire"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">General Health Questionnaire</h1>
          </div>
          <ApiModeIndicator />
        </div>
        
        <Card className="p-6 mb-6">
          <div className="flex items-start border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mr-4">
              <span className="text-blue-700 dark:text-blue-300 font-bold">DN</span>
            </div>
            <div>
              <h2 className="font-medium text-gray-900 dark:text-white">Dr. David Nguyen - Primary Care</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Please complete this questionnaire before your appointment. This information will help Dr. Nguyen provide better care tailored to your needs.
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
              pageName="GeneralHealthQuestionnaire"
            >
              Previous
            </Button>
            
            {step < totalSteps ? (
              <Button
                variant="primary"
                onClick={handleNext}
                label="Next"
                pageName="GeneralHealthQuestionnaire"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                label="Submit"
                pageName="GeneralHealthQuestionnaire"
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

export default GeneralHealthQuestionnaireForm; 