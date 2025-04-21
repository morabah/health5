import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export async function GET() {
  try {
    const snap = await db.collection("doctors").get();
    const doctors = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        userId: d.userId || doc.id,
        firstName: d.firstName || '',
        lastName: d.lastName || '',
      };
    });
    return NextResponse.json({ doctors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to list doctors" }, { status: 500 });
  }
}
