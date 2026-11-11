import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Project, ProjectStatus } from '../types';
import addressData from '../data/thai-addresses.json';
import { Button } from './ui';

const addressProvinces = addressData as { name: string; districts: { name: string; prefix: string; subdistricts: { name: string; prefix: string }[] }[] }[];

export type ProjectFormValues = Omit<Project, 'id' | 'updated' | 'boundary'>;

const EMPTY_FORM: ProjectFormValues = {
  name: '', parcelName: '', province: '', district: '', village: '', manager: '', forestType: '',
  landStatus: '', landEvidence: '', projectActivity: '', dominantSpecies: '', plantingYear: 0,
  forestCondition: '', fieldEvidence: '', methodology: '', baselineHistory: '', inventoryNotes: '', description: '', area: 0, plots: 1, status: 'เตรียมข้อมูล',
};

export function ProjectDialog({ project, onClose, onSave }: { project: Project | null; onClose: () => void; onSave: (values: ProjectFormValues) => void }) {
  const [form, setForm] = useState<ProjectFormValues>(EMPTY_FORM);
  useEffect(() => {
    setForm(project ? {
      ...EMPTY_FORM, name: project.name, parcelName: project.parcelName || '', province: project.province,
      district: project.district, village: project.village || '', manager: project.manager, forestType: project.forestType,
      landStatus: project.landStatus || '', landEvidence: project.landEvidence || '', projectActivity: project.projectActivity || '',
      dominantSpecies: project.dominantSpecies || '', plantingYear: project.plantingYear || 0,
      forestCondition: project.forestCondition || '', fieldEvidence: project.fieldEvidence || '', methodology: project.methodology || '',
      baselineHistory: project.baselineHistory || '', inventoryNotes: project.inventoryNotes || '', description: project.description,
      // ช่องนี้คือพื้นที่ที่ผู้ใช้กรอกเอง ไม่ใช่พื้นที่ที่หลังบ้านคำนวณจากขอบเขต
      area: project.declaredArea ?? project.area, plots: project.plots, status: project.status,
    } : { ...EMPTY_FORM });
  }, [project]);
  const update = (field: keyof ProjectFormValues, value: string | number) => setForm((current) => ({ ...current, [field]: value }));
  const selectedProvince = addressProvinces.find((place) => place.name === form.province);
  const selectedDistrict = selectedProvince?.districts.find((place) => place.name === form.district);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const provinceInput = event.currentTarget.querySelector<HTMLInputElement>('#carbonlens-province-input');
    const districtInput = event.currentTarget.querySelector<HTMLInputElement>('#carbonlens-district-input');
    const subdistrictInput = event.currentTarget.querySelector<HTMLInputElement>('#carbonlens-subdistrict-input');
    provinceInput?.setCustomValidity(selectedProvince ? '' : 'กรุณาเลือกจังหวัดจากรายการ');
    districtInput?.setCustomValidity(form.district && !selectedDistrict ? 'กรุณาเลือกอำเภอ/เขตจากรายการของจังหวัดที่เลือก' : '');
    subdistrictInput?.setCustomValidity(form.village && !selectedDistrict?.subdistricts.some((place) => place.name === form.village) ? 'กรุณาเลือกตำบล/แขวงจากรายการของอำเภอที่เลือก' : '');
    if (!event.currentTarget.reportValidity()) return;
    onSave(form);
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><form className="dialog-card project-form" onSubmit={submit} aria-labelledby="projectDialogTitle">
    <button className="dialog-close" type="button" onClick={onClose} aria-label="ปิด"><X size={19} /></button><span className="dialog-icon">＋</span><h2 id="projectDialogTitle">{project ? 'แก้ไขข้อมูลแปลง' : 'กรอกข้อมูลแปลงใหม่'}</h2><p>กรอกข้อมูลเบื้องต้นเพื่อเตรียมตรวจสอบโครงการสวนยางพารา</p>
    <h3 className="intake-form-section">ข้อมูลโครงการและที่ตั้ง</h3>
    <label>ชื่อโครงการ<input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="เช่น สวนยางพาราบ้าน..." /></label>
    <div className="form-two"><label>ชื่อแปลง<input value={form.parcelName || ''} onChange={(e) => update('parcelName', e.target.value)} placeholder="เช่น แปลง A" /></label><label>จังหวัด<input id="carbonlens-province-input" required list="carbonlens-provinces" value={form.province} onChange={(e) => setForm((current) => ({ ...current, province: e.target.value, district: '', village: '' }))} placeholder="พิมพ์ค้นหาจังหวัด" autoComplete="off" /><datalist id="carbonlens-provinces">{addressProvinces.map((place) => <option key={place.name} value={place.name} />)}</datalist></label></div>
    <div className="form-two"><label>อำเภอ/เขต<input id="carbonlens-district-input" list="carbonlens-districts" value={form.district} onChange={(e) => setForm((current) => ({ ...current, district: e.target.value, village: '' }))} placeholder={selectedProvince ? 'พิมพ์ค้นหาอำเภอ/เขต' : 'เลือกจังหวัดก่อน'} disabled={!selectedProvince} autoComplete="off" /><datalist id="carbonlens-districts">{(selectedProvince?.districts || []).map((place) => <option key={place.name} value={place.name} label={`${place.prefix}${place.name}`} />)}</datalist></label><label>ตำบล/แขวง<input id="carbonlens-subdistrict-input" list="carbonlens-subdistricts" value={form.village || ''} onChange={(e) => update('village', e.target.value)} placeholder={selectedDistrict ? 'พิมพ์ค้นหาตำบล/แขวง' : 'เลือกอำเภอก่อน'} disabled={!selectedDistrict} autoComplete="off" /><datalist id="carbonlens-subdistricts">{(selectedDistrict?.subdistricts || []).map((place) => <option key={place.name} value={place.name} label={`${place.prefix}${place.name}`} />)}</datalist></label></div>
    <small className="address-search-hint">พิมพ์ชื่อเพื่อค้นหา • รายการอำเภอ/เขตและตำบล/แขวงจะเปลี่ยนตามพื้นที่ที่เลือก</small>
    <label>ผู้ประสานงาน<input value={form.manager} onChange={(e) => update('manager', e.target.value)} placeholder="ชื่อผู้ประสานงานโครงการ" /></label>
    <div className="form-two"><label>ประเภทสวนยาง<select value={form.forestType} onChange={(e) => update('forestType', e.target.value)}><option value="">เลือกประเภทสวนยาง</option>{['สวนยางเชิงเดี่ยว','สวนยางผสม','สวนยางให้ผลผลิต','สวนยางปลูกใหม่','สวนยางผสมพืชคลุมดิน','อื่น ๆ'].map((type) => <option key={type}>{type}</option>)}</select></label><label>สถานะข้อมูล<select value={form.status} onChange={(e) => update('status', e.target.value as ProjectStatus)}>{['เตรียมข้อมูล','รอตรวจสอบ','กำลังดำเนินการ'].map((status) => <option key={status}>{status}</option>)}</select></label></div>
    <div className="form-two"><label>พื้นที่รวมโดยประมาณ (ไร่)<input type="number" min="0" step="0.01" value={form.area || ''} onChange={(e) => update('area', Number(e.target.value))} placeholder="0" /></label><label>จำนวนแปลง<input type="number" min="1" step="1" value={form.plots} onChange={(e) => update('plots', Number(e.target.value))} /></label></div>

    <h3 className="intake-form-section">สิทธิพื้นที่และขอบเขต</h3>
    <label>สถานะสิทธิ/การใช้พื้นที่<input value={form.landStatus || ''} onChange={(e) => update('landStatus', e.target.value)} placeholder="ระบุข้อมูลที่ทราบ หรือเขียนว่า รอตรวจสอบ" /></label>
    <label>เอกสารสิทธิ์หรือหลักฐานที่มี<textarea rows={2} value={form.landEvidence || ''} onChange={(e) => update('landEvidence', e.target.value)} placeholder="เช่น หนังสือรับรองพื้นที่ เอกสารจากชุมชน หรือยังไม่มี" /></label>
    <p className="intake-map-hint">กำหนดขอบเขตบนภาพถ่ายดาวเทียมและดูพื้นที่ได้ในหน้า “ประเมินโครงการและคาร์บอน” หลังสร้างแปลง</p>

    <h3 className="intake-form-section">สภาพสวนยางและกิจกรรมโครงการ</h3>
    <div className="form-two"><label>กิจกรรมหลัก<select value={form.projectActivity || ''} onChange={(e) => update('projectActivity', e.target.value)}><option value="">เลือกกิจกรรม</option>{['ปลูกและดูแลยางพารา','จัดการสวนยางให้เพิ่มการกักเก็บคาร์บอน','ปรับปรุงการใช้ปุ๋ย/สารปรับปรุงดิน','จัดการสวนยางผสม','อื่น ๆ'].map((activity) => <option key={activity}>{activity}</option>)}</select></label><label>ปีปลูกสวนยาง (พ.ศ.)<input type="number" min="2400" max="2700" value={form.plantingYear || ''} onChange={(e) => update('plantingYear', Number(e.target.value))} placeholder="เช่น 2568" /></label></div>
    <label>พันธุ์ยางพารา (ถ้าทราบ)<input value={form.dominantSpecies || ''} onChange={(e) => update('dominantSpecies', e.target.value)} placeholder="เช่น RRIM 600 หรือยังไม่ทราบ" /></label>
    <label>สภาพสวนยางปัจจุบัน<textarea rows={2} value={form.forestCondition || ''} onChange={(e) => update('forestCondition', e.target.value)} placeholder="เช่น อายุแปลง ความหนาแน่นต้นยาง การกรีด และสภาพทรงพุ่ม" /></label>
    <h3 className="intake-form-section">ข้อมูลพื้นฐานประกอบการประเมิน</h3>
    <label>ระเบียบวิธี (ถ้าทราบ)<input value={form.methodology || ''} onChange={(e) => update('methodology', e.target.value)} placeholder="กรอกชื่อระเบียบวิธี หรือเว้นไว้หากยังไม่ทราบ" /></label>
    <label>ประวัติการใช้พื้นที่และอายุสวนยาง<textarea rows={2} value={form.baselineHistory || ''} onChange={(e) => update('baselineHistory', e.target.value)} placeholder="ข้อมูลที่ทราบเกี่ยวกับสภาพหรือการใช้พื้นที่เดิม" /></label>
    <label>ข้อมูลสำรวจต้นยาง/ตัวอย่างแปลง<textarea rows={2} value={form.inventoryNotes || ''} onChange={(e) => update('inventoryNotes', e.target.value)} placeholder="เช่น พันธุ์ยาง จำนวนต้น เส้นรอบวง/ความสูง ปีสำรวจ และข้อมูลปุ๋ย หากมี" /></label>
    <label>บันทึกการสำรวจและหลักฐานภาคสนาม<textarea rows={2} value={form.fieldEvidence || ''} onChange={(e) => update('fieldEvidence', e.target.value)} placeholder="รายการที่สำรวจ วันที่สำรวจ ภาพถ่าย หรือข้อมูลที่ยังต้องยืนยัน" /></label>
    <label>รายละเอียดเพิ่มเติม<textarea rows={2} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="เป้าหมายและรายละเอียดโครงการสวนยาง" /></label>
    <Button variant="primary" className="dialog-submit" type="submit">{project ? 'บันทึกข้อมูลแปลง' : 'บันทึกข้อมูลแปลง'}</Button><small>ข้อมูลบันทึกที่ระบบหลังบ้าน เป็นข้อมูลที่ผู้ใช้แจ้ง ยังไม่ได้ยืนยัน และไม่ใช่ผลประเมินหรือเครดิตรับรอง</small>
  </form></div>;
}
