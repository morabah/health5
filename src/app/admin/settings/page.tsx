"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { mockGetAdminSettings, mockUpdateAdminSettings } from "@/lib/mockApiService";

interface AdminSettings {
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  emailNotifications: boolean;
}

const defaultSettings: AdminSettings = {
  maintenanceMode: false,
  allowRegistrations: true,
  emailNotifications: true,
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      setError(null);
      try {
        const data = await mockGetAdminSettings();
        setSettings(data);
      } catch (err) {
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (key: keyof AdminSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, [key]: e.target.checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await mockUpdateAdminSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Admin Settings</h1>
      <Card className="w-full max-w-xl mb-8 p-6">
        <h2 className="text-xl font-semibold mb-4">System Settings</h2>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>}
        {!loading && !error && (
          <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                id="maintenanceMode"
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={handleChange("maintenanceMode")}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="maintenanceMode" className="text-sm font-medium">Maintenance Mode</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="allowRegistrations"
                type="checkbox"
                checked={settings.allowRegistrations}
                onChange={handleChange("allowRegistrations")}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="allowRegistrations" className="text-sm font-medium">Allow New Registrations</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="emailNotifications"
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={handleChange("emailNotifications")}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="emailNotifications" className="text-sm font-medium">Enable Email Notifications</label>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
              {success && <span className="text-green-600 dark:text-green-400 text-sm">Settings saved!</span>}
            </div>
          </form>
        )}
      </Card>
    </main>
  );
};

export default SettingsPage;
