import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing video id" });

    const limit = 30; // 関連動画最大件数

    // 動画情報取得
    const info = await youtube.getInfo(id);
    const details = info.basic_info;

    // 概要欄・高評価・再生数・投稿日
    const videoData = {
      id: details.id,
      title: details.title,
      description: details.short_description,
      full_description: details.description,
      views: details.view_count,
      likes: details.like_count,
      upload_date: details.publish_date,
    };

    // 関連動画取得
    let related = [];
    if (info.related_videos) related = Array.from(info.related_videos);

    // continuation で最大 limit 件まで取得
    let next = info;
    while (related.length < limit && next.has_continuation) {
      const continuation = await next.getContinuation();
      related = related.concat(continuation.related_videos || []);
      next = continuation;
    }

    videoData.related_videos = related.slice(0, limit).map(v => ({
      id: v.id,
      title: v.title,
      duration: v.duration?.text,
      channel: v.author?.name,
      views: v.view_count
    }));

    res.json(videoData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
