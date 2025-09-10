import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) {
      console.log("Initializing Innertube for video API...");
      youtube = await Innertube.create();
      console.log("Innertube initialized for video API.");
    }

    const id = req.query.id;
    if (!id) {
      console.warn("Video API: Missing video ID.");
      return res.status(400).json({ error: "Missing video id" });
    }

    const limit = 100;

    const info = await youtube.getInfo(id);
    if (!info || !info.basic_info) {
      console.warn(`Video API: youtube.getInfo(${id}) returned no basic info.`);
      return res.status(404).json({ error: "Video not found or ID invalid" });
    }

    const details = info.basic_info;

    let related = info.related_videos ? Array.from(info.related_videos) : [];
    let currentInfo = info; // 継続処理のために元のオブジェクトを保持

    console.log(`Video API: Initial related videos found: ${related.length}`);

    while (related.length < limit && currentInfo.has_continuation) {
      const next = await currentInfo.getContinuation();
      if (!next || !next.related_videos) {
        console.warn("Video API: getContinuation for related videos returned no data.");
        break; // 継続が失敗したらループを抜ける
      }
      related = related.concat(next.related_videos);
      currentInfo = next; // 継続オブジェクトを更新
      console.log(`Video API: Fetched ${next.related_videos.length} more related videos, total: ${related.length}`);
    }

    const mappedRelatedVideos = related.slice(0, limit).map(v => ({
      id: v.id,
      title: v.title || "Untitled",
      duration: v.duration?.text || "",
      channel: v.author?.name || "Unknown Channel",
      views: v.view_count || 0
    }));

    console.log(`Video API: Returning video info for ID: ${id}`);
    res.json({
      id: details.id,
      title: details.title,
      description: details.short_description || "",
      full_description: details.description || "",
      views: details.view_count || 0,
      likes: details.like_count || 0,
      channel: {
        id: details.channel_id,
        name: details.author,
      },
      upload_date: details.publish_date,
      keywords: details.keywords || [],
      duration: details.duration || 0,
      related_videos: mappedRelatedVideos
    });

  } catch (err) {
    console.error("Video API Error:", err.message);
    res.status(500).json({ error: `Failed to fetch video data: ${err.message}` });
  }
}
