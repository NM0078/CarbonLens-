import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Leaf, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui';
import { authForestPhotos } from '../data/authForestPhotos';

type Mode = 'login' | 'register';
type Props = {
  onLogin: (email: string, password: string, remember: boolean) => Promise<void>;
  onRegister: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  onGoogle: (mode: Mode) => Promise<void>;
  onForgot: () => void;
  onGuest: () => void;
};

export function LoginPage({ onLogin, onRegister, onGoogle, onForgot, onGuest }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const ambientAudio = useRef<HTMLAudioElement>(null);
  const forestVideoA = useRef<HTMLVideoElement>(null);
  const forestVideoB = useRef<HTMLVideoElement>(null);
  const photoIndexRef = useRef(0);
  const activeSlotRef = useRef(0);
  const transitionRef = useRef<(index: number) => void>(() => {});
  const photo = authForestPhotos[photoIndex];

  useEffect(() => {
    const slots = [forestVideoA.current, forestVideoB.current];
    if (!slots[0] || !slots[1]) return;
    let timer = 0;
    let mounted = true;
    const preload = (slot: HTMLVideoElement, index: number) => {
      const item = authForestPhotos[index];
      if (slot.dataset.photo !== item.video) { slot.dataset.photo = item.video; slot.src = item.video; slot.load(); }
    };
    preload(slots[0], 0);
    preload(slots[1], 1 % authForestPhotos.length);
    let current = 0;
    let active = 0;
    const scheduleNext = () => { window.clearTimeout(timer); timer = window.setTimeout(() => transition((current + 1) % authForestPhotos.length), 4000); };
    const activateInitial = () => { if (!mounted) return; slots[0]!.classList.add('is-active'); slots[0]!.play().catch(() => {}); scheduleNext(); };
    const transition = (requestedIndex: number) => {
      if (!mounted) return;
      window.clearTimeout(timer);
      const target = (requestedIndex + authForestPhotos.length) % authForestPhotos.length;
      const nextSlot = active === 0 ? 1 : 0;
      const candidate = slots[nextSlot]!;
      const previous = slots[active]!;
      let switched = false;
      const failed = () => {
        candidate.removeEventListener('canplay', ready);
        timer = window.setTimeout(() => transition((target + 1) % authForestPhotos.length), 900);
      };
      const ready = () => {
        if (switched || !mounted) return;
        switched = true;
        candidate.removeEventListener('error', failed);
        candidate.removeEventListener('canplay', ready);
        candidate.play().catch(() => {});
        candidate.classList.add('is-active');
        previous.classList.remove('is-active');
        active = nextSlot; current = target;
        activeSlotRef.current = nextSlot; photoIndexRef.current = target;
        setPhotoIndex(target);
        window.setTimeout(() => { if (mounted) { previous.pause(); preload(previous, (target + 1) % authForestPhotos.length); } }, 750);
        scheduleNext();
      };
      candidate.addEventListener('canplay', ready);
      candidate.addEventListener('error', failed, { once: true });
      preload(candidate, target);
      if (candidate.readyState >= 3) ready();
    };
    transitionRef.current = transition;
    slots[0]!.addEventListener('canplay', activateInitial, { once: true });
    slots[0]!.addEventListener('error', () => transition(1), { once: true });
    if (slots[0]!.readyState >= 3) activateInitial();
    return () => { mounted = false; window.clearTimeout(timer); transitionRef.current = () => {}; };
  }, []);

  const movePhoto = (direction: number) => transitionRef.current((photoIndexRef.current + direction + authForestPhotos.length) % authForestPhotos.length);

  const toggleSound = async () => {
    const audio = ambientAudio.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); setSoundOn(true); }
      catch { setError('เปิดเสียงไม่ได้ กรุณาลองอีกครั้ง'); }
    } else { audio.pause(); setSoundOn(false); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === 'login') await onLogin(String(form.get('email')), String(form.get('password')), remember);
      else {
        const password = String(form.get('password'));
        if (password !== String(form.get('confirmPassword'))) throw new Error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        await onRegister(String(form.get('firstName')), String(form.get('lastName')), String(form.get('email')), password);
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง'); }
    finally { setBusy(false); }
  };

  const changeMode = (next: Mode) => { setMode(next); setError(''); };

  return <section className="login-screen">
    <div className="login-art"><video ref={forestVideoA} className="login-art-video is-active" autoPlay muted playsInline aria-label={`วิดีโอ ${photo.caption}`} /><video ref={forestVideoB} className="login-art-video" autoPlay muted playsInline aria-hidden="true" /><div className="login-art-shade" aria-hidden="true" /><div className="login-art-motion" aria-hidden="true" /><div className="login-brand"><span className="brand-mark">C<span>↗</span></span><span className="brand-name">carbon<span>lens</span></span></div><div className="login-landscape"><i className="login-sun" /><i className="login-hill hill-a" /><i className="login-hill hill-b" /><i className="login-tree tree-a">♧</i><i className="login-tree tree-b">♧</i></div><div className="login-copy"><span>FOREST PROJECT INTELLIGENCE</span><h1>มองเห็นศักยภาพ<br />ของผืนป่า</h1></div><small className="login-foot">CARBONLENS · PROTOTYPE</small><div className="login-photo-controls" aria-label="เลื่อนวิดีโอป่าไม้"><button type="button" onClick={() => movePhoto(-1)} aria-label="วิดีโอก่อนหน้า">‹</button><button type="button" onClick={() => movePhoto(1)} aria-label="วิดีโอถัดไป">›</button></div><button type="button" className="login-sound-toggle" onClick={toggleSound} aria-label={soundOn ? 'ปิดเสียงธรรมชาติ' : 'เปิดเสียงธรรมชาติ'} title={soundOn ? 'ปิดเสียง' : 'เปิดเสียง'}>{soundOn ? <VolumeX size={17} strokeWidth={2.2} /> : <Volume2 size={17} strokeWidth={2.2} />}</button><audio ref={ambientAudio} src="https://upload.wikimedia.org/wikipedia/commons/3/38/Birds_forest.ogg" loop preload="none" /><small className="login-photo-credit"><a href={photo.href} target="_blank" rel="noreferrer">{photo.caption} · {photo.credit}</a></small></div>
    <form className="login-form auth-form" onSubmit={submit}>
      <span className="login-lock"><Leaf size={20} /></span><span className="eyebrow">สำหรับหน่วยงานและผู้พัฒนาโครงการ</span>
      <h2>{mode === 'login' ? 'ยินดีต้อนรับ' : 'สร้างบัญชี CarbonLens'}</h2><p>{mode === 'login' ? 'เข้าสู่ระบบด้วยบัญชีที่ลงทะเบียนไว้' : 'สมัครเพื่อเริ่มจัดการโครงการป่าไม้'}</p>
      {mode === 'register' && <div className="auth-name-row"><label htmlFor="authFirstName">ชื่อ<input id="authFirstName" name="firstName" type="text" autoComplete="given-name" placeholder="ชื่อ" required minLength={1} maxLength={50} /></label><label htmlFor="authLastName">นามสกุล<input id="authLastName" name="lastName" type="text" autoComplete="family-name" placeholder="นามสกุล" required minLength={1} maxLength={80} /></label></div>}
      <label htmlFor="authEmail">อีเมล<input id="authEmail" name="email" type="email" autoComplete="email" placeholder="name@organization.org" required maxLength={254} /></label>
      <label htmlFor="authPassword">รหัสผ่าน<span className="password-wrap"><input id="authPassword" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'login' ? 'กรอกรหัสผ่าน' : 'อย่างน้อย 8 ตัวอักษร'} required minLength={mode === 'register' ? 8 : 1} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
      {mode === 'register' && <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน<input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="กรอกรหัสผ่านอีกครั้ง" required minLength={8} /></label>}
      {mode === 'login' && <div className="login-options"><label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> จดจำฉัน</label><button type="button" onClick={onForgot}>ลืมรหัสผ่าน?</button></div>}
      {error && <div className="auth-error" role="alert">{error}</div>}
      <Button variant="primary" className="login-submit" type="submit" disabled={busy}>{busy ? 'กำลังตรวจสอบ…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'} <span>→</span></Button>
      <div className="auth-divider"><span>หรือ</span></div>
      <Button variant="secondary" className="google-auth" type="button" onClick={async () => { setError(''); setBusy(true); try { await onGoogle(mode); } catch (caught) { setError(caught instanceof Error ? caught.message : 'ยังเชื่อมต่อ Google ไม่ได้'); } finally { setBusy(false); } }} disabled={busy}><b className="google-mark">G</b>{mode === 'login' ? 'เข้าสู่ระบบด้วย Google' : 'สมัคร / เชื่อมบัญชี Google'}</Button>
      <Button variant="secondary" className="guest-entry" type="button" onClick={onGuest}>เยี่ยมชมตัวอย่างโดยไม่เข้าสู่ระบบ</Button>
      <div className="auth-switch">{mode === 'login' ? <>ยังไม่มีบัญชีใช่ไหม? <button type="button" onClick={() => changeMode('register')}>ลงทะเบียน</button></> : <>มีบัญชีแล้ว? <button type="button" onClick={() => changeMode('login')}>เข้าสู่ระบบ</button></>}</div>
      <div className="login-demo"><b><ShieldCheck size={14} /> บัญชีสาธิตในเบราว์เซอร์นี้</b><span>ต้องลงทะเบียนก่อนเข้าสู่ระบบ ข้อมูลบัญชีไม่ส่งไปยังเซิร์ฟเวอร์</span></div>
      <small className="login-legal">ยังไม่ใช่ระบบยืนยันตัวตนสำหรับใช้งานจริง · Google OAuth ต้องตั้งค่า Client ID และ backend</small>
    </form>
  </section>;
}
