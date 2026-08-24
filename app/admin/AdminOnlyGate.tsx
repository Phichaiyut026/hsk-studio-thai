export default function AdminOnlyGate({ signIn }: { signIn: string }) {
  return (
    <main className="admin-gate">
      <p className="eyebrow">พื้นที่กำลังพัฒนา</p>
      <h1>หน้านี้เปิดให้ Admin เท่านั้น</h1>
      <p>แบบทดสอบ แผนเรียน และบทเรียนกำลังอยู่ในช่วงจัดเตรียมระบบ</p>
      <a className="primary-action" href={signIn}>เข้าสู่ระบบ Admin</a>
    </main>
  );
}
