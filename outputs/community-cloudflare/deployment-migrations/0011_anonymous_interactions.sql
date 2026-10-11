-- 同一作者横跨桌宠和插件只计一次关注；不保存原始 IP，不建立匿名投稿账号。
CREATE TABLE IF NOT EXISTS community_creator_follows (
  author TEXT NOT NULL,
  actor_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (author, actor_hash)
) STRICT;

-- 写操作每个匿名来源每小时最多 60 次；只存有期限的加盐摘要。
CREATE TABLE IF NOT EXISTS community_interaction_limits (
  key_hash TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS community_interaction_limits_expiry ON community_interaction_limits(expires_at);
