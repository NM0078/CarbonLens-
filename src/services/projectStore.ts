import { DEMO_PROJECTS } from '../data/demo';
import type { Project } from '../types';

const STORAGE_KEY = 'carbonlens-projects-v3';
const userStorageKey = (userId: string) => `${STORAGE_KEY}:${userId}`;

export function loadProjects(userId?: string): Project[] {
  try {
    const saved = localStorage.getItem(userId ? userStorageKey(userId) : STORAGE_KEY);
    return saved ? JSON.parse(saved) as Project[] : userId ? [] : structuredClone(DEMO_PROJECTS);
  } catch {
    return userId ? [] : structuredClone(DEMO_PROJECTS);
  }
}

export function saveProjects(projects: Project[], userId?: string): void {
  localStorage.setItem(userId ? userStorageKey(userId) : STORAGE_KEY, JSON.stringify(projects));
}

export function exportProjectsCsv(projects: Project[]): string {
  const rows = [
    ['ชื่อโครงการ', 'จังหวัด', 'อำเภอ', 'ประเภทป่า', 'พื้นที่ไร่', 'จำนวนแปลง', 'สถานะ'],
    ...projects.map((project) => [project.name, project.province, project.district, project.forestType, String(project.area), String(project.plots), project.status]),
  ];
  return `\uFEFF${rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n')}`;
}
