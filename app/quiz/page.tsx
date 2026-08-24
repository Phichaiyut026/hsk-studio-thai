import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import QuizClient from "./QuizClient";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/quiz");

  return (
    <QuizClient
      authPaths={authPaths}
      user={
        user
          ? {
              displayName: user.displayName,
              email: user.email,
            }
          : null
      }
    />
  );
}
