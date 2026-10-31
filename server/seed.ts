// สร้างบัญชี admin แรกสำหรับฐานข้อมูลว่าง (ไม่มีข้อมูลตัวอย่าง)
// ใช้: ADMIN_NAME="ชื่อ" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="..." bun server/seed.ts
import { sql, migrate } from "./db";
import { insertUser, getUserByEmail } from "./repo";

const name = (Bun.env.ADMIN_NAME || "").trim();
const email = (Bun.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = Bun.env.ADMIN_PASSWORD || "";
if (!name || !email || password.length < 8) {
  console.error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) to create the first admin.");
  process.exit(1);
}

await migrate();
const existing = await getUserByEmail(email);
if (existing) {
  console.log(`User ${email} already exists; nothing to do.`);
  await sql.end();
  process.exit(0);
}

await insertUser(
  {
    id: `user-${crypto.randomUUID()}`,
    name,
    email,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    role: "admin",
    createdAt: new Date().toISOString().slice(0, 10),
    enrolledCourseIds: [],
  },
  await Bun.password.hash(password),
);
console.log(`Created admin ${email}`);
await sql.end();
