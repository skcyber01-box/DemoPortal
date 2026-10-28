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
 *            ใส่เป็น path ใน repo นี้ได้ เช่น "demos/doctor-assist/" หรือเป็นลิงก์เต็ม https://...
 *   embed    true = เปิดในหน้าพอร์ทัล · false = เปิดแท็บใหม่ (ใช้กับเว็บที่ไม่อนุญาตให้ฝังใน iframe)
 *   deck     (ไม่บังคับ) ลิงก์สไลด์/เอกสารประกอบ
 */

window.GROUPS = [
  { id: 'finance',  name: 'การเงินการคลังสุขภาพ' },
  { id: 'imaging',  name: 'ภาพทางการแพทย์และ AI' },
  { id: 'platform', name: 'โครงสร้างพื้นฐานข้อมูล' },
  { id: 'hospital', name: 'บริการในโรงพยาบาล' },
  { id: 'public',   name: 'สาธารณสุขพื้นที่' }
];

window.PROJECTS = [
  {
    id: 'fdh',
    name: 'Financial Data Hub (FDH)',
    group: 'finance',
    status: 'live',
    summary: 'ศูนย์กลางข้อมูลการเบิกจ่ายค่ารักษาของโรงพยาบาลสังกัดกระทรวงสาธารณสุขกว่า 890 แห่ง พร้อม Dashboard ติดตามผลงานรายเขตสุขภาพ',
    owner: 'กศส. กระทรวงสาธารณสุข',
    tags: ['claim', 'AdjRW', 'dashboard', 'เบิกจ่าย'],
    url: '',
    embed: false
  },
  {
    id: 'health-financial-accounting',
    name: 'Health Financial Accounting',
    group: 'finance',
    status: 'live',
    summary: 'ระบบบัญชีและการเงินสำหรับหน่วยบริการ เชื่อมข้อมูลรายรับจากการเบิกจ่ายเข้ากับงานบัญชี',
    owner: 'กระทรวงสาธารณสุข',
    tags: ['บัญชี', 'accounting', 'การเงิน'],
    url: '',
    embed: false
  },
  {
    id: 'iclaim',
    name: 'iClaim',
    group: 'finance',
    status: 'live',
    summary: 'ส่งเคลมประกันสุขภาพเอกชนจาก HIS ของโรงพยาบาลไปยังบริษัทประกันได้ในที่เดียว ตั้งแต่ตรวจสิทธิ์ ส่งเคลม จนถึงวางบิลออนไลน์',
    owner: 'โรงพยาบาลเอกชน',
    tags: ['E-Claim', 'ประกัน', 'วางบิล', 'insurance'],
    url: '',
    embed: false
  },
  {
    id: 'imaging-hub',
    name: 'MOPH Imaging Hub',
    group: 'imaging',
    status: 'live',
    summary: 'คลังภาพทางการแพทย์ระดับประเทศ (X-ray, CT, MRI, Mammogram) พร้อม AI อ่านภาพ เช่น MOPH AI CXR สำหรับคัดกรองวัณโรค',
    owner: 'สำนักสุขภาพดิจิทัล สป.สธ.',
    tags: ['PACS', 'AI', 'CXR', 'วัณโรค', 'imaging'],
    url: 'https://imh.moph.go.th/img',
    embed: false
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    group: 'platform',
    status: 'live',
    summary: 'ช่องทางกลางในการแลกเปลี่ยนข้อมูลระหว่างระบบของกระทรวงและหน่วยบริการ พร้อมการยืนยันตัวตนและควบคุมสิทธิ์',
    owner: 'กระทรวงสาธารณสุข',
    tags: ['API', 'integration', 'HL7 FHIR'],
    url: '',
    embed: false
  },
  {
    id: 'moph-certificate',
    name: 'MOPH Certificate Gateway',
    group: 'platform',
    status: 'live',
    summary: 'ออกและตรวจสอบใบรับรองดิจิทัลของกระทรวงสาธารณสุข',
    owner: 'กระทรวงสาธารณสุข',
    tags: ['certificate', 'ใบรับรอง', 'ลายมือชื่อดิจิทัล'],
    url: '',
    embed: false
  },
  {
    id: 'thaimed-gateway',
    name: 'ThaiMed Gateway',
    group: 'platform',
    status: 'soon',
    summary: 'แก้คำอธิบายโครงการนี้ในไฟล์ projects.js',
    owner: '',
    tags: [],
    url: '',
    embed: false
  },
  {
    id: 'doctor-assist',
    name: 'Doctor Assist',
    group: 'hospital',
    status: 'proto',
    summary: 'ต้นแบบระบบพบแพทย์ทางไกลที่ออกแบบให้ผู้สูงอายุใช้ง่าย ครบ 5 บทบาท ผู้ป่วย พยาบาล แพทย์ เภสัชกร และผู้ดูแลระบบ',
    owner: 'โรงพยาบาลรัฐ',
    tags: ['telemedicine', 'HealthID', 'ผู้สูงอายุ', 'นัดหมาย'],
    url: 'demos/doctor-assist/',
    embed: true
  },
  {
    id: 'smart-supply-chain',
    name: 'Smart Supply Chain',
    group: 'hospital',
    status: 'soon',
    summary: 'ระบบคลังเวชภัณฑ์อัจฉริยะ ใช้ตู้ RFID ชั้นวางชั่งน้ำหนักเติมของอัตโนมัติ และ IoT เฝ้าระวังอุณหภูมิ cold chain',
    owner: 'โรงพยาบาลรัฐ',
    tags: ['RFID', 'IoT', 'คลังยา', 'cold chain'],
    url: '',
    embed: false
  },
  {
    id: 'flowtrack',
    name: 'FlowTrack & Automed Box',
    group: 'hospital',
    status: 'soon',
    summary: 'ติดตามยาและเวชภัณฑ์ คำสั่งซื้อ ทรัพย์สิน และการไหลของผู้ป่วยแบบ real-time เชื่อมกับ ERP ได้ทุกยี่ห้อ',
    owner: 'โรงพยาบาลรัฐ',
    tags: ['RFID', 'patient flow', 'ERP', 'Automed'],
    url: '',
    embed: false
  },
  {
    id: 'him',
    name: 'Health Information Management',
    group: 'hospital',
    status: 'soon',
    summary: 'ระบบบริหารข้อมูลสุขภาพสำหรับโรงพยาบาลรัฐ เน้นรายได้และการเบิกจ่าย การแลกเปลี่ยนข้อมูล และ Dashboard ผู้บริหาร',
    owner: 'โรงพยาบาลรัฐ',
    tags: ['HIM', 'HIE', 'BioID', 'analytics'],
    url: '',
    embed: false
  },
  {
    id: 'telepharmacy',
    name: 'Telepharmacy',
    group: 'hospital',
    status: 'soon',
    summary: 'แก้คำอธิบายโครงการนี้ในไฟล์ projects.js',
    owner: '',
    tags: ['เภสัชกรรมทางไกล', 'จัดส่งยา'],
    url: '',
    embed: false
  },
  {
    id: 'kpi-region6',
    name: 'KPI Monitor เขตสุขภาพที่ 6',
    group: 'public',
    status: 'demo',
    summary: 'Dashboard ติดตามตัวชี้วัดของ 8 จังหวัด 73 โรงพยาบาล ปีงบ 2569 มีแผนที่จังหวัด อันดับจังหวัด และ heatmap จังหวัด × ตัวชี้วัด ครอบคลุม Waiting Time, Service Plan, สาธารณสุข, สมุนไพรและการเงิน และคุณภาพข้อมูล',
    owner: 'เขตสุขภาพที่ 6',
    tags: ['KPI', 'dashboard', 'ตัวชี้วัด', 'ตรวจราชการ', 'Stroke', 'heatmap', 'เขต 6'],
    url: 'https://mookup-three.vercel.app/',
    embed: true
  },
  {
    id: 'tak-surveillance',
    name: 'ระบบเฝ้าระวังโรค ศูนย์พักพิงชั่วคราว จ.ตาก',
    group: 'public',
    status: 'soon',
    summary: 'รวมข้อมูลสุขภาพจาก 3 ศูนย์พักพิงชั่วคราวเข้าส่วนกลาง เฝ้าระวังเหตุการณ์ผิดปกติ และ Dashboard กลุ่มโรคสำคัญ',
    owner: 'WHO / JICA, สสจ.ตาก',
    tags: ['EBS', 'surveillance', 'Hospital OS', 'dashboard'],
    url: '',
    embed: false
  }
];
