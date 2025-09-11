import { Innertube } from "youtubei.js";

let youtube;

function safeText(obj) {
  if (!obj) return null;
  if (typeof obj === "string") return obj;
  if (obj.text) return obj.text;
  if (obj.runs) return obj.runs.map(r => r.text).join("");
  return null;
}

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const qid = req.query.id;
    if (!qid) return res.status(400).json({ error: "Missing video id" });

    const info = await youtube.getInfo(qid);

    const basic = info.basic_info || {};
    const primary = info.primary_info || {};
    const secondary = info.secondary_info || {};

    // メイン動画
    const videoId = qid;
    const mainData = {
      videoId,
      title: safeText(primary.title) || basic.title,
      description: basic.short_description || "",
      full_description: safeText(secondary.description) || "",
      views: primary.view_count?.text || basic.view_count || null,
      likes: basic.like_count || null,
      upload_date: primary.published?.text || null,
      channel: {
        id: secondary?.owner?.author?.id || basic.channel_id || null,
        name: secondary?.owner?.author?.name || basic.author || null,
      }
    };

    // 関連動画の候補（最大20件）
    let candidates = [];
    if (Array.isArray(info.related_videos)) candidates = candidates.concat(info.related_videos);
    if (Array.isArray(info.watch_next_feed)) candidates = candidates.concat(info.watch_next_feed);
    if (Array.isArray(secondary?.watch_next_feed)) candidates = candidates.concat(secondary.watch_next_feed);

    const seen = new Set();
    const relatedIds = [];
    for (const v of candidates) {
      const vid = v.id || v.videoId || v.content_id;
      if (!vid || seen.has(vid)) continue;
      seen.add(vid);
      relatedIds.push(vid);
      if (relatedIds.length >= 20) break;
    }

    // 関連動画の詳細を取得
    const relatedInfos = await Promise.all(
      relatedIds.map(async vid => {
        try {
          const rInfo = await youtube.getInfo(vid);
          const rBasic = rInfo.basic_info || {};
          const rPrimary = rInfo.primary_info || {};
          const rSecondary = rInfo.secondary_info || {};
          return {
            videoId: rBasic.id,
            title: safeText(rPrimary.title) || rBasic.title,
            description: rBasic.short_description || "",
            views: rPrimary.view_count?.text || rBasic.view_count || null,
            upload_date: rPrimary.published?.text || null,
            channel: {
              id: rSecondary?.owner?.author?.id || rBasic.channel_id || null,
              name: rSecondary?.owner?.author?.name || rBasic.author || null
            }
          };
        } catch (e) {
          return { videoId: vid, error: e.message };
        }
      })
    );

    res.json({ ...mainData, related_videos: relatedInfos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
