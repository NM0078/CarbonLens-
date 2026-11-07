import { ArrowRight, CheckCircle2, CircleAlert, ClipboardCheck } from 'lucide-react';
import type { Project } from '../types';
import { Button, Notice, PageHeader, Panel } from '../components/ui';
import { MapPage } from './MapPage';

export function AssessmentPage({ projects, project, onSaveBoundary, onNotify, guestMode, onNavigate }: { projects: Project[]; project?: Project; onSaveBoundary: (id: string, feature: NonNullable<Project['boundary']>, rai: number, parcelName: string) => void; onNotify: (message: string) => void; guestMode: boolean; onNavigate: (page: 'field') => void }) {
  const items = [
    { title: 'ขอบเขตแปลง', detail: 'ตำแหน่งและพื้นที่ของสวนยาง', ready: Boolean(project?.boundary) },
    { title: 'สิทธิ์การใช้พื้นที่', detail: 'เอกสารหรือหลักฐานสิทธิ์ที่ดิน', ready: Boolean(project?.landStatus || project?.landEvidence) },
    { title: 'ข้อมูลสวนยาง', detail: 'ปีปลูก พันธุ์ยาง และสภาพแปลง', ready: Boolean(project?.plantingYear || project?.dominantSpecies || project?.forestCondition) },
    { title: 'หลักฐานภาคสนาม', detail: 'บันทึกการสำรวจและภาพถ่าย', ready: Boolean(project?.fieldEvidence) },
  ];
  const readyCount = items.filter((item) => item.ready).length;

  return <section className="page active">
    <PageHeader eyebrow={`${project?.name ?? 'โครงการสวนยาง'} · ภาพรวมการประเมิน`} title="ประเมินโครงการและคาร์บอน" subtitle="ดูภาพถ่ายดาวเทียม กำหนดพื้นที่ และตรวจความพร้อมสำหรับประเมินคาร์บอนเครดิตในหน้าเดียว" action={<span className="estimate-tag large-tag">ข้อมูลตัวอย่าง</span>} />
    <Notice>ยังไม่มีการเชื่อมต่อข้อมูล Sentinel-2, NDVI หรือระบบคำนวณคาร์บอนจริง ภาพและการประเมินใช้ประกอบการเตรียมข้อมูลเท่านั้น ไม่ใช่เครดิตรับรอง</Notice>
    <MapPage projects={projects} onSave={onSaveBoundary} onNotify={onNotify} guestMode={guestMode} embedded />
    <div className="assessment-grid">
      <Panel title="ความพร้อมของข้อมูล" subtitle={`มีข้อมูลเบื้องต้น ${readyCount} จาก ${items.length} รายการ`} action={<span className="mock-tag">ตรวจจากข้อมูลที่บันทึก</span>} className="score-panel">
        <div className="simple-readiness-list">{items.map((item) => <div className="simple-readiness-row" key={item.title}><span className={item.ready ? 'is-ready' : 'is-pending'}>{item.ready ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}</span><span><b>{item.title}</b><small>{item.detail}</small></span><strong>{item.ready ? 'มีข้อมูล' : 'รอข้อมูล'}</strong></div>)}</div>
      </Panel>
      <Panel title="คาร์บอนเครดิตเบื้องต้น" subtitle="ยังไม่มีผลคำนวณสำหรับโครงการนี้" action={<span className="estimate-tag">ยังไม่ประเมิน</span>} className="simple-carbon-card">
        <div className="simple-carbon-value"><span>ปริมาณคาร์บอน</span><b>— <small>tCO₂e</small></b></div>
        <p>ต้องตรวจข้อมูลจริงและเลือกวิธีการที่เหมาะสมก่อน จึงจะประเมินได้ ตัวเลขนี้ไม่ใช่เครดิตรับรองและไม่ใช่ปริมาณพร้อมขาย</p>
      </Panel>
    </div>
    <div className="assessment-next-steps"><Panel title="เตรียมข้อมูลต่อ" subtitle="ตรวจรายการภาคสนามก่อนส่งให้ผู้เชี่ยวชาญตรวจ" className="assessment-next-card"><div className="assessment-action-row"><span><ClipboardCheck size={18} /></span><div><b>ตรวจรายการภาคสนาม</b><small>บันทึกอายุ พันธุ์ยาง และหลักฐานสวน</small></div><Button onClick={() => onNavigate('field')}>เปิดรายการตรวจ <ArrowRight size={13} /></Button></div></Panel></div>
  </section>;
}