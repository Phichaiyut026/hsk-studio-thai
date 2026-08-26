import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  ensureUserProfile,
  getSystemOverview,
  listUsers,
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

    // Keep the first admin request small. Large content lists load only when
    // their corresponding admin tab is opened.
    const overview = await getSystemOverview();
    const users = await listUsers();

    return Response.json({ overview, users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
