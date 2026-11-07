import { useState, type ReactNode } from 'react';
import {
  Activity, Bell, ChevronDown, ClipboardCheck, Database, FileText, LayoutDashboard,
  LockKeyhole, MapPinned, Menu, Satellite, TreePine, Sprout, X,
} from 'lucide-react';
import type { PageId, Project } from '../types';
import type { AuthUser } from '../services/auth';
import { FloatingMascotChat } from './FloatingMascotChat';

const NAV: Array<{ id: PageId; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'ภาพรวมโครงการ', icon: LayoutDashboard },
  { id: 'projects', label: 'แปลงของฉัน', icon: Database },
  { id: 'map', label: 'แผนที่และขอบเขต', icon: MapPinned },
  { id: 'satellite', label: 'ภาพดาวเทียม', icon: Satellite },
  { id: 'assessment', label: 'ประเมินข้อมูลด้วย AI', icon: Activity },
  { id: 'carbon', label: 'คาร์บอนเครดิต', icon: TreePine },
  { id: 'field', label: 'ตรวจสอบภาคสนาม', icon: ClipboardCheck },
  { id: 'reports', label: 'รายงาน', icon: FileText },
];

export function AppShell({ page, onNavigate, onLogout, onNotify, projects, user, guestMode = false, children }: {
  page: PageId;
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
  onNotify: (message: string) => void;
  projects: Project[];
  user: AuthUser;
  guestMode?: boolean;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const title = page === 'profile' ? 'โปรไฟล์ของฉัน' : NAV.find((item) => item.id === page)?.label ?? 'ภาพรวมโครงการ';
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0] ?? '').join('').toLocaleUpperCase('th-TH');
  const go = (next: PageId) => { onNavigate(next); setMobileOpen(false); };
  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 900px)').matches) setMobileOpen((open) => !open);
    else setSidebarCollapsed((collapsed) => !collapsed);
  };
  const sidebarLabel = mobileOpen ? 'ปิดเมนู' : sidebarCollapsed ? 'ขยายเมนูด้านข้าง' : 'ย่อเมนูด้านข้าง';

  return <div className={`app-shell flex min-h-screen ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${guestMode ? 'guest-mode' : ''}`}>
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} id="sidebar">
      <a className="brand" href="#projects" onClick={(event) => { event.preventDefault(); go('projects'); }} aria-label="CarbonLens แปลงของฉัน">
        <span className="brand-mark">C<span>↗</span></span><span className="brand-name">carbon<span>lens</span></span>
      </a>
      <div className="workspace-label">WORKSPACE</div>
      <button className="workspace" onClick={() => onNotify('ต้นแบบนี้มี workspace ตัวอย่างเดียว')}>
        <span className="workspace-avatar"><Sprout size={17} /></span><span><b>สวนยางพาราชุมชนต้นแบบ</b><small>สหกรณ์สวนยางพารา · ตรัง</small></span><ChevronDown size={15} className="chevron" />
      </button>
      <div className="nav-label">ภาพรวมและการดำเนินงาน</div>
      <nav className="nav-list" aria-label="เมนูหลัก">
        {NAV.map(({ id, label, icon: Icon }) => { const guestLocked = guestMode && !['dashboard','satellite','assessment','carbon','reports'].includes(id); return <a key={id} data-page={id} className={`nav-item ${page === id ? 'active' : ''} ${guestLocked ? 'guest-locked' : ''}`} href={`#${id}`} onClick={(event) => { event.preventDefault(); go(id); }}>
          <Icon className="nav-icon" size={16} strokeWidth={1.8} />{label}{guestLocked ? <LockKeyhole size={14} className="guest-lock-icon" /> : id === 'projects' && <span className="nav-count">{projects.reduce((total, item) => total + Number(item.plots || 1), 0)}</span>}{id === 'field' && !guestMode && <span className="dot-count">3</span>}
        </a>; })}
      </nav>
      <div className="sidebar-bottom">
        {guestMode && <div className="guest-note"><b>โหมดเยี่ยมชม</b><p>ดูหน้าตัวอย่างได้ บางหน้าต้องเข้าสู่ระบบ</p><button type="button" onClick={onLogout}>เข้าสู่ระบบ / สมัครสมาชิก</button></div>}
        {!guestMode && <div className="help-card"><span className="help-icon">✳</span><b>เริ่มต้นใช้งาน</b><p>เตรียมข้อมูลโครงการสวนยางพาราให้พร้อมตรวจสอบ</p><a href="#reports" onClick={(e) => { e.preventDefault(); go('reports'); }}>ดูรายงานและคู่มือ <span>↗</span></a></div>}
        <div className="profile"><div className="profile-identity"><span className="profile-avatar">{initials}</span><span><b>{guestMode ? 'ผู้เยี่ยมชม' : user.name}</b><small>{guestMode ? 'เข้าชมแบบอ่านอย่างเดียว' : user.email}</small></span></div></div>
      </div>
    </aside>

    {mobileOpen && <button className="sidebar-scrim" aria-label="ปิดเมนู" onClick={() => setMobileOpen(false)} />}
    <main className="main-area min-w-0 flex-1">
      <header className="topbar"><button className="mobile-menu sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarLabel} aria-expanded={window.matchMedia('(max-width: 900px)').matches ? mobileOpen : !sidebarCollapsed} title={sidebarLabel}>{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
        <div className="breadcrumbs"><span>CarbonLens</span><span>/</span><b>{title}</b></div>
        <div className="top-actions">{guestMode && <span className="guest-mode-pill">โหมดเยี่ยมชม</span>}<span className="demo-pill"><i /> DEMO WORKSPACE</span><button className="icon-button" onClick={() => onNotify('ยังไม่มีการแจ้งเตือนจาก backend')} aria-label="การแจ้งเตือน"><Bell size={17} /><i className="notification-dot" /></button>{guestMode ? <button className="guest-login-button" type="button" onClick={onLogout}>เข้าสู่ระบบ</button> : <button className="top-avatar profile-trigger" type="button" title="เปิดโปรไฟล์" aria-label={`เปิดโปรไฟล์ของ ${user.name}`} onClick={() => go('profile')}>{initials}</button>}</div>
      </header>
      <div className="content">{children}</div>
    </main>
    <FloatingMascotChat />
  </div>;
}
