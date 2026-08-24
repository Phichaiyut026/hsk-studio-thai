import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import LessonsClient from "./LessonsClient";

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/lessons");

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
