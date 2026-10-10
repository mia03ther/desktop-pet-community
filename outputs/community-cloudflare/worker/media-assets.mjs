import manifest from '../../community-host/public/gallery-files.json' with { type: 'json' };

// 路由与大小只取构建时登记的公开视频，不接受访客指定的文件或外部地址。
const videos = new Map(manifest.files
  .filter(file => ['video/mp4', 'video/webm'].includes(file.mime))
  .map(file => ['/' + file.path, file]));
export const videoAssetPaths = [...videos.keys()];

function singleRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value?.trim() || '');
  // 未支持的多区间或无效格式按 HTTP 约定忽略，仍返回完整资源。
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (start >= size || start > end || (!match[1] && Number(match[2]) === 0)) return false;
  return { start, end };
}

function sliceStream(body, start, end) {
  let position = 0;
  return body.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      const previous = position;
      position += chunk.byteLength;
      const first = Math.max(0, start - previous);
      const last = Math.min(chunk.byteLength, end + 1 - previous);
      if (first < last) controller.enqueue(chunk.subarray(first, last));
      // terminate 会通过标准管道取消上游；只读取到所需范围，不保留整片。
      if (position > end) controller.terminate();
    },
    flush(controller) {
      if (position <= end) controller.error(new Error('公开视频流不完整。'));
    },
  }));
}

export async function serveVideoAsset(request, assets) {
  const video = videos.get(new URL(request.url).pathname);
  if (!video) return null;
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
  const etag = '"' + video.sha256 + '"';
  const headers = new Headers({
    'content-type': video.mime,
    'content-length': String(video.bytes),
    'accept-ranges': 'bytes',
    'etag': etag,
    'cache-control': 'public, max-age=0, must-revalidate, no-transform',
    'x-content-type-options': 'nosniff',
    'access-control-allow-origin': '*',
  });
  const ifRange = request.headers.get('if-range');
  const range = request.method === 'GET' && (!ifRange || ifRange === etag)
    ? singleRange(request.headers.get('range'), video.bytes) : null;
  if (range === false) {
    headers.set('content-range', `bytes */${video.bytes}`);
    headers.set('content-length', '0');
    return new Response(null, { status: 416, headers });
  }
  const assetHeaders = new Headers(request.headers);
  for (const name of ['range', 'if-range', 'if-none-match', 'if-modified-since']) assetHeaders.delete(name);
  assetHeaders.set('accept-encoding', 'identity');
  const response = await assets.fetch(new Request(request, { headers: assetHeaders }));
  if (response.status !== 200) return response;
  if (request.method === 'HEAD') return new Response(null, { headers });
  const encoding = response.headers.get('content-encoding');
  if (!response.body || (encoding && encoding !== 'identity')) {
    await response.body?.cancel();
    return new Response(null, { status: 502 });
  }
  const length = range ? range.end - range.start + 1 : video.bytes;
  let body = range ? sliceStream(response.body, range.start, range.end) : response.body;
  if (range) headers.set('content-range', `bytes ${range.start}-${range.end}/${video.bytes}`);
  headers.set('content-length', String(length));
  // Workers 忽略普通流手写的 Content-Length；使用平台固定长度流保留分段长度。
  if (typeof globalThis.FixedLengthStream === 'function') {
    const fixed = new globalThis.FixedLengthStream(length);
    body.pipeTo(fixed.writable).catch(error => console.error('公开视频传送中断', error?.name));
    body = fixed.readable;
  }
  return new Response(body, { status: range ? 206 : 200, headers });
}
