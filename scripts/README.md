# Firestore Seeding Scripts

This directory contains scripts for seeding data into Firebase Firestore.

## Comprehensive Seeding Script (seed-firebase.js)

This script is a comprehensive solution for populating Firebase Firestore with interconnected sample data for development and testing.

### Prerequisites

1. You need a Firebase service account key (JSON file) in the project root.
   - If you don't have one already, go to your Firebase Console:
     - Project Settings > Service Accounts
     - Click "Generate new private key"
     - Save the file as `service-account-key.json` in the project root

2. Make sure you have the Firebase Admin SDK installed:
   ```bash
   npm install firebase-admin
   ```

### Usage

Run the script using npm:

```bash
# Seed all collections with default counts
npm run seed:firebase

# Clear existing data and seed all collections
npm run seed:firebase:clear

# Seed only specific collections
npm run seed:firebase:users
npm run seed:firebase:patients
npm run seed:firebase:appointments

# Use custom options
npm run seed:firebase -- --collections=users,doctors --counts=users:15,doctors:20
```

Or directly with Node:

```bash
node scripts/seed-firebase.js [options]
```

### Options

- `--collections=users,doctors,patients,appointments,notifications` - Comma-separated list of collections to seed
- `--counts=users:10,doctors:15,patients:30,appointments:50,notifications:20` - Number of documents to create per collection
- `--clear` - Clear existing data in specified collections before adding new ones
- `--help` - Display help information

### Data Generated

The script generates interconnected sample data for the following collections:
- **users**: Authentication user records with roles and profile information
- **doctors**: Doctor profiles with specialties, education, availability, etc.
- **patients**: Patient profiles with medical history, demographics, etc.
- **appointments**: Appointments linking doctors and patients, with statuses, dates, etc.
- **notifications**: System notifications for various events

### Example

```bash
# Create 30 doctors, 50 patients, and 100 appointments, clearing existing ones first
npm run seed:firebase -- --collections=doctors,patients,appointments --counts=doctors:30,patients:50,appointments:100 --clear
```

## Doctor Seeding Script (seed-doctors.js)

This script populates the Firestore 'doctors' collection with sample doctor data for development and testing purposes.

### Prerequisites

1. You need a Firebase service account key (JSON file) in the project root.
   - If you don't have one already, go to your Firebase Console:
     - Project Settings > Service Accounts
     - Click "Generate new private key"
     - Save the file as `service-account-key.json` in the project root

2. Make sure you have the Firebase Admin SDK installed:
   ```bash
   npm install firebase-admin
   ```

### Usage

Run the script using npm:

```bash
# Seed 10 doctors (default)
npm run seed:doctors

# Clear existing doctors and seed new ones
npm run seed:doctors:clear

# Seed a specific number of doctors
npm run seed:doctors -- --count=20

# Show help information
npm run seed:doctors -- --help
```

Or directly with Node:

```bash
node scripts/seed-doctors.js [options]
```

### Options

- `--count=N` - Number of doctors to create (default: 10)
- `--clear` - Clear existing doctors before adding new ones
- `--help` - Display help information

### Data Generated

The script generates doctors with the following fields:
- Basic information (name, specialty, location, experience)
- Educational background
- Contact information
- Availability
- Verification status
- Profile images (from randomuser.me API)
- Ratings and reviews count

### Example

```bash
# Create 30 doctors, clearing existing ones first
npm run seed:doctors:clear -- --count=30
``` 