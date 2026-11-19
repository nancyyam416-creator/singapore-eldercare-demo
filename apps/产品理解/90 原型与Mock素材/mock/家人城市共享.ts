// 本地预览契约：同一浏览器、同一主机名通过 cookie 跨端口共享，不代表服务器同步。
export const familyCityCatalog = [
  { id: 'SG-SIN', name: '新加坡', country: '新加坡', latitude: 1.3521, longitude: 103.8198, timeZone: 'Asia/Singapore', aliases: ['Singapore'] },
  { id: 'CN-SHA', name: '上海', country: '中国', latitude: 31.2304, longitude: 121.4737, timeZone: 'Asia/Shanghai', aliases: ['Shanghai', '上海市'] },
  { id: 'CA-YVR', name: '温哥华', country: '加拿大', latitude: 49.2827, longitude: -123.1207, timeZone: 'America/Vancouver', aliases: ['Vancouver'] },
];
export type FamilyCity = Omit<typeof familyCityCatalog[number], 'aliases'>;
export type FamilyCityPreference = { ownerUserId: string; city: FamilyCity | null; source: 'child-manual' | 'child-location-confirmed'; updatedAt: string; sharing: boolean };
const key = 'eldercare_family_city_v1';
export function readFamilyCity(ownerUserId: string): FamilyCityPreference | null {
  try { const raw = document.cookie.split('; ').find(v => v.startsWith(key + '=')); const records = JSON.parse(decodeURIComponent(raw?.slice(key.length + 1) || '{}')); return records[ownerUserId] || null; } catch { return null; }
}
export function saveFamilyCity(ownerUserId: string, cityId: string | null, source: FamilyCityPreference['source']): FamilyCityPreference {
  const match = familyCityCatalog.find(c => c.id === cityId);
  if (cityId && !match) throw new Error('暂不支持该城市');
  let records = {}; try { records = JSON.parse(decodeURIComponent(document.cookie.split('; ').find(v => v.startsWith(key + '='))?.slice(key.length + 1) || '{}')); } catch {}
  const city = match ? { id: match.id, name: match.name, country: match.country, latitude: match.latitude, longitude: match.longitude, timeZone: match.timeZone } : null;
  const next = { ownerUserId, city, source, updatedAt: new Date().toISOString(), sharing: Boolean(city) };
  const encoded = encodeURIComponent(JSON.stringify({ ...records, [ownerUserId]: next }));
  if (encoded.length > 3500) throw new Error('本地共享空间不足');
  document.cookie = `${key}=${encoded}; path=/; max-age=2592000; samesite=lax`;
  if (readFamilyCity(ownerUserId)?.updatedAt !== next.updatedAt) throw new Error('保存失败，请重试');
  window.dispatchEvent(new Event(key)); return next;
}
export function subscribeFamilyCity(listener: () => void) {
  let previous = document.cookie;
  const timer = window.setInterval(() => { if (document.cookie !== previous) { previous = document.cookie; listener(); } }, 1000);
  window.addEventListener(key, listener);
  return () => { window.clearInterval(timer); window.removeEventListener(key, listener); };
}
