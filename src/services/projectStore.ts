/**
 * ข้อมูลโครงการ/แปลงผ่านหลังบ้าน (เดิมเก็บใน localStorage ของเบราว์เซอร์)
 *
 * หน้าบ้านเรียกว่า "โครงการ" แต่หลังบ้านเรียกว่า "แปลง" (plot) 1 รายการต่อ 1 ขอบเขต
 * ไฟล์นี้แปลงไปมาระหว่างสองรูปแบบ หน้าจออื่นจึงยังใช้ type Project เดิมได้
 *
 * ข้อตกลงที่ต้องรู้:
 * - ปีปลูกในฟอร์มเป็น พ.ศ. แต่หลังบ้านเก็บ ค.ศ. (ลบ 543)
 * - ถ้ามีขอบเขตแล้ว "พื้นที่" ใช้ค่าที่หลังบ้านคำนวณจาก Polygon ถ้ายังไม่มี ใช้ค่าที่ผู้ใช้กรอกเอง
 * - ช่องที่หลังบ้านเดิมไม่มี (สิทธิที่ดิน, พันธุ์ยาง ฯลฯ) เก็บใน details และเป็นข้อมูลที่ผู้ใช้แจ้ง ยังไม่ได้ยืนยัน
 */
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { API_ROUTES, apiClient } from './api';
import type { Project, ProjectStatus } from '../types';
import type { ProjectFormValues } from '../components/ProjectDialog';

const BE_OFFSET = 543;
const MIN_PLANTING_YEAR_CE = 1950; // ตรงกับข้อจำกัดของหลังบ้าน

type PlotDetails = {
  parcel_name?: string | null; plantation_type?: string | null; data_status?: ProjectStatus | null;
  declared_area_rai?: number | null; plot_count?: number | null; land_status?: string | null; land_evidence?: string | null;
  project_activity?: string | null; rubber_clone?: string | null; plantation_condition?: string | null;
  field_evidence?: string | null; methodology?: string | null; baseline_history?: string | null; inventory_notes?: string | null;
};

/** รูปแบบแปลงที่หลังบ้านส่งมา (เฉพาะช่องที่หน้านี้ใช้) */
type ApiPlot = {
  id: string; name: string; province: string | null; district: string | null; subdistrict: string | null;
  coordinator: string | null; planting_year: number | null; notes: string | null; details: PlotDetails;
  geometry: Polygon | MultiPolygon | null; area: { area_rai: number } | null; updated_at: string;
};

const text = (value: string | undefined | null) => (value && value.trim() ? value.trim() : null);

function formatUpdated(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toProject(plot: ApiPlot): Project {
  const d = plot.details ?? {};
  return {
    id: plot.id,
    name: plot.name,
    province: plot.province ?? '',
    district: plot.district ?? '',
    village: plot.subdistrict ?? '',
    manager: plot.coordinator ?? '',
    forestType: d.plantation_type ?? '',
    description: plot.notes ?? '',
    // ปัด 2 ตำแหน่งให้ตรงกับช่องกรอกพื้นที่ (step 0.01) ไม่งั้นเบราว์เซอร์จะไม่ยอมส่งฟอร์มแก้ไข
    area: Math.round((plot.area?.area_rai ?? d.declared_area_rai ?? 0) * 100) / 100,
    declaredArea: d.declared_area_rai ?? undefined,
    plots: d.plot_count ?? 1,
    status: d.data_status ?? 'เตรียมข้อมูล',
    updated: formatUpdated(plot.updated_at),
    // หน้าแผนที่ใช้ Feature<Polygon> ส่วนหลังบ้านเก็บเฉพาะ geometry
    boundary: plot.geometry ? { type: 'Feature', properties: {}, geometry: plot.geometry as Polygon } as Feature<Polygon> : undefined,
    parcelName: d.parcel_name ?? '',
    landStatus: d.land_status ?? '',
    landEvidence: d.land_evidence ?? '',
    projectActivity: d.project_activity ?? '',
    dominantSpecies: d.rubber_clone ?? '',
    plantingYear: plot.planting_year ? plot.planting_year + BE_OFFSET : undefined,
    forestCondition: d.plantation_condition ?? '',
    fieldEvidence: d.field_evidence ?? '',
    methodology: d.methodology ?? '',
    baselineHistory: d.baseline_history ?? '',
    inventoryNotes: d.inventory_notes ?? '',
  };
}

function toDetails(values: Partial<ProjectFormValues>): PlotDetails {
  return {
    parcel_name: text(values.parcelName),
    plantation_type: text(values.forestType),
    data_status: values.status ?? null,
    declared_area_rai: values.area && values.area > 0 ? values.area : null,
    plot_count: values.plots && values.plots >= 1 ? Math.round(values.plots) : null,
    land_status: text(values.landStatus),
    land_evidence: text(values.landEvidence),
    project_activity: text(values.projectActivity),
    rubber_clone: text(values.dominantSpecies),
    plantation_condition: text(values.forestCondition),
    field_evidence: text(values.fieldEvidence),
    methodology: text(values.methodology),
    baseline_history: text(values.baselineHistory),
    inventory_notes: text(values.inventoryNotes),
  };
}

/** ตรวจปีปลูก (พ.ศ.) ก่อนส่ง เพื่อบอกผู้ใช้เป็นภาษาไทยแทน error ของหลังบ้าน */
function plantingYearCe(yearBe: number | undefined): number | null {
  if (!yearBe) return null;
  const max = new Date().getFullYear() + BE_OFFSET;
  if (!Number.isInteger(yearBe) || yearBe < MIN_PLANTING_YEAR_CE + BE_OFFSET || yearBe > max) {
    throw new Error(`ปีปลูกต้องอยู่ระหว่าง พ.ศ. ${MIN_PLANTING_YEAR_CE + BE_OFFSET}–${max}`);
  }
  return yearBe - BE_OFFSET;
}

function toPlotBody(values: ProjectFormValues) {
  return {
    name: values.name.trim(),
    province: text(values.province),
    district: text(values.district),
    subdistrict: text(values.village),
    coordinator: text(values.manager),
    planting_year: plantingYearCe(values.plantingYear),
    notes: text(values.description),
    details: toDetails(values),
  };
}

export async function fetchProjects(): Promise<Project[]> {
  return (await apiClient.get<ApiPlot[]>(API_ROUTES.plots.list)).map(toProject);
}

export async function createProject(values: ProjectFormValues): Promise<Project> {
  return toProject(await apiClient.post<ApiPlot>(API_ROUTES.plots.create, toPlotBody(values)));
}

export async function updateProject(id: string, values: ProjectFormValues): Promise<Project> {
  return toProject(await apiClient.patch<ApiPlot>(API_ROUTES.plots.detail(id), toPlotBody(values)));
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete<{ ok: boolean }>(API_ROUTES.plots.detail(id));
}

/**
 * บันทึกขอบเขต หลังบ้านตรวจรูปแปลงและคำนวณพื้นที่เอง พื้นที่ที่เบราว์เซอร์คำนวณจึงใช้แสดงก่อนบันทึกเท่านั้น
 * ส่ง details เดิมกลับไปพร้อมชื่อแปลงใหม่ เพราะหลังบ้านแทนที่ details ทั้งก้อน
 */
export async function saveProjectBoundary(project: Project, boundary: Feature<Polygon>, parcelName: string): Promise<Project> {
  return toProject(await apiClient.patch<ApiPlot>(API_ROUTES.plots.detail(project.id), {
    geometry: boundary,
    // ใช้พื้นที่ที่ผู้ใช้กรอกเอง ไม่ใช่ area ซึ่งอาจเป็นค่าจากขอบเขตเดิม
    details: toDetails({ ...project, area: project.declaredArea ?? 0, parcelName }),
  }));
}

export function exportProjectsCsv(projects: Project[]): string {
  const rows = [
    ['ชื่อโครงการ', 'จังหวัด', 'อำเภอ', 'ประเภทสวนยาง', 'พื้นที่ไร่', 'จำนวนแปลง', 'สถานะ'],
    ...projects.map((project) => [project.name, project.province, project.district, project.forestType, String(project.area), String(project.plots), project.status]),
  ];
  return `﻿${rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n')}`;
}
