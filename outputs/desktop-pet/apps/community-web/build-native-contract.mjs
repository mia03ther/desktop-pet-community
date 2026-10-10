import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { allowedReactions } from '../desktop/dist/local-ipc-protocol.js';

const desktopRequire = createRequire(new URL('../desktop/package.json', import.meta.url));
const viteRequire = createRequire(desktopRequire.resolve('vite'));
const { build } = viteRequire('esbuild');
const output = fileURLToPath(new URL('./dist/native-package-contract.js', import.meta.url));
const result = await build({
  stdin: {
    contents: 'export { validateImportedPluginManifest, pluginAssetMaxBytes, pluginPanelMaxBytes } from "../desktop/src/plugin-manifest.ts"; export { validateMediaPetMetadata, petMediaActions, petMediaOptionalActions } from "../desktop/src/pet-media-contract.ts"; export { validateCodexPetMetadata } from "../desktop/src/codex-pets-core.ts";',
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
    sourcefile: 'native-contract-entry.js',
  },
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022',
  outfile: output, metafile: true, minify: true, legalComments: 'none',
  banner: { js: '// 由桌面现有纯清单与动作契约生成；使用 build-native-contract.mjs 更新，不复制验证规则。' },
  plugins: [{
    name: '仅保留纯契约',
    setup(builder) {
      builder.onResolve({ filter: /^\.\/local-ipc-protocol\.js$/ }, () => ({ path: 'reaction-values', namespace: 'contract-data' }));
      builder.onLoad({ filter: /.*/, namespace: 'contract-data' }, () => ({ contents: `export const allowedReactions = ${JSON.stringify(allowedReactions)};` }));
      // 图集元数据校验不使用图片解码；解码由浏览器或真实桌面测试承担。
      builder.onResolve({ filter: /^sharp$/ }, () => ({ path: 'unused-image-decoder', namespace: 'contract-decoder' }));
      builder.onLoad({ filter: /.*/, namespace: 'contract-decoder' }, () => ({ contents: 'export default function unavailable() { throw new Error("纯契约不负责图片解码"); }' }));
    },
  }],
});
if (Object.values(result.metafile.outputs).some(entry => entry.imports.length)) throw new Error('纯契约产物不得引用 Node 或其他运行模块。');
console.log('浏览器原生包契约已从桌面所有者生成；无外部运行依赖。');
