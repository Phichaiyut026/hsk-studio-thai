import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import QuizClient from "./QuizClient";
import AdminOnlyGate from "../admin/AdminOnlyGate";
import { isAdminUser } from "../admin/access";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/quiz");
  if (!(await isAdminUser(user))) return <AdminOnlyGate signIn={authPaths.signIn} />;

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
