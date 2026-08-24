import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import PlanClient from "./PlanClient";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/plan");

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
    />
  );
}
