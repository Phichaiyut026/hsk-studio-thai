import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureHskSchema, ensureUserProfile, saveQuizAttempt } from "../../../lib/hsk-db";

function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message.includes("no such table")) {
    return "D1 tables are not ready. Generate and deploy the Drizzle migration before saving quiz attempts.";
  }
  return message;
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (user) await ensureUserProfile({ userId: user.userId, email: user.email, displayName: user.displayName });

    const payload = (await request.json()) as {
      sessionId?: string;
      levelId?: string;
      questionId?: string;
      selectedAnswer?: string;
    };

    const sessionId = payload.sessionId?.trim();
    const levelId = payload.levelId?.trim();
    const questionId = payload.questionId?.trim();
    const selectedAnswer = payload.selectedAnswer?.trim();

    if (!sessionId || !levelId || !questionId || !selectedAnswer) {
      return Response.json(
        { error: "sessionId, levelId, questionId, and selectedAnswer are required" },
        { status: 400 },
      );
    }

    await ensureHskSchema();
    const result = await saveQuizAttempt({
      userId: user?.userId,
      sessionId,
      levelId,
      questionId,
      selectedAnswer,
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}
