# packages/client/src/

Core IPC client implementation for OpenPets desktop app communication.

## Files

### index.ts

Main client implementation (193 lines). `createOpenPetsClient()` factory, all client methods, result parsers, and `sendRequest()` for low-level IPC.

**Client Methods:**
- `hello()` - Protocol handshake
- `status(options?)` - App connectivity check with graceful error handling
- `listPets()` - Fetch installed pets with metadata
- `installPet(petId)` - Install pet with 60s timeout
- `acquireLease(options?)` - Get lease for targeted pet operations
- `heartbeatLease(leaseId)` - Keep lease alive
- `releaseLease(leaseId)` - Release acquired lease
- `react(reaction, options?)` - Send reaction (lease-aware)
- `reportActivity(event)` - 本机默认桌宠工作摘要；发送前运行时校验并重建白名单，远程模式拒绝
- `say(message, options?)` - Display message (lease-aware, optional reaction)

**Result Parsers:**
- `parsePetListResult()` - Validates pet list response
- `parsePetInstallResult()` - Validates install response
- `validatePetId()` - Pet ID format validation (regex: `^[a-z0-9][a-z0-9_-]{0,63}$`)

**Socket Management:**
- Node.js `net.createConnection()` for TCP/Unix sockets/Windows named pipes
- Dual timeout handling (connect + response)
- Line-delimited JSON protocol (`\n` separator)
- Buffer size enforcement (16KB max)

### agent-activity.ts

本机外部 AI 工作摘要的纯边界。`createAgentActivityEvent()` 摘要化正式会话、回合、调用与成功编辑文件标识；不读取文件或聊天。`sanitizeAgentActivityEvent()` 在客户端发送前校验平台、事件、64 位 SHA-256 标识、工具名、时间窗和文件数量，并构造白名单对象、复制文件数组。额外原文、路径及自定义序列化函数均被丢弃；无效已知字段返回失败，不进入发现文件或套接字流程。

### protocol.ts

IPC protocol constants, request/response types, `parseIpcResponse()`, `validateReaction()`, `OpenPetsClientError` class.

**Protocol Constants:**
- Version: v1
- Message limit: 16KB
- Timeouts: 2s connect, 3s response

**Error Codes:**
- `unavailable` - Desktop app not reachable
- `invalid_discovery` - Discovery file malformed
- `invalid_token` - Authentication failed
- `invalid_response` - Response parsing failed
- `connect_timeout`, `response_timeout` - Timeout errors
- `request_too_large`, `response_too_large` - Size limits

**Validation:**
- `validateReaction()` - Ensures reaction is in allowed enum
- `parseIpcResponse()` - Discriminated union parsing (ok: true/false)

### discovery.ts

Discovery file handling (226 lines). `getDiscoveryFilePath()`, `readDiscoveryFile()`, `validateDiscovery()`, `validateEndpoint()`, platform-specific path logic, XDG security checks.

**Platform Paths:**
- macOS: `~/Library/Application Support/OpenPets/runtime/ipc.json`
- Windows: `%APPDATA%/OpenPets/runtime/ipc.json`
- Linux: `$XDG_RUNTIME_DIR/openpets/ipc.json` (preferred) or `~/.config/OpenPets/runtime/ipc.json`

**Endpoint Types:**
- Unix sockets: `/tmp/openpets-*/openpets-*.sock` or `$XDG_RUNTIME_DIR/openpets/*.sock`
- Windows named pipes: `\\.\pipe\openpets-*`
- TCP: `tcp://<host>:<port>` (IPv4 only, private/local addresses)

**TCP/WSL Support:**
- Cross-platform discovery for Windows desktop → WSL client
- Validates private/local IPv4: loopback (127.x), private (10.x, 172.16-31.x, 192.168.x), link-local (169.254.x)
- Rejects hostnames, 0.0.0.0, public IPs

**Security:**
- XDG_RUNTIME_DIR permission checks (0o700, ownership)
- File size limits (16KB)
- Symlink rejection
- Platform mismatch detection

### smoke.ts

Manual testing CLI for client operations (hello, status, react, say, invalid-token).

## Related Contracts

### ../contracts/client-protocol.contract.ts

Contract validation (moved from src/check-client-protocol.ts). Runtime assertions for protocol compliance.

**Test Coverage:**
- Discovery validation (protocol, version, endpoint, token)
- Endpoint parsing (Unix socket, Windows pipe, TCP)
- TCP private IP validation (loopback, private ranges, link-local)
- Cross-platform discovery (Windows desktop → WSL)
- Public IP rejection
- Response parsing (ok/error cases)
- Pet list/install result parsing
- 本机活动的真实 TCP 发送字节：只保留白名单摘要，拒绝原文会话标识、无效类型和超限输入，不发送额外原文或可变数组内容
- 远程模式拒绝工作摘要
