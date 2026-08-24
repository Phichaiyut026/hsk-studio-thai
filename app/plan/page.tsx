import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import PlanClient from "./PlanClient";
import AdminOnlyGate from "../admin/AdminOnlyGate";
import { isAdminUser } from "../admin/access";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/plan");
  const isAdmin = await isAdminUser(user);
  if (!isAdmin) return <AdminOnlyGate signIn={authPaths.signIn} />;

  return (
    <PlanClient
      authPaths={authPaths}
      user={
        user
          ? {
              displayName: user.displayName,
              email: user.email,
            }
          : null
      }
      isAdmin={isAdmin}
    />
  );
}
