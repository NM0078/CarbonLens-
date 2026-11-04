import type { FieldItem, Project } from '../types';

export const DEMO_PROJECTS: Project[] = [
  { id: 'p-01', name: 'ฟื้นฟูป่าต้นน้ำแม่แจ่ม', province: 'เชียงใหม่', district: 'แม่แจ่ม', manager: 'สุภาวดี คำปัน', forestType: 'ป่าต้นน้ำ', description: 'โครงการฟื้นฟูพื้นที่ป่าต้นน้ำโดยชุมชน', area: 624, plots: 2, status: 'กำลังดำเนินการ', updated: '2 พ.ย. 2569' },
  { id: 'p-02', name: 'ป่าชุมชนบ้านแม่ลาน', province: 'ลำพูน', district: 'ลี้', manager: 'ทีมป่าชุมชน', forestType: 'ป่าชุมชน', description: 'พื้นที่ป่าชุมชนตัวอย่าง', area: 318, plots: 1, status: 'รอตรวจสอบ', updated: '31 ต.ค. 2569' },
  { id: 'p-03', name: 'แนวกันชนป่าดอยสุเทพ', province: 'เชียงใหม่', district: 'เมืองเชียงใหม่', manager: 'ทีมอนุรักษ์', forestType: 'ป่าอนุรักษ์', description: 'แนวกันชนและฟื้นฟูป่า', area: 206, plots: 1, status: 'เตรียมข้อมูล', updated: '29 ต.ค. 2569' },
  { id: 'p-04', name: 'ป่าฟื้นฟูห้วยน้ำดัง', province: 'เชียงใหม่', district: 'แม่แตง', manager: 'ทีมภาคสนาม', forestType: 'ป่าฟื้นฟู', description: 'พื้นที่ฟื้นฟูป่าและติดตามการเติบโต', area: 136, plots: 1, status: 'กำลังดำเนินการ', updated: '25 ต.ค. 2569' },
];

export const DEMO_SATELLITE = {
  isMock: true,
  provider: 'Sentinel-2 L2A',
  sceneDate: '12 ต.ค. 2569',
  cloudCoverage: null,
  indices: { NDVI: 0.68, EVI: null, GNDVI: null },
};

export const DEMO_CARBON_ASSESSMENT = {
  status: 'ข้อมูลไม่เพียงพอ' as const,
  tco2e: null as number | null,
  valueThb: null as number | null,
};

export const INITIAL_FIELD_ITEMS: FieldItem[] = [
  { id: 'boundary', category: 'ขอบเขตและสิทธิ์พื้นที่', title: 'ยืนยันพิกัดขอบเขตแปลง', description: 'ตรวจสอบกับผู้ดูแลพื้นที่และแนวเขตจริง', status: 'ตรวจสอบแล้ว' },
  { id: 'area', category: 'ขอบเขตและสิทธิ์พื้นที่', title: 'ยืนยันขนาดพื้นที่สุทธิ', description: 'ตัดพื้นที่ซ้อนทับหรือพื้นที่ที่ไม่เข้าเกณฑ์', status: 'ตรวจสอบแล้ว' },
  { id: 'rights', category: 'ขอบเขตและสิทธิ์พื้นที่', title: 'ตรวจเอกสารสิทธิ์หรือหนังสืออนุญาต', description: 'ระบุประเภทเอกสาร ผู้ถือสิทธิ์ และอายุเอกสาร', status: 'รอตรวจสอบ' },
  { id: 'history', category: 'ขอบเขตและสิทธิ์พื้นที่', title: 'ตรวจประวัติการใช้ประโยชน์พื้นที่', description: 'ยืนยันข้อมูลย้อนหลังตามช่วงเวลาที่ระเบียบวิธีกำหนด', status: 'ยังไม่ตรวจสอบ' },
  { id: 'species', category: 'สภาพป่าและพืชพรรณ', title: 'บันทึกชนิดพันธุ์ไม้หลัก', description: 'รายการชนิดไม้เด่นในพื้นที่โครงการ', status: 'ตรวจสอบแล้ว' },
  { id: 'plots', category: 'สภาพป่าและพืชพรรณ', title: 'ระบุตำแหน่งแปลงตัวอย่าง', description: 'กระจายจุดสำรวจให้ครอบคลุมสภาพพื้นที่', status: 'ตรวจสอบแล้ว' },
  { id: 'biomass', category: 'สภาพป่าและพืชพรรณ', title: 'สำรวจขนาดต้นไม้และชีวมวล', description: 'บันทึกเส้นรอบวง ความสูง และจำนวนต้น', status: 'รอตรวจสอบ' },
  { id: 'canopy', category: 'สภาพป่าและพืชพรรณ', title: 'ตรวจสภาพการฟื้นตัวและเรือนยอด', description: 'บันทึกสภาพพื้นที่และหลักฐานประกอบ', status: 'ยังไม่ตรวจสอบ' },
  { id: 'photos', category: 'สภาพป่าและพืชพรรณ', title: 'บันทึกภาพถ่ายภาคสนาม', description: 'แนบภาพพร้อมวันเวลาและตำแหน่ง', status: 'ยังไม่ตรวจสอบ' },
  { id: 'activity', category: 'กิจกรรมและการติดตาม', title: 'บันทึกกิจกรรมฟื้นฟูที่ผ่านมา', description: 'ระบุวันดำเนินการ พื้นที่ และผู้รับผิดชอบ', status: 'ตรวจสอบแล้ว' },
  { id: 'fire', category: 'กิจกรรมและการติดตาม', title: 'ยืนยันแผนบำรุงรักษาและป้องกันไฟ', description: 'แผนจัดการความเสี่ยงและการดูแลระยะยาว', status: 'ต้องแก้ไขข้อมูล' },
  { id: 'monitor', category: 'กิจกรรมและการติดตาม', title: 'ยืนยันแผนติดตามและรายงาน', description: 'กำหนดรอบเวลา ผู้รับผิดชอบ และหลักฐาน', status: 'ยังไม่ตรวจสอบ' },
];

export const DEMO_PLACES = [
  { name: 'แม่แจ่ม, เชียงใหม่', lat: 18.499, lng: 98.365 },
  { name: 'เมืองเชียงใหม่', lat: 18.7883, lng: 98.9853 },
  { name: 'ดอยสุเทพ, เชียงใหม่', lat: 18.8058, lng: 98.9214 },
  { name: 'อำเภอลี้, ลำพูน', lat: 17.802, lng: 98.95 },
  { name: 'ห้วยน้ำดัง, เชียงใหม่', lat: 19.302, lng: 98.607 },
  { name: 'ประเทศไทย', lat: 15.87, lng: 100.99 },
];
