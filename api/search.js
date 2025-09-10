import { Client } from "youtubei.js";
const youtube = new Client();

export default async function searchHandler(req, res) {
  const { q, filter } = req.query;
  if (!q) return res.status(400).json({ error: "検索クエリを指定してください" });

  try {
    const results = await youtube.search(q, { type: filter || "video" });

    res.status(200).json(
      results.items.slice(0, 100).map(r => ({
        id: r.id,
        title: r.title,
        views: r.views,
        thumbnails: r.thumbnails,
        type: r.type,
        channel: r.channel ? { id: r.channel.id, name: r.channel.name } : null
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
