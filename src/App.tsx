import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { ProjectDialog, type ProjectFormValues } from './components/ProjectDialog';
import { Toast } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { FieldPage } from './pages/FieldPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { createProject, deleteProject as deleteProjectApi, fetchProjects, saveProjectBoundary, updateProject } from './services/projectStore';
import { hasSavedSession, registerAccount, restoreSession, signInAccount, signOut, type AuthUser } from './services/auth';
import { API_ROUTES, ApiError, apiClient } from './services/api';
import { ForestBuddy } from './components/ForestBuddy';
import { DEMO_PROJECTS } from './data/demo';
import type { PageId, Project, ToastMessage } from './types';

const GUEST_USER: AuthUser = { id: 'guest', name: 'ผู้เยี่ยมชม', firstName: 'ผู้เยี่ยมชม', lastName: '', email: 'โหมดเข้าชมเท่านั้น', role: 'member' };
const GUEST_PAGES: PageId[] = ['dashboard', 'assessment'];
// การบังคับกรอกแปลงแรกเป็นค่าของหน้าจอเท่านั้น จึงยังเก็บในเบราว์เซอร์ได้ ข้อมูลแปลงจริงอยู่ที่หลังบ้าน
const onboardingKey = (userId: string) => `carbonlens-onboarding-pending-${userId}`;

function pageFromHash(): PageId {
  const hash = window.location.hash.slice(1);
  if (hash === 'satellite' || hash === 'map' || hash === 'carbon') return 'assessment';
  if (hash === 'reports') return 'projects';
  const page = hash as PageId;
  return ['dashboard','projects','assessment','field','profile'].includes(page) ? page : 'projects';
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  // มี token ค้างไว้ ต้องถามหลังบ้านก่อนว่ายังใช้ได้ไหม ระหว่างนั้นยังไม่แสดงหน้าเข้าสู่ระบบ
  const [restoring, setRestoring] = useState(hasSavedSession);
  const [guestMode, setGuestMode] = useState(false);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [projects, setProjects] = useState<Project[]>([]);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [visitorPrompt, setVisitorPrompt] = useState(false);

  const notify = useCallback((message: string) => {
    if (guestMode && /สำหรับสมาชิก|สมัครสมาชิกหรือเข้าสู่ระบบ/.test(message)) setVisitorPrompt(true);
    else setToast({ id: Date.now(), message });
  }, [guestMode]);
  const dismissToast = useCallback(() => setToast(null), []);

  const resetSession = useCallback(() => {
    signOut(); setUser(null); setProjects([]); setOnboardingRequired(false); setCreateProjectOpen(false);
  }, []);

  /** แสดง error จากหลังบ้าน ถ้าเป็น 401 แปลว่า token หมดอายุหรือรหัสผ่านถูกเปลี่ยน ต้องเข้าสู่ระบบใหม่ */
  const reportError = useCallback((caught: unknown, fallback: string) => {
    if (caught instanceof ApiError && caught.status === 401) { resetSession(); notify(caught.message); return; }
    notify(caught instanceof Error ? caught.message : fallback);
  }, [notify, resetSession]);

  /** หลังเข้าสู่ระบบ: โหลดแปลงจากหลังบ้าน และเปิดฟอร์มแปลงแรกถ้ายังค้างอยู่ */
  // keepPage: รีเฟรชหน้าแล้วให้อยู่หน้าเดิมตาม #hash ส่วนการเข้าสู่ระบบใหม่จะเริ่มที่ภาพรวม
  const enterApp = useCallback(async (signedIn: AuthUser, loaded?: Project[], keepPage = false) => {
    const list = loaded ?? await fetchProjects();
    const pending = localStorage.getItem(onboardingKey(signedIn.id)) === 'true' && list.length === 0;
    setGuestMode(false); setUser(signedIn); setProjects(list);
    setOnboardingRequired(pending); setCreateProjectOpen(pending);
    const next = pending ? 'projects' : keepPage ? pageFromHash() : 'dashboard';
    setPage(next); window.history.replaceState(null, '', `#${next}`);
  }, []);

  useEffect(() => {
    if (!restoring) return;
    let cancelled = false;
    void (async () => {
      try {
        const restored = await restoreSession();
        if (!cancelled && restored) await enterApp(restored, undefined, true);
      } catch (caught) {
        if (!cancelled) notify(caught instanceof Error ? caught.message : 'เชื่อมต่อหลังบ้านไม่ได้');
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => { cancelled = true; };
  }, [restoring, enterApp, notify]);

  useEffect(() => { const handleHash = () => { const next = pageFromHash(); if (guestMode && !GUEST_PAGES.includes(next)) { setPage('dashboard'); window.history.replaceState(null, '', '#dashboard'); notify('หน้านี้สำหรับสมาชิก กรุณาเข้าสู่ระบบหรือสมัครสมาชิก'); } else setPage(next); }; window.addEventListener('hashchange', handleHash); return () => window.removeEventListener('hashchange', handleHash); }, [guestMode, notify]);

  const navigate = (next: PageId) => {
    if (next === 'map') next = 'assessment';
    if (next === 'reports') next = 'projects';
    if (guestMode && !GUEST_PAGES.includes(next)) { notify('หน้านี้สำหรับสมาชิก กรุณาเข้าสู่ระบบหรือสมัครสมาชิก'); return; }
    if (onboardingRequired && next !== 'projects') { notify('กรอกและบันทึกข้อมูลแปลงก่อนเข้าสู่ภาพรวมโครงการ'); return; }
    setPage(next); window.history.replaceState(null, '', `#${next}`); document.querySelector('.app-shell .main-area')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // LoginPage แสดงข้อความ error ที่โยนออกมาเอง จึงไม่ต้องจับในสองฟังก์ชันนี้
  const login = async (email: string, password: string, remember: boolean) => {
    await enterApp(await signInAccount(email, password, remember));
  };
  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    const created = await registerAccount(firstName, lastName, email, password);
    localStorage.setItem(onboardingKey(created.id), 'true');
    await enterApp(created, []);
  };
  const startGoogleAuth = async (mode: 'login' | 'register' | 'link') => {
    try {
      const result = await apiClient.request<{ url: string }>(`${API_ROUTES.auth.googleStart}?intent=${mode}`, { method: 'GET' });
      const url = new URL(result.url);
      if (url.hostname !== 'accounts.google.com' || url.protocol !== 'https:') throw new Error('ปลายทาง OAuth ไม่ถูกต้อง');
      window.location.assign(url.toString());
    } catch {
      throw new Error('ยังเชื่อมต่อ Google ไม่ได้ หลังบ้านยังไม่มีระบบเข้าสู่ระบบด้วย Google');
    }
  };
  const logout = () => { setGuestMode(false); resetSession(); notify('ออกจากระบบแล้ว'); };
  const startGuestVisit = () => { setUser(null); setGuestMode(true); setOnboardingRequired(false); setCreateProjectOpen(false); setProjects(structuredClone(DEMO_PROJECTS)); setPage('dashboard'); window.history.replaceState(null, '', '#dashboard'); };
  const exitGuestVisit = () => { setVisitorPrompt(false); setGuestMode(false); setProjects([]); setPage('dashboard'); window.history.replaceState(null, '', ''); };

  /** บันทึกโครงการที่หลังบ้าน คืน true เมื่อสำเร็จ ฟอร์มจะปิดเฉพาะตอนสำเร็จ ข้อมูลที่กรอกจึงไม่หาย */
  const saveProject = async (existing: Project | null, values: ProjectFormValues): Promise<boolean> => {
    try {
      const saved = existing ? await updateProject(existing.id, values) : await createProject(values);
      setProjects((current) => existing ? current.map((project) => project.id === saved.id ? saved : project) : [saved, ...current]);
      notify(existing ? 'บันทึกการแก้ไขโครงการแล้ว' : 'บันทึกข้อมูลแปลงแล้ว');
      if (onboardingRequired && !existing && user) {
        localStorage.removeItem(onboardingKey(user.id));
        setOnboardingRequired(false); setCreateProjectOpen(false);
        setPage('dashboard'); window.history.replaceState(null, '', '#dashboard');
      }
      return true;
    } catch (caught) {
      reportError(caught, 'บันทึกข้อมูลไม่สำเร็จ');
      return false;
    }
  };
  const deleteProject = async (target: Project) => {
    try {
      await deleteProjectApi(target.id);
      setProjects((current) => current.filter((project) => project.id !== target.id));
      notify('ลบโครงการแล้ว');
    } catch (caught) { reportError(caught, 'ลบโครงการไม่สำเร็จ'); }
  };
  // พื้นที่ (rai) ที่หน้าแผนที่ส่งมาเป็นค่าประมาณจากเบราว์เซอร์ ไม่ได้ใช้ หลังบ้านคำนวณจากขอบเขตเอง
  const saveBoundary = async (id: string, boundary: NonNullable<Project['boundary']>, _rai: number, parcelName: string) => {
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    try {
      const saved = await saveProjectBoundary(project, boundary, parcelName);
      setProjects((current) => current.map((item) => item.id === saved.id ? saved : item));
      notify(`บันทึกขอบเขตแล้ว พื้นที่จากหลังบ้าน ${saved.area.toLocaleString('th-TH', { maximumFractionDigits: 2 })} ไร่`);
    } catch (caught) { reportError(caught, 'บันทึกขอบเขตไม่สำเร็จ'); }
  };

  if (restoring) return <section className="login-screen" aria-busy="true"><p style={{ margin: 'auto' }}>กำลังตรวจสอบการเข้าสู่ระบบ…</p></section>;
  if (!user && !guestMode) return <><LoginPage onLogin={login} onRegister={register} onGoogle={startGoogleAuth} onForgot={() => notify('ระบบยังไม่มีการรีเซ็ตรหัสผ่านทางอีเมล กรุณาติดต่อผู้ดูแลระบบ')} onGuest={startGuestVisit} /><Toast toast={toast} onDismiss={dismissToast} /></>;
  const activeUser = user ?? GUEST_USER;

  let content: ReactNode;
  switch (page) {
    case 'dashboard': content = <DashboardPage projects={projects} userName={guestMode ? 'ผู้เยี่ยมชม' : activeUser.name} guestMode={guestMode} onAdd={() => guestMode ? notify('สมัครสมาชิกหรือเข้าสู่ระบบเพื่อเพิ่มโครงการ') : setCreateProjectOpen(true)} onNavigate={navigate} />; break;
    case 'projects': content = <ProjectsPage projects={projects} onSave={saveProject} onDelete={(project) => void deleteProject(project)} onNavigate={navigate} />; break;
    case 'map':
    case 'assessment': content = <AssessmentPage projects={projects} onSaveBoundary={(...args) => void saveBoundary(...args)} onNotify={notify} guestMode={guestMode} onNavigate={navigate} />; break;
    case 'field': content = <FieldPage onNotify={notify} />; break;
    case 'reports': content = <ProjectsPage projects={projects} onSave={saveProject} onDelete={(project) => void deleteProject(project)} onNavigate={navigate} />; break;
    case 'profile': content = <ProfilePage user={activeUser} onLogout={logout} onGoogleLink={() => { void startGoogleAuth('link').catch((error) => notify(error instanceof Error ? error.message : 'ยังเชื่อมต่อ Google ไม่ได้')); }} />; break;
  }

  return <><AppShell page={page} onNavigate={navigate} onLogout={guestMode ? exitGuestVisit : logout} onNotify={notify} projects={projects} user={activeUser} guestMode={guestMode}>{content}</AppShell><Toast toast={toast} onDismiss={dismissToast} />{visitorPrompt && <div className="visitor-prompt-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVisitorPrompt(false); }}><section className="visitor-prompt" role="dialog" aria-modal="true" aria-labelledby="visitor-prompt-title"><button className="visitor-prompt-close" type="button" onClick={() => setVisitorPrompt(false)} aria-label="ปิด">×</button><ForestBuddy kind="deny"/><span className="eyebrow">น้อง CarbonLens ขอแจ้งค่ะ</span><h2 id="visitor-prompt-title">เมนูนี้สำหรับสมาชิก</h2><p>เข้าสู่ระบบหรือสมัครสมาชิก เพื่อเพิ่มและจัดการข้อมูลโครงการสวนยางพาราค่ะ</p><button className="visitor-prompt-login" type="button" onClick={exitGuestVisit}>เข้าสู่ระบบ / สมัครสมาชิก</button><button className="visitor-prompt-stay" type="button" onClick={() => setVisitorPrompt(false)}>กลับไปเยี่ยมชมต่อ</button></section></div>}{!guestMode && createProjectOpen && <ProjectDialog project={null} onClose={() => { if (onboardingRequired) { notify('กรอกและบันทึกข้อมูลแปลงก่อนเข้าสู่ภาพรวมโครงการ'); return; } setCreateProjectOpen(false); }} onSave={async (values) => { if (await saveProject(null, values)) setCreateProjectOpen(false); }} />}</>;
}
