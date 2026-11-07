import type { Project } from '../types';

function safeFileName(value: string) { return value.replace(/[\\/:*?"<>|]/g, '-').trim() || 'project'; }

export function downloadProjectDocument(project: Project) {
  const fields: Array<[string, string | number | undefined]> = [
    ['ชื่อโครงการ', project.name], ['ชื่อแปลง', project.parcelName], ['จังหวัด', project.province], ['อำเภอ', project.district], ['ตำบล/หมู่บ้าน', project.village], ['ผู้ประสานงาน', project.manager], ['ประเภทพื้นที่', project.forestType], ['พื้นที่รวม', `${Number(project.area || 0).toLocaleString('th-TH')} ไร่`], ['จำนวนแปลง', project.plots], ['สถานะ', project.status], ['กิจกรรมโครงการ', project.projectActivity], ['ปีปลูก', project.plantingYear], ['พันธุ์ยาง', project.dominantSpecies], ['สภาพพื้นที่', project.forestCondition], ['สิทธิ/การใช้พื้นที่', project.landStatus], ['หลักฐานสิทธิพื้นที่', project.landEvidence], ['ระเบียบวิธี', project.methodology], ['ประวัติการใช้พื้นที่', project.baselineHistory], ['ข้อมูลสำรวจ', project.inventoryNotes], ['หลักฐานภาคสนาม', project.fieldEvidence], ['รายละเอียดเพิ่มเติม', project.description], ['ขอบเขตพิกัด', project.boundary ? 'มี Polygon (ดาวน์โหลด GeoJSON แยกได้)' : 'ยังไม่มีข้อมูลขอบเขต'], ['อัปเดตล่าสุด', project.updated],
  ];
  const content = `CARBONLENS · เอกสารสรุปข้อมูลโครงการ\nวันที่จัดทำ: ${new Date().toLocaleDateString('th-TH')}\n\n${fields.map(([label, value]) => `${label}: ${value || 'ยังไม่ระบุ'}`).join('\n')}\n\nหมายเหตุ: เอกสารนี้รวบรวมข้อมูลที่กรอกไว้ในต้นแบบเพื่อเตรียมและตรวจทานข้อมูลโครงการ ไม่ใช่เอกสารยื่นรับรอง ไม่ใช่ผลคำนวณคาร์บอน และไม่ใช่เครดิตที่ได้รับการรับรองจาก อบก.\n`;
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/plain;charset=utf-8' })); link.download = `CarbonLens-${safeFileName(project.name)}-เอกสารโครงการ.txt`; link.click(); window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export function downloadProjectBoundary(project: Project) {
  if (!project.boundary) return;
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(project.boundary, null, 2)], { type: 'application/geo+json' })); link.download = `CarbonLens-${safeFileName(project.name)}-ขอบเขต.geojson`; link.click(); window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}