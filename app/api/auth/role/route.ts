import { getChatGPTUser } from "../../../chatgpt-auth";
import { ensureUserProfile } from "../../../../lib/hsk-db";

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ isAdmin: false }, { status: 401 });
    const profile = await ensureUserProfile({ userId: user.userId, email: user.email, displayName: user.displayName });
    return Response.json({ isAdmin: profile.role === "admin" });
  } catch {
    return Response.json({ isAdmin: false }, { status: 500 });
  }
}
