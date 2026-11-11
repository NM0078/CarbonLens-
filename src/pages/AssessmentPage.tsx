import { useState } from 'react';
import { ArrowRight, CheckCircle2, CircleAlert, ClipboardCheck } from 'lucide-react';
import type { Project } from '../types';
import { Button, Notice, PageHeader, Panel } from '../components/ui';
import { PlotAnalysis } from '../components/PlotAnalysis';
import { MapPage } from './MapPage';

/**
 * หน้าประเมินโครงการ: แผนที่วาดขอบเขต + ผลตรวจจริงจากหลังบ้าน (ภาพดาวเทียม, Random Forest, คาร์บอน)
 * โหมดผู้เยี่ยมชมไม่มีบัญชี จึงแสดงเฉพาะแผนที่และกล่องตัวอย่างที่ติดป้ายไว้
 */
export function AssessmentPage({ projects, onSaveBoundary, onNotify, guestMode, onNavigate }: { projects: Project[]; onSaveBoundary: (id: string, feature: NonNullable<Project['boundary']>, rai: number, parcelName: string) => void; onNotify: (message: string) => void; guestMode: boolean; onNavigate: (page: 'field') => void }) {
  // แปลงที่เลือกใช้ร่วมกันระหว่างแผนที่และผลตรวจ
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? '');
  const project = projects.find((item) => item.id === selectedId) ?? projects[0];
  const items = [
    { title: 'ขอบเขตแปลง', detail: 'ตำแหน่งและพื้นที่ของสวนยาง', ready: Boolean(project?.boundary) },
    { title: 'สิทธิ์การใช้พื้นที่', detail: 'เอกสารหรือหลักฐานสิทธิ์ที่ดิน', ready: Boolean(project?.landStatus || project?.landEvidence) },
    { title: 'ข้อมูลสวนยาง', detail: 'ปีปลูก พันธุ์ยาง และสภาพแปลง', ready: Boolean(project?.plantingYear || project?.dominantSpecies || project?.forestCondition) },
    { title: 'หลักฐานภาคสนาม', detail: 'บันทึกการสำรวจและภาพถ่าย', ready: Boolean(project?.fieldEvidence) },
  ];
  const readyCount = items.filter((item) => item.ready).length;

  return <section className="page active">
    <PageHeader eyebrow={`${project?.name ?? 'โครงการสวนยาง'} · ภาพรวมการประเมิน`} title="ประเมินโครงการและคาร์บอน" subtitle="ดูภาพถ่ายดาวเทียม กำหนดพื้นที่ และตรวจความพร้อมสำหรับประเมินคาร์บอนเครดิตในหน้าเดียว" action={<span className="estimate-tag large-tag">{guestMode ? 'ข้อมูลตัวอย่าง' : 'ค่าคัดกรองจากดาวเทียม'}</span>} />
    {guestMode
      ? <Notice>โหมดเยี่ยมชมไม่ได้เชื่อมระบบตรวจจริง เข้าสู่ระบบเพื่อดูภาพดาวเทียมจริง ผลตรวจด้วย AI และช่วงคาร์บอนของแปลงคุณ</Notice>
      : <Notice>ภาพดาวเทียม ผลตรวจ และคาร์บอนด้านล่างมาจากระบบหลังบ้านและ Google Earth Engine จริง เป็นค่าคัดกรองเบื้องต้น ไม่ใช่เครดิตรับรอง</Notice>}
    <MapPage projects={projects} onSave={onSaveBoundary} onNotify={onNotify} guestMode={guestMode} embedded selectedId={project?.id ?? ''} onSelect={setSelectedId} />
    {!guestMode && project && <PlotAnalysis key={project.id} project={project} onNotify={onNotify} />}
    <div className="assessment-grid">
      <Panel title="ความพร้อมของข้อมูล" subtitle={`มีข้อมูลเบื้องต้น ${readyCount} จาก ${items.length} รายการ`} action={<span className="mock-tag">ตรวจจากข้อมูลที่บันทึก</span>} className="score-panel">
        <div className="simple-readiness-list">{items.map((item) => <div className="simple-readiness-row" key={item.title}><span className={item.ready ? 'is-ready' : 'is-pending'}>{item.ready ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}</span><span><b>{item.title}</b><small>{item.detail}</small></span><strong>{item.ready ? 'มีข้อมูล' : 'รอข้อมูล'}</strong></div>)}</div>
      </Panel>
      {guestMode && <Panel title="คาร์บอนเครดิตเบื้องต้น" subtitle="โหมดเยี่ยมชมไม่มีผลคำนวณ" action={<span className="estimate-tag">ยังไม่ประเมิน</span>} className="simple-carbon-card">
        <div className="simple-carbon-value"><span>ปริมาณคาร์บอน</span><b>— <small>tCO₂e</small></b></div>
        <p>เข้าสู่ระบบและบันทึกขอบเขตแปลงเพื่อให้ระบบตรวจจากข้อมูลดาวเทียมจริง ตัวเลขที่ได้เป็นค่าคัดกรอง ไม่ใช่เครดิตรับรองและไม่ใช่ปริมาณพร้อมขาย</p>
      </Panel>}
    </div>
    <div className="assessment-next-steps"><Panel title="เตรียมข้อมูลต่อ" subtitle="ตรวจรายการภาคสนามก่อนส่งให้ผู้เชี่ยวชาญตรวจ" className="assessment-next-card"><div className="assessment-action-row"><span><ClipboardCheck size={18} /></span><div><b>ตรวจรายการภาคสนาม</b><small>บันทึกอายุ พันธุ์ยาง และหลักฐานสวน</small></div><Button onClick={() => onNavigate('field')}>เปิดรายการตรวจ <ArrowRight size={13} /></Button></div></Panel></div>
  </section>;
}
