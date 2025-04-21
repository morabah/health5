import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fixMissingUserNames } from "@/lib/adminTools/fixMissingUserNames";
import { addDefaultAvailabilityToDoctors } from "@/lib/adminTools/addDefaultAvailabilityToDoctors";
import { fixDoctorAvailabilityDayOfWeek } from "@/lib/adminTools/fixDoctorAvailabilityDayOfWeek";
import { fixUserUidAssociations } from "@/lib/adminTools/fixUserUidAssociations";

// Map script names to their absolute file paths
const scriptMap: Record<string, string> = {
  "fix-missing-user-names": "scripts/fix-missing-user-names.js",
  "add-default-availability-to-doctors": "scripts/add-default-availability-to-doctors.js",
  "fix-doctor-availability-dayofweek": "scripts/fix-doctor-availability-dayofweek.js",
  "create-admin-user": "scripts/create-admin-user.ts",
  "fix-user-uid-associations": "scripts/fix-user-uid-associations.js",
};

const ScriptNameSchema = z.enum([
  "fix-missing-user-names",
  "add-default-availability-to-doctors",
  "fix-doctor-availability-dayofweek",
  "fix-user-uid-associations",
]);

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const scriptName = url.searchParams.get("name");
  const parse = ScriptNameSchema.safeParse(scriptName);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid script name" }, { status: 400 });
  }

  try {
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
    return NextResponse.json({ error: "Script not implemented." }, { status: 501 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Script execution failed" }, { status: 500 });
  }
}
