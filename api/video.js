import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing video id" });

    const info = await youtube.getInfo(id);

    const details = info.basic_info;
    const primary = info.primary_info;
    const secondary = info.secondary_info;

    // 関連動画
    let related = info.related_videos ? Array.from(info.related_videos) : [];
    if (info.has_continuation) {
      const next = await info.getContinuation();
      related = related.concat(next.related_videos || []);
    }

    res.json({
      id: details.id,
      title: primary?.title?.text || details.title,
      description: details.short_description || "",
      full_description: secondary?.description?.text || "",
      views: primary?.view_count?.text || details.view_count,
      likes: details.like_count || 0,
      upload_date: primary?.published?.text || details.publish_date,
      channel: {
        id: secondary?.owner?.author?.id || details.channel_id,
        name: secondary?.owner?.author?.name || details.author,
      },
      related_videos: related.slice(0, 20).map(v => ({
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
