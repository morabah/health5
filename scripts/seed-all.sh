#!/bin/bash

# Firebase Firestore Seeding Script
# Runs all seeding scripts in the correct order with the specified options

echo "=== Health Appointment System - Firestore Seeding ==="
echo ""

# Check if service account key exists
if [ ! -f ./service-account-key.json ]; then
  echo "Error: service-account-key.json not found in project root!"
  echo "Please create a service account key file and place it in the project root."
  echo "See: https://firebase.google.com/docs/admin/setup#initialize-sdk"
  exit 1
fi

# Parse command line arguments
CLEAR_FLAG=false
DOCTOR_COUNT=15
PATIENT_COUNT=25
APPOINTMENT_COUNT=40
NOTIFICATION_COUNT=50
ADMIN_COUNT=2

# Parse arguments
for arg in "$@"; do
  case $arg in
    --clear)
      CLEAR_FLAG=true
      ;;
    --doctors=*)
      DOCTOR_COUNT="${arg#*=}"
      ;;
    --patients=*)
      PATIENT_COUNT="${arg#*=}"
      ;;
    --appointments=*)
      APPOINTMENT_COUNT="${arg#*=}"
      ;;
    --notifications=*)
      NOTIFICATION_COUNT="${arg#*=}"
      ;;
    --admins=*)
      ADMIN_COUNT="${arg#*=}"
      ;;
    --help)
      echo "Firestore Seeding Script"
      echo ""
      echo "Usage: ./seed-all.sh [options]"
      echo ""
      echo "Options:"
      echo "  --clear                Clear all collections before seeding"
      echo "  --doctors=N            Number of doctors to create (default: 15)"
      echo "  --patients=N           Number of patients to create (default: 25)"
      echo "  --appointments=N       Number of appointments to create (default: 40)"
      echo "  --notifications=N      Number of notifications to create (default: 50)"
      echo "  --admins=N             Number of admins to create (default: 2)"
      echo "  --help                 Display this help message"
      echo ""
      exit 0
      ;;
  esac
done

# Prepare clear flag if needed
if [ "$CLEAR_FLAG" = true ]; then
  CLEAR_ARG="--clear"
else
  CLEAR_ARG=""
fi

echo "Configuration:"
echo "- Clear existing data: $CLEAR_FLAG"
echo "- Doctors to create: $DOCTOR_COUNT"
echo "- Patients to create: $PATIENT_COUNT"
echo "- Admin users to create: $ADMIN_COUNT"
echo "- Appointments to create: $APPOINTMENT_COUNT"
echo "- Notifications to create: $NOTIFICATION_COUNT"
echo ""

# 0. First seed Firebase Auth users (this creates the actual auth accounts)
echo "=== Seeding Firebase Authentication Users ==="
node scripts/seed-users.js $CLEAR_ARG --doctors=$DOCTOR_COUNT --patients=$PATIENT_COUNT --admins=$ADMIN_COUNT
if [ $? -ne 0 ]; then
  echo "Error seeding users. Exiting."
  exit 1
fi
echo ""

# 1. Seed doctors - use the auth users created in the previous step
echo "=== Seeding Doctor Profiles ==="
node scripts/seed-doctors.js $CLEAR_ARG --count=$DOCTOR_COUNT --link-auth-users
if [ $? -ne 0 ]; then
  echo "Error seeding doctors. Exiting."
  exit 1
fi
echo ""

# 2. Seed patients - use the auth users created in the previous step
echo "=== Seeding Patient Profiles ==="
node scripts/seed-patients.js $CLEAR_ARG --count=$PATIENT_COUNT --link-auth-users
if [ $? -ne 0 ]; then
  echo "Error seeding patients. Exiting."
  exit 1
fi
echo ""

# 3. Seed appointments (needs doctors and patients to exist first)
echo "=== Seeding Appointments ==="
node scripts/seed-appointments.js $CLEAR_ARG --count=$APPOINTMENT_COUNT
if [ $? -ne 0 ]; then
  echo "Error seeding appointments. Exiting."
  exit 1
fi
echo ""

# 4. Seed notifications (needs other collections to exist first)
echo "=== Seeding Notifications ==="
node scripts/seed-notifications.js $CLEAR_ARG --count=$NOTIFICATION_COUNT
if [ $? -ne 0 ]; then
  echo "Error seeding notifications. Exiting."
  exit 1
fi
echo ""

echo "=== Seeding Completed Successfully ==="
echo "Data has been seeded in your Firestore database."
echo "- $ADMIN_COUNT admin users"
echo "- $DOCTOR_COUNT doctor users and profiles"
echo "- $PATIENT_COUNT patient users and profiles"
echo "- $APPOINTMENT_COUNT appointments"
echo "- $NOTIFICATION_COUNT notifications"
echo ""
echo "Note: You may need to restart your application to see the changes."
echo ""
echo "Default login credentials:"
echo "- Admin: admin@example.com / AdminPass123!"
echo "- Doctor: doctor1@example.com / Password123!"
echo "- Patient: patient1@example.com / Password123!" 