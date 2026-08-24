import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import LessonsClient from "./LessonsClient";
import AdminOnlyGate from "../admin/AdminOnlyGate";
import { isAdminUser } from "../admin/access";

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/lessons");
  if (!(await isAdminUser(user))) return <AdminOnlyGate signIn={authPaths.signIn} />;

  return (
    <LessonsClient
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
