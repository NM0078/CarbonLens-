import { ArrowRight, CircleAlert, ClipboardCheck, FileSearch, Leaf, ShieldCheck } from 'lucide-react';
import type { PageId, Project } from '../types';
import { DEMO_CARBON_ASSESSMENT, DEMO_SATELLITE } from '../data/demo';
import { Button, Notice, PageHeader, Panel } from '../components/ui';

export function CarbonPage({ project, onNavigate }: { project?: Project; onNavigate: (page: PageId) => void }) {
  return <section className="page active">
    <PageHeader eyebrow={`${project?.name ?? 'ยังไม่มีโครงการ'} / คัดกรองเบื้องต้น`} title="ประเมินศักยภาพคาร์บอนเครดิต" subtitle="ตรวจความพร้อมก่อนเลือกวิธีการคำนวณ" action={<span className="estimate-tag large-tag">ยังไม่มีผลคำนวณ</span>} />
    <Notice>ข้อมูลไม่เพียงพอจะแสดง <b>“รอข้อมูลเพิ่มเติม”</b> ไม่มีการคูณพื้นที่ด้วยค่าคงที่หรือสร้างตัวเลขเครดิต/มูลค่าขึ้นเอง</Notice>
    <div className="carbon-status-grid"><section className="panel carbon-result"><span className="result-state insufficient">{DEMO_CARBON_ASSESSMENT.status}</span><h2>รอข้อมูลเพิ่มเติม</h2><p>ยังไม่มีปริมาณคาร์บอนเครดิตหรือมูลค่าประมาณการให้แสดง</p><div className="no-value"><span>ปริมาณคาร์บอน</span><b>{DEMO_CARBON_ASSESSMENT.tco2e ?? '—'} <small>tCO₂e</small></b><span>มูลค่าโดยประมาณ</span><b>{DEMO_CARBON_ASSESSMENT.valueThb ?? '—'} <small>บาท</small></b></div><small className="disclaimer">ไม่ใช่เครดิตที่ได้รับการรับรองหรือพร้อมขาย</small></section>
      <Panel title="ข้อมูลโครงการที่ใช้ประกอบ" subtitle="ตัวอย่างข้อมูลที่ยังต้องยืนยัน" action={<span className="estimate-tag">DEMO</span>} className="carbon-context"><div className="context-row"><span>ชื่อโครงการ</span><b>{project?.name ?? 'ยังไม่มีโครงการ'}</b></div><div className="context-row"><span>พื้นที่โครงการ</span><b>{project?.area ? `${project.area.toLocaleString('th-TH')} ไร่ · ตัวอย่าง` : 'รอข้อมูลขอบเขต'}</b></div><div className="context-row"><span>รูปแบบสวนยาง</span><b>{project?.forestType || 'รอยืนยันโดยเจ้าหน้าที่'}</b></div><div className="context-row"><span>ข้อมูลดาวเทียม / AI</span><b>NDVI {DEMO_SATELLITE.indices.NDVI.toFixed(2)} · DEMO; ไม่มีผลโมเดลจริง</b></div><div className="context-row"><span>ระเบียบวิธี</span><b>ยังไม่ได้เลือก/ตรวจคุณสมบัติ T-VER</b></div></Panel>
    </div>
    <div className="status-summary"><span className="potential"><Leaf size={13} /> มีศักยภาพ · ยังไม่ประเมิน</span><span className="review"><FileSearch size={13} /> ต้องตรวจสอบเพิ่มเติม · ยังไม่ประเมิน</span><span className="insufficient"><CircleAlert size={13} /> ข้อมูลไม่เพียงพอ · สถานะปัจจุบัน</span></div>
    <Panel title="องค์ประกอบที่ต้องตรวจสอบตามระเบียบวิธี" subtitle="เลือกและยืนยันฉบับวิธีการที่ใช้ได้ก่อนประเมิน" action={<span className="badge badge-yellow"><i /> รอตรวจสอบเพิ่มเติม</span>} className="methodology-panel"><div className="method-grid">{[
      ['01','Baseline','สถานการณ์อ้างอิงและข้อมูลย้อนหลัง','ยังไม่มีข้อมูลเพียงพอ'],['02','Project Emissions','การปล่อยจากกิจกรรมโครงการ','ยังไม่มีบัญชีรายการ'],['03','Leakage','การรั่วไหลและผลกระทบนอกขอบเขต','ยังไม่ได้ประเมิน'],['04','Monitoring & Verification','แผนติดตาม หลักฐาน และทวนสอบ','ต้องจัดทำแผน'],
    ].map(([number,title,description,status]) => <div key={title}><span className="method-mark">{number}</span><b>{title}</b><p>{description}</p><small>{status}</small></div>)}</div></Panel>
    <div className="panel recommendation"><span className="rec-icon"><ClipboardCheck size={17} /></span><div><b>ข้อมูลที่ต้องเก็บเพิ่ม</b><p>พิกัดและสิทธิ์พื้นที่ · อายุและสภาพสวนยาง · ชีวมวล · ประวัติพื้นที่ · กิจกรรมและการปล่อย · แผนติดตาม</p></div><Button onClick={() => onNavigate('field')}>เปิด Checklist <ArrowRight size={13} /></Button></div>
    <p className="page-footnote"><ShieldCheck size={13} /> ผลนี้เป็นการคัดกรองข้อมูลในต้นแบบ ไม่ใช่การประเมินตามมาตรฐาน T-VER หรือผลทวนสอบ</p>
  </section>;
}
