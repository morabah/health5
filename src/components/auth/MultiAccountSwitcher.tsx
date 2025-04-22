import React, { useState } from 'react';
import { useMultiAccountAuth } from './MultiAccountAuthProvider';

export default function MultiAccountSwitcher() {
  const { sessions, addAccount, switchAccount, current, signOutAccount } = useMultiAccountAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addAccount(form.name, form.email, form.password);
      setForm({ name: '', email: '', password: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800 mb-4">
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2">
          <input
            className="border rounded p-2 flex-1"
            placeholder="Account Name (e.g. doctor1)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            className="border rounded p-2 flex-1"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            className="border rounded p-2 flex-1"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 mt-2"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Account'}
        </button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </form>
      <div className="flex gap-2 flex-wrap items-center">
        {sessions.map(s => (
          <button
            key={s.name}
            className={`px-3 py-1 rounded border ${current?.name === s.name ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700'}`}
            onClick={() => switchAccount(s.name)}
          >
            {s.name} ({s.user?.email || 'No email'})
          </button>
        ))}
        {current && (
          <button
            className="ml-4 px-3 py-1 rounded border bg-red-600 text-white"
            onClick={() => signOutAccount(current.name)}
          >
            Sign Out Current
          </button>
        )}
      </div>
      {current && (
        <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
          Current: <b>{current.name}</b> ({current.user?.email})
        </div>
      )}
    </div>
  );
}
