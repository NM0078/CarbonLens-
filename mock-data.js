/* Explicitly illustrative sample data; not satellite observations or carbon calculations. */
window.CarbonLensMockData = Object.freeze({
  isMock: true,
  projects: [
    { id: 'p-01', name: 'สวนยางบ้านธงชัย', province: 'ประจวบคีรีขันธ์', district: 'บางสะพาน', manager: 'สุภาวดี คำปัน', forestType: 'สวนยางเชิงเดี่ยว', description: 'แปลงยางพาราตัวอย่างสำหรับเตรียมข้อมูลสวน', area: 124, plots: 2, status: 'กำลังดำเนินการ', updated: '2 พ.ย. 2569' },
    { id: 'p-02', name: 'สวนยางชุมชนห้วยยอด', province: 'ตรัง', district: 'ห้วยยอด', manager: 'ทีมสหกรณ์สวนยาง', forestType: 'สวนยางผสม', description: 'สวนยางผสมพืชคลุมดิน รอตรวจหลักฐานการจัดการแปลง', area: 86, plots: 1, status: 'รอตรวจสอบ', updated: '31 ต.ค. 2569' },
    { id: 'p-03', name: 'สวนยางเกาะช้าง', province: 'ตราด', district: 'เกาะช้าง', manager: 'ทีมภาคสนาม', forestType: 'สวนยางให้ผลผลิต', description: 'แปลงตัวอย่างเพื่อจัดเก็บข้อมูลรอบกรีดและดูแลสวน', area: 62, plots: 1, status: 'เตรียมข้อมูล', updated: '29 ต.ค. 2569' },
    { id: 'p-04', name: 'สวนยางอ่าวลึก', province: 'กระบี่', district: 'อ่าวลึก', manager: 'ทีมสำรวจ', forestType: 'สวนยางปลูกใหม่', description: 'ตัวอย่างแปลงยางพาราสำหรับติดตามอายุสวน', area: 48, plots: 1, status: 'กำลังดำเนินการ', updated: '25 ต.ค. 2569' },
  ],
  satellite: { provider: 'Sentinel-2 L2A', sceneDate: '12 ต.ค. 2569', cloudCoverage: null, ndvi: 0.68, evi: null, gndvi: null },
  carbonAssessment: { status: 'insufficient_data', tco2e: null, valueThb: null },
});
