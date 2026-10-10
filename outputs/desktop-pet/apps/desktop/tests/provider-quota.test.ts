import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { initializePluginPlatformSettings, createProviderProfile, getPluginPlatformSettings } from "../src/plugin-platform-settings.js";
import { HostProviderService, hostSecretsOwner, providerSecretKey } from "../src/provider-service.js";
import type { PluginSecretsStore } from "../src/plugin-secrets.js";
import { getOfficialQuotaProvider } from "../src/provider-contract.js";

const directory = mkdtempSync(join(tmpdir(), "openpets-provider-quota-"));
const secrets = { get: async (owner: string, key: string) => {
  assert.equal(owner, hostSecretsOwner);
  assert.equal(key, providerSecretKey("quota-fixture"));
  return "fixture-quota-key";
} } as unknown as PluginSecretsStore;
type CapturedRequest = { url: string; method: string | undefined; headers: Headers; body: RequestInit["body"]; redirect: RequestInit["redirect"] };

function fixture(value: unknown, status = 200): { service: HostProviderService; requests: CapturedRequest[] } {
  const requests: CapturedRequest[] = [];
  return { requests, service: new HostProviderService(secrets, { fetchImpl: async (input, init) => {
    requests.push({ url: String(input), method: init?.method, headers: new Headers(init?.headers), body: init?.body, redirect: init?.redirect });
    return new Response(JSON.stringify(value), { status });
  } }) };
}
function hasCode(code: string): (error: unknown) => boolean {
  return (error) => {
    assert.equal((error as { code?: string }).code, code);
    return true;
  };
}

async function main(): Promise<void> {
  try {
    initializePluginPlatformSettings(directory);
    createProviderProfile({ id: "quota-deepseek", label: "DeepSeek 测试", adapter: "openai-compatible-text", model: "fixture-model", baseUrl: "https://api.deepseek.com/v1/custom-prefix", secretRef: "quota-fixture" });
    createProviderProfile({ id: "quota-openrouter", label: "OpenRouter 测试", adapter: "openai-compatible-text", model: "fixture-model", baseUrl: "https://openrouter.ai/api/v1/custom-prefix", secretRef: "quota-fixture" });
    const selections = structuredClone(getPluginPlatformSettings().selections);
    assert.equal(getOfficialQuotaProvider(getPluginPlatformSettings().profiles["quota-deepseek"]!), "deepseek");
    assert.equal(getOfficialQuotaProvider(getPluginPlatformSettings().profiles["quota-openrouter"]!), "openrouter");
    const deepseek = fixture({ is_available: true, balance_infos: [
      { currency: "CNY", total_balance: "12.50", granted_balance: "2.50", topped_up_balance: "10.00" },
      { currency: "USD", total_balance: "0.25", granted_balance: "0.00", topped_up_balance: "0.25" },
    ] });
    const balance = await deepseek.service.queryQuota("quota-deepseek");
    assert.equal(balance.provider, "deepseek");
    assert.equal(balance.kind, "account-balance");
    assert.equal(balance.status, "fresh");
    assert.equal(balance.profileId, "quota-deepseek");
    assert.deepEqual(balance.balances, [{ unit: "CNY", remaining: 12.5 }, { unit: "USD", remaining: 0.25 }]);
    assert(Number.isSafeInteger(balance.recordedAt));
    assert.equal(deepseek.requests.length, 1);
    assert.equal(deepseek.requests[0]?.url, "https://api.deepseek.com/user/balance");
    assert.equal(deepseek.requests[0]?.method, "GET");
    assert.equal(deepseek.requests[0]?.headers.get("authorization"), "Bearer fixture-quota-key");
    assert.equal(deepseek.requests[0]?.body, undefined);
    assert.equal(deepseek.requests[0]?.redirect, "error");
    assert.deepEqual(getPluginPlatformSettings().selections, selections);

    // 官方负余额表示真实欠额；显示币种，不能截成零或换算成请求次数。
    const exhausted = fixture({ is_available: false, balance_infos: [{ currency: "CNY", total_balance: "-0.20" }] });
    const exhaustedBalance = await exhausted.service.queryQuota("quota-deepseek");
    assert.deepEqual(exhaustedBalance.balances, [{ unit: "CNY", remaining: -0.2 }]);
    assert.match(exhaustedBalance.reason, /余额不足/);

    const openrouter = fixture({ data: { limit: 20, limit_remaining: 5.75, usage: 14.25 } });
    const spendingLimit = await openrouter.service.queryQuota("quota-openrouter");
    assert.equal(spendingLimit.kind, "key-spending-limit");
    assert.equal(spendingLimit.provider, "openrouter");
    assert.deepEqual(spendingLimit.balances, [{ unit: "USD", remaining: 5.75 }]);
    assert.match(spendingLimit.reason, /不是账户余额/);
    assert.equal(openrouter.requests[0]?.url, "https://openrouter.ai/api/v1/key");
    assert.equal(openrouter.requests[0]?.method, "GET");
    assert.equal(openrouter.requests[0]?.headers.get("authorization"), "Bearer fixture-quota-key");
    assert.equal(openrouter.requests[0]?.body, undefined);
    assert.equal(openrouter.requests[0]?.redirect, "error");
    const unlimited = fixture({ data: { limit: null, limit_remaining: null } });
    const unlimitedResult = await unlimited.service.queryQuota("quota-openrouter");
    assert.deepEqual(unlimitedResult.balances, [{ unit: "USD", remaining: null }]);
    assert.match(unlimitedResult.reason, /未设置支出上限.*不表示账户余额无限/);

    // 官源域名必须完整匹配；自定义兼容网关不会借用官源凭据查询余额。
    const unsupportedAddresses = [
      "https://api.deepseek.com.attacker.invalid/v1", "https://deepseek-api.test/v1", "https://api.deepseek.com:444/v1",
      "https://openrouter.ai.attacker.invalid/api/v1", "https://openrouter.ai:444/api/v1", "http://127.0.0.1:11434/v1",
    ];
    const noNetwork = fixture({});
    for (const [index, baseUrl] of unsupportedAddresses.entries()) {
      const id = `quota-unsupported-${index}`;
      createProviderProfile({ id, label: "非官源测试", adapter: "openai-compatible-text", model: "fixture-model", baseUrl, secretRef: "quota-fixture" });
      assert.equal(getOfficialQuotaProvider(getPluginPlatformSettings().profiles[id]!), null, "界面与实际请求必须使用同一官方能力判定");
      await assert.rejects(() => noNetwork.service.queryQuota(id), hasCode("provider.quota.unsupported"));
    }
    createProviderProfile({ id: "quota-anthropic", label: "不同协议测试", adapter: "anthropic-text", model: "fixture-model", baseUrl: "https://api.deepseek.com/anthropic", secretRef: "quota-fixture" });
    assert.equal(getOfficialQuotaProvider(getPluginPlatformSettings().profiles["quota-anthropic"]!), null);
    assert.equal(getOfficialQuotaProvider({ adapter: "openai-compatible-text", baseUrl: "https://user:password@api.deepseek.com" }), null);
    assert.equal(getOfficialQuotaProvider({ adapter: "openai-compatible-text", baseUrl: "无效地址" }), null);
    await assert.rejects(() => noNetwork.service.queryQuota("quota-anthropic"), hasCode("provider.quota.unsupported"));
    assert.equal(noNetwork.requests.length, 0);
    await assert.rejects(() => noNetwork.service.queryQuota("missing-quota-profile"), hasCode("provider.profile.invalid"));
    createProviderProfile({ id: "quota-no-key", label: "无凭据测试", adapter: "openai-compatible-text", model: "fixture-model", baseUrl: "https://api.deepseek.com" });
    await assert.rejects(() => noNetwork.service.queryQuota("quota-no-key"), hasCode("provider.credential.missing"));
    assert.equal(noNetwork.requests.length, 0);

    const invalidDeepseek = [
      null, {}, { is_available: "yes", balance_infos: [{ currency: "CNY", total_balance: "1" }] },
      { is_available: true, balance_infos: [] },
      { is_available: true, balance_infos: [{ currency: "EUR", total_balance: "1" }] },
      { is_available: true, balance_infos: [{ currency: "CNY", total_balance: 1 }] },
      { is_available: true, balance_infos: [{ currency: "CNY", total_balance: "" }] },
      { is_available: true, balance_infos: [{ currency: "CNY", total_balance: "1e3" }] },
      { is_available: true, balance_infos: [{ currency: "CNY", total_balance: "NaN" }] },
      { is_available: true, balance_infos: [{ currency: "CNY", total_balance: "1000000000001" }] },
      { is_available: true, balance_infos: [{ currency: "CNY", total_balance: "1" }, { currency: "CNY", total_balance: "2" }] },
    ];
    for (const value of invalidDeepseek) await assert.rejects(() => fixture(value).service.queryQuota("quota-deepseek"), hasCode("provider.response.invalid"));
    const invalidOpenrouter = [null, {}, { data: {} }, { data: { limit: 10, limit_remaining: "5" } },
      { data: { limit: 10, limit_remaining: null } }, { data: { limit: null, limit_remaining: 1000000000001 } }];
    for (const value of invalidOpenrouter) await assert.rejects(() => fixture(value).service.queryQuota("quota-openrouter"), hasCode("provider.response.invalid"));
    const redirected = fixture({}, 302);
    await assert.rejects(() => redirected.service.queryQuota("quota-deepseek"), /HTTP 302/);
    assert.equal(redirected.requests.length, 1);
    assert.equal(redirected.requests[0]?.redirect, "error");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

main().then(() => console.log("官方额度查询行为测试通过。"), (error) => { console.error(error); process.exitCode = 1; });
