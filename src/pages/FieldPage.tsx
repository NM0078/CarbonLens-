import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Paperclip, Upload } from 'lucide-react';
import { INITIAL_FIELD_ITEMS } from '../data/demo';
import { Button, Notice, PageHeader, Panel } from '../components/ui';
import type { FieldItem, VerificationStatus } from '../types';

const STATUSES: VerificationStatus[] = ['ยังไม่ตรวจสอบ','รอตรวจสอบ','ตรวจสอบแล้ว','ต้องแก้ไขข้อมูล'];
const STORAGE_KEY = 'carbonlens-field-checklist-v1';
function loadItems(): FieldItem[] { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return INITIAL_FIELD_ITEMS; const saved = JSON.parse(raw) as FieldItem[]; return saved.map((item) => ({ ...item, status: STATUSES.includes(item.status) ? item.status : 'ยังไม่ตรวจสอบ' })); } catch { return INITIAL_FIELD_ITEMS; } }

export function FieldPage({ onNotify }: { onNotify: (message: string) => void }) {
  const [items, setItems] = useState<FieldItem[]>(loadItems);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const grouped = useMemo(() => [...new Set(items.map((item) => item.category))].map((category) => ({ category, rows: items.filter((item) => item.category === category) })), [items]);
  const done = items.filter((item) => item.status === 'ตรวจสอบแล้ว').length;
  const update = (id: string, status: VerificationStatus) => setItems((current) => { const next = current.map((item) => item.id === id ? { ...item, status } : item); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; });
  const exportChecklist = () => { const rows = [['หมวด','รายการตรวจสอบ','สถานะ'], ...items.map((item) => [item.category,item.title,item.status])]; const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"','""')}"`).join(',')).join('\r\n')}`; const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.download='carbonlens-field-checklist.csv';link.click();URL.revokeObjectURL(link.href); };

  return <section className="page active">
    <PageHeader eyebrow="เตรียมข้อมูลความพร้อม" title="รายการตรวจสอบภาคสนาม" subtitle="รวบรวมข้อมูลที่ต้องยืนยันโดยทีมสำรวจในพื้นที่" action={<Button onClick={exportChecklist}>↓ ส่งออกรายการ</Button>} />
    <Notice>รายการนี้เป็นแนวทางเบื้องต้น ควรปรับให้ตรงกับระเบียบวิธีและข้อกำหนดของโครงการจริง</Notice>
    <div className="field-summary"><div><span className="field-summary-icon">☷</span><span><small>รายการทั้งหมด</small><b>{items.length} รายการ</b></span></div><div><span className="field-summary-icon done-icon"><Check size={13} /></span><span><small>ตรวจสอบแล้ว</small><b>{done} รายการ</b></span></div><div><span className="field-summary-icon pending-icon">◷</span><span><small>ยังต้องดำเนินการ</small><b>{items.length - done} รายการ</b></span></div><div className="field-progress"><div className="progress"><i style={{ width: `${items.length ? done / items.length * 100 : 0}%` }} /></div><small>ความคืบหน้า {items.length ? Math.round(done / items.length * 100) : 0}%</small></div></div>
    <div className="field-groups">{grouped.map((group) => <Panel key={group.category} title={group.category} subtitle={group.category === 'ขอบเขตและสิทธิ์พื้นที่' ? 'ตรวจสอบแนวเขตและคุณสมบัติพื้นที่' : group.category === 'สภาพสวนยางและการจัดการ' ? 'ข้อมูลแปลงตัวอย่างและการจัดการสวนยาง' : 'กิจกรรมการดำเนินงานและติดตาม'} action={<><span className="group-count">{group.rows.filter((item) => item.status === 'ตรวจสอบแล้ว').length}/{group.rows.length}</span><button className="collapse-btn" onClick={() => setCollapsed((current) => current.includes(group.category) ? current.filter((entry) => entry !== group.category) : [...current, group.category])} aria-label="ยุบ/ขยายรายการ">{collapsed.includes(group.category) ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</button></>} className="field-group">
      {!collapsed.includes(group.category) && <div className="checklist">{group.rows.map((item) => <div className={`check-row ${item.status === 'ตรวจสอบแล้ว' ? 'checked' : ''}`} key={item.id}><span className={`custom-check ${item.status === 'ตรวจสอบแล้ว' ? 'is-checked' : ''}`}>{item.status === 'ตรวจสอบแล้ว' && <Check size={11} />}</span><span className="field-item-copy"><b>{item.title}</b><small>{item.description}</small></span><select className={`verification-state state-${STATUSES.indexOf(item.status)}`} value={item.status} onChange={(e) => update(item.id, e.target.value as VerificationStatus)} aria-label={`สถานะ: ${item.title}`}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select><label className="attach-btn"><input type="file" hidden onChange={(e) => { if (e.target.files?.[0]) onNotify(`เลือกไฟล์ ${e.target.files[0].name} แล้ว · จะอัปโหลดเมื่อเชื่อมต่อ backend`); }} /><Paperclip size={12} />แนบไฟล์</label></div>)}</div>}
    </Panel>)}</div>
    <p className="page-footnote"><Upload size={13} /> เอกสารและภาพถ่ายอยู่ในอุปกรณ์และยังไม่ถูกส่งขึ้นระบบ</p>
  </section>;
}
