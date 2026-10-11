import { readFile, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { join } from "node:path";

export type CommunityWebsiteSection = "pets" | "plugins" | "create";

const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/locale.js", ["locale.js", "text/javascript; charset=utf-8"]],
  ["/locale-messages.js", ["locale-messages.js", "text/javascript; charset=utf-8"]],
  ["/catalog.js", ["catalog.js", "text/javascript; charset=utf-8"]],
  ["/plugin-catalog.js", ["plugin-catalog.js", "text/javascript; charset=utf-8"]],
  ["/community-data.js", ["community-data.js", "text/javascript; charset=utf-8"]],
  ["/community-core.js", ["community-core.js", "text/javascript; charset=utf-8"]],
  ["/community-pages.js", ["community-pages.js", "text/javascript; charset=utf-8"]],
  ["/package-core.js", ["package-core.js", "text/javascript; charset=utf-8"]],
  ["/native-package-contract.js", ["native-package-contract.js", "text/javascript; charset=utf-8"]],
  ["/plugin-covers.js", ["plugin-covers.js", "text/javascript; charset=utf-8"]],
  ["/publication-client.js", ["publication-client.js", "text/javascript; charset=utf-8"]],
  ["/publication-config.js", ["publication-config.js", "text/javascript; charset=utf-8"]],
  ["/assets/brand-logo.png", ["assets/brand-logo.png", "image/png"]],
  ["/assets/hoodie.webp", ["assets/hoodie.webp", "image/webp"]],
  ["/assets/pets/hoodie-cat-openpets-thumb.webp", ["assets/pets/hoodie-cat-openpets-thumb.webp", "image/webp"]],
  ["/assets/hoodie-cat-openpets.zip", ["assets/hoodie-cat-openpets.zip", "application/zip"]],
  ["/assets/community.water-break.zip", ["assets/community.water-break.zip", "application/zip"]],
  ["/assets/community.eye-break.zip", ["assets/community.eye-break.zip", "application/zip"]],
  ["/assets/community.focus-break.zip", ["assets/community.focus-break.zip", "application/zip"]],
  ["/assets/lingyin.file-assistant.zip", ["assets/lingyin.file-assistant.zip", "application/zip"]],
  ["/assets/lingyin.computer-care.zip", ["assets/lingyin.computer-care.zip", "application/zip"]],
]);

const pluginCoverNames = [
  "quick-reminder.webp", "simple-timer.webp", "calm-practice.webp", "focus-buddy.webp",
  "launch-greeting.webp", "fortune-cookie.webp", "virtual-pet.webp", "life-companion.webp",
  "water-reminder.webp", "system-resources.webp", "calendar-airmail.webp", "day-routine.webp",
  "magic-ball.webp", "mood-check.webp", "ai-allowance.webp", "generation-progress.webp",
  "drag-vocabulary.webp", "music-buddy.webp", "desktop-walk.webp", "file-assistant.webp",
  "computer-care.webp", "water-break.webp", "eye-break.webp", "focus-break.webp",
];
for (const filename of pluginCoverNames) {
  const asset = `assets/plugin-covers/${filename}`;
  publicFiles.set(`/${asset}`, [asset, "image/webp"]);
}

// 只登记随包发布的公开作品；请求路径不能扩展为目录或本机档案读取。
const galleryPetIds = [
  "firefly--lingxiaotian",
  "furina--lingxiaotian",
  "paimon--lingxiaotian",
  "yae-miko--legeling",
  "iuno--legeling",
  "miku--lingxiaotian",
  "frieren--lingxiaotian",
  "toothless--legeling",
  "buttercup--legeling",
  "bubu--gbn666",
  "corgi-companion--cxian0928-afk",
  "becky--natewanggg",
  "jinmao--legeling",
  "claude--xiangking",
  "apu--xchangee",
  "aemeath-mini--cunuo",
  "deepseek-girl--legeling",
  "codex-orb--legeling",
  "crt-monitor--wxy",
  "xiaoda--legeling",
  "codexy--z19t",
  "iris--yau-427",
  "minty--somnusochi",
  "tangdouren--carl312",
  "starcorn--alterhq",
  "night-neko--netizenxuan",
  "katana-cheems--thankyou-cheems",
  "maodie--octane0411",
  "potato--legeling",
];

const galleryPluginIds = [
  "openpets.reminders", "openpets.simple-timer", "openpets.anxiety-aid-tools", "openpets.focus-buddy",
  "openpets.launch-buddy", "openpets.fortune-cookie", "openpets.virtual-pet", "openpets.life-companion",
  "openpets.water-reminder", "openpets.system-resources", "openpets.calendar-airmail", "openpets.day-routine",
  "openpets.magic-8-ball", "openpets.mood-check-in",
  "regis.usage-buddy", "openpets.higgsfield-watch", "openpets.drag-vocab", "openpets.spotify-buddy", "openpets.walkabout",
];
for (const id of galleryPluginIds) {
  const download = `assets/${id}.zip`;
  publicFiles.set(`/${download}`, [download, "application/zip"]);
}

for (const id of galleryPetIds) {
  for (const filename of [`assets/pets/${id}.webp`, `assets/pets/${id}-thumb.webp`]) {
    publicFiles.set(`/${filename}`, [filename, "image/webp"]);
  }
  const download = `assets/${id}.zip`;
  publicFiles.set(`/${download}`, [download, "application/zip"]);
}

export function validateCommunityWebsiteSection(value: unknown): CommunityWebsiteSection {
  if (value !== "pets" && value !== "plugins" && value !== "create") {
    throw new Error("请选择桌宠、插件或共创网站入口。");
  }
  return value;
}

async function registeredPublicFiles(directory: string): Promise<Map<string, string[]>> {
  const files = new Map(publicFiles);
  const path = join(directory, "gallery-files.json");
  try {
    const size = (await stat(path)).size;
    if (size > 1024 * 1024) throw new Error("共创公开资源清单过大。");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return files;
    throw error;
  }
  const manifest: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!manifest || typeof manifest !== "object" || !Array.isArray((manifest as { files?: unknown }).files)) throw new Error("共创公开资源清单无效。");
  const entries = (manifest as { files: unknown[] }).files;
  if (entries.length > 5000) throw new Error("共创公开资源数量超过限制。");
  const types: Record<string, string> = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", zip: "application/zip", mp4: "video/mp4", webm: "video/webm", json: "application/json; charset=utf-8", txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8" };
  for (const value of entries) {
    if (!value || typeof value !== "object" || typeof (value as { path?: unknown }).path !== "string") throw new Error("共创公开资源条目无效。");
    const name = (value as { path: string }).path;
    const type = types[name.split(".").at(-1)!];
    if (!type || !/^assets\/(?:[a-zA-Z0-9_-][a-zA-Z0-9._-]*\/)*[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(name) || name.split("/").some(part => part === "." || part === "..")) throw new Error("共创公开资源路径无效。");
    files.set(`/${name}`, [name, type]);
  }
  return files;
}

/** 使用应用预先登记的公开站；未提供托管地址时仅提供公开静态文件的本机预览。 */
export class CommunityWebsite {
  private server: Server | undefined;
  private starting: Promise<string> | undefined;
  private origin: string | undefined;
  private disposed = false;
  private readonly publishedOrigin: string | undefined;

  constructor(private readonly publicDirectory: string, publishedOrigin?: string) {
    if (publishedOrigin !== undefined) {
      const url = new URL(publishedOrigin);
      if (url.protocol !== "https:" || ![url.origin, `${url.origin}/`].includes(publishedOrigin)) {
        throw new Error("共创网站必须使用已登记的 HTTPS 站点地址。");
      }
      this.publishedOrigin = url.origin;
    }
  }

  async getUrl(section: unknown): Promise<string> {
    const target = validateCommunityWebsiteSection(section);
    if (this.disposed) throw new Error("网站预览已关闭。");
    if (this.publishedOrigin) return `${this.publishedOrigin}/#${target}`;
    if (!this.starting) {
      this.starting = this.start().catch((error: unknown) => {
        this.starting = undefined;
        throw error;
      });
    }
    const origin = await this.starting;
    if (this.disposed) throw new Error("网站预览已关闭。");
    return `${origin}/#${target}`;
  }

  dispose(): void {
    this.disposed = true;
    this.server?.close();
    this.server?.closeAllConnections();
    this.server = undefined;
  }

  private async start(): Promise<string> {
    await readFile(join(this.publicDirectory, "index.html"));
    const registeredFiles = await registeredPublicFiles(this.publicDirectory);
    if (this.disposed) throw new Error("网站预览已关闭。");
    const server = createServer((request, response) => {
      void (async () => {
        if (request.headers.host !== this.origin?.slice("http://".length)) {
          response.writeHead(403).end();
          return;
        }
        if (request.method !== "GET" && request.method !== "HEAD") {
          response.writeHead(405, { Allow: "GET, HEAD" }).end();
          return;
        }
        const path = (request.url ?? "").split("?")[0];
        const file = registeredFiles.get(path);
        if (!file) {
          response.writeHead(404).end();
          return;
        }
        const bytes = await readFile(join(this.publicDirectory, file[0]!));
        response.writeHead(200, {
          "Content-Type": file[1]!,
          "Content-Length": bytes.length,
          ...(file[1] === "application/zip"
            ? { "Content-Disposition": `attachment; filename="${file[0]!.split("/").at(-1)}"` }
            : {}),
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
          "Cross-Origin-Resource-Policy": "same-origin",
          "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        });
        response.end(request.method === "HEAD" ? undefined : bytes);
      })().catch(() => {
        if (!response.headersSent) response.writeHead(500);
        response.end();
      });
    });
    this.server = server;
    server.requestTimeout = 10000;
    server.headersTimeout = 10000;
    server.maxHeadersCount = 50;
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        server.removeListener("error", reject);
        resolve();
      });
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("无法打开网站预览。");
    this.origin = `http://127.0.0.1:${address.port}`;
    if (this.disposed) {
      server.close();
      throw new Error("网站预览已关闭。");
    }
    return this.origin;
  }
}
