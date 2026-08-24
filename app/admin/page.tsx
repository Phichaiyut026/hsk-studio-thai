import Link from "next/link";
import { getAuthPaths, getChatGPTUser } from "../chatgpt-auth";
import { ensureUserProfile } from "../../lib/hsk-db";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getChatGPTUser();
  const authPaths = await getAuthPaths("/admin");

  if (!user) {
    return (
      <main className="admin-gate">
        <p className="eyebrow">พื้นที่ผู้ดูแล</p>
        <h1>กรุณาเข้าสู่ระบบก่อน</h1>
        <p>หน้านี้ใช้สำหรับจัดการผู้ใช้และสิทธิ์ของระบบ</p>
        <a className="primary-action" href={authPaths.signIn}>เข้าสู่ระบบ</a>
      </main>
    );
  }

  const profile = await ensureUserProfile({ userId: user.userId, email: user.email, displayName: user.displayName });
  if (profile.role !== "admin") {
    return (
      <main className="admin-gate">
        <p className="eyebrow">403</p>
        <h1>ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p>บัญชีของคุณเป็น User จึงยังไม่สามารถจัดการระบบได้</p>
        <Link className="secondary-action" href="/">กลับหน้าแรก</Link>
      </main>
    );
  }

  return <AdminClient authPaths={authPaths} user={user} />;
}
