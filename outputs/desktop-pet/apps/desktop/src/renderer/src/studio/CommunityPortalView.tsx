import { useEffect, useRef, useState } from "react";

export interface CommunityPortalApi {
  openCommunityWebsite(section: "pets" | "plugins" | "create"): Promise<void>;
}

export function CommunityPortalView({ api, section = "pets" }: {
  readonly api: CommunityPortalApi;
  readonly section?: "pets" | "plugins";
}) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function openWebsite(target: "pets" | "plugins" | "create") {
    if (opening) return;
    setOpening(true);
    setError("");
    setNotice("");
    try {
      await api.openCommunityWebsite(target);
      if (alive.current) {
        setNotice("共创网站已在浏览器打开。下载后可回到控制中心导入并配置。");
      }
    } catch (failure) {
      if (alive.current) {
        setError(failure instanceof Error ? failure.message : "网站未能打开，请重试。");
      }
    } finally {
      if (alive.current) setOpening(false);
    }
  }

  return (
    <section className="studio-section community-portal" aria-label="共创网站入口">
      <div className="studio-panel">
        <h2>在网站发现和共创</h2>
        <div className="studio-actions">
          <button
            type="button"
            disabled={opening}
            data-community-section={section}
            onClick={() => { void openWebsite(section); }}
          >
            {opening ? "正在打开…" : section === "pets" ? "浏览桌宠作品" : "浏览插件作品"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={opening}
            data-community-section={section === "pets" ? "plugins" : "pets"}
            onClick={() => { void openWebsite(section === "pets" ? "plugins" : "pets"); }}
          >
            {section === "pets" ? "浏览插件作品" : "浏览桌宠作品"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={opening}
            data-community-section="create"
            onClick={() => { void openWebsite("create"); }}
          >
            开始共创
          </button>
        </div>
      </div>
      {notice && <p className="studio-notice" role="status">{notice}</p>}
      {error && <p className="studio-error" role="alert">{error}</p>}
    </section>
  );
}
