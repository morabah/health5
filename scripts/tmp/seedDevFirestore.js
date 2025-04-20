"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.resolve(process.cwd(), 'scripts', 'serviceAccountKey.json'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
});
// Initialize Firestore client
const db = admin.firestore();
const mockDataPath = path.resolve(process.cwd(), 'scripts', 'mockDataForScripts.js');
const { mockPatients, mockDoctors, mockAdmins, mockPatientProfiles, mockDoctorProfiles, mockDoctorAvailabilities, mockVerificationDocs, mockAppointmentsArray, mockNotificationsArray, } = require(mockDataPath);
// Utility to delete all docs in a collection (for dev only)
function deleteCollection(collectionName) {
    return __awaiter(this, void 0, void 0, function* () {
        const collectionRef = db.collection(collectionName);
        let snapshot = yield collectionRef.get();
        const batchSize = 500;
        let deleted = 0;
        while (!snapshot.empty) {
            const batch = db.batch();
            snapshot.docs.slice(0, batchSize).forEach((doc) => batch.delete(doc.ref));
            yield batch.commit();
            deleted += snapshot.docs.length;
            if (snapshot.docs.length < batchSize)
                break;
            snapshot = yield collectionRef.get();
        }
        console.log(`Deleted ${deleted} documents from ${collectionName}`);
    });
}
// Utility to delete all Firebase Auth users (for dev only)
function deleteAllAuthUsers() {
    return __awaiter(this, arguments, void 0, function* (excludeEmails = []) {
        let nextPageToken = undefined;
        let totalDeleted = 0;
        do {
            const listUsersResult = yield admin.auth().listUsers(1000, nextPageToken);
            const usersToDelete = listUsersResult.users.filter((user) => !excludeEmails.includes(user.email || ''));
            const uids = usersToDelete.map((user) => user.uid);
            if (uids.length > 0) {
                yield admin.auth().deleteUsers(uids);
                totalDeleted += uids.length;
                console.log(`Deleted ${uids.length} auth users in batch`);
            }
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
        console.log(`All Auth users deleted (except exclusions). Total: ${totalDeleted}`);
    });
}
function createOrGetAuthUser(user) {
    return __awaiter(this, void 0, void 0, function* () {
        // Try by email
        try {
            const existing = yield admin.auth().getUserByEmail(user.email);
            return existing.uid;
        }
        catch (err) {
            if (err.code !== 'auth/user-not-found')
                throw err;
        }
        // Try by phone number (if provided)
        if (user.phone) {
            try {
                const existing = yield admin.auth().getUserByPhoneNumber(user.phone);
                return existing.uid;
            }
            catch (err) {
                if (err.code !== 'auth/user-not-found')
                    throw err;
            }
        }
        // Create new user
        const created = yield admin.auth().createUser({
            email: user.email,
            emailVerified: !!user.emailVerified,
            phoneNumber: user.phone || undefined,
            password: 'Password123!', // Default password for dev/demo
            displayName: user.firstName + ' ' + user.lastName,
            disabled: !user.isActive,
        });
        return created.uid;
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // === DANGER: DEV ONLY ===
        // 1. Delete all Auth users (except admin)
        yield deleteAllAuthUsers([process.env.ADMIN_EMAIL || 'admin@example.com']);
        console.log('All Auth users deleted.');
        // 2. Delete all Firestore data
        yield deleteCollection('users');
        yield deleteCollection('patients');
        yield deleteCollection('doctors');
        yield deleteCollection('appointments');
        yield deleteCollection('notifications');
        console.log('All collections cleared.');
        // 3. Create Auth users (patients, doctors, admins) and collect UIDs
        const allUsers = [
            ...mockPatients,
            ...mockDoctors,
            ...mockAdmins,
        ];
        const firestoreUsers = [];
        for (const user of allUsers) {
            const uid = yield createOrGetAuthUser(user);
            firestoreUsers.push(Object.assign(Object.assign({}, user), { id: uid }));
            yield db.collection('users').doc(uid).set(Object.assign(Object.assign({}, user), { id: uid }));
        }
        // Also seed admin user with the Auth UID for login (if not already handled)
        const adminAuthUid = process.env.ADMIN_AUTH_UID || 'WRkSVuEF3VcUiUJGVugSvz1WnG62';
        const mainAdmin = firestoreUsers.find((u) => u.email === 'admin@example.com');
        if (mainAdmin && mainAdmin.id !== adminAuthUid) {
            yield db.collection('users').doc(adminAuthUid).set(Object.assign(Object.assign({}, mainAdmin), { id: adminAuthUid }));
        }
        console.log('Seeded users (Auth + Firestore)');
        // 4. Create other database records (patients, doctors, availabilities, etc.)
        for (const p of mockPatientProfiles) {
            const user = firestoreUsers.find((u) => u.email === p.userId || u.email === p.email || u.id === p.userId);
            if (user) {
                yield db.collection('patients').doc(user.id).set(Object.assign(Object.assign({}, p), { userId: user.id }));
            }
        }
        console.log('Seeded patient profiles');
        for (const d of mockDoctorProfiles) {
            const user = firestoreUsers.find((u) => u.email === d.userId || u.email === d.email || u.id === d.userId);
            if (user) {
                yield db.collection('doctors').doc(user.id).set(Object.assign(Object.assign({}, d), { userId: user.id }));
            }
        }
        console.log('Seeded doctor profiles');
        for (let i = 0; i < mockDoctors.length; i++) {
            const user = firestoreUsers.find((u) => u.email === mockDoctors[i].email);
            if (!user)
                continue;
            const doctorId = user.id;
            for (const slot of mockDoctorAvailabilities[i]) {
                yield db.collection('doctors').doc(doctorId).collection('availability').doc(slot.id).set(slot);
            }
        }
        console.log('Seeded doctor availabilities');
        for (let i = 0; i < mockDoctors.length; i++) {
            const user = firestoreUsers.find((u) => u.email === mockDoctors[i].email);
            if (!user)
                continue;
            const doctorId = user.id;
            for (const doc of mockVerificationDocs[i]) {
                yield db.collection('doctors').doc(doctorId).collection('verificationDocs').doc(doc.id).set(doc);
            }
        }
        console.log('Seeded doctor verification docs');
        for (const appt of mockAppointmentsArray) {
            const patient = firestoreUsers.find((u) => u.email === appt.patientEmail);
            const doctor = firestoreUsers.find((u) => u.email === appt.doctorEmail);
            yield db.collection('appointments').doc(appt.id).set(Object.assign(Object.assign({}, appt), { patientId: patient ? patient.id : appt.patientId, doctorId: doctor ? doctor.id : appt.doctorId }));
        }
        console.log('Seeded appointments');
        for (const notif of mockNotificationsArray) {
            const user = firestoreUsers.find((u) => u.email === notif.userEmail);
            yield db.collection('notifications').doc(notif.id).set(Object.assign(Object.assign({}, notif), { userId: user ? user.id : notif.userId }));
        }
        console.log('Seeded notifications');
        console.log('Firestore and Auth seeding complete!');
    });
}
main().catch(err => {
    console.error('Error seeding Firestore:', err);
    process.exit(1);
});
