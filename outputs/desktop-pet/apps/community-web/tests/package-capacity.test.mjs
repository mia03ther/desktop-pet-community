import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePackageFiles, readZipPackage, zipPackage } from '../dist/package-core.js';
import { githubSubmissionUrl } from '../dist/publication-client.js';

test('超过旧单文件 100 MiB 和文件数 1000 的完整包可以 ZIP 往返，原字节不变', async () => {
  const video = new Uint8Array(104 * 1024 * 1024);
  video[0] = 37; video[video.length - 1] = 51;
  const files = { 'media/clip.mp4': video, ...Object.fromEntries(Array.from({ length: 1100 }, (_, i) => ['references/' + i + '.txt', new Uint8Array([i % 255])])) };
  const normalized = normalizePackageFiles(files);
  const archive = zipPackage(normalized);
  const restored = await readZipPackage(new Uint8Array(await archive.arrayBuffer()), () => { throw new Error('此测试包没有压缩流'); });
  assert.equal(Object.keys(restored).length, 1101);
  assert.deepEqual(restored['media/clip.mp4'], video);
  assert.deepEqual(restored['references/1099.txt'], files['references/1099.txt']);
});

test('扩大容量仍拒绝膨胀 ZIP 声明、路径穿越与超量文件，而不是尝试分配声明容量', async () => {
  assert.throws(() => normalizePackageFiles(Object.fromEntries(Array.from({ length: 10001 }, (_, i) => [i + '.txt', new Uint8Array()]))));
  const archive = new Uint8Array(await zipPackage({ 'valid.txt': new Uint8Array([1]) }).arrayBuffer());
  const view = new DataView(archive.buffer), central = view.getUint32(archive.length - 6, true);
  view.setUint32(central + 24, 512 * 1024 * 1024 + 1, true);
  await assert.rejects(readZipPackage(archive, () => { throw new Error('超量声明不得展开'); }));
  assert.throws(() => zipPackage({ '../private.txt': new Uint8Array([1]) }));
});

test('大投稿明确使用完整 Release ZIP 链接，不把超过 GitHub 单文件限制的二进制推到仓库', () => {
  const metadata = { id: 'large.example', title: '完整作品', author: '作者', description: '完整导入', license: 'MIT', workflow: 'plugin-import' };
  const url = new URL(githubSubmissionUrl('https://github.com/xunguangzlj-cloud/desktop-pet-community', metadata, { name: 'large.zip', bytes: 240 * 1024 * 1024, sha256: 'a'.repeat(64) }));
  assert.match(url.searchParams.get('files'), /GitHub Release/);
  assert.match(url.searchParams.get('files'), /小于 2 GiB/);
  assert.match(url.searchParams.get('files'), /完整 ZIP/);
});
