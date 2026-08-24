import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import VocabularyClient from "./VocabularyClient";
import { isAdminUser } from "../admin/access";

export const dynamic = "force-dynamic";

export default async function VocabularyPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/vocabulary");
  const isAdmin = await isAdminUser(user);

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
      isAdmin={isAdmin}
    />
  );
}
