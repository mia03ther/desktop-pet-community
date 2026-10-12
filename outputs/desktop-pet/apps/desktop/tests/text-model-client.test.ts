import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "node:http";

import { TextModelClient } from "../src/text-model-client.js";
import { PetAssistantService } from "../src/pet-assistant-service.js";
import { getPluginPlatformSettings, initializePluginPlatformSettings, selectProviderProfile, updateProviderProfile } from "../src/plugin-platform-settings.js";
import { hostSecretsOwner, providerSecretKey } from "../src/provider-service.js";
import { configureProvider } from "./provider-test-helpers.js";
import type { PluginSecretsStore } from "../src/plugin-secrets.js";
import type { PetAssistantTokenUsage } from "../src/pet-assistant-types.js";

const userDataPath = mkdtempSync(join(tmpdir(), "openpets-text-model-client-"));
const secrets = { get: async () => "test-key" } as unknown as PluginSecretsStore;
let calls: Array<{ input: string; init?: RequestInit }> = [];

try {
  initializePluginPlatformSettings(userDataPath);
  configureProvider({ id: "deepseek-thinking", label: "DeepSeek 测试", adapter: "openai-compatible-text", model: "deepseek-flash", baseUrl: "https://api.deepseek.com", secretRef: "deepseek-thinking" }, "text");
  const reasoningBodies: Array<{ model: string; messages: Array<Record<string, unknown>>; tools: Array<{ function: { name: string } }> }> = [];
  const reasoningClient = new TextModelClient(secrets, {
    fetchImpl: async (_input, init) => {
      const body = JSON.parse(String(init?.body));
      reasoningBodies.push(body);
      if (reasoningBodies.length === 1) {
        return Response.json({ choices: [{ message: {
          content: null,
          reasoning_content: "仅供模型续传的私有思考",
          tool_calls: [{
            id: "reasoning-call",
            type: "function",
            function: { name: body.tools[0].function.name, arguments: "{}" },
          }],
        } }] });
      }
      return Response.json({ choices: [{ message: {
        content: "已完成",
        reasoning_content: "仅供下一回合续传的私有思考",
      } }] });
    },
  });
  const reasoningService = new PetAssistantService(reasoningClient, {
    snapshot: () => ({ capabilities: [{
      pluginId: "fixture",
      capability: { id: "inspect", description: "测试工具", inputSchema: { type: "object" } },
      handle: {},
    }] }),
    execute: async () => ({ ok: true, result: { ok: true } }),
  });
  const publicEvents: unknown[] = [];
  reasoningService.subscribe(event => publicEvents.push(event));
  assert.equal((await reasoningService.startTurn("fixture", "检查一下")).status, "completed");
  assert.equal(reasoningBodies[1]?.messages.find(message => message.role === "assistant")?.reasoning_content, "仅供模型续传的私有思考");
  assert.equal((await reasoningService.startTurn("fixture", "继续")).status, "completed");
  assert.equal(reasoningBodies[2]?.messages.filter(message => message.role === "assistant").at(-1)?.reasoning_content, "仅供下一回合续传的私有思考");
  assert.doesNotMatch(JSON.stringify(publicEvents), /仅供模型|仅供下一回合|reasoning_content/);
  updateProviderProfile("deepseek-thinking", { model: "other-model" });
  await reasoningService.startTurn("fixture", "换模型后继续");
  assert.ok(reasoningBodies[3]?.messages.filter(message => message.role === "assistant").every(message => message.reasoning_content === ""));
  await reasoningService.stop();
  configureProvider({ id: "text-test", label: "Text test", adapter: "openai-compatible-text", model: "test-model", baseUrl: "https://provider.test/v1", secretRef: "text-test" }, "text");

  const openAi = new TextModelClient(secrets, { fetchImpl: async (input, init) => {
    calls.push({ input: String(input), init });
    return new Response(JSON.stringify({ choices: [{ message: { content: "Planning the focus session.", tool_calls: [{ id: "call-1", type: "function", function: { name: "op_tool", arguments: '{"minutes":25}' } }] } }] }), { status: 200 });
  } });
  const toolResponse = await openAi.generate({ messages: [
    { role: "system", content: "Fixed host rules." },
    { role: "system", content: "Curated context." },
    { role: "system", content: "Personality style." },
    { role: "user", content: "start" },
  ], tools: [{ name: "op_tool", description: "Start", inputSchema: { type: "object" } }] }, new AbortController().signal);
  assert.deepEqual(toolResponse, { type: "tool-calls", text: "Planning the focus session.", toolCalls: [{ id: "call-1", name: "op_tool", arguments: { minutes: 25 } }] });
  assert.equal(calls[0]?.input, "https://provider.test/v1/chat/completions");
  const openAiInitialBody = JSON.parse(String(calls[0]?.init?.body)) as { messages: Array<{ role: string; content: string }> };
  assert.deepEqual(openAiInitialBody.messages.filter((message) => message.role === "system").map((message) => message.content), ["Fixed host rules.", "Curated context.", "Personality style."]);

  let snapshotCalls = 0;
  const snapshotUrls: string[] = [];
  const snapshotClient = new TextModelClient(secrets, { fetchImpl: async (input) => {
    snapshotUrls.push(String(input));
    snapshotCalls += 1;
    if (snapshotCalls === 1) updateProviderProfile("text-test", { baseUrl: "https://changed.test/v1" });
    return new Response(JSON.stringify({ choices: [{ message: { content: `step-${snapshotCalls}` } }] }), { status: 200 });
  } });
  await snapshotClient.generate({ messages: [{ role: "user", content: "one" }], tools: [] }, new AbortController().signal);
  await snapshotClient.generate({ messages: [{ role: "user", content: "two" }], tools: [] }, new AbortController().signal);
  assert.equal(snapshotCalls, 2);
  assert.deepEqual(snapshotUrls, ["https://provider.test/v1/chat/completions", "https://provider.test/v1/chat/completions"]);

  calls = [];
  await openAi.generate({ messages: [
    { role: "assistant", content: "Planning the focus session.", toolCalls: [{ id: "call-1", name: "op_tool", arguments: { minutes: 25 } }] },
    { role: "tool", toolCallId: "call-1", name: "op_tool", result: { status: "completed", result: { started: true } } },
  ], tools: [] }, new AbortController().signal);
  const openAiBody = JSON.parse(String(calls[0]?.init?.body)) as { messages: Array<Record<string, unknown>> };
  assert.equal(openAiBody.messages[0]?.content, "Planning the focus session.");
  assert.equal((openAiBody.messages[0]?.tool_calls as Array<{ id: string }>)[0]?.id, "call-1");
  assert.equal(openAiBody.messages[1]?.tool_call_id, "call-1");
  assert.equal(Object.hasOwn(openAiBody, "tools"), false, "无工具时省略 tools，避免兼容接口拒绝空数组");

  // 两个配置共用原凭据所有者，但操作捕获各自的地址、模型和凭据，不改变桌宠选择。
  configureProvider({ id: "fixed-a", label: "来源甲", adapter: "openai-compatible-text", model: "model-a", baseUrl: "https://alpha.test/v1", secretRef: "fixed-a" }, "text");
  configureProvider({ id: "fixed-b", label: "来源乙", adapter: "openai-compatible-text", model: "model-b", baseUrl: "https://beta.test/custom", secretRef: "fixed-b" }, "text");
  selectProviderProfile("text", "text-test");
  const fixtureCredentials = new Map([[providerSecretKey("fixed-a"), "fixture-key-a"], [providerSecretKey("fixed-b"), "fixture-key-b"]]);
  const credentialReads: Array<{ owner: string; key: string }> = [];
  const profileSecrets = { get: async (owner: string, key: string) => {
    credentialReads.push({ owner, key });
    return fixtureCredentials.get(key);
  } } as unknown as PluginSecretsStore;
  const fixedCalls: Array<{ url: string; model: unknown; authorization: string | null; toolsPresent: boolean }> = [];
  const fixedFetch: typeof fetch = async (input, init) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    fixedCalls.push({ url: String(input), model: body.model, authorization: new Headers(init?.headers).get("authorization"), toolsPresent: Object.hasOwn(body, "tools") });
    return new Response(JSON.stringify({ choices: [{ message: { content: "仅供分析。" } }] }), { status: 200 });
  };
  const clientA = new TextModelClient(profileSecrets, { profileId: "fixed-a", fetchImpl: fixedFetch });
  const clientB = new TextModelClient(profileSecrets, { profileId: "fixed-b", fetchImpl: fixedFetch });
  const operationA = await clientA.beginOperation();
  const operationB = await clientB.beginOperation();
  updateProviderProfile("fixed-a", { model: "model-a-next", baseUrl: "https://alpha-next.test/v1" });
  fixtureCredentials.set(providerSecretKey("fixed-a"), "fixture-key-a-next");
  selectProviderProfile("text", "fixed-b");
  const plainRequest = { messages: [{ role: "user" as const, content: "只读分析" }], tools: [] };
  await operationA.generate(plainRequest, new AbortController().signal);
  await operationB.generate(plainRequest, new AbortController().signal);
  await operationA.generate(plainRequest, new AbortController().signal);
  assert.deepEqual(fixedCalls, [
    { url: "https://alpha.test/v1/chat/completions", model: "model-a", authorization: "Bearer fixture-key-a", toolsPresent: false },
    { url: "https://beta.test/custom/chat/completions", model: "model-b", authorization: "Bearer fixture-key-b", toolsPresent: false },
    { url: "https://alpha.test/v1/chat/completions", model: "model-a", authorization: "Bearer fixture-key-a", toolsPresent: false },
  ]);
  const nextOperationA = await clientA.beginOperation();
  await nextOperationA.generate(plainRequest, new AbortController().signal);
  assert.deepEqual(fixedCalls[3], { url: "https://alpha-next.test/v1/chat/completions", model: "model-a-next", authorization: "Bearer fixture-key-a-next", toolsPresent: false });
  assert.equal(getPluginPlatformSettings().selections.text, "fixed-b");
  assert.deepEqual(credentialReads, [
    { owner: hostSecretsOwner, key: providerSecretKey("fixed-a") },
    { owner: hostSecretsOwner, key: providerSecretKey("fixed-b") },
    { owner: hostSecretsOwner, key: providerSecretKey("fixed-a") },
  ]);

  // 用量只取提供方的原字段：零是有效计数，缺失或无效值保持 null，不推算总量。
  const openAiUsageCases = [
    { usage: { prompt_tokens: 0, completion_tokens: 3, total_tokens: 9 }, expected: { inputTokens: 0, outputTokens: 3, totalTokens: 9 } },
    { usage: { prompt_tokens: 4, completion_tokens: -1, total_tokens: "4" }, expected: { inputTokens: 4, outputTokens: null, totalTokens: null } },
    { usage: { prompt_tokens: 1.5, completion_tokens: Number.MAX_SAFE_INTEGER + 1, total_tokens: 0 }, expected: { inputTokens: null, outputTokens: null, totalTokens: 0 } },
    { usage: { prompt_tokens: 2, completion_tokens: 5 }, expected: { inputTokens: 2, outputTokens: 5, totalTokens: null } },
    { usage: { prompt_tokens: -1, completion_tokens: "3", total_tokens: 1.2 }, expected: undefined },
    { usage: null, expected: undefined },
  ];
  for (const { usage, expected } of openAiUsageCases) {
    const observed: Array<{ profileId: string; usage: PetAssistantTokenUsage }> = [];
    const usageClient = new TextModelClient(secrets, {
      profileId: "fixed-b",
      onUsage: (profileId, usage) => observed.push({ profileId, usage }),
      fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: "计数样本" } }], usage }), { status: 200 }),
    });
    const operation = await usageClient.beginOperation();
    const response = await operation.generate(plainRequest, new AbortController().signal);
    assert.deepEqual(response.usage, expected);
    assert.equal(Object.hasOwn(response, "usage"), expected !== undefined);
    assert.deepEqual(observed, expected ? [{ profileId: "fixed-b", usage: expected }] : [], "用量通知沿用固定操作配置；未提供用量时不能发出虚构计数");
  }

  configureProvider({ id: "anthropic-test", label: "Anthropic test", adapter: "anthropic-text", model: "claude-test", baseUrl: "https://anthropic.test", secretRef: "anthropic-test" }, "text");
  calls = [];
  const anthropic = new TextModelClient(secrets, { fetchImpl: async (input, init) => {
    calls.push({ input: String(input), init });
    return new Response(JSON.stringify({ content: [{ type: "text", text: "Preparing." }, { type: "tool_use", id: "anthropic-call", name: "op_tool", input: { minutes: 5 } }] }), { status: 200 });
  } });
  const anthropicResponse = await anthropic.generate({ messages: [
    { role: "system", content: "Fixed host rules." },
    { role: "system", content: "Curated context." },
    { role: "system", content: "Personality style." },
    { role: "assistant", content: "Previous thought.", toolCalls: [{ id: "previous", name: "op_tool", arguments: {} }] },
    { role: "tool", toolCallId: "previous", name: "op_tool", result: { status: "completed", result: { started: true } } },
  ], tools: [] }, new AbortController().signal);
  assert.deepEqual(anthropicResponse, { type: "tool-calls", text: "Preparing.", toolCalls: [{ id: "anthropic-call", name: "op_tool", arguments: { minutes: 5 } }] });
  const anthropicBody = JSON.parse(String(calls[0]?.init?.body)) as { system: string; messages: Array<{ content: Array<{ tool_use_id?: string; text?: string }> }> };
  assert.equal(anthropicBody.system, "Fixed host rules.\n\nCurated context.\n\nPersonality style.");
  assert.equal(anthropicBody.messages[0]?.content[0]?.text, "Previous thought.");
  assert.equal(anthropicBody.messages[1]?.content[0]?.tool_use_id, "previous");
  assert.equal(Object.hasOwn(anthropicBody, "tools"), false);
  const anthropicUsage = new TextModelClient(secrets, { profileId: "anthropic-test", fetchImpl: async () => new Response(JSON.stringify({
    content: [{ type: "text", text: "分析样本" }], usage: { input_tokens: 8, output_tokens: 2, total_tokens: 999 },
  }), { status: 200 }) });
  assert.deepEqual((await anthropicUsage.generate(plainRequest, new AbortController().signal)).usage, { inputTokens: 8, outputTokens: 2, totalTokens: null });
  const anthropicPartialUsage = new TextModelClient(secrets, { profileId: "anthropic-test", fetchImpl: async () => new Response(JSON.stringify({
    content: [{ type: "tool_use", id: "usage-call", name: "op_tool", input: {} }], usage: { input_tokens: -2, output_tokens: 0 },
  }), { status: 200 }) });
  assert.deepEqual((await anthropicPartialUsage.generate(plainRequest, new AbortController().signal)).usage, { inputTokens: null, outputTokens: 0, totalTokens: null });

  const malformed = new TextModelClient(secrets, { fetchImpl: async () => new Response(JSON.stringify({ content: [{ type: "tool_use", id: "", name: "op_tool", input: {} }] }), { status: 200 }) });
  await assert.rejects(() => malformed.generate({ messages: [{ role: "user", content: "start" }], tools: [] }, new AbortController().signal), /missing or duplicate tool-call ids/);

  const failed = new TextModelClient(secrets, { fetchImpl: async () => new Response("no", { status: 503 }) });
  await assert.rejects(() => failed.generate({ messages: [{ role: "user", content: "start" }], tools: [] }, new AbortController().signal), /HTTP 503/);

  const oversized = new TextModelClient(secrets, { maxRequestBytes: 10 });
  await assert.rejects(() => oversized.generate({ messages: [{ role: "user", content: "start" }], tools: [] }, new AbortController().signal), /request is too large/);

  const caller = new AbortController();
  const cancelled = new TextModelClient(secrets, { fetchImpl: async () => new Promise<Response>(() => undefined) });
  const pending = cancelled.generate({ messages: [{ role: "user", content: "start" }], tools: [] }, caller.signal);
  caller.abort();
  await assert.rejects(() => pending, (error: unknown) => {
    assert.equal((error as { code?: string }).code, "provider.cancelled");
    return true;
  });

  const timedOut = new TextModelClient(secrets, { timeoutMs: 5, fetchImpl: async () => new Promise<Response>(() => undefined) });
  await assert.rejects(() => timedOut.generate({ messages: [{ role: "user", content: "start" }], tools: [] }, new AbortController().signal), (error: unknown) => {
    assert.equal((error as { code?: string }).code, "provider.timeout");
    return true;
  });

  // 本机 HTTP 夹具走真实 fetch、原传输和编解码，不使用用户端点或真实密钥。
  const localCalls: Array<{ url: string | undefined; method: string | undefined; authorization: string | undefined; body: Record<string, unknown> }> = [];
  const server = createServer(async (request, response) => {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      localCalls.push({ url: request.url, method: request.method, authorization: request.headers.authorization, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown> });
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ choices: [{ message: { content: "本机接口已经返回分析样本。" } }], usage: { prompt_tokens: 7, completion_tokens: 4, total_tokens: 11 } }));
    } catch {
      response.writeHead(400);
      response.end();
    }
  });
  try {
    await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
    const address = server.address();
    assert(address && typeof address === "object");
    configureProvider({ id: "loopback-text", label: "本机测试", adapter: "openai-compatible-text", model: "loopback-model", baseUrl: `http://127.0.0.1:${address.port}/v1`, secretRef: "loopback-text" }, "text");
    const localClient = new TextModelClient(secrets, { profileId: "loopback-text", timeoutMs: 2_000 });
    const localResponse = await localClient.generate(plainRequest, new AbortController().signal);
    assert.deepEqual(localResponse, { type: "text", text: "本机接口已经返回分析样本。", usage: { inputTokens: 7, outputTokens: 4, totalTokens: 11 } });
    assert.equal(localCalls.length, 1);
    assert.equal(localCalls[0]?.url, "/v1/chat/completions");
    assert.equal(localCalls[0]?.method, "POST");
    assert.equal(localCalls[0]?.authorization, "Bearer test-key");
    assert.equal(localCalls[0]?.body.model, "loopback-model");
    assert.equal(Object.hasOwn(localCalls[0]!.body, "tools"), false);
  } finally {
    server.closeAllConnections();
    if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
} finally {
  rmSync(userDataPath, { recursive: true, force: true });
}

console.log("text-model-client tests passed.");
