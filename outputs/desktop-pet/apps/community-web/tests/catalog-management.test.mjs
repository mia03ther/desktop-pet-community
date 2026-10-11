import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalogManagement, managedWorks } from '../dist/catalog-management.js';

test('公开目录在统计、作者页与广场分组之前移除下架项，分类覆盖保留作者与下载地址', async () => {
  const original = [{ id: 'a', kind: 'pet', author: '原作者', category: '动漫角色', download: 'a.zip' }, { id: 'b', kind: 'plugin', category: '工具' }];
  const data = await loadCatalogManagement(async () => Response.json({ available: true, items: [{ id: 'a', category: '我的分类', hidden: false }, { id: 'b', category: '工具', hidden: true }] }));
  assert.deepEqual(managedWorks(original, data), [{ ...original[0], category: '我的分类' }]);
  assert.equal(original[0].category, '动漫角色');
});
test('只读本机预览保留目录；管理接口失败不能退回未过滤目录', async () => {
  assert.deepEqual(await loadCatalogManagement(async () => new Response('', { status: 404 })), { available: false, items: [] });
  await assert.rejects(loadCatalogManagement(async () => new Response('', { status: 503 })));
  await assert.rejects(loadCatalogManagement(async () => Response.json({ available: true, items: [{ id: 'a', hidden: 'false', category: '工具' }] })));
});
