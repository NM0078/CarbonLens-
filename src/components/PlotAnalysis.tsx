import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, Satellite } from 'lucide-react';
import { API_ROUTES, apiClient } from '../services/api';
import type { Job, PlotDetail, PlotImage, PlotImagery } from '../services/analysisTypes';
import type { Project } from '../types';
import { Button, Notice, Panel } from './ui';
import './PlotAnalysis.css';

/**
 * ผลตรวจจริงของแปลงจากหลังบ้าน: ภาพ Sentinel-2, การตรวจความเป็นสวนยาง (Random Forest + กฎผลัดใบ) และคาร์บอนระดับคัดกรอง
 *
 * กติกาที่ต้องคงไว้:
 * - ไม่มีภาพหรือตัวเลขแทน ถ้ายังไม่มีข้อมูลจริงจะบอกสาเหตุเป็นข้อความ
 * - ป้าย "ภาพจริง" ขึ้นหลังภาพโหลดสำเร็จเท่านั้น
 * - หลังบ้านเป็นผู้ตัดสินว่าแสดงตัวเลขคาร์บอนได้ไหม ถ้าไม่ได้จะไม่มีตัวเลขส่งมา
 * - คาร์บอนแสดงเป็นช่วงก่อน ค่ากลางเป็นรอง เพราะโมเดลชีวมวลยังไม่แม่นพอให้อ่านเป็นตัวเลขเดียว
 */

const POLL_MS = 2500;
const MAX_POLL_ERRORS = 5; // เน็ตสะดุดครั้งเดียวไม่ควรทำให้หยุดติดตามงาน
const IMAGERY_TIMEOUT_MS = 90_000; // Earth Engine ใช้เวลาหาภาพราว 10–30 วินาที
const pct = (value: number | null | undefined) => (value === null || value === undefined ? '—' : `${(value * 100).toFixed(0)}%`);
const num = (value: number, digits = 2) => value.toLocaleString('th-TH', { maximumFractionDigits: digits });
const thaiDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('th-TH', { dateStyle: 'long', timeZone: 'UTC' });
const errorText = (caught: unknown) => (caught instanceof Error ? caught.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');

export function PlotAnalysis({ project, onNotify }: { project: Project; onNotify: (message: string) => void }) {
  const plotId = project.id;
  const hasBoundary = Boolean(project.boundary);
  const [detail, setDetail] = useState<PlotDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try { setDetail(await apiClient.get<PlotDetail>(API_ROUTES.plots.detail(plotId))); setDetailError(null); }
    catch (caught) { setDetailError(errorText(caught)); }
  }, [plotId]);
  // project.updated เปลี่ยนเมื่อบันทึกขอบเขตใหม่ ต้องโหลดผลและภาพใหม่ด้วย
  useEffect(() => { setDetail(null); void reload(); }, [reload, project.updated, project.boundary]);

  return <div className="pa-stack">
    {detailError && <div className="pa-error" role="alert">{detailError}</div>}
    <ImageryPanel plotId={plotId} hasBoundary={hasBoundary} boundaryKey={JSON.stringify(project.boundary?.geometry ?? null)} />
    <AnalysisPanel plotId={plotId} hasBoundary={hasBoundary} detail={detail} onFinished={() => void reload()} onNotify={onNotify} />
    <CarbonPanel detail={detail} plotName={project.name} plotId={plotId} onNotify={onNotify} />
  </div>;
}

/** ภาพ Sentinel-2 ของแปลง (ภาพเดี่ยวที่เมฆน้อยที่สุดใน 12 เดือน, NDVI วันเดียวกัน, ค่ามัธยฐานรายปี) ใช้ให้คนดูเท่านั้น ไม่ได้ส่งเข้าโมเดล */
function ImageryPanel({ plotId, hasBoundary, boundaryKey }: { plotId: string; hasBoundary: boolean; boundaryKey: string }) {
  const [imagery, setImagery] = useState<PlotImagery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<PlotImage['kind']>('true_color');
  // การได้ URL ยังไม่ได้แปลว่าภาพโหลดสำเร็จ จึงเก็บผลโหลดแยกตาม URL
  const [loadState, setLoadState] = useState<Record<string, 'ok' | 'failed'>>({});

  const request = useCallback(async (refresh: boolean, isCurrent: () => boolean = () => true) => {
    setImagery(null); setError(null); setLoadState({});
    try {
      const result = await apiClient.get<PlotImagery>(API_ROUTES.plots.imagery(plotId, refresh), IMAGERY_TIMEOUT_MS);
      if (isCurrent()) setImagery(result);
    } catch (caught) { if (isCurrent()) setError(errorText(caught)); }
  }, [plotId]);

  useEffect(() => {
    setImagery(null); setError(null); setLoadState({});
    if (!hasBoundary) return;
    let alive = true;
    void request(false, () => alive);
    return () => { alive = false; };
  }, [hasBoundary, boundaryKey, request]);

  const selected = imagery?.images.find((item) => item.kind === kind) ?? imagery?.images[0] ?? null;
  const state = selected ? loadState[selected.url] : undefined;
  const mark = (url: string, result: 'ok' | 'failed') => setLoadState((current) => ({ ...current, [url]: result }));
  const retry = <Button onClick={() => void request(true)}><RefreshCw size={14} /> ลองใหม่</Button>;
  const message = !hasBoundary ? <span>แปลงนี้ยังไม่มีขอบเขต วาดและบันทึกขอบเขตบนแผนที่ด้านบนก่อน จึงจะขอภาพดาวเทียมได้</span>
    : error ? <><span role="alert">{error}</span>{retry}</>
    : !selected ? <span>กำลังขอภาพจาก Google Earth Engine อาจใช้เวลาราว 20 วินาที…</span>
    : state === 'failed' ? <><span role="alert">โหลดภาพไม่สำเร็จ</span>{retry}</>
    : !state ? <span>กำลังโหลดภาพ…</span>
    : null;

  return <Panel title="ภาพดาวเทียม Sentinel-2 ของแปลง" subtitle="ภาพจริงจาก Google Earth Engine · เส้นสีเหลืองคือขอบเขตแปลง" action={state === 'ok' ? <span className="pa-badge">ภาพจริง</span> : undefined} className="pa-imagery">
    {imagery?.note && <Notice>{imagery.note}</Notice>}
    {imagery && imagery.images.length > 1 && <div className="pa-tabs" role="group" aria-label="เลือกชนิดภาพ">{imagery.images.map((item) => <Button key={item.kind} variant={item.kind === selected?.kind ? 'primary' : 'secondary'} aria-pressed={item.kind === selected?.kind} onClick={() => setKind(item.kind)}>{item.label}</Button>)}</div>}
    <div className="pa-image-row">
      <div className="pa-image">
        {selected && state !== 'failed' && <img key={selected.url} src={selected.url} alt={selected.label} onLoad={() => mark(selected.url, 'ok')} onError={() => mark(selected.url, 'failed')} />}
        {message && <div className="pa-image-state">{message}</div>}
      </div>
      <div className="pa-image-meta">
        <div><small>วันที่ถ่าย</small><b>{selected ? (selected.date ? thaiDate(selected.date) : `รวมทั้งปี ${selected.year ?? ''}`) : '—'}</b></div>
        <div><small>เห็นพื้นแปลง (ไม่มีเมฆ)</small><b>{selected?.date && imagery?.scene ? pct(imagery.scene.clear_fraction) : '—'}</b></div>
        <div><small>ภาพที่พบใน 12 เดือน</small><b>{imagery ? imagery.scenes_found : '—'}</b></div>
        {selected?.legend && <div className="pa-scale"><small>สี NDVI</small><span><em>{selected.legend.min}</em><i style={{ background: `linear-gradient(90deg, ${selected.legend.colors.map((color) => `#${color}`).join(', ')})` }} /><em>{selected.legend.max}</em></span></div>}
        {selected && <p className="pa-muted">{selected.method}</p>}
        <p className="pa-muted">ภาพละเอียด 10 เมตร เห็นรูปแปลงแต่ไม่เห็นต้นยางรายต้น และไม่ได้ใช้เป็นข้อมูลเข้าโมเดล</p>
      </div>
    </div>
  </Panel>;
}

/** ปุ่มสั่งตรวจและผล Random Forest แสดงความคืบหน้าจริงจากหลังบ้านทีละขั้น */
function AnalysisPanel({ plotId, hasBoundary, detail, onFinished, onNotify }: { plotId: string; hasBoundary: boolean; detail: PlotDetail | null; onFinished: () => void; onNotify: (message: string) => void }) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  // งานที่กำลังติดตาม ถ้าเปลี่ยนแปลงหรือออกจากหน้าแล้ว คำตอบที่มาช้าจะถูกทิ้ง
  const watching = useRef<number | null>(null);
  const finished = useRef(onFinished);
  finished.current = onFinished;

  const stop = () => { watching.current = null; if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; } };

  const poll = useCallback((runId: number, failures = 0) => {
    watching.current = runId;
    timer.current = window.setTimeout(async () => {
      try {
        const next = await apiClient.get<Job>(API_ROUTES.job(runId));
        if (watching.current !== runId) return;
        setJob(next); setError(null);
        if (next.state === 'done' || next.state === 'failed') {
          if (next.state === 'failed') setError(next.error ?? 'การตรวจล้มเหลว');
          watching.current = null;
          finished.current();
          return;
        }
        poll(runId);
      } catch (caught) {
        if (watching.current !== runId) return;
        if (failures + 1 < MAX_POLL_ERRORS) { poll(runId, failures + 1); return; }
        setError(`${errorText(caught)} · การตรวจอาจยังทำงานอยู่ ลองโหลดหน้าใหม่เพื่อดูสถานะล่าสุด`);
      }
    }, POLL_MS);
  }, []);

  // เปิดหน้าใหม่ระหว่างที่แปลงกำลังถูกตรวจ ให้แสดงความคืบหน้าต่อ ไม่ให้ดูเหมือนยังไม่ได้สั่ง
  useEffect(() => {
    stop(); setJob(null); setError(null);
    let alive = true;
    apiClient.get<Job[]>(API_ROUTES.plots.runs(plotId)).then((runs) => {
      const latest = runs[0]; // หลังบ้านเรียงรอบล่าสุดไว้ก่อน
      if (alive && latest && (latest.state === 'queued' || latest.state === 'running')) { setJob(latest); poll(latest.run_id); }
    }).catch(() => { /* ดูสถานะไม่ได้ก็แสดงปุ่มตามปกติ ถ้ากดซ้ำหลังบ้านจะคืนงานเดิมให้ */ });
    return () => { alive = false; stop(); };
  }, [plotId, poll]);

  const start = async () => {
    setError(null);
    try {
      const created = await apiClient.post<Job>(API_ROUTES.plots.analyze(plotId));
      setJob(created); poll(created.run_id);
      onNotify('เริ่มตรวจแปลงแล้ว ระบบกำลังดึงข้อมูลดาวเทียม 3 ปี อาจใช้เวลาหลายนาที');
    } catch (caught) { setError(errorText(caught)); }
  };

  const running = job?.state === 'queued' || job?.state === 'running';
  const ai = detail?.ai;
  const quality = ai?.model_quality;
  const steps = running ? job?.steps : detail?.run?.steps;

  return <Panel title="ตรวจความเป็นสวนยางด้วย AI" subtitle="Random Forest จากภาพ Sentinel-1/2 รายเดือน คู่กับกฎการผลัดใบ ถ้าสองวิธีเห็นต่างกันจะส่งให้ผู้ตรวจ"
    action={<Button variant="primary" disabled={!hasBoundary || running} onClick={() => void start()} title={hasBoundary ? undefined : 'ต้องบันทึกขอบเขตแปลงก่อน'}>{running ? <><RefreshCw size={14} /> กำลังตรวจ…</> : <><Satellite size={14} /> {detail?.has_result ? 'ตรวจใหม่' : 'ตรวจแปลงนี้'}</>}</Button>}>
    {error && <div className="pa-error" role="alert">{error}</div>}
    {!hasBoundary && <p className="pa-muted">ต้องบันทึกขอบเขตแปลงก่อน จึงจะสั่งตรวจได้</p>}
    {!!steps?.length && <ul className="pa-steps" aria-live="polite">{steps.map((step) => <li key={step.key} className={`pa-step-${step.state}`}><span />{step.label}</li>)}</ul>}
    {ai ? <div className="pa-result">
      {/* ถ้าผู้ตรวจตัดสินแล้ว ผลของผู้ตรวจเป็นข้อความหลัก ผล AI เดิมแสดงเป็นข้อความรอง */}
      {detail?.review?.decision
        ? <div className={`pa-status ${detail.review.decision === 'approved' ? 'pa-status-verified' : 'pa-status-rejected'}`}>{detail.review.decision === 'approved' ? 'ผู้ตรวจยืนยันว่าเป็นสวนยาง' : 'ผู้ตรวจไม่ยืนยัน'}<small> · ผล AI เดิม: {ai.status_th}</small></div>
        : <div className={`pa-status pa-status-${ai.status.toLowerCase()}`}>{ai.status_th}</div>}
      {detail?.review?.note && <p className="pa-muted">หมายเหตุผู้ตรวจ: {detail.review.note}</p>}
      {ai.region_note && <div className="pa-error" role="alert">{ai.region_note}</div>}
      <div className="pa-grid">
        <div><small>โอกาสเป็นสวนยาง (P ยาง)</small><b>{pct(ai.rubber_probability)}</b></div>
        <div><small>กฎผลัดใบ</small><b>{ai.phenology_rule_passed ? 'ผ่าน' : 'ไม่ผ่าน'}</b></div>
        <div><small>ปีที่เห็นการผลัดใบ</small><b>{ai.years_with_drop}/{ai.years_evaluated} ปี</b></div>
        {quality && <div><small>ที่โมเดลบอกว่ายาง ถูกจริง</small><b>{pct(quality.rubber_precision)}</b></div>}
        {quality && <div><small>สวนยางจริง โมเดลจับได้</small><b>{pct(quality.rubber_recall)}</b></div>}
        {quality && <div><small>แปลงตัวอย่างที่ใช้เทรน</small><b>{quality.n_samples ?? '—'}{quality.class_counts.rubber ? ` (ยาง ${quality.class_counts.rubber})` : ''}</b></div>}
      </div>
      {ai.phenology_rule_detail && <p className="pa-muted">กฎผลัดใบ: {ai.phenology_rule_detail}</p>}
      {!!ai.classes.length && <p className="pa-muted">ความน่าจะเป็นแต่ละประเภท: {ai.classes.map((item) => `${item.label} ${pct(item.probability)}`).join(' · ')}</p>}
      {!!detail?.warnings?.length && <ul className="pa-list">{detail.warnings.map((line) => <li key={line}>{line}</li>)}</ul>}
      <p className="pa-muted">โมเดลเทรนจากแผนที่อ้างอิงในภาคใต้ ไม่ใช่การสำรวจภาคสนาม ใช้คัดกรองเบื้องต้นเท่านั้น</p>
    </div> : !running && hasBoundary && <p className="pa-muted">{detail ? 'แปลงนี้ยังไม่ได้ตรวจ กด “ตรวจแปลงนี้” เพื่อให้โมเดลประเมินจากข้อมูลดาวเทียมจริง' : 'กำลังโหลดผลตรวจล่าสุด…'}</p>}
  </Panel>;
}

/** คาร์บอนระดับคัดกรอง หลังบ้านไม่ส่งตัวเลขมาถ้าแปลงไม่ผ่านเกณฑ์หรือรอผู้ตรวจ */
function CarbonPanel({ detail, plotName, plotId, onNotify }: { detail: PlotDetail | null; plotName: string; plotId: string; onNotify: (message: string) => void }) {
  const carbon = detail?.carbon;
  const shown = carbon?.visible ? carbon : null;
  const download = async () => {
    try { await apiClient.download(API_ROUTES.plots.report(plotId), `CarbonLens-${plotName.replace(/[\\/:*?"<>|]/g, '-')}-ผลตรวจ.html`); }
    catch (caught) { onNotify(errorText(caught)); }
  };

  return <Panel title="คาร์บอนระดับคัดกรอง" subtitle="คำนวณเฉพาะแปลงที่ผ่านเกณฑ์ความเป็นสวนยาง" action={<span className="estimate-tag">{shown ? 'ค่าคัดกรอง' : 'ยังไม่มีตัวเลข'}</span>} className="pa-carbon">
    {shown ? <>
      <div className="pa-carbon-main">
        <div><small>ช่วงที่น่าจะเป็น (90%) ปี {shown.assessment_year}</small><b>{num(shown.stock_tco2e_per_rai_p05)} – {num(shown.stock_tco2e_per_rai_p95)} <em>tCO₂e/ไร่</em></b></div>
        <div><small>ช่วงรวมทั้งแปลง ({num(shown.area_rai)} ไร่)</small><b>{num(shown.stock_tco2e_p05, 1)} – {num(shown.stock_tco2e_p95, 1)} <em>tCO₂e</em></b></div>
        <div><small>ค่ากลาง</small><b>{num(shown.stock_tco2e_per_rai)} <em>tCO₂e/ไร่</em></b></div>
      </div>
      <p className="pa-muted">ช่วงนี้กว้าง เพราะโมเดลชีวมวลอธิบายความต่างระหว่างพื้นที่ได้ราว {shown.model_r2 != null ? `${Math.round(shown.model_r2 * 100)}%` : '—'} (R² {shown.model_r2?.toFixed(2) ?? '—'}) จึงยังใช้เทียบแปลงต่อแปลงไม่ได้ ค่าจริงอาจอยู่ที่ใดก็ได้ในช่วงนี้</p>
    </> : <p className="pa-carbon-empty">{carbon?.reason ?? (detail?.has_result ? 'ไม่แสดงตัวเลข' : 'ยังไม่มีผลตรวจ จึงยังไม่มีตัวเลขคาร์บอน')}</p>}
    {carbon && <ul className="pa-list">{[...carbon.disclaimers, ...(shown?.notes ?? [])].map((line) => <li key={line}>{line}</li>)}</ul>}
    <div className="pa-carbon-foot"><small>ไม่ใช่คาร์บอนเครดิตที่รับรอง ไม่ใช่การประเมินตาม T-VER และไม่ใช่ปริมาณพร้อมขาย</small>{detail?.has_result && <Button onClick={() => void download()}><Download size={14} /> ดาวน์โหลดรายงานผลตรวจ</Button>}</div>
  </Panel>;
}
