import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 50; // デフォルト20件

    const search = await youtube.search(query, { type: "video" });
    let results = search.videos;

    while (results.length < limit && search.has_continuation) {
      const next = await search.getContinuation();
      results = results.concat(next.videos);
    }

    res.json({
      results: results.slice(0, limit).map(v => ({
        id: v.id,
        title: v.title.text,
        duration: v.duration?.text,
        channel: v.author?.name,
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
