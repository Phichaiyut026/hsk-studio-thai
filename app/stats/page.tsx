import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import StatsClient from "./StatsClient";
import { isAdminUser } from "../admin/access";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/stats");
  const isAdmin = await isAdminUser(user);

  return (
    <StatsClient
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
