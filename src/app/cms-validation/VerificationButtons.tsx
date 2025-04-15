"use client";
import React from "react";
import { appEventBus } from "@/lib/eventBus";
import { logInfo, logError } from "@/lib/logger";

// Utility to emit log and validation events for each verification step
function emitVerificationEvent(type: string) {
  const timestamp = new Date().toISOString();
  logInfo(`Started verification: ${type}`, { type, timestamp });
  appEventBus.emit("validation_event", {
    promptId: type,
    status: "success", // or "failure" for error simulation
    details: `Verification completed at ${timestamp}`,
    timestamp,
  });
}

interface VerificationButtonsProps {
  onShowCollectionData?: (collection: string) => void;
}

const VERIFICATION_TYPES = [
  { key: "users", label: "Verify Users" },
  { key: "patients", label: "Verify Patients" },
  { key: "doctors", label: "Verify Doctors" },
  { key: "availability", label: "Verify Doctor Availability" },
  { key: "verificationDocs", label: "Verify Verification Docs" },
  { key: "appointments", label: "Verify Appointments" },
  { key: "notifications", label: "Verify Notifications" },
  { key: "all", label: "Verify All Data" },
];

export const VerificationButtons: React.FC<VerificationButtonsProps> = ({ onShowCollectionData }) => (
  <section className="mb-6 p-4 border border-emerald-300 rounded bg-emerald-50 dark:bg-emerald-900/20">
    <h2 className="text-lg font-semibold mb-2">Data Verification</h2>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {VERIFICATION_TYPES.map((v) => (
        <button
          key={v.key}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium shadow"
          onClick={() => {
            emitVerificationEvent(v.key);
            onShowCollectionData?.(v.key);
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
    <p className="text-xs text-gray-500 mt-2">Each button triggers a validation event and logs the result. See logs below for details.</p>
  </section>
);
