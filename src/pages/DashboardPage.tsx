import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ClipboardCheck, ClipboardList, FileCheck2, FolderKanban, Map, MapPinned, Plus, Satellite, Search, Sprout } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Project, PageId } from '../types';
import { Button, Notice, PageHeader, Panel, StatCard, StatusBadge } from '../components/ui';
import { ForestBuddy } from '../components/ForestBuddy';
import { rubberHeroPhotos } from '../data/rubberHeroPhotos';
import addressData from '../data/thai-addresses.json';

const STATUS_COLORS: Record<string, string> = { 'กำลังดำเนินการ': '#6d9d70', 'รอตรวจสอบ': '#d4b15e', 'เตรียมข้อมูล': '#8da9c8' };
const addressProvinces = addressData as { name: string; districts: { name: string; prefix: string; subdistricts: { name: string; prefix: string }[] }[] }[];

function JourneyIllustration({ kind }: { kind: 'map' | 'satellite' | 'field' | 'report' }) {
  return <div className={`journey-illustration journey-illustration-${kind}`} aria-hidden="true">
    {kind === 'map' && <><span className="journey-map-fold"/><MapPinned className="journey-primary-icon" strokeWidth={1.7}/><i className="journey-map-pulse"/></>}
    {kind === 'satellite' && <><span className="journey-orbit"/><Sprout className="journey-landscape-icon" strokeWidth={1.8}/><Satellite className="journey-primary-icon" strokeWidth={1.7}/><i className="journey-signal signal-one"/><i className="journey-signal signal-two"/></>}
    {kind === 'field' && <><Sprout className="journey-primary-icon journey-tree-icon" strokeWidth={1.7}/><ClipboardCheck className="journey-secondary-icon" strokeWidth={1.8}/><i className="journey-field-spark">✦</i></>}
    {kind === 'report' && <><FileCheck2 className="journey-primary-icon" strokeWidth={1.7}/><i className="journey-report-seal">✓</i><span className="journey-report-leaf">♧</span></>}
  </div>;
}

export function DashboardPage({ projects, userName, onAdd, onNavigate, guestMode = false }: { projects: Project[]; userName: string; onAdd: () => void; onNavigate: (page: PageId) => void; guestMode?: boolean }) {
  const [heroPhotoIndex, setHeroPhotoIndex] = useState(0);
  const [projectQuery, setProjectQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [subdistrictFilter, setSubdistrictFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ query: '', status: '', province: '', district: '', subdistrict: '' });
  const [showAllProjects, setShowAllProjects] = useState(false);
  useEffect(() => { const timer = window.setInterval(() => setHeroPhotoIndex((index) => (index + 1) % rubberHeroPhotos.length), 4000); return () => window.clearInterval(timer); }, []);
  const heroPhoto = rubberHeroPhotos[heroPhotoIndex];
  const selectedProvince = addressProvinces.find((place) => place.name === provinceFilter);
  const selectedDistrict = selectedProvince?.districts.find((place) => place.name === districtFilter);
  const filteredProjects = useMemo(() => projects.filter((project) => {
    const queryMatches = !appliedFilters.query || project.name.toLocaleLowerCase('th').includes(appliedFilters.query.toLocaleLowerCase('th'));
    return queryMatches && (!appliedFilters.status || project.status === appliedFilters.status) && (!appliedFilters.province || project.province === appliedFilters.province) && (!appliedFilters.district || project.district === appliedFilters.district) && (!appliedFilters.subdistrict || project.village === appliedFilters.subdistrict);
  }), [projects, appliedFilters]);
  const totalArea = filteredProjects.reduce((sum, project) => sum + (Number(project.area) || 0), 0);
  const totalPlots = filteredProjects.reduce((sum, project) => sum + (Number(project.plots) || 0), 0);
  const assessing = filteredProjects.filter((project) => project.status !== 'เตรียมข้อมูล').length;
  const statuses = ['กำลังดำเนินการ', 'รอตรวจสอบ', 'เตรียมข้อมูล'].map((status) => ({ name: status, value: filteredProjects.filter((project) => project.status === status).length }));
  const newest = showAllProjects ? filteredProjects : filteredProjects.slice(0, 10);
  const applyFilters = () => { setAppliedFilters({ query: projectQuery.trim(), status: statusFilter, province: provinceFilter, district: districtFilter, subdistrict: subdistrictFilter }); setShowAllProjects(false); };
  const clearFilters = () => { setProjectQuery(''); setStatusFilter(''); setProvinceFilter(''); setDistrictFilter(''); setSubdistrictFilter(''); setAppliedFilters({ query: '', status: '', province: '', district: '', subdistrict: '' }); setShowAllProjects(false); };

  return <section className="page active">
    <div className="dashboard-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(10,35,21,.9) 0%,rgba(10,35,21,.72) 48%,rgba(10,35,21,.22) 100%),url("${heroPhoto.src}")` }}><div className="hero-slideshow" aria-hidden="true">{rubberHeroPhotos.map((photo, index) => <img key={photo.src} src={photo.src} className={index === heroPhotoIndex ? 'hero-slide active' : 'hero-slide'} alt="" />)}<span className="hero-slideshow-shade" /></div><PageHeader eyebrow="CARBONLENS · ข้อมูลโครงการสวนยางพารา" title={<>สวัสดีค่ะ, คุณ {userName} <span className="wave">✳</span></>} subtitle="ติดตามข้อมูลและความพร้อมของโครงการสวนยางพารา" action={<Button variant="primary" onClick={onAdd}><Plus size={15} /> เพิ่มโครงการ</Button>} /><small className="hero-credit"><a href={heroPhoto.href} target="_blank" rel="noreferrer">{heroPhoto.caption} · {heroPhoto.credit}</a><span className="hero-slide-count">ภาพ {heroPhotoIndex + 1} จาก {rubberHeroPhotos.length}</span></small></div>
    <section className="carbonlens-about panel"><div className="carbonlens-mascot"><ForestBuddy kind="guide"/><span className="carbonlens-mascot-name">CarbonLens</span></div><div className="carbonlens-speech"><span className="carbonlens-about-kicker">เกี่ยวกับแพลตฟอร์ม</span><div className="carbonlens-speech-greeting">สวัสดีค่ะ! เราคือ CarbonLens 🌿</div><h2>เราคือใคร และช่วยเกษตรกรอย่างไร</h2><p>เราช่วยเกษตรกรและสหกรณ์รวบรวมข้อมูลสวนยางพารา ตรวจรายการที่ต้องยืนยัน และเตรียมข้อมูลประกอบการประเมินคาร์บอนเบื้องต้นตามระเบียบวิธีภาคเกษตรที่เกี่ยวข้อง เช่น พืชเกษตรยืนต้น (T-VER-S-METH-13-06) ก่อนยื่นให้องค์การบริหารจัดการก๊าซเรือนกระจก (อบก.) พิจารณาตามหลักเกณฑ์ค่ะ</p><small className="carbonlens-about-disclaimer">การเข้าเกณฑ์และตัวเลขคาร์บอนต้องตรวจตามข้อมูลจริงและระเบียบวิธีฉบับปัจจุบัน ตัวเลขในต้นแบบเป็นข้อมูลจำลอง ไม่ใช่เครดิตรับรอง</small></div></section>
    <Notice>{guestMode ? <>กำลังดู <b>ตัวอย่างสำหรับผู้เยี่ยมชม</b> ข้อมูลจำลองเท่านั้น และไม่สามารถบันทึกหรือแก้ไขข้อมูลได้</> : <>พื้นที่ทำงานนี้ใช้ <b>ข้อมูลจำลอง</b> ยังไม่ได้เชื่อมต่อข้อมูลดาวเทียมหรือระบบคำนวณเครดิตจริง</>}</Notice>
    <section className="dashboard-filters panel" aria-label="ค้นหาและกรองโครงการ"><div className="dashboard-filters-heading"><div><h2>ค้นหาและกรองโครงการ</h2><p>เลือกพื้นที่หรือสถานะ เพื่อดูข้อมูลในภาพรวม</p></div><span className="result-count">{filteredProjects.length} โครงการ</span></div><div className="dashboard-filter-grid"><label className="dashboard-project-search"><span>ค้นหาโครงการ</span><div className="search-box"><Search size={16}/><input value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="พิมพ์ชื่อโครงการโดยตรง" /></div></label><label><span>สถานะ</span><select className="filter-button" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">สถานะทั้งหมด</option><option>กำลังดำเนินการ</option><option>รอตรวจสอบ</option><option>เตรียมข้อมูล</option></select></label><label><span>จังหวัด</span><input className="filter-button" list="dashboard-provinces" value={provinceFilter} onChange={(event) => { setProvinceFilter(event.target.value); setDistrictFilter(''); setSubdistrictFilter(''); }} placeholder="ทุกพื้นที่ · พิมพ์ค้นหา" autoComplete="off"/><datalist id="dashboard-provinces">{addressProvinces.map((place) => <option key={place.name} value={place.name}/>)}</datalist></label><label><span>อำเภอ/เขต</span><input className="filter-button" list="dashboard-districts" value={districtFilter} onChange={(event) => { setDistrictFilter(event.target.value); setSubdistrictFilter(''); }} placeholder={selectedProvince ? 'พิมพ์ค้นหาอำเภอ/เขต' : 'เลือกจังหวัดก่อน'} disabled={!selectedProvince} autoComplete="off"/><datalist id="dashboard-districts">{(selectedProvince?.districts || []).map((place) => <option key={place.name} value={place.name} label={`${place.prefix}${place.name}`}/>)}</datalist></label><label><span>ตำบล/แขวง</span><input className="filter-button" list="dashboard-subdistricts" value={subdistrictFilter} onChange={(event) => setSubdistrictFilter(event.target.value)} placeholder={selectedDistrict ? 'พิมพ์ค้นหาตำบล/แขวง' : 'เลือกอำเภอก่อน'} disabled={!selectedDistrict} autoComplete="off"/><datalist id="dashboard-subdistricts">{(selectedDistrict?.subdistricts || []).map((place) => <option key={place.name} value={place.name} label={`${place.prefix}${place.name}`}/>)}</datalist></label></div></section>
    <div className="dashboard-filter-actions"><button className="button primary" type="button" onClick={applyFilters}><Search size={15}/> ค้นหา</button><button className="button secondary" type="button" onClick={clearFilters}>ล้างตัวกรอง</button>{filteredProjects.length > 10 && <button className="button secondary" type="button" onClick={() => setShowAllProjects((value) => !value)}>{showAllProjects ? 'แสดง 10 รายการ' : 'ดูรายชื่อทั้งหมด'}</button>}</div>
    <div className="stats-grid">
      <StatCard label="โครงการทั้งหมด" value={filteredProjects.length.toString().padStart(2, '0')} unit="โครงการ" hint="ข้อมูลตามตัวกรองที่เลือก" icon={<FolderKanban size={15} />} />
      <StatCard label="พื้นที่สวนยางรวม" value={totalArea.toLocaleString('th-TH')} unit="ไร่" hint={`จาก ${totalPlots} แปลงตัวอย่าง`} icon={<Map size={15} />} color="blue" />
      <StatCard label="โครงการระหว่างประเมิน" value={assessing} unit="โครงการ" hint="ยังไม่ใช่ผลประเมินคาร์บอน" icon={<ClipboardList size={15} />} color="yellow" />
      <StatCard label="แปลงสวนยางที่ลงทะเบียน" value={totalPlots} unit="แปลง" hint="ขอบเขตต้องยืนยันภาคสนาม" icon={<Sprout size={15} />} color="purple" />
    </div>
    <section className="forest-journey panel" aria-label="ขั้นตอนการทำงาน">
      <div className="forest-journey-heading"><div><span className="forest-journey-kicker">CARBONLENS GUIDE</span><h2>จากสวนยางสู่ข้อมูลพร้อมประเมิน</h2><p>ค่อย ๆ เตรียมข้อมูลสวนยางและหลักฐานทีละขั้น</p></div><span className="journey-sparkle" aria-hidden="true">✦</span></div>
      <div className="forest-journey-steps">{[
        { kind: 'map' as const, title: 'บอกตำแหน่งแปลง', text: 'เพิ่มที่ตั้งและขอบเขตพื้นที่' },
        { kind: 'satellite' as const, title: 'เตรียมข้อมูลสวนยาง', text: 'ดูข้อมูลตัวอย่างและสถานะ' },
        { kind: 'field' as const, title: 'ตรวจสอบหน้างาน', text: 'ยืนยันข้อมูลกับทีมสำรวจ' },
        { kind: 'report' as const, title: 'เตรียมยื่นให้ อบก.', text: 'ส่งข้อมูลเพื่อประเมินและรับรอง' },
      ].map((step, index) => <article className="forest-journey-step" key={step.title}><span className="journey-number">{index + 1}</span><JourneyIllustration kind={step.kind} /><b>{step.title}</b><small>{step.text}</small></article>)}</div>
    </section>
    <div className="dashboard-visual-grid">
      <Panel title="พื้นที่แต่ละโครงการ" subtitle="ข้อมูลพื้นที่ตัวอย่าง · หน่วยไร่" action={<span className="mock-tag">DEMO</span>}>
        <div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={filteredProjects.slice(0, 6)} layout="vertical" margin={{ left: 10, right: 16, top: 0, bottom: 0 }}><CartesianGrid stroke="#eef1ed" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={125} tick={{ fontSize: 10, fill: '#77837a' }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${Number(value).toLocaleString('th-TH')} ไร่`, 'พื้นที่']} /><Bar dataKey="area" fill="#79a77d" radius={[0, 5, 5, 0]} barSize={14} /></BarChart></ResponsiveContainer></div>
      </Panel>
      <Panel title="สถานะโครงการ" subtitle="จำนวนโครงการตามสถานะ" action={<span className="mock-tag">DEMO</span>}>
        <div className="status-chart-wrap"><ResponsiveContainer width="100%" height={145}><PieChart><Pie data={statuses} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={3}>{statuses.map((item) => <Cell key={item.name} fill={STATUS_COLORS[item.name]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="status-legend">{statuses.map((item) => <div key={item.name}><span><i style={{ background: STATUS_COLORS[item.name] }} />{item.name}</span><b>{item.value}</b></div>)}</div></div>
        <div className="chart-footnote">คาร์บอนเครดิต: รอข้อมูลเพิ่มเติม · ไม่มีผลคำนวณ</div>
      </Panel>
    </div>
    <div className="dashboard-grid">
      <Panel title="โครงการของคุณ" subtitle="ติดตามสถานะและความคืบหน้าล่าสุด" action={<button className="text-link" onClick={() => onNavigate('projects')}>ดูทั้งหมด <ArrowRight size={13} /></button>} className="projects-panel">
        <div className="table-wrap"><table><thead><tr><th>ชื่อโครงการ</th><th>พื้นที่</th><th>สถานะ</th><th>อัปเดต</th></tr></thead><tbody>{newest.map((project, index) => <tr key={project.id}><td><div className={`project-cell`}><span className={`project-thumb ${['thumb-forest','thumb-sage','thumb-olive','thumb-mint'][index % 4]}`}><Sprout size={15} /></span><span><b>{project.name}</b><small>{project.province} · อ.{project.district || '—'}</small></span></div></td><td>{project.area.toLocaleString('th-TH')} ไร่</td><td><StatusBadge status={project.status} /></td><td>{project.updated}</td></tr>)}{!newest.length && <tr><td colSpan={4} className="empty-row">ไม่พบโครงการตามเงื่อนไขที่เลือก</td></tr>}</tbody></table></div>
      </Panel>
      <Panel title="สถานะคาร์บอนเครดิต" subtitle="ยังไม่มีข้อมูลพอสำหรับการคำนวณ" action={<span className="estimate-tag">รอข้อมูล</span>} className="carbon-panel"><div className="carbon-pending"><div><b>รอข้อมูลเพิ่มเติม</b><p>ยังไม่มีผลคำนวณปริมาณคาร์บอนจริง</p><span>ไม่ใช่เครดิตรับรองหรือพร้อมขาย</span></div><div className="donut placeholder-donut"><div><b>—</b><small>ยังไม่ประเมิน</small></div></div></div><div className="disclaimer">ต้องตรวจข้อมูลสวนยางและวิธีประเมินที่ใช้ได้ก่อน</div><button className="text-link" onClick={() => onNavigate('assessment')}>ดูความพร้อมโครงการ <ArrowRight size={13} /></button></Panel>
    </div>
  </section>;
}
