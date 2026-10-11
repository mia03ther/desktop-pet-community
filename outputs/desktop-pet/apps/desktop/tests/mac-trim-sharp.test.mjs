import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = join(root, `.test-mac-trim-${process.pid}`);
const afterPack = createRequire(import.meta.url)('../scripts/mac-trim-sharp.cjs');
const retained = ['sharp-darwin-arm64', 'sharp-darwin-x64', 'sharp-libvips-darwin-arm64', 'sharp-libvips-darwin-x64', 'sharp-wasm32', 'colour'];
const removed = ['sharp-win32-x64', 'sharp-linux-x64', 'sharp-libvips-linux-x64'];
try {
  const resources = join(fixture, 'desktop pet.app', 'Contents', 'Resources', 'app.asar.unpacked', 'node_modules');
  for (const name of [...retained, ...removed]) {
    mkdirSync(join(resources, '@img', name), { recursive: true });
    writeFileSync(join(resources, '@img', name, 'runtime.bin'), '测试运行文件');
  }
  mkdirSync(join(resources, 'node-gyp'), { recursive: true });
  await afterPack({ electronPlatformName: 'win32', appOutDir: fixture });
  for (const name of [...retained, ...removed]) assert.ok(existsSync(join(resources, '@img', name)));
  await afterPack({ electronPlatformName: 'darwin', appOutDir: fixture });
  for (const name of retained) assert.ok(existsSync(join(resources, '@img', name, 'runtime.bin')), `必须保留 ${name}`);
  for (const name of removed) assert.ok(!existsSync(join(resources, '@img', name)), `应剔除 ${name}`);
  assert.ok(!existsSync(join(resources, 'node-gyp')));
  await afterPack({ electronPlatformName: 'darwin', appOutDir: join(fixture, 'desktop pet.app') });
  console.log('macOS 依赖裁剪与 Windows 保留测试通过。');
} finally {
  if (!fixture.startsWith(`${root}\\`) && !fixture.startsWith(`${root}/`)) throw new Error('测试目录越界');
  rmSync(fixture, { recursive: true, force: true });
}