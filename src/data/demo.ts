import type { FieldItem, Project } from '../types';

export const DEMO_PROJECTS: Project[] = [
  { id: 'p-01', name: 'สวนยางบ้านธงชัย', province: 'ประจวบคีรีขันธ์', district: 'บางสะพาน', manager: 'สุภาวดี คำปัน', forestType: 'สวนยางเชิงเดี่ยว', description: 'แปลงยางพาราตัวอย่างสำหรับเตรียมข้อมูลและติดตามการจัดการสวน', area: 124, plots: 2, status: 'กำลังดำเนินการ', updated: '2 พ.ย. 2569', dominantSpecies: 'ยางพารา', plantingYear: 2558 },
  { id: 'p-02', name: 'สวนยางชุมชนห้วยยอด', province: 'ตรัง', district: 'ห้วยยอด', manager: 'ทีมสหกรณ์สวนยาง', forestType: 'สวนยางผสม', description: 'สวนยางผสมพืชคลุมดิน รอตรวจหลักฐานการจัดการแปลง', area: 86, plots: 1, status: 'รอตรวจสอบ', updated: '31 ต.ค. 2569', dominantSpecies: 'ยางพารา', plantingYear: 2560 },
  { id: 'p-03', name: 'สวนยางเกาะช้าง', province: 'ตราด', district: 'เกาะช้าง', manager: 'ทีมภาคสนาม', forestType: 'สวนยางให้ผลผลิต', description: 'แปลงตัวอย่างเพื่อจัดเก็บข้อมูลรอบกรีดและการดูแลสวน', area: 62, plots: 1, status: 'เตรียมข้อมูล', updated: '29 ต.ค. 2569', dominantSpecies: 'ยางพารา', plantingYear: 2556 },
  { id: 'p-04', name: 'สวนยางอ่าวลึก', province: 'กระบี่', district: 'อ่าวลึก', manager: 'ทีมสำรวจ', forestType: 'สวนยางปลูกใหม่', description: 'ตัวอย่างแปลงยางพาราสำหรับติดตามอายุและการเติบโต', area: 48, plots: 1, status: 'กำลังดำเนินการ', updated: '25 ต.ค. 2569', dominantSpecies: 'ยางพารา', plantingYear: 2563 },
];

export const DEMO_SATELLITE = {
  isMock: true,
  provider: 'Sentinel-2 L2A',
  sceneDate: '12 ต.ค. 2569',
  cloudCoverage: null,
  indices: { NDVI: 0.68, EVI: null, GNDVI: null },
};

export const INITIAL_FIELD_ITEMS: FieldItem[] = [
  { id: 'boundary', category: 'ขอบเขตและสิทธิ์พื้นที่', title: 'ยืนยันพิกัดขอบเขตแปลง', description: 'ตรวจสอบกับผู้ดูแลพื้นที่และแนวเขตจริง', status: 'ตรวจสอบแล้ว' },
  { id: 'area', category: 'ขอบเขตและสิทธิ์พื้นที่', title: 'ยืนยันขนาดพื้นที่สุทธิ', description: 'ตัดพื้นที่ซ้อนทับหรือพื้นที่ที่ไม่เข้าเกณฑ์', status: 'ตรวจสอบแล้ว' },
  { id: 'rights', category: 'ขอบเขตและสิทธิ์พื้นที่', title: 'ตรวจเอกสารสิทธิ์หรือหนังสืออนุญาต', description: 'ระบุประเภทเอกสาร ผู้ถือสิทธิ์ และอายุเอกสาร', status: 'รอตรวจสอบ' },
  { id: 'history', category: 'ขอบเขตและสิทธิ์พื้นที่', title: 'ตรวจประวัติการใช้ประโยชน์พื้นที่', description: 'ยืนยันข้อมูลย้อนหลังตามช่วงเวลาที่ระเบียบวิธีกำหนด', status: 'ยังไม่ตรวจสอบ' },
  { id: 'species', category: 'สภาพสวนยางและการจัดการ', title: 'บันทึกพันธุ์ยางและปีปลูก', description: 'ตรวจสอบพันธุ์ยาง อายุแปลง และจำนวนต้นโดยประมาณ', status: 'ตรวจสอบแล้ว' },
  { id: 'plots', category: 'สภาพสวนยางและการจัดการ', title: 'ระบุตำแหน่งแปลงตัวอย่าง', description: 'กำหนดจุดสำรวจให้ครอบคลุมสภาพแปลงยาง', status: 'ตรวจสอบแล้ว' },
  { id: 'biomass', category: 'สภาพสวนยางและการจัดการ', title: 'สำรวจขนาดต้นยางและชีวมวล', description: 'บันทึกเส้นรอบวง ความสูง และจำนวนต้นตามแผนสำรวจ', status: 'รอตรวจสอบ' },
  { id: 'canopy', category: 'สภาพสวนยางและการจัดการ', title: 'ตรวจสภาพทรงพุ่มและสุขภาพต้นยาง', description: 'บันทึกสภาพต้นยาง ความเสียหาย และหลักฐานประกอบ', status: 'ยังไม่ตรวจสอบ' },
  { id: 'photos', category: 'สภาพสวนยางและการจัดการ', title: 'บันทึกภาพถ่ายภาคสนาม', description: 'แนบภาพแปลง ต้นยาง และอุปกรณ์กรีดยางพร้อมวันเวลาและตำแหน่ง', status: 'ยังไม่ตรวจสอบ' },
  { id: 'activity', category: 'กิจกรรมและการติดตาม', title: 'บันทึกกิจกรรมปลูกและดูแลสวนยาง', description: 'ระบุปีปลูก การบำรุงรักษา การกรีดยาง และผู้รับผิดชอบ', status: 'ตรวจสอบแล้ว' },
  { id: 'fire', category: 'กิจกรรมและการติดตาม', title: 'ยืนยันแผนดูแลสวนและจัดการความเสี่ยง', description: 'แนวทางดูแลต้นยาง จัดการวัชพืช โรค และความเสี่ยงไฟ', status: 'ต้องแก้ไขข้อมูล' },
  { id: 'monitor', category: 'กิจกรรมและการติดตาม', title: 'ยืนยันแผนติดตามและรายงาน', description: 'กำหนดรอบเวลา ผู้รับผิดชอบ และหลักฐาน', status: 'ยังไม่ตรวจสอบ' },
];

export const DEMO_PLACES = [
  { name: 'ธงชัย, ประจวบคีรีขันธ์', lat: 11.3916, lng: 99.5775 },
  { name: 'เกาะช้าง, ตราด', lat: 12.05, lng: 102.35 },
  { name: 'ห้วยยอด, ตรัง', lat: 7.789, lng: 99.634 },
  { name: 'อ่าวลึก, กระบี่', lat: 8.378, lng: 98.721 },
  { name: 'สุราษฎร์ธานี', lat: 9.14, lng: 99.33 },
  { name: 'ประเทศไทย', lat: 15.87, lng: 100.99 },
];
