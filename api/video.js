import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing video id" });

    const limit = 100;

    const info = await youtube.getInfo(id);
    const details = info.basic_info;

    let related = info.related_videos ? Array.from(info.related_videos) : [];

    while (related.length < limit && info.has_continuation) {
      const next = await info.getContinuation();
      related = related.concat(next.related_videos || []);
    }

    res.json({
      id: details.id,
      title: details.title,
      description: details.short_description,
      full_description: details.description,
      views: details.view_count,
      likes: details.like_count,
      channel: {
        id: details.channel_id,
        name: details.author,
      },
      upload_date: details.publish_date,
      keywords: details.keywords || [],
      duration: details.duration,
      related_videos: related.slice(0, limit).map(v => ({
        id: v.id,
        title: v.title,
        duration: v.duration?.text,
        channel: v.author?.name,
        views: v.view_count
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
