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

type SystemOverview = {
  users: {
    total: number;
    admins: number;
    regular: number;
  };
  content: {
    vocabulary: number;
    quizQuestions: number;
    quizAttempts: number;
  };
  database: {
    binding: string;
    status: "ready";
  };
};

export default function AdminClient({ authPaths, user }: { authPaths: { signIn: string; signOut: string }; user: { displayName: string; email: string } }) {
  const [activeTab, setActiveTab] = useState<"overview" | "users">("overview");
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadUsers() {
    const response = await fetch("/api/admin/users");
    if (!response.ok) return;
    const data = (await response.json()) as { users: AdminUser[] };
    setUsers(data.users);
  }

  async function loadOverview() {
    const response = await fetch("/api/admin/system");
    if (!response.ok) return;
    const data = (await response.json()) as { overview: SystemOverview };
    setOverview(data.overview);
  }

  useEffect(() => {
    loadOverview();
    loadUsers();
  }, []);

  async function changeRole(userId: string, role: "user" | "admin") {
    setMessage("กำลังบันทึก...");
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setMessage(response.ok ? "บันทึกสิทธิ์แล้ว" : "บันทึกไม่สำเร็จ");
    if (response.ok) {
      await loadUsers();
      await loadOverview();
    }
  }

  async function seedHskData() {
    setBusy(true);
    setMessage("กำลังเตรียมข้อมูล HSK...");
    const response = await fetch("/api/admin/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed-hsk-data" }),
    });
    if (response.ok) {
      const data = (await response.json()) as { overview: SystemOverview };
      setOverview(data.overview);
      setMessage("เตรียมข้อมูล HSK เรียบร้อย");
    } else {
      setMessage("เตรียมข้อมูลไม่สำเร็จ");
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <Navbar authPaths={authPaths} user={user} />
        <main className="admin-page">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">จัดการระบบ</p>
              <h1>แผงควบคุมแอดมิน</h1>
              <p>ตรวจสถานะระบบ ข้อมูลการเรียน และจัดการสิทธิ์ของผู้ใช้ HSK Studio</p>
            </div>
            <a href="/" className="secondary-action">กลับหน้าเรียน</a>
          </div>

          <div className="admin-tabs" role="tablist" aria-label="เมนูจัดการระบบ">
            <button
              type="button"
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              ภาพรวมระบบ
            </button>
            <button
              type="button"
              className={activeTab === "users" ? "active" : ""}
              onClick={() => setActiveTab("users")}
            >
              ผู้ใช้และสิทธิ์
            </button>
          </div>

          {activeTab === "overview" ? (
            <>
              <section className="admin-metrics" aria-label="สรุประบบ">
                <Metric label="ผู้ใช้ทั้งหมด" value={overview?.users.total ?? 0} />
                <Metric label="แอดมิน" value={overview?.users.admins ?? 0} />
                <Metric label="คำศัพท์" value={overview?.content.vocabulary ?? 0} />
                <Metric label="แบบทดสอบที่ส่งแล้ว" value={overview?.content.quizAttempts ?? 0} />
              </section>

              <section className="admin-system-panel">
                <div>
                  <p className="eyebrow">ฐานข้อมูล</p>
                  <h2>D1 พร้อมใช้งาน</h2>
                  <p>
                    Binding <strong>{overview?.database.binding ?? "DB"}</strong> ใช้เก็บผู้ใช้ คำศัพท์ คำถาม
                    และผลแบบทดสอบ
                  </p>
                </div>
                <button type="button" onClick={seedHskData} disabled={busy}>
                  {busy ? "กำลังเตรียมข้อมูล..." : "เตรียมข้อมูล HSK"}
                </button>
              </section>

              <div className="admin-note">
                ผู้ใช้คนแรกของระบบจะได้สิทธิ์ Admin อัตโนมัติ และสามารถตั้งค่า `ADMIN_EMAIL` หรือ `ADMIN_USER_ID`
                ใน Cloudflare เพื่อกำหนดแอดมินหลักได้
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
          {message && <p className="admin-status">{message}</p>}
        </main>
      </div>
      <Footer />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-metric">
      <span>{label}</span>
      <strong>{value.toLocaleString("th-TH")}</strong>
    </div>
  );
}
