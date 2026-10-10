import { removePetChroma, resolvePetMediaPlaybackAction } from "./pet-media-contract.ts";
/** 去背只处理 192×208 的桌宠画布；隐藏后停止解码播放和绘制定时器。 */
export function createPetMediaPlayer(canvas, metadata, urlForFile) {
    canvas.width = 192;
    canvas.height = 208;
    const context = canvas.getContext("2d", { willReadFrequently: metadata.background.mode === "chroma" });
    const owner = canvas.ownerDocument;
    const video = owner.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.crossOrigin = "anonymous";
    let action = "idle";
    let paused = true;
    let destroyed = false;
    let timer = null;
    let file = "";
    let failed = false;
    let decoder = null;
    let imageFrame = null;
    let imageFrameIndex = 0;
    let imageFrameDue = 0;
    let generation = 0;
    let decoding = false;
    let loading = null;
    const closeImage = () => {
        loading?.abort();
        loading = null;
        decoder?.close();
        decoder = null;
        imageFrame?.close();
        imageFrame = null;
        imageFrameIndex = 0;
        imageFrameDue = 0;
    };
    const stopTimer = () => {
        if (timer !== null)
            clearTimeout(timer);
        timer = null;
    };
    const reportError = () => {
        failed = true;
        video.pause();
        stopTimer();
        canvas.dataset.mediaError = "true";
        console.error("[PetMedia] 动作素材无法播放", { action, file });
    };
    const draw = async () => {
        stopTimer();
        if (destroyed || paused || failed || !context || decoding)
            return;
        const isImage = file.toLowerCase().endsWith(".webp");
        if (isImage && decoder && performance.now() >= imageFrameDue) {
            const currentGeneration = generation;
            decoding = true;
            try {
                const decoded = await decoder.decode({ frameIndex: imageFrameIndex, completeFramesOnly: true });
                if (destroyed || currentGeneration !== generation) {
                    decoded.image.close();
                    return;
                }
                imageFrame?.close();
                imageFrame = decoded.image;
                imageFrameIndex = (imageFrameIndex + 1) % decoder.tracks.selectedTrack.frameCount;
                imageFrameDue = performance.now() + Math.max(40, (decoded.image.duration ?? 100000) / 1000);
            } catch {
                if (currentGeneration === generation && !destroyed) reportError();
                return;
            } finally {
                decoding = false;
                if (currentGeneration !== generation && !destroyed && !paused) queueMicrotask(resume);
            }
            if (paused) return;
        }
        const width = isImage ? imageFrame?.displayWidth : video.videoWidth;
        const height = isImage ? imageFrame?.displayHeight : video.videoHeight;
        if (width && height && (isImage ? imageFrame : video.readyState >= 2)) {
            if (width > 4096 || height > 4096 || (!isImage && (!Number.isFinite(video.duration) || video.duration > 300))) {
                reportError();
                return;
            }
            context.clearRect(0, 0, canvas.width, canvas.height);
            const ratio = Math.min(canvas.width / width, canvas.height / height);
            const drawnWidth = width * ratio;
            const drawnHeight = height * ratio;
            context.drawImage(isImage ? imageFrame : video, (canvas.width - drawnWidth) / 2, canvas.height - drawnHeight, drawnWidth, drawnHeight);
            if (metadata.background.mode === "alpha" && !canvas.dataset.mediaReady) {
                // 透明包首帧需在素材本身的边角留下透明区域，拒绝假透明矩形。
                try {
                    const left = Math.ceil((canvas.width - drawnWidth) / 2);
                    const top = Math.ceil(canvas.height - drawnHeight);
                    const right = Math.max(left, Math.floor(left + drawnWidth - 1));
                    const bottom = canvas.height - 1;
                    const corners = [[left, top], [right, top], [left, bottom], [right, bottom]];
                    if (!corners.some(([x, y]) => context.getImageData(x, y, 1, 1).data[3] < 10)) {
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        reportError();
                        return;
                    }
                } catch {
                    reportError();
                    return;
                }
            }
            if (metadata.background.mode === "chroma") {
                try {
                    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
                    removePetChroma(pixels.data, metadata.background);
                    context.putImageData(pixels, 0, 0);
                }
                catch {
                    reportError();
                    return;
                }
            }
            canvas.dataset.mediaReady = "true";
        }
        timer = setTimeout(draw, 1000 / 24);
    };
    const resume = () => {
        if (destroyed || paused || failed)
            return;
        if (!file.toLowerCase().endsWith(".webp")) {
            const currentGeneration = generation;
            void video.play().catch((error) => {
                // 切换或隐藏取消上一段的 play，不应误报新动作损坏。
                if (currentGeneration === generation && !destroyed && !paused && error?.name !== "AbortError") reportError();
            });
        }
        draw();
    };
    const loadWebp = async (url, currentGeneration) => {
        const controller = new AbortController();
        loading = controller;
        try {
            if (typeof ImageDecoder !== "function") throw new Error("当前运行环境不支持动画 WebP 解码");
            const response = await fetch(url, { credentials: "omit", signal: controller.signal });
            if (!response.ok) throw new Error("无法读取动画 WebP");
            const bytes = await response.arrayBuffer();
            if (bytes.byteLength > 100 * 1024 * 1024) throw new Error("动画 WebP 过大");
            const candidate = new ImageDecoder({ data: bytes, type: "image/webp", preferAnimation: true });
            await candidate.tracks.ready;
            if (destroyed || currentGeneration !== generation) {
                candidate.close();
                return;
            }
            const minimumFrames = metadata.staticActions?.some((id) => metadata.actions[id] === file) ? 1 : 2;
            if (!candidate.tracks.selectedTrack || candidate.tracks.selectedTrack.frameCount < minimumFrames || candidate.tracks.selectedTrack.frameCount > 600) {
                candidate.close();
                throw new Error("动画 WebP 帧数无效");
            }
            decoder = candidate;
            resume();
        } catch {
            if (currentGeneration === generation && !destroyed && !controller.signal.aborted) reportError();
        }
    };
    video.addEventListener("loadeddata", resume);
    video.addEventListener("error", reportError);
    const player = {
        setAction(nextAction) {
            action = metadata.actions[nextAction] ? nextAction : "idle";
            const nextFile = metadata.actions[action];
            canvas.dataset.mediaAction = action;
            if (nextFile === file)
                return;
            stopTimer();
            video.pause();
            generation += 1;
            closeImage();
            file = nextFile;
            failed = false;
            delete canvas.dataset.mediaError;
            delete canvas.dataset.mediaReady;
            if (context)
                context.clearRect(0, 0, canvas.width, canvas.height);
            if (file.toLowerCase().endsWith(".webp")) {
                video.removeAttribute("src");
                video.load();
                void loadWebp(urlForFile(file), generation);
            }
            else {
                video.src = urlForFile(file);
                video.load();
            }
            resume();
        },
        setPaused(value) {
            if (paused === value)
                return;
            paused = value;
            canvas.dataset.mediaPaused = String(value);
            if (paused) {
                video.pause();
                stopTimer();
            }
            else
                resume();
        },
        dispose() {
            destroyed = true;
            generation += 1;
            closeImage();
            stopTimer();
            video.pause();
            video.removeEventListener("loadeddata", resume);
            video.removeEventListener("error", reportError);
            video.removeAttribute("src");
            video.load();
        },
    };
    player.setAction("idle");
    return player;
}
/** 原窗口数据属性是动作与可见性的唯一事实来源；观察者在导航时解除。 */
export function installPetMediaRenderer(document) {
    let canvas = null;
    let player = null;
    let metadata = null;
    const update = () => {
        const next = document.querySelector("canvas[data-pet-media]");
        if (canvas !== next) {
            player?.dispose();
            player = null;
            metadata = null;
            canvas = next;
            if (canvas) {
                try {
                    const config = JSON.parse(canvas.dataset.petMedia ?? "");
                    metadata = config.metadata;
                    player = createPetMediaPlayer(canvas, config.metadata, (file) => config.urls[file]);
                }
                catch {
                    console.error("[PetMedia] 无法读取动作媒体配置");
                }
            }
        }
        if (!player)
            return;
        const root = document.documentElement.dataset;
        player.setAction(resolvePetMediaPlaybackAction(metadata, root.reactionState, root.motionState, root.flipX === "true", root.petMediaAction));
        player.setPaused(document.visibilityState === "hidden" || root.petMediaHidden === "true" || root.paused === "true" || Boolean(document.querySelector(".plugin-sprite-override")));
    };
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-reaction-state", "data-motion-state", "data-flip-x", "data-paused", "data-pet-media-hidden", "data-pet-media-action"] });
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
        observer.disconnect();
        document.removeEventListener("visibilitychange", update);
        player?.dispose();
    };
}
