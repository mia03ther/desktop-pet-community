-- 本站账号独立于客户端 oai 身份头；密码和会话均只持久保存摘要。
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_key TEXT NOT NULL UNIQUE,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS auth_sessions_user ON auth_sessions(user_id, created_at);

CREATE TABLE IF NOT EXISTS auth_attempts (
  key_hash TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  resets_at INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS auth_attempts_expiry ON auth_attempts(resets_at);
