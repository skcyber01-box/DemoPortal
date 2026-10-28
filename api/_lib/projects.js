/*
 * รายการโครงการใน Demo Portal — แก้ไข/เพิ่มโครงการที่ไฟล์นี้
 *
 * ไฟล์นี้อยู่ฝั่งเซิร์ฟเวอร์ ผู้ชมเปิดอ่านตรงๆ ไม่ได้ แต่ละคนจะได้รับเฉพาะโครงการที่มีสิทธิ์ดู
 * (กำหนดสิทธิ์ได้ที่หน้า "ตั้งค่า" ของพอร์ทัล)
 *
 * ช่องข้อมูล
 *   id       รหัสสั้นภาษาอังกฤษ ใช้ทำลิงก์ตรงและอ้างอิงสิทธิ์ — ตั้งแล้วอย่าเปลี่ยน
 *   name     ชื่อที่แสดง
 *   group    กลุ่ม (ต้องตรงกับ id ใน GROUPS)
 *   status   live = ใช้งานจริง · demo = มี Demo ให้ทดลอง · proto = ต้นแบบ UI · soon = กำลังเตรียม Demo
 *   summary  คำอธิบาย 1–2 ประโยค
 *   owner    หน่วยงาน/กลุ่มผู้ใช้
 *   tags     คำค้นเพิ่มเติม
 *   url      ลิงก์ Demo (เว้นว่างได้ถ้ายังไม่มี)
 *   embed    true = เปิดในหน้าพอร์ทัล · false = เปิดแท็บใหม่
 *   deck     (ไม่บังคับ) ลิงก์สไลด์/เอกสารประกอบ
 */

export const GROUPS = [
  { id: 'hospital', name: 'บริการในโรงพยาบาล' },
  { id: 'region',   name: 'ติดตามผลงานเขตสุขภาพ' },
  { id: 'public',   name: 'สาธารณสุขพื้นที่' }
];

export const PROJECTS = [
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
  },
  {
    id: 'tak-surveillance',
    name: 'คอนโซลเฝ้าระวังโรค ศูนย์พักพิงชั่วคราว จ.ตาก',
    group: 'public',
    status: 'proto',
    summary: 'ต้นแบบหน้าจอเฝ้าระวังโรคของ 3 ศูนย์พักพิงชั่วคราว (แม่หละ อุ้มเปี้ยม นุโพ) ติดตามเหตุการณ์ที่ต้องยืนยันภายใน 48 ชั่วโมง อนามัยแม่และเด็ก โรคติดเชื้อทางเดินอาหาร โรคไม่ติดต่อเรื้อรัง และคุณภาพข้อมูล ตามนิยาม WHO EWARN และ UNHCR',
    owner: 'WHO / JICA, สสจ.ตาก',
    tags: ['EBS', 'surveillance', 'เฝ้าระวัง', 'Hospital OS', 'UNHCR', 'WHO', 'ตาก', 'แม่หละ', 'อุ้มเปี้ยม', 'นุโพ'],
    url: 'https://tak-lyart-seven.vercel.app/',
    embed: true
  }
];
