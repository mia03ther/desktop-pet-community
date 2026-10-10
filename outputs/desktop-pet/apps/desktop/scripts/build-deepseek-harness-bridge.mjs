import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const desktopDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const desktopRequire = createRequire(join(desktopDir, "package.json"));
const viteRequire = createRequire(desktopRequire.resolve("vite/package.json"));
const { build } = viteRequire("esbuild");
const dshRuntime = resolve(desktopDir, "../../packages/dsh/src/runtime.ts").replaceAll("\\", "/");
const clientEntry = resolve(desktopDir, "../../packages/client/src/index.ts");
const eventsEntry = resolve(desktopDir, "../../packages/agent-events/src/index.ts");

// 合并本项目已有的运行时；Cordis 仅为类型导入，不进入桌宠安装包。
await build({
  stdin: {
    contents: `export { createOpenPetsClient, readDiscoveryFile, sendRequest } from "@open-pets/client"; export { registerDshListeners, createOpenPetsDshRuntime, classifyDshEvent } from ${JSON.stringify(dshRuntime)};`,
    resolveDir: desktopDir,
    loader: "ts",
  },
  outfile: join(desktopDir, "assets/agent-hooks/deepseek-harness/runtime.mjs"),
  platform: "node",
  target: "node22",
  format: "esm",
  bundle: true,
  alias: { "@open-pets/client": clientEntry, "@open-pets/agent-events": eventsEntry },
  nodePaths: [join(desktopDir, "node_modules")],
  legalComments: "inline",
});
console.log("DeepSeek Harness 本机联动运行时已构建。");
