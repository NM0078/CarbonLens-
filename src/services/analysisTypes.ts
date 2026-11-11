/**
 * รูปแบบผลตรวจที่หลังบ้านส่งมา ต้องตรงกับ backend/app/presenters.py และ imagery.py ใน repo CarbonLens(backend)
 * ทุกตัวเลขมาจากหลังบ้าน หน้าบ้านไม่คำนวณหรือเดาค่าเอง
 */

export type PlotStatus = 'VERIFIED' | 'REVIEW' | 'REJECTED' | 'PENDING';
export type ReviewDecision = 'approved' | 'rejected' | null;

export interface JobStep { key: string; label: string; state: 'pending' | 'running' | 'done' | 'skipped' | 'failed' }

export interface Job {
  run_id: number;
  plot_id: string;
  state: 'queued' | 'running' | 'done' | 'failed';
  steps: JobStep[];
  error: string | null;
  created_at: string | null;
  finished_at: string | null;
}

export interface AiResult {
  status: PlotStatus;
  status_th: string;
  model_version: string | null;
  model_macro_f1: number | null;
  rubber_probability: number | null;
  classes: { key: string; label: string; probability: number }[];
  phenology_rule_passed: boolean;
  phenology_rule_detail: string;
  /** ความแม่นของคลาสยางจากการตรวจไขว้ตอนเทรน */
  model_quality: { rubber_precision: number; rubber_recall: number; n_samples: number | null; class_counts: Record<string, number> } | null;
  /** คำเตือนเมื่อแปลงอยู่นอกพื้นที่ที่โมเดลเทรน (โมเดลเทรนจากภาคใต้) */
  region_note: string | null;
  years_with_drop: number;
  years_evaluated: number;
}

export type CarbonResult =
  | { visible: false; reason: string; disclaimers: string[] }
  | {
      visible: true;
      reason: string;
      tier: string;
      disclaimers: string[];
      assessment_year: number;
      area_rai: number;
      stock_tco2e: number;
      stock_tco2e_p05: number;
      stock_tco2e_p95: number;
      stock_tco2e_per_rai: number;
      stock_tco2e_per_rai_p05: number;
      stock_tco2e_per_rai_p95: number;
      agb_mg_ha: number;
      model_version: string;
      model_r2: number | null;
      model_rmse_mg_ha: number | null;
      notes: string[];
    };

export interface PlotDetail {
  plot: { id: string; name: string; geometry: unknown; area: { area_rai: number } | null; updated_at: string; status: PlotStatus; status_th: string };
  has_result: boolean;
  run?: Job;
  ai?: AiResult;
  carbon?: CarbonResult;
  review?: { decision: ReviewDecision; note: string | null; reviewed_at: string | null };
  warnings?: string[];
  summary_th?: string[];
}

export interface PlotImage {
  kind: 'true_color' | 'ndvi' | 'annual_median';
  label: string;
  url: string;
  /** วันที่ถ่ายจริง ถ้าเป็นค่ามัธยฐานรายปีจะเป็น null เพราะไม่ใช่ภาพของวันเดียว */
  date: string | null;
  method: string;
  year?: number;
  legend?: { min: number; max: number; colors: string[] };
}

export interface PlotImagery {
  images: PlotImage[];
  scene: { date: string; clear_fraction: number } | null;
  scenes_found: number;
  window: { start: string; end: string };
  source: string;
  /** เหตุผลเมื่อไม่มีภาพเดี่ยวที่ใสพอ */
  note: string | null;
}
