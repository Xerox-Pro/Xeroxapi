import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing search query" });

    const limit = parseInt(req.query.limit) || 50;

    // 検索フィルターをクエリから取得
    const filter = req.query.filter || ""; // 例: "video,short,4k,recent"
    // 分割して配列にする（空文字なら空配列）
    const filters = filter ? filter.split(",") : [];

    const searchResult = await youtube.search(query, { type: "video", filters });
    let results = searchResult.videos ? Array.from(searchResult.videos) : [];

    while (results.length < limit && searchResult.has_continuation) {
      const next = await searchResult.getContinuation();
      results = results.concat(next.videos || []);
    }

    res.json({
      results: results.slice(0, limit).map(v => ({
        id: v.id,
        title: v.title?.text || v.title,
        duration: v.duration?.text,
        channel: v.author?.name,
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
