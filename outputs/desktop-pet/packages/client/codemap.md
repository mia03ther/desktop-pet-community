# packages/client/

Core IPC client library for OpenPets desktop app communication.

## Responsibility

Provides the foundational client library for all OpenPets integrations. Handles discovery file reading, TCP socket connections (including WSL cross-platform), request/response protocol, and high-level pet operations (status, list, install, lease, react, say).

## Design/Patterns

**Protocol Layer** (`protocol.ts`):
- Defines IPC protocol version (v1), message limits (16KB), timeouts (2s connect, 3s response)
- Request/response types with discriminated union (`ok: true/false`)
- Reaction validation against allowed enum values
- Custom `OpenPetsClientError` with error codes

**Discovery Layer** (`discovery.ts`):
- Cross-platform discovery file path resolution (macOS, Windows, Linux/XDG)
- File validation (size, permissions, symlink checks)
- Endpoint validation: Unix sockets, Windows named pipes, TCP (IPv4)
- TCP/WSL cross-platform support: Windows desktop → WSL client via private IPs
- Security: XDG_RUNTIME_DIR permission checks (0o700, ownership)

**TCP Endpoint Security:**
- IPv4 only (no hostnames)
- Private/local addresses only:
  - Loopback: 127.0.0.0/8
  - Private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  - Link-local: 169.254.0.0/16
- Rejects 0.0.0.0, public IPs, hostnames
- Enables WSL clients to connect to Windows desktop app

**Client Layer** (`index.ts`):
- Factory pattern: `createOpenPetsClient(options)` returns `OpenPetsClient` interface
- Methods: `hello()`, `status()`, `listPets()`, `installPet()`, `acquireLease()`, `heartbeatLease()`, `releaseLease()`, `react()`, `say()`
- Lease-aware operations for multi-pet targeting
- Result parsers with validation

**本机工作摘要**（`agent-activity.ts`）：
- `createAgentActivityEvent()` 将正式会话、轮次、工具调用和成功编辑路径转换为有界 SHA-256 摘要；不读取文件、账户或聊天。
- `reportActivity()` 复用 `pet.react` 的 `externalAi` 通道，只支持本机默认桌宠，远程模式返回不支持；具体平台需自己提供正式成功事件，不能从提示词推断完成。
- 发送前通过 `sanitizeAgentActivityEvent()` 运行时校验平台、事件、摘要、工具名、时间与数量，重建白名单对象和文件数组；不能依赖 TypeScript 类型或把调用者额外原文字段转发给桌面。
- 旧客户端替身可不实现可选方法，运行实现始终提供它；协议契约覆盖摘要、文件去重和失败不计文件。

**Socket Management**:
- Node.js `net.createConnection()` for TCP/Unix sockets/Windows named pipes
- Dual timeout handling (connect + response)
- Line-delimited JSON protocol (`\n` separator)
- Buffer size enforcement (16KB max)

## Flow

```
Client Method Call
    ↓
readDiscoveryFile() → Parse ipc.json (token, endpoint)
    ↓
sendRequest() → Build request (id, version, token, method, params)
    ↓
net.createConnection(endpoint) → Write JSON + newline
    ↓
Wait for response (buffer until newline)
    ↓
parseIpcResponse() → Validate shape, return result or throw
```

TCP/WSL Cross-Platform Flow:
```
WSL Client → readDiscoveryFile()
    ↓
Endpoint: tcp://192.168.x.x:port (Windows host IP)
    ↓
validateDiscovery() → allowsCrossPlatformDiscovery()
    ↓
net.createConnection({ host, port }) → Windows desktop app
```

## Integration Points

**Consumers** (all depend on this package):
- `@open-pets/cli` - CLI commands
- `@open-pets/mcp` - MCP tool implementations
- `@open-pets/claude` - Hook execution
- `@open-pets/opencode` - Plugin runtime
- `@open-pets/install-pet` - Direct installation fallback

**Desktop App**: Communicates with OpenPets desktop app via:
- Unix domain socket (macOS/Linux)
- Windows named pipe (Windows)
- TCP socket (WSL cross-platform)

**Exports**:
- `createOpenPetsClient()` - Main factory
- `sendRequest()` - Low-level request function
- `readDiscoveryFile()`, `getDiscoveryFilePath()` - Discovery utilities
- `parseIpcEndpoint()`, `validateEndpoint()` - Endpoint handling
- `OpenPetsClientError`, error codes, types

**Contracts**:
- `contracts/client-protocol.contract.ts` - Runtime protocol validation tests
