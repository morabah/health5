import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';

const selectOptions = [
  { value: '', label: 'Select an option' },
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
];

export default function UiTestPage() {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [showAlert, setShowAlert] = useState(true);
  const [alertVariant, setAlertVariant] = useState<'success'|'error'|'warning'|'info'>('success');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <h2 className="text-xl font-bold mb-4">Card Component</h2>
          <p>This is a card. It uses the base Card UI primitive.</p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Button Variants & Loading</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            <Button label="Primary" variant="primary" pageName="ui-test" />
            <Button label="Secondary" variant="secondary" pageName="ui-test" />
            <Button label="Danger" variant="danger" pageName="ui-test" />
            <Button label="Outline" variant="main" pageName="ui-test" />
            <Button label="Loading" variant="primary" isLoading={true} pageName="ui-test" />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Input & Error</h2>
          <Input
            label="Email"
            id="email"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            error={inputError}
            placeholder="Enter your email"
          />
          <Button
            label="Validate"
            variant="primary"
            pageName="ui-test"
            onClick={() => setInputError(inputValue.includes('@') ? '' : 'Please enter a valid email.')}
          />
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Textarea</h2>
          <Textarea label="Description" placeholder="Type something..." />
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Select</h2>
          <Select
            label="Options"
            options={selectOptions}
            value={selectValue}
            onChange={e => setSelectValue(e.target.value)}
            error={selectValue === '' ? 'Please select an option.' : ''}
          />
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Alert Variants</h2>
          <div className="flex gap-2 mb-2">
            {(['success','error','warning','info'] as const).map(v => (
              <Button key={v} label={v} variant="secondary" pageName="ui-test" onClick={() => { setAlertVariant(v); setShowAlert(true); }} />
            ))}
          </div>
          <Alert variant={alertVariant} message={`This is a ${alertVariant} alert.`} isVisible={showAlert} />
          <Button label="Hide Alert" variant="outline" pageName="ui-test" onClick={() => setShowAlert(false)} />
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Spinner</h2>
          <Spinner />
        </Card>
      </div>
    </div>
  );
}
