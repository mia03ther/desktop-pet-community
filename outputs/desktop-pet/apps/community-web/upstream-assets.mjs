// 仅区分投稿者的再分发声明；不把素材许可当作角色、商标或肖像授权。
export function assessAssetPermission(statement) {
  const text = String(statement || '').trim();
  if (!text || /unknown license|no explicit.*redistribution/i.test(text)) return { status: 'not-confirmed', reason: '没有明确的再分发许可', licenseUrl: '' };
  if (/personal|仅限?个人|require(?:s)? permission|repository|本仓库|for this gallery|inclusion.*gallery/i.test(text)) return { status: 'restricted', reason: '个人、原仓库或另行许可范围，未确认本站公开再分发', licenseUrl: '' };
  if (/CC BY-NC 4\.0/i.test(text)) return { status: 'redistributable', reason: '投稿者明确使用CC BY-NC 4.0，遵守非商业、署名和变更说明', licenseUrl: 'https://creativecommons.org/licenses/by-nc/4.0/' };
  if (/CC BY 4\.0/i.test(text)) return { status: 'redistributable', reason: '投稿者明确使用CC BY 4.0，保留署名和变更说明', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' };
  if (/^MIT(?: License)?\b/i.test(text)) return { status: 'redistributable', reason: '投稿者明确使用MIT，保留原声明与免责', licenseUrl: 'https://opensource.org/license/mit' };
  if (/non-commercial use and redistribution|non-commercial use and redistribution with attribution/i.test(text)) return { status: 'redistributable', reason: '投稿者明确允许非商业再分发，保留完整原条款及署名', licenseUrl: '' };
  return { status: 'not-confirmed', reason: '原文未明确授权本站再分发，不能以非商业使用推定', licenseUrl: '' };
}

export function assetAttribution(work) {
  const permission = assessAssetPermission(work.license);
  for (const field of ['id', 'title', 'author', 'upstreamCommit', 'source', 'assetsLicenseSource', 'license']) {
    if (typeof work[field] !== 'string' || !work[field].trim()) throw new Error(`作品归属资料缺少 ${field}`);
  }
  const scope = permission.status === 'redistributable'
    ? permission.reason
    : `${permission.reason}。本站收录不修改这些限制，也不授予新的使用、修改、再分发或商用权利；需另行许可时请联系原权利人。`;
  return `# ${work.title} 归属与素材许可\n\n作者：${work.author}\n\n固定提交：${work.upstreamCommit}\n\n原作品与投稿资料：${work.source}\n\n原素材声明：${work.assetsLicenseSource}\n\n${permission.licenseUrl ? `素材许可直达链接：${permission.licenseUrl}\n\n` : ''}投稿者的完整原条款：\n\n${work.license}\n\n原条款范围：${scope}\n\n本次改变：pet.json、submission.json 与 spritesheet.webp 原件逐字节保留。仅新增本站分享说明和归属资料；网页缩略图截取自原图集，原图集不改写。\n\n许可范围：上面的声明记录投稿者对其可许可贡献的授权。角色、商标、参考图、肖像及其他第三方权利不因本包取得额外许可；未独立取得这些权利人的授权证明。仓库代码的MIT与素材许可分开，原仓库代码许可另留在 ORIGINAL-REPOSITORY-LICENSE。\n`;
}
