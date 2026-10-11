export async function loadCatalogManagement(request = globalThis.fetch.bind(globalThis)) {
  const response = await request('/api/catalog-management', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(10000) });
  // 桌面只读预览没有后台，保留其本地目录。
  if (response.status === 404) return { available: false, items: [] };
  if (!response.ok) throw new Error('作品管理状态暂时无法读取，请刷新重试。');
  const data = await response.json();
  if (typeof data?.available !== 'boolean' || !Array.isArray(data.items) || data.items.length > 20000 || data.items.some(item => typeof item.id !== 'string' || typeof item.hidden !== 'boolean' || typeof item.category !== 'string' || item.category.length > 40)) throw new Error('作品管理状态无效，请刷新重试。');
  return data;
}

export function managedWorks(works, management) {
  const entries = new Map(management.items.map(item => [item.id, item]));
  return works.filter(work => !entries.get(work.id)?.hidden).map(work => entries.has(work.id) ? { ...work, category: entries.get(work.id).category } : work);
}
