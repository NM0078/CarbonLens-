import type { Feature, Polygon } from 'geojson';

export type PageId = 'dashboard' | 'projects' | 'map' | 'assessment' | 'field' | 'reports' | 'profile';
export type ProjectStatus = 'กำลังดำเนินการ' | 'รอตรวจสอบ' | 'เตรียมข้อมูล';
export type VerificationStatus = 'ยังไม่ตรวจสอบ' | 'รอตรวจสอบ' | 'ตรวจสอบแล้ว' | 'ต้องแก้ไขข้อมูล';

export interface Project {
  id: string;
  name: string;
  province: string;
  district: string;
  manager: string;
  forestType: string;
  description: string;
  area: number;
  plots: number;
  status: ProjectStatus;
  updated: string;
  boundary?: Feature<Polygon>;
  declaredArea?: number; // พื้นที่ที่ผู้ใช้กรอกเอง (ไร่) แยกจาก area ซึ่งใช้ค่าจากขอบเขตเมื่อมีแล้ว
  parcelName?: string;
  village?: string;
  landStatus?: string;
  landEvidence?: string;
  projectActivity?: string;
  dominantSpecies?: string;
  plantingYear?: number;
  forestCondition?: string;
  fieldEvidence?: string;
  methodology?: string;
  baselineHistory?: string;
  inventoryNotes?: string;
}

export interface FieldItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: VerificationStatus;
}

export interface ToastMessage {
  id: number;
  message: string;
}
