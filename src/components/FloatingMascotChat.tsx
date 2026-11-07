import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { ForestBuddy, ForestBuddyPeeker } from './ForestBuddy';

type ChatSource = { label: string; url: string };
type ChatMessage = { role: 'assistant' | 'user'; text: string; sources?: ChatSource[] };
const sources = {
  rubberFaq: { label: 'อบก. · FAQ พืชเกษตรยืนต้น เช่น ยางพารา', url: 'https://tver.tgo.or.th/database/faq/3?lang=en&page_id=2' },
  methods: { label: 'อบก. · ระเบียบวิธี T-VER ภาคเกษตร', url: 'https://tver.tgo.or.th/database/public/methodologies/1?category_id=13&lang=th' },
  registration: { label: 'อบก. · ขั้นตอนและเอกสาร T-VER', url: 'https://tver.tgo.or.th/standard-tver/project-development/project-registration' },
};
const suggestions = ['สวนยางทำ T-VER ได้ไหม?', 'ควรเตรียมข้อมูลสวนยางอะไรบ้าง?', 'ต้องยื่นเอกสารอะไรให้ อบก.?', 'ตัวเลขเครดิตในเว็บเป็นค่าจริงไหม?'];

function replyFor(question: string): Omit<ChatMessage, 'role'> {
  if (/สวนยาง|ยางพารา|เข้าเกณฑ์|เข้าร่วม|ได้ไหม/i.test(question)) return { text: 'อบก. มีข้อมูลว่าไม้ยืนต้นทางการเกษตร เช่น ยางพารา อาจพิจารณาภายใต้ระเบียบวิธีภาคเกษตรที่เกี่ยวข้องได้ค่ะ แต่ไม่ได้หมายความว่าสวนยางทุกแปลงจะเข้าเกณฑ์ ต้องตรวจชนิดกิจกรรม ขอบเขต สิทธิในที่ดิน อายุและข้อมูลการปลูก รวมถึงระเบียบวิธีฉบับปัจจุบันก่อนค่ะ', sources: [sources.rubberFaq, sources.methods] };
  if (/ข้อมูล|แปลง|พื้นที่|เอกสาร|เตรียม/i.test(question)) return { text: 'เริ่มเก็บข้อมูลชื่อและพิกัดแปลง หลักฐานสิทธิหรือการใช้ที่ดิน ปีปลูกและอายุสวน พันธุ์ยาง จำนวน/ระยะปลูก ประวัติการกรีดและการจัดการสวน ปุ๋ยหรือวัสดุปรับปรุงดิน และภาพถ่ายภาคสนามค่ะ รายการจริงขึ้นกับระเบียบวิธี และควรให้ทีมภาคสนามตรวจยืนยันก่อนทำเอกสารโครงการ', sources: [sources.registration, sources.methods] };
  if (/เอกสาร|ยื่น|อบก|ขึ้นทะเบียน|ขั้นตอน/i.test(question)) return { text: 'โดยทั่วไปต้องยืนยันระเบียบวิธีและคุณสมบัติโครงการก่อน จากนั้นเตรียมเอกสารโครงการ (PDD) แผนติดตาม หลักฐานประกอบ และรายงานจากผู้ประเมิน/ทวนสอบตามขั้นตอนของ อบก. เอกสารที่ต้องใช้ต่างกันตามประเภทโครงการ โปรดตรวจแบบฟอร์มล่าสุดจาก อบก. และให้ผู้ประเมินที่ขึ้นทะเบียนช่วยตรวจค่ะ', sources: [sources.registration, sources.methods] };
  if (/เครดิต|คำนวณ|คาร์บอน|ตัวเลข/i.test(question)) return { text: 'การคำนวณต้องอาศัยข้อมูลจริงและระเบียบวิธีที่ใช้ได้กับโครงการค่ะ ตัวเลขใน CarbonLens ตอนนี้เป็นข้อมูลจำลอง ยังไม่ใช่ผลคำนวณจริงหรือเครดิตรับรอง การรับรองทำตามกระบวนการของ อบก. และผู้ประเมินภายนอก', sources: [sources.methods] };
  if (/ดาวเทียม|ndvi|ภาพ/i.test(question)) return { text: 'หน้าดาวเทียมแสดงเพียงตัวอย่าง Sentinel-2 และ NDVI ยังไม่ได้เชื่อมภาพหรือคำนวณจากดาวเทียมจริงค่ะ ข้อมูลดังกล่าวช่วยดูสภาพพืชเบื้องต้น แต่ใช้แทนการตรวจวัดและหลักฐานภาคสนามไม่ได้' };
  return { text: 'ฉันช่วยจัดรายการข้อมูลสวนยางและชี้ไปยังข้อมูล T-VER ของ อบก. ได้ค่ะ เงื่อนไขและเอกสารต้องตรวจตามระเบียบวิธีและแบบฟอร์มฉบับล่าสุดนะคะ', sources: [sources.rubberFaq, sources.methods, sources.registration] };
}

export function FloatingMascotChat() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', text: 'สวัสดีค่ะ! ฉันคือน้อง CarbonLens 🌿 ช่วยแนะนำการเตรียมข้อมูลโครงการสวนยางได้นะคะ' }]);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, open]);
  const send = (text: string) => {
    const question = text.trim();
    if (!question) return;
    setMessages((current) => [...current, { role: 'user', text: question }, { role: 'assistant', ...replyFor(question) }]);
    setDraft('');
  };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); send(draft); };

  return <div className={`carbonlens-chat-widget ${open ? 'chat-is-open' : ''}`}>
    {open && <div className="carbonlens-chat-peeker" aria-hidden="true"><ForestBuddyPeeker /></div>}
    {open && <section className="carbonlens-chat-panel" aria-label="แชทผู้ช่วย CarbonLens" role="dialog" aria-modal="false">
      <header className="carbonlens-chat-header"><span className="carbonlens-chat-avatar"><ForestBuddy kind="chat" /></span><span><b>น้อง CarbonLens</b><small><i /> ผู้ช่วยแนะนำ · ต้นแบบ</small></span><button type="button" className="carbonlens-chat-close" onClick={() => setOpen(false)} aria-label="ปิดแชท"><X size={20} /></button></header>
      <div className="carbonlens-chat-messages" ref={listRef} aria-live="polite">{messages.map((message, index) => <div key={`${index}-${message.role}`} className={`carbonlens-chat-message ${message.role}`}><span>{message.text}</span>{message.sources && <div className="carbonlens-chat-sources"><b>แหล่งข้อมูล อบก.</b>{message.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>}</div>)}{messages.length === 1 && <div className="carbonlens-chat-suggestions">{suggestions.map((item) => <button key={item} type="button" onClick={() => send(item)}>{item}</button>)}</div>}</div>
      <div className="carbonlens-chat-note">แนวทางเบื้องต้นจากแหล่งข้อมูล อบก. · ตรวจสอบเงื่อนไขและแบบฟอร์มล่าสุดก่อนยื่น</div>
      <form className="carbonlens-chat-compose" onSubmit={submit}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="พิมพ์คำถาม..." aria-label="พิมพ์คำถาม" /><button type="submit" aria-label="ส่งข้อความ" disabled={!draft.trim()}><Send size={18} /></button></form>
    </section>}
    <button type="button" className={`carbonlens-chat-launcher ${open ? 'is-open' : ''}`} onClick={() => setOpen((value) => !value)} aria-label={open ? 'ปิดแชท CarbonLens' : 'เปิดแชท CarbonLens'} aria-expanded={open} title="คุยกับน้อง CarbonLens">
      {open ? <X size={25} /> : <><ForestBuddy kind="chat" /><span className="carbonlens-chat-ai-badge"><MessageCircle size={15} /> AI</span></>}
    </button>
  </div>;
}
