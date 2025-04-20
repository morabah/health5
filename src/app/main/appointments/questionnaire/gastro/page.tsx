"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ApiModeIndicator from '@/components/ui/ApiModeIndicator';

interface QuestionResponse {
  questionId: string;
  responseValue: string | string[];
}

export default function GastroQuestionnaireForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  
  const totalSteps = 8;

  useEffect(() => {
    // Check if responses are saved in localStorage
    const savedResponses = localStorage.getItem('gastroQuestionnaireResponses');
    if (savedResponses) {
      setResponses(JSON.parse(savedResponses));
    }
  }, []);

  const handleResponseChange = (questionId: string, value: string | string[]) => {
    setResponses((prev) => {
      const updatedResponses = [...prev];
      const existingResponseIndex = updatedResponses.findIndex(
        (response) => response.questionId === questionId
      );

      if (existingResponseIndex >= 0) {
        updatedResponses[existingResponseIndex] = { questionId, responseValue: value };
      } else {
        updatedResponses.push({ questionId, responseValue: value });
      }

      // Save to localStorage
      localStorage.setItem('gastroQuestionnaireResponses', JSON.stringify(updatedResponses));
      
      return updatedResponses;
    });
  };

  const getResponseValue = (questionId: string): string | string[] => {
    const response = responses.find((r) => r.questionId === questionId);
    return response ? response.responseValue : '';
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleCheckboxChange = (questionId: string, option: string) => {
    const currentResponses = getResponseValue(questionId) as string[];
    let newResponses: string[];

    if (Array.isArray(currentResponses)) {
      newResponses = currentResponses.includes(option)
        ? currentResponses.filter(item => item !== option)
        : [...currentResponses, option];
    } else {
      newResponses = [option];
    }

    handleResponseChange(questionId, newResponses);
  };

  const handleSubmit = async () => {
    // Validate that all questions are answered
    const requiredQuestionIds = [
      'digestiveSymptoms',
      'symptomDuration',
      'mealTriggers',
      'medicationHistory',
      'dietaryRestrictions',
      'familyHistory',
      'recentWeightChanges',
      'additionalInfo'
    ];

    const unansweredQuestions = requiredQuestionIds.filter(questionId => {
      const response = getResponseValue(questionId);
      return !response || (Array.isArray(response) && response.length === 0);
    });

    if (unansweredQuestions.length > 0) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulating API call with setTimeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save completed status to localStorage
      localStorage.setItem('gastroQuestionnaireCompleted', 'true');
      
      setIsSubmitted(true);
      setError(null);
    } catch (err) {
      setError('Error submitting questionnaire. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestion = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 className="text-lg font-medium mb-3">What digestive symptoms are you experiencing?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Select all that apply</p>
            <div className="space-y-2">
              {['Abdominal pain', 'Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Heartburn', 'Bloating', 'Blood in stool', 'Other'].map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`option-${option}`}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={
                      Array.isArray(getResponseValue('digestiveSymptoms')) &&
                      (getResponseValue('digestiveSymptoms') as string[]).includes(option)
                    }
                    onChange={() => handleCheckboxChange('digestiveSymptoms', option)}
                  />
                  <label htmlFor={`option-${option}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {getResponseValue('digestiveSymptoms')?.includes('Other') && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Please specify other symptoms"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={getResponseValue('otherDigestiveSymptoms') as string}
                  onChange={(e) => handleResponseChange('otherDigestiveSymptoms', e.target.value)}
                />
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-lg font-medium mb-3">How long have you been experiencing these symptoms?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please select the option that best applies</p>
            <div className="space-y-2">
              {['Less than a week', '1-4 weeks', '1-3 months', '3-6 months', '6-12 months', 'More than a year'].map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={`duration-${option}`}
                    name="symptomDuration"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={getResponseValue('symptomDuration') === option}
                    onChange={() => handleResponseChange('symptomDuration', option)}
                  />
                  <label htmlFor={`duration-${option}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3 className="text-lg font-medium mb-3">Do your symptoms appear to be triggered by specific meals or foods?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Select all that apply</p>
            <div className="space-y-2">
              {['Dairy products', 'Wheat/gluten', 'Spicy foods', 'Fatty foods', 'Caffeine', 'Alcohol', 'Specific fruits/vegetables', 'No clear triggers', 'Other'].map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`trigger-${option}`}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={
                      Array.isArray(getResponseValue('mealTriggers')) &&
                      (getResponseValue('mealTriggers') as string[]).includes(option)
                    }
                    onChange={() => handleCheckboxChange('mealTriggers', option)}
                  />
                  <label htmlFor={`trigger-${option}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {getResponseValue('mealTriggers')?.includes('Other') && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Please specify other triggers"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={getResponseValue('otherMealTriggers') as string}
                  onChange={(e) => handleResponseChange('otherMealTriggers', e.target.value)}
                />
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div>
            <h3 className="text-lg font-medium mb-3">Are you currently taking any medications for digestive issues?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please list all current medications and supplements</p>
            <textarea
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="List medications, dosage, and how long you've been taking them"
              value={getResponseValue('medicationHistory') as string}
              onChange={(e) => handleResponseChange('medicationHistory', e.target.value)}
            />
          </div>
        );
      case 5:
        return (
          <div>
            <h3 className="text-lg font-medium mb-3">Do you follow any specific dietary restrictions or eating patterns?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Select all that apply</p>
            <div className="space-y-2">
              {['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Low FODMAP', 'Keto', 'Paleo', 'Intermittent fasting', 'No specific diet', 'Other'].map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`diet-${option}`}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={
                      Array.isArray(getResponseValue('dietaryRestrictions')) &&
                      (getResponseValue('dietaryRestrictions') as string[]).includes(option)
                    }
                    onChange={() => handleCheckboxChange('dietaryRestrictions', option)}
                  />
                  <label htmlFor={`diet-${option}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {getResponseValue('dietaryRestrictions')?.includes('Other') && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Please specify other dietary restrictions"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={getResponseValue('otherDietaryRestrictions') as string}
                  onChange={(e) => handleResponseChange('otherDietaryRestrictions', e.target.value)}
                />
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div>
            <h3 className="text-lg font-medium mb-3">Is there a family history of gastrointestinal conditions?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Select all that apply</p>
            <div className="space-y-2">
              {['Irritable Bowel Syndrome (IBS)', 'Inflammatory Bowel Disease (IBD)', 'Crohn\'s Disease', 'Ulcerative Colitis', 'Celiac Disease', 'Colon Polyps', 'Colorectal Cancer', 'GERD/Acid Reflux', 'No known family history', 'Other'].map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`family-${option}`}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={
                      Array.isArray(getResponseValue('familyHistory')) &&
                      (getResponseValue('familyHistory') as string[]).includes(option)
                    }
                    onChange={() => handleCheckboxChange('familyHistory', option)}
                  />
                  <label htmlFor={`family-${option}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {getResponseValue('familyHistory')?.includes('Other') && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Please specify other family history"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={getResponseValue('otherFamilyHistory') as string}
                  onChange={(e) => handleResponseChange('otherFamilyHistory', e.target.value)}
                />
              </div>
            )}
          </div>
        );
      case 7:
        return (
          <div>
            <h3 className="text-lg font-medium mb-3">Have you experienced any recent weight changes?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please select the option that best applies</p>
            <div className="space-y-2">
              {['No significant change', 'Weight loss (unintentional)', 'Weight gain (unintentional)', 'Intentional weight loss', 'Intentional weight gain'].map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={`weight-${option}`}
                    name="recentWeightChanges"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={getResponseValue('recentWeightChanges') === option}
                    onChange={() => handleResponseChange('recentWeightChanges', option)}
                  />
                  <label htmlFor={`weight-${option}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {getResponseValue('recentWeightChanges') !== 'No significant change' && (
              <div className="mt-3">
                <label htmlFor="weightChangeAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Approximately how much weight change?
                </label>
                <input
                  type="text"
                  id="weightChangeAmount"
                  placeholder="e.g., 10 pounds over 2 months"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={getResponseValue('weightChangeAmount') as string}
                  onChange={(e) => handleResponseChange('weightChangeAmount', e.target.value)}
                />
              </div>
            )}
          </div>
        );
      case 8:
        return (
          <div>
            <h3 className="text-lg font-medium mb-3">Is there anything else you'd like Dr. Rodriguez to know before your appointment?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please provide any additional information that might be relevant</p>
            <textarea
              rows={5}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Include information about previous diagnoses, specific concerns, or questions you have for the doctor"
              value={getResponseValue('additionalInfo') as string}
              onChange={(e) => handleResponseChange('additionalInfo', e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <div className="text-center p-6">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Questionnaire Submitted</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Thank you for completing the gastroenterology questionnaire. Dr. Rodriguez will review your responses before your appointment.
              </p>
              <Link href="/main/appointments">
                <Button variant="primary" label="Return to Appointments" pageName="GastroQuestionnaire">
                  Return to Appointments
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/main/appointments" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Appointments
          </Link>
        </div>

        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gastroenterology Questionnaire</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  For your appointment with Dr. Michael Rodriguez
                </p>
              </div>
              <ApiModeIndicator />
            </div>

            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Please complete this questionnaire to help Dr. Rodriguez better understand your digestive health concerns. 
                Your responses will be reviewed before your appointment to make the most of your visit.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>Step {currentStep} of {totalSteps}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-8">
              {renderQuestion()}
            </div>

            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isLoading}
                label="Previous"
                pageName="GastroQuestionnaire"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={isLoading}
                  label="Next"
                  pageName="GastroQuestionnaire"
                >
                  Next
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  loading={isLoading}
                  label="Submit"
                  pageName="GastroQuestionnaire"
                >
                  {isLoading ? 'Submitting...' : 'Submit'}
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Your information is securely stored and will only be used for your medical care.</p>
        </div>
      </div>
    </div>
  );
} 