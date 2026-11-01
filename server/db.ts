// Bun-native MySQL ผ่าน Bun.SQL (Bun 1.4+ รองรับ mysql://)
// .env ถูก Bun โหลดให้อัตโนมัติ ไม่ต้องใช้ dotenv
import { SQL } from "bun";

const host = Bun.env.DB_HOST || "127.0.0.1";
const port = Number(Bun.env.DB_PORT || 3306);
const user = encodeURIComponent(Bun.env.DB_USER || "root");
const password = encodeURIComponent(Bun.env.DB_PASSWORD || "");
const database = Bun.env.DB_NAME || "flexlearn";

export const sql = new SQL(`mysql://${user}:${password}@${host}:${port}/${database}`, {
  allowPublicKeyRetrieval: true,
});

export async function migrate() {
  const schema = await Bun.file(new URL("./schema.sql", import.meta.url)).text();
  for (const stmt of schema.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
    await sql.unsafe(stmt);
  }
  // ฐานข้อมูลเดิมที่สร้างก่อนมีคอลัมน์ token_version: เพิ่มให้อัตโนมัติ
  const col = await sql`SELECT COUNT(*) AS n FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'token_version'`;
  if (Number((col as any[])[0]?.n) === 0) {
    await sql.unsafe("ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0");
  }
}

export const parseJson = <T>(v: unknown): T =>
  (typeof v === "string" ? JSON.parse(v) : v) as T;
