/** อนุญาตเฉพาะลิงก์ http(s), mailto หรือ path แบบ relative กัน javascript:/data:/vbscript: URL */
export function safeUrl(url: string | undefined | null): string {
  const u = String(url || '').trim();
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(u.replace(/[\u0000-\u001f\s]/g, ''))?.[1]?.toLowerCase();
  if (!scheme || scheme === 'http' || scheme === 'https' || scheme === 'mailto') return u;
  return 'about:blank';
}
