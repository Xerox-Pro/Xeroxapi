import { Innertube } from "youtubei.js";

let youtube;

function safeTextFromRuns(obj) {
  if (!obj) return null;
  if (typeof obj === "string") return obj;
  if (obj.text) return obj.text;
  if (obj.runs && Array.isArray(obj.runs)) return obj.runs.map(r => r.text || "").join("");
  return null;
}

function extractVideoId(v) {
  if (!v || typeof v !== "object") return null;
  if (v.id) return v.id;
  if (v.videoId) return v.videoId;
  if (v.content_id) return v.content_id;
  if (v.contentId) return v.contentId;
  // on_tap_endpoint.payload.videoId
  const on = v.on_tap_endpoint || v.onTapEndpoint || v.on_tap_endpoint;
  if (on && on.payload) {
    if (on.payload.videoId) return on.payload.videoId;
    if (on.payload.watchEndpoint && on.payload.watchEndpoint.videoId) return on.payload.watchEndpoint.videoId;
  }
  // nested metadata with content_id
  if (v.content_id) return v.content_id;
  return null;
}

function extractTitle(v) {
  if (!v) return null;
  if (typeof v.title === "string") return v.title;
  if (v.title && v.title.text) return v.title.text;
  if (v.metadata && v.metadata.title) return safeTextFromRuns(v.metadata.title);
  // runs array fallback
  if (v.runs) return v.runs.map(r => r.text || "").join("");
  return null;
}

function extractChannel(v) {
  if (!v) return null;
  if (v.author && v.author.name) return v.author.name;
  if (v.metadata && v.metadata.metadata_rows && v.metadata.metadata_rows[0]) {
    try {
      const part = v.metadata.metadata_rows[0].metadata_parts?.[0]?.text;
      if (part) return (part.text || (part.runs?.map(r=>r.text).join("") ));
    } catch(e){}
  }
  return null;
}

function extractViews(v) {
  if (!v) return null;
  if (v.view_count && typeof v.view_count === "object" && v.view_count.text) return v.view_count.text;
  if (v.view_count && typeof v.view_count === "string") return v.view_count;
  if (v.metadata && v.metadata.metadata_rows && v.metadata.metadata_rows[1]) {
    try {
      const part = v.metadata.metadata_rows[1].metadata_parts?.[0]?.text;
      if (part) return (part.text || (part.runs?.map(r=>r.text).join("")));
    } catch(e){}
  }
  if (v.short_view_count && v.short_view_count.text) return v.short_view_count.text;
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

    // try to get main videoId: prefer request ID, fallback to info
    let videoId = qid || basic.id || primary.video_id || primary.id || null;
    if (!videoId) {
      // brute-force scan a few places
      videoId = basic.id || primary.id || secondary?.owner?.author?.id || null;
    }

    // collect related candidates from multiple places
    let candidates = [];
    if (Array.isArray(info.related_videos)) candidates = candidates.concat(info.related_videos);
    if (Array.isArray(info.watch_next_feed)) candidates = candidates.concat(info.watch_next_feed);
    if (Array.isArray(secondary?.watch_next_feed)) candidates = candidates.concat(secondary.watch_next_feed);
    if (info.player_overlays && Array.isArray(info.player_overlays.end_screen?.results)) {
      candidates = candidates.concat(info.player_overlays.end_screen.results);
    }

    // normalize & dedupe
    const seen = new Set();
    const related = [];
    for (const v of candidates) {
      const vid = extractVideoId(v);
      if (!vid) continue;
      if (seen.has(vid)) continue;
      seen.add(vid);
      related.push({
        videoId: vid,
        title: extractTitle(v),
        duration: v.duration?.text || v.duration,
        channel: extractChannel(v),
        views: extractViews(v)
      });
      if (related.length >= 20) break;
    }

    // build response
    res.json({
      videoId,
      title: safeTextFromRuns(primary.title) || primary.title || basic.title || null,
      description: basic.short_description || "",
      full_description: safeTextFromRuns(secondary.description) || secondary.description || "",
      views: (primary.view_count && primary.view_count.text) || primary.view_count || null,
      likes: basic.like_count || null,
      upload_date: (primary.published && primary.published.text) || primary.published || null,
      channel: {
        id: secondary?.owner?.author?.id || basic.channel_id || null,
        name: secondary?.owner?.author?.name || basic.author || null
      },
      related_videos: related
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
