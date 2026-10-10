import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  buildProviderControlCenterSnapshot,
  createProviderProfile,
  getPluginPlatformSettings,
  initializePluginPlatformSettings,
  providerCatalog,
  providerPresets,
  selectProviderProfile,
  validateProviderProfile,
  type ProviderProfile,
} from "../src/plugin-platform-settings.js";
import { getProviderCredentialPolicy } from "../src/provider-contract.js";
import { getProfileCredentialPolicy } from "../src/renderer/src/settings/providers/types.js";

const dir = mkdtempSync(join(tmpdir(), "openpets-provider-presets-"));

try {
  initializePluginPlatformSettings(dir);

  // Adapter defaults are the typed source of truth for new provider drafts.
  assert.equal(providerCatalog["minimax-tts"].defaultModel, "speech-2.8-turbo");
  assert.equal(providerCatalog["openai-compatible-speech"].defaultModel, "tts-1");
  assert.equal(providerCatalog["openai-compatible-transcription"].defaultModel, "whisper-1");
  assert.equal(providerCatalog["elevenlabs-transcription"].defaultModel, "scribe_v2");
  assert.deepEqual(providerCatalog["elevenlabs-transcription"].roles, ["stt"]);
  assert.equal(providerCatalog["elevenlabs-transcription"].credentialPolicy, "required");
  assert.equal(providerCatalog["elevenlabs-tts"].defaultModel, "eleven_flash_v2_5");
  assert.equal(providerCatalog["elevenlabs-tts"].defaultVoice, "od84OdVweqzO3t6kKlWT");

  // 1. OpenRouter preset tests
  const openrouterPreset = providerPresets.find((p) => p.id === "openrouter");
  assert.ok(openrouterPreset, "OpenRouter preset must exist");
  assert.equal(openrouterPreset.label, "OpenRouter");
  assert.equal(openrouterPreset.adapter, "openai-compatible-text");
  assert.equal(openrouterPreset.model, "openai/gpt-4o-mini");
  assert.equal(openrouterPreset.baseUrl, "https://openrouter.ai/api/v1");
  assert.equal(openrouterPreset.credentialMode, "required");
  const elevenLabsPreset = providerPresets.find((preset) => preset.id === "elevenlabs");
  assert.equal(elevenLabsPreset?.model, "eleven_flash_v2_5");
  assert.equal(elevenLabsPreset?.voice, "od84OdVweqzO3t6kKlWT");
  const elevenLabsScribePreset = providerPresets.find((preset) => preset.id === "elevenlabs-scribe");
  assert.ok(elevenLabsScribePreset, "ElevenLabs Scribe STT preset must exist");
  assert.equal(elevenLabsScribePreset.label, "ElevenLabs Scribe STT");
  assert.equal(elevenLabsScribePreset.adapter, "elevenlabs-transcription");
  assert.equal(elevenLabsScribePreset.model, "scribe_v2");
  assert.equal(elevenLabsScribePreset.baseUrl, "https://api.elevenlabs.io/v1");
  assert.equal(elevenLabsScribePreset.credentialMode, "required");

  // Verify creating an OpenRouter profile with optional headers and validating it
  const openrouterProfile = validateProviderProfile({
    id: "openrouter-main",
    label: openrouterPreset.label,
    adapter: openrouterPreset.adapter,
    model: openrouterPreset.model,
    baseUrl: openrouterPreset.baseUrl,
    secretRef: "openrouter-key",
    headers: [
      { name: "HTTP-Referer", value: "https://openpets.app" },
      { name: "X-Title", value: "OpenPets" },
    ],
  });
  assert.equal(openrouterProfile.id, "openrouter-main");
  assert.equal(openrouterProfile.baseUrl, "https://openrouter.ai/api/v1");
  assert.equal(openrouterProfile.headers?.length, 2);

  // 2. All provider presets create valid profiles
  for (const preset of providerPresets) {
    const profileInput = {
      id: `test-${preset.id}`,
      label: preset.label,
      adapter: preset.adapter,
      model: preset.model,
      ...(preset.realtimeModel ? { realtimeModel: preset.realtimeModel } : {}),
      ...(preset.voice ? { voice: preset.voice } : {}),
      ...("baseUrl" in preset && typeof preset.baseUrl === "string" ? { baseUrl: preset.baseUrl } : {}),
      ...(preset.credentialMode === "required" ? { secretRef: `ref-${preset.id}` } : {}),
    };
    const validated = validateProviderProfile(profileInput);
    assert.equal(validated.id, profileInput.id);
    createProviderProfile(validated);
  }

  // 3. Save-and-activate role transitions
  // Select OpenRouter for text (Pet Brain)
  selectProviderProfile("text", "test-openrouter");
  assert.equal(getPluginPlatformSettings().selections.text, "test-openrouter");

  // Select Whisper for STT (Hearing)
  selectProviderProfile("stt", "test-whisper");
  assert.equal(getPluginPlatformSettings().selections.stt, "test-whisper");

  // Select System Voice for TTS (Speech)
  selectProviderProfile("tts", "test-system-tts");
  assert.equal(getPluginPlatformSettings().selections.tts, "test-system-tts");

  // Disable role by setting to null
  selectProviderProfile("stt", null);
  assert.equal(getPluginPlatformSettings().selections.stt, null);

  // 4. Credential requirement verification in snapshot
  const snapshot = buildProviderControlCenterSnapshot(
    getPluginPlatformSettings(),
    (profile: ProviderProfile) => profile.secretRef === "ref-openrouter", // only openrouter has credential stored
  );

  const textStatus = snapshot.statuses.text;
  assert.equal(textStatus.state, "ready", "OpenRouter with stored credential is ready");

  // ElevenLabs was created with secretRef "ref-elevenlabs" which is not stored
  selectProviderProfile("tts", "test-elevenlabs");
  const snapshot2 = buildProviderControlCenterSnapshot(
    getPluginPlatformSettings(),
    (profile: ProviderProfile) => profile.secretRef === "ref-openrouter",
  );
  assert.equal(snapshot2.statuses.tts.state, "missing-secret", "ElevenLabs without credential must report missing-secret");

  selectProviderProfile("stt", "test-elevenlabs-scribe");
  const snapshotScribe = buildProviderControlCenterSnapshot(
    getPluginPlatformSettings(),
    (profile: ProviderProfile) => profile.secretRef === "ref-openrouter",
  );
  assert.equal(snapshotScribe.statuses.stt.state, "missing-secret", "ElevenLabs Scribe must require a credential");

  // System TTS has no credential required
  selectProviderProfile("tts", "test-system-tts");
  const snapshot3 = buildProviderControlCenterSnapshot(
    getPluginPlatformSettings(),
    () => false,
  );
  assert.equal(snapshot3.statuses.tts.state, "ready", "System TTS with no credential required must report ready");

  // Local Ollama has no credential required
  selectProviderProfile("text", "test-ollama");
  const snapshot4 = buildProviderControlCenterSnapshot(
    getPluginPlatformSettings(),
    () => false,
  );
  assert.equal(snapshot4.statuses.text.state, "ready", "Local Ollama with no credential required must report ready");

  // 官方 HTTPS 来源要求真实凭据；模型手填和地址路径变动不能把云端误判成本机。
  for (const presetId of ["openrouter", "deepseek"]) {
    const preset = providerPresets.find((entry) => entry.id === presetId);
    assert(preset && preset.baseUrl);
    assert.equal(preset.adapter, "openai-compatible-text");
    const official = { adapter: preset.adapter, baseUrl: preset.baseUrl };
    assert.equal(getProviderCredentialPolicy(official), "required");
    assert.equal(getProfileCredentialPolicy(official), "required", "界面提示与主进程使用同一凭据策略");
    const sameOrigin = { ...official, baseUrl: `${new URL(preset.baseUrl).origin}:443/custom-prefix` };
    assert.equal(getProviderCredentialPolicy(sameOrigin), "required");
    assert.equal(getProfileCredentialPolicy(sameOrigin), "required");
    const profileId = `official-no-key-${presetId}`;
    createProviderProfile({ id: profileId, label: preset.label, adapter: "openai-compatible-text", model: "手填模型", baseUrl: preset.baseUrl });
    selectProviderProfile("text", profileId);
    assert.equal(buildProviderControlCenterSnapshot(getPluginPlatformSettings(), () => false).statuses.text.state, "missing-secret");
    const persistedNoKey = getPluginPlatformSettings().profiles[profileId];
    assert(persistedNoKey?.adapter === "openai-compatible-text");
    assert.equal(persistedNoKey.secretRef, undefined);
    const storedId = `official-stored-key-${presetId}`;
    createProviderProfile({ ...persistedNoKey, id: storedId, secretRef: `fixture-${presetId}` });
    selectProviderProfile("text", storedId);
    assert.equal(buildProviderControlCenterSnapshot(getPluginPlatformSettings(), () => false).statuses.text.state, "missing-secret", "仅有密钥引用不代表密钥存在");
    assert.equal(buildProviderControlCenterSnapshot(getPluginPlatformSettings(), (profile) => profile.secretRef === `fixture-${presetId}`).statuses.text.state, "ready");
  }
  const officialCompatibleOpenAi = { adapter: "openai-compatible-text" as const, baseUrl: "https://api.openai.com/v1" };
  assert.equal(getProviderCredentialPolicy(officialCompatibleOpenAi), "required", "改变官方地址的协议选项不能绕过必需凭据");
  assert.equal(getProfileCredentialPolicy(officialCompatibleOpenAi), "required");

  // 本机及自定义兼容网关保留无凭据配置能力，域名欺骗不能套用官方策略。
  const optionalAddresses = ["http://127.0.0.1:11434/v1", "http://localhost:1234/v1", "https://gateway.example/v1",
    "https://openrouter.ai.attacker.invalid/api/v1", "https://api.deepseek.com.attacker.invalid/v1", "https://api.deepseek.com:444/v1", "https://api.openai.com.attacker.invalid/v1"];
  for (const [index, baseUrl] of optionalAddresses.entries()) {
    const profile = { adapter: "openai-compatible-text" as const, baseUrl };
    assert.equal(getProviderCredentialPolicy(profile), "optional");
    assert.equal(getProfileCredentialPolicy(profile), "optional");
    const id = `credential-optional-${index}`;
    createProviderProfile({ id, label: "无凭据网关", model: "fixture-model", ...profile });
    selectProviderProfile("text", id);
    assert.equal(buildProviderControlCenterSnapshot(getPluginPlatformSettings(), () => false).statuses.text.state, "ready");
  }
  const localNative = { adapter: "anthropic-text" as const, baseUrl: "http://127.0.0.1:3000" };
  assert.equal(getProviderCredentialPolicy(localNative), "required");
  assert.equal(getProfileCredentialPolicy(localNative), "required", "本机地址不能降低原生协议的必需凭据策略");
  assert.equal(getProviderCredentialPolicy({ adapter: "system-tts" }), "none");
  assert.equal(getProfileCredentialPolicy({ adapter: "system-tts" }), "none");
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log("provider presets and role activation tests passed.");
