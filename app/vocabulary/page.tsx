import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import VocabularyClient from "./VocabularyClient";

export const dynamic = "force-dynamic";

export default async function VocabularyPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/vocabulary");

  return (
    <VocabularyClient
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
