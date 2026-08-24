"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type AdminUser = {
  userId: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  createdAt: string;
};

export default function AdminClient({ authPaths, user }: { authPaths: { signIn: string; signOut: string }; user: { displayName: string; email: string } }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState("");

  async function loadUsers() {
    const response = await fetch("/api/admin/users");
    if (!response.ok) return;
    const data = (await response.json()) as { users: AdminUser[] };
    setUsers(data.users);
  }

  useEffect(() => { loadUsers(); }, []);

  async function changeRole(userId: string, role: "user" | "admin") {
    setMessage("กำลังบันทึก...");
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setMessage(response.ok ? "บันทึกสิทธิ์แล้ว" : "บันทึกไม่สำเร็จ");
    if (response.ok) await loadUsers();
  }

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <Navbar authPaths={authPaths} user={user} />
        <main className="admin-page">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">จัดการระบบ</p>
              <h1>ผู้ใช้และสิทธิ์</h1>
              <p>กำหนดว่าใครเป็น User และใครเป็น Admin ของ HSK Studio</p>
            </div>
            <a href="/" className="secondary-action">กลับหน้าเรียน</a>
          </div>
          <div className="admin-note">Admin ตรวจสิทธิ์ที่ฝั่งเซิร์ฟเวอร์ทุกครั้ง และไม่สามารถเปลี่ยน role ของตัวเองได้</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>ผู้ใช้</th><th>อีเมล</th><th>สิทธิ์</th><th>สร้างเมื่อ</th></tr></thead>
              <tbody>{users.map((item) => (
                <tr key={item.userId}>
                  <td><strong>{item.displayName}</strong><small>{item.userId}</small></td>
                  <td>{item.email}</td>
                  <td>
                    <select value={item.role} onChange={(event) => changeRole(item.userId, event.target.value as "user" | "admin")} disabled={item.email === user.email}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{new Date(item.createdAt).toLocaleDateString("th-TH")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {message && <p className="admin-status">{message}</p>}
        </main>
      </div>
      <Footer />
    </div>
  );
}
