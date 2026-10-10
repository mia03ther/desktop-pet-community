import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from './community-api.mjs';
import { persistentStorage, publicAssets } from './storage.mjs';
import { createAccountService } from './accounts.mjs';
import { createCommunityServer } from './http.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.env.COMMUNITY_ORIGIN;
if (!origin || !origin.startsWith('https://')) throw new Error('请配置已解析到本服务的 HTTPS 网站地址 COMMUNITY_ORIGIN。');
const stateDirectory = resolve(process.env.COMMUNITY_STATE || '/var/lib/desktop-pet-community');
const storage = await persistentStorage(stateDirectory, resolve(root, 'drizzle'));
const accounts = await createAccountService({ stateDirectory, origin, secureCookies: true });
const environment = { DB: storage.DB, BUCKET: storage.BUCKET, ASSETS: await publicAssets(resolve(root, 'public')) };
const server = createCommunityServer({ worker, environment, accounts, origin, trustedProxy: process.env.COMMUNITY_TRUST_LOCAL_PROXY === '1' });
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('服务端口无效。');
server.listen(port, '127.0.0.1', () => console.log('desktop pet 共创服务已启动。'));
function stop() { server.close(() => { accounts.close(); storage.close(); process.exit(0); }); }
process.on('SIGTERM', stop); process.on('SIGINT', stop);
