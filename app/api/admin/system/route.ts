import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  ensureHskSeedData,
  ensureUserProfile,
  getSystemOverview,
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

    return Response.json({ overview: await getSystemOverview() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getAdmin())) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const payload = (await request.json()) as { action?: string };
    if (payload.action !== "seed-hsk-data") {
      return Response.json({ error: "Unknown system action" }, { status: 400 });
    }

    await ensureHskSeedData();
    return Response.json({ ok: true, overview: await getSystemOverview() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
