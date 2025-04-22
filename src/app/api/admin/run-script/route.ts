import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fixMissingUserNames } from "@/lib/adminTools/fixMissingUserNames";
import { addDefaultAvailabilityToDoctors } from "@/lib/adminTools/addDefaultAvailabilityToDoctors";
import { fixDoctorAvailabilityDayOfWeek } from "@/lib/adminTools/fixDoctorAvailabilityDayOfWeek";
import { fixUserUidAssociations } from "@/lib/adminTools/fixUserUidAssociations";
import { exec } from 'child_process';

// Map script names to their absolute file paths
const scriptMap: Record<string, string> = {
  "fix-missing-user-names": "scripts/fix-missing-user-names.js",
  "add-default-availability-to-doctors": "scripts/add-default-availability-to-doctors.js",
  "fix-doctor-availability-dayofweek": "scripts/fix-doctor-availability-dayofweek.js",
  "create-admin-user": "scripts/create-admin-user.ts",
  "fix-user-uid-associations": "scripts/fix-user-uid-associations.js",
  "delete-all-firestore-data": "scripts/delete-all-firestore-data.ts",
};

const ScriptNameSchema = z.enum([
  "fix-missing-user-names",
  "add-default-availability-to-doctors",
  "fix-doctor-availability-dayofweek",
  "fix-user-uid-associations",
  "delete-all-firestore-data",
]);

export async function POST(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const scriptName = url.searchParams.get("name");
  const parse = ScriptNameSchema.safeParse(scriptName);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid script name" }, { status: 400 });
  }

  try {
    if (parse.data === "delete-all-firestore-data") {
      // Run the script as a child process and return output
      return await new Promise<Response>((resolve) => {
        exec(
          `npx tsx scripts/delete-all-firestore-data.ts`,
          { cwd: process.cwd(), env: process.env },
          (error, stdout, stderr) => {
            if (error) {
              resolve(NextResponse.json({ error: stderr || error.message }, { status: 500 }));
            } else {
              resolve(NextResponse.json({ message: stdout || "Database deleted." }));
            }
          }
        );
      });
    }
    if (parse.data === "fix-missing-user-names") {
      const output = await fixMissingUserNames();
      return NextResponse.json({ message: "Script executed successfully.", output });
    }
    if (parse.data === "add-default-availability-to-doctors") {
      const output = await addDefaultAvailabilityToDoctors();
      return NextResponse.json({ message: "Script executed successfully.", output });
    }
    if (parse.data === "fix-doctor-availability-dayofweek") {
      const output = await fixDoctorAvailabilityDayOfWeek();
      return NextResponse.json({ message: "Script executed successfully.", output });
    }
    if (parse.data === "fix-user-uid-associations") {
      const output = await fixUserUidAssociations();
      return NextResponse.json({ message: "Script executed successfully.", output });
    }
    return NextResponse.json({ error: "Script not implemented." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
