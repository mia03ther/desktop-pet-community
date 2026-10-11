// 画廊作品来自固定上游提交，公开图集逐项核对 SHA-256；不包含用户私人档案。
export const actions = [
  [
    "安静陪伴",
    0,
    6,
    5500
  ],
  [
    "向右溜达",
    1,
    8,
    1060
  ],
  [
    "向左溜达",
    2,
    8,
    1060
  ],
  [
    "挥手",
    3,
    4,
    700
  ],
  [
    "跳跃",
    4,
    5,
    840
  ],
  [
    "失败反应",
    5,
    8,
    1220
  ],
  [
    "等待",
    6,
    6,
    1000
  ],
  [
    "工作",
    7,
    6,
    820
  ],
  [
    "查看",
    8,
    6,
    1030
  ]
];
export const templates = [
  {
    "id": "community.water-break",
    "title": "喝水小提醒",
    "description": "忙碌的时候，也记得喝口水。间隔和台词都可重新创作。",
    "everyMinutes": 45,
    "speech": "喝口水，休息一下吧。",
    "reaction": "waving",
    "category": "健康提醒",
    "symbol": "水"
  },
  {
    "id": "community.eye-break",
    "title": "远眺一分钟",
    "description": "把视线从屏幕移开，让眼睛和桌宠一起休息。",
    "everyMinutes": 20,
    "speech": "看看远处，让眼睛休息一下。",
    "reaction": "idle",
    "category": "健康提醒",
    "symbol": "目"
  },
  {
    "id": "community.focus-break",
    "title": "专注后休息",
    "description": "每隔一段时间温和提醒休息。周期重复运行，可在本地停用。",
    "everyMinutes": 25,
    "speech": "一段专注结束啦，站起来活动一下。",
    "reaction": "celebrating",
    "category": "专注陪伴",
    "symbol": "歇"
  }
];
export const catCredit = {
  "author": "OpenPets 上游示例；具体作者待核实",
  "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4",
  "license": "单项素材许可待核实，仓库代码许可为 MIT"
};
// 显示署名与已批准的真实 GitHub 账户分别保留，不改上游署名。
export const projectAuthor = 'Lykinzlj';
export const projectAuthorUrl = 'https://github.com/xunguangzlj-cloud';
export const templateCredit = {
  "author": projectAuthor,
  "source": "desktop pet 声明式插件格式",
  "license": "MIT（提醒清单代码）"
};
export const cat = {
  "id": "hoodie-cat-openpets",
  "title": "Hoodie Cat",
  "description": "穿着连帽衫的猫咪，拥有溜达、挥手、跳跃和注视动作。",
  "category": "动物伙伴",
  "author": "OpenPets 上游示例",
  "kind": "pet",
  "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4",
  "license": "单项素材许可待核实，仓库代码许可为 MIT",
  "englishTitle": "Hoodie Cat",
  "atlas": "assets/hoodie.webp",
  "thumbnail": "assets/pets/hoodie-cat-openpets-thumb.webp",
  "version": 2,
  "authorHandle": "",
  "authorUrl": "https://github.com/OpenPetsHQ",
  "tags": [
    "猫咪",
    "连帽衫",
    "动物伙伴"
  ],
  "download": "assets/hoodie-cat-openpets.zip",
  "date": "",
  "importedAt": "2026-10-07",
  "collections": []
};
export const pets = [
  {
    "id": "oc-claw-homie",
    "title": "Homie",
    "description": "A tiny smug patriotic cape-wearing superhero companion.",
    "kind": "pet",
    "category": "原创角色",
    "author": "rainnoon",
    "authorUrl": "",
    "source": "https://github.com/rainnoon/oc-claw/tree/4667c8c082cecf7e38440dfc2f6f89f7a9b6cc90",
    "license": "代码MIT；美术非商业",
    "version": 1,
    "download": "assets/pets/mit-20261011/oc-claw-homie/package.zip",
    "thumbnail": "assets/pets/mit-20261011/oc-claw-homie/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 2731866,
    "archiveSha256": "c3b6f1e7473d7a4ee156821ca0c545e6e20b88379b7b9c0c2276b827bead9e95",
    "upstreamCommit": "4667c8c082cecf7e38440dfc2f6f89f7a9b6cc90",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "atlas": "assets/pets/mit-20261011/oc-claw-homie/spritesheet.webp"
  },
  {
    "id": "oc-claw-taffy",
    "title": "Taffy",
    "description": "A tiny pixel chibi aviator girl pet with pink hair, round brass goggles with heart lenses, and a waist charm matching the plush face from the second reference.",
    "kind": "pet",
    "category": "动漫角色",
    "author": "rainnoon",
    "authorUrl": "",
    "source": "https://github.com/rainnoon/oc-claw/tree/4667c8c082cecf7e38440dfc2f6f89f7a9b6cc90",
    "license": "代码MIT；美术非商业",
    "version": 1,
    "download": "assets/pets/mit-20261011/oc-claw-taffy/package.zip",
    "thumbnail": "assets/pets/mit-20261011/oc-claw-taffy/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 4460655,
    "archiveSha256": "363c1135d4bdaa8a2bb3b79c52eb777bc1202d1c8989cb2071db6f22a9aa44f3",
    "upstreamCommit": "4667c8c082cecf7e38440dfc2f6f89f7a9b6cc90",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "atlas": "assets/pets/mit-20261011/oc-claw-taffy/spritesheet.webp"
  },
  {
    "id": "boba-petdex",
    "title": "Boba",
    "description": "railly 的奶茶水獭 Boba，沿 Petdex 原生九状态逐帧时序无损适配。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "railly",
    "authorUrl": "",
    "source": "https://github.com/crafter-station/petdex/tree/31c0aee7f4fb387774b87d40e8047dc0f9cea94b",
    "license": "代码 MIT；Boba 美术未提供独立授权声明",
    "version": 1,
    "download": "assets/pets/mit-20261011/boba-petdex/package.zip",
    "thumbnail": "assets/pets/mit-20261011/boba-petdex/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 4359364,
    "archiveSha256": "55e44d41b041f76783be8d77dc3c70d678a7fc6aaa1f6ffe6d7a6a3e87c50c55",
    "upstreamCommit": "31c0aee7f4fb387774b87d40e8047dc0f9cea94b",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/boba-petdex/actions/idle.webp"
      },
      "running-right": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/boba-petdex/actions/running-right.webp"
      },
      "running-left": {
        "displayName": "向左行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/boba-petdex/actions/running-left.webp"
      },
      "waving": {
        "displayName": "挥手",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/boba-petdex/actions/waving.webp"
      },
      "jumping": {
        "displayName": "跳跃",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/boba-petdex/actions/jumping.webp"
      },
      "failed": {
        "displayName": "失败反应",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/boba-petdex/actions/failed.webp"
      },
      "waiting": {
        "displayName": "等待",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/boba-petdex/actions/waiting.webp"
      },
      "running": {
        "displayName": "工作进行中",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/boba-petdex/actions/running.webp"
      },
      "review": {
        "displayName": "思考",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/boba-petdex/actions/review.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/boba-petdex/pet.json",
    "packageLicense": "assets/pets/mit-20261011/boba-petdex/ASSET-LICENSE-STATUS.txt"
  },
  {
    "id": "gooey-pi",
    "title": "GooeyPi",
    "description": "A friendly purple jelly pet shaped like the mathematical pi symbol.",
    "kind": "pet",
    "category": "原创角色",
    "author": "am-will / GooeyPi contributors",
    "authorUrl": "",
    "source": "https://github.com/am-will/gooey-pi/tree/459c9965690468c69d7434f82acf4b5eeee8e4bf",
    "license": "MIT；GooeyPi contributors",
    "version": 1,
    "download": "assets/pets/mit-20261011/gooey-pi/package.zip",
    "thumbnail": "assets/pets/mit-20261011/gooey-pi/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 3988524,
    "archiveSha256": "7bda315d3c005693fca1dc9d9f7f9b844f460fee5a76602ba349b3e90c6ab14f",
    "upstreamCommit": "459c9965690468c69d7434f82acf4b5eeee8e4bf",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/gooey-pi/actions/idle.webp"
      },
      "running-right": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/gooey-pi/actions/running-right.webp"
      },
      "running-left": {
        "displayName": "向左行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/gooey-pi/actions/running-left.webp"
      },
      "speaking": {
        "displayName": "说话",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/gooey-pi/actions/speaking.webp"
      },
      "jumping": {
        "displayName": "跳跃",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/gooey-pi/actions/jumping.webp"
      },
      "failed": {
        "displayName": "失败反应",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/gooey-pi/actions/failed.webp"
      },
      "waiting": {
        "displayName": "等待",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/gooey-pi/actions/waiting.webp"
      },
      "working": {
        "displayName": "工作",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/gooey-pi/actions/working.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/gooey-pi/pet.json",
    "packageLicense": "assets/pets/mit-20261011/gooey-pi/LICENSE"
  },
  {
    "id": "aemeath-withclaude",
    "title": "爱弥斯 · 像素伙伴",
    "description": "原像素爱弥斯完整15动作，按180毫秒原时序无损适配。",
    "kind": "pet",
    "category": "动漫角色",
    "author": "77wliNd",
    "authorUrl": "",
    "source": "https://github.com/77wliNd/aemeath_withclaude/tree/d54ced98e46a749da2580cb72b0275340e5f2fca",
    "license": "代码 MIT；像素素材按原仓库 MIT 声明，角色权利另计",
    "version": 1,
    "download": "assets/pets/mit-20261011/aemeath-withclaude/package.zip",
    "thumbnail": "assets/pets/mit-20261011/aemeath-withclaude/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 3076248,
    "archiveSha256": "9cedd8fadfef64e2a374d6bae9ed18cbec31c6ddffa52eafaf38b68b9cf60387",
    "upstreamCommit": "d54ced98e46a749da2580cb72b0275340e5f2fca",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/idle.webp"
      },
      "running-right": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/running-right.webp"
      },
      "running-left": {
        "displayName": "向左行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/running-left.webp"
      },
      "waving": {
        "displayName": "挥手",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/waving.webp"
      },
      "jumping": {
        "displayName": "跳跃",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/jumping.webp"
      },
      "failed": {
        "displayName": "失败反应",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/failed.webp"
      },
      "waiting": {
        "displayName": "等待",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/waiting.webp"
      },
      "running": {
        "displayName": "工作进行中",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/running.webp"
      },
      "review": {
        "displayName": "思考",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/review.webp"
      },
      "chatting": {
        "displayName": "对话",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/chatting.webp"
      },
      "fetching": {
        "displayName": "获取信息",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/fetching.webp"
      },
      "searching": {
        "displayName": "搜索",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/searching.webp"
      },
      "analyzing": {
        "displayName": "分析",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/analyzing.webp"
      },
      "building": {
        "displayName": "构建",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/building.webp"
      },
      "celebrating": {
        "displayName": "庆祝",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/aemeath-withclaude/actions/celebrating.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/aemeath-withclaude/pet.json",
    "packageLicense": "assets/pets/mit-20261011/aemeath-withclaude/ASSET-LICENSE-STATEMENT.txt"
  },
  {
    "id": "windowpet-ganyu",
    "title": "甘雨 · WindowPet",
    "description": "保留 WindowPet 原图集全部九种状态：待机、行走、坐下、问候、爬行、攀爬、跳跃、落下与被拿起。原静态姿态明确按静态保留。",
    "kind": "pet",
    "category": "动漫角色",
    "author": "SeakMengs",
    "authorUrl": "",
    "source": "https://github.com/SeakMengs/WindowPet/tree/aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "license": "代码 MIT；角色美术依原作者声明",
    "version": 1,
    "download": "assets/pets/mit-20261011/windowpet-ganyu/package.zip",
    "thumbnail": "assets/pets/mit-20261011/windowpet-ganyu/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 878447,
    "archiveSha256": "be301a399e673fe0d60dbb148b0b86c4ab2db58ca885e946529949474898b7e8",
    "upstreamCommit": "aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "climb": {
        "displayName": "攀爬",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ganyu/actions/climb.webp"
      },
      "crawl": {
        "displayName": "爬行",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ganyu/actions/crawl.webp"
      },
      "drag": {
        "displayName": "被拿起姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ganyu/actions/drag.webp"
      },
      "fall": {
        "displayName": "落下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ganyu/actions/fall.webp"
      },
      "greet": {
        "displayName": "问候",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ganyu/actions/greet.webp"
      },
      "idle": {
        "displayName": "站立待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ganyu/actions/idle.webp"
      },
      "jump": {
        "displayName": "跳跃姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ganyu/actions/jump.webp"
      },
      "sit": {
        "displayName": "坐下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ganyu/actions/sit.webp"
      },
      "walk": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ganyu/actions/walk.webp"
      },
      "walk-left": {
        "displayName": "向左行走（原行走镜像）",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ganyu/actions/walk-left.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/windowpet-ganyu/pet.json",
    "packageLicense": "assets/pets/mit-20261011/windowpet-ganyu/LICENSE.txt"
  },
  {
    "id": "windowpet-ayaka",
    "title": "神里绫华 · WindowPet",
    "description": "保留 WindowPet 原图集全部九种状态：待机、行走、坐下、问候、爬行、攀爬、跳跃、落下与被拿起。原静态姿态明确按静态保留。",
    "kind": "pet",
    "category": "动漫角色",
    "author": "SeakMengs",
    "authorUrl": "",
    "source": "https://github.com/SeakMengs/WindowPet/tree/aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "license": "代码 MIT；角色美术依原作者声明",
    "version": 1,
    "download": "assets/pets/mit-20261011/windowpet-ayaka/package.zip",
    "thumbnail": "assets/pets/mit-20261011/windowpet-ayaka/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 637518,
    "archiveSha256": "80de0bdcf8c65f7340aa58438afbdefb8a5b1623e7ba5be89a687798f5139602",
    "upstreamCommit": "aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "climb": {
        "displayName": "攀爬",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ayaka/actions/climb.webp"
      },
      "crawl": {
        "displayName": "爬行",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ayaka/actions/crawl.webp"
      },
      "drag": {
        "displayName": "被拿起姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ayaka/actions/drag.webp"
      },
      "fall": {
        "displayName": "落下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ayaka/actions/fall.webp"
      },
      "greet": {
        "displayName": "问候",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ayaka/actions/greet.webp"
      },
      "jump": {
        "displayName": "跳跃姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ayaka/actions/jump.webp"
      },
      "sit": {
        "displayName": "坐下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ayaka/actions/sit.webp"
      },
      "idle": {
        "displayName": "站立待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ayaka/actions/idle.webp"
      },
      "walk": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ayaka/actions/walk.webp"
      },
      "walk-left": {
        "displayName": "向左行走（原行走镜像）",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-ayaka/actions/walk-left.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/windowpet-ayaka/pet.json",
    "packageLicense": "assets/pets/mit-20261011/windowpet-ayaka/LICENSE.txt"
  },
  {
    "id": "windowpet-klee",
    "title": "可莉 · WindowPet",
    "description": "保留 WindowPet 原图集全部九种状态：待机、行走、坐下、问候、爬行、攀爬、跳跃、落下与被拿起。原静态姿态明确按静态保留。",
    "kind": "pet",
    "category": "动漫角色",
    "author": "SeakMengs",
    "authorUrl": "",
    "source": "https://github.com/SeakMengs/WindowPet/tree/aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "license": "代码 MIT；角色美术依原作者声明",
    "version": 1,
    "download": "assets/pets/mit-20261011/windowpet-klee/package.zip",
    "thumbnail": "assets/pets/mit-20261011/windowpet-klee/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 645390,
    "archiveSha256": "7969f5f789538bcc5e256d9c1e14258eaa237a58f85d0a0b22dcb599e07cfe28",
    "upstreamCommit": "aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "站立待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-klee/actions/idle.webp"
      },
      "walk": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-klee/actions/walk.webp"
      },
      "sit": {
        "displayName": "坐下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-klee/actions/sit.webp"
      },
      "greet": {
        "displayName": "问候",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-klee/actions/greet.webp"
      },
      "crawl": {
        "displayName": "爬行",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-klee/actions/crawl.webp"
      },
      "climb": {
        "displayName": "攀爬",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-klee/actions/climb.webp"
      },
      "jump": {
        "displayName": "跳跃姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-klee/actions/jump.webp"
      },
      "fall": {
        "displayName": "落下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-klee/actions/fall.webp"
      },
      "drag": {
        "displayName": "被拿起姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-klee/actions/drag.webp"
      },
      "walk-left": {
        "displayName": "向左行走（原行走镜像）",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-klee/actions/walk-left.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/windowpet-klee/pet.json",
    "packageLicense": "assets/pets/mit-20261011/windowpet-klee/LICENSE.txt"
  },
  {
    "id": "windowpet-hutao",
    "title": "胡桃 · WindowPet",
    "description": "保留 WindowPet 原图集全部九种状态：待机、行走、坐下、问候、爬行、攀爬、跳跃、落下与被拿起。原静态姿态明确按静态保留。",
    "kind": "pet",
    "category": "动漫角色",
    "author": "SeakMengs",
    "authorUrl": "",
    "source": "https://github.com/SeakMengs/WindowPet/tree/aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "license": "代码 MIT；角色美术依原作者声明",
    "version": 1,
    "download": "assets/pets/mit-20261011/windowpet-hutao/package.zip",
    "thumbnail": "assets/pets/mit-20261011/windowpet-hutao/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 604020,
    "archiveSha256": "0231c6253c349d7aa2f1c65b4733e02b57476dc4c890a0ba70dc802602ccb449",
    "upstreamCommit": "aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "站立待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-hutao/actions/idle.webp"
      },
      "walk": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-hutao/actions/walk.webp"
      },
      "sit": {
        "displayName": "坐下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-hutao/actions/sit.webp"
      },
      "greet": {
        "displayName": "问候",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-hutao/actions/greet.webp"
      },
      "crawl": {
        "displayName": "爬行",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-hutao/actions/crawl.webp"
      },
      "climb": {
        "displayName": "攀爬",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-hutao/actions/climb.webp"
      },
      "jump": {
        "displayName": "跳跃姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-hutao/actions/jump.webp"
      },
      "fall": {
        "displayName": "落下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-hutao/actions/fall.webp"
      },
      "drag": {
        "displayName": "被拿起姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-hutao/actions/drag.webp"
      },
      "walk-left": {
        "displayName": "向左行走（原行走镜像）",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-hutao/actions/walk-left.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/windowpet-hutao/pet.json",
    "packageLicense": "assets/pets/mit-20261011/windowpet-hutao/LICENSE.txt"
  },
  {
    "id": "windowpet-nezuko",
    "title": "灶门祢豆子 · WindowPet",
    "description": "保留 WindowPet 原图集全部九种状态：待机、行走、坐下、问候、爬行、攀爬、跳跃、落下与被拿起。原静态姿态明确按静态保留。",
    "kind": "pet",
    "category": "动漫角色",
    "author": "SeakMengs",
    "authorUrl": "",
    "source": "https://github.com/SeakMengs/WindowPet/tree/aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "license": "代码 MIT；角色美术依原作者声明",
    "version": 1,
    "download": "assets/pets/mit-20261011/windowpet-nezuko/package.zip",
    "thumbnail": "assets/pets/mit-20261011/windowpet-nezuko/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 753620,
    "archiveSha256": "9f5a4f1272550312394bc2d4abe53680ae685e0984439c3fe3fa2a548c1e48e0",
    "upstreamCommit": "aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "站立待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-nezuko/actions/idle.webp"
      },
      "walk": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-nezuko/actions/walk.webp"
      },
      "sit": {
        "displayName": "坐下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-nezuko/actions/sit.webp"
      },
      "greet": {
        "displayName": "问候",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-nezuko/actions/greet.webp"
      },
      "crawl": {
        "displayName": "爬行",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-nezuko/actions/crawl.webp"
      },
      "climb": {
        "displayName": "攀爬",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-nezuko/actions/climb.webp"
      },
      "jump": {
        "displayName": "跳跃姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-nezuko/actions/jump.webp"
      },
      "fall": {
        "displayName": "落下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-nezuko/actions/fall.webp"
      },
      "drag": {
        "displayName": "被拿起姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-nezuko/actions/drag.webp"
      },
      "walk-left": {
        "displayName": "向左行走（原行走镜像）",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-nezuko/actions/walk-left.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/windowpet-nezuko/pet.json",
    "packageLicense": "assets/pets/mit-20261011/windowpet-nezuko/LICENSE.txt"
  },
  {
    "id": "windowpet-jotaro",
    "title": "空条承太郎 · WindowPet",
    "description": "保留 WindowPet 原图集全部九种状态：待机、行走、坐下、问候、爬行、攀爬、跳跃、落下与被拿起。原静态姿态明确按静态保留。",
    "kind": "pet",
    "category": "动漫角色",
    "author": "SeakMengs",
    "authorUrl": "",
    "source": "https://github.com/SeakMengs/WindowPet/tree/aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "license": "代码 MIT；角色美术依原作者声明",
    "version": 1,
    "download": "assets/pets/mit-20261011/windowpet-jotaro/package.zip",
    "thumbnail": "assets/pets/mit-20261011/windowpet-jotaro/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 313417,
    "archiveSha256": "806633fec23248e6ac4fd11a735057ba71bd3229333cf03da41a74cf4572cffb",
    "upstreamCommit": "aba8d3ab94d30f4f5abf92b3f3ec7dff50d3326b",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "站立待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-jotaro/actions/idle.webp"
      },
      "walk": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-jotaro/actions/walk.webp"
      },
      "sit": {
        "displayName": "坐下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-jotaro/actions/sit.webp"
      },
      "greet": {
        "displayName": "问候",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-jotaro/actions/greet.webp"
      },
      "crawl": {
        "displayName": "爬行",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-jotaro/actions/crawl.webp"
      },
      "climb": {
        "displayName": "攀爬",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-jotaro/actions/climb.webp"
      },
      "jump": {
        "displayName": "跳跃姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-jotaro/actions/jump.webp"
      },
      "fall": {
        "displayName": "落下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-jotaro/actions/fall.webp"
      },
      "drag": {
        "displayName": "被拿起姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-jotaro/actions/drag.webp"
      },
      "walk-left": {
        "displayName": "向左行走（原行走镜像）",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/windowpet-jotaro/actions/walk-left.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/windowpet-jotaro/pet.json",
    "packageLicense": "assets/pets/mit-20261011/windowpet-jotaro/LICENSE.txt"
  },
  {
    "id": "nori-hope-agent",
    "title": "Nori · 白色海豹",
    "description": "Hope Agent 的白色幼海豹，保留原作 V2 图集、九核心动作和十六方向视线。",
    "kind": "pet",
    "category": "机器人伙伴",
    "author": "shiwenwen",
    "authorUrl": "",
    "source": "https://github.com/shiwenwen/hope-agent/tree/cd1d63fdbed9890bdccfe24f07c951fef638c810",
    "license": "MIT",
    "version": 2,
    "download": "assets/pets/mit-20261011/nori-hope-agent/package.zip",
    "thumbnail": "assets/pets/mit-20261011/nori-hope-agent/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 1426615,
    "archiveSha256": "c7cc9b855a9455a06f5b3a9794785d4830423aaa0a6b1dc2372e9f6935e2831a",
    "upstreamCommit": "cd1d63fdbed9890bdccfe24f07c951fef638c810",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "atlas": "assets/pets/mit-20261011/nori-hope-agent/spritesheet.webp"
  },
  {
    "id": "mochi-desktop",
    "title": "Mochi · 像素伙伴",
    "description": "保留原作完整 50 项动画清单、帧序与节奏，透明像素风伙伴。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "miflow13",
    "authorUrl": "",
    "source": "https://github.com/miflow13/mochi-desktop/tree/471342631206c40d56bbba016578926e16ca8d0b",
    "license": "MIT",
    "version": 1,
    "download": "assets/pets/mit-20261011/mochi-desktop/package.zip",
    "thumbnail": "assets/pets/mit-20261011/mochi-desktop/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 2139783,
    "archiveSha256": "8909edbc8f817fd6ea18296790b8c7dd4135ad028743835fd600c51c4d1edade",
    "upstreamCommit": "471342631206c40d56bbba016578926e16ca8d0b",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "dance": {
        "displayName": "跳舞",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/dance.webp"
      },
      "default": {
        "displayName": "默认静态姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/default.webp"
      },
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/idle.webp"
      },
      "sad_idle": {
        "displayName": "低落待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/sad_idle.webp"
      },
      "look": {
        "displayName": "观察",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/look.webp"
      },
      "blink": {
        "displayName": "眨眼",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/blink.webp"
      },
      "dragged": {
        "displayName": "被拖动",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/dragged.webp"
      },
      "walk": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/walk.webp"
      },
      "walk_left": {
        "displayName": "向左行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/walk_left.webp"
      },
      "bounce": {
        "displayName": "弹跳回应",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/bounce.webp"
      },
      "squish": {
        "displayName": "按压回应",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/squish.webp"
      },
      "sleep": {
        "displayName": "入睡",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/sleep.webp"
      },
      "sleeping": {
        "displayName": "睡觉",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/sleeping.webp"
      },
      "wake": {
        "displayName": "醒来",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/wake.webp"
      },
      "pickup": {
        "displayName": "被拿起",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/pickup.webp"
      },
      "heart": {
        "displayName": "爱心",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/heart.webp"
      },
      "eat": {
        "displayName": "进食",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/eat.webp"
      },
      "pocket_grab": {
        "displayName": "取出口袋物品",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/pocket_grab.webp"
      },
      "computer": {
        "displayName": "使用电脑",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/computer.webp"
      },
      "focus_start": {
        "displayName": "开始专注",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/focus_start.webp"
      },
      "focus_loop": {
        "displayName": "专注",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/focus_loop.webp"
      },
      "focus_stop": {
        "displayName": "结束专注",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/focus_stop.webp"
      },
      "focus_thinking_start": {
        "displayName": "开始思考",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/focus_thinking_start.webp"
      },
      "focus_thinking_loop": {
        "displayName": "思考",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/focus_thinking_loop.webp"
      },
      "focus_thinking_end": {
        "displayName": "结束思考",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/focus_thinking_end.webp"
      },
      "typing_loop": {
        "displayName": "打字",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/typing_loop.webp"
      },
      "typing_intro": {
        "displayName": "开始打字",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/typing_intro.webp"
      },
      "typing_outro": {
        "displayName": "结束打字",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/typing_outro.webp"
      },
      "watch": {
        "displayName": "观看",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/watch.webp"
      },
      "reading": {
        "displayName": "阅读",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/reading.webp"
      },
      "searching": {
        "displayName": "搜索",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/searching.webp"
      },
      "sway_idle": {
        "displayName": "轻晃",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/sway_idle.webp"
      },
      "drop": {
        "displayName": "放下",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/drop.webp"
      },
      "terminal_intro": {
        "displayName": "打开终端",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/terminal_intro.webp"
      },
      "terminal_loop": {
        "displayName": "终端工作",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/terminal_loop.webp"
      },
      "terminal_outro": {
        "displayName": "合上终端",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/terminal_outro.webp"
      },
      "agent_intro": {
        "displayName": "开始工作",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/agent_intro.webp"
      },
      "agent_loop": {
        "displayName": "工作陪伴",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/agent_loop.webp"
      },
      "agent_outro": {
        "displayName": "结束工作",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/agent_outro.webp"
      },
      "fedora_intro": {
        "displayName": "戴上帽子",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/fedora_intro.webp"
      },
      "fedora_loop": {
        "displayName": "帽子待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/fedora_loop.webp"
      },
      "fedora_outro": {
        "displayName": "摘下帽子",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/fedora_outro.webp"
      },
      "side_eye": {
        "displayName": "侧目",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/side_eye.webp"
      },
      "table_flip": {
        "displayName": "掀桌反应",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/table_flip.webp"
      },
      "this_is_fine": {
        "displayName": "淡定喝茶",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/this_is_fine.webp"
      },
      "level_up_default": {
        "displayName": "升级",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/level_up_default.webp"
      },
      "wave": {
        "displayName": "挥手",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/wave.webp"
      },
      "vs_code": {
        "displayName": "编辑代码",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/vs_code.webp"
      },
      "mochi_exe": {
        "displayName": "高级代码特效",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/mochi_exe.webp"
      },
      "coffee": {
        "displayName": "喝咖啡",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/mochi-desktop/actions/coffee.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/mochi-desktop/pet.json",
    "packageLicense": "assets/pets/mit-20261011/mochi-desktop/LICENSE.txt"
  },
  {
    "id": "memmy-companion",
    "title": "Memmy · 记忆伙伴",
    "description": "原透明 WebM 待机与出场素材，19 个官方静态表情明确按静态状态保留。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "MemTensor",
    "authorUrl": "",
    "source": "https://github.com/MemTensor/memmy-agent/tree/e7868e8dcca6ec52424a6535a8dbac4215708e2d",
    "license": "MIT",
    "version": 1,
    "download": "assets/pets/mit-20261011/memmy-companion/package.zip",
    "thumbnail": "assets/pets/mit-20261011/memmy-companion/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 9653980,
    "archiveSha256": "524a1d7ad93b1562713fea8ad6ccbb409c467af0d5131aa295e6798f2f352ab1",
    "upstreamCommit": "e7868e8dcca6ec52424a6535a8dbac4215708e2d",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "视频待机",
        "type": "video/webm",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/idle.webm"
      },
      "blush": {
        "displayName": "害羞姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/blush.webp"
      },
      "box": {
        "displayName": "盒子姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/box.webp"
      },
      "brain": {
        "displayName": "大脑姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/brain.webp"
      },
      "celebrate": {
        "displayName": "庆祝姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/celebrate.webp"
      },
      "chat": {
        "displayName": "对话姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/chat.webp"
      },
      "connect": {
        "displayName": "连接姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/connect.webp"
      },
      "hum": {
        "displayName": "哼唱姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/hum.webp"
      },
      "peek": {
        "displayName": "探头姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/peek.webp"
      },
      "plead": {
        "displayName": "请求姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/plead.webp"
      },
      "point": {
        "displayName": "指向姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/point.webp"
      },
      "read": {
        "displayName": "阅读姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/read.webp"
      },
      "neutral": {
        "displayName": "默认姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/neutral.webp"
      },
      "sad": {
        "displayName": "低落姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/sad.webp"
      },
      "shield": {
        "displayName": "守护姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/shield.webp"
      },
      "sleep": {
        "displayName": "睡觉姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/sleep.webp"
      },
      "think": {
        "displayName": "思考姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/think.webp"
      },
      "wave": {
        "displayName": "挥手姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/wave.webp"
      },
      "work": {
        "displayName": "工作姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/work.webp"
      },
      "wrench": {
        "displayName": "扳手姿态",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/wrench.webp"
      },
      "entrance": {
        "displayName": "出场",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/memmy-companion/actions/entrance.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/memmy-companion/pet.json",
    "packageLicense": "assets/pets/mit-20261011/memmy-companion/LICENSE.txt"
  },
  {
    "id": "cc-haha-dada-code",
    "title": "搭搭 Dada",
    "description": "沉稳的协作机器人，陪你把想法一块块搭起来。",
    "kind": "pet",
    "category": "机器人伙伴",
    "author": "NanmiCoder",
    "authorUrl": "",
    "source": "https://github.com/NanmiCoder/cc-haha/tree/1443e22d4657ebe9b662d567cd51f6684ddddd03",
    "license": "MIT",
    "version": 2,
    "download": "assets/pets/mit-20261011/cc-haha-dada-code/package.zip",
    "thumbnail": "assets/pets/mit-20261011/cc-haha-dada-code/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 1313589,
    "archiveSha256": "19bd901704fd22544ba3c148cf86cc02d118b6a4fadeb6ff743b48293a81f531",
    "upstreamCommit": "1443e22d4657ebe9b662d567cd51f6684ddddd03",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "atlas": "assets/pets/mit-20261011/cc-haha-dada-code/spritesheet.webp"
  },
  {
    "id": "cc-haha-huhu-plan",
    "title": "弧弧 Huhu",
    "description": "拿着铅笔和计划本的路线机器人，复杂任务也能找到出口。",
    "kind": "pet",
    "category": "机器人伙伴",
    "author": "NanmiCoder",
    "authorUrl": "",
    "source": "https://github.com/NanmiCoder/cc-haha/tree/1443e22d4657ebe9b662d567cd51f6684ddddd03",
    "license": "MIT",
    "version": 2,
    "download": "assets/pets/mit-20261011/cc-haha-huhu-plan/package.zip",
    "thumbnail": "assets/pets/mit-20261011/cc-haha-huhu-plan/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 1628303,
    "archiveSha256": "4c407e46ff40e7e3f5e80c9936a06f02e4306b3f8e2cdcca7911d2fb16aed704",
    "upstreamCommit": "1443e22d4657ebe9b662d567cd51f6684ddddd03",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "atlas": "assets/pets/mit-20261011/cc-haha-huhu-plan/spritesheet.webp"
  },
  {
    "id": "cc-haha-bubu-fix",
    "title": "补补 Bubu",
    "description": "举着修补扳手的小机器人，最擅长发现并修好裂缝。",
    "kind": "pet",
    "category": "机器人伙伴",
    "author": "NanmiCoder",
    "authorUrl": "",
    "source": "https://github.com/NanmiCoder/cc-haha/tree/1443e22d4657ebe9b662d567cd51f6684ddddd03",
    "license": "MIT",
    "version": 2,
    "download": "assets/pets/mit-20261011/cc-haha-bubu-fix/package.zip",
    "thumbnail": "assets/pets/mit-20261011/cc-haha-bubu-fix/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 1839938,
    "archiveSha256": "34a7276a68a98d2dab01b4fb84c8f766e8c2e3494a4a89f95a477c68666c27a8",
    "upstreamCommit": "1443e22d4657ebe9b662d567cd51f6684ddddd03",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "atlas": "assets/pets/mit-20261011/cc-haha-bubu-fix/spritesheet.webp"
  },
  {
    "id": "cc-haha-huihui-build",
    "title": "回回 Huihui",
    "description": "抱着构建齿轮的小机器人，新回复一到就精神满满。",
    "kind": "pet",
    "category": "机器人伙伴",
    "author": "NanmiCoder",
    "authorUrl": "",
    "source": "https://github.com/NanmiCoder/cc-haha/tree/1443e22d4657ebe9b662d567cd51f6684ddddd03",
    "license": "MIT",
    "version": 2,
    "download": "assets/pets/mit-20261011/cc-haha-huihui-build/package.zip",
    "thumbnail": "assets/pets/mit-20261011/cc-haha-huihui-build/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 1448327,
    "archiveSha256": "74f257bab22efe2e8aab3ae75cc99864c679bd4e0e32c270a380c6a62d272637",
    "upstreamCommit": "1443e22d4657ebe9b662d567cd51f6684ddddd03",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "atlas": "assets/pets/mit-20261011/cc-haha-huihui-build/spritesheet.webp"
  },
  {
    "id": "desktop-cat-1ilit",
    "title": "像素小猫",
    "description": "会待机、左右走动和睡觉的像素小猫，保留入睡与醒来两种原始过渡动作。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "1ilit",
    "authorUrl": "",
    "source": "https://github.com/1ilit/Desktop-Cat/tree/d0054a041ec7b000b1390fcbb2434ab22b922772",
    "license": "MIT",
    "version": 1,
    "download": "assets/pets/mit-20261011/desktop-cat-1ilit/package.zip",
    "thumbnail": "assets/pets/mit-20261011/desktop-cat-1ilit/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 13641,
    "archiveSha256": "64ca90b351ca8717552381dc8326aadbe0395e1ef36ac9621722e5002c1d3097",
    "upstreamCommit": "d0054a041ec7b000b1390fcbb2434ab22b922772",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/desktop-cat-1ilit/actions/idle.webp"
      },
      "running-left": {
        "displayName": "向左行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/desktop-cat-1ilit/actions/running-left.webp"
      },
      "running-right": {
        "displayName": "向右行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/desktop-cat-1ilit/actions/running-right.webp"
      },
      "sleeping": {
        "displayName": "睡觉",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/desktop-cat-1ilit/actions/sleeping.webp"
      },
      "sleep-enter": {
        "displayName": "入睡",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/desktop-cat-1ilit/actions/sleep-enter.webp"
      },
      "sleep-exit": {
        "displayName": "醒来",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/desktop-cat-1ilit/actions/sleep-exit.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/desktop-cat-1ilit/pet.json",
    "packageLicense": "assets/pets/mit-20261011/desktop-cat-1ilit/LICENSE.txt"
  },
  {
    "id": "black-whale-personal-center",
    "title": "圆滚滚小黑鲸",
    "description": "保留原作透明 WebP 的鲸鱼桌宠，包含 10 项真实动作和静态待机。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "PolinniZhong",
    "authorUrl": "",
    "source": "https://github.com/PolinniZhong/dsh-personal-center/tree/731a2593c2e32012781effd276a082b95d9b63fc",
    "license": "MIT",
    "version": 1,
    "download": "assets/pets/mit-20261011/black-whale-personal-center/package.zip",
    "thumbnail": "assets/pets/mit-20261011/black-whale-personal-center/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 706059,
    "archiveSha256": "76c67a00134a77260265ae7f23657038d8bd5feffbb38ddfe87bb0e6e7fddcc7",
    "upstreamCommit": "731a2593c2e32012781effd276a082b95d9b63fc",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "静态待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/idle/happy.webp"
      },
      "busy": {
        "displayName": "忙碌",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/actions/busy.webp"
      },
      "celebrate": {
        "displayName": "庆祝",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/actions/celebrate.webp"
      },
      "dozing": {
        "displayName": "打瞌睡",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/actions/dozing.webp"
      },
      "drag": {
        "displayName": "拖拽回应",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/actions/drag.webp"
      },
      "exhausted": {
        "displayName": "疲惫",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/actions/exhausted.webp"
      },
      "happy": {
        "displayName": "开心",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/actions/happy.webp"
      },
      "money-pain": {
        "displayName": "额度心疼",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/actions/money-pain.webp"
      },
      "thinking": {
        "displayName": "思考",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/actions/thinking.webp"
      },
      "waiting": {
        "displayName": "等待",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/actions/waiting.webp"
      },
      "wave": {
        "displayName": "挥手",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/black-whale-personal-center/actions/wave.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/black-whale-personal-center/pet.json",
    "packageLicense": "assets/pets/mit-20261011/black-whale-personal-center/LICENSE.txt"
  },
  {
    "id": "blue-whale-personal-center",
    "title": "圆滚滚小蓝鲸",
    "description": "保留原作透明 WebP 的鲸鱼桌宠，包含 10 项真实动作和静态待机。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "PolinniZhong",
    "authorUrl": "",
    "source": "https://github.com/PolinniZhong/dsh-personal-center/tree/731a2593c2e32012781effd276a082b95d9b63fc",
    "license": "MIT",
    "version": 1,
    "download": "assets/pets/mit-20261011/blue-whale-personal-center/package.zip",
    "thumbnail": "assets/pets/mit-20261011/blue-whale-personal-center/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 940583,
    "archiveSha256": "ecf62fe1e41fa4638adc2aaca4d0de5141588ce8b6d647bf7734f39d599f211d",
    "upstreamCommit": "731a2593c2e32012781effd276a082b95d9b63fc",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "静态待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/idle/happy.webp"
      },
      "busy": {
        "displayName": "忙碌",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/actions/busy.webp"
      },
      "celebrate": {
        "displayName": "庆祝",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/actions/celebrate.webp"
      },
      "dozing": {
        "displayName": "打瞌睡",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/actions/dozing.webp"
      },
      "drag": {
        "displayName": "拖拽回应",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/actions/drag.webp"
      },
      "exhausted": {
        "displayName": "疲惫",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/actions/exhausted.webp"
      },
      "happy": {
        "displayName": "开心",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/actions/happy.webp"
      },
      "money-pain": {
        "displayName": "额度心疼",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/actions/money-pain.webp"
      },
      "thinking": {
        "displayName": "思考",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/actions/thinking.webp"
      },
      "waiting": {
        "displayName": "等待",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/actions/waiting.webp"
      },
      "wave": {
        "displayName": "挥手",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/blue-whale-personal-center/actions/wave.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/blue-whale-personal-center/pet.json",
    "packageLicense": "assets/pets/mit-20261011/blue-whale-personal-center/LICENSE.txt"
  },
  {
    "id": "whale-girl-vlln",
    "title": "鲸鱼娘 · 互动动作",
    "description": "保留 15 项原作状态帧，将 PNG 原帧无损转为透明 WebP，单帧状态明确声明为静态动作。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "vlln",
    "authorUrl": "",
    "source": "https://github.com/vlln/whale-girl/tree/9c32d7a39a45148076f8ad2fdaad2dc2420eedb3",
    "license": "MIT",
    "version": 1,
    "download": "assets/pets/mit-20261011/whale-girl-vlln/package.zip",
    "thumbnail": "assets/pets/mit-20261011/whale-girl-vlln/thumbnail.webp",
    "tags": [
      "透明素材",
      "可导入"
    ],
    "importedAt": "2026-10-11",
    "collections": [],
    "archiveBytes": 3942617,
    "archiveSha256": "31430efccc0fbc5a0b9f96b0b2edfec0209ed3192f78d152436b89b2a526ec6b",
    "upstreamCommit": "9c32d7a39a45148076f8ad2fdaad2dc2420eedb3",
    "hostNotice": "下载 ZIP，在控制中心「我的桌宠」导入并设为当前桌宠。",
    "distribution": "media",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/idle.webp"
      },
      "working": {
        "displayName": "工作",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/working.webp"
      },
      "celebrate": {
        "displayName": "庆祝",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/celebrate.webp"
      },
      "error": {
        "displayName": "出错",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/error.webp"
      },
      "disappointed": {
        "displayName": "失落",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/disappointed.webp"
      },
      "joy": {
        "displayName": "开心",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/joy.webp"
      },
      "eat": {
        "displayName": "进食",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/eat.webp"
      },
      "play": {
        "displayName": "玩耍",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/play.webp"
      },
      "drag": {
        "displayName": "拖拽",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/drag.webp"
      },
      "walk": {
        "displayName": "行走",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/walk.webp"
      },
      "sleep": {
        "displayName": "睡觉",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/sleep.webp"
      },
      "wake": {
        "displayName": "醒来",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/wake.webp"
      },
      "welcome": {
        "displayName": "欢迎",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/welcome.webp"
      },
      "think": {
        "displayName": "思考",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/think.webp"
      },
      "wait": {
        "displayName": "等待",
        "type": "image/webp",
        "url": "assets/pets/mit-20261011/whale-girl-vlln/actions/wait.webp"
      }
    },
    "packageManifest": "assets/pets/mit-20261011/whale-girl-vlln/pet.json",
    "packageLicense": "assets/pets/mit-20261011/whale-girl-vlln/LICENSE.txt"
  },
  {
    "id": "firefly--lingxiaotian",
    "title": "流萤",
    "englishTitle": "Firefly",
    "description": "《崩坏：星穹铁道》流萤变身前的人类形态 Codex 数码宠物，温柔、轻盈、白绿金配色。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/firefly--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/firefly--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "firefly",
      "white-hair",
      "mint-green"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/firefly--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/firefly--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/firefly--lingxiaotian",
    "spritesheetSha256": "bd0a0deea6bfac69cfd6ebbec02e254536a6276a3958e5794a1b256aed074583",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "acheron--lingxiaotian",
    "title": "黄泉",
    "englishTitle": "Acheron",
    "description": "《崩坏：星穹铁道》黄泉风格的原创 Codex chibi 像素宠物，紫黑长发、红色发饰、白黑服装和冷静锋利的刀系气质。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/acheron--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/acheron--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "acheron",
      "sword",
      "purple"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/acheron--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/acheron--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/acheron--lingxiaotian",
    "spritesheetSha256": "fc34319c614cebcfbd7efabb10b9bcebaef039bc487c243402b791f607c9cfda",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "aemeath-mini--cunuo",
    "title": "Aemeath Mini",
    "englishTitle": "Aemeath Mini",
    "description": "A Q-style pixel Aemeath companion with soft expressions and small animated desktop-pet motions.",
    "category": "吉祥物",
    "author": "cuNuo",
    "authorHandle": "cuNuo",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/aemeath-mini--cunuo.webp",
    "thumbnail": "assets/pets/upstream-20261009/aemeath-mini--cunuo-thumb.webp",
    "version": 1,
    "tags": [
      "aemeath",
      "pixel-art",
      "q-style",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/aemeath-mini--cunuo",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/aemeath-mini--cunuo.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/aemeath-mini--cunuo",
    "spritesheetSha256": "f6b2677b8e16bf1b73b0425e60bb6439bac803e108e073ef9b9dc128a762a1dc",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/cuNuo"
  },
  {
    "id": "apu--xchangee",
    "title": "Apu",
    "englishTitle": "Apu",
    "description": "A round blue-and-yellow helper pet with a little hat, soft expressions, and cheerful Codex work animations.",
    "category": "吉祥物",
    "author": "tal",
    "authorHandle": "xchangee",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/apu--xchangee.webp",
    "thumbnail": "assets/pets/upstream-20261009/apu--xchangee-thumb.webp",
    "version": 1,
    "tags": [
      "apu",
      "helper",
      "round",
      "cute",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/apu--xchangee",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/apu--xchangee.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/apu--xchangee",
    "spritesheetSha256": "315868428da4962bc38bc9ce0c5e6c1ff7e52bd548b3e5ef1a527469b73f1ab6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/xchangee"
  },
  {
    "id": "arlecchino--lingxiaotian",
    "title": "阿蕾奇诺",
    "englishTitle": "Arlecchino",
    "description": "《原神》阿蕾奇诺风格的原创 Codex chibi 像素宠物，黑白红配色、短披风与冷峻锋利气质被压缩成稳定可读的小体型像素形象。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/arlecchino--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/arlecchino--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "arlecchino",
      "black-white-red",
      "stern"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/arlecchino--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/arlecchino--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/arlecchino--lingxiaotian",
    "spritesheetSha256": "aa311d2686e3a8fc7edbbbcaff2e824f821582a27694d7385c2c1416de6622e4",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "becky--natewanggg",
    "title": "Becky",
    "englishTitle": "Becky",
    "description": "A slim dark-gray mackerel tabby Codex pet based on Becky, with curled ears, very round pale yellow eyes, black paw pads, and a thin ring-striped tail.",
    "category": "动物伙伴",
    "author": "NateWanggg",
    "authorHandle": "NateWanggg",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/becky--natewanggg.webp",
    "thumbnail": "assets/pets/upstream-20261009/becky--natewanggg-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "tabby",
      "becky",
      "original-pet",
      "dark-gray"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/becky--natewanggg",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/becky--natewanggg.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/becky--natewanggg",
    "spritesheetSha256": "8e76db46a3712cabf22e426202307d8467f925d3f40d9116070345095add04f6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/NateWanggg"
  },
  {
    "id": "black-swan--lingxiaotian",
    "title": "黑天鹅",
    "englishTitle": "Black Swan",
    "description": "《崩坏：星穹铁道》黑天鹅风格的原创 Codex chibi 像素宠物，纱帽、紫黑礼服与神秘占卜师气质被压缩成稳定可读的小体型像素形象。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/black-swan--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/black-swan--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "black-swan",
      "mystic",
      "veil"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/black-swan--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/black-swan--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/black-swan--lingxiaotian",
    "spritesheetSha256": "531944d7a896777932ee15ea2480874e15a9112dc6319b4243e380de31c53ab5",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "bubu--gbn666",
    "title": "Bubu",
    "englishTitle": "Bubu",
    "description": "A soft, sleepy milk-tea-brown chibi bear desktop pet with warm cheek patches and relaxed pixel-art motions.",
    "category": "动物伙伴",
    "author": "Guo Beining",
    "authorHandle": "gbn666",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/bubu--gbn666.webp",
    "thumbnail": "assets/pets/upstream-20261009/bubu--gbn666-thumb.webp",
    "version": 1,
    "tags": [
      "bear",
      "chibi",
      "pixel-art",
      "sleepy",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bubu--gbn666",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/bubu--gbn666.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/bubu--gbn666",
    "spritesheetSha256": "6eecf5d23b066a24172017232144f717e674c6a493d12de126399837ef22db6f",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/gbn666"
  },
  {
    "id": "buttercup--legeling",
    "title": "毛毛",
    "englishTitle": "Buttercup",
    "description": "A classic green Powerpuff Girl with black flipped hair and a confident expression.",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/buttercup--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/buttercup--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "powerpuff-girls",
      "buttercup"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/buttercup--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/buttercup--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/buttercup--legeling",
    "spritesheetSha256": "8eadf67be926a4c3fca15daac6844022c9582421bc690e93e32523386f5d8635",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "castorice--lingxiaotian",
    "title": "遐蝶",
    "englishTitle": "Castorice",
    "description": "《崩坏：星穹铁道》遐蝶风格的原创 Codex chibi 像素宠物，紫黑配色、蝶形意象、长发轮廓和柔和神秘气质。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/castorice--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/castorice--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "castorice",
      "butterfly",
      "purple"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/castorice--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/castorice--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/castorice--lingxiaotian",
    "spritesheetSha256": "99c0b3504aad7f38dd239cae49412ed39a4c23ae3c24fd052e83a74bb6866372",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "chud-codex--jorge-cuevas90003",
    "title": "Chud Codex",
    "englishTitle": "Chud Codex",
    "description": "An original grimdark chibi sci-fi cadet in black-and-brass armor with a glowing red visor and an absurdly serious attitude.",
    "category": "原创角色",
    "author": "Jorge",
    "authorHandle": "Jorge-Cuevas90003",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003.webp",
    "thumbnail": "assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003-thumb.webp",
    "version": 2,
    "tags": [
      "grimdark",
      "sci-fi",
      "cadet",
      "armored",
      "chibi",
      "original",
      "ai-generated",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/chud-codex--jorge-cuevas90003",
    "license": "CC BY-NC 4.0. Original AI-assisted artwork created for and submitted by Jorge; no third-party source assets were used.",
    "download": "assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/chud-codex--jorge-cuevas90003",
    "spritesheetSha256": "e1211e3317065e70ef342f97fcc37337036c1e41ab2818db5c8c378c976dfc79",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Jorge-Cuevas90003"
  },
  {
    "id": "citlali--zaytsevzy",
    "title": "茜特菈莉",
    "englishTitle": "Citlali",
    "description": "坐在伊兹帕帕上的像素茜特菈莉。",
    "category": "游戏角色",
    "author": "ZaytsevZY",
    "authorHandle": "ZaytsevZY",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/citlali--zaytsevzy.webp",
    "thumbnail": "assets/pets/upstream-20261009/citlali--zaytsevzy-thumb.webp",
    "version": 2,
    "tags": [
      "anime",
      "genshin-impact",
      "citlali",
      "pixel-art",
      "reading"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/citlali--zaytsevzy",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/citlali--zaytsevzy.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/citlali--zaytsevzy",
    "spritesheetSha256": "9fbe935730ba52af3e80a41e6a698391b73d2a872c9fcf2a7ce9c44e9ec98ed3",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/ZaytsevZY"
  },
  {
    "id": "claude--xiangking",
    "title": "Claude",
    "englishTitle": "Claude",
    "description": "A tiny orange blocky digital pet with stubby side arms, short legs, and expressive pixel-art poses.",
    "category": "吉祥物",
    "author": "XiangWang",
    "authorHandle": "xiangking",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/claude--xiangking.webp",
    "thumbnail": "assets/pets/upstream-20261009/claude--xiangking-thumb.webp",
    "version": 1,
    "tags": [
      "orange",
      "pixel-art",
      "blocky",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/claude--xiangking",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/claude--xiangking.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/claude--xiangking",
    "spritesheetSha256": "ddab2df6b9f7c52267f6baad85d4c3a5ccceccae6ac1b0f325e97bb5348e0e75",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/xiangking"
  },
  {
    "id": "codexy--z19t",
    "title": "码灵",
    "englishTitle": "Codexy",
    "description": "An original mint-haired Codex AI assistant with hardworking task animations and a complete 16-direction look loop.",
    "category": "原创角色",
    "author": "z19t",
    "authorHandle": "z19t",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/codexy--z19t.webp",
    "thumbnail": "assets/pets/upstream-20261009/codexy--z19t-thumb.webp",
    "version": 2,
    "tags": [
      "ai-assistant",
      "anime",
      "coding",
      "codex",
      "mint-hair",
      "original",
      "terminal-companion",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/codexy--z19t",
    "license": "CC BY-NC 4.0. Original AI-generated artwork independently created and adapted by z19t; non-commercial use only.",
    "download": "assets/pets/upstream-20261009/codexy--z19t.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/codexy--z19t",
    "spritesheetSha256": "e65f68c7e7f9c8dc858e8d601f39bbe4942e3dbb889d61a06868c69289f8d1e4",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/z19t"
  },
  {
    "id": "corgi-companion--cxian0928-afk",
    "title": "Corgi Companion",
    "englishTitle": "Corgi Companion",
    "description": "A cheerful corgi companion with bright ears, a friendly grin, and playful laptop-working poses.",
    "category": "动物伙伴",
    "author": "cxian0928-afk",
    "authorHandle": "cxian0928-afk",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/corgi-companion--cxian0928-afk.webp",
    "thumbnail": "assets/pets/upstream-20261009/corgi-companion--cxian0928-afk-thumb.webp",
    "version": 1,
    "tags": [
      "corgi",
      "dog",
      "orange",
      "cute",
      "laptop",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/corgi-companion--cxian0928-afk",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/corgi-companion--cxian0928-afk.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/corgi-companion--cxian0928-afk",
    "spritesheetSha256": "7ce091d553f8c52608c80f0d61a602cd50f13459d912e1c9a9862694a77fec40",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/cxian0928-afk"
  },
  {
    "id": "crt-monitor--wxy",
    "title": "CRT 显示器",
    "englishTitle": "CRT Monitor",
    "description": "A tiny retro CRT monitor that keeps an eye on your code.",
    "category": "机器人",
    "author": "wxy",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/crt-monitor--wxy.webp",
    "thumbnail": "assets/pets/upstream-20261009/crt-monitor--wxy-thumb.webp",
    "version": 2,
    "tags": [
      "robot",
      "retro-computing",
      "crt",
      "coding"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/crt-monitor--wxy",
    "license": "CC BY 4.0",
    "download": "assets/pets/upstream-20261009/crt-monitor--wxy.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/crt-monitor--wxy",
    "spritesheetSha256": "4027e21fb235f5bc5eb992e711531dfb2ac3641eeb1056e21e338c1b28806970",
    "metadataNameAlias": false
  },
  {
    "id": "cyrene--lingxiaotian",
    "title": "昔涟",
    "englishTitle": "Cyrene",
    "description": "《崩坏：星穹铁道》昔涟风格的原创 Codex chibi 像素宠物，粉白长发、白粉蓝礼裙、羽叶状头饰与轻盈梦幻气质被压缩成稳定可读的小体型像素形象。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/cyrene--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/cyrene--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "cyrene",
      "pink",
      "dreamy"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/cyrene--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/cyrene--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/cyrene--lingxiaotian",
    "spritesheetSha256": "451b409ab66cc60ab1e7f06136a0cb8c76dbb147816c779d57675912becb36b0",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "desk-otter--zihualiu1997",
    "title": "Desk Otter",
    "englishTitle": "Desk Otter",
    "description": "A bespectacled desk-worker otter mascot in a blue shirt, animated for Codex task states.",
    "category": "动物伙伴",
    "author": "zihualiu1997",
    "authorHandle": "zihualiu1997",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/desk-otter--zihualiu1997.webp",
    "thumbnail": "assets/pets/upstream-20261009/desk-otter--zihualiu1997-thumb.webp",
    "version": 1,
    "tags": [
      "otter",
      "desk-worker",
      "glasses",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/desk-otter--zihualiu1997",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/desk-otter--zihualiu1997.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/desk-otter--zihualiu1997",
    "spritesheetSha256": "e48f36365aab834bcd8f6fd21a21727eced21fb1ff2940bf5e5980bebe85e18e",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/zihualiu1997"
  },
  {
    "id": "diandian--lllucasxu",
    "title": "Diandian",
    "englishTitle": "Diandian",
    "description": "A calm tabby-and-white cat companion with a sleepy face and gentle curled-up poses.",
    "category": "动物伙伴",
    "author": "LLLucasXU",
    "authorHandle": "LLLucasXU",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/diandian--lllucasxu.webp",
    "thumbnail": "assets/pets/upstream-20261009/diandian--lllucasxu-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "tabby",
      "sleepy",
      "calm",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/diandian--lllucasxu",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/diandian--lllucasxu.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/diandian--lllucasxu",
    "spritesheetSha256": "276cd3263e708dd43ca03919305dd75827b99d0d9012e70a8cf5b4be502714d4",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/LLLucasXU"
  },
  {
    "id": "diaoyi-baobao--d1a0y1bb",
    "title": "Diaoyi Baobao",
    "englishTitle": "Diaoyi Baobao",
    "description": "A tiny green clover-like companion with a round face and gentle, cheerful expressions.",
    "category": "吉祥物",
    "author": "D1a0y1bb",
    "authorHandle": "D1a0y1bb",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb.webp",
    "thumbnail": "assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb-thumb.webp",
    "version": 1,
    "tags": [
      "clover",
      "green",
      "mascot",
      "cute",
      "round",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/diaoyi-baobao--d1a0y1bb",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/diaoyi-baobao--d1a0y1bb",
    "spritesheetSha256": "585e5c3f39021699d7671a450d9e9b77f1f73d0099560fcbdbed2e457a917bc6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/D1a0y1bb"
  },
  {
    "id": "doro--lingxiaotian",
    "title": "桃乐丝（Doro）",
    "englishTitle": "Doro",
    "description": "A compact Codex digital pet inspired by Doro, the vacant pink-haired Dorothy meme creature from Goddess of Victory: NIKKE.",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/doro--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/doro--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "nikke",
      "doro",
      "dorothy",
      "meme",
      "pink-hair"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/doro--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/doro--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "nikke"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/doro--lingxiaotian",
    "spritesheetSha256": "f0661f6f0b1297e54d40a33f0ecfa5c8ef76c88d5b92c4edd7dd76e9ca99872c",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "evanescia-lunar-blossoming--jasdfgh",
    "title": "绯英 · 月待花时",
    "englishTitle": "Evanescia · Lunar Blossoming",
    "description": "沉迷漫画的读者，热衷祭典的游客  ，亦是幻月游戏的守护者。绯英换上「月待花时」，笑里藏三分狡黠，腰间悬一柄尺刃。",
    "category": "游戏角色",
    "author": "Jasdfgh",
    "authorHandle": "Jasdfgh",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh.webp",
    "thumbnail": "assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh-thumb.webp",
    "version": 2,
    "tags": [
      "honkai-star-rail",
      "anime",
      "chibi",
      "pink"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/evanescia-lunar-blossoming--jasdfgh",
    "license": "CC BY-NC 4.0 for the submitter's licensable contributions; non-commercial use only. Original Honkai: Star Rail / HoYoverse character, outfit, and other third-party intellectual property are excluded. Unofficial fan art; no official affiliation or endorsement.",
    "download": "assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/evanescia-lunar-blossoming--jasdfgh",
    "spritesheetSha256": "b3ffe93e45b846fce1559471f66cb5328994ea6a4c7f72fbb0cc91914a68a072",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Jasdfgh"
  },
  {
    "id": "feixiao--lingxiaotian",
    "title": "飞霄",
    "englishTitle": "Feixiao",
    "description": "崩坏：星穹铁道飞霄风格的原创 Codex chibi 像素宠物，将军轮廓、青白配色、利落运动姿态。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/feixiao--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/feixiao--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "feixiao",
      "teal",
      "general"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/feixiao--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/feixiao--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/feixiao--lingxiaotian",
    "spritesheetSha256": "7ad0f3f3561e8056b195b11e95090fb228b9bcb0fb3958725ce1380d4353f7e1",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "fleta--natewanggg",
    "title": "Fleta",
    "englishTitle": "Fleta",
    "description": "A cute pixel-art-adjacent Codex pet based on Fleta, a plush silver-white cat with round cheeks, big blue-gray eyes, tiny paws, and soft gray shading.",
    "category": "动物伙伴",
    "author": "NateWanggg",
    "authorHandle": "NateWanggg",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/fleta--natewanggg.webp",
    "thumbnail": "assets/pets/upstream-20261009/fleta--natewanggg-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "silver-white",
      "fleta",
      "original-pet",
      "soft"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/fleta--natewanggg",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/fleta--natewanggg.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/fleta--natewanggg",
    "spritesheetSha256": "e50eaf9d33e425fee880de1a7715606a729f478ca926def0ead5f3e8240e3a2d",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/NateWanggg"
  },
  {
    "id": "frankie--aygunvarol",
    "title": "Frankie",
    "englishTitle": "Frankie",
    "description": "A cute sausage dog companion with a long dachshund body, floppy ears, and bright friendly eyes.",
    "category": "动物伙伴",
    "author": "Aygun Varol",
    "authorHandle": "AygunVarol",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/frankie--aygunvarol.webp",
    "thumbnail": "assets/pets/upstream-20261009/frankie--aygunvarol-thumb.webp",
    "version": 1,
    "tags": [
      "dachshund",
      "dog",
      "sausage-dog",
      "cute",
      "brown",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/frankie--aygunvarol",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/frankie--aygunvarol.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/frankie--aygunvarol",
    "spritesheetSha256": "93d4bd6c9cb42ca7a18a71cbe2ee3587a2a8973f41a8d65e760f1328879e8aa1",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/AygunVarol"
  },
  {
    "id": "frieren--lingxiaotian",
    "title": "芙莉莲",
    "englishTitle": "Frieren",
    "description": "A compact Codex digital pet inspired by Frieren, a calm elven mage companion.",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/frieren--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/frieren--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "elf",
      "mage",
      "fantasy",
      "frieren"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/frieren--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/frieren--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "frieren"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/frieren--lingxiaotian",
    "spritesheetSha256": "539f740b954e499ffd56f837cfe0afe4a522e56fe9c9dde134f50b7252a4a7b9",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "furina--lingxiaotian",
    "title": "芙宁娜",
    "englishTitle": "Furina",
    "description": "《原神》芙宁娜风格的原创 Codex chibi 像素宠物，蓝白礼帽、舞台感和俏皮戏剧表情。.",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/furina--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/furina--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "furina",
      "fontaine",
      "theatrical"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/furina--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/furina--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/furina--lingxiaotian",
    "spritesheetSha256": "91cb4fbb0dc747783e83cb6d09e58476c6adc7d53dd8294c1d609e975c93b99a",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "golden-lamp--legeling",
    "title": "Golden Lamp",
    "englishTitle": "Golden Lamp",
    "description": "An AI-generated golden-lamp sprite based on the reference supplied in request #149. Sprite-only lamp interpretation; the intended request subject and remaining request scope are unresolved pending requester confirmation.",
    "category": "其他",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/golden-lamp--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/golden-lamp--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "gold-lamp",
      "ai-generated",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/golden-lamp--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only; commercial use is prohibited. Rights in the requester-supplied reference image and any depicted or referenced characters remain with their respective rights holders. This is an unofficial AI-generated community interpretation.",
    "download": "assets/pets/upstream-20261009/golden-lamp--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/golden-lamp--legeling",
    "spritesheetSha256": "bad38befd0eaccf0ce9f96adfc08eced1a1cd9d865317dffbdc40efb51539024",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "hajimi--zeyuwang1999",
    "title": "Hajimi",
    "englishTitle": "Hajimi",
    "description": "A cute purple-haired cat-eared companion with soft expressions and Codex-optimized desktop-pet animations.",
    "category": "原创角色",
    "author": "zeyu.wang",
    "authorHandle": "zeyuwang1999",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/hajimi--zeyuwang1999.webp",
    "thumbnail": "assets/pets/upstream-20261009/hajimi--zeyuwang1999-thumb.webp",
    "version": 1,
    "tags": [
      "hajimi",
      "cat-ears",
      "purple",
      "cute",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hajimi--zeyuwang1999",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/hajimi--zeyuwang1999.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/hajimi--zeyuwang1999",
    "spritesheetSha256": "0a203ff15f0cdd503b54743c5d27c4d67c355c2359f91ceedacf449493e11a4f",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/zeyuwang1999"
  },
  {
    "id": "hana2--initiatione",
    "title": "Hana2",
    "englishTitle": "Hana2",
    "description": "A refined kimono-style Hana pixel pet with gentle expressions, floral details, and calm desktop-pet animations.",
    "category": "原创角色",
    "author": "initiatione",
    "authorHandle": "initiatione",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/hana2--initiatione.webp",
    "thumbnail": "assets/pets/upstream-20261009/hana2--initiatione-thumb.webp",
    "version": 1,
    "tags": [
      "hana",
      "kimono",
      "pixel-art",
      "gentle",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hana2--initiatione",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/hana2--initiatione.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/hana2--initiatione",
    "spritesheetSha256": "ddbc017778f7824709cc0b9d2774022c18486b4449f47073891e406b2e5712af",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/initiatione"
  },
  {
    "id": "hu-tao--lingxiaotian",
    "title": "胡桃",
    "englishTitle": "Hu Tao",
    "description": "《原神》胡桃风格的原创 Codex chibi 像素宠物，往生堂帽子、梅花眼与俏皮灵动气质被压缩成稳定可读的小体型像素形象。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/hu-tao--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/hu-tao--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "hu-tao",
      "black-red",
      "playful"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hu-tao--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/hu-tao--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/hu-tao--lingxiaotian",
    "spritesheetSha256": "9dc7651a1d8b7074ff9d506ef57059805b6c3e23d15841dc54199292c7fce183",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "iris--yau-427",
    "title": "Iris",
    "englishTitle": "Iris",
    "description": "A cheerful manga-pop companion who works at her laptop inside a chunky neon terminal window.",
    "category": "原创角色",
    "author": "Yau-427",
    "authorHandle": "Yau-427",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/iris--yau-427.webp",
    "thumbnail": "assets/pets/upstream-20261009/iris--yau-427-thumb.webp",
    "version": 2,
    "tags": [
      "anime",
      "manga-pop",
      "cyberpunk",
      "neon",
      "coding",
      "terminal",
      "coffee",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/iris--yau-427",
    "license": "MIT License; original AI-assisted artwork submitted by Yau-427 with redistribution permission.",
    "download": "assets/pets/upstream-20261009/iris--yau-427.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/iris--yau-427",
    "spritesheetSha256": "9549db84e558ecc3477853c95b81a84f50447ccd32566ff5cf22520f2785b9da",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Yau-427"
  },
  {
    "id": "isekaijoucho--siiverash",
    "title": "Isekaijoucho",
    "englishTitle": "Isekaijoucho",
    "description": "An Isekaijoucho-inspired fan-art Codex pet with long wavy silver hair, a vivid blue flower ornament, a white-and-ice-blue dress palette, and a compact chibi pixel sprite identity.",
    "category": "动漫角色",
    "author": "SiIverAsh",
    "authorHandle": "SiIverAsh",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/isekaijoucho--siiverash.webp",
    "thumbnail": "assets/pets/upstream-20261009/isekaijoucho--siiverash-thumb.webp",
    "version": 1,
    "tags": [
      "kamitsubaki-studio",
      "isekaijoucho",
      "virtual-singer",
      "pixel-art",
      "hatch-pet"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/isekaijoucho--siiverash",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/isekaijoucho--siiverash.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "kamitsubaki-studio"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/isekaijoucho--siiverash",
    "spritesheetSha256": "6863ba09b86a8a8f50bdf90e07ac149ea0c9269c1e2e6323b60d29dfd58cb2a1",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/SiIverAsh"
  },
  {
    "id": "joker--oytyo",
    "title": "Joker",
    "englishTitle": "Joker",
    "description": "A pixel-art theatrical card trickster in a tailored purple-black suit with green-black hair, painted eyes, playing-card animations, and 16-way looking directions.",
    "category": "原创角色",
    "author": "oYTYo",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/joker--oytyo.webp",
    "thumbnail": "assets/pets/upstream-20261009/joker--oytyo-thumb.webp",
    "version": 2,
    "tags": [
      "pixel-art",
      "card-trickster",
      "theatrical",
      "playing-cards"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/joker--oytyo",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/joker--oytyo.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/joker--oytyo",
    "spritesheetSha256": "39b74779641dd5cbe1947ee1f1463c8fbeffc66e8793c014696bbe67935f1cef",
    "metadataNameAlias": false
  },
  {
    "id": "kamisato-ayaka--lingxiaotian",
    "title": "神里绫华",
    "englishTitle": "Kamisato Ayaka",
    "description": "《原神》神里绫华风格的原创 Codex chibi 像素宠物，蓝白配色、公主切轮廓与安静优雅的稻妻大小姐气质。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "kamisato-ayaka",
      "cryo",
      "blue"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kamisato-ayaka--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/kamisato-ayaka--lingxiaotian",
    "spritesheetSha256": "2e4a779f8a1d8c8ab4199d4ccf4f0f609bd1307323bfea7005bf5b73fe259f58",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "katana-cheems--thankyou-cheems",
    "title": "Katana Cheems",
    "englishTitle": "Katana Cheems",
    "description": "A pixel-art Cheems pet wearing a straw hat, carrying a tiny katana, and crying a blue meme tear when a Codex task fails.",
    "category": "网络梗图",
    "author": "Thankyou-Cheems",
    "authorHandle": "Thankyou-Cheems",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/katana-cheems--thankyou-cheems.webp",
    "thumbnail": "assets/pets/upstream-20261009/katana-cheems--thankyou-cheems-thumb.webp",
    "version": 1,
    "tags": [
      "cheems",
      "dog",
      "shiba",
      "katana",
      "straw-hat",
      "pixel-art",
      "meme",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/katana-cheems--thankyou-cheems",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/katana-cheems--thankyou-cheems.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/katana-cheems--thankyou-cheems",
    "spritesheetSha256": "467ada74e238f6b27b85a010e6825eb0e3e8dd864d9f0143849e60301bd9498e",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Thankyou-Cheems"
  },
  {
    "id": "kiko--untko",
    "title": "Kiko",
    "englishTitle": "Kiko",
    "description": "A cheerful color-changing gecko companion with expressive animations and curious eyes.",
    "category": "动物伙伴",
    "author": "untko",
    "authorHandle": "untko",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/kiko--untko.webp",
    "thumbnail": "assets/pets/upstream-20261009/kiko--untko-thumb.webp",
    "version": 2,
    "tags": [
      "gecko",
      "animal",
      "3d-toy",
      "color-changing",
      "expressive",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kiko--untko",
    "license": "CC BY-NC 4.0. The creator owns or controls the Kiko artwork and authorizes its redistribution and modification under CC BY-NC 4.0, without warranty.",
    "download": "assets/pets/upstream-20261009/kiko--untko.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/kiko--untko",
    "spritesheetSha256": "dadeab52face9c15e29a9e5e28ae3860b9634ebf4ce7aca42b59c484bd6f3a2f",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/untko"
  },
  {
    "id": "kurimanju--legeling",
    "title": "栗子馒头",
    "englishTitle": "Kurimanju",
    "description": "The flushed brown-crowned Chiikawa character with four blush strokes on each cheek.",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/kurimanju--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/kurimanju--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "chiikawa",
      "kurimanju"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kurimanju--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/kurimanju--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/kurimanju--legeling",
    "spritesheetSha256": "aeba2fd4e4e9290c8f794decf68563176bef816e313d0cafc6e30c6ef1122cb2",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "lil-swole--gg0805",
    "title": "Lil Swole",
    "englishTitle": "Lil Swole",
    "description": "A cultured, gloriously brainrotted gym-rat icon who curls a computer mouse while his parrot wingman launches dumbbells.",
    "category": "动物伙伴",
    "author": "gg0805",
    "authorHandle": "gg0805",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/lil-swole--gg0805.webp",
    "thumbnail": "assets/pets/upstream-20261009/lil-swole--gg0805-thumb.webp",
    "version": 2,
    "tags": [
      "rat",
      "gym",
      "streetwear",
      "parrot",
      "sticker",
      "original",
      "codex-generated",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/lil-swole--gg0805",
    "license": "CC BY-NC 4.0. Original AI-generated artwork created for and submitted by gg0805; no third-party source assets were used.",
    "download": "assets/pets/upstream-20261009/lil-swole--gg0805.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/lil-swole--gg0805",
    "spritesheetSha256": "3ef92b0f66ab097c75b2e9f5bb03c299c4140e20fe0802228f2c5f3fd2bcf810",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/gg0805"
  },
  {
    "id": "little-sheep--mingdong",
    "title": "Little Sheep",
    "englishTitle": "Little Sheep",
    "description": "A fluffy cream sheep with wine-red horns, made as a cozy Codex companion that grazes, waits, and trots in tiny loops.",
    "category": "动物伙伴",
    "author": "MingDong",
    "authorHandle": "MingDong",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/little-sheep--mingdong.webp",
    "thumbnail": "assets/pets/upstream-20261009/little-sheep--mingdong-thumb.webp",
    "version": 1,
    "tags": [
      "sheep",
      "animal",
      "fluffy",
      "wine-red-horns",
      "cozy"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/little-sheep--mingdong",
    "license": "CC BY-NC 4.0. Original AI-assisted asset created by MingDong for Codex pet submission; no third-party source asset.",
    "download": "assets/pets/upstream-20261009/little-sheep--mingdong.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/little-sheep--mingdong",
    "spritesheetSha256": "af80e8c26246720152ce425c44b3e10606df56351477e916044103832a0248b3",
    "metadataNameAlias": false
  },
  {
    "id": "lulu--yogazz",
    "title": "Lulu",
    "englishTitle": "Lulu",
    "description": "A cheerful rounded yellow-orange 3D toy companion for Codex.",
    "category": "吉祥物",
    "author": "YoGazz",
    "authorHandle": "YoGazz",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/lulu--yogazz.webp",
    "thumbnail": "assets/pets/upstream-20261009/lulu--yogazz-thumb.webp",
    "version": 1,
    "tags": [
      "original",
      "3d-toy",
      "yellow-orange",
      "codex-pet"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/lulu--yogazz",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/lulu--yogazz.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/lulu--yogazz",
    "spritesheetSha256": "459bf8ce95e855331bdd81de48b8466a46a1df72e6fdef45a77213eda89373a3",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/YoGazz"
  },
  {
    "id": "mahiro--lingxiaotian",
    "title": "绪山真寻",
    "englishTitle": "Mahiro",
    "description": "A shy Codex digital pet inspired by Mahiro Oyama from ONIMAI, wearing an oversized off-shoulder summer shirt.",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mahiro--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/mahiro--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "onimai",
      "mahiro",
      "oyama-mahiro",
      "off-shoulder"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mahiro--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/mahiro--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "onimai"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mahiro--lingxiaotian",
    "spritesheetSha256": "a9222f3db52ff004814e12897baee2c2b86240749526de45ec418c21125156ec",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "mai--dwdestiny",
    "title": "Mai",
    "englishTitle": "Mai",
    "description": "A cool and fluffy white bichon-style puppy boss with round sunglasses, an orange bow tie, and playful work animations.",
    "category": "动物伙伴",
    "author": "DwDestiny",
    "authorHandle": "DwDestiny",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mai--dwdestiny.webp",
    "thumbnail": "assets/pets/upstream-20261009/mai--dwdestiny-thumb.webp",
    "version": 1,
    "tags": [
      "dog",
      "bichon",
      "puppy",
      "sunglasses",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mai--dwdestiny",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/mai--dwdestiny.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mai--dwdestiny",
    "spritesheetSha256": "dde0f307bd046cd5f9bd72103bfcac22c4b2f892a002e6bad545aa5132ebc697",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/DwDestiny"
  },
  {
    "id": "mihari--hyoni1129",
    "title": "Mihari",
    "englishTitle": "Mihari",
    "description": "Unofficial fan-made Codex pet inspired by Mihari Oyama from ONIMAI, adapted as a tiny caring chibi pixel-art lab assistant with smoother directional motion, notebook task-processing, and clipboard review states.",
    "category": "动漫角色",
    "author": "Jeonghan Lee (@Hyoni1129)",
    "authorHandle": "Hyoni1129",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mihari--hyoni1129.webp",
    "thumbnail": "assets/pets/upstream-20261009/mihari--hyoni1129-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "onimai",
      "mihari",
      "scientist",
      "lab-coat",
      "fan-art"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mihari--hyoni1129",
    "license": "CC BY-NC 4.0; unofficial fan-made non-commercial pet; no official ONIMAI artwork, screenshots, logos, or source assets are included; underlying character rights belong to their respective rights holders.",
    "download": "assets/pets/upstream-20261009/mihari--hyoni1129.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "onimai"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mihari--hyoni1129",
    "spritesheetSha256": "edc0709882db81345f6365eec499cdef9f67cb76876284228f367c662ff69e68",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Hyoni1129"
  },
  {
    "id": "mika--rotl24",
    "title": "Mika",
    "englishTitle": "Mika",
    "description": "A cozy long-haired chibi companion in headphones, scarf, and school-style winter clothes.",
    "category": "原创角色",
    "author": "ROTl24",
    "authorHandle": "ROTl24",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mika--rotl24.webp",
    "thumbnail": "assets/pets/upstream-20261009/mika--rotl24-thumb.webp",
    "version": 1,
    "tags": [
      "mika",
      "chibi",
      "headphones",
      "winter",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mika--rotl24",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/mika--rotl24.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mika--rotl24",
    "spritesheetSha256": "5b0f19306e0a4d12393875004bf700dd5cf35d59a1d3c14bc31cc4a8062e2f9c",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/ROTl24"
  },
  {
    "id": "mikoto--lingxiaotian",
    "title": "御坂美琴",
    "englishTitle": "Mikoto",
    "description": "A chibi electric schoolgirl Codex pet with coin tricks inspired by Misaka Mikoto.",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mikoto--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/mikoto--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "a-certain-scientific-railgun",
      "electric",
      "schoolgirl",
      "misaka-mikoto"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mikoto--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/mikoto--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "a-certain-scientific-railgun"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mikoto--lingxiaotian",
    "spritesheetSha256": "1765adf93fd65916a6f1cae8670d8df0afa30231fc8214999c98ebefb0a4c5c2",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "miku--lingxiaotian",
    "title": "初音未来",
    "englishTitle": "Miku",
    "description": "A compact Codex digital pet inspired by Hatsune Miku, a bright virtual idol singer.",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/miku--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/miku--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "virtual-idol",
      "teal-hair",
      "twintails",
      "miku"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/miku--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/miku--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/miku--lingxiaotian",
    "spritesheetSha256": "6212ca761be1278b1dbcba214e2c8a0f637f0b526eb4e3692994f74e750e502c",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "mimi--spacebody",
    "title": "Mimi",
    "englishTitle": "Mimi",
    "description": "A silver tabby American Shorthair kitten companion with bright green eyes and playful desktop-pet motions.",
    "category": "动物伙伴",
    "author": "Jerry",
    "authorHandle": "Spacebody",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mimi--spacebody.webp",
    "thumbnail": "assets/pets/upstream-20261009/mimi--spacebody-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "kitten",
      "tabby",
      "cute",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mimi--spacebody",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/mimi--spacebody.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mimi--spacebody",
    "spritesheetSha256": "f8acfb98b864a717a5876fc7a4ce696b2bced4998c62b913b4ddec30721760a0",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Spacebody"
  },
  {
    "id": "minty--somnusochi",
    "title": "Minty",
    "englishTitle": "Minty",
    "description": "A mint-haired animated companion with nine activity animations and sixteen v2 look directions.",
    "category": "原创角色",
    "author": "Somnusochi",
    "authorHandle": "Somnusochi",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/minty--somnusochi.webp",
    "thumbnail": "assets/pets/upstream-20261009/minty--somnusochi-thumb.webp",
    "version": 2,
    "tags": [
      "mint",
      "anime",
      "look-directions",
      "pixel-art",
      "codex-v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/minty--somnusochi",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/minty--somnusochi.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/minty--somnusochi",
    "spritesheetSha256": "f50fa768ae82a9874a9429174d0dc69f35ff0937f827a1f5805317ca3a6f4d89",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Somnusochi"
  },
  {
    "id": "misaka-network--ldl1234",
    "title": "御坂网络",
    "englishTitle": "Misaka Network",
    "description": "御坂网络风格的 v2 Codex 像素宠物，穿米色校服外套、红领结与蓝灰格裙，保留黑猫、机械装备、电流和巨大风机效果，并支持 16 个环视方向。",
    "category": "动漫角色",
    "author": "LyuDonglian",
    "authorHandle": "ldl1234",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/misaka-network--ldl1234.webp",
    "thumbnail": "assets/pets/upstream-20261009/misaka-network--ldl1234-thumb.webp",
    "version": 2,
    "tags": [
      "anime",
      "a-certain-scientific-railgun",
      "electric",
      "schoolgirl",
      "misaka-network",
      "pixel-art"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/misaka-network--ldl1234",
    "license": "MIT",
    "download": "assets/pets/upstream-20261009/misaka-network--ldl1234.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "a-certain-scientific-railgun"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/misaka-network--ldl1234",
    "spritesheetSha256": "18f63c26660ab453cf0f575c9c8c3a82b125121adb53821602bb1884ab4ef44b",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/ldl1234"
  },
  {
    "id": "missile--zpzjzj",
    "title": "Missile",
    "englishTitle": "Missile",
    "description": "An energetic orange Pomeranian inspired by Ghost Trick's loyal Missile, with a huge cream ruff, curled plume tail, and joyful expression.",
    "category": "游戏角色",
    "author": "Ping",
    "authorHandle": "zpzjzj",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/missile--zpzjzj.webp",
    "thumbnail": "assets/pets/upstream-20261009/missile--zpzjzj-thumb.webp",
    "version": 2,
    "tags": [
      "ghost-trick",
      "missile",
      "dog",
      "pomeranian",
      "flat-vector"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/missile--zpzjzj",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/missile--zpzjzj.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/missile--zpzjzj",
    "spritesheetSha256": "007969983fc73bb30e601713e61bc25bf78f3590b5ae432f755d39d3efc619cb",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/zpzjzj"
  },
  {
    "id": "my-little-orange-cat--zhou-jianwen",
    "title": "My Little Orange Cat",
    "englishTitle": "My Little Orange Cat",
    "description": "A softly illustrated orange-and-white cat inspired by community request #179.",
    "category": "其他",
    "author": "zhou-jianwen",
    "authorHandle": "zhou-jianwen",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen.webp",
    "thumbnail": "assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen-thumb.webp",
    "version": 2,
    "tags": [
      "cat",
      "community-request"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/my-little-orange-cat--zhou-jianwen",
    "license": "Non-commercial use and redistribution only, with credit to zhou-jianwen for this AI-assisted pet contribution. Commercial use is prohibited. No ownership or license over the submitted reference photograph is asserted or granted.",
    "download": "assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/my-little-orange-cat--zhou-jianwen",
    "spritesheetSha256": "90f70801768beef9a0d9d66a28371c0e9e7635b40eed27d96fd6427c56975ec4",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/zhou-jianwen"
  },
  {
    "id": "nahida--lingxiaotian",
    "title": "纳西妲",
    "englishTitle": "Nahida",
    "description": "《原神》纳西妲风格的原创 Codex chibi 像素宠物，白绿配色、叶饰轮廓与轻盈温柔的森林精灵气质。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/nahida--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/nahida--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "nahida",
      "dendro",
      "green"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/nahida--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/nahida--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/nahida--lingxiaotian",
    "spritesheetSha256": "ee20f2d7996c296be86895af0413e02adfaf81705ff6373927cab39d394b8ebb",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "navia--lingxiaotian",
    "title": "娜维娅",
    "englishTitle": "Navia",
    "description": "《原神》娜维娅风格的原创 Codex chibi 像素宠物，黄黑礼服、宽檐帽与明亮大小姐气质被压缩成稳定可读的小体型像素形象。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/navia--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/navia--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "navia",
      "gold",
      "elegant"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/navia--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/navia--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/navia--lingxiaotian",
    "spritesheetSha256": "daf0ad82f6ebd07e32e6a6833e6a7eb2465520cf05080959d66d8db624955052",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "night-neko--netizenxuan",
    "title": "Night Neko",
    "englishTitle": "Night Neko",
    "description": "A white cat-demon desktop companion with sleepy eyes, red-black bat wings, gothic stripes, one fluffy tail, and late-night coding energy.",
    "category": "幻想生物",
    "author": "netizenXuan",
    "authorHandle": "netizenXuan",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/night-neko--netizenxuan.webp",
    "thumbnail": "assets/pets/upstream-20261009/night-neko--netizenxuan-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "demon",
      "gothic",
      "night",
      "coding",
      "cyberpunk",
      "chibi"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/night-neko--netizenxuan",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/night-neko--netizenxuan.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/night-neko--netizenxuan",
    "spritesheetSha256": "0762cd9a14129b765a030fe5a35785faa2d6e466fb080a7607e42a6bd765c4a2",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/netizenXuan"
  },
  {
    "id": "niu-lai--wynn",
    "title": "Niu Lai",
    "englishTitle": "Niu Lai",
    "description": "An unofficial, AI-generated Niu Lai fan-art calf companion, patient during approvals and curious during research.",
    "category": "动漫角色",
    "author": "wynn",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/niu-lai--wynn.webp",
    "thumbnail": "assets/pets/upstream-20261009/niu-lai--wynn-thumb.webp",
    "version": 2,
    "tags": [
      "fan-art",
      "3d",
      "ai-generated",
      "orange",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/niu-lai--wynn",
    "license": "Non-commercial use and redistribution only, with credit to wynn, to the extent wynn holds rights in this contribution. The underlying Niu Lai film character and reference imagery remain subject to third-party rights; no permission from their rightsholders is asserted or granted. Unofficial fan art; no affiliation or endorsement. These terms do not establish third-party rights clearance.",
    "download": "assets/pets/upstream-20261009/niu-lai--wynn.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/niu-lai--wynn",
    "spritesheetSha256": "75b1809e88d6e4bebcb040f9a3dcffdb1eed1964dd86366527bb95ea7d26b575",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/zhou-jianwen"
  },
  {
    "id": "paimon--lingxiaotian",
    "title": "派蒙",
    "englishTitle": "Paimon",
    "description": "A compact Codex digital pet inspired by Paimon, the floating companion from Genshin Impact.",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/paimon--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/paimon--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "paimon",
      "floating-companion",
      "white-hair"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/paimon--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/paimon--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/paimon--lingxiaotian",
    "spritesheetSha256": "489946a931de1f561c50d2e6941c82707d5703b6073b5169b6bc5c607459aea6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "panda--jason-bai",
    "title": "Panda",
    "englishTitle": "Panda",
    "description": "A soft, healing panda companion with round eyes, tiny paws, and gentle calming poses.",
    "category": "动物伙伴",
    "author": "Jason Bai",
    "authorHandle": "Jason-Bai",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/panda--jason-bai.webp",
    "thumbnail": "assets/pets/upstream-20261009/panda--jason-bai-thumb.webp",
    "version": 1,
    "tags": [
      "panda",
      "soft",
      "healing",
      "cute",
      "gentle",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/panda--jason-bai",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/panda--jason-bai.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/panda--jason-bai",
    "spritesheetSha256": "a7c9d21f98af24566daa8fbbd67b65e6b48572eec885165d7b86c5a4311fb325",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Jason-Bai"
  },
  {
    "id": "pixel-duck--flamurmaliqi",
    "title": "Pixel Duck",
    "englishTitle": "Pixel Duck",
    "description": "An original pixel duck that spins through the same eight-frame loop in every Codex state.",
    "category": "动物伙伴",
    "author": "Flamur Maliqi",
    "authorHandle": "FlamurMaliqi",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/pixel-duck--flamurmaliqi.webp",
    "thumbnail": "assets/pets/upstream-20261009/pixel-duck--flamurmaliqi-thumb.webp",
    "version": 1,
    "tags": [
      "duck",
      "pixel-art",
      "spin",
      "codex-pets"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/pixel-duck--flamurmaliqi",
    "license": "CC BY 4.0",
    "download": "assets/pets/upstream-20261009/pixel-duck--flamurmaliqi.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/pixel-duck--flamurmaliqi",
    "spritesheetSha256": "88ca26717528fe1d01fcba2a649cc5633e40ea886e3b028ffab25654787a87da",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/FlamurMaliqi"
  },
  {
    "id": "potato--legeling",
    "title": "Potato",
    "englishTitle": "Potato",
    "description": "A plain ochre pixel potato with a stepped outline and gentle organic movements.",
    "category": "物件与道具",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/potato--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/potato--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/potato--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/potato--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/potato--legeling",
    "spritesheetSha256": "48531925a56a4808f822cccfe6b6e91ec0a4bdc0c70f5270d935e98f273c5d98",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "raiden-shogun--lingxiaotian",
    "title": "雷电将军",
    "englishTitle": "Raiden Shogun",
    "description": "《原神》雷电将军风格的原创 Codex chibi 像素宠物，紫色长发、电元素紫光点缀、和风服饰轮廓与威严冷静的神明气质。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/raiden-shogun--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/raiden-shogun--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "raiden-shogun",
      "electro",
      "purple"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/raiden-shogun--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/raiden-shogun--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/raiden-shogun--lingxiaotian",
    "spritesheetSha256": "5eed45f5082a086facf960007b8cc1fab00abe01c1ebc2fdd1a6dd2e418e8ca4",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "reimu--lingxiaotian",
    "title": "博丽灵梦",
    "englishTitle": "Reimu",
    "description": "A compact Codex digital pet inspired by Hakurei Reimu, a calm shrine maiden from Touhou.",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/reimu--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/reimu--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "touhou",
      "touhou-project",
      "shrine-maiden",
      "reimu",
      "hakurei-reimu"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/reimu--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/reimu--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "touhou-project"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/reimu--lingxiaotian",
    "spritesheetSha256": "b438b769665feb0c2c5c6f87d489af4d7eb3515e89c6ef19222587d4e9cf1677",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "rinami--siiverash",
    "title": "Rinami Himesaki",
    "englishTitle": "Rinami Himesaki",
    "description": "A Rinami Himesaki-inspired fan-art Codex pet with long wavy light-brown hair, crown-braid styling, a navy-and-gold school-uniform palette, and a compact chibi pixel sprite identity.",
    "category": "动漫角色",
    "author": "SiIverAsh",
    "authorHandle": "SiIverAsh",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/rinami--siiverash.webp",
    "thumbnail": "assets/pets/upstream-20261009/rinami--siiverash-thumb.webp",
    "version": 1,
    "tags": [
      "gakuen-idolmaster",
      "rinami-himesaki",
      "pixel-art",
      "hatch-pet"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/rinami--siiverash",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/rinami--siiverash.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "gakuen-idolmaster"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/rinami--siiverash",
    "spritesheetSha256": "1547fb38ec66c26f0426984e0efe5c051febf11d78250695e4defa13c9fa1f75",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/SiIverAsh"
  },
  {
    "id": "robin--lingxiaotian",
    "title": "知更鸟",
    "englishTitle": "Robin",
    "description": "《崩坏：星穹铁道》知更鸟风格的原创 Codex chibi 像素宠物，浅蓝白礼服、分叉金色光环与歌姬气质被压缩成稳定的小体型像素形象。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/robin--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/robin--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "robin",
      "angelic",
      "blue"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/robin--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/robin--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/robin--lingxiaotian",
    "spritesheetSha256": "2a34d75d2aab0385b12d9b920c9aa30e6804dd74505eebc08308715459a6ca8b",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "ruan-mei--lingxiaotian",
    "title": "阮·梅",
    "englishTitle": "Ruan Mei",
    "description": "崩坏：星穹铁道阮梅风格的原创 Codex chibi 像素宠物，青绿渐变、梅花/琴弦感、冷静表情。.",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/ruan-mei--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/ruan-mei--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "ruan-mei",
      "teal",
      "elegant"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/ruan-mei--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/ruan-mei--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/ruan-mei--lingxiaotian",
    "spritesheetSha256": "829c613e78e4c9b3b0e727984f1077ca88c98e17c16a219837ebdd258ed7ad05",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "ruruka--ltmcliao-cmyk",
    "title": "RuRuKa",
    "englishTitle": "RuRuKa",
    "description": "RuRuKa is a 3D-style black-and-cream glasses companion with expressive Codex workflow animations.",
    "category": "原创角色",
    "author": "ltmcliao-cmyk",
    "authorHandle": "ltmcliao-cmyk",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk.webp",
    "thumbnail": "assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk-thumb.webp",
    "version": 1,
    "tags": [
      "ruruka",
      "3d",
      "glasses",
      "animated",
      "codex",
      "workflow"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/ruruka--ltmcliao-cmyk",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/ruruka--ltmcliao-cmyk",
    "spritesheetSha256": "9bec1eb0abf2ba4c28d397782f64b08ff7cb6aeb4b533338e7989cec6215c55c",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/ltmcliao-cmyk"
  },
  {
    "id": "saki--rookie-09",
    "title": "Saki",
    "englishTitle": "Saki",
    "description": "A tiny cyan pixel-style Saki mascot with wings, cat ears, and cheerful desktop-pet animations.",
    "category": "吉祥物",
    "author": "rookie-09",
    "authorHandle": "rookie-09",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/saki--rookie-09.webp",
    "thumbnail": "assets/pets/upstream-20261009/saki--rookie-09-thumb.webp",
    "version": 1,
    "tags": [
      "saki",
      "cyan",
      "pixel-art",
      "mascot",
      "wings",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/saki--rookie-09",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/saki--rookie-09.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/saki--rookie-09",
    "spritesheetSha256": "61ea42dffd8aaaaa3136450085d122efcdf860fa495a17105ba1559ee17a2148",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/rookie-09"
  },
  {
    "id": "serge-le-lapin--legeling",
    "title": "Serge le Lapin",
    "englishTitle": "Serge le Lapin",
    "description": "一只粉色长耳、白色口鼻、黄上衣和蓝裤子的活泼 Q 版兔子伙伴。",
    "category": "吉祥物",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/serge-le-lapin--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/serge-le-lapin--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "serge-le-lapin",
      "community-request",
      "ai-generated",
      "mascot",
      "rabbit",
      "sticker",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/serge-le-lapin--legeling",
    "license": "CC BY-NC 4.0；仅限非商业使用。非官方 AI 社区诠释作品，不代表或暗示获得相关角色或商标权利方授权。",
    "download": "assets/pets/upstream-20261009/serge-le-lapin--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/serge-le-lapin--legeling",
    "spritesheetSha256": "4087884d17cd353dffe0b73966e26ce144071a907f46935644fe2579b7a74293",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "shian-helper--mistyshen",
    "title": "Shian",
    "englishTitle": "Shian",
    "description": "A soft blonde chibi coding companion with black-and-orange bows and a gentle expression.",
    "category": "原创角色",
    "author": "mistyShen",
    "authorHandle": "mistyShen",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/shian-helper--mistyshen.webp",
    "thumbnail": "assets/pets/upstream-20261009/shian-helper--mistyshen-thumb.webp",
    "version": 1,
    "tags": [
      "shian",
      "blonde",
      "chibi",
      "bows",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/shian-helper--mistyshen",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/shian-helper--mistyshen.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/shian-helper--mistyshen",
    "spritesheetSha256": "4ddbd7d55353ce292e34afbd570efceeb4cb476c397034ddec98319b99c82d8d",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/mistyShen"
  },
  {
    "id": "silver-wolf--lingxiaotian",
    "title": "银狼",
    "englishTitle": "Silver Wolf",
    "description": "《崩坏：星穹铁道》银狼风格的原创 Codex chibi 像素宠物，紫灰短发、黑客感护目镜与黑紫机能穿搭被压缩成稳定可读的小体型像素形象。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/silver-wolf--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/silver-wolf--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "silver-wolf",
      "hacker",
      "cyber"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/silver-wolf--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/silver-wolf--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/silver-wolf--lingxiaotian",
    "spritesheetSha256": "6bae5695b739d8503ef5895ba4282e46dcee78dbacf891b50b40d7ef3f237289",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "sparkle--lingxiaotian",
    "title": "花火",
    "englishTitle": "Sparkle",
    "description": "《崩坏：星穹铁道》花火风格的原创 Codex chibi 像素宠物，红黑配色、双马尾、面具和俏皮戏剧感。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/sparkle--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/sparkle--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "sparkle",
      "mask",
      "twin-tails"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/sparkle--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/sparkle--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/sparkle--lingxiaotian",
    "spritesheetSha256": "8b55199ed720169f8f50d2eec6c846741f16c706e6bfc181192d1970a51ba4e2",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "st-tibo-reset--wynn",
    "title": "St. Tibo Reset",
    "englishTitle": "St. Tibo Reset",
    "description": "A serene, cross-legged Tibo in green and gold robes, ready to press his big red RESET button and give your work a fresh start.",
    "category": "网络梗图",
    "author": "wynn",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/st-tibo-reset--wynn.webp",
    "thumbnail": "assets/pets/upstream-20261009/st-tibo-reset--wynn-thumb.webp",
    "version": 2,
    "tags": [
      "meme",
      "human",
      "3d",
      "green"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/st-tibo-reset--wynn",
    "license": "Non-commercial use and redistribution only, with credit to wynn, to the extent the contributor holds rights in this work. Reference imagery and the depicted person's rights remain with their respective rightsholders and are not licensed by this submission. Unofficial fan art; no affiliation or endorsement is claimed. These terms do not establish third-party rights clearance. Please contact the contributor or maintainers with rights concerns so the submission can be reviewed, revised, or removed.",
    "download": "assets/pets/upstream-20261009/st-tibo-reset--wynn.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/st-tibo-reset--wynn",
    "spritesheetSha256": "812f83e1ca0f93de2cfffa9c29525cfe6f8667d001e8cd106e2164f9de7ce25c",
    "metadataNameAlias": false
  },
  {
    "id": "starcorn--alterhq",
    "title": "Starcorn",
    "englishTitle": "Starcorn",
    "description": "A white chibi unicorn with a multicolor horn and a yellow star marking.",
    "category": "幻想生物",
    "author": "Alter",
    "authorHandle": "alterhq",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/starcorn--alterhq.webp",
    "thumbnail": "assets/pets/upstream-20261009/starcorn--alterhq-thumb.webp",
    "version": 1,
    "tags": [
      "unicorn",
      "fantasy",
      "creature",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/starcorn--alterhq",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/starcorn--alterhq.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/starcorn--alterhq",
    "spritesheetSha256": "d2d91b5339bc46662feddbab643e4fb92278de18281859fb37fcf77cc2a65d66",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/alterhq"
  },
  {
    "id": "sunny-retriever--legeling",
    "title": "暖阳金毛",
    "englishTitle": "Sunny Retriever",
    "description": "A cheerful honey-gold retriever puppy with a teal collar, expressive task animations, and 16 look directions.",
    "category": "动物伙伴",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/sunny-retriever--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/sunny-retriever--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "golden-retriever",
      "dog",
      "puppy",
      "teal-collar",
      "ai-generated",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/sunny-retriever--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/sunny-retriever--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/sunny-retriever--legeling",
    "spritesheetSha256": "447a79a275ba01fcef5805c5e4ec3dccce7d8836e0492af28fb81a5ce7898ee0",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "tangdouren--carl312",
    "title": "Tangdouren",
    "englishTitle": "Tangdouren",
    "description": "A chibi big-headed girl pet with side-parted brown bob hair and glossy eyes.",
    "category": "人物头像",
    "author": "Carl-312",
    "authorHandle": "Carl-312",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/tangdouren--carl312.webp",
    "thumbnail": "assets/pets/upstream-20261009/tangdouren--carl312-thumb.webp",
    "version": 1,
    "tags": [
      "chibi",
      "person",
      "brown-hair",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tangdouren--carl312",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/tangdouren--carl312.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/tangdouren--carl312",
    "spritesheetSha256": "216b994b833f54fef6f719c6c42e116e666fa7d7d2b40f31f5d2acb872a8411a",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Carl-312"
  },
  {
    "id": "tian-hua-hua--d1a0y1bb",
    "title": "Tian Hua Hua",
    "englishTitle": "Tian Hua Hua",
    "description": "A round calico cat companion with sleepy eyes and a calm, slightly serious expression.",
    "category": "动物伙伴",
    "author": "D1a0y1bb",
    "authorHandle": "D1a0y1bb",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb.webp",
    "thumbnail": "assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "calico",
      "round",
      "sleepy",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tian-hua-hua--d1a0y1bb",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/tian-hua-hua--d1a0y1bb",
    "spritesheetSha256": "5aaa783e17577b92ebdfd2070c95916245be0c378ac6931ef7fa98bb99cb6dc6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/D1a0y1bb"
  },
  {
    "id": "tingyun--lingxiaotian",
    "title": "停云",
    "englishTitle": "Tingyun",
    "description": "《崩坏：星穹铁道》停云风格的原创 Codex chibi 像素宠物，狐耳与大尾巴、金棕红配色、绿眼和温柔优雅的神态都被压缩进小体量动画里。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/tingyun--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/tingyun--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "tingyun",
      "fox-ears",
      "gold-brown"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tingyun--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/tingyun--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/tingyun--lingxiaotian",
    "spritesheetSha256": "18c19bc5f493c11f37b83f0d2a2bb861525ab1adf3b05eaba407c1fd9210796a",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "wally--wally025",
    "title": "Wally",
    "englishTitle": "Wally",
    "description": "A cheerful little white guide mascot for builds, reviews, and clean progress.",
    "category": "吉祥物",
    "author": "Wally Pet Contributors",
    "authorHandle": "wally025",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/wally--wally025.webp",
    "thumbnail": "assets/pets/upstream-20261009/wally--wally025-thumb.webp",
    "version": 1,
    "tags": [
      "wally",
      "mascot",
      "white",
      "guide",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/wally--wally025",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/wally--wally025.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/wally--wally025",
    "spritesheetSha256": "f9b7d6dd1f9ab97f94d83b78b05f1246fc7c73b9c3c4678fd4ae314a41e25483",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/wally025"
  },
  {
    "id": "warden-codex--jorge-cuevas90003",
    "title": "Warden Codex",
    "englishTitle": "Warden Codex",
    "description": "An original chibi armored guardian in olive-green sci-fi power armor with a gold visor, always carrying his rifle.",
    "category": "原创角色",
    "author": "Jorge Cuevas",
    "authorHandle": "Jorge-Cuevas90003",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003.webp",
    "thumbnail": "assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003-thumb.webp",
    "version": 2,
    "tags": [
      "sci-fi",
      "armored",
      "guardian",
      "chibi",
      "original",
      "ai-generated",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/warden-codex--jorge-cuevas90003",
    "license": "CC BY-NC 4.0. Original AI-assisted artwork created for and submitted by Jorge Cuevas; no third-party source assets were used.",
    "download": "assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/warden-codex--jorge-cuevas90003",
    "spritesheetSha256": "7c51b5594653a8934002c8329b50a1b414764261b778aa5541ece7cc89db7285",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Jorge-Cuevas90003"
  },
  {
    "id": "xian-xiao-lu--qingyunagi",
    "title": "Xian Xiao Lu",
    "englishTitle": "Xian Xiao Lu",
    "description": "A peaceful little xianxia deer sitting on a cloud with a gourd and fly-whisk.",
    "category": "幻想生物",
    "author": "qingyunAGI",
    "authorHandle": "qingyunAGI",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi.webp",
    "thumbnail": "assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi-thumb.webp",
    "version": 1,
    "tags": [
      "deer",
      "xianxia",
      "cloud",
      "peaceful",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xian-xiao-lu--qingyunagi",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/xian-xiao-lu--qingyunagi",
    "spritesheetSha256": "17bc75e7d3a9c026ce8210572327b89fade9bba490f7b079d6bd3b96805354e1",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/qingyunAGI"
  },
  {
    "id": "yier--gbn666",
    "title": "Yi Er",
    "englishTitle": "Yi Er",
    "description": "A soft, gentle white chibi desktop pet with dark round ears, pink cheeks, and a shy expression.",
    "category": "原创角色",
    "author": "Guo Beining",
    "authorHandle": "gbn666",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/yier--gbn666.webp",
    "thumbnail": "assets/pets/upstream-20261009/yier--gbn666-thumb.webp",
    "version": 1,
    "tags": [
      "chibi",
      "pixel-art",
      "soft",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yier--gbn666",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/yier--gbn666.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/yier--gbn666",
    "spritesheetSha256": "5b0a84b5094172d965f82f7ba5962b35fad898274878cb492a3efe98b4c70b15",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/gbn666"
  },
  {
    "id": "yuanzai--gaming33",
    "title": "Yuanzai",
    "englishTitle": "Yuanzai",
    "description": "A cute cat-headed bee companion with tiny wings, striped colors, and a gentle round face.",
    "category": "幻想生物",
    "author": "Gaming33",
    "authorHandle": "Gaming33",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/yuanzai--gaming33.webp",
    "thumbnail": "assets/pets/upstream-20261009/yuanzai--gaming33-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "bee",
      "striped",
      "cute",
      "round",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuanzai--gaming33",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/yuanzai--gaming33.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/yuanzai--gaming33",
    "spritesheetSha256": "15f11b04440047f6a994e582bd2223454aacf3da86c197069bbfbe8d37101b7d",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Gaming33"
  },
  {
    "id": "yuzubou--keseras34938976",
    "title": "Yuzubou",
    "englishTitle": "Yuzubou",
    "description": "A cheerful little yuzu monk in a straw hat, leaf cap, robes, and prayer beads.",
    "category": "原创角色",
    "author": "Keseras34938976",
    "authorHandle": "Keseras34938976",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/yuzubou--keseras34938976.webp",
    "thumbnail": "assets/pets/upstream-20261009/yuzubou--keseras34938976-thumb.webp",
    "version": 1,
    "tags": [
      "yuzu",
      "monk",
      "straw-hat",
      "leaf",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuzubou--keseras34938976",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/yuzubou--keseras34938976.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/yuzubou--keseras34938976",
    "spritesheetSha256": "8e1bd8a6e5b0d5a644933bb8cc40615a8877e573d49fe436492d4c586c576fad",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Keseras34938976"
  },
  {
    "id": "uesugi-erii--ricardo-2005",
    "title": "上杉绘梨衣codex宠物",
    "englishTitle": "上杉绘梨衣codex宠物",
    "description": "上杉绘梨衣的非官方 AI 同人 Codex 桌面宠物。",
    "category": "动漫角色",
    "author": "Ricardo-2005",
    "authorHandle": "Ricardo-2005",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/uesugi-erii--ricardo-2005.webp",
    "thumbnail": "assets/pets/upstream-20261009/uesugi-erii--ricardo-2005-thumb.webp",
    "version": 2,
    "tags": [
      "dragon-raja",
      "uesugi-erii",
      "anime",
      "fan-art",
      "red-hair",
      "pixel-art",
      "ai-generated",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/uesugi-erii--ricardo-2005",
    "license": "CC BY-NC 4.0；仅限非商业使用。非官方 AI 同人作品，不代表或暗示获得原作品权利方授权；角色及商标权利归其权利人所有。",
    "download": "assets/pets/upstream-20261009/uesugi-erii--ricardo-2005.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/uesugi-erii--ricardo-2005",
    "spritesheetSha256": "584ad142250b0bf601faa876618e38468de77dd5d7cc4e149e3cad1544f4b253",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Ricardo-2005"
  },
  {
    "id": "yuanbao--legeling",
    "title": "元宝",
    "englishTitle": "元宝",
    "description": "一只灰白相间、带苏格兰折耳特征和大圆眼的半写实虎斑猫桌面伙伴。",
    "category": "动物伙伴",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/yuanbao--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/yuanbao--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "cat",
      "scottish-fold",
      "tabby",
      "gray-white",
      "community-request",
      "ai-generated",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuanbao--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/yuanbao--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/yuanbao--legeling",
    "spritesheetSha256": "dd37bd8664636ea6639ad4bf5e1ea50e82a5864b72520f88fb5fabc80222fa50",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "yae-miko--legeling",
    "title": "八重神子",
    "englishTitle": "Yae Miko",
    "description": "《原神》八重神子灵感的原创非商业 Codex v2 chibi 像素宠物，粉色长发、狐耳、红白巫女服与紫金配饰被压缩成稳定可读的小体型形象。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/yae-miko--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/yae-miko--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "genshin-impact",
      "yae-miko",
      "kitsune",
      "shrine-maiden",
      "pink-hair",
      "pixel-art",
      "chibi",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yae-miko--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/yae-miko--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/yae-miko--legeling",
    "spritesheetSha256": "5b211fae44ff5bd4541dcce1c01d378af30ed3c670b205b67d5a3c4c3323b884",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "liuboer--legeling",
    "title": "刘波儿",
    "englishTitle": "刘波儿",
    "description": "A slim black Devon Rex with enormous triangular ears, yellow-green eyes and a short rippled coat.",
    "category": "动物伙伴",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/liuboer--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/liuboer--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/liuboer--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/liuboer--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/liuboer--legeling",
    "spritesheetSha256": "ac28440619bc4f318a386608ca6753a5a331b1d6f5cc8e36095f8b07c9f71614",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "miku-sea--legeling",
    "title": "初音未来·海色",
    "englishTitle": "Hatsune Miku · Sea Colors",
    "description": "忠实于请求者六帧海色初稿的初音未来夏装同人宠物：草帽、画面右侧白蝴蝶结、白蓝裙装、青色双马尾和赤脚。AI 生成，非官方作品。",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/miku-sea--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/miku-sea--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "hatsune-miku",
      "summer"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/miku-sea--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/miku-sea--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/miku-sea--legeling",
    "spritesheetSha256": "2805e8f175d75231a0ea07a7fb9d4dc00203127b2dfa071810fc2f7aa7e68d77",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "gudong--rank",
    "title": "咕咚",
    "englishTitle": "咕咚",
    "description": "A crown-wearing rabbit king with a leafy forelock, burgundy cape, and playful oversized eyes.",
    "category": "原创角色",
    "author": "Rank",
    "authorHandle": "Rank",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/gudong--rank.webp",
    "thumbnail": "assets/pets/upstream-20261009/gudong--rank-thumb.webp",
    "version": 2,
    "tags": [
      "original-character",
      "rabbit",
      "king",
      "crown",
      "cape",
      "cartoon",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/gudong--rank",
    "license": "CC BY 4.0",
    "download": "assets/pets/upstream-20261009/gudong--rank.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/gudong--rank",
    "spritesheetSha256": "9a2cf19c6b2a24ac5e5950576d65ae957890938a416b5e177f0f93e48555c0f3",
    "metadataNameAlias": false
  },
  {
    "id": "tuantuan--jbbom",
    "title": "团团",
    "englishTitle": "团团",
    "description": "A soft, friendly orange-and-white shorthair kitten for Codex.",
    "category": "动物伙伴",
    "author": "JbBom",
    "authorHandle": "JbBom",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/tuantuan--jbbom.webp",
    "thumbnail": "assets/pets/upstream-20261009/tuantuan--jbbom-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "kitten",
      "orange-white",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tuantuan--jbbom",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/tuantuan--jbbom.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/tuantuan--jbbom",
    "spritesheetSha256": "1b3b74e0688ad5db0b1e242eee4aa6facc746456f66cfe810877813b3ef65b62",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/JbBom"
  },
  {
    "id": "virtuosa--legeling",
    "title": "塑心阿尔图罗",
    "englishTitle": "Virtuosa / Arturia",
    "description": "按社区参考制作的《明日方舟》塑心阿尔图罗同人宠物，保留黑发、金眼、黑金碎片光环和翼状构造。AI 生成，脚靴补全已获制作审核认可，非官方作品。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/virtuosa--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/virtuosa--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "arknights",
      "virtuosa"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/virtuosa--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/virtuosa--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/virtuosa--legeling",
    "spritesheetSha256": "522496bafedb3c0fd368d82f1f8e933680c6c645799a40cc9790e03ad5024f90",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "dashu--legeling",
    "title": "大鼠",
    "englishTitle": "大鼠",
    "description": "Da Shu from 大鼠与美叽, with a broad gray face, pink ears, a cheerful toothy smile and a tiny body.",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/dashu--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/dashu--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/dashu--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/dashu--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/dashu--legeling",
    "spritesheetSha256": "b922ad1ea917101bf5e39cd9c35dedd134d44164a12496736dbffa3332e10b84",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "dnf-female-ammo--qunboo",
    "title": "dnf-female-ammo",
    "englishTitle": "女弹药Q",
    "description": "A chibi-style Dungeon Fighter Online Female Mechanic (Ammo) desktop pet, featuring idle breathing and gun-twirl animations.",
    "category": "游戏角色",
    "author": "QunBoo",
    "authorHandle": "QunBoo",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/dnf-female-ammo--qunboo.webp",
    "thumbnail": "assets/pets/upstream-20261009/dnf-female-ammo--qunboo-thumb.webp",
    "version": 1,
    "tags": [
      "dnf",
      "dungeon-fighter",
      "dungeon-fighter-online",
      "female-ammo",
      "game",
      "chibi"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/dnf-female-ammo--qunboo",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/dnf-female-ammo--qunboo.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "dungeon-fighter-online"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/dnf-female-ammo--qunboo",
    "spritesheetSha256": "6c86347073986e57148f7b81980866c7ac2c68c1112b93a85519a142b208f59d",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/QunBoo"
  },
  {
    "id": "naiwa--sandytruant",
    "title": "奶蛙",
    "englishTitle": "奶蛙",
    "description": "A yellow pear-shaped pixel companion that laughs when hovered.",
    "category": "动物伙伴",
    "author": "Yitian Sun",
    "authorHandle": "sandytruant",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/naiwa--sandytruant.webp",
    "thumbnail": "assets/pets/upstream-20261009/naiwa--sandytruant-thumb.webp",
    "version": 2,
    "tags": [
      "frog",
      "yellow",
      "pixel-art",
      "look-directions",
      "codex-v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/naiwa--sandytruant",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/naiwa--sandytruant.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/naiwa--sandytruant",
    "spritesheetSha256": "5db71125ea2d30beb8507d7aae1e38521efa6db4f7cde6b1ced1a8b3a8d6439f",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/sandytruant"
  },
  {
    "id": "vyron--legeling",
    "title": "威龙",
    "englishTitle": "Vyron",
    "description": "An AI-generated, weapon-free community interpretation of Vyron from Delta Force, based on the Issue #234 reference. The specific game skin is unverified.",
    "category": "其他",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/vyron--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/vyron--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "ai-generated",
      "fan-art",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/vyron--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/vyron--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/vyron--legeling",
    "spritesheetSha256": "47d2430a4b59e3bac88ee9bb2a5912a14c8be077e7908db0244c34583683b8a7",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "xiaoda--legeling",
    "title": "小达",
    "englishTitle": "小达",
    "description": "一只蓝白配色、大眼、双天线和额头屏幕的软质 3D Q 版机器人伙伴。",
    "category": "机器人",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/xiaoda--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/xiaoda--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "xiaoda",
      "community-request",
      "ai-generated",
      "robot",
      "mascot",
      "3d-toy",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xiaoda--legeling",
    "license": "CC BY-NC 4.0；仅限非商业使用。非官方 AI 社区诠释作品，不代表或暗示获得原素材相关权利方授权。",
    "download": "assets/pets/upstream-20261009/xiaoda--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/xiaoda--legeling",
    "spritesheetSha256": "0e53ff190a3a51b22e956728a708f98575b1b9e5a871b463e08511162a89df26",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "little-black-cat--legeling",
    "title": "小黑猫",
    "englishTitle": "小黑猫",
    "description": "A fuzzy brush-painted black cat with slanted golden eyes, a blue nose and an inquisitive gaze.",
    "category": "动物伙伴",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/little-black-cat--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/little-black-cat--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/little-black-cat--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/little-black-cat--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/little-black-cat--legeling",
    "spritesheetSha256": "71cc9fa9b9f8d581370963e457e924af5e40e02a889b5ea191ba2566fa1d1309",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "iuno--legeling",
    "title": "尤诺",
    "englishTitle": "Iuno",
    "description": "对应社区请求 #176 与 #177 的《鸣潮》尤诺同人宠物，蓝色双马尾、白金服装和手持蓝金圆环。AI 生成，非官方作品。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/iuno--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/iuno--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "wuthering-waves",
      "iuno"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/iuno--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/iuno--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/iuno--legeling",
    "spritesheetSha256": "1ca0398437916007ee8f28b4b913e7bdea39eb1d5ac90a2fa5fe659682fac468",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "bubu-codebrew-bear--xxhh0822",
    "title": "布布",
    "englishTitle": "布布",
    "description": "A focused cocoa-brown bear coding at a cyan laptop with a small white coffee mug.",
    "category": "吉祥物",
    "author": "xxhh0822",
    "authorHandle": "xxhh0822",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822.webp",
    "thumbnail": "assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822-thumb.webp",
    "version": 2,
    "tags": [
      "bear",
      "coding",
      "laptop",
      "coffee",
      "chibi",
      "original",
      "ai-generated",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bubu-codebrew-bear--xxhh0822",
    "license": "CC BY-NC 4.0. Original AI-assisted artwork submitted by xxhh0822 for non-commercial use; no third-party source pixels were copied.",
    "download": "assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/bubu-codebrew-bear--xxhh0822",
    "spritesheetSha256": "20c82a9e88e9561ab3a6f632d8eed1cca5df755fcb500ccdf9a4b576e69e1334",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/xxhh0822"
  },
  {
    "id": "koukou-penguin--hoody",
    "title": "扣扣企鹅",
    "englishTitle": "扣扣企鹅",
    "description": "一只戴着红围巾、会眨眼的圆滚滚黑白企鹅伙伴。",
    "category": "动物伙伴",
    "author": "hoody",
    "authorHandle": "hoody",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/koukou-penguin--hoody.webp",
    "thumbnail": "assets/pets/upstream-20261009/koukou-penguin--hoody-thumb.webp",
    "version": 2,
    "tags": [
      "penguin",
      "animal",
      "red-scarf",
      "3d-toy",
      "original"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/koukou-penguin--hoody",
    "license": "CC BY-NC 4.0. Original asset created by hoody; no third-party source asset.",
    "download": "assets/pets/upstream-20261009/koukou-penguin--hoody.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/koukou-penguin--hoody",
    "spritesheetSha256": "53f3a730f8485d351976b51c7b918953381a92be95387df17d481069f5defa5c",
    "metadataNameAlias": false
  },
  {
    "id": "xuxu-baobao--legeling",
    "title": "旭旭宝宝",
    "englishTitle": "旭旭宝宝",
    "description": "An AI-generated miniature avatar based on the reference supplied with request #115, with nine animation states and sixteen look directions. The accepted scope is the V2 sprite package; custom desktop interaction and voice features are outside this delivery.",
    "category": "人物头像",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/xuxu-baobao--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/xuxu-baobao--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "human-avatar",
      "ai-generated",
      "codex-v2",
      "community-request"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xuxu-baobao--legeling",
    "license": "CC BY-NC 4.0 for this AI-generated sprite asset; non-commercial use only. Commercial use is prohibited. Rights in the depicted person's identity and supplied reference photograph remain with their respective rights holders.",
    "download": "assets/pets/upstream-20261009/xuxu-baobao--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/xuxu-baobao--legeling",
    "spritesheetSha256": "fee42cb0b3a51735520ba506534b9c78583eea7ac2948fd48332c220806ee9a0",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "hance-woniu--korn",
    "title": "旱厕蜗牛",
    "englishTitle": "旱厕蜗牛",
    "description": "一个憨憨微笑、嘴角挂着蓝色口水的白色圆头网络梗宠物。",
    "category": "网络梗图",
    "author": "korn",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/hance-woniu--korn.webp",
    "thumbnail": "assets/pets/upstream-20261009/hance-woniu--korn-thumb.webp",
    "version": 2,
    "tags": [
      "meme",
      "douyin",
      "white-mascot",
      "drool",
      "hand-drawn",
      "codex-v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hance-woniu--korn",
    "license": "CC BY-NC 4.0 (korn's original three-view artwork and this Codex pet adaptation only; no claim over third-party meme materials)",
    "download": "assets/pets/upstream-20261009/hance-woniu--korn.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/hance-woniu--korn",
    "spritesheetSha256": "8ba2e9a2964c88f93b533e35fc69148da6d314e74711c86fd4231e09a4305255",
    "metadataNameAlias": false
  },
  {
    "id": "liubao--killyer",
    "title": "榴宝",
    "englishTitle": "榴宝",
    "description": "一只圆滚滚、柔软亲切的榴莲毛绒桌面宠物。",
    "category": "原创角色",
    "author": "Shawnzhou",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/liubao--killyer.webp",
    "thumbnail": "assets/pets/upstream-20261009/liubao--killyer-thumb.webp",
    "version": 2,
    "tags": [
      "original",
      "durian",
      "plush",
      "cute"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/liubao--killyer",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/liubao--killyer.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/liubao--killyer",
    "spritesheetSha256": "65954ab3eeb02772ebac5f4fb05279fa5d2f88bd93c4132eea54d3a3b50d9b4b",
    "metadataNameAlias": false
  },
  {
    "id": "shen-xinghui--legeling",
    "title": "沈星回",
    "englishTitle": "沈星回",
    "description": "一位银灰发、蓝紫眼、身着浅色未来制服的温柔 Q 版伙伴。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/shen-xinghui--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/shen-xinghui--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "love-and-deepspace",
      "shen-xinghui",
      "community-request",
      "ai-generated",
      "fan-art",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/shen-xinghui--legeling",
    "license": "CC BY-NC 4.0；仅限非商业使用。非官方 AI 同人作品，不代表或暗示获得《恋与深空》权利方授权；角色及商标权利归其权利人所有。",
    "download": "assets/pets/upstream-20261009/shen-xinghui--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/shen-xinghui--legeling",
    "spritesheetSha256": "d9fd7cfd22d33fb00a7ee6f5f1d29baa68919cb14ac1bda55ea1d8426c6e7ef3",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "otama--legeling",
    "title": "海贼王小玉",
    "englishTitle": "海贼王小玉",
    "description": "《海贼王》小玉，保留紫发花饰、绿色补丁和服、黄色腰带与草履的 V2 动画宠物。",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/otama--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/otama--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "one-piece",
      "otama"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/otama--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/otama--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/otama--legeling",
    "spritesheetSha256": "df03b7e1628e5693dfeb324302b1920fe81eec427465488338f13aca5a3e35f3",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "neptune--legeling",
    "title": "涅普缇努",
    "englishTitle": "Neptune",
    "description": "按社区请求制作的涅普缇努普通形态像素风同人宠物，白紫连帽外套、方向键发夹和紫色鞋。AI 生成，非官方作品。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/neptune--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/neptune--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "neptunia",
      "pixel-art"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/neptune--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/neptune--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/neptune--legeling",
    "spritesheetSha256": "3a53c81e95231edb55c20393f417a9d8bfa3f278a7e22d05d9a185ad3432d28e",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "niulai--legeling",
    "title": "牛来",
    "englishTitle": "牛来",
    "description": "一只橙棕色、短灰角、圆眼和浅粉口鼻的憨萌 Q 版牛伙伴。",
    "category": "网络梗图",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/niulai--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/niulai--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "niulai",
      "community-request",
      "ai-generated",
      "meme",
      "3d-toy",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/niulai--legeling",
    "license": "CC BY-NC 4.0；仅限非商业使用。非官方 AI 社区诠释作品，不代表或暗示获得原素材相关权利方授权。",
    "download": "assets/pets/upstream-20261009/niulai--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/niulai--legeling",
    "spritesheetSha256": "dd95068c122aecebbb4056918eba49513e4969cb00b503b9494319f2b410e399",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "gift--legeling",
    "title": "礼物",
    "englishTitle": "Gift",
    "description": "A round tabby-white cat with green-yellow eyes, white paws and a thick ringed tail.",
    "category": "动物伙伴",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/gift--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/gift--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/gift--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/gift--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/gift--legeling",
    "spritesheetSha256": "978c742dcdc54d5260ba61a8337491acfe8f5969caa26f0b232d9e9ba5301617",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "luo-xiaohei--legeling",
    "title": "罗小黑",
    "englishTitle": "罗小黑",
    "description": "一位黑发、绿眼、淡绿角饰、蓝色上衣与小黑尾巴的 Q 版森林伙伴。",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/luo-xiaohei--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/luo-xiaohei--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "luo-xiaohei",
      "community-request",
      "ai-generated",
      "anime",
      "forest-child",
      "sticker",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/luo-xiaohei--legeling",
    "license": "CC BY-NC 4.0；仅限非商业使用。非官方 AI 社区诠释作品，不代表或暗示获得相关角色或商标权利方授权。",
    "download": "assets/pets/upstream-20261009/luo-xiaohei--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/luo-xiaohei--legeling",
    "spritesheetSha256": "52c8feff0a688e6b18791e452d5eff090823fcaf8306f8f1f8da64e30e15c468",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "xiang-an--legeling",
    "title": "翔安",
    "englishTitle": "翔安",
    "description": "一对彩色外套与薄荷绿连体衣的 Q 版兄弟搭档。",
    "category": "人物头像",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/xiang-an--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/xiang-an--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "ai-generated",
      "sibling-duo",
      "chibi",
      "sticker",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xiang-an--legeling",
    "license": "CC BY-NC 4.0；仅限非商业使用。",
    "download": "assets/pets/upstream-20261009/xiang-an--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/xiang-an--legeling",
    "spritesheetSha256": "1e9a5dd74676341e18ec23752c877c94f293a3bb7ab91ff5a8ad7166bb2cd4ad",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "maodie--octane0411",
    "title": "耄耋",
    "englishTitle": "耄耋",
    "description": "一只圆头飞机耳、粉鼻眯眼，凶萌又倔强的橘白猫。",
    "category": "网络梗图",
    "author": "Octane0411",
    "authorHandle": "Octane0411",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/maodie--octane0411.webp",
    "thumbnail": "assets/pets/upstream-20261009/maodie--octane0411-thumb.webp",
    "version": 2,
    "tags": [
      "cat",
      "orange-cat",
      "meme",
      "maodie",
      "codex-v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/maodie--octane0411",
    "license": "CC BY 4.0",
    "download": "assets/pets/upstream-20261009/maodie--octane0411.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/maodie--octane0411",
    "spritesheetSha256": "eb819e188df3efc8dc7c0ac11d6533fb01cfe869a56a80835fd44fc6882517d5",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Octane0411"
  },
  {
    "id": "nijika--amia",
    "title": "虹夏",
    "englishTitle": "Nijika Ijichi",
    "description": "伊地知虹夏。下北泽大天使！社区作者：Amiaね",
    "category": "动漫角色",
    "author": "Amiaね",
    "authorHandle": "amiaverse",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/nijika--amia.webp",
    "thumbnail": "assets/pets/upstream-20261009/nijika--amia-thumb.webp",
    "version": 2,
    "tags": [
      "anime",
      "music",
      "drummer",
      "bocchi-the-rock",
      "fan-art"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/nijika--amia",
    "license": "Non-commercial use and redistribution with attribution to Amiaね; original character and design rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/nijika--amia.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "bocchi-the-rock"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/nijika--amia",
    "spritesheetSha256": "85e14504b95e92ea77c362174bb1979a8a067f55a67b1915f33721eaa66451f9",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/amiaverse"
  },
  {
    "id": "hongmao--legeling",
    "title": "虹猫少侠",
    "englishTitle": "虹猫少侠",
    "description": "A young orange cat swordsman in white martial clothing, a yellow scarf and an orange cape, holding his orange-red sword.",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/hongmao--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/hongmao--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hongmao--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/hongmao--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/hongmao--legeling",
    "spritesheetSha256": "4022eb2d77c1641c95d548e033aa496a45376f3facc932accf206e62492ac4aa",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "jinmao--legeling",
    "title": "金毛",
    "englishTitle": "金毛",
    "description": "一只叼着网球、垂着大耳朵的奶油浅金色治愈系金毛幼犬。",
    "category": "动物伙伴",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/jinmao--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/jinmao--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "golden-retriever",
      "dog",
      "puppy",
      "tennis-ball",
      "community-request",
      "ai-generated",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/jinmao--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/jinmao--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/jinmao--legeling",
    "spritesheetSha256": "1845ef8174a902f72fe269af9e22efff5c2cab9e0bb9aa330a0acb40569a74f6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "arona--legeling",
    "title": "阿罗那",
    "englishTitle": "阿罗那",
    "description": "一位浅蓝短发、青色光环与水手服的 Q 版校园伙伴。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/arona--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/arona--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "blue-archive",
      "arona",
      "community-request",
      "ai-generated",
      "fan-art",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/arona--legeling",
    "license": "CC BY-NC 4.0；仅限非商业使用。非官方 AI 同人作品，不代表或暗示获得《碧蓝档案》权利方授权；角色及商标权利归其权利人所有。",
    "download": "assets/pets/upstream-20261009/arona--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/arona--legeling",
    "spritesheetSha256": "4140848d8c5cc7831f78d200101910ba831a63a8ad9de6f085b15bcf14bec1d0",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "zayne--legeling",
    "title": "黎深",
    "englishTitle": "Zayne",
    "description": "按社区礼服参考制作的《恋与深空》黎深 3D Q版同人宠物，保留绿眼、雪花胸针与细链。AI 生成，非官方作品。",
    "category": "游戏角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/zayne--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/zayne--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "love-and-deepspace",
      "chibi-3d"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/zayne--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/zayne--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/zayne--legeling",
    "spritesheetSha256": "e6f9f91eb5a32f240766b96447f4a847f4fdf2b772a9c6a6ac989b6e9ef788aa",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "bocchi--lingxiaotian",
    "title": "后藤独",
    "englishTitle": "Bocchi",
    "description": "A compact Codex digital pet inspired by Bocchi from Bocchi the Rock.",
    "category": "动漫角色",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/bocchi--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/bocchi--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "music",
      "guitar",
      "bocchi-the-rock",
      "pink-hair"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bocchi--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/bocchi--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "bocchi-the-rock"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/bocchi--lingxiaotian",
    "spritesheetSha256": "d8514dac88d4811c9f238530602f22721f5e2368d5b05238ff906251d457eb72",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "vscode-rubber-duck-yellow",
    "title": "VSCode Pets 小黄鸭",
    "description": "原作 GIF 逐帧无损转换，保留透明通道和实际帧延时；只提供原项目已有的动作。缺少的系统状态回退待机。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "Marc Duiker",
    "authorUrl": "",
    "source": "https://github.com/tonybaloney/vscode-pets/tree/6554662a53ef093b7598598b77e51f95128a1f38/media/rubber-duck",
    "license": "MIT",
    "version": 1,
    "distribution": "media",
    "download": "assets/pets/adapted-20261010/vscode-rubber-duck-yellow/package.zip",
    "thumbnail": "assets/pets/adapted-20261010/vscode-rubber-duck-yellow/thumbnail.webp",
    "tags": [
      "独立动作",
      "透明素材"
    ],
    "importedAt": "2026-10-10",
    "collections": [],
    "hostNotice": "下载 ZIP 后在控制中心「我的桌宠」导入，设为当前桌宠。动作名称、分类和 AI 状态绑定可自行配置。",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-rubber-duck-yellow/idle.webp"
      },
      "walk": {
        "displayName": "行走",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-rubber-duck-yellow/walk.webp"
      },
      "run": {
        "displayName": "奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-rubber-duck-yellow/run.webp"
      },
      "swipe": {
        "displayName": "挥动",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-rubber-duck-yellow/swipe.webp"
      },
      "with-ball": {
        "displayName": "持球",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-rubber-duck-yellow/with-ball.webp"
      }
    }
  },
  {
    "id": "vscode-snake-green",
    "title": "VSCode Pets 绿蛇",
    "description": "原作 GIF 逐帧无损转换，保留透明通道和实际帧延时；只提供原项目已有的动作。缺少的系统状态回退待机。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "Marc Duiker",
    "authorUrl": "",
    "source": "https://github.com/tonybaloney/vscode-pets/tree/6554662a53ef093b7598598b77e51f95128a1f38/media/snake",
    "license": "MIT",
    "version": 1,
    "distribution": "media",
    "download": "assets/pets/adapted-20261010/vscode-snake-green/package.zip",
    "thumbnail": "assets/pets/adapted-20261010/vscode-snake-green/thumbnail.webp",
    "tags": [
      "独立动作",
      "透明素材"
    ],
    "importedAt": "2026-10-10",
    "collections": [],
    "hostNotice": "下载 ZIP 后在控制中心「我的桌宠」导入，设为当前桌宠。动作名称、分类和 AI 状态绑定可自行配置。",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-snake-green/idle.webp"
      },
      "walk": {
        "displayName": "行走",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-snake-green/walk.webp"
      },
      "run": {
        "displayName": "奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-snake-green/run.webp"
      },
      "swipe": {
        "displayName": "挥动",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-snake-green/swipe.webp"
      },
      "with-ball": {
        "displayName": "持球",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-snake-green/with-ball.webp"
      }
    }
  },
  {
    "id": "vscode-crab-red",
    "title": "VSCode Pets Ferris 蟹",
    "description": "原作 GIF 逐帧无损转换，保留透明通道和实际帧延时；只提供原项目已有的动作。缺少的系统状态回退待机。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "Marc Duiker；Ferris 原概念 Karen Rustad Tölva",
    "authorUrl": "",
    "source": "https://github.com/tonybaloney/vscode-pets/tree/6554662a53ef093b7598598b77e51f95128a1f38/media/crab",
    "license": "MIT",
    "version": 1,
    "distribution": "media",
    "download": "assets/pets/adapted-20261010/vscode-crab-red/package.zip",
    "thumbnail": "assets/pets/adapted-20261010/vscode-crab-red/thumbnail.webp",
    "tags": [
      "独立动作",
      "透明素材"
    ],
    "importedAt": "2026-10-10",
    "collections": [],
    "hostNotice": "下载 ZIP 后在控制中心「我的桌宠」导入，设为当前桌宠。动作名称、分类和 AI 状态绑定可自行配置。",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-crab-red/idle.webp"
      },
      "walk": {
        "displayName": "行走",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-crab-red/walk.webp"
      },
      "run": {
        "displayName": "奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-crab-red/run.webp"
      },
      "swipe": {
        "displayName": "挥动",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-crab-red/swipe.webp"
      },
      "with-ball": {
        "displayName": "持球",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-crab-red/with-ball.webp"
      }
    }
  },
  {
    "id": "vscode-cockatiel-gray",
    "title": "VSCode Pets 灰玄凤",
    "description": "原作 GIF 逐帧无损转换，保留透明通道和实际帧延时；只提供原项目已有的动作。缺少的系统状态回退待机。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "Marc Duiker",
    "authorUrl": "",
    "source": "https://github.com/tonybaloney/vscode-pets/tree/6554662a53ef093b7598598b77e51f95128a1f38/media/cockatiel",
    "license": "MIT",
    "version": 1,
    "distribution": "media",
    "download": "assets/pets/adapted-20261010/vscode-cockatiel-gray/package.zip",
    "thumbnail": "assets/pets/adapted-20261010/vscode-cockatiel-gray/thumbnail.webp",
    "tags": [
      "独立动作",
      "透明素材"
    ],
    "importedAt": "2026-10-10",
    "collections": [],
    "hostNotice": "下载 ZIP 后在控制中心「我的桌宠」导入，设为当前桌宠。动作名称、分类和 AI 状态绑定可自行配置。",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-cockatiel-gray/idle.webp"
      },
      "walk": {
        "displayName": "行走",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-cockatiel-gray/walk.webp"
      },
      "swipe": {
        "displayName": "挥动",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-cockatiel-gray/swipe.webp"
      },
      "with-ball": {
        "displayName": "持球",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-cockatiel-gray/with-ball.webp"
      }
    }
  },
  {
    "id": "vscode-cockatiel-brown",
    "title": "VSCode Pets 棕玄凤",
    "description": "原作 GIF 逐帧无损转换，保留透明通道和实际帧延时；只提供原项目已有的动作。缺少的系统状态回退待机。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "Marc Duiker；棕色变体 MUL7ii (MULTi)",
    "authorUrl": "",
    "source": "https://github.com/tonybaloney/vscode-pets/tree/6554662a53ef093b7598598b77e51f95128a1f38/media/cockatiel",
    "license": "MIT",
    "version": 1,
    "distribution": "media",
    "download": "assets/pets/adapted-20261010/vscode-cockatiel-brown/package.zip",
    "thumbnail": "assets/pets/adapted-20261010/vscode-cockatiel-brown/thumbnail.webp",
    "tags": [
      "独立动作",
      "透明素材"
    ],
    "importedAt": "2026-10-10",
    "collections": [],
    "hostNotice": "下载 ZIP 后在控制中心「我的桌宠」导入，设为当前桌宠。动作名称、分类和 AI 状态绑定可自行配置。",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-cockatiel-brown/idle.webp"
      },
      "walk": {
        "displayName": "行走",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-cockatiel-brown/walk.webp"
      },
      "swipe": {
        "displayName": "挥动",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-cockatiel-brown/swipe.webp"
      },
      "with-ball": {
        "displayName": "持球",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vscode-cockatiel-brown/with-ball.webp"
      }
    }
  },
  {
    "id": "oneko-classic",
    "title": "oneko 经典白猫",
    "description": "经典 32px 白猫图集的真实动作转换：8 方向奔跑、睡眠和抓挠；原公开领域 XBM 与图集逐像素一致。保持透明与原 100ms 动作节拍，睡眠每帧 400ms。",
    "kind": "pet",
    "category": "动物伙伴",
    "author": "Masayuki Koba；Tatsuya Kato；oneko / oneko.js 贡献者",
    "authorUrl": "",
    "source": "https://github.com/adryd325/oneko.js/tree/5281d057c4ea9bd4f6f997ee96ba30491aed16c0",
    "license": "Public Domain (经典猫素材)；MIT (oneko.js)",
    "version": 1,
    "distribution": "media",
    "download": "assets/pets/adapted-20261010/oneko-classic/package.zip",
    "thumbnail": "assets/pets/adapted-20261010/oneko-classic/thumbnail.webp",
    "tags": [
      "独立动作",
      "透明素材"
    ],
    "importedAt": "2026-10-10",
    "collections": [],
    "hostNotice": "下载 ZIP 后在控制中心「我的桌宠」导入，设为当前桌宠。动作名称、分类和 AI 状态绑定可自行配置。",
    "mediaActions": {
      "idle": {
        "displayName": "待机",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/idle.webp"
      },
      "alert": {
        "displayName": "警觉",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/alert.webp"
      },
      "scratch-self": {
        "displayName": "挠痒",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/scratch-self.webp"
      },
      "scratch-wall-n": {
        "displayName": "朝N抓墙",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/scratch-wall-n.webp"
      },
      "scratch-wall-s": {
        "displayName": "朝S抓墙",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/scratch-wall-s.webp"
      },
      "scratch-wall-e": {
        "displayName": "朝E抓墙",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/scratch-wall-e.webp"
      },
      "scratch-wall-w": {
        "displayName": "朝W抓墙",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/scratch-wall-w.webp"
      },
      "tired": {
        "displayName": "困倦",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/tired.webp"
      },
      "sleeping": {
        "displayName": "睡眠",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/sleeping.webp"
      },
      "run-n": {
        "displayName": "朝N奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/run-n.webp"
      },
      "run-ne": {
        "displayName": "朝NE奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/run-ne.webp"
      },
      "run-e": {
        "displayName": "朝E奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/run-e.webp"
      },
      "run-se": {
        "displayName": "朝SE奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/run-se.webp"
      },
      "run-s": {
        "displayName": "朝S奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/run-s.webp"
      },
      "run-sw": {
        "displayName": "朝SW奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/run-sw.webp"
      },
      "run-w": {
        "displayName": "朝W奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/run-w.webp"
      },
      "run-nw": {
        "displayName": "朝NW奔跑",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/oneko-classic/run-nw.webp"
      }
    }
  },
  {
    "id": "vpet-loris-pages-c3420bb",
    "title": "VPet 萝莉斯 · 原序列核心包",
    "description": "萝莉斯的 36 个透明独立动作：散步、爬行、睡觉、抚摸、学习、思考等，保留原分辨率与节拍。此包用于本系统播放动作。",
    "kind": "pet",
    "category": "原创角色",
    "author": "虚拟主播模拟器制作组",
    "authorUrl": "https://github.com/LorisYounger",
    "source": "https://github.com/LorisYounger/VPet/tree/c3420bb77d6d00ed5fabf975a0945c4f6179bba3",
    "license": "自带动画单独授权：免费、非商业再分发，保留完整版权及来源声明；代码 Apache-2.0",
    "version": 1,
    "distribution": "media",
    "download": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/package.zip",
    "thumbnail": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/thumbnail.webp",
    "tags": [
      "萝莉斯",
      "VPet",
      "36个独立动作",
      "透明素材"
    ],
    "importedAt": "2026-10-10",
    "collections": [],
    "hostNotice": "下载 ZIP 后在控制中心「我的桌宠」导入，设为当前桌宠。动作名称、分类和 AI 状态绑定可自行配置。",
    "mediaActions": {
      "vpet-default-nomal-1": {
        "displayName": "Default/Nomal/1",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-default-nomal-1.webp"
      },
      "vpet-default-happy-1": {
        "displayName": "Default/Happy/1",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-default-happy-1.webp"
      },
      "vpet-move-walk-left-b_nomal": {
        "displayName": "MOVE/walk.left/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-move-walk-left-b_nomal.webp"
      },
      "vpet-move-walk-right-b_nomal": {
        "displayName": "MOVE/walk.right/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-move-walk-right-b_nomal.webp"
      },
      "vpet-move-walk-left-faster-b_happy": {
        "displayName": "MOVE/walk.left.faster/B_Happy",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-move-walk-left-faster-b_happy.webp"
      },
      "vpet-move-walk-right-faster-b_happy": {
        "displayName": "MOVE/walk.right.faster/B_Happy",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-move-walk-right-faster-b_happy.webp"
      },
      "vpet-move-crawl-left-b_nomal": {
        "displayName": "MOVE/crawl.left/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-move-crawl-left-b_nomal.webp"
      },
      "vpet-move-crawl-right-b_nomal": {
        "displayName": "MOVE/crawl.right/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-move-crawl-right-b_nomal.webp"
      },
      "vpet-move-climb-left-b_nomal": {
        "displayName": "MOVE/climb.left/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-move-climb-left-b_nomal.webp"
      },
      "vpet-move-climb-right-b_nomal": {
        "displayName": "MOVE/climb.right/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-move-climb-right-b_nomal.webp"
      },
      "vpet-move-fall-left-b_nomal": {
        "displayName": "MOVE/fall.left/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-move-fall-left-b_nomal.webp"
      },
      "vpet-move-fall-right-b_nomal": {
        "displayName": "MOVE/fall.right/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-move-fall-right-b_nomal.webp"
      },
      "vpet-sleep-b_nomal": {
        "displayName": "Sleep/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-sleep-b_nomal.webp"
      },
      "vpet-touch_head-b_nomal": {
        "displayName": "Touch_Head/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-touch_head-b_nomal.webp"
      },
      "vpet-touch_head-happy-b": {
        "displayName": "Touch_Head/Happy/B",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-touch_head-happy-b.webp"
      },
      "vpet-touch_body-happy_turn-b": {
        "displayName": "Touch_Body/Happy_Turn/B",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-touch_body-happy_turn-b.webp"
      },
      "vpet-raise-raised_dynamic-nomal-1": {
        "displayName": "Raise/Raised_Dynamic/Nomal/1",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-raise-raised_dynamic-nomal-1.webp"
      },
      "vpet-raise-raised_static-b_nomal": {
        "displayName": "Raise/Raised_Static/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-raise-raised_static-b_nomal.webp"
      },
      "vpet-think-nomal-b": {
        "displayName": "Think/Nomal/B",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-think-nomal-b.webp"
      },
      "vpet-pinch-nomal-b": {
        "displayName": "Pinch/Nomal/B",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-pinch-nomal-b.webp"
      },
      "vpet-state-stateone-b_nomal-1": {
        "displayName": "State/StateONE/B_Nomal/1",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-state-stateone-b_nomal-1.webp"
      },
      "vpet-state-statetwo-b_nomal": {
        "displayName": "State/StateTWO/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-state-statetwo-b_nomal.webp"
      },
      "vpet-idel-yawning-nomal": {
        "displayName": "IDEL/yawning/Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-idel-yawning-nomal.webp"
      },
      "vpet-idel-boring-b_nomal": {
        "displayName": "IDEL/Boring/B_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-idel-boring-b_nomal.webp"
      },
      "vpet-music-b-nomal_1": {
        "displayName": "Music/B/Nomal_1",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-music-b-nomal_1.webp"
      },
      "vpet-work-study-b_1_nomal": {
        "displayName": "WORK/Study/B_1_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-work-study-b_1_nomal.webp"
      },
      "vpet-work-workone-b_1_nomal": {
        "displayName": "WORK/WorkONE/B_1_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-work-workone-b_1_nomal.webp"
      },
      "vpet-work-worktwo-b_1_nomal": {
        "displayName": "WORK/WorkTWO/B_1_Nomal",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-work-worktwo-b_1_nomal.webp"
      },
      "vpet-work-studytwo-nomal-b": {
        "displayName": "WORK/StudyTWO/Nomal/B",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-work-studytwo-nomal-b.webp"
      },
      "vpet-work-studypaint-nomal-b": {
        "displayName": "WORK/StudyPaint/Nomal/B",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-work-studypaint-nomal-b.webp"
      },
      "vpet-work-calligraphy-nomal-b": {
        "displayName": "WORK/Calligraphy/Nomal/B",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-work-calligraphy-nomal-b.webp"
      },
      "vpet-work-playone-nomal-b": {
        "displayName": "WORK/PlayONE/Nomal/B",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-work-playone-nomal-b.webp"
      },
      "vpet-work-grilledsausage-nomal-b": {
        "displayName": "WORK/GrilledSausage/Nomal/B",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-work-grilledsausage-nomal-b.webp"
      },
      "vpet-work-workclean-nomal-b_1": {
        "displayName": "WORK/WorkClean/Nomal/B_1",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-work-workclean-nomal-b_1.webp"
      },
      "vpet-work-ropeskipping-nomal-b-1": {
        "displayName": "WORK/RopeSkipping/Nomal/B/1",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-work-ropeskipping-nomal-b-1.webp"
      },
      "vpet-say-self-b_1": {
        "displayName": "Say/Self/B_1",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-say-self-b_1.webp"
      },
      "idle": {
        "displayName": "Default/Nomal/1（待机引用）",
        "type": "image/webp",
        "url": "assets/pets/adapted-20261010/vpet-loris-pages-c3420bb/media/vpet-default-nomal-1.webp"
      }
    }
  },
  {
    "id": "airi-windows-official",
    "title": "AIRI · Windows AI 伴侣",
    "description": "支持 Live2D／VRM、AI 对话和语音的独立伴侣应用。",
    "author": "Neko Ayaka 与 Moeru AI / AIRI 贡献者",
    "source": "https://github.com/moeru-ai/airi/releases/tag/v0.12.0-beta.5",
    "license": "代码 MIT；Live2D / VRM 模型许可另计",
    "download": "https://github.com/moeru-ai/airi/releases/download/v0.12.0-beta.5/AIRI-0.12.0-beta.5-windows-x64-setup.exe",
    "downloadLabel": "官方下载 Windows 安装器 · 699 MiB",
    "hostNotice": "官方 v0.12.0-beta.5 测试版独立应用。下载 Windows x64 安装器并完成安装，再在 AIRI 配置聊天服务或本地模型；语音功能需另外配置 ASR/TTS。Live2D/VRM 角色应按各自素材条款使用。本平台提供官方完整发行下载，不是本系统原生桌宠 ZIP，未做本机安装或 AI 联动验收。",
    "secondaryDownloads": [
      {
        "label": "官方发行与校验值",
        "url": "https://github.com/moeru-ai/airi/releases/tag/v0.12.0-beta.5"
      },
      {
        "label": "官方安装与使用指南",
        "url": "https://airi.moeru.ai/docs/en/docs/manual/tamagotchi/setup-and-use/"
      }
    ],
    "thumbnail": "assets/pets/adapted-20261010/airi-windows-official/thumbnail.webp",
    "tag": "v0.12.0-beta.5",
    "commit": "2c1e223c8dd813d7c74a324d7fd7399fbf47e8bf",
    "downloadSizeBytes": 733305834,
    "upstreamSha256": "f64473fd54f905b5a5ec8d6d3c93277f0fc7a5368f53e0938b46d25a0d8a336b",
    "distribution": "standalone",
    "runtime": "external-host",
    "installationVerified": false,
    "modelLicense": "Live2D Hiyori 等样本遵守 Live2D 素材/样本条款；VRM 使用文件或作者的许可，不按代码 MIT 概括。",
    "codeLicenseUrl": "https://github.com/moeru-ai/airi/blob/2c1e223c8dd813d7c74a324d7fd7399fbf47e8bf/LICENSE",
    "thumbnailLicense": "CC0-1.0（本次制作的纯文字封面）",
    "kind": "pet",
    "category": "其他",
    "importedAt": "2026-10-10",
    "collections": [],
    "tags": [
      "独立运行",
      "原应用"
    ]
  },
  {
    "id": "ppet-windows-official",
    "title": "PPet · Live2D 桌宠",
    "description": "独立 Live2D 桌宠应用，在原应用内加载模型与设置交互。",
    "author": "zenghongtu 与 PPet 贡献者",
    "source": "https://github.com/zenghongtu/PPet/releases/tag/v3.3.0",
    "license": "代码 MIT；默认/自选 Live2D 模型许可另计",
    "download": "https://github.com/zenghongtu/PPet/releases/download/v3.3.0/PPet3-v3.3.0-win-x64.zip",
    "downloadLabel": "官方下载 Windows x64 完整 ZIP · 79.3 MiB",
    "hostNotice": "官方 v3.3.0 Windows x64 完整应用 ZIP。完整解压后运行目录内应用 EXE，保留其运行依赖；也可下载官方安装器安装。PPet 自己负责显示和交互，模型从原宿主加载。推荐模型来源多样，没有统一再分发许可，本平台不另行复制这些模型。此条提供原应用官方下载，未做本机安装或原生动作/AI 联动验收。",
    "secondaryDownloads": [
      {
        "label": "官方 Windows 安装器 · 114 MiB",
        "url": "https://github.com/zenghongtu/PPet/releases/download/v3.3.0/PPet3_3.3.0.exe"
      },
      {
        "label": "官方 Windows 32位完整 ZIP",
        "url": "https://github.com/zenghongtu/PPet/releases/download/v3.3.0/PPet3-v3.3.0-win-ia32.zip"
      },
      {
        "label": "官方 v3.3.0 发行说明",
        "url": "https://github.com/zenghongtu/PPet/releases/tag/v3.3.0"
      }
    ],
    "thumbnail": "assets/pets/adapted-20261010/ppet-windows-official/thumbnail.webp",
    "tag": "v3.3.0",
    "commit": "663bf11796d98e96bb92be15f765ab81ee1cee56",
    "downloadSizeBytes": 83131941,
    "upstreamSha256": null,
    "distribution": "standalone",
    "runtime": "external-host",
    "installationVerified": false,
    "modelLicense": "代码仓库模型列表指向独立 live2d-model-assets 仓库，后者没有统一根许可证；具体模型仍需依据原作者条款。",
    "codeLicenseUrl": "https://github.com/zenghongtu/PPet/blob/663bf11796d98e96bb92be15f765ab81ee1cee56/LICENSE.md",
    "thumbnailLicense": "CC0-1.0（本次制作的纯文字封面）",
    "kind": "pet",
    "category": "其他",
    "importedAt": "2026-10-10",
    "collections": [],
    "tags": [
      "独立运行",
      "原应用"
    ]
  },
  {
    "id": "open-llm-vtuber-windows-official",
    "title": "Open-LLM-VTuber · 语音 AI 桌宠",
    "description": "可配置语音与 AI 对话的 Live2D 伙伴，提供完整后端和 Windows 前端。",
    "author": "Yi-Ting Chiu 与 Open-LLM-VTuber 贡献者",
    "source": "https://github.com/Open-LLM-VTuber/Open-LLM-VTuber/releases/tag/v1.2.1",
    "license": "后端 MIT；前端 Open-LLM-VTuber License 1.0；模型另有条款",
    "download": "https://pub-17317087be374bc68161ac63de2022a5.r2.dev/v1.2.1/Open-LLM-VTuber-v1.2.1-zh.zip",
    "downloadLabel": "官方加速下载中文完整后端 · 约 226 MiB",
    "hostNotice": "v1.2.1 必须配合完整后端 ZIP 与 Windows 桌面前端使用。先解压后端到英文路径，准备 Python 3.10–3.12、uv、FFmpeg，安装依赖并配置 LLM/ASR/TTS，启动后端后再打开 Windows 前端连接 localhost:12393。前端 EXE 本身不能提供 AI 对话。中文后端含官方 SenseVoice 语音识别资源；LLM 服务/模型仍须配置。此条链接由官方发行说明提供的镜像，GitHub 原版作备用；未下载或完成本机安装验收。",
    "secondaryDownloads": [
      {
        "label": "必需：官方加速 Windows 前端 · 96.4 MiB",
        "url": "https://pub-17317087be374bc68161ac63de2022a5.r2.dev/v1.2.1/open-llm-vtuber-1.2.1-setup.exe"
      },
      {
        "label": "GitHub 中文完整后端备用",
        "url": "https://github.com/Open-LLM-VTuber/Open-LLM-VTuber/releases/download/v1.2.1/v1.2.1_Open-LLM-VTuber-v1.2.1-zh.zip"
      },
      {
        "label": "GitHub Windows 前端备用",
        "url": "https://github.com/Open-LLM-VTuber/Open-LLM-VTuber/releases/download/v1.2.1/open-llm-vtuber-1.2.1-setup.exe"
      },
      {
        "label": "官方部署指南",
        "url": "https://docs.llmvtuber.com/docs/quick-start/"
      }
    ],
    "thumbnail": "assets/pets/adapted-20261010/open-llm-vtuber-windows-official/thumbnail.webp",
    "tag": "v1.2.1",
    "commit": "3afa41014b4548a0842e9ee2f576f4b164b48886",
    "frontendCommit": "7a2e214c3f266c294541127520dab7fce46787e7",
    "downloadSizeBytes": 236634662,
    "upstreamSha256": "52f5908b8cee8190aca6692577277dbc8b3381bd7c541b52a2b7dfb3d8abf4dd",
    "frontendSizeBytes": 101070444,
    "frontendUpstreamSha256": "2d9df10fe113f38d0f07ab226c8fd5f96e8d0472f0f75c625d641a8621385c9c",
    "sizeAndDigestScope": "GitHub 官方原发行文件；镜像源头在官方发行正文确认，本次未下载镜像做字节哈希比较。",
    "distribution": "standalone",
    "runtime": "external-host",
    "installationVerified": false,
    "modelLicense": "默认 Live2D 样本明确排除于 MIT，受 LICENSE-Live2D.md 及 Live2D 素材/样本条款约束；LLM、ASR、TTS 模型各自有许可。",
    "codeLicenseUrl": "https://github.com/Open-LLM-VTuber/Open-LLM-VTuber/blob/3afa41014b4548a0842e9ee2f576f4b164b48886/LICENSE",
    "frontendLicenseUrl": "https://github.com/Open-LLM-VTuber/Open-LLM-VTuber-Web/blob/7a2e214c3f266c294541127520dab7fce46787e7/LICENSE",
    "thumbnailLicense": "CC0-1.0（本次制作的纯文字封面）",
    "kind": "pet",
    "category": "其他",
    "importedAt": "2026-10-10",
    "collections": [],
    "tags": [
      "独立运行",
      "原应用"
    ]
  },
  {
    "id": "bongocat-vladelaina",
    "title": "BongoCat · vladelaina",
    "download": "https://github.com/vladelaina/BongoCat/releases/download/v1.14.0/BongoCat-1.14.0-windows-x64-portable.exe",
    "displayName": "BongoCat · vladelaina",
    "name": "BongoCat · vladelaina",
    "author": "vladelaina",
    "source": "https://github.com/vladelaina/BongoCat",
    "version": "1.14.0",
    "description": "陪你敲键盘、移动鼠标和玩手柄的实时互动猫咪。保留官方原程序、自带模型和完整键鼠互动，可独立运行。",
    "license": "原程序 AGPL-3.0-only；三类内置模型及封面 MIT；Live2D 组件遵循其独立条款。",
    "thumbnail": "assets/pets/adapted-20261010/bongocat-vladelaina/thumbnail.webp",
    "thumbnailLicense": "MIT · Copyright (c) 2026 vladelaina",
    "downloadUrl": "https://github.com/vladelaina/BongoCat/releases/download/v1.14.0/BongoCat-1.14.0-windows-x64-portable.exe",
    "downloadLabel": "下载 Windows 便携版",
    "hostNotice": "这是官方完整便携程序。下载后可直接运行；在本系统使用时，将便携 EXE 放进作品文件夹后导入，或归档后选择该 EXE 作为原应用入口，再点“独立运行”。实时键鼠互动沿用 BongoCat 原逻辑；本系统 AI 动作绑定等操作不可用。",
    "runtime": "original-application",
    "native": false,
    "downloadKind": "official-portable-exe",
    "release": "https://github.com/vladelaina/BongoCat/releases/tag/v1.14.0",
    "commit": "666999650f8afb405fa34dbf1ee0b98cd7145117",
    "officialSha256": "89ff21a675b3e58c54b841415901c1ab57692fc3e4edef86c9b13311b5036aa9",
    "officialBytes": 6334296,
    "kind": "pet",
    "category": "其他",
    "distribution": "standalone",
    "importedAt": "2026-10-10",
    "collections": [],
    "tags": [
      "独立运行",
      "原应用"
    ]
  },
  {
    "id": "bongocat-ayangweb",
    "title": "BongoCat · ayangweb",
    "download": "https://github.com/ayangweb/BongoCat/releases/download/v2.2.0/BongoCat_2.2.0_x64.exe",
    "displayName": "BongoCat · ayangweb",
    "name": "BongoCat · ayangweb",
    "author": "ayangweb",
    "source": "https://github.com/ayangweb/BongoCat",
    "version": "2.2.0",
    "description": "跟随真实键盘与鼠标操作的小猫，支持原项目模型与交互设置。下载官方完整 Windows 安装包，安装后通过原程序独立运行。",
    "license": "原程序 Apache-2.0；Live2D 组件及模型遵循原发行条款；此处提供官方下载，不在本站镜像 SDK 或模型。",
    "thumbnail": "assets/pets/adapted-20261010/bongocat-ayangweb/thumbnail.webp",
    "thumbnailLicense": "MIT · Copyright (c) 2026 vladelaina（与原发行内置封面同一图片）",
    "downloadUrl": "https://github.com/ayangweb/BongoCat/releases/download/v2.2.0/BongoCat_2.2.0_x64.exe",
    "downloadLabel": "下载 Windows 安装包",
    "hostNotice": "下载的是官方 NSIS 安装器，不是独立运行入口。先按官方流程安装，再在控制中心为导入的作品选择安装目录内实际的 bongocat-app.exe，点击“独立运行”。不要选择下载的安装器或卸载程序作为入口。键鼠监听、Live2D 模型和互动设置均沿用原项目。",
    "runtime": "original-application",
    "native": false,
    "downloadKind": "official-installer",
    "release": "https://github.com/ayangweb/BongoCat/releases/tag/v2.2.0",
    "commit": "71782a73f300b7d4c69cfac5129da2e2b869932d",
    "officialSha256": "3f486a5a07416b50682e244a4e37bbb84f9e69de2f15138eb0e90649c5f73834",
    "officialBytes": 10247196,
    "kind": "pet",
    "category": "其他",
    "distribution": "standalone",
    "importedAt": "2026-10-10",
    "collections": [],
    "tags": [
      "独立运行",
      "原应用"
    ]
  },
  {
    "id": "cloud-lykinzlj1",
    "title": "真珠",
    "author": "Lykinzlj",
    "kind": "pet",
    "category": "游戏角色",
    "version": "1.0.1",
    "description": "真珠的 12 个独立视频动作，包含待机、行走、挥手、思考、工作、睡觉和点击、拖拽回应；支持自定义动作名称与种类。",
    "distribution": "media",
    "thumbnail": "assets/pets/user-projects-20261010/cloud-lykinzlj1/thumbnail.webp",
    "mediaActions": {
      "idle": {
        "displayName": "pearl-official-idle-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/33e436b9.webm"
      },
      "action-5d628916": {
        "displayName": "pearl-official-dragged-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/5d628916.webm"
      },
      "action-82c84ef1": {
        "displayName": "pearl-official-failed-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/82c84ef1.webm"
      },
      "action-33e436b9": {
        "displayName": "pearl-official-clicked-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/65733b1d.webm"
      },
      "action-9fb12ac7": {
        "displayName": "pearl-official-jumping-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/9fb12ac7.webm"
      },
      "action-d2366c8d": {
        "displayName": "pearl-official-review-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/d2366c8d.webm"
      },
      "action-da836117": {
        "displayName": "pearl-official-running-left-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/da836117.webm"
      },
      "action-e904a850": {
        "displayName": "pearl-official-running-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/e904a850.webm"
      },
      "action-327f461c": {
        "displayName": "pearl-official-running-right-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/327f461c.webm"
      },
      "action-5f6dea1c": {
        "displayName": "pearl-official-sleeping-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/5f6dea1c.webm"
      },
      "action-856878f8": {
        "displayName": "pearl-official-waiting-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/856878f8.webm"
      },
      "action-358100d6": {
        "displayName": "pearl-official-waving-personality-01-原件",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/cloud-lykinzlj1/actions/358100d6.webm"
      }
    },
    "download": "https://github.com/xunguangzlj-cloud/desktop-pet-community/releases/download/pets-20261010/cloud-lykinzlj1.zip",
    "downloadLabel": "下载完整桌宠 ZIP（125 MB）",
    "hostNotice": "下载完整 ZIP 后，在控制中心「我的桌宠」导入并设为当前桌宠。12 个状态已与对应动作绑定，动作名称、种类和绑定可继续自定义；视频已自带透明通道，无需抠像，边缘更干净。",
    "packageManifest": "assets/pets/user-projects-20261010/cloud-lykinzlj1/pet.json",
    "packageLicense": "assets/pets/user-projects-20261010/cloud-lykinzlj1/LICENSE.txt",
    "archiveBytes": 130713060,
    "archiveSha256": "6b49ab0190dbbf6a3f6382bb1ce7bdfe44c91c38bfbcca9edc0184f45017d4bf",
    "license": "CC Lykinzlj-NC 4.0",
    "source": "https://github.com/xunguangzlj-cloud/desktop-pet-community/issues/1",
    "importedAt": "2026-10-10",
    "tags": [
      "真珠",
      "视频动作",
      "自定义动作"
    ],
    "collections": []
  },
  {
    "id": "danya-pet-windows",
    "title": "达妮娅 · 三形态",
    "name": "达妮娅 · 三形态",
    "displayName": "达妮娅 · 三形态",
    "author": "Lykinzlj",
    "source": "https://github.com/xunguangzlj-cloud/danya-pet",
    "version": "0.3.1",
    "description": "达妮娅的原服装、缠布条与星空三种形态，83 条透明视频动作；支持点击回应、拖拽抛物线反弹、安静或随机模式、大小调整与可选 AI 联动。",
    "license": "代码 MIT；角色、视频及第三方素材权利独立，随原项目发行说明保留。",
    "thumbnail": "assets/pets/user-projects-20261010/danya-pet-windows/thumbnail.webp",
    "thumbnailLicense": "用户本人既有项目角色预览；角色及视频权利说明保留于原发行 NOTICE.md。",
    "download": "https://pan.baidu.com/s/1oERgVsV16X-_CLaKoicwLA?pwd=tqjh",
    "downloadUrl": "https://pan.baidu.com/s/1oERgVsV16X-_CLaKoicwLA?pwd=tqjh",
    "downloadLabel": "网盘下载完整安装包（4.15 GB）",
    "hostNotice": "完整包自带运行环境与 83 条视频，网盘提取码 tqjh。下载整个 ZIP 并解压，保持安装程序与角色素材.dat 在同一文件夹，再双击安装程序。安装完成后从桌面启动；需由控制中心独立运行时，选择安装目录内的“启动达妮娅桌宠.exe”。现有三形态、键鼠互动、托盘与可选 AI 联动沿用此应用；不要把安装器作为独立运行入口。下方 GitHub 备用文件需安装器、合并工具与三个素材分卷全部下载到同一目录后合并安装。",
    "runtime": "original-application",
    "native": false,
    "downloadKind": "complete-installer-zip-share",
    "release": "https://github.com/xunguangzlj-cloud/danya-pet/releases/tag/v0.3.1",
    "commit": "826260b",
    "officialSha256": "06df72dc7c8cf65c7db1b08ec368460bf074a98b5002140dd074f963240ac304",
    "officialBytes": 4148506708,
    "secondaryDownloads": [
      {
        "label": "danya-assets.dat.001",
        "url": "https://github.com/xunguangzlj-cloud/danya-pet/releases/download/v0.3.1/danya-assets.dat.001"
      },
      {
        "label": "danya-assets.dat.002",
        "url": "https://github.com/xunguangzlj-cloud/danya-pet/releases/download/v0.3.1/danya-assets.dat.002"
      },
      {
        "label": "danya-assets.dat.003",
        "url": "https://github.com/xunguangzlj-cloud/danya-pet/releases/download/v0.3.1/danya-assets.dat.003"
      },
      {
        "label": "DanyaPet-Setup.exe",
        "url": "https://github.com/xunguangzlj-cloud/danya-pet/releases/download/v0.3.1/DanyaPet-Setup.exe"
      },
      {
        "label": "INSTALL.zh-CN.md",
        "url": "https://github.com/xunguangzlj-cloud/danya-pet/releases/download/v0.3.1/INSTALL.zh-CN.md"
      },
      {
        "label": "MergeAssets.exe",
        "url": "https://github.com/xunguangzlj-cloud/danya-pet/releases/download/v0.3.1/MergeAssets.exe"
      },
      {
        "label": "SHA256SUMS.txt",
        "url": "https://github.com/xunguangzlj-cloud/danya-pet/releases/download/v0.3.1/SHA256SUMS.txt"
      }
    ],
    "kind": "pet",
    "category": "游戏角色",
    "distribution": "standalone",
    "importedAt": "2026-10-10",
    "collections": [],
    "tags": [
      "达妮娅",
      "三形态",
      "独立运行",
      "透明视频",
      "Windows"
    ]
  },
  {
    "id": "dsh-pet-actions",
    "title": "达妮娅 · 动作包",
    "author": "Lykinzlj",
    "kind": "pet",
    "category": "游戏角色",
    "version": "0.3.1",
    "description": "达妮娅原服装 71 个透明视频动作的可导入动作包，来自开源项目 dsh-pet：待机、行走、点击与拖拽回应、挥手、跳跃，以及思考、工作、整理、等待、完成、出错六档工作状态联动。",
    "distribution": "media",
    "thumbnail": "assets/pets/user-projects-20261010/dsh-pet-actions/thumbnail.webp",
    "mediaActions": {
      "action-a001": {
        "displayName": "举钱袋轻晃",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a001.webm"
      },
      "action-a002": {
        "displayName": "佯装无辜",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a002.webm"
      },
      "action-a003": {
        "displayName": "侧头摆手",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a003.webm"
      },
      "action-a004": {
        "displayName": "侧身张望",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a004.webm"
      },
      "action-a005": {
        "displayName": "侧身踏步",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a005.webm"
      },
      "action-a006": {
        "displayName": "侧身踱步张望",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a006.webm"
      },
      "action-a007": {
        "displayName": "侧身轻晃",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a007.webm"
      },
      "action-a008": {
        "displayName": "傲娇别过头",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a008.webm"
      },
      "action-a009": {
        "displayName": "原地向右走",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a009.webm"
      },
      "action-a010": {
        "displayName": "原地向左走",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a010.webm"
      },
      "action-a011": {
        "displayName": "叉腰小得意",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a011.webm"
      },
      "action-a012": {
        "displayName": "双手合拢抬手",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a012.webm"
      },
      "action-a013": {
        "displayName": "嘘这是秘密",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a013.webm"
      },
      "action-a014": {
        "displayName": "坐下看书",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a014.webm"
      },
      "action-a015": {
        "displayName": "坐地清点金币",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a015.webm"
      },
      "action-a016": {
        "displayName": "害羞遮脸",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a016.webm"
      },
      "action-a017": {
        "displayName": "小拳拳生气",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a017.webm"
      },
      "action-a018": {
        "displayName": "展示南瓜灯",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a018.webm"
      },
      "action-a019": {
        "displayName": "左右张望",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a019.webm"
      },
      "action-a020": {
        "displayName": "庆祝",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a020.webm"
      },
      "action-a021": {
        "displayName": "开心点头",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a021.webm"
      },
      "action-a022": {
        "displayName": "张臂转圈",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a022.webm"
      },
      "action-a023": {
        "displayName": "忙碌点按",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a023.webm"
      },
      "action-a024": {
        "displayName": "悄悄偷笑",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a024.webm"
      },
      "action-a025": {
        "displayName": "戳破小泡泡",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a025.webm"
      },
      "action-a026": {
        "displayName": "扑克牌小魔术",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a026.webm"
      },
      "action-a027": {
        "displayName": "托南瓜灯摆手",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a027.webm"
      },
      "action-a028": {
        "displayName": "托腮观察",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a028.webm"
      },
      "action-a029": {
        "displayName": "抬手下蹲",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a029.webm"
      },
      "action-a030": {
        "displayName": "抬手遮脸",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a030.webm"
      },
      "action-a031": {
        "displayName": "抬掌轻点",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a031.webm"
      },
      "action-a032": {
        "displayName": "抱书翻阅",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a032.webm"
      },
      "action-a033": {
        "displayName": "抱书踏步",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a033.webm"
      },
      "action-a034": {
        "displayName": "抱臂装严肃",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a034.webm"
      },
      "action-a035": {
        "displayName": "招手邀你靠近",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a035.webm"
      },
      "action-a036": {
        "displayName": "指向旁边",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a036.webm"
      },
      "action-a037": {
        "displayName": "指尖轻点",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a037.webm"
      },
      "action-a038": {
        "displayName": "挥手告别",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a038.webm"
      },
      "action-a039": {
        "displayName": "捂嘴轻笑",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a039.webm"
      },
      "action-a040": {
        "displayName": "捂耳朵嫌吵",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a040.webm"
      },
      "action-a041": {
        "displayName": "捧生日蛋糕",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a041.webm"
      },
      "action-a042": {
        "displayName": "掌心托光球",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a042.webm"
      },
      "action-a043": {
        "displayName": "掌心托泡泡",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a043.webm"
      },
      "action-a044": {
        "displayName": "提钱袋坐下",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a044.webm"
      },
      "action-a045": {
        "displayName": "提钱袋摆动",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a045.webm"
      },
      "action-a046": {
        "displayName": "提钱袋转身",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a046.webm"
      },
      "action-a047": {
        "displayName": "摇头拒绝",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a047.webm"
      },
      "action-a048": {
        "displayName": "摊手点头",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a048.webm"
      },
      "action-a049": {
        "displayName": "摊手疑惑",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a049.webm"
      },
      "action-a050": {
        "displayName": "放松肩膀",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a050.webm"
      },
      "action-a051": {
        "displayName": "歪头眨眼",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a051.webm"
      },
      "action-a052": {
        "displayName": "比心wink",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a052.webm"
      },
      "action-a053": {
        "displayName": "比耶问候",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a053.webm"
      },
      "idle": {
        "displayName": "泡泡坐姿待机",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a054.webm"
      },
      "action-a055": {
        "displayName": "点鼻尖恶作剧",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a055.webm"
      },
      "action-a056": {
        "displayName": "竖拇指夸奖",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a056.webm"
      },
      "action-a057": {
        "displayName": "胸前抬手",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a057.webm"
      },
      "action-a058": {
        "displayName": "被点惊讶",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a058.webm"
      },
      "action-a059": {
        "displayName": "贴耳手势",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a059.webm"
      },
      "action-a060": {
        "displayName": "超绝小手刀",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a060.webm"
      },
      "action-a061": {
        "displayName": "跃起转身",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a061.webm"
      },
      "action-a062": {
        "displayName": "跃起转身庆祝",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a062.webm"
      },
      "action-a063": {
        "displayName": "跃起转身点赞",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a063.webm"
      },
      "action-a064": {
        "displayName": "蹲身转头",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a064.webm"
      },
      "action-a065": {
        "displayName": "轻摆裙角行礼",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a065.webm"
      },
      "action-a066": {
        "displayName": "轻轻鼓掌",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a066.webm"
      },
      "action-a067": {
        "displayName": "闭眼抬手点头",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a067.webm"
      },
      "action-a068": {
        "displayName": "闭眼挥手摇摆",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a068.webm"
      },
      "action-a069": {
        "displayName": "闭眼转身摇摆",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a069.webm"
      },
      "action-a070": {
        "displayName": "闭眼轻晃",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a070.webm"
      },
      "action-a071": {
        "displayName": "雀跃庆祝",
        "type": "video/webm",
        "url": "assets/pets/user-projects-20261010/dsh-pet-actions/actions/a071.webm"
      }
    },
    "download": "https://github.com/xunguangzlj-cloud/desktop-pet-community/releases/download/pets-20261011/dsh-pet-actions.zip",
    "downloadLabel": "下载完整动作包 ZIP（592 MB）",
    "hostNotice": "下载完整 ZIP 后，在控制中心「我的桌宠」导入并设为当前桌宠。动作包约 592 MB，自带透明通道；请使用 v4.0.1-preview.4 或更新的桌面版导入（完整包上限 1 GiB）；旧版请先更新。71 个动作名称、分类与状态绑定导入后可继续自定义。",
    "packageManifest": "assets/pets/user-projects-20261010/dsh-pet-actions/pet.json",
    "packageLicense": "assets/pets/user-projects-20261010/dsh-pet-actions/LICENSE.txt",
    "archiveBytes": 620559705,
    "archiveSha256": "f7c9830faf4d1d065ac45075dbad58ae6295a4a7206b8ac3d98cdccc9a7e9035",
    "license": "代码 MIT；角色、视频及第三方素材权利独立，随原项目发行说明保留。",
    "source": "https://github.com/xunguangzlj-cloud/danya-pet",
    "importedAt": "2026-10-11",
    "tags": [
      "达妮娅",
      "视频动作",
      "透明通道",
      "可导入",
      "开源"
    ],
    "collections": []
  }
];

export function petCredit(work) {
  return { author: work.author, source: work.source, license: work.license };
}
export function petDisplayAuthor(work) {
  return work.id === cat.id ? '上游示例（作者待核实）' : work.author;
}

// 可选工具是宿主支持的真实 SDK V3 插件，不进入声明式提醒编辑器。
export const toolPlugins = [
  {
    id: 'lingyin.file-assistant', title: '文件助手', kind: 'plugin', pluginType: 'host-tool',
    description: '快速定位文件、打开目录、虚拟分类库与可撤销推荐整理；可使用你配置的 AI 审核分类。',
    category: '可选工具', author: projectAuthor, symbol: '文', version: '1.0.0',
    sourceFolder: 'lingyin-file-assistant', source: '本项目 plugins/community/lingyin-file-assistant', license: 'MIT（插件清单与入口代码）',
    download: 'assets/lingyin.file-assistant.zip', permissions: ['files', 'status'],
    permissionLabels: ['本机文件功能', '插件状态'],
    features: ['询问文件位置并打开对应文件夹', '虚拟分类库保留原件位置', '按推荐整理需主动选择，可按记录撤销', '使用本地已配置的 AI 审核分类'],
    hostNotice: '这是 desktop pet 宿主工具插件。安装、确认权限并启用后，从本地插件配置进入；不会自动整理或删除文件。',
  },
  {
    id: 'lingyin.computer-care', title: '电脑守护', kind: 'plugin', pluginType: 'host-tool',
    description: '内存、磁盘与自启诊断建议，下载风险提醒、安装包只读检查及卸载目录核对。',
    category: '可选工具', author: projectAuthor, symbol: '护', version: '1.0.0',
    sourceFolder: 'lingyin-computer-care', source: '本项目 plugins/community/lingyin-computer-care', license: 'MIT（插件清单与入口代码）',
    download: 'assets/lingyin.computer-care.zip', permissions: ['files', 'system:metrics', 'status'],
    permissionLabels: ['用户选择的文件与目录', '电脑资源读取', '插件状态'],
    features: ['内存、磁盘与自启诊断及保存路径等建议', '用户开启后提醒可能有捆绑风险的下载行为', '选择 EXE/MSI 安装包后只读检查，不执行安装', '核对选择的卸载目录，不自动卸载或删除'],
    hostNotice: '这是 desktop pet 宿主工具插件。安装、确认权限并启用后，从本地插件配置进入；下载监测由你开启，风险提示不代表安装包安全保证。',
  },
];
