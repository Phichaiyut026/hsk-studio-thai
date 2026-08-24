import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import StatsClient from "./StatsClient";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/stats");

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
    />
  );
}
