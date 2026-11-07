# CarbonLens — Rubber Plantation Project Intelligence

เว็บแอปต้นแบบภาษาไทยสำหรับสหกรณ์และผู้พัฒนาโครงการสวนยางพารา สร้างด้วย React, TypeScript, Vite, Tailwind CSS, Recharts และ Leaflet หน้าหลักประกอบด้วย Dashboard, โครงการ, แผนที่พร้อมข้อมูลดาวเทียม, ประเมินโครงการและคาร์บอน, ตรวจภาคสนาม และรายงาน

## เริ่มใช้งาน

คำแนะนำสำหรับส่งต่อทีมและนำขึ้นโฮสต์อยู่ใน [TEAM-DEPLOY.md](./TEAM-DEPLOY.md)

ต้องมี Node.js 20.19+ หรือ 22.12+ และ pnpm

```sh
pnpm install
pnpm dev
```

เปิด URL ที่ Vite แสดงในเทอร์มินัล (ปกติคือ `http://localhost:5173`). สำหรับตรวจ build และทดสอบพื้นที่:

```sh
pnpm build
pnpm test
```

แผนที่พื้นหลังใช้ OpenStreetMap tiles จึงต้องเชื่อมต่ออินเทอร์เน็ต พร้อมแสดง attribution ตามข้อกำหนด ก่อนใช้งานจริงควรอ่าน [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) และเลือกผู้ให้บริการที่รองรับปริมาณใช้งาน

## ข้อมูลและข้อจำกัดของต้นแบบ

- การเข้าสู่ระบบและการลงทะเบียนเป็นโหมดสาธิต ใช้บัญชีในเบราว์เซอร์นี้ตามข้อจำกัดด้านล่าง
- หน้าลงทะเบียนสร้างบัญชีตัวอย่างในเบราว์เซอร์เดียวกัน และล็อกอินได้เฉพาะอีเมล/รหัสผ่านที่ลงทะเบียนไว้ (รหัสผ่านอย่างน้อย 8 ตัวอักษร) รหัสผ่านเก็บเป็น salted PBKDF2 hash ใน `localStorage`; ยังไม่ใช่ระบบยืนยันตัวตนที่ปลอดภัยสำหรับใช้งานจริง
- ปุ่ม Google เตรียมเรียก `GET /api/auth/google/start?intent=login|register` และคาดหวัง `{ "url": "https://accounts.google.com/..." }`; ต้องมี Google OAuth Client ID, callback และ backend ที่ตรวจสอบ ID token ก่อนใช้งานจริง การเชื่อมบัญชี Google ยังไม่ทำงานหากไม่มีบริการเหล่านี้
- โครงการและขอบเขตเก็บใน `localStorage` ของเบราว์เซอร์ ไม่ได้ซิงก์ระหว่างเครื่อง
- แผนที่คำนวณพื้นที่จากพิกัด polygon ด้วยสูตร spherical geodesic และแสดงตารางเมตร เฮกตาร์ และไร่ (1 ไร่ = 1,600 ตร.ม.) เป็นค่าประมาณในเบราว์เซอร์ ควรตรวจด้วย GIS ก่อนใช้จริง
- Sentinel-2, NDVI และผลประเมินเป็นข้อมูลตัวอย่าง ไม่มีการดึงภาพดาวเทียมจริงหรือเรียกโมเดล AI
- CarbonLens ยังไม่คำนวณ tCO₂e หรือมูลค่าเครดิตจริง และไม่รับรองเครดิต ข้อมูลศักยภาพและเครดิตแสดงว่าเป็น mock/ประมาณการ
- รายงานพิมพ์/บันทึก PDF ผ่านหน้าต่างพิมพ์ของเบราว์เซอร์ และส่งออก CSV ได้
- ข้อมูลตัวอย่างและรายการตรวจภาคสนามออกแบบสำหรับสวนยาง เช่น ปีปลูก พันธุ์ยาง การกรีด และการจัดการสวน
- ภาพสวนยางเป็นภาพถ่ายจริงจากประเทศไทย โดยแสดงเครดิตและลิงก์แหล่งภาพในหน้าเข้าสู่ระบบและภาพรวมโครงการ
- อบก. มีข้อมูลอ้างอิงว่าไม้ยืนต้นทางการเกษตร เช่น ยางพารา อาจอยู่ในขอบข่ายระเบียบวิธีภาคเกษตรที่เกี่ยวข้อง แต่การเข้าเกณฑ์ต้องตรวจตามเงื่อนไขและฉบับปัจจุบันของ อบก.; ต้นแบบไม่รับรองคุณสมบัติหรือคำนวณเครดิตจริง

## โครงสร้าง

- `src/pages/` — หน้าจอหลัก 8 หน้า รวมหน้าเข้าสู่ระบบ โดยรวมการประเมินและสถานะคาร์บอนไว้หน้าเดียว
- `src/components/` — shell, dialogs, controls, alerts
- `src/services/api.ts` — typed API client และ route placeholders สำหรับ backend
- `src/services/projectStore.ts` — localStorage demo store และ CSV export
- `src/data/demo.ts` — ข้อมูลจำลองที่แยกจาก UI
- `src/domain/geometry.ts` — คำนวณพื้นที่ polygon และแปลงหน่วย
- `legacy/` — รุ่น HTML/CSS/JS ที่เปิดผ่าน static serverได้
- `tests/geometry.test.cjs` — ทดสอบสูตรพื้นที่และการแปลงหน่วย

## เชื่อมข้อมูลจริงภายหลัง

1. เชื่อม `src/services/auth.ts` กับ `/api/auth/register` และ `/api/auth/login`; ย้ายการจัดเก็บบัญชีและการยืนยันรหัสผ่านไป backend, เพิ่ม session/cookie ที่ปลอดภัย, rate limiting, email verification และ password reset
2. ตั้งค่า Google OAuth Client ID และ callback; backend ต้องตรวจสอบ token กับ Google และเชื่อม identity กับบัญชีหลังยืนยันตัวตน ห้ามเชื่อข้อมูลอีเมลจาก browser โดยตรง
3. เปลี่ยน `src/services/projectStore.ts` ให้เรียก API ใน `src/services/api.ts`; เพิ่ม validation, loading/error states และสิทธิ์เข้าถึง
4. จัดเก็บ polygon และคำนวณพื้นที่หลักที่ backend ด้วย PostGIS พร้อมตรวจระบบพิกัดและ geometry
5. เชื่อม Sentinel-2/STAC หรือ Google Earth Engine พร้อม cloud masking, band provenance และการคำนวณ NDVI/EVI/GNDVI
6. เพิ่มการประเมินคาร์บอนภายหลังเมื่อยืนยันวิธีการที่ใช้ได้และได้รับข้อมูลภาคสนามครบถ้วน
7. ให้ผู้เชี่ยวชาญตรวจข้อมูลและวิธีการ T-VER ก่อนแสดงตัวเลข tCO₂e
8. เชื่อมรายงาน PDF/XLSX และบันทึก audit trail ฝั่ง backend

รายการ API ที่เตรียมไว้ครอบคลุมบัญชีผู้ใช้, projects, parcels/boundaries, satellite scenes/indices และ reports
