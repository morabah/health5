# Project Knowledge & Implementation Memories

This file aggregates all persistent project memories, technical decisions, and best practices learned and enforced during development. Use this as a living reference for onboarding, debugging, and future enhancements.

---

## 1. Doctor Name Resolution Best Practice
- **Always resolve a doctor's display name by looking up the corresponding user profile using the doctor profile's `userId` in the users store (getUsersStore or Firestore).**
- Do **not** assume `doctorId` is the same as `userId`.
- Always prefer the user's `firstName` and `lastName` to construct the display name (e.g., `Dr. First Last`).
- If the user profile is missing, fallback to a clear placeholder (e.g., 'Dr. Unknown').
- Always add debug logging when debugging name resolution issues, and check for store resets or stale data if the name is not resolved as expected.
- Apply this pattern to any similar user-linked entity.

---

## 2. Firebase Data Source Policy
- **Never use mock data or local storage for production.**
- Always use cloud Firebase for all data operations in production and staging environments.
- Mock/local data is only acceptable for isolated test/dev workflows.

---

## 3. Doctor Name Resolution Fix (April 2025)
- Implemented and ran a script (`fix-missing-user-names.js`) that audits all doctor-linked user profiles in Firestore and auto-populates missing or empty `firstName`/`lastName` fields with sensible placeholders (inferred from doctor profile or fallback).
- After running, all user profiles now have valid `firstName` and `lastName` fields, and the UI correctly displays doctor names instead of 'Dr. Unknown'.
- This ensures robust name resolution for appointments in test/dev environments, following best practices to always resolve names using user profiles from Firestore.

---

## 4. Security and Debugging Preferences
- Emphasize debug logging for all data resolution and fetching logic, especially for user-linked entities.
- Always check for and handle missing or malformed data gracefully in the UI.

---

## 5. Scripts for Data Consistency
- Scripts exist for:
  - Auditing missing user profiles for doctors (`list-doctors-with-missing-users.js`)
  - Creating missing user profiles for test/dev (`create-missing-user-profiles.js`)
  - Fixing missing names in user profiles (`fix-missing-user-names.js`)
- These scripts are safe for test/dev but should not be run on production data without review.

---

## 6. API Mode Policy
- API mode should be controlled via environment variables and never rely on local storage in production.
- Always prefer live Firestore data for critical user-facing features.

---

_Last updated: 2025-04-21_
