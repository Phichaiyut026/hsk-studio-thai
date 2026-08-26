import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  ensureUserProfile,
  listAdminAccessLogs,
} from "../../../../lib/hsk-db";

async function getAdmin() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const profile = await ensureUserProfile({
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
  });
  return profile.role === "admin" ? profile : null;
}

export async function GET() {
  try {
    if (!(await getAdmin())) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    return Response.json({ accessLogs: await listAdminAccessLogs(100) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
