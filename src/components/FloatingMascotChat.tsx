import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { ForestBuddy, ForestBuddyPeeker } from './ForestBuddy';

type ChatSource = { label: string; url: string };
type ChatMessage = { role: 'assistant' | 'user'; text: string; sources?: ChatSource[] };
const sources = {
  standardRegistration: { label: 'ออบก. · เอกสารขึ้นทะเบียน Standard T-VER', url: 'https://tver.tgo.or.th/standard-tver/project-development/project-registration' },
  premiumRegistration: { label: 'ออบก. · เอกสารขึ้นทะเบียน Premium T-VER', url: 'https://tver.tgo.or.th/premium-tver/project-development/project-registration' },
  standardMethods: { label: 'ออบก. · ระเบียบวิธีภาคป่าไม้ Standard T-VER', url: 'https://tver.tgo.or.th/database/public/methodologies/1?category_id=13&lang=th' },
  premiumMethods: { label: 'ออบก. · ระเบียบวิธีภาคป่าไม้ Premium T-VER', url: 'https://tver.tgo.or.th/database/public/methodologies/2?category_id=28&lang=th' },
  forestFaq: { label: 'ออบก. · คำถามเรื่องโครงการป่าไม้และป่าชุมชน', url: 'https://tver.tgo.or.th/database/faq/4?lang=th&page_id=2' },
  premiumForms: { label: 'ออบก. · แบบฟอร์ม Premium T-VER', url: 'https://tver.tgo.or.th/database/public-form/premium-form?lang=th' },
  standardIssuance: { label: 'ออบก. · ขั้นตอนขอรับรองเครดิต Standard T-VER', url: 'https://tver.tgo.or.th/standard-tver/project-development/issuance' },
  premiumIssuance: { label: 'ออบก. · ขั้นตอนขอรับรองเครดิต Premium T-VER', url: 'https://tver.tgo.or.th/en/premium-tver/project-development/procedure-for-carbon-credits-issuance' },
};
const suggestions = ['ป่าชุมชนเข้าร่วม T-VER ได้ไหม?', 'ขึ้นทะเบียนต้องเตรียมเอกสารอะไร?', 'ขั้นตอนยื่น อบก. มีอะไรบ้าง?', 'ขอรับรองเครดิตใช้เอกสารอะไร?'];

function replyFor(question: string): Omit<ChatMessage, 'role'> {
  if (/ป่าชุมชน|พื้นที่.*(เป็นป่า|ป่าอยู่แล้ว)|ปลูกป่า.*(เดิม|อยู่แล้ว)|เข้า.*(โครงการ|t.ver)|เข้าเกณฑ์|มีสิทธิ์|ได้ไหม/i.test(question)) return { text: 'ป่าชุมชนอาจทำโครงการ Premium T-VER ได้ หากเข้าเงื่อนไขของระเบียบวิธี เช่น พื้นที่เป็นป่าเสื่อมโทรมและมีแนวโน้มเป็นป่าเสื่อมโทรมค่ะ ส่วนกิจกรรมปลูกหรือฟื้นฟูป่าใน Premium T-VER มีเงื่อนไขเฉพาะ โดย FAQ ของ อบก. ระบุว่าพื้นที่ปลูกป่าต้องไม่เข้าข่ายเป็นป่าและยังไม่เคยมีกิจกรรมปลูกต้นไม้มาก่อน ต้องตรวจประเภทกิจกรรมและระเบียบวิธีให้ตรงกับสภาพพื้นที่จริงก่อนสรุปสิทธิ์นะคะ.', sources: [sources.forestFaq, sources.premiumMethods] };
  if (/standard.*premium|premium.*standard|ต่างกัน/i.test(question)) return { text: 'ทั้ง Standard T-VER และ Premium T-VER ต้องใช้ระเบียบวิธีที่ตรงกับกิจกรรม ติดตามข้อมูล และผ่านการตรวจโดยผู้ประเมินภายนอก (VVB) ค่ะ รายการแบบฟอร์มและรายงานประกอบต่างกัน เช่น Standard ใช้รายงานผลประโยชน์ร่วม (Co-benefit) ส่วน Premium ใช้รายงานการพัฒนาที่ยั่งยืนและการป้องกันผลกระทบ (SD & Safeguards) และอาจมีรายงานความเสี่ยงความไม่ถาวรสำหรับโครงการดูดซับ ต้องเลือกโปรแกรมตามเกณฑ์และแบบฟอร์มปัจจุบันของ อบก.', sources: [sources.standardRegistration, sources.premiumRegistration] };
  if (/ระเบียบวิธี|methodolog|วิธีคำนวณ|ปลูกป่า|ฟื้นฟูป่า|ป่าเสื่อมโทรม/i.test(question)) return { text: 'ระเบียบวิธีภาคป่าไม้มีหลายกิจกรรมค่ะ ตัวอย่าง Standard ได้แก่ การปลูกป่าอย่างยั่งยืน และการลดการทำลายป่า/ความเสื่อมโทรมพร้อมเพิ่มการกักเก็บคาร์บอน ส่วน Premium มีระเบียบวิธีสำหรับปลูกป่า (ยกเว้นพื้นที่ชุ่มน้ำ) การลดการทำลายป่าและความเสื่อมโทรม และการปรับปรุงการจัดการป่าไม้ เลือกตามกิจกรรม สภาพพื้นที่ และเงื่อนไขฉบับล่าสุด; ระบบต้นแบบนี้ยังไม่เลือกหรือคำนวณแทน อบก. ค่ะ', sources: [sources.standardMethods, sources.premiumMethods] };
  if (/เอกสาร|เตรียม.*อะไร|เช็กลิสต์|checklist/i.test(question) && /เครดิต|รับรอง|ออกเครดิต|issuance/i.test(question)) return { text: 'เอกสารขอรับรองเครดิตหลังติดตามโครงการแล้ว โดยทั่วไปต้องมีใบคำขอ รายงานติดตามผลก๊าซเรือนกระจก (MR) ที่ผ่านการทวนสอบ ไฟล์คำนวณ Excel และ Verification Report ค่ะ สำหรับ Premium ยังมีรายงาน SD & Safeguards Monitoring และรายงานความเสี่ยงความไม่ถาวรถ้าระเบียบวิธี/โครงการกำหนด ตรวจแบบฟอร์มล่าสุดและเงื่อนไขเฉพาะของโครงการก่อนยื่นนะคะ.', sources: [sources.standardIssuance, sources.premiumIssuance] };
  if (/เอกสาร|เตรียม.*อะไร|เช็กลิสต์|checklist/i.test(question)) return { text: 'เอกสารขึ้นทะเบียนขึ้นกับโปรแกรมค่ะ Standard T-VER แบบเดี่ยว/ควบรวมใช้ใบคำขอ, PDD ที่ผ่าน Validation, ไฟล์คำนวณ Excel, Validation Report และ Co-benefit Report ส่วน Premium ใช้ใบคำขอ, PDD ที่ผ่าน Validation, Excel, Validation Report และรายงาน SD & Safeguards; โครงการดูดซับอาจต้องมีรายงาน Non-permanence Risk ที่ผ่าน Validation ด้วย ใช้แบบฟอร์มล่าสุดจาก อบก. และให้ VVB ตรวจเอกสารที่ต้องรับรองค่ะ.', sources: [sources.standardRegistration, sources.premiumRegistration, sources.premiumForms] };
  if (/ขั้นตอน|ยื่น|ขึ้นทะเบียน|เริ่มโครงการ|ส่ง.*อบก|สมัคร.*โครงการ/i.test(question)) return { text: 'ภาพรวมการขึ้นทะเบียนคือ 1) ตรวจว่ากิจกรรมและพื้นที่เข้าเงื่อนไขระเบียบวิธี 2) สำหรับ Premium ส่ง MoC ก่อนเริ่มโครงการ 3) จัดทำ PDD แผนติดตาม และเอกสารประกอบ/รับฟังผู้มีส่วนได้ส่วนเสียตามเกณฑ์ 4) ให้ VVB ที่ขึ้นทะเบียนกับ อบก. ทำ Validation และออกรายงาน 5) ยื่นแบบคำขอพร้อมเอกสารและไฟล์คำนวณตามแบบฟอร์ม อบก. ค่ะ การขึ้นทะเบียนยังไม่ใช่การรับรองเครดิต ต้องติดตามผลและยื่นขอรับรองเครดิตแยกภายหลัง.', sources: [sources.standardRegistration, sources.premiumRegistration] };
  if (/v.v.b|ผู้ประเมิน|validation|verification|ทวนสอบ|ตรวจสอบภายนอก/i.test(question)) return { text: 'VVB คือผู้ประเมิน/ทวนสอบภายนอกที่ขึ้นทะเบียนตามเกณฑ์ของ อบก. ค่ะ ขั้น Validation ใช้ตรวจ PDD และเอกสารเพื่อประกอบการขอขึ้นทะเบียน ส่วน Verification ใช้ตรวจรายงานติดตามผล (MR) เพื่อประกอบการขอรับรองเครดิต เลือกหน่วยงานจากรายชื่อ VVB ปัจจุบันของ อบก. และตรวจขอบข่ายที่รับงานป่าไม้ค่ะ.', sources: [sources.standardRegistration, sources.premiumIssuance] };
  if (/ข้อกำหนด|เงื่อนไข|เกณฑ์/i.test(question)) return { text: 'เกณฑ์ขึ้นทะเบียน T-VER โดยสรุปคือต้องทำตามกฎหมาย ใช้ระเบียบวิธีที่ตรงกับกิจกรรม มีแผนติดตามผล และผ่าน Validation โดย VVB ค่ะ เกณฑ์เพิ่มเติมจะแตกต่างกันตาม Standard/Premium และระเบียบวิธี เช่น Additionality หรือการรับฟังผู้มีส่วนได้ส่วนเสีย จึงควรตรวจเกณฑ์เฉพาะของประเภทโครงการก่อนเริ่มนะคะ.', sources: [sources.standardRegistration, sources.premiumRegistration] };
  if (/อบก|รับรอง|ยื่น|ประเมิน/i.test(question)) return { text: 'CarbonLens ช่วยจัดระเบียบข้อมูลก่อนประเมินได้ค่ะ การขึ้นทะเบียนและการรับรองคาร์บอนเครดิตเป็นคนละขั้นตอน: ต้องเลือกโปรแกรมและระเบียบวิธีให้ตรง เตรียมเอกสารตามแบบ อบก. และผ่านการตรวจโดย VVB ก่อนยื่น คำตอบของฉันเป็นแนวทางเบื้องต้น โปรดตรวจลิงก์ทางการก่อนดำเนินการค่ะ', sources: [sources.standardRegistration, sources.premiumRegistration] };
  if (/เครดิต|คำนวณ|คาร์บอน/i.test(question)) return { text: 'การคำนวณต้องใช้ข้อมูลพื้นที่ ระเบียบวิธี และข้อมูลภาคสนามประกอบค่ะ ตัวเลขในต้นแบบนี้เป็นข้อมูลจำลอง ยังไม่ใช่ผลคำนวณจริงหรือเครดิตที่รับรองแล้ว', sources: [sources.standardMethods, sources.premiumMethods] };
  if (/ข้อมูล|แปลง|พื้นที่|เอกสาร/i.test(question)) return { text: 'เริ่มจากรวบรวมชื่อโครงการ ที่ตั้ง ขอบเขตพื้นที่ สิทธิการใช้พื้นที่ ประเภทป่า กิจกรรม และหลักฐานที่มีค่ะ ข้อมูลสิทธิพื้นที่และสภาพป่าควรตรวจสอบกับผู้รับผิดชอบและทีมภาคสนามก่อนจัดทำ PDD', sources: [sources.standardRegistration, sources.premiumRegistration] };
  if (/ดาวเทียม|ndvi|ภาพ/i.test(question)) return { text: 'หน้า “ภาพดาวเทียม” ในต้นแบบแสดงตัวอย่าง Sentinel-2 และ NDVI เท่านั้น ยังไม่ได้เชื่อมข้อมูลภาพหรือคำนวณจากดาวเทียมจริงค่ะ' };
  return { text: 'ฉันช่วยแนะนำเรื่องเกณฑ์ป่าไม้ ระเบียบวิธี เอกสารขึ้นทะเบียน และขั้นตอนขอรับรองเครดิตตามข้อมูล อบก. ได้ค่ะ ลองเลือกคำถามแนะนำ หรือพิมพ์หัวข้อที่อยากทราบได้เลยนะคะ', sources: [sources.standardRegistration, sources.premiumRegistration, sources.premiumForms] };
}

export function FloatingMascotChat() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', text: 'สวัสดีค่ะ! ฉันคือน้อง CarbonLens 🌿 ช่วยแนะนำการเตรียมข้อมูลโครงการป่าไม้ได้นะคะ' }]);
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
