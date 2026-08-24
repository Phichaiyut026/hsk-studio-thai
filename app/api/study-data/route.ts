import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureHskSeedData, ensureUserProfile, getStudyData, getStudyDataForUser } from "../../../lib/hsk-db";

function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message.includes("no such table")) {
    return "D1 tables are not ready. Generate and deploy the Drizzle migration before using study data.";
  }
  return message;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId")?.trim() || "anonymous";
    const user = await getChatGPTUser();

    await ensureHskSeedData();
    if (user) await ensureUserProfile({ userId: user.userId, email: user.email, displayName: user.displayName });
    const data = user ? await getStudyDataForUser(user.userId) : await getStudyData(sessionId);

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}
