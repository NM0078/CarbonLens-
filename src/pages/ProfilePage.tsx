import { Building2, Link2, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react';
import type { AuthUser } from '../services/auth';
import { Button, Notice, PageHeader, Panel } from '../components/ui';

export function ProfilePage({ user, onLogout, onGoogleLink }: {
  user: AuthUser;
  onLogout: () => void;
  onGoogleLink: () => void;
}) {
  const initials = [user.firstName, user.lastName].map((part) => Array.from(part.trim())[0] ?? '').join('').toLocaleUpperCase('th-TH');
  return <section className="page active profile-page">
    <PageHeader eyebrow="บัญชีผู้ใช้" title="โปรไฟล์ของฉัน" subtitle="ข้อมูลบัญชีและการเชื่อมต่อของคุณ" />
    <Notice>บัญชีนี้เป็นโหมดสาธิต ข้อมูลเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น</Notice>
    <Panel title="ข้อมูลส่วนตัว" subtitle="ข้อมูลจากการลงทะเบียน" className="user-profile-panel">
      <div className="user-profile-heading"><span className="user-profile-avatar">{initials}</span><div><h2>{user.firstName} {user.lastName}</h2><p><Mail size={15} /> {user.email}</p></div><span className="account-status"><ShieldCheck size={15} /> บัญชีสาธิต</span></div>
      <div className="profile-details">
        <div><UserRound size={18} /><span><small>ชื่อ</small><b>{user.firstName}</b></span></div>
        <div><UserRound size={18} /><span><small>นามสกุล</small><b>{user.lastName}</b></span></div>
        <div><Mail size={18} /><span><small>อีเมล</small><b>{user.email}</b></span></div>
        <div><Building2 size={18} /><span><small>หน่วยงาน / Workspace</small><b>ป่าชุมชนต้นแบบ · เชียงใหม่</b></span></div>
      </div>
    </Panel>
    <Panel title="บัญชีที่เชื่อมต่อ" subtitle="เข้าสู่ระบบและเชื่อมบัญชีภายนอก" className="linked-account-panel">
      <div className="linked-account-row"><span className="google-mark">G</span><span><b>Google</b><small>ยังไม่ได้เชื่อมต่อ</small></span><Button onClick={onGoogleLink}><Link2 size={15} /> เชื่อมบัญชี Google</Button></div>
      <p className="profile-hint">การเชื่อม Google จริงต้องตั้งค่า OAuth Client ID และ backend ก่อน</p>
    </Panel>
    <div className="profile-signout"><div><b>ออกจากระบบ</b><p>จบการใช้งานบัญชีนี้บนเบราว์เซอร์ปัจจุบัน</p></div><Button variant="primary" onClick={onLogout}><LogOut size={16} /> ออกจากระบบ</Button></div>
  </section>;
}
