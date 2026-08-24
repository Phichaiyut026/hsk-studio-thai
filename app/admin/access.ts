import type { ChatGPTUser } from "../chatgpt-auth";
import { ensureUserProfile } from "../../lib/hsk-db";

export async function isAdminUser(user: ChatGPTUser | null) {
  if (!user) return false;
  const profile = await ensureUserProfile({ userId: user.userId, email: user.email, displayName: user.displayName });
  return profile.role === "admin";
}
