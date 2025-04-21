import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createUserProfileInFirestore,
  createDoctorProfileInFirestore,
  createPatientProfileInFirestore,
} from "@/lib/adminTools/backendFunctions";
import { getAppointmentsByDoctor } from "@/lib/adminTools/getAppointmentsByDoctor";

const FnNameSchema = z.enum([
  "createUserProfileInFirestore",
  "createDoctorProfileInFirestore",
  "createPatientProfileInFirestore",
  "getAppointmentsByDoctor",
]);

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const fnName = url.searchParams.get("name");
  const parse = FnNameSchema.safeParse(fnName);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid function name" }, { status: 400 });
  }
  try {
    let output = "";
    if (parse.data === "createUserProfileInFirestore") {
      output = await createUserProfileInFirestore();
    } else if (parse.data === "createDoctorProfileInFirestore") {
      output = await createDoctorProfileInFirestore();
    } else if (parse.data === "createPatientProfileInFirestore") {
      output = await createPatientProfileInFirestore();
    } else if (parse.data === "getAppointmentsByDoctor") {
      const body = await req.json();
      output = await getAppointmentsByDoctor(body.doctorId);
    }
    return NextResponse.json({ message: "Function executed successfully.", output });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Function execution failed" }, { status: 500 });
  }
}
