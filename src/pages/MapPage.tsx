import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, LocateFixed, Search, Upload } from 'lucide-react';
import L from 'leaflet';
import 'leaflet-draw';
import type { Feature, Polygon } from 'geojson';
import { DEMO_PLACES } from '../data/demo';
import { areaUnits, geodesicArea } from '../domain/geometry';
import type { Project } from '../types';
import { Button, Notice, PageHeader } from '../components/ui';

type PolygonFeature = Feature<Polygon>;

export function MapPage({ projects, onSave, onNotify, guestMode = false, embedded = false }: { projects: Project[]; onSave: (id: string, feature: PolygonFeature, rai: number, parcelName: string) => void; onNotify: (message: string) => void; guestMode?: boolean; embedded?: boolean }) {
  const mapHost = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const drawn = useRef<L.FeatureGroup | null>(null);
  const polygon = useRef<L.Polygon | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? '');
  const [parcelName, setParcelName] = useState('แปลง A — สวนยางพาราต้นแบบ');
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
    const resize = () => instance.invalidateSize(); window.setTimeout(resize, 100); window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); instance.remove(); map.current = null; drawn.current = null; polygon.current = null; };
    // The first project seeds this view; project changes are loaded by the effect below.
  }, [guestMode]);

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
    if (!location) { onNotify('ไม่พบสถานที่ในชุดตัวอย่าง ลอง้้น “แม่แจ่ม” หรือใส่พิกัด'); return; }
    map.current.setView([location.lat, location.lng], 13);
    marker.current?.remove(); marker.current = L.marker([location.lat, location.lng]).addTo(map.current).bindPopup(location.name).openPopup();
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
    {embedded && <div className="embedded-map-heading"><h2>ภาพถ่ายดาวเทียมและพื้นที่แปลง</h2><Button variant="primary" disabled={guestMode || !selected || !polygon.current} onClick={() => { if (selected && polygon.current) onSave(selected.id, polygon.current.toGeoJSON() as PolygonFeature, units.rai, parcelName); }}>บันทึกขอบเขต</Button></div>}<div className="map-workspace"><section className="panel map-editor"><div className="map-toolbar"><div><b>ภาพถ่ายดาวเทียม · Esri World Imagery</b><small>วาดหรือแก้ไขขอบเขตแปลงบนภาพเพื่อประเมินพื้นที่</small></div><div className="map-tools"><input className="place-search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') searchPlace(); }} placeholder="ค้นหาสถานที่หรือพิกัด lat, lon" aria-label="ค้นหาสถานที่หรือพิกัด" /><button className="tool-btn" onClick={searchPlace}><Search size={13} /> ค้นหา</button><button className="tool-btn" onClick={() => map.current?.setView([15.87, 100.99], 6)}><LocateFixed size={13} /> ประเทศไทย</button></div></div><div className="editor-map"><div id="carbonlens-leaflet-map" ref={mapHost} aria-label="ภาพถ่ายดาวเทียมสำหรับวาดขอบเขตแปลง" /></div><div className="map-footer"><span><i className="green-dot" /> วาด / แก้ไข / ลบขอบเขต</span><span>{coordinates.length ? `${Math.max(0, coordinates.length - 1)} จุด · GeoJSON` : 'ยังไม่มีขอบเขต'}</span></div></section>
      <aside className="panel boundary-side"><h2>รายละเอียดแปลง</h2><p>พิกัด WGS84 · พื้นที่จาก Polygon</p><label>โครงการ<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>ชื่อแปลง<input value={parcelName} onChange={(e) => setParcelName(e.target.value)} /></label><div className="area-card"><span>พื้นที่จากพิกัด</span><b>{area ? units.rai.toLocaleString('th-TH', { maximumFractionDigits: 2 }) : '—'} <small>ไร่</small></b><small>{area ? `${units.hectares.toLocaleString('th-TH', { maximumFractionDigits: 3 })} เฮกตาร์ · ${units.squareMeters.toLocaleString('th-TH', { maximumFractionDigits: 1 })} ตร.ม.` : '— เฮกตาร์ · — ตร.ม.'}</small></div><div className="coordinate-box"><b>พิกัด Polygon</b><pre>{coordinates.length ? coordinates.map((point, index) => `${index + 1}. ${point[0].toFixed(6)}, ${point[1].toFixed(6)}`).join('\n') : 'ยังไม่มีขอบเขต'}</pre></div><input ref={fileRef} type="file" accept=".geojson,.json" hidden onChange={(e) => void importGeoJson(e.target.files?.[0])} /><button className="upload-box" disabled={guestMode} onClick={() => fileRef.current?.click()}><Upload size={15} /><b>นำเข้า GeoJSON</b><small>ไฟล์ .geojson หรือ .json</small></button><Button className="export-geojson" disabled={!polygon.current} onClick={exportGeoJson}><Download size={13} /> ส่งออก GeoJSON</Button><div className="side-hint"><span>ⓘ</span> {guestMode ? 'โหมดเยี่ยมชมดูภาพถ่ายดาวเทียมได้ แต่บันทึกขอบเขตไม่ได้' : 'ขอบเขตและพื้นที่บันทึกในเบราว์เซอร์นี้ ยังไม่ส่ง backend'}</div></aside>
    </div>
  </section>;
}
