# OneSpace Demo Portal

หน้าเว็บกลางสำหรับ Demo โครงการของ OneSpace ในห้องประชุม รายการโครงการอยู่ด้านซ้าย เลือกแล้ว Demo เปิดในหน้าเดียวกันด้านขวา ไม่ต้องสลับแท็บ

## โครงสร้างไฟล์

```
onespace-demo-portal/
├── index.html            หน้าพอร์ทัล
├── projects.js           รายการโครงการ ← แก้ไฟล์นี้ไฟล์เดียวเมื่อต้องการเพิ่ม/แก้โครงการ
├── assets/
│   ├── portal.css
│   └── portal.js
├── vercel.json           ตั้งค่า Vercel
└── README.md
```

## เพิ่มหรือแก้โครงการ

เปิด `projects.js` แล้วแก้ข้อมูลในรายการ `PROJECTS`

```js
{
  id: 'imaging-hub',                 // ใช้ทำลิงก์ตรง เช่น https://<portal>/#imaging-hub
  name: 'MOPH Imaging Hub',
  group: 'imaging',                  // ต้องตรงกับ id ใน GROUPS
  status: 'live',                    // live | demo | proto | soon
  summary: 'คำอธิบาย 1–2 ประโยค',
  owner: 'หน่วยงาน',
  tags: ['คำค้น', 'เพิ่มเติม'],
  url: 'https://...',                // ลิงก์ Demo (เว้นว่างได้)
  embed: false,                      // true = เปิดในพอร์ทัล, false = เปิดแท็บใหม่
  deck: 'https://...'                // (ไม่บังคับ) ลิงก์สไลด์
}
```

**Demo มี 2 แบบ**

1. **เก็บไว้ใน repo นี้** — คัดลอกโฟลเดอร์ Demo ไปไว้ใน `demos/<ชื่อ>/` แล้วใส่ `url: 'demos/<ชื่อ>/'` และ `embed: true`
2. **อยู่ที่อื่น** (Vercel project อื่น, เซิร์ฟเวอร์ลูกค้า) — ใส่ลิงก์เต็ม `https://...`
   - ถ้าเว็บนั้นยอมให้ฝัง (เช่น Vercel project ของเราเอง) ใส่ `embed: true`
   - เว็บระบบจริงของหน่วยงานส่วนใหญ่ไม่ยอมให้ฝังในหน้าอื่น ให้ใส่ `embed: false` พอร์ทัลจะแสดงปุ่มเปิดแท็บใหม่แทน
   - ถ้าใส่ `embed: true` แล้วกรอบ Demo ว่างเปล่า แปลว่าเว็บนั้นไม่ยอมให้ฝัง ให้เปลี่ยนเป็น `false`

> ห้ามใส่ username/password หรือข้อมูลผู้ป่วยจริงในไฟล์นี้ — ทุกอย่างใน repo จะถูกเปิดเป็นเว็บ

## ใช้งานในห้องประชุม

| ปุ่ม/คีย์ | ทำอะไร |
|---|---|
| `/` | ไปที่ช่องค้นหา (พิมพ์แล้วกด Enter เพื่อเปิดโครงการแรก) |
| `P` หรือปุ่ม **โหมดนำเสนอ** | ซ่อนรายการ ให้ Demo เต็มหน้าจอ |
| `]` / `[` | ไปโครงการถัดไป / ก่อนหน้า |
| `Esc` | ออกจากโหมดนำเสนอ |
| ปุ่ม **คัดลอกลิงก์** | ได้ลิงก์ตรงไปยังโครงการนั้น ส่งให้ลูกค้าเปิดเองได้ |

## Deploy ขึ้น GitHub + Vercel

### 1) GitHub

```bash
cd onespace-demo-portal
git init
git add .
git commit -m "OneSpace Demo Portal"
git branch -M main
git remote add origin https://github.com/<ชื่อบัญชี>/onespace-demo-portal.git
git push -u origin main
```

หรือสร้าง repo บน github.com แล้วกด *uploading an existing file* และลากไฟล์ทั้งหมดไปวาง

### 2) Vercel

1. vercel.com → **Add New… → Project** → เลือก repo `onespace-demo-portal` → **Import**
2. Framework Preset: **Other** · Build/Output Directory: เว้นว่าง
3. **Deploy**

หลังจากนั้นแก้ `projects.js` แล้ว push → Vercel อัปเดตเว็บให้อัตโนมัติภายในไม่ถึงนาที

### 3) จำกัดคนเข้าดู (แนะนำ)

พอร์ทัลตั้งค่าไม่ให้ Google เก็บข้อมูลแล้ว แต่ใครมีลิงก์ก็ยังเปิดได้ ถ้าต้องการจำกัด
ไปที่ Vercel → Project → **Settings → Deployment Protection** แล้วเลือกการป้องกันที่ต้องการ

### 4) ใช้ชื่อโดเมนบริษัท (ไม่บังคับ)

Vercel → Project → **Settings → Domains** → เพิ่ม เช่น `demo.onespace.co.th` แล้วตั้งค่า DNS ตามที่ Vercel แจ้ง
