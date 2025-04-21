# Firebase Data Seeding Scripts

This directory contains scripts to populate Firestore with sample data for development and testing.

## Prerequisites

1. Firebase service account key file (`service-account-key.json`) in the project root directory
2. Node.js installed on your machine

## Available Scripts

The following scripts are available for seeding different collections:

### 1. `seed-doctors.js`

Creates doctor profiles in Firestore.

```bash
node scripts/seed-doctors.js [options]
```

Options:
- `--count=N` - Number of doctors to create (default: 10)
- `--clear` - Clear existing doctors before adding new ones
- `--help` - Display help information

### 2. `seed-patients.js`

Creates patient profiles in Firestore.

```bash
node scripts/seed-patients.js [options]
```

Options:
- `--count=N` - Number of patients to create (default: 20)
- `--clear` - Clear existing patients before adding new ones
- `--help` - Display help information

### 3. `seed-appointments.js`

Creates appointments between doctors and patients in Firestore.

```bash
node scripts/seed-appointments.js [options]
```

Options:
- `--count=N` - Number of appointments to create (default: 30)
- `--clear` - Clear existing appointments before adding new ones
- `--help` - Display help information

**Note**: The `seed-appointments.js` script requires that doctors and patients have already been seeded.

### 4. `seed-notifications.js`

Creates notification records in Firestore.

```bash
node scripts/seed-notifications.js [options]
```

Options:
- `--count=N` - Number of notifications to create (default: 50)
- `--clear` - Clear existing notifications before adding new ones
- `--help` - Display help information

**Note**: The `seed-notifications.js` script works best when doctors, patients, and appointments have already been seeded.

### 5. `seed-firebase.js`

Comprehensive script that seeds multiple collections at once.

```bash
node scripts/seed-firebase.js [options]
```

Options:
- `--collections=users,doctors,patients,appointments,notifications` - Collections to seed (comma-separated)
- `--counts=users:10,doctors:15` - Number of documents to create per collection
- `--clear` - Clear existing data before adding new ones
- `--help` - Display help information

## Recommended Seeding Order

For best results, seed the collections in the following order:

1. Doctors: `node scripts/seed-doctors.js --clear`
2. Patients: `node scripts/seed-patients.js --clear`
3. Appointments: `node scripts/seed-appointments.js --clear`
4. Notifications: `node scripts/seed-notifications.js --clear`

Alternatively, use the comprehensive script:

```bash
node scripts/seed-firebase.js --clear
```

## Service Account Setup

To use these scripts, you need a Firebase service account key:

1. Go to your Firebase console: https://console.firebase.google.com/
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Save the JSON file as `service-account-key.json` in the project root

## Data Structure

The scripts generate realistic sample data based on the application's data models:

- Doctors with specialties, verification status, and availability
- Patients with medical history and contact information
- Appointments with various statuses and time slots
- Notifications tied to users and appointments

## Issues and Troubleshooting

- If you encounter "document already exists" errors, use the `--clear` flag to remove existing data first
- Make sure your service account has the necessary permissions (Firestore Admin)
- For large batch operations, you might need to increase Node's memory limit: `node --max-old-space-size=4096 scripts/seed-firebase.js` 