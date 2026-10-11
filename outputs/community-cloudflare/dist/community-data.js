import { pets } from './catalog.js';

// 合集只引用当前广场实际收录的作品，数量由页面根据petIds计算。
const thumbnail = id => pets.find(pet => pet.id === id)?.thumbnail || 'assets/brand-logo.png';
export const collections = [
  {
    id: 'honkai-star-rail', title: '崩坏：星穹铁道', type: 'franchise',
    description: '与星穹列车同行。当前收录流萤的社区桌宠作品。',
    petIds: ['firefly--lingxiaotian'],
  },
  {
    id: 'genshin-impact', title: '原神', type: 'franchise',
    description: '让提瓦特的伙伴来到桌面，浏览芙宁娜、派蒙与八重神子的动作。',
    petIds: ['furina--lingxiaotian', 'paimon--lingxiaotian', 'yae-miko--legeling'],
  },
  {
    id: 'animal-companions', title: '动物伙伴', type: 'theme',
    description: '猫咪、柯基与小熊，一起组成轻松温暖的桌面动物园。',
    petIds: ['hoodie-cat-openpets', 'bubu--gbn666', 'corgi-companion--cxian0928-afk', 'becky--natewanggg', 'jinmao--legeling'],
  },
  {
    id: 'anime-companions', title: '动漫伙伴', type: 'theme',
    description: '从芙莉莲到初音未来，发现不同作品中的可爱桌面伙伴。',
    petIds: ['frieren--lingxiaotian', 'miku--lingxiaotian', 'toothless--legeling', 'buttercup--legeling'],
  },
  {
    id: 'original-helpers', title: '原创小助手', type: 'theme',
    description: '浏览作者独立创作的角色，寻找与你合拍的小助手。',
    petIds: ['codexy--z19t', 'iris--yau-427', 'minty--somnusochi'],
  },
  {
    id: 'ai-inspired-companions', title: 'AI 灵感伙伴', type: 'theme',
    description: '受不同 AI 形象启发的社区作品；素材可用于你选择的任意 AI。',
    petIds: ['claude--xiangking', 'deepseek-girl--legeling', 'codex-orb--legeling'],
  },
].map(collection => ({ ...collection, petIds: collection.petIds.filter(id => pets.some(pet => pet.id === id)) }));

// 这是本站制作提案示例，借已有作品说明创作方向，不是他人公共投稿或实时需求快照。
export const requestSeeds = [
  {
    id: 'example-reading-cat', title: '会陪读的猫咪',
    description: '本站创作提案示例：借用现有夜猫作为造型参考，创作一只会翻书、打盹和伸懒腰的原创陪读猫咪。参考角色不是已经完成的新作品。',
    category: '动物伙伴', version: 2, status: 'waiting',
    thumbnail: thumbnail('night-neko--netizenxuan'),
    source: '',
    updatedAt: '2026-10-07T00:00:00Z', example: true,
  },
  {
    id: 'example-starry-corgi', title: '星空柯基',
    description: '本站创作提案示例：借用现有 Corgi Companion 作为造型参考，创作一只戴星星围巾、带来温和休息提醒的原创柯基。',
    category: '动物伙伴', version: 2, status: 'waiting',
    thumbnail: thumbnail('corgi-companion--cxian0928-afk'),
    source: 'https://github.com/legeling/awesome-codex-pet/tree/c617dd5d4c127a66ad65c8eb25c6f94412bed95c/pets/corgi-companion--cxian0928-afk',
    updatedAt: '2026-10-07T00:00:00Z', example: true,
  },
  {
    id: 'example-bubble-tea-robot', title: '泡泡茶机器人',
    description: '本站创作提案示例：借用现有 CRT 显示器作为造型参考，创作一只会泡茶、挥手和显示不同表情的原创小机器人。',
    category: '机器人', version: 2, status: 'waiting',
    thumbnail: thumbnail('crt-monitor--wxy'),
    source: 'https://github.com/legeling/awesome-codex-pet/tree/c617dd5d4c127a66ad65c8eb25c6f94412bed95c/pets/crt-monitor--wxy',
    updatedAt: '2026-10-07T00:00:00Z', example: true,
  },
  {
    id: 'example-focus-helper', title: '专注小助手',
    description: '本站创作提案示例：借用现有码灵 Codexy 作为造型参考，创作一位陪伴写作、工作和番茄钟休息的原创小助手，可接入任意 AI。',
    category: '原创角色', version: 2, status: 'waiting',
    thumbnail: thumbnail('codexy--z19t'),
    source: 'https://github.com/legeling/awesome-codex-pet/tree/c617dd5d4c127a66ad65c8eb25c6f94412bed95c/pets/codexy--z19t',
    updatedAt: '2026-10-07T00:00:00Z', example: true,
  },
];
