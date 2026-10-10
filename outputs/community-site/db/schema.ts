import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const plugins = sqliteTable('community_plugins', {
  id: text('id').primaryKey(),
  owner: text('owner').notNull(),
  fingerprint: text('fingerprint').notNull(),
  workId: text('work_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  author: text('author').notNull(),
  license: text('license').notNull(),
  source: text('source').notNull(),
  workflow: text('workflow').notNull(),
  compatibility: text('compatibility').notNull(),
  packageKey: text('package_key').notNull(),
  coverKey: text('cover_key'),
  coverMime: text('cover_mime'),
  size: integer('size').notNull(),
  createdAt: text('created_at').notNull(),
}, t => [uniqueIndex('community_plugins_owner_fingerprint').on(t.owner, t.fingerprint), index('community_plugins_created_at').on(t.createdAt)]);

export const pets = sqliteTable('community_pets', {
  id: text('id').primaryKey(), owner: text('owner').notNull(), fingerprint: text('fingerprint').notNull(),
  workId: text('work_id').notNull(), title: text('title').notNull(), description: text('description').notNull(),
  author: text('author').notNull(), license: text('license').notNull(), source: text('source').notNull(),
  workflow: text('workflow').notNull(), compatibility: text('compatibility').notNull(),
  packageKey: text('package_key').notNull(), coverKey: text('cover_key'), coverMime: text('cover_mime'),
  presentation: text('presentation').notNull(), size: integer('size').notNull(), createdAt: text('created_at').notNull(),
}, t => [uniqueIndex('community_pets_owner_fingerprint').on(t.owner, t.fingerprint), index('community_pets_created_at').on(t.createdAt)]);

export const requests = sqliteTable('community_requests', {
  id: text('id').primaryKey(), owner: text('owner').notNull(), fingerprint: text('fingerprint').notNull(),
  title: text('title').notNull(), description: text('description').notNull(), category: text('category').notNull(),
  version: integer('version').notNull(), createdAt: text('created_at').notNull(),
}, t => [uniqueIndex('community_requests_owner_fingerprint').on(t.owner, t.fingerprint), index('community_requests_created_at').on(t.createdAt)]);

// 点赞按账户唯一，下载按同一浏览器或账户每天去重；不把本机历史当作公共统计。
export const likes = sqliteTable('community_likes', {
  id: text('id').primaryKey(), workId: text('work_id').notNull(), actor: text('actor').notNull(), createdAt: text('created_at').notNull(),
}, t => [uniqueIndex('community_likes_work_actor').on(t.workId, t.actor), index('community_likes_created_at').on(t.createdAt)]);
export const downloads = sqliteTable('community_downloads', {
  id: text('id').primaryKey(), workId: text('work_id').notNull(), actor: text('actor').notNull(), day: text('day').notNull(), createdAt: text('created_at').notNull(),
}, t => [uniqueIndex('community_downloads_work_actor_day').on(t.workId, t.actor, t.day), index('community_downloads_created_at').on(t.createdAt)]);
