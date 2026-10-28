/*
 * รายการโครงการใน Demo Portal — แก้ไข/เพิ่มโครงการได้ที่ไฟล์นี้ไฟล์เดียว
 *
 * ช่องข้อมูล
 *   id       รหัสสั้นภาษาอังกฤษ ใช้ทำลิงก์ตรง เช่น  /#doctor-assist
 *   name     ชื่อที่แสดง
 *   group    กลุ่ม (ต้องตรงกับ id ใน GROUPS ด้านล่าง)
 *   status   live = ใช้งานจริง · demo = มี Demo ให้ทดลอง · proto = ต้นแบบ UI · soon = กำลังเตรียม Demo
 *   summary  คำอธิบาย 1–2 ประโยค
 *   owner    หน่วยงาน/กลุ่มผู้ใช้
 *   tags     คำค้นเพิ่มเติม
 *   url      ลิงก์ Demo (เว้นว่างได้ถ้ายังไม่มี)
 *            ลิงก์เต็ม https://... (หรือ path ใน repo นี้ เช่น "demos/xxx/")
 *   embed    true = เปิดในหน้าพอร์ทัล · false = เปิดแท็บใหม่ (ใช้กับเว็บที่ไม่อนุญาตให้ฝังใน iframe)
 *   deck     (ไม่บังคับ) ลิงก์สไลด์/เอกสารประกอบ
 */

window.GROUPS = [
  { id: 'hospital', name: 'บริการในโรงพยาบาล' },
  { id: 'region',   name: 'ติดตามผลงานเขตสุขภาพ' }
];

window.PROJECTS = [
  {
    id: 'doctor-assist',
    name: 'Doctor Assist',
    group: 'hospital',
    status: 'proto',
    summary: 'ต้นแบบระบบพบแพทย์ทางไกลที่ออกแบบให้ผู้สูงอายุใช้ง่าย ครบ 5 บทบาท ผู้ป่วย พยาบาล แพทย์ เภสัชกร และผู้ดูแลระบบ',
    owner: 'โรงพยาบาลรัฐ',
    tags: ['telemedicine', 'HealthID', 'ผู้สูงอายุ', 'นัดหมาย'],
    url: 'https://doctor-assist-blush.vercel.app/',
    embed: true
  },
  {
    id: 'kpi-region6',
    name: 'KPI Monitor เขตสุขภาพที่ 6',
    group: 'region',
    status: 'demo',
    summary: 'Dashboard ติดตามตัวชี้วัดของ 8 จังหวัด 73 โรงพยาบาล ปีงบ 2569 มีแผนที่จังหวัด อันดับจังหวัด และ heatmap จังหวัด × ตัวชี้วัด ครอบคลุม Waiting Time, Service Plan, สาธารณสุข, สมุนไพรและการเงิน และคุณภาพข้อมูล',
    owner: 'เขตสุขภาพที่ 6',
    tags: ['KPI', 'dashboard', 'ตัวชี้วัด', 'ตรวจราชการ', 'Stroke', 'heatmap', 'เขต 6'],
    url: 'https://mookup-three.vercel.app/',
    embed: true
  }
];
