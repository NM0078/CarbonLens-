import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { ProjectDialog, type ProjectFormValues } from './components/ProjectDialog';
import { Toast } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { MapPage } from './pages/MapPage';
import { SatellitePage } from './pages/SatellitePage';
import { AssessmentPage } from './pages/AssessmentPage';
import { CarbonPage } from './pages/CarbonPage';
import { FieldPage } from './pages/FieldPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { loadProjects, saveProjects } from './services/projectStore';
import { getCurrentAuthUser, registerLocalAccount, signInLocalAccount, type AuthUser } from './services/auth';
import { API_ROUTES, apiClient } from './services/api';
import { ForestBuddy } from './components/ForestBuddy';
import { DEMO_PROJECTS } from './data/demo';
import type { PageId, Project, ToastMessage } from './types';

const GUEST_USER: AuthUser = { id: 'guest', name: 'ผู้เยี่ยมชม', firstName: 'ผู้เยี่ยมชม', lastName: '', email: 'โหมดเข้าชมเท่านั้น' };
const GUEST_PAGES: PageId[] = ['dashboard', 'satellite', 'assessment', 'carbon', 'reports'];

function pageFromHash(): PageId {
  const page = window.location.hash.slice(1) as PageId;
  return ['dashboard','projects','map','satellite','assessment','carbon','field','reports','profile'].includes(page) ? page : 'projects';
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(getCurrentAuthUser);
  const [guestMode, setGuestMode] = useState(false);
  const [onboardingRequired, setOnboardingRequired] = useState(() => {
    const current = getCurrentAuthUser();
    return current ? localStorage.getItem(`carbonlens-onboarding-pending-${current.id}`) === 'true' : false;
  });
  const [page, setPage] = useState<PageId>(() => onboardingRequired ? 'projects' : user ? 'dashboard' : pageFromHash());
  const [projects, setProjects] = useState<Project[]>(() => user ? loadProjects(user.id) : loadProjects());
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [visitorPrompt, setVisitorPrompt] = useState(false);

  const notify = useCallback((message: string) => {
    if (guestMode && /สำหรับสมาชิก|สมัครสมาชิกหรือเข้าสู่ระบบ/.test(message)) setVisitorPrompt(true);
    else setToast({ id: Date.now(), message });
  }, [guestMode]);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => { if (user) saveProjects(projects, user.id); }, [projects, user]);
  useEffect(() => { const handleHash = () => { const next = pageFromHash(); if (guestMode && !GUEST_PAGES.includes(next)) { setPage('dashboard'); window.history.replaceState(null, '', '#dashboard'); notify('หน้านี้สำหรับสมาชิก กรุณาเข้าสู่ระบบหรือสมัครสมาชิก'); } else setPage(next); }; window.addEventListener('hashchange', handleHash); return () => window.removeEventListener('hashchange', handleHash); }, [guestMode, notify]);

  const navigate = (next: PageId) => {
    if (guestMode && !GUEST_PAGES.includes(next)) { notify('หน้านี้สำหรับสมาชิก กรุณาเข้าสู่ระบบหรือสมัครสมาชิก'); return; }
    if (onboardingRequired && next !== 'projects') { notify('กรอกและบันทึกข้อมูลแปลงก่อนเข้าสู่ภาพรวมโครงการ'); return; }
    setPage(next); window.history.replaceState(null, '', `#${next}`); document.querySelector('.app-shell .main-area')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const login = async (email: string, password: string, remember: boolean) => {
    const user = await signInLocalAccount(email, password);
    setGuestMode(false); setUser(user); sessionStorage.setItem('carbonlens-auth-session', user.id);
    if (remember) localStorage.setItem('carbonlens-auth-remember', user.id); else localStorage.removeItem('carbonlens-auth-remember');
    setProjects(loadProjects(user.id));
    const pending = localStorage.getItem(`carbonlens-onboarding-pending-${user.id}`) === 'true';
    setOnboardingRequired(pending); setCreateProjectOpen(pending);
    setPage(pending ? 'projects' : 'dashboard'); window.history.replaceState(null, '', pending ? '#projects' : '#dashboard');
  };
  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    const user = await registerLocalAccount(firstName, lastName, email, password);
    setGuestMode(false); setUser(user); sessionStorage.setItem('carbonlens-auth-session', user.id); localStorage.removeItem('carbonlens-auth-remember');
    setProjects([]); saveProjects([], user.id);
    localStorage.setItem(`carbonlens-onboarding-pending-${user.id}`, 'true');
    setOnboardingRequired(true); setCreateProjectOpen(true);
    setPage('projects'); window.history.replaceState(null, '', '#projects');
  };
  const startGoogleAuth = async (mode: 'login' | 'register' | 'link') => {
    try {
      const result = await apiClient.request<{ url: string }>(`${API_ROUTES.auth.googleStart}?intent=${mode}`, { method: 'GET' });
      const url = new URL(result.url);
      if (url.hostname !== 'accounts.google.com' || url.protocol !== 'https:') throw new Error('ปลายทาง OAuth ไม่ถูกต้อง');
      window.location.assign(url.toString());
    } catch {
      throw new Error('ยังเชื่อมต่อ Google ไม่ได้ ต้องตั้งค่า Google OAuth Client ID และ backend ก่อน');
    }
  };
  const logout = () => { setGuestMode(false); setUser(null); sessionStorage.removeItem('carbonlens-auth-session'); localStorage.removeItem('carbonlens-auth-remember'); notify('ออกจากระบบแล้ว'); };
  const startGuestVisit = () => { setUser(null); setGuestMode(true); setOnboardingRequired(false); setCreateProjectOpen(false); setProjects(structuredClone(DEMO_PROJECTS)); setPage('dashboard'); window.history.replaceState(null, '', '#dashboard'); };
  const exitGuestVisit = () => { setVisitorPrompt(false); setGuestMode(false); setPage('dashboard'); window.history.replaceState(null, '', ''); };

  const saveProject = (existing: Project | null, values: ProjectFormValues) => {
    setProjects((current) => existing
      ? current.map((project) => project.id === existing.id ? { ...project, ...values, updated: 'วันนี้' } : project)
      : [{ ...values, id: `p-${Date.now()}`, updated: 'วันนี้' }, ...current]);
    notify(existing ? 'บันทึกการแก้ไขโครงการแล้ว' : 'บันทึกข้อมูลแปลงแล้ว');
    if (onboardingRequired && !existing) {
      localStorage.removeItem(`carbonlens-onboarding-pending-${user!.id}`);
      setOnboardingRequired(false); setCreateProjectOpen(false);
      setPage('dashboard'); window.history.replaceState(null, '', '#dashboard');
    }
  };
  const deleteProject = (target: Project) => { setProjects((current) => current.filter((project) => project.id !== target.id)); notify('ลบโครงการแล้ว'); };
  const saveBoundary = (id: string, boundary: NonNullable<Project['boundary']>, rai: number, parcelName: string) => {
    setProjects((current) => current.map((project) => project.id === id ? { ...project, boundary, area: rai, parcelName, updated: 'วันนี้' } : project));
    notify('บันทึก GeoJSON และพื้นที่ในเบราว์เซอร์แล้ว');
  };

  if (!user && !guestMode) return <><LoginPage onLogin={login} onRegister={register} onGoogle={startGoogleAuth} onForgot={() => notify('การรีเซ็ตรหัสผ่านจะใช้ได้เมื่อเชื่อมต่อระบบบัญชี')} onGuest={startGuestVisit} /><Toast toast={toast} onDismiss={dismissToast} /></>;
  const activeUser = user ?? GUEST_USER;

  let content: ReactNode;
  switch (page) {
    case 'dashboard': content = <DashboardPage projects={projects} userName={guestMode ? 'ผู้เยี่ยมชม' : activeUser.name} guestMode={guestMode} onAdd={() => guestMode ? notify('สมัครสมาชิกหรือเข้าสู่ระบบเพื่อเพิ่มโครงการ') : setCreateProjectOpen(true)} onNavigate={navigate} />; break;
    case 'projects': content = <ProjectsPage projects={projects} onSave={saveProject} onDelete={deleteProject} onNotify={notify} />; break;
    case 'map': content = <MapPage projects={projects} onSave={saveBoundary} onNotify={notify} />; break;
    case 'satellite': content = <SatellitePage onNotify={notify} />; break;
    case 'assessment': content = <AssessmentPage onNavigate={navigate} />; break;
    case 'carbon': content = <CarbonPage project={projects[0]} onNavigate={navigate} />; break;
    case 'field': content = <FieldPage onNotify={notify} />; break;
    case 'reports': content = <ReportsPage projects={projects} onNotify={notify} />; break;
    case 'profile': content = <ProfilePage user={activeUser} onLogout={logout} onGoogleLink={() => { void startGoogleAuth('link').catch((error) => notify(error instanceof Error ? error.message : 'ยังเชื่อมต่อ Google ไม่ได้')); }} />; break;
  }

  return <><AppShell page={page} onNavigate={navigate} onLogout={guestMode ? exitGuestVisit : logout} onNotify={notify} projects={projects} user={activeUser} guestMode={guestMode}>{content}</AppShell><Toast toast={toast} onDismiss={dismissToast} />{visitorPrompt && <div className="visitor-prompt-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVisitorPrompt(false); }}><section className="visitor-prompt" role="dialog" aria-modal="true" aria-labelledby="visitor-prompt-title"><button className="visitor-prompt-close" type="button" onClick={() => setVisitorPrompt(false)} aria-label="ปิด">×</button><ForestBuddy kind="deny"/><span className="eyebrow">น้อง CarbonLens ขอแจ้งค่ะ</span><h2 id="visitor-prompt-title">เมนูนี้สำหรับสมาชิก</h2><p>เข้าสู่ระบบหรือสมัครสมาชิก เพื่อเพิ่มและจัดการข้อมูลโครงการสวนยางพาราค่ะ</p><button className="visitor-prompt-login" type="button" onClick={exitGuestVisit}>เข้าสู่ระบบ / สมัครสมาชิก</button><button className="visitor-prompt-stay" type="button" onClick={() => setVisitorPrompt(false)}>กลับไปเยี่ยมชมต่อ</button></section></div>}{!guestMode && createProjectOpen && <ProjectDialog project={null} onClose={() => { if (onboardingRequired) { notify('กรอกและบันทึกข้อมูลแปลงก่อนเข้าสู่ภาพรวมโครงการ'); return; } setCreateProjectOpen(false); }} onSave={(values) => { saveProject(null, values); setCreateProjectOpen(false); }} />}</>;
}
