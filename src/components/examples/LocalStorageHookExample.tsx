'use client';

import React from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function LocalStorageHookExample() {
  // Simple counter example
  const [count, setCount, resetCount] = useLocalStorageState<number>('example_counter', 0);
  
  // Theme preference example
  const [theme, setTheme, resetTheme] = useLocalStorageState<'light' | 'dark'>('example_theme', 'light');
  
  // Notes example with more complex data
  const [notes, setNotes, resetNotes] = useLocalStorageState<string[]>('example_notes', []);
  const [newNote, setNewNote] = React.useState('');
  
  // Handle adding a new note
  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote.trim()]);
      setNewNote('');
    }
  };
  
  // Handle removing a note
  const handleRemoveNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };
  
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">useLocalStorageState Hook Example</h1>
      
      {/* Counter Example */}
      <Card className={`p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <h2 className="text-xl font-semibold mb-4">Counter Example</h2>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setCount(count - 1)}
            label="Decrement"
            pageName="LocalStorageHookExample"
          >
            -
          </Button>
          <span className="text-2xl">{count}</span>
          <Button 
            onClick={() => setCount(count + 1)}
            label="Increment"
            pageName="LocalStorageHookExample"
          >
            +
          </Button>
          <Button 
            onClick={resetCount}
            variant="secondary"
            label="Reset"
            pageName="LocalStorageHookExample"
          >
            Reset
          </Button>
        </div>
        <p className="text-sm mt-2">
          This counter will remember its value even if you refresh the page.
        </p>
      </Card>
      
      {/* Theme Example */}
      <Card className={`p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <h2 className="text-xl font-semibold mb-4">Theme Preference</h2>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setTheme('light')}
            variant={theme === 'light' ? 'primary' : 'secondary'}
            label="Light Theme"
            pageName="LocalStorageHookExample"
          >
            Light
          </Button>
          <Button 
            onClick={() => setTheme('dark')}
            variant={theme === 'dark' ? 'primary' : 'secondary'}
            label="Dark Theme"
            pageName="LocalStorageHookExample"
          >
            Dark
          </Button>
          <Button 
            onClick={resetTheme}
            variant="secondary"
            label="Reset Theme"
            pageName="LocalStorageHookExample"
          >
            Reset
          </Button>
        </div>
        <p className="text-sm mt-2">
          Your theme preference will be remembered between page reloads.
        </p>
      </Card>
      
      {/* Notes Example */}
      <Card className={`p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <h2 className="text-xl font-semibold mb-4">Notes List</h2>
        
        <div className="flex mb-4">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a new note"
            className={`flex-grow p-2 rounded-l border ${
              theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
            }`}
            onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
          />
          <Button 
            onClick={handleAddNote}
            label="Add Note"
            pageName="LocalStorageHookExample"
            className="rounded-l-none"
          >
            Add
          </Button>
        </div>
        
        {notes.length === 0 ? (
          <p className="text-gray-500">No notes yet. Add one above!</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note, index) => (
              <li 
                key={index} 
                className={`flex justify-between items-center p-2 rounded ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <span>{note}</span>
                <button 
                  onClick={() => handleRemoveNote(index)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Remove note"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        
        {notes.length > 0 && (
          <Button 
            onClick={resetNotes}
            variant="secondary"
            className="mt-4"
            label="Clear All Notes"
            pageName="LocalStorageHookExample"
          >
            Clear All Notes
          </Button>
        )}
        
        <p className="text-sm mt-4">
          Your notes will be saved in localStorage and persist between page reloads.
        </p>
      </Card>
      
      <Card className={`p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <h2 className="text-xl font-semibold mb-2">How It Works</h2>
        <p className="text-sm">
          This example uses the <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">useLocalStorageState</code> hook 
          to automatically sync React state with localStorage.
        </p>
        <p className="text-sm mt-2">
          The hook returns a tuple containing:
        </p>
        <ul className="list-disc pl-5 text-sm mt-1">
          <li>The current state value</li>
          <li>A setter function (works like regular useState)</li>
          <li>A reset function to restore the initial value</li>
        </ul>
        <p className="text-sm mt-2">
          Check localStorage in your browser's DevTools (under Application tab) to see the saved values.
        </p>
      </Card>
    </div>
  );
} 