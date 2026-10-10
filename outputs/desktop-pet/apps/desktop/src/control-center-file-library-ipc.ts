import { createHash, randomUUID } from "node:crypto";
import type { CompanionFileLibrary } from "./companion-file-library.js";
import type { CompanionFilesService } from "./companion-files.js";
import type { CompanionFileClassification } from "./companion-file-classification.js";
import type { CompanionFileLibrarySnapshot, CompanionFileLibrarySearchFilter } from "./companion-file-library-types.js";
import type { CompanionFileLibraryAiPreview, CompanionFileLibraryAiDraft } from "./companion-file-library-ai-types.js";

type Event = { sender: { id: number } };
type Handler = (event: Event, ...args: unknown[]) => Promise<unknown>;
type Stored<T> = { senderId: number; digest: string; expiresAt: number; value: T };

export interface FileLibraryIpcLifecycle {
  cancelForSender(senderId: number): void;
  cancelTaskForSender(senderId: number): boolean;
  revokeAccess(): void;
  dispose(): void;
}

function identifier(value: unknown): string {
  if (typeof value !== "string" || !value || value.length > 200 || /[\u0000-\u001f]/u.test(value)) {
    throw new Error("文件库请求编号无效。");
  }
  return value;
}

function digest(snapshot: CompanionFileLibrarySnapshot): string {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

/** 窄桥接拥有预览、草稿和窗口取消；索引与文件操作分别交由原所有者。 */
export function installControlCenterFileLibraryIpcHandlers(deps: {
  registerHandle: (channel: string, handler: Handler) => void;
  authorizeSender: (event: Event) => void;
  assertAccess: () => void;
  subscribeAccess?: (listener: () => void) => () => void;
  library: CompanionFileLibrary;
  files: CompanionFilesService;
  getClassification: () => CompanionFileClassification;
  getProfiles: () => Promise<Array<{ id: string; label: string }>>;
  pickFolder: (senderId: number) => Promise<string | null>;
  reveal: (path: string) => void;
  rememberPlan: (planId: string, senderId: number) => void;
}): FileLibraryIpcLifecycle {
  const generations = new Map<number, number>();
  const previews = new Map<string, Stored<CompanionFileLibraryAiPreview>>();
  const drafts = new Map<string, Stored<CompanionFileLibraryAiDraft>>();
  let task: { senderId: number; controller: AbortController } | null = null;
  let disposed = false;
  let accessGeneration = 0;

  function handle(name: string, handler: Handler): void {
    deps.registerHandle(`openpets:companion-library-${name}`, async (event, ...args) => {
      deps.authorizeSender(event);
      if (disposed) {
        throw new Error("文件库正在关闭。");
      }
      deps.assertAccess();
      const generation = accessGeneration;
      const result = await handler(event, ...args);
      deps.assertAccess();
      if (generation !== accessGeneration) throw new Error("文件助手访问已撤销，请重新操作。");
      return result;
    });
  }

  async function run<T>(event: Event, operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (task) {
      throw new Error("文件库有操作正在进行，请等待或取消。");
    }
    const current = { senderId: event.sender.id, controller: new AbortController() };
    const generation = generations.get(event.sender.id) ?? 0;
    task = current;
    try {
      const result = await operation(current.controller.signal);
      if (disposed || current.controller.signal.aborted || generation !== (generations.get(event.sender.id) ?? 0)) {
        throw new Error("文件库操作已取消或窗口关闭。");
      }
      return result;
    } finally {
      if (task === current) {
        task = null;
      }
    }
  }

  function getRoot(id: unknown) {
    const root = deps.library.getSnapshot().roots.find((entry) => entry.id === identifier(id));
    if (!root) {
      throw new Error("目录不在已选择的文件库范围内。");
    }
    return root;
  }

  function prune(): void {
    for (const store of [previews, drafts]) {
      for (const [id, entry] of store) {
        if (entry.expiresAt <= Date.now()) {
          store.delete(id);
        }
      }
      while (store.size >= 32) {
        store.delete(store.keys().next().value!);
      }
    }
  }

  function getStored<T>(store: Map<string, Stored<T>>, event: Event, id: unknown): Stored<T> {
    const value = store.get(identifier(id));
    if (!value || value.senderId !== event.sender.id || value.expiresAt <= Date.now()) {
      throw new Error("预览或建议已失效，请重新生成。");
    }
    if (value.digest !== digest(deps.library.getSnapshot())) {
      throw new Error("文件库在预览后已变化，请重新预览，现有分类保持不变。");
    }
    return value;
  }

  function cancelTaskForSender(senderId: number): boolean {
    if (task?.senderId !== senderId) {
      return false;
    }
    task.controller.abort();
    return true;
  }

  function cancelForSender(senderId: number): void {
    generations.set(senderId, (generations.get(senderId) ?? 0) + 1);
    cancelTaskForSender(senderId);
    for (const [id, entry] of previews) {
      if (entry.senderId === senderId) {
        previews.delete(id);
      }
    }
    for (const [id, entry] of drafts) {
      if (entry.senderId === senderId) {
        drafts.delete(id);
      }
    }
  }

  function revokeAccess(): void {
    accessGeneration++;
    task?.controller.abort();
    previews.clear();
    drafts.clear();
    for (const [senderId, generation] of generations) generations.set(senderId, generation + 1);
  }

  const unsubscribe = deps.subscribeAccess?.(() => {
    try {
      deps.assertAccess();
    } catch {
      // 插件失效后不保留任何可再次采用的 AI 草稿或预览。
      revokeAccess();
    }
  });

  handle("snapshot", async () => deps.library.getSnapshot());
  handle("choose", async (event) => run(event, async (signal) => {
    const path = await deps.pickFolder(event.sender.id);
    if (!path || signal.aborted) {
      return null;
    }
    return deps.library.addRoot(path, signal);
  }));
  handle("refresh", async (event) => run(event, (signal) => deps.library.refresh(signal)));
  handle("remove", async (event, id) => run(event, (signal) => deps.library.removeRoot(identifier(id), signal)));
  handle("search", async (_event, query, filter) => {
    if (typeof query !== "string" || query.length > 200) {
      throw new Error("查找关键词超过 200 字符。");
    }
    return deps.library.search(query, filter as CompanionFileLibrarySearchFilter | undefined);
  });
  handle("reveal", async (_event, id) => {
    const generation = accessGeneration;
    const path = await deps.library.resolveEntry(identifier(id));
    deps.assertAccess();
    if (generation !== accessGeneration) throw new Error("文件助手访问已撤销，请重新定位。");
    deps.reveal(path);
  });
  handle("analyze", async (event, id) => run(event, (signal) => deps.files.analyzeDirectory(getRoot(id).path, { signal })));
  handle("organize", async (event, id) => run(event, async (signal) => {
    const root = getRoot(id);
    const entries = deps.library.getSnapshot().entries.filter((entry) => entry.rootId === root.id && entry.availability === "indexed");
    const recommendations = entries.map((entry) => ({
      relativePath: entry.relativePath,
      category: entry.category,
    }));
    const plan = await deps.files.createRecommendedOrganizePlan(root.path, recommendations, { signal });
    if (signal.aborted) {
      throw new Error("整理预览已取消。");
    }
    deps.rememberPlan(plan.id, event.sender.id);
    return plan;
  }));
  handle("profiles", async () => deps.getProfiles());
  handle("ai-preview", async (event, rootId) => {
    const root = getRoot(rootId);
    const snapshot = deps.library.getSnapshot();
    const candidates = snapshot.entries.filter((entry) => entry.rootId === root.id && entry.availability === "indexed");
    const entries = candidates.slice(0, 200).map((entry) => ({
      entryId: entry.id,
      name: entry.name,
      fileType: entry.fileType,
      category: entry.category,
    }));
    while (entries.length && Buffer.byteLength(JSON.stringify(entries), "utf8") > 60 * 1024) {
      entries.pop();
    }
    if (!entries.length) {
      throw new Error("这个目录暂无可发送的已索引文件。");
    }
    prune();
    const value: CompanionFileLibraryAiPreview = {
      id: randomUUID(),
      expiresAt: Date.now() + 600_000,
      entries,
      totalFiles: candidates.length,
      truncated: entries.length < candidates.length,
    };
    previews.set(value.id, { senderId: event.sender.id, digest: digest(snapshot), expiresAt: value.expiresAt, value });
    return structuredClone(value);
  });
  handle("ai-generate", async (event, previewId, profileId) => run(event, async (signal) => {
    const preview = getStored(previews, event, previewId);
    const profile = identifier(profileId);
    if (!(await deps.getProfiles()).some((entry) => entry.id === profile)) {
      throw new Error("所选文字 AI 来源尚未就绪。");
    }
    const result = await deps.getClassification().generate(profile, preview.value.entries, signal);
    getStored(previews, event, previewId);
    if (signal.aborted) {
      throw new Error("分类建议已取消。");
    }
    prune();
    const value: CompanionFileLibraryAiDraft = { id: randomUUID(), ...result };
    drafts.set(value.id, { senderId: event.sender.id, digest: preview.digest, expiresAt: Date.now() + 600_000, value });
    return structuredClone(value);
  }));
  handle("ai-apply", async (event, draftId) => run(event, async (signal) => {
    const draft = getStored(drafts, event, draftId);
    const snapshot = await deps.library.applyRecommendations({ items: draft.value.items }, signal);
    drafts.delete(draft.value.id);
    return snapshot;
  }));
  return {
    cancelForSender,
    cancelTaskForSender,
    revokeAccess,
    dispose: () => {
      disposed = true;
      unsubscribe?.();
      task?.controller.abort();
      previews.clear();
      drafts.clear();
      generations.clear();
    },
  };
}
