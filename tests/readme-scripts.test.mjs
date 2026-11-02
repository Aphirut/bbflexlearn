import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// กัน README กับ package.json หลุดกัน: ทุกคำสั่ง (npm|bun) run X ที่ README สอน
// ต้องมีสคริปต์ X จริง ไม่งั้นผู้ใช้ทำตามแล้วรันไม่ได้
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const mentioned = [...readme.matchAll(/(?:npm|bun) run ([a-zA-Z0-9:_-]+)/g)].map(m => m[1]);
assert.ok(mentioned.length > 0, 'README should mention at least one run script');
for (const name of new Set(mentioned)) {
  assert.ok(pkg.scripts?.[name], `README mentions "run ${name}" but package.json has no such script`);
}

console.log('readme-scripts tests passed');
