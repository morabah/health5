'use client';

import React from 'react';
import LocalStorageExample from '@/components/examples/LocalStorageExample';
import LocalStorageHookExample from '@/components/examples/LocalStorageHookExample';

export default function LocalStorageExamplesPage() {
  const [activeTab, setActiveTab] = React.useState<'basic' | 'hook'>('basic');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          LocalStorage Examples
        </h1>
        
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('basic')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'basic'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Basic Example
              </button>
              <button
                onClick={() => setActiveTab('hook')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'hook'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Hook Example
              </button>
            </nav>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          {activeTab === 'basic' ? (
            <LocalStorageExample />
          ) : (
            <LocalStorageHookExample />
          )}
        </div>
        
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 shadow rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Using localStorage in Your Application</h2>
          
          <div className="prose dark:prose-invert max-w-none">
            <p>
              This page demonstrates two approaches to using localStorage in your health appointment system:
            </p>
            
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>Basic Approach</strong>: Using utility functions to directly interact with localStorage.
                This approach is good for simpler cases where you need occasional localStorage access.
              </li>
              <li>
                <strong>Hook Approach</strong>: Using a custom React hook that automatically synchronizes
                state with localStorage. This approach is more elegant for React components that need
                to maintain state across page refreshes.
              </li>
            </ol>
            
            <h3 className="text-lg font-semibold mt-4">Practical Uses in Health Application</h3>
            
            <ul className="list-disc pl-6 space-y-1">
              <li>Storing user preferences (language, theme, accessibility settings)</li>
              <li>Saving form progress for multi-step forms (appointment booking, medical questionnaires)</li>
              <li>Caching frequently accessed data to reduce API calls</li>
              <li>Maintaining UI state between sessions (collapsed sections, selected tabs)</li>
              <li>Storing draft content (messages to doctors, symptom logs)</li>
            </ul>
            
            <h3 className="text-lg font-semibold mt-4">Important Considerations</h3>
            
            <ul className="list-disc pl-6 space-y-1">
              <li>Never store sensitive medical information in localStorage</li>
              <li>Remember localStorage has a size limit (usually 5-10MB)</li>
              <li>Always provide fallbacks if localStorage is unavailable or full</li>
              <li>Use proper error handling around localStorage operations</li>
              <li>Consider clearing stale data to prevent bloat</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 