// ../../packages/client/src/index.ts
import net from "node:net";
import { randomUUID } from "node:crypto";
import { posix, win32 } from "node:path";

// ../../packages/client/src/discovery.ts
import { existsSync, lstatSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

// ../../packages/client/src/protocol.ts
var openPetsIpcProtocol = "openpets-ipc";
var openPetsIpcVersion = 1;
var maxIpcMessageBytes = 16 * 1024;
var connectTimeoutMs = 2e3;
var responseTimeoutMs = 3e3;
var allowedReactions = [
  "idle",
  "thinking",
  "working",
  "editing",
  "running",
  "testing",
  "waiting",
  "waving",
  "success",
  "error",
  "celebrating"
];
function parseIpcResponse(value) {
  if (!isRecord(value)) throw new OpenPetsClientError("invalid_response", "IPC response must be an object.");
  if (typeof value.id !== "string" && value.id !== null) throw new OpenPetsClientError("invalid_response", "IPC response id is invalid.");
  if (value.ok === true) {
    return { id: value.id, ok: true, result: value.result };
  }
  if (value.ok === false && isRecord(value.error) && typeof value.error.code === "string" && typeof value.error.message === "string") {
    return { id: value.id, ok: false, error: { code: value.error.code, message: value.error.message } };
  }
  throw new OpenPetsClientError("invalid_response", "IPC response shape is invalid.");
}
function validateReaction(value) {
  if (!allowedReactions.includes(value)) {
    throw new OpenPetsClientError("invalid_reaction", "Invalid OpenPets reaction.");
  }
  return value;
}
var OpenPetsClientError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
  code;
};
function isRecord(value) {
  return typeof value === "object" && value !== null;
}

// ../../packages/client/src/discovery.ts
function getDiscoveryFilePath() {
  if (process.env.OPENPETS_DISCOVERY_FILE) {
    return process.env.OPENPETS_DISCOVERY_FILE;
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "OpenPets", "runtime", "ipc.json");
  }
  if (process.platform === "win32") {
    return join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), "OpenPets", "runtime", "ipc.json");
  }
  const xdg = getSecureXdgRuntimeDir();
  if (xdg) {
    return join(xdg, "openpets", "ipc.json");
  }
  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "OpenPets", "runtime", "ipc.json");
}
function readDiscoveryFile(path = getDiscoveryFilePath()) {
  let raw;
  try {
    const stat = statSync(path);
    if (!stat.isFile()) throw new OpenPetsClientError("invalid_discovery", "OpenPets discovery path is not a file.");
    if (stat.size > maxIpcMessageBytes) throw new OpenPetsClientError("invalid_discovery", "OpenPets discovery file is too large.");
    raw = readFileSync(path, "utf8");
  } catch (error) {
    if (error instanceof OpenPetsClientError) throw error;
    throw new OpenPetsClientError("unavailable", `OpenPets discovery file is unavailable: ${error instanceof Error ? error.message : "unknown error"}`);
  }
  if (Buffer.byteLength(raw, "utf8") > maxIpcMessageBytes) {
    throw new OpenPetsClientError("invalid_discovery", "OpenPets discovery file is too large.");
  }
  try {
    return validateDiscovery(JSON.parse(raw));
  } catch (error) {
    if (error instanceof OpenPetsClientError) throw error;
    throw new OpenPetsClientError("invalid_discovery", "OpenPets discovery file is malformed JSON.");
  }
}
function validateDiscovery(value) {
  if (!isRecord(value)) throw new OpenPetsClientError("invalid_discovery", "Discovery must be an object.");
  if (value.protocol !== openPetsIpcProtocol) throw new OpenPetsClientError("invalid_discovery", "Discovery protocol is invalid.");
  if (value.protocolVersion !== openPetsIpcVersion) throw new OpenPetsClientError("invalid_discovery", "Discovery protocol version is invalid.");
  if (typeof value.endpoint !== "string") throw new OpenPetsClientError("invalid_discovery", "Discovery endpoint is invalid.");
  if (typeof value.token !== "string" || value.token.length < 16 || value.token.length > 256) throw new OpenPetsClientError("invalid_discovery", "Discovery token is invalid.");
  if (typeof value.appVersion !== "string") throw new OpenPetsClientError("invalid_discovery", "Discovery app version is invalid.");
  if (typeof value.pid !== "number" || !Number.isInteger(value.pid) || value.pid <= 0) throw new OpenPetsClientError("invalid_discovery", "Discovery pid is invalid.");
  if (value.platform !== "darwin" && value.platform !== "linux" && value.platform !== "win32") throw new OpenPetsClientError("invalid_discovery", "Discovery platform is invalid.");
  const endpoint = parseIpcEndpoint(value.endpoint);
  if (value.platform !== process.platform && !allowsCrossPlatformDiscovery(value.platform, endpoint)) {
    throw new OpenPetsClientError("invalid_discovery", "Discovery platform does not match this client.");
  }
  return {
    protocolVersion: openPetsIpcVersion,
    protocol: openPetsIpcProtocol,
    endpoint: value.endpoint,
    token: value.token,
    appVersion: value.appVersion,
    pid: value.pid,
    platform: value.platform
  };
}
function parseIpcEndpoint(endpoint) {
  if (endpoint.length < 1 || endpoint.length > 240) throw new OpenPetsClientError("invalid_discovery", "Discovery endpoint length is invalid.");
  if (endpoint.includes("\0")) throw new OpenPetsClientError("invalid_discovery", "Discovery endpoint contains NUL.");
  if (endpoint.startsWith("tcp://")) {
    return parseTcpEndpoint(endpoint);
  }
  if (process.platform === "win32") {
    if (!endpoint.startsWith("\\\\.\\pipe\\openpets-") || endpoint.includes("/")) {
      throw new OpenPetsClientError("invalid_discovery", "Discovery endpoint is not an OpenPets named pipe.");
    }
    return { kind: "path", path: endpoint };
  }
  if (!endpoint.startsWith("/") || endpoint.includes("://") || endpoint.includes("..")) {
    throw new OpenPetsClientError("invalid_discovery", "Discovery endpoint is not an absolute Unix socket path.");
  }
  if (!basename(endpoint).startsWith("openpets-") || !basename(endpoint).endsWith(".sock")) {
    throw new OpenPetsClientError("invalid_discovery", "Discovery endpoint filename is not an OpenPets socket.");
  }
  const parent = dirname(endpoint);
  const parentName = basename(parent);
  const isTmpRuntime = parent.startsWith("/tmp/") && parentName.startsWith("openpets-");
  const isXdgRuntime = parentName === "openpets";
  if (!isTmpRuntime && !isXdgRuntime) {
    throw new OpenPetsClientError("invalid_discovery", "Discovery endpoint is outside an expected OpenPets runtime directory.");
  }
  return { kind: "path", path: endpoint };
}
function parseTcpEndpoint(endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new OpenPetsClientError("invalid_discovery", "Discovery TCP endpoint is invalid.");
  }
  if (url.protocol !== "tcp:" || url.username || url.password || url.pathname !== "" && url.pathname !== "/" || url.search || url.hash) {
    throw new OpenPetsClientError("invalid_discovery", "Discovery TCP endpoint must be tcp://<host>:<port> with no credentials, path, query, or fragment.");
  }
  const host = url.hostname;
  if (host === "0.0.0.0") {
    throw new OpenPetsClientError("invalid_discovery", "Discovery TCP endpoint cannot use 0.0.0.0 as target host.");
  }
  if (!isValidIpv4(host)) {
    throw new OpenPetsClientError("invalid_discovery", "Discovery TCP endpoint host must be a valid IPv4 address.");
  }
  if (/[a-zA-Z]/.test(host)) {
    throw new OpenPetsClientError("invalid_discovery", "Discovery TCP endpoint host must be an IPv4 address, not a hostname.");
  }
  if (!isPrivateOrLocalIpv4(host)) {
    throw new OpenPetsClientError("invalid_discovery", `Discovery TCP endpoint host ${host} is not a private/local IPv4 address. Only loopback (127.0.0.1), private (10.x.x.x, 172.16-31.x.x, 192.168.x.x), or link-local (169.254.x.x) addresses are allowed.`);
  }
  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || String(port) !== url.port) {
    throw new OpenPetsClientError("invalid_discovery", "Discovery TCP endpoint port is invalid.");
  }
  return { kind: "tcp", host, port };
}
function isValidIpv4(host) {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = Number(part);
    return String(num) === part && num >= 0 && num <= 255;
  });
}
function isPrivateOrLocalIpv4(host) {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4) return false;
  if (parts[0] === 127) return true;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  return false;
}
function allowsCrossPlatformDiscovery(platform, endpoint) {
  if (endpoint.kind !== "tcp" || platform !== "win32" || process.platform !== "linux") {
    return false;
  }
  return isPrivateOrLocalIpv4(endpoint.host);
}
function getSecureXdgRuntimeDir() {
  const dir = process.env.XDG_RUNTIME_DIR;
  if (!dir || !existsSync(dir)) return null;
  try {
    const stat = lstatSync(dir);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return null;
    if (typeof process.getuid === "function" && stat.uid !== process.getuid()) return null;
    if ((stat.mode & 511) !== 448) return null;
    return dir;
  } catch {
    return null;
  }
}

// ../../packages/client/src/remote-protocol.ts
import { isIPv4 } from "node:net";
var openPetsRemoteProtocol = "openpets-remote";
var openPetsRemoteVersion = 1;
var maxRemoteMessageBytes = 4 * 1024;
var remoteConnectTimeoutMs = 2e3;
var remoteResponseTimeoutMs = 3e3;
function parseRemoteEndpoint(endpoint) {
  if (typeof endpoint !== "string" || endpoint.length < 1 || endpoint.length > 120 || !endpoint.startsWith("tcp://")) {
    throw new OpenPetsClientError("invalid_remote_endpoint", "Remote endpoint is invalid.");
  }
  const match = /^tcp:\/\/([^:\/?#]+):(\d+)\/?$/.exec(endpoint);
  if (!match) {
    throw new OpenPetsClientError("invalid_remote_endpoint", "Remote endpoint is invalid.");
  }
  const host = match[1];
  if (!isCanonicalIpv4(host) || !isPrivateIpv4(host)) {
    throw new OpenPetsClientError("invalid_remote_endpoint", "Remote endpoint is invalid.");
  }
  const port = Number(match[2]);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || String(port) !== match[2]) {
    throw new OpenPetsClientError("invalid_remote_endpoint", "Remote endpoint is invalid.");
  }
  return { kind: "tcp", host, port };
}
function validateRemoteToken(value) {
  if (typeof value !== "string" || value.length < 43 || value.length > 256 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new OpenPetsClientError("invalid_remote_token", "Remote token is invalid.");
  }
  return value;
}
function validateRemoteClientId(value) {
  if (value === void 0) return void 0;
  if (typeof value !== "string" || value.length < 1 || value.length > 120 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new OpenPetsClientError("invalid_remote_client", "Remote client id is invalid.");
  }
  return value;
}
function validateRemoteMessage(value) {
  if (typeof value !== "string") throw new OpenPetsClientError("invalid_remote_message", "Remote message is invalid.");
  const message = value.trim();
  if (message.length < 1 || message.length > 140 || Buffer.byteLength(message, "utf8") > 560 || /[\0\r\n]/.test(message) || /```|<script|function\s+\w+|=>|\b(class|import|export|const|let|var)\b/.test(message) || /https?:\/\/|www\.|\/[\w.-]+\/[\w./-]+|[A-Za-z]:\\/.test(message) || /(api[_-]?key|secret|token|password|passwd|BEGIN [A-Z ]+PRIVATE KEY)/i.test(message)) {
    throw new OpenPetsClientError("invalid_remote_message", "Remote message is invalid.");
  }
  return message;
}
function validateRemoteReaction(value) {
  if (!allowedReactions.includes(value)) {
    throw new OpenPetsClientError("invalid_reaction", "Invalid OpenPets reaction.");
  }
  return value;
}
function parseRemoteResponse(value) {
  if (!isRecord2(value) || typeof value.id !== "string" && value.id !== null) {
    throw new OpenPetsClientError("invalid_remote_response", "Remote response is invalid.");
  }
  if (value.ok === true) return { id: value.id, ok: true, result: value.result };
  if (value.ok === false && isRecord2(value.error) && typeof value.error.code === "string" && typeof value.error.message === "string") {
    return { id: value.id, ok: false, error: { code: value.error.code, message: value.error.message } };
  }
  throw new OpenPetsClientError("invalid_remote_response", "Remote response is invalid.");
}
function isCanonicalIpv4(value) {
  if (!isIPv4(value)) return false;
  return value.split(".").every((part) => String(Number(part)) === part);
}
function isPrivateIpv4(value) {
  const parts = value.split(".").map(Number);
  if (parts[0] === 127 || parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  return parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127;
}
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ../../packages/client/src/index.ts
var SESSION_NONCE = randomUUID();
function createOpenPetsClient(options = {}) {
  const remote = resolveRemoteOptions(options);
  const unsupportedRemote = () => Promise.reject(new OpenPetsClientError("remote_method_not_supported", "This operation is not available in remote mode."));
  return {
    transport: remote ? "remote" : "local",
    hello: () => remote ? sendRemoteRequest(remote.endpoint, remote.token, remote.clientId, "status", {}, options) : sendDiscoveredRequest("hello", {}, options),
    status: async (statusOptions) => {
      try {
        if (remote) return await sendRemoteRequest(remote.endpoint, remote.token, remote.clientId, "status", {}, options);
        return await sendDiscoveredRequest("status", { leaseId: statusOptions?.leaseId }, options);
      } catch (error) {
        return {
          ok: false,
          appRunning: false,
          unavailableReason: remote ? "Remote OpenPets is unavailable." : error instanceof Error ? error.message : "OpenPets is unavailable."
        };
      }
    },
    listPets: async () => remote ? unsupportedRemote() : parsePetListResult(await sendDiscoveredRequest("pets.list", {}, options)),
    installPet: async (petId) => remote ? unsupportedRemote() : parsePetInstallResult(await sendDiscoveredRequest("pets.install", { petId: validatePetId(petId) }, { ...options, responseTimeoutMs: options.responseTimeoutMs ?? 6e4 })),
    installLocalPet: async (path, installOptions) => {
      if (remote) return unsupportedRemote();
      if (typeof path !== "string" || path.trim().length === 0) {
        throw new OpenPetsClientError("invalid_params", "Path must be a non-empty string.");
      }
      const trimmedPath = path.trim();
      if (!isLocalInstallAbsolutePath(trimmedPath)) {
        throw new OpenPetsClientError("invalid_params", "Path must be absolute.");
      }
      if (!installOptions || installOptions.kind !== "zip" && installOptions.kind !== "folder") {
        throw new OpenPetsClientError("invalid_params", "Local install kind must be zip or folder.");
      }
      return parsePetInstallResult(await sendDiscoveredRequest("pets.install-local", { path: trimmedPath, kind: installOptions.kind }, { ...options, responseTimeoutMs: options.responseTimeoutMs ?? 6e4 }));
    },
    acquireLease: (leaseOptions) => remote ? unsupportedRemote() : sendDiscoveredRequest("lease.acquire", { requestedPetId: leaseOptions?.requestedPetId, clientPid: process.pid, sessionNonce: SESSION_NONCE }, options),
    heartbeatLease: (leaseId) => remote ? unsupportedRemote() : sendDiscoveredRequest("lease.heartbeat", { leaseId }, options),
    releaseLease: (leaseId) => remote ? unsupportedRemote() : sendDiscoveredRequest("lease.release", { leaseId }, options),
    react: (reaction, reactOptions) => remote ? sendRemoteRequest(remote.endpoint, remote.token, remote.clientId, "pet.react", { reaction: validateRemoteReaction(reaction) }, options) : sendDiscoveredRequest("pet.react", { reaction: validateReaction(reaction), leaseId: reactOptions?.leaseId }, options),
    say: (message, sayOptions) => remote ? sendRemoteRequest(remote.endpoint, remote.token, remote.clientId, "pet.say", { message: validateRemoteMessage(message), ...sayOptions?.reaction === void 0 ? {} : { reaction: validateRemoteReaction(sayOptions.reaction) } }, options) : sendDiscoveredRequest("pet.say", { message, reaction: sayOptions?.reaction, leaseId: sayOptions?.leaseId }, options),
    showMedia: (path, mediaOptions) => {
      if (remote) return unsupportedRemote();
      if (typeof path !== "string" || path.trim().length === 0) {
        throw new OpenPetsClientError("invalid_params", "Media path must be a non-empty string.");
      }
      const trimmedPath = path.trim();
      if (!isLocalInstallAbsolutePath(trimmedPath)) {
        throw new OpenPetsClientError("invalid_params", "Media path must be absolute.");
      }
      return sendDiscoveredRequest("pet.showMedia", { path: trimmedPath, message: mediaOptions?.message, reaction: mediaOptions?.reaction === void 0 ? void 0 : validateReaction(mediaOptions.reaction), durationMs: mediaOptions?.durationMs, clickUrl: mediaOptions?.clickUrl, leaseId: mediaOptions?.leaseId }, options);
    }
  };
}
function parsePetInstallResult(value) {
  if (!isRecord3(value) || value.ok !== true || typeof value.petId !== "string" || typeof value.displayName !== "string" || value.installed !== true) {
    throw new OpenPetsClientError("invalid_response", "OpenPets pet install response is invalid.");
  }
  return { ok: true, petId: value.petId, displayName: value.displayName, installed: true };
}
function validatePetId(value) {
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(value) || value === "builtin") {
    throw new OpenPetsClientError("invalid_pet_id", "Invalid OpenPets pet id.");
  }
  return value;
}
function isLocalInstallAbsolutePath(value) {
  return posix.isAbsolute(value) || win32.isAbsolute(value);
}
function parsePetListResult(value) {
  if (!isRecord3(value) || value.ok !== true || !Array.isArray(value.pets) || typeof value.defaultPetId !== "string") {
    throw new OpenPetsClientError("invalid_response", "OpenPets pet list response is invalid.");
  }
  return {
    ok: true,
    defaultPetId: value.defaultPetId,
    pets: value.pets.map(parsePetListItem)
  };
}
function parsePetListItem(value) {
  if (!isRecord3(value) || typeof value.id !== "string" || typeof value.displayName !== "string" || typeof value.builtIn !== "boolean" || typeof value.broken !== "boolean") {
    throw new OpenPetsClientError("invalid_response", "OpenPets pet list item is invalid.");
  }
  return { id: value.id, displayName: value.displayName, builtIn: value.builtIn, broken: value.broken };
}
function isRecord3(value) {
  return typeof value === "object" && value !== null;
}
async function sendDiscoveredRequest(method, params, options) {
  const discovery = readDiscoveryFile(options.discoveryPath);
  return sendRequest(discovery, method, params, options);
}
function resolveRemoteOptions(options) {
  if (options.remote === false) return null;
  const explicit = options.remote;
  const hasFlatRemote = options.remoteEndpoint !== void 0 || options.remoteToken !== void 0 || options.remoteClientId !== void 0;
  const hasEnvironmentRemote = process.env.OPENPETS_REMOTE_ENDPOINT !== void 0 || process.env.OPENPETS_REMOTE_TOKEN !== void 0 || process.env.OPENPETS_REMOTE_CLIENT_ID !== void 0;
  if (!explicit && !hasFlatRemote && !hasEnvironmentRemote) return null;
  const endpoint = explicit?.endpoint ?? options.remoteEndpoint ?? process.env.OPENPETS_REMOTE_ENDPOINT;
  const token = explicit?.token ?? options.remoteToken ?? process.env.OPENPETS_REMOTE_TOKEN;
  const clientId = explicit?.clientId ?? options.remoteClientId ?? process.env.OPENPETS_REMOTE_CLIENT_ID;
  if (endpoint === void 0 || token === void 0) {
    throw new OpenPetsClientError("invalid_remote_configuration", "Remote configuration is incomplete.");
  }
  const validatedClientId = validateRemoteClientId(clientId);
  return {
    endpoint: parseRemoteEndpoint(endpoint),
    token: validateRemoteToken(token),
    ...validatedClientId === void 0 ? {} : { clientId: validatedClientId }
  };
}
function sendRemoteRequest(endpoint, token, clientId, method, params, options = {}) {
  const parsedEndpoint = typeof endpoint === "string" ? parseRemoteEndpoint(endpoint) : parseRemoteEndpoint(`tcp://${endpoint.host}:${endpoint.port}`);
  const validToken = validateRemoteToken(token);
  const validClientId = validateRemoteClientId(clientId);
  const request = {
    id: randomUUID(),
    protocol: openPetsRemoteProtocol,
    version: openPetsRemoteVersion,
    ...validClientId === void 0 ? {} : { clientId: validClientId },
    token: validToken,
    method,
    params
  };
  const requestLine = `${JSON.stringify(request)}
`;
  if (Buffer.byteLength(requestLine, "utf8") > maxRemoteMessageBytes) {
    return Promise.reject(new OpenPetsClientError("request_too_large", "Remote request is too large."));
  }
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: parsedEndpoint.host, port: parsedEndpoint.port });
    let buffer = "";
    let settled = false;
    let connectTimer = setTimeout(() => finish(new OpenPetsClientError("connect_timeout", "Timed out connecting to remote OpenPets.")), options.connectTimeoutMs ?? remoteConnectTimeoutMs);
    let responseTimer = null;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      if (connectTimer) {
        clearTimeout(connectTimer);
        connectTimer = null;
      }
      if (responseTimer) {
        clearTimeout(responseTimer);
        responseTimer = null;
      }
      socket.destroy();
      if (error) reject(error);
      else resolve(result);
    };
    socket.setEncoding("utf8");
    socket.once("connect", () => {
      if (connectTimer) {
        clearTimeout(connectTimer);
        connectTimer = null;
      }
      responseTimer = setTimeout(() => finish(new OpenPetsClientError("response_timeout", "Timed out waiting for remote OpenPets response.")), options.responseTimeoutMs ?? remoteResponseTimeoutMs);
      socket.write(requestLine);
    });
    socket.on("data", (chunk) => {
      buffer += chunk;
      if (Buffer.byteLength(buffer, "utf8") > maxRemoteMessageBytes) {
        finish(new OpenPetsClientError("response_too_large", "Remote response is too large."));
        return;
      }
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      try {
        const parsed = parseRemoteResponse(JSON.parse(buffer.slice(0, newline)));
        if (parsed.id !== request.id) throw new OpenPetsClientError("invalid_remote_response", "Remote response is invalid.");
        if (parsed.ok) finish(void 0, parsed.result);
        else finish(new OpenPetsClientError(parsed.error?.code ?? "remote_request_failed", "Remote request failed."));
      } catch (error) {
        finish(error);
      }
    });
    socket.once("error", () => finish(new OpenPetsClientError("unavailable", "Remote OpenPets is unavailable.")));
    socket.once("end", () => {
      if (!settled) finish(new OpenPetsClientError("connection_closed", "Remote OpenPets closed the connection."));
    });
  });
}
function sendRequest(discovery, method, params, options = {}) {
  const request = {
    id: randomUUID(),
    version: openPetsIpcVersion,
    token: discovery.token,
    method,
    params
  };
  const requestLine = `${JSON.stringify(request)}
`;
  if (Buffer.byteLength(requestLine, "utf8") > maxIpcMessageBytes) {
    return Promise.reject(new OpenPetsClientError("request_too_large", "OpenPets IPC request is too large."));
  }
  return new Promise((resolve, reject) => {
    const endpoint = parseIpcEndpoint(discovery.endpoint);
    const socket = endpoint.kind === "tcp" ? net.createConnection({ host: endpoint.host, port: endpoint.port }) : net.createConnection(endpoint.path);
    let buffer = "";
    let settled = false;
    const connectTimer = setTimeout(() => finish(new OpenPetsClientError("connect_timeout", "Timed out connecting to OpenPets.")), options.connectTimeoutMs ?? connectTimeoutMs);
    const responseTimer = setTimeout(() => finish(new OpenPetsClientError("response_timeout", "Timed out waiting for OpenPets response.")), options.responseTimeoutMs ?? responseTimeoutMs);
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(connectTimer);
      clearTimeout(responseTimer);
      socket.destroy();
      if (error) reject(error);
      else resolve(result);
    };
    socket.setEncoding("utf8");
    socket.once("connect", () => {
      clearTimeout(connectTimer);
      socket.write(requestLine);
    });
    socket.on("data", (chunk) => {
      buffer += chunk;
      if (Buffer.byteLength(buffer, "utf8") > maxIpcMessageBytes) {
        finish(new OpenPetsClientError("response_too_large", "OpenPets IPC response is too large."));
        return;
      }
      const newline = buffer.indexOf("\n");
      if (newline === -1) return;
      try {
        const parsed = parseIpcResponse(JSON.parse(buffer.slice(0, newline)));
        if (parsed.ok) finish(void 0, parsed.result);
        else finish(new OpenPetsClientError(parsed.error.code, parsed.error.message));
      } catch (error) {
        finish(error);
      }
    });
    socket.once("error", (error) => finish(new OpenPetsClientError("unavailable", error.message)));
    socket.once("end", () => {
      if (!settled) finish(new OpenPetsClientError("connection_closed", "OpenPets closed the IPC connection before responding."));
    });
  });
}

// ../../packages/agent-events/src/index.ts
var hookSpeechPools = {
  thinking: ["Thinking it through", "Let me check", "On it", "Working it out"],
  success: ["Done", "That worked", "All set", "Nice, finished"],
  error: ["Something failed", "Needs another look", "Hit a snag", "Not quite there"],
  permission: ["Approval needed"]
};
function pickHookSpeech(category, random = Math.random) {
  const pool = hookSpeechPools[category];
  return pool[Math.max(0, Math.min(pool.length - 1, Math.floor(random() * pool.length)))] ?? pool[0] ?? "Working";
}
function validateHookSpeech(message) {
  if (message.length < 1 || message.length > 140) throw new Error("Hook speech length is invalid.");
  if (/\r|\n/.test(message)) throw new Error("Hook speech must be single line.");
  if (/```|\b(function|const|let|var|class|import|export)\b|[{};]/.test(message)) throw new Error("Hook speech looks code-like.");
  if (/https?:\/\/|www\./i.test(message)) throw new Error("Hook speech must not contain URLs.");
  if (/(^|\s)(?:~|\.{1,2}|[A-Za-z]:)?[\\/][^\s]+/.test(message)) throw new Error("Hook speech must not contain paths.");
  if (/\b(api[_-]?key|secret|password|token)\s*[:=]/i.test(message)) throw new Error("Hook speech must not contain secrets.");
  return message;
}

// ../../packages/dsh/src/runtime.ts
var automaticTimeoutMs = 500;
var errorSuccessSuppressionMs = 5e3;
var minSpeechIntervalMs = 1200;
function sanitizeStatusLine(text) {
  if (!text || typeof text !== "string") return null;
  let s = text.replace(/[\r\n]+/g, " ").trim();
  s = s.replace(/https?:\/\/\S+/gi, "");
  s = s.replace(/[`{};]/g, "");
  s = s.replace(/(?:^|\s)(?:~|\.{1,2}|[A-Za-z]:)?[\\/]\S+\/([^\s/]+)/g, " $1");
  if (s.length > 100) s = s.slice(0, 97) + "...";
  s = s.trim();
  if (s.length === 0) return null;
  try {
    return validateHookSpeech(s);
  } catch {
    return null;
  }
}
function classifyDshEvent(eventName, event) {
  if (eventName === "agent/status") {
    const status = typeof event === "string" ? event : getStatusCategory(event);
    if (status === "running") return { reaction: "thinking", speechCategory: "thinking" };
    if (status === "idle") return { reaction: "success", speechCategory: "success" };
    return void 0;
  }
  if (eventName === "agent/error") return { reaction: "error", speechCategory: "error" };
  if (eventName === "approval/request") return { reaction: "waiting", speechCategory: "permission" };
  return void 0;
}
function createOpenPetsDshRuntime(options = {}) {
  const clientFactory = options.clientFactory ?? createOpenPetsDshClient;
  const schedule = options.schedule ?? defaultSchedule;
  const minSpeech = options.minSpeechIntervalMs ?? minSpeechIntervalMs;
  const enableStatusLineStream = options.enableStatusLineStream !== false;
  const enableToolEvents = options.enableToolEvents !== false;
  const enableApprovalEvents = options.enableApprovalEvents !== false;
  let client;
  let recentErrorAt = Number.NEGATIVE_INFINITY;
  let lastCustomSpeechAt = Number.NEGATIVE_INFINITY;
  let streamBuffer = "";
  let statusExtractedForTurn = false;
  const getClient = () => {
    client ??= clientFactory();
    return client;
  };
  const dispatch = (decision) => {
    if (!decision) return;
    const now = options.now?.() ?? Date.now();
    if (decision.reaction === "error") {
      recentErrorAt = now;
    } else if (decision.reaction === "success" && now - recentErrorAt < errorSuccessSuppressionMs) {
      return;
    }
    const work = async () => {
      try {
        const speech = validateHookSpeech(pickHookSpeech(decision.speechCategory, options.random));
        await getClient().say(speech, { reaction: decision.reaction });
      } catch {
      }
    };
    try {
      const scheduled = schedule(work);
      if (isPromiseLike(scheduled)) void scheduled.catch(() => void 0);
    } catch {
    }
  };
  const dispatchCustom = (message, reaction) => {
    const now = options.now?.() ?? Date.now();
    if (now - lastCustomSpeechAt < minSpeech) return;
    lastCustomSpeechAt = now;
    const work = async () => {
      try {
        const validated = validateHookSpeech(message);
        await getClient().say(validated, { reaction });
      } catch {
      }
    };
    try {
      const scheduled = schedule(work);
      if (isPromiseLike(scheduled)) void scheduled.catch(() => void 0);
    } catch {
    }
  };
  return {
    handleStatus(event) {
      const status = typeof event === "string" ? event : getStatusCategory(event);
      if (status === "running") {
        streamBuffer = "";
        statusExtractedForTurn = false;
      }
      dispatch(classifyDshEvent("agent/status", event));
    },
    handleEvent(eventName, event) {
      dispatch(classifyDshEvent(eventName, event));
    },
    handleApproval() {
      if (!enableApprovalEvents) return;
      dispatch(classifyDshEvent("approval/request"));
    },
    handleStream(payload) {
      if (!enableStatusLineStream) return;
      if (!payload || typeof payload !== "object") return;
      const frame = payload.frame;
      if (!frame) return;
      if (frame.type === "start") {
        streamBuffer = "";
        statusExtractedForTurn = false;
        return;
      }
      if (frame.type === "end") {
        streamBuffer = "";
        return;
      }
      if (frame.type === "chunk" && frame.chunk?.type === "text-delta" && typeof frame.chunk.text === "string") {
        if (statusExtractedForTurn) return;
        streamBuffer += frame.chunk.text;
        const arrowIndex = streamBuffer.search(/[⏵▶]/);
        if (arrowIndex !== -1) {
          const newlineIndex = streamBuffer.indexOf("\n", arrowIndex);
          if (newlineIndex !== -1) {
            statusExtractedForTurn = true;
            const rawStatus = streamBuffer.slice(arrowIndex + 1, newlineIndex).trim();
            const clean = sanitizeStatusLine(rawStatus);
            if (clean) {
              dispatchCustom(clean, "working");
            }
          }
        }
      }
    },
    handleToolResult(exec) {
      if (!enableToolEvents) return;
      if (!exec || typeof exec !== "object") return;
      const e = exec;
      if (!e.name) return;
      const args = e.arguments ?? e.params;
      if (e.name === "bash" && args?.description) {
        const clean = sanitizeStatusLine(String(args.description));
        if (clean) dispatchCustom(clean, "running");
      } else if (e.name === "edit" || e.name === "write") {
        const filePath = args?.file_path ? String(args.file_path).split(/[\\/]/).pop() : "";
        const action = e.name === "edit" ? "Ch\u1EC9nh s\u1EEDa" : "Ghi file";
        const clean = sanitizeStatusLine(filePath ? `${action} ${filePath}` : action);
        if (clean) dispatchCustom(clean, "editing");
      } else if (e.name === "read") {
        const filePath = args?.file_path ? String(args.file_path).split(/[\\/]/).pop() : "";
        const clean = sanitizeStatusLine(filePath ? `\u0110\u1ECDc ${filePath}` : "\u0110ang \u0111\u1ECDc file");
        if (clean) dispatchCustom(clean, "working");
      }
    }
  };
}
function createOpenPetsDshClient() {
  return createOpenPetsClient({
    remote: false,
    connectTimeoutMs: automaticTimeoutMs,
    responseTimeoutMs: automaticTimeoutMs
  });
}
function registerDshListeners(cordis, options = {}) {
  const runtime = createOpenPetsDshRuntime(options);
  if (options.enabled === false) return runtime;
  const on = cordis.on;
  on("agent/status", (event) => runtime.handleStatus(event));
  on("agent/error", () => runtime.handleEvent("agent/error"));
  on("approval/request", (_request, next) => {
    runtime.handleApproval();
    return typeof next === "function" ? next() : void 0;
  });
  on("agent/assistant-stream", (payload) => runtime.handleStream(payload));
  on("tools/result", (exec, result) => runtime.handleToolResult(exec, result));
  return runtime;
}
function defaultSchedule(work) {
  void Promise.resolve().then(work).catch(() => void 0);
}
function isPromiseLike(value) {
  return typeof value === "object" && value !== null && typeof value.then === "function";
}
function getStatusCategory(event) {
  if (typeof event !== "object" || event === null) return void 0;
  return event.status;
}
export {
  classifyDshEvent,
  createOpenPetsClient,
  createOpenPetsDshRuntime,
  registerDshListeners
};
