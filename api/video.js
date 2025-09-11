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

    // 関連動画の取得 (related_videos または watch_next_feed)
    let related = [];
    if (info.related_videos && info.related_videos.length > 0) {
      related = info.related_videos;
    } else if (info.watch_next_feed) {
      related = info.watch_next_feed.filter(v => v.id); // videoId があるものだけ
    }

    res.json({
      videoId: details.id,  // ← 動画IDを追加
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
        videoId: v.id || v.content_id,  // ← videoId を必ず拾う
        title: v.title,
        duration: v.duration?.text,
        channel: v.author?.name || v.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text,
        views: v.view_count || v.metadata?.metadata_rows?.[1]?.metadata_parts?.[0]?.text?.text
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
