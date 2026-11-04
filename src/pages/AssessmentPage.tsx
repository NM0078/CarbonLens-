import { ArrowRight, BrainCircuit, Database, Layers3, ScanSearch, Workflow } from 'lucide-react';
import type { PageId } from '../types';
import { Button, Notice, PageHeader, Panel } from '../components/ui';

const stages = [
  { title: 'Satellite Data', subtitle: 'Sentinel-2 · Bands', icon: SatelliteIcon },
  { title: 'Preprocessing', subtitle: 'Cloud mask · Quality', icon: ScanSearch },
  { title: 'Feature Extraction', subtitle: 'NDVI · EVI · GNDVI', icon: Layers3 },
  { title: 'Random Forest Model', subtitle: 'Classification / Regression', icon: BrainCircuit },
  { title: 'Assessment', subtitle: 'Direct / Hierarchical', icon: Workflow },
];
function SatelliteIcon(){return <Database size={16} />;}

export function AssessmentPage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return <section className="page active">
    <PageHeader eyebrow="โมเดล AI · สถานะการเตรียมข้อมูล" title="ประเมินข้อมูลด้วย AI" subtitle="รองรับแนวทาง machine learning สำหรับข้อมูลป่าไม้" action={<span className="estimate-tag large-tag">ยังไม่มีโมเดลจริง</span>} />
    <Notice>ไม่มี Training Dataset หรือไฟล์โมเดลในต้นแบบนี้ ขั้นตอนทั้งหมดเป็น <b>ตัวอย่าง Demo</b> ไม่มีผลทำนายจาก AI ที่ผ่านการฝึก</Notice>
    <Panel title="Pipeline การประเมิน" subtitle="เตรียมจุดเชื่อมต่อสำหรับบริการประมวลผล" action={<span className="mock-tag">WORKFLOW MOCK</span>} className="ai-flow"><div className="flow-steps">{stages.map(({ title, subtitle, icon: Icon }, index) => <div className={`flow-step ${index < 2 ? 'done' : index > 2 ? 'waiting' : ''}`} key={title}><span>0{index + 1}</span><Icon /><b>{title}</b><small>{subtitle}</small><i>{index < 2 ? 'ข้อมูลตัวอย่าง' : index === 2 ? 'รอ Feature API' : 'ยังไม่เชื่อมต่อ'}</i>{index < stages.length - 1 && <span className="flow-arrow">→</span>}</div>)}</div></Panel>
    <div className="assessment-grid"><Panel title="สถานะโมเดลและข้อมูล" subtitle="ความพร้อมของระบบประเมิน" className="score-panel"><div className="score-content"><div className="model-status-ring"><BrainCircuit size={24} /></div><div><span className="score-level">เตรียมโครงสร้างไว้</span><p>ยังไม่มีการเรียกใช้โมเดลหรือแสดงผลทำนาย ต้องมีชุดข้อมูลฝึกและ model artifact ที่ตรวจสอบแล้ว</p><div className="score-tags"><span>โมเดล <b>ยังไม่เชื่อม</b></span><span>ข้อมูลฝึก <b>ไม่มี</b></span><span>ผลทำนาย <b>ไม่มี</b></span></div></div></div><div className="model-meta"><div><span>ข้อมูลนำเข้า</span><b>Sentinel-2 · spectral bands · indices</b></div><div><span>โมเดลเป้าหมาย</span><b>Random Forest · Classification / Regression</b></div><div><span>แนวทางที่รองรับ</span><b>Direct / Hierarchical</b></div></div></Panel>
      <Panel title="แนวคิดจากงานวิจัย (2024)" subtitle="สิ่งที่ต้อง validate ก่อนใช้งาน" className="model-note"><p className="reference-title">“Advancing forest carbon stocks’ mapping using a hierarchical approach with machine learning and satellite imagery”</p><p>การนำ satellite features เข้าโมเดลต้องมีชุดข้อมูลฝึกที่เหมาะสม การประเมินความคลาดเคลื่อน และการตรวจสอบภาคสนาม ต้นแบบนี้ยังไม่มี model artifact หรือผลทางวิทยาศาสตร์</p><div className="method-box"><b>จุดเชื่อมต่อที่เตรียมไว้</b><span>POST /api/projects/{'{projectId}'}/assessment</span><small>รองรับการส่ง GeoJSON, scene metadata และ features ไป backend</small></div></Panel>
    </div>
    <div className="panel recommendation"><span className="rec-icon">✳</span><div><b>ผลการประเมิน</b><p>รอข้อมูลและ Model API — ไม่มีผลทำนายใน Demo นี้</p></div><Button onClick={() => onNavigate('carbon')}>ไปหน้าคาร์บอนเครดิต <ArrowRight size={13} /></Button></div>
  </section>;
}
