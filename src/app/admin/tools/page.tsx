"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";

interface Tool {
  id: string;
  label: string;
  apiEndpoint: string;
}

const tools: Tool[] = [
  {
    id: "fix-missing-user-names",
    label: "Fix Missing User Names",
    apiEndpoint: "/api/admin/run-script?name=fix-missing-user-names",
  },
  {
    id: "add-default-availability-to-doctors",
    label: "Add Default Doctor Availability",
    apiEndpoint: "/api/admin/run-script?name=add-default-availability-to-doctors",
  },
  {
    id: "fix-doctor-availability-dayofweek",
    label: "Fix Doctor Availability Day of Week",
    apiEndpoint: "/api/admin/run-script?name=fix-doctor-availability-dayofweek",
  },
  {
    id: "create-admin-user",
    label: "Create Admin User",
    apiEndpoint: "/api/admin/run-script?name=create-admin-user",
  },
];

export default function AdminToolsPage() {
  // Optionally, protect this page with a server-side admin check or redirect
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string>>({});

  const handleRunTool = async (tool: Tool) => {
    setLoading(tool.id);
    setResult((r) => ({ ...r, [tool.id]: "" }));
    try {
      const res = await fetch(tool.apiEndpoint, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Prefer output if available, otherwise message
        setResult((r) => ({ ...r, [tool.id]: data.output || data.message || "Success" }));
        toast.success(data.message || "Success");
      } else {
        setResult((r) => ({ ...r, [tool.id]: data.error || "Failed" }));
        toast.error(data.error || "Error");
      }
    } catch (e: any) {
      setResult((r) => ({ ...r, [tool.id]: e.message || "Error" }));
      toast.error(e.message || "Error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Tools</h1>
      <div className="space-y-4">
        {tools.map((tool) => (
          <div key={tool.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                isLoading={loading === tool.id}
                disabled={!!loading}
                onClick={() => handleRunTool(tool)}
              >
                {tool.label}
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {result[tool.id] && result[tool.id].length < 80 ? result[tool.id] : ''}
              </span>
            </div>
            {result[tool.id] && (
              <textarea
                className="w-full min-h-[80px] rounded border border-gray-300 dark:border-gray-600 p-2 text-xs font-mono bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 resize-y"
                value={result[tool.id]}
                readOnly
                spellCheck={false}
                aria-label={`Output for ${tool.label}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
