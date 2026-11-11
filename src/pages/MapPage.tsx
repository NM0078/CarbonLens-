import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Download, Footprints, LocateFixed, Search, Upload } from 'lucide-react';
import L from 'leaflet';
import 'leaflet-draw';
import type { Feature, Polygon } from 'geojson';
import { DEMO_PLACES } from '../data/demo';
import { areaUnits, geodesicArea } from '../domain/geometry';
import type { Project } from '../types';
import { Button, Notice, PageHeader } from '../components/ui';
import './MapPage.css';

type PolygonFeature = Feature<Polygon>;

// รหัส error ของ Geolocation API (Leaflet ส่ง 0 เมื่อเบราว์เซอร์ไม่รองรับ หรือหน้าเว็บไม่ใช่ https/localhost)
const LOCATION_ERRORS: Record<number, string> = {
  0: 'เบราว์เซอร์นี้หาตำแหน่งไม่ได้ ต้องเปิดหน้าเว็บผ่าน https หรือ localhost',
  1: 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณากดอนุญาตตำแหน่งในเบราว์เซอร์ แล้วลองใหม่',
  2: 'หาตำแหน่งไม่ได้ ตรวจว่าเปิด GPS หรือ Location ของอุปกรณ์แล้ว',
  3: 'หาตำแหน่งนานเกินไป ลองใหม่ในที่โล่ง หรือเปิด GPS',
};
const POOR_ACCURACY_M = 100; // คลาดเกินนี้มักเป็นตำแหน่งจาก Wi-Fi/IP ของคอมพิวเตอร์ ไม่ใช่ GPS
// โหมดเดินรอบแปลง: มุมแปลงที่คลาดเกิน 30 ม. ทำให้พื้นที่ผิดมากสำหรับแปลงขนาดไม่กี่ไร่ จึงไม่รับ
const MAX_PIN_ACCURACY_M = 30;
const MIN_PIN_SPACING_M = 3; // จุดที่ห่างจากจุดก่อนหน้าไม่ถึงนี้ น่าจะเป็นการกดซ้ำที่เดิม
type WalkPoint = { lat: number; lng: number; accuracy: number };

export function MapPage({ projects, onSave, onNotify, guestMode = false, embedded = false, selectedId: controlledId, onSelect }: { projects: Project[]; onSave: (id: string, feature: PolygonFeature, rai: number, parcelName: string) => void; onNotify: (message: string) => void; guestMode?: boolean; embedded?: boolean; selectedId?: string; onSelect?: (id: string) => void }) {
  const mapHost = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const drawn = useRef<L.FeatureGroup | null>(null);
  const polygon = useRef<L.Polygon | null>(null);
  const marker = useRef<L.Marker | null>(null);
  // วงรัศมีความคลาดเคลื่อนของ "ตำแหน่งของฉัน" ให้ผู้ใช้เห็นว่าพิกัดแม่นแค่ไหน
  const accuracyCircle = useRef<L.Circle | null>(null);
  const [locating, setLocating] = useState(false);
  // ตัวจัดการ event ของแผนที่ผูกครั้งเดียวตอนสร้างแผนที่ จึงอ่าน onNotify ล่าสุดผ่าน ref
  const notifyRef = useRef(onNotify);
  notifyRef.current = onNotify;
  // โหมดเดินรอบแปลง: ผู้ใช้ไปยืนที่มุมแปลงแล้วปักจุดจาก GPS ทีละมุม ครบแล้วจึงสร้างเป็นขอบเขต
  const [walking, setWalking] = useState(false);
  const [walkPoints, setWalkPoints] = useState<WalkPoint[]>([]);
  const [pinning, setPinning] = useState(false);
  const walkLayer = useRef<L.LayerGroup | null>(null);
  // หน้าประเมินส่งแปลงที่เลือกมาให้ เพื่อให้แผนที่และผลตรวจแสดงแปลงเดียวกัน ถ้าไม่ส่งมาจะเลือกเอง
  const [internalId, setInternalId] = useState(projects[0]?.id ?? '');
  const selectedId = controlledId ?? internalId;
  const setSelectedId = onSelect ?? setInternalId;
  // เริ่มจากชื่อแปลงที่บันทึกไว้ ไม่ใช้ชื่อตัวอย่าง เพราะกดบันทึกขอบเขตแล้วชื่อนี้จะถูกเก็บที่หลังบ้าน
  const [parcelName, setParcelName] = useState(projects[0]?.parcelName ?? '');
  const [search, setSearch] = useState('');
  const [area, setArea] = useState(0);
  const [coordinates, setCoordinates] = useState<number[][]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => projects.find((project) => project.id === selectedId), [projects, selectedId]);

  const updateGeometry = (layer: L.Polygon | null) => {
    polygon.current = layer;
    if (!layer) { setArea(0); setCoordinates([]); return; }
    const latLngs = layer.getLatLngs()[0] as L.LatLng[];
    setArea(geodesicArea(latLngs));
    const geo = layer.toGeoJSON() as PolygonFeature;
    setCoordinates(geo.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]));
  };

  useEffect(() => {
    if (!mapHost.current || map.current) return;
    const instance = L.map(mapHost.current, { zoomControl: true }).setView([18.55, 98.35], 9);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community' }).addTo(instance);
    const group = new L.FeatureGroup(); group.addTo(instance);
    map.current = instance; drawn.current = group;
    if (!guestMode) {
      const DrawControl = (L.Control as unknown as { Draw: new (options: object) => L.Control }).Draw;
      instance.addControl(new DrawControl({ position: 'topleft', draw: { polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: '#28744f', fillColor: '#8fb982', fillOpacity: 0.27 } }, rectangle: false, circle: false, circlemarker: false, polyline: false, marker: false }, edit: { featureGroup: group, remove: true } }));
    }
    instance.on('draw:created', (event: L.LeafletEvent & { layer: L.Layer }) => { group.clearLayers(); const layer = event.layer as L.Polygon; group.addLayer(layer); updateGeometry(layer); });
    instance.on('draw:edited', () => updateGeometry(polygon.current));
    instance.on('draw:deleted', () => updateGeometry(null));
    const saved = projects.find((project) => project.id === selectedId)?.boundary;
    if (saved) { const layer = L.geoJSON(saved).getLayers().find((item) => item instanceof L.Polygon) as L.Polygon | undefined; if (layer) { group.addLayer(layer); updateGeometry(layer); instance.fitBounds(layer.getBounds()); } }
    // ตำแหน่งของฉัน: พิกัดอยู่ในเบราว์เซอร์เท่านั้น ไม่ส่งไปหลังบ้าน จนกว่าผู้ใช้จะวาดและบันทึกขอบเขตเอง
    instance.on('locationfound', (event: L.LocationEvent) => {
      setLocating(false);
      const { lat, lng } = event.latlng;
      const accuracy = Math.round(event.accuracy);
      marker.current?.remove(); accuracyCircle.current?.remove();
      accuracyCircle.current = L.circle(event.latlng, { radius: event.accuracy, color: '#2563eb', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.12 }).addTo(instance);
      marker.current = L.marker(event.latlng).addTo(instance)
        .bindPopup(`<b>ตำแหน่งของฉัน</b><br>${lat.toFixed(6)}, ${lng.toFixed(6)}<br>คลาดเคลื่อนประมาณ ± ${accuracy.toLocaleString('th-TH')} ม.`).openPopup();
      setSearch(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      if (accuracy > POOR_ACCURACY_M) notifyRef.current(`ตำแหน่งคลาดเคลื่อนประมาณ ± ${accuracy.toLocaleString('th-TH')} ม. ตำแหน่งจากคอมพิวเตอร์อาจคลาดมาก ควรใช้มือถือที่เปิด GPS`);
    });
    instance.on('locationerror', (event: L.ErrorEvent) => { setLocating(false); notifyRef.current(LOCATION_ERRORS[event.code] ?? 'หาตำแหน่งไม่ได้ กรุณาลองใหม่'); });
    const resize = () => instance.invalidateSize(); window.setTimeout(resize, 100); window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); instance.stopLocate(); instance.remove(); map.current = null; drawn.current = null; polygon.current = null; marker.current = null; accuracyCircle.current = null; walkLayer.current = null; };
    // The first project seeds this view; project changes are loaded by the effect below.
  }, [guestMode]);

  useEffect(() => { setParcelName(selected?.parcelName ?? ''); }, [selectedId, selected?.parcelName]);

  useEffect(() => {
    if (!map.current || !drawn.current) return;
    drawn.current.clearLayers(); updateGeometry(null);
    const saved = selected?.boundary;
    if (!saved) return;
    const layer = L.geoJSON(saved).getLayers().find((item) => item instanceof L.Polygon) as L.Polygon | undefined;
    if (layer) { drawn.current.addLayer(layer); updateGeometry(layer); map.current.fitBounds(layer.getBounds()); }
  }, [selectedId, selected?.boundary]);

  const searchPlace = () => {
    if (!map.current) return;
    const coordinate = search.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
    let location: { lat: number; lng: number; name: string } | undefined;
    if (coordinate) {
      const lat = Number(coordinate[1]); const lng = Number(coordinate[2]);
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) { onNotify('พิกัดไม่ถูกต้อง'); return; }
      location = { lat, lng, name: `พิกัด ${lat.toFixed(6)}, ${lng.toFixed(6)}` };
    } else {
      const place = DEMO_PLACES.find((item) => item.name.toLocaleLowerCase('th').includes(search.toLocaleLowerCase('th')) || search.toLocaleLowerCase('th').includes(item.name.split(',')[0].toLocaleLowerCase('th')));
      if (place) location = { ...place, name: `${place.name} · ตำแหน่งตัวอย่าง` };
    }
    if (!location) { onNotify('ไม่พบสถานที่ในชุดตัวอย่าง ลองค้น “แม่แจ่ม” หรือใส่พิกัด'); return; }
    map.current.setView([location.lat, location.lng], 13);
    marker.current?.remove(); accuracyCircle.current?.remove(); accuracyCircle.current = null;
    marker.current = L.marker([location.lat, location.lng]).addTo(map.current).bindPopup(location.name).openPopup();
  };

  /** ขอตำแหน่งปัจจุบันจากเบราว์เซอร์ (เบราว์เซอร์จะถามผู้ใช้ก่อน) แล้วซูมไปที่ตำแหน่งนั้น */
  const locateMe = () => {
    if (!map.current) return;
    setLocating(true);
    map.current.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  // วาดจุดที่ปักแล้วเป็นเส้นประสีส้ม ให้เห็นรูปแปลงก่อนสร้างเป็นขอบเขตจริง
  useEffect(() => {
    const instance = map.current;
    walkLayer.current?.remove(); walkLayer.current = null;
    if (!instance || !walking || !walkPoints.length) return;
    const group = L.layerGroup().addTo(instance);
    const latLngs = walkPoints.map((point) => L.latLng(point.lat, point.lng));
    L.polyline(latLngs.length > 2 ? [...latLngs, latLngs[0]] : latLngs, { color: '#f59e0b', weight: 3, dashArray: '6 4' }).addTo(group);
    walkPoints.forEach((point, index) => {
      L.circleMarker([point.lat, point.lng], { radius: 6, color: '#b45309', weight: 2, fillColor: '#fbbf24', fillOpacity: 1 })
        .bindTooltip(`จุด ${index + 1} · ± ${Math.round(point.accuracy)} ม.`).addTo(group);
    });
    walkLayer.current = group;
  }, [walking, walkPoints]);

  const startWalk = () => { setWalkPoints([]); setWalking(true); onNotify('ไปยืนที่มุมแปลงแล้วกด “ปักจุดตรงนี้” ทีละมุม เดินวนทางเดียวกันจนครบทุกมุม'); };
  const cancelWalk = () => { setWalking(false); setWalkPoints([]); };

  /** อ่านตำแหน่ง GPS ตอนนี้แล้วเพิ่มเป็นมุมแปลง รับเฉพาะจุดที่แม่นพอ */
  const pinHere = () => {
    if (!('geolocation' in navigator)) { onNotify(LOCATION_ERRORS[0]); return; }
    setPinning(true);
    navigator.geolocation.getCurrentPosition((position) => {
      setPinning(false);
      const { latitude: lat, longitude: lng, accuracy } = position.coords;
      if (accuracy > MAX_PIN_ACCURACY_M) {
        onNotify(`ตำแหน่งคลาดเคลื่อน ± ${Math.round(accuracy).toLocaleString('th-TH')} ม. มากเกินไป (ต้องไม่เกิน ${MAX_PIN_ACCURACY_M} ม.) รอให้ GPS นิ่งในที่โล่งแล้วกดใหม่`);
        return;
      }
      const here = L.latLng(lat, lng);
      // ปุ่มถูกปิดระหว่างอ่าน GPS จึงไม่มีการปักซ้อนกัน walkPoints ตอนกดจึงเป็นค่าล่าสุด
      const last = walkPoints[walkPoints.length - 1];
      if (last && here.distanceTo([last.lat, last.lng]) < MIN_PIN_SPACING_M) {
        onNotify('จุดนี้ใกล้จุดก่อนหน้าเกินไป เดินไปมุมถัดไปก่อนแล้วค่อยกด');
        return;
      }
      setWalkPoints([...walkPoints, { lat, lng, accuracy }]);
      map.current?.setView(here, Math.max(map.current.getZoom(), 18));
    }, (error) => {
      setPinning(false);
      onNotify(LOCATION_ERRORS[error.code] ?? 'หาตำแหน่งไม่ได้ กรุณาลองใหม่');
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  };

  /** สร้างขอบเขตจากจุดที่ปัก แล้วให้ผู้ใช้ตรวจรูปและกด "บันทึกขอบเขต" เอง (แก้มุมต่อได้ด้วยเครื่องมือแก้ไขของแผนที่) */
  const finishWalk = () => {
    if (!drawn.current || !map.current) return;
    if (walkPoints.length < 3) { onNotify('ต้องปักอย่างน้อย 3 มุม จึงจะเป็นแปลงได้'); return; }
    const layer = L.polygon(walkPoints.map((point) => [point.lat, point.lng] as [number, number]), { color: '#28744f', fillColor: '#8fb982', fillOpacity: 0.27 });
    drawn.current.clearLayers(); drawn.current.addLayer(layer); updateGeometry(layer); map.current.fitBounds(layer.getBounds());
    const worst = Math.round(Math.max(...walkPoints.map((point) => point.accuracy)));
    setWalking(false); setWalkPoints([]);
    onNotify(`สร้างขอบเขตจาก ${walkPoints.length} จุด GPS แล้ว (คลาดมากสุด ± ${worst} ม.) ตรวจรูปบนแผนที่ แล้วกด “บันทึกขอบเขต”`);
  };

  const importGeoJson = async (file?: File) => {
    if (!file || !drawn.current || !map.current) return;
    try {
      const data = JSON.parse(await file.text()) as GeoJSON.GeoJsonObject;
      const layer = L.geoJSON(data).getLayers().find((item) => item instanceof L.Polygon) as L.Polygon | undefined;
      if (!layer) throw new Error('Expected a Polygon');
      drawn.current.clearLayers(); drawn.current.addLayer(layer); updateGeometry(layer); map.current.fitBounds(layer.getBounds()); onNotify('นำเข้า GeoJSON แล้ว');
    } catch { onNotify('อ่านไฟล์ไม่ได้ ต้องเป็น GeoJSON ที่มี Polygon'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const exportGeoJson = () => {
    if (!polygon.current) { onNotify('ยังไม่มี Polygon สำหรับส่งออก'); return; }
    const content = JSON.stringify(polygon.current.toGeoJSON(), null, 2);
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type: 'application/geo+json' })); link.download = 'carbonlens-boundary.geojson'; link.click(); URL.revokeObjectURL(link.href);
  };

  const units = areaUnits(area);
  return <section className={embedded ? 'embedded-map-section' : 'page active'}>
    {!embedded && <PageHeader eyebrow={`${selected?.name ?? 'ยังไม่มีโครงการ'} / แปลง`} title="ภาพถ่ายดาวเทียมและพื้นที่" subtitle="ใช้ภาพถ่ายดาวเทียมเป็นพื้นหลังเดียว วาดขอบเขตแปลงบนภาพเพื่อคำนวณพื้นที่" action={<Button variant="primary" disabled={guestMode || !selected || !polygon.current} onClick={() => { if (selected && polygon.current) onSave(selected.id, polygon.current.toGeoJSON() as PolygonFeature, units.rai, parcelName); }}>บันทึกขอบเขต</Button>} />}
    {!embedded && <Notice>ภาพพื้นหลังจาก Esri ใช้ประกอบการระบุตำแหน่งและวาดขอบเขตเท่านั้น ส่วน Sentinel-2 และ NDVI ยังไม่มีการเชื่อมต่อ ขนาดพื้นที่คำนวณจากพิกัด Polygon และควรตรวจสอบภาคสนามก่อนใช้งานจริง</Notice>}
    {embedded && <div className="embedded-map-heading"><h2>ภาพถ่ายดาวเทียมและพื้นที่แปลง</h2><Button variant="primary" disabled={guestMode || !selected || !polygon.current} onClick={() => { if (selected && polygon.current) onSave(selected.id, polygon.current.toGeoJSON() as PolygonFeature, units.rai, parcelName); }}>บันทึกขอบเขต</Button></div>}<div className="map-workspace"><section className="panel map-editor"><div className="map-toolbar"><div><b>ภาพถ่ายดาวเทียม · Esri World Imagery</b><small>วาดหรือแก้ไขขอบเขตแปลงบนภาพเพื่อประเมินพื้นที่</small></div><div className="map-tools"><input className="place-search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') searchPlace(); }} placeholder="ค้นหาสถานที่หรือพิกัด lat, lon" aria-label="ค้นหาสถานที่หรือพิกัด" /><button className="tool-btn" onClick={searchPlace}><Search size={13} /> ค้นหา</button><button className="tool-btn" onClick={() => map.current?.setView([15.87, 100.99], 6)}><LocateFixed size={13} /> ประเทศไทย</button><button className="tool-btn" onClick={locateMe} disabled={locating} title="ใช้ตำแหน่งปัจจุบันของอุปกรณ์ เบราว์เซอร์จะขออนุญาตก่อน"><Crosshair size={13} /> {locating ? 'กำลังหาตำแหน่ง…' : 'ตำแหน่งของฉัน'}</button>{!guestMode && !walking && <button className="tool-btn" onClick={startWalk} title="ไปยืนที่มุมแปลงแล้วปักจุดจาก GPS ทีละมุม"><Footprints size={13} /> เดินรอบแปลง (GPS)</button>}</div></div>
      {walking && <div className="walk-panel" role="region" aria-label="เดินรอบแปลงด้วย GPS">
        <div><b>เดินรอบแปลงด้วย GPS</b><span>ไปยืนที่มุมแปลงแล้วกด “ปักจุดตรงนี้” เดินวนทางเดียวกันจนครบทุกมุม · ปักแล้ว {walkPoints.length} จุด (ต้องอย่างน้อย 3) · แต่ละจุดต้องคลาดไม่เกิน {MAX_PIN_ACCURACY_M} ม.</span></div>
        <div className="walk-actions"><Button variant="primary" onClick={pinHere} disabled={pinning}>{pinning ? 'กำลังอ่าน GPS…' : 'ปักจุดตรงนี้'}</Button><Button onClick={() => setWalkPoints((current) => current.slice(0, -1))} disabled={!walkPoints.length || pinning}>ลบจุดล่าสุด</Button><Button onClick={finishWalk} disabled={walkPoints.length < 3 || pinning}>จบและสร้างขอบเขต</Button><Button variant="quiet" onClick={cancelWalk}>ยกเลิก</Button></div>
      </div>}
      <div className="editor-map"><div id="carbonlens-leaflet-map" ref={mapHost} aria-label="ภาพถ่ายดาวเทียมสำหรับวาดขอบเขตแปลง" /></div><div className="map-footer"><span><i className="green-dot" /> วาด / แก้ไข / ลบขอบเขต</span><span>{coordinates.length ? `${Math.max(0, coordinates.length - 1)} จุด · GeoJSON` : 'ยังไม่มีขอบเขต'}</span></div></section>
      <aside className="panel boundary-side"><h2>รายละเอียดแปลง</h2><p>พิกัด WGS84 · พื้นที่จาก Polygon</p><label>โครงการ<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>ชื่อแปลง<input value={parcelName} onChange={(e) => setParcelName(e.target.value)} /></label><div className="area-card"><span>พื้นที่จากพิกัด</span><b>{area ? units.rai.toLocaleString('th-TH', { maximumFractionDigits: 2 }) : '—'} <small>ไร่</small></b><small>{area ? `${units.hectares.toLocaleString('th-TH', { maximumFractionDigits: 3 })} เฮกตาร์ · ${units.squareMeters.toLocaleString('th-TH', { maximumFractionDigits: 1 })} ตร.ม.` : '— เฮกตาร์ · — ตร.ม.'}</small></div><div className="coordinate-box"><b>พิกัด Polygon</b><pre>{coordinates.length ? coordinates.map((point, index) => `${index + 1}. ${point[0].toFixed(6)}, ${point[1].toFixed(6)}`).join('\n') : 'ยังไม่มีขอบเขต'}</pre></div><input ref={fileRef} type="file" accept=".geojson,.json" hidden onChange={(e) => void importGeoJson(e.target.files?.[0])} /><button className="upload-box" disabled={guestMode} onClick={() => fileRef.current?.click()}><Upload size={15} /><b>นำเข้า GeoJSON</b><small>ไฟล์ .geojson หรือ .json</small></button><Button className="export-geojson" disabled={!polygon.current} onClick={exportGeoJson}><Download size={13} /> ส่งออก GeoJSON</Button><div className="side-hint"><span>ⓘ</span> {guestMode ? 'โหมดเยี่ยมชมดูภาพถ่ายดาวเทียมได้ แต่บันทึกขอบเขตไม่ได้' : 'ขอบเขตบันทึกที่ระบบหลังบ้าน พื้นที่ด้านบนเป็นค่าประมาณจากเบราว์เซอร์ หลังบันทึกจะใช้ค่าที่หลังบ้านคำนวณ'}</div></aside>
    </div>
  </section>;
}
