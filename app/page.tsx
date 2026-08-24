import { getAuthPaths, getChatGPTUser } from "./chatgpt-auth";
import HomeClient from "./HomeClient";
import { isAdminUser } from "./admin/access";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/");
  const isAdmin = await isAdminUser(user);

  return (
    <HomeClient
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
