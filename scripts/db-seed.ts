// นำเข้าข้อมูลตัวอย่างจาก flexlearn.sql เข้าสู่ฐานข้อมูลที่ตั้งค่าใน .env
// ใช้: bun run db:seed  (ต้องมี mysql client; README ใช้ mysql CLI อยู่แล้ว)
//
// หมายเหตุ: คำสั่งนี้ล้างฐานข้อมูลเดิมแล้วนำเข้าข้อมูลตัวอย่างใหม่ทั้งหมด
import { SQL, $ } from "bun";
import { tmpdir } from "node:os";
import { join } from "node:path";

const host = Bun.env.DB_HOST || "127.0.0.1";
const port = Number(Bun.env.DB_PORT || 3306);
const user = Bun.env.DB_USER || "root";
const password = Bun.env.DB_PASSWORD || "";
const database = Bun.env.DB_NAME || "flexlearn";

const dumpUrl = new URL("../flexlearn.sql", import.meta.url);
const dumpFile = Bun.file(dumpUrl);
if (!(await dumpFile.exists())) {
  console.error("flexlearn.sql not found next to package.json; nothing to seed.");
  process.exit(1);
}

// สร้างฐานข้อมูลถ้ายังไม่มี (server สร้างแค่ตาราง ไม่ได้สร้างฐานข้อมูล)
const safeDb = database.replace(/[^a-zA-Z0-9_$-]/g, "");
if (!safeDb) {
  console.error("Invalid DB_NAME.");
  process.exit(1);
}
const admin = new SQL(
  `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/mysql`,
  { allowPublicKeyRetrieval: true },
);
try {
  // ล้างแล้วสร้างใหม่เพื่อให้รันซ้ำได้ (dump ไม่มี IF NOT EXISTS)
  await admin.unsafe(`DROP DATABASE IF EXISTS \`${safeDb}\``);
  await admin.unsafe(`CREATE DATABASE \`${safeDb}\` CHARACTER SET utf8mb4`);
} catch (e) {
  console.error(`Cannot connect to MySQL at ${host}:${port} as ${user}: ${(e as Error).message}`);
  console.error("Start MySQL and check DB_* in .env first.");
  process.exit(1);
} finally {
  await admin.end();
}

// dump ถูก export จาก MySQL 8 (collation utf8mb4_0900_ai_ci) ซึ่ง MariaDB ไม่รู้จัก
// แปลงเป็น utf8mb4_unicode_ci ที่ใช้ได้ทั้งสองฝั่งก่อนนำเข้า
const tmpSql = join(tmpdir(), `flexlearn-seed-${crypto.randomUUID()}.sql`);
await Bun.write(tmpSql, (await dumpFile.text()).replaceAll("utf8mb4_0900_ai_ci", "utf8mb4_unicode_ci"));

// import ผ่าน mysql CLI เพื่อรองรับ conditional comment ของ mysqldump ได้ครบ
const res = await $`mysql --protocol=TCP -h ${host} -P ${port} -u ${user} ${safeDb} < ${tmpSql}`
  .env({ ...process.env, MYSQL_PWD: password })
  .nothrow()
  .quiet();
await Bun.$`rm -f ${tmpSql}`.quiet();
if (res.exitCode !== 0) {
  console.error(res.stderr.toString().trim() || "mysql import failed.");
  console.error("Make sure the `mysql` client is installed and the DB user has CREATE/INSERT rights.");
  process.exit(1);
}
console.log(`Seeded '${safeDb}' from flexlearn.sql (demo password for all accounts: flexlearn123)`);
