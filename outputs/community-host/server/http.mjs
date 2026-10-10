import { createServer } from 'node:http';
import { Readable } from 'node:stream';

export function createCommunityServer({ worker, environment, accounts, origin, trustedProxy = false }) {
  const publicUrl = new URL(origin);
  if (publicUrl.pathname !== '/' || publicUrl.search || publicUrl.hash || publicUrl.username || publicUrl.password) throw new Error('网站地址须为完整站点根地址。');
  const server = createServer((incoming, outgoing) => {
    void (async () => {
      if (incoming.headers.host !== publicUrl.host) { outgoing.writeHead(403).end(); return; }
      if (!incoming.url?.startsWith('/') || incoming.url.startsWith('//')) { outgoing.writeHead(400).end(); return; }
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      // 只接受本服务验证的会话；公网客户端或反向代理不能直接声称 Sites 身份。
      headers.delete('oai-authenticated-user-id'); headers.delete('oai-sites-authorization');
      const controller = new AbortController(); incoming.on('aborted', () => controller.abort());
      const method = incoming.method || 'GET';
      const request = new Request(new URL(incoming.url, origin), { method, headers, signal: controller.signal,
        ...(!['GET', 'HEAD'].includes(method) ? { body: Readable.toWeb(incoming), duplex: 'half' } : {}) });
      const remote = incoming.socket.remoteAddress || 'unknown';
      const peer = trustedProxy && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote) ? incoming.headers['x-real-ip'] || remote : remote;
      let response = await accounts.handle(request, String(peer));
      if (!response) {
        const identity = await accounts.identity(request);
        if (identity) headers.set('oai-authenticated-user-id', identity.id);
        response = await worker.fetch(new Request(request, { headers }), environment);
      }
      const responseHeaders = Object.fromEntries(response.headers);
      if (response.headers.getSetCookie().length) responseHeaders['set-cookie'] = response.headers.getSetCookie();
      responseHeaders['x-content-type-options'] = 'nosniff'; responseHeaders['referrer-policy'] = 'same-origin';
      outgoing.writeHead(response.status, responseHeaders);
      if (method === 'HEAD' || !response.body) { outgoing.end(); return; }
      const stream = Readable.fromWeb(response.body);
      outgoing.on('close', () => { controller.abort(); stream.destroy(); });
      stream.on('error', () => outgoing.destroy()); stream.pipe(outgoing);
    })().catch(error => {
      console.error('请求处理失败', error?.name);
      if (!outgoing.headersSent) outgoing.writeHead(503, { 'content-type': 'application/json; charset=utf-8' });
      outgoing.end(JSON.stringify({ error: '服务暂不可用，请稍后重试。' }));
    });
  });
  server.requestTimeout = 90000; server.headersTimeout = 15000; server.maxHeadersCount = 100;
  return server;
}
