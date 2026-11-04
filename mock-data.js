/* Explicitly illustrative sample data; not satellite observations or carbon calculations. */
window.CarbonLensMockData = Object.freeze({
  isMock: true,
  projects: [
    { id: 'p-01', name: 'ฟื้นฟูป่าต้นน้ำแม่แจ่ม', province: 'เชียงใหม่', district: 'แม่แจ่ม', manager: 'สุภาวดี คำปัน', forestType: 'ป่าต้นน้ำ', description: 'โครงการฟื้นฟูพื้นที่ป่าต้นน้ำโดยชุมชน', area: 624, plots: 2, status: 'กำลังดำเนินการ', updated: '2 พ.ย. 2569' },
    { id: 'p-02', name: 'ป่าชุมชนบ้านแม่ลาน', province: 'ลำพูน', district: 'ลี้', manager: 'ทีมป่าชุมชน', forestType: 'ป่าชุมชน', description: 'พื้นที่ป่าชุมชนตัวอย่าง', area: 318, plots: 1, status: 'รอตรวจสอบ', updated: '31 ต.ค. 2569' },
    { id: 'p-03', name: 'แนวกันชนป่าดอยสุเทพ', province: 'เชียงใหม่', district: 'เมืองเชียงใหม่', manager: 'ทีมอนุรักษ์', forestType: 'ป่าอนุรักษ์', description: 'แนวกันชนและฟื้นฟูป่า', area: 206, plots: 1, status: 'เตรียมข้อมูล', updated: '29 ต.ค. 2569' },
    { id: 'p-04', name: 'ป่าฟื้นฟูห้วยน้ำดัง', province: 'เชียงใหม่', district: 'แม่แตง', manager: 'ทีมภาคสนาม', forestType: 'ป่าฟื้นฟู', description: 'พื้นที่ฟื้นฟูป่าและติดตามการเติบโต', area: 136, plots: 1, status: 'กำลังดำเนินการ', updated: '25 ต.ค. 2569' },
  ],
  satellite: { provider: 'Sentinel-2 L2A', sceneDate: '12 ต.ค. 2569', cloudCoverage: null, ndvi: 0.68, evi: null, gndvi: null },
  carbonAssessment: { status: 'insufficient_data', tco2e: null, valueThb: null },
});
