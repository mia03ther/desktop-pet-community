import community from '../../community-host/server/community-api.mjs';
import { pets, toolPlugins, templates, projectAuthor } from '../../community-host/public/catalog.js';
import { sourcePlugins } from '../../community-host/public/plugin-catalog.js';
import { createAnonymousInteractionService } from './anonymous-session.mjs';
import { serveVideoAsset } from './media-assets.mjs';
import { createCatalogManagement } from './catalog-management.mjs';
import { pluginCovers } from '../../community-host/public/plugin-covers.js';

const origin = 'https://desktoppet-e9e.pages.dev';
const works = [...pets, ...toolPlugins, ...sourcePlugins, ...templates.map(template => ({ ...template, kind: 'plugin', author: projectAuthor, download: `assets/${template.id}.zip` }))].map(work => work.kind === 'plugin' ? { ...work, cover: pluginCovers[work.id] || work.cover } : work);
const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

export function createWorker(interactionFactory = createAnonymousInteractionService) {
  const services = new WeakMap();
  const managers = new WeakMap();
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/') && url.origin !== origin) return json({ error: '请使用正式共创平台地址。' }, 403);
      // 匿名互动不能提升为账号或投稿者身份；清除客户传入的身份及代理头。
      const headers = new Headers(request.headers);
      headers.delete('oai-authenticated-user-id');
      headers.delete('oai-sites-authorization');
      headers.delete('x-forwarded-for');
      const clean = new Request(request, { headers });
      const enabled = !!interactionFactory && !!env.DB && typeof env.HASH_SALT === 'string' && env.HASH_SALT.length >= 32;
      try {
        let manager;
        if (env.DB && typeof env.ADMIN_KEY === 'string' && /^[a-f0-9]{64}$/.test(env.ADMIN_KEY)) {
          let entry = managers.get(env.DB);
          if (!entry || entry.secret !== env.ADMIN_KEY) {
            entry = { secret: env.ADMIN_KEY, service: createCatalogManagement({ DB: env.DB, secret: env.ADMIN_KEY, origin, works }) };
            managers.set(env.DB, entry);
          }
          manager = entry.service;
        }
        if (manager) {
          const managed = await manager.handle(clean, request.headers.get('cf-connecting-ip') || 'unknown');
          if (managed) return managed;
          if (await manager.blocked(clean)) return request.method === 'HEAD' ? new Response(null, { status: 410, headers: { 'cache-control': 'no-store' } }) : json({ error: '该作品已下架。' }, 410);
        } else if (url.pathname.startsWith('/api/admin/')) return json({ error: '管理员服务尚未配置。' }, 503);
        else if (url.pathname === '/api/catalog-management') return json({ available: false, items: [] });
        if (!url.pathname.startsWith('/api/')) {
          const response = await serveVideoAsset(request, env.ASSETS) || await env.ASSETS.fetch(request);
          if (url.pathname.startsWith('/assets/') || url.pathname === '/admin.html') {
            const protectedResponse = new Response(response.body, response);
            protectedResponse.headers.set('cache-control', 'no-store');
            if (url.pathname === '/admin.html') {
              protectedResponse.headers.set('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
              protectedResponse.headers.set('x-frame-options', 'DENY');
            }
            return protectedResponse;
          }
          return response;
        }
        let interactions;
        if (enabled) {
          let entry = services.get(env.DB);
          if (!entry || entry.salt !== env.HASH_SALT) {
            entry = { salt: env.HASH_SALT, service: Promise.resolve().then(() => interactionFactory({ DB: env.DB, origin, salt: env.HASH_SALT, works })) };
            services.set(env.DB, entry);
          }
          try { interactions = await entry.service; }
          catch (error) { if (services.get(env.DB) === entry) services.delete(env.DB); throw error; }
        }
        if (url.pathname.startsWith('/api/auth/')) {
          if (url.pathname === '/api/auth/session' && request.method === 'GET') return json({ user: null, available: false });
          return json({ error: '密码登录已停用。' }, 503);
        }
        if (url.pathname === '/api/session' && request.method === 'GET') {
          let available = false;
          if (interactions) try {
            // 绑定存在不等于迁移已执行；查询真实表后才报告互动就绪。
            await env.DB.batch(['community_creator_follows', 'community_interaction_limits', 'community_likes', 'community_downloads'].map(table => env.DB.prepare(`SELECT 1 FROM ${table} LIMIT 0`)));
            available = true;
          } catch { /* 迁移或绑定未就绪时准确保持不可用。 */ }
          return json({ available: false, signedIn: false, maxPackageBytes: 32 * 1024 * 1024, interactionsAvailable: available, anonymousInteractions: available, error: '请配置投稿仓库。' });
        }
        if (['/api/plugins', '/api/pets', '/api/requests'].includes(url.pathname) && request.method === 'POST') return json({ error: '请配置投稿仓库。' }, 401);
        const peer = request.headers.get('cf-connecting-ip') || 'unknown';
        if (interactions) {
          const result = await interactions.handle(clean, peer);
          if (result) return result;
        } else if (url.pathname.startsWith('/api/contributors/') || /^\/api\/works\/[^/]+\/like$/.test(url.pathname)) return json({ error: '公共互动尚未启用，请稍后再试。' }, 503);
        return await community.fetch(clean, env);
      } catch (error) {
        console.error('共创平台请求失败', error?.name);
        return json({ error: '公共服务暂不可用，请稍后再试。' }, 503);
      }
    },
  };
}

export default createWorker();
