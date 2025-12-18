import HTML from "./index.html";

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    // 1️⃣ 先尝试走静态资源（script.js / css / 图片 等）
    if (env.ASSETS) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) {
        return asset;
      }
    }

    // 2️⃣ 兜底：返回 index.html（SPA / 直接访问 /）
    return new Response(HTML, {
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    });
  },
};
