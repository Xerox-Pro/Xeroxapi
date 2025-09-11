import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    // YouTubeクライアント初期化
    if (!youtube) youtube = await Innertube.create({ generate_session_locally: true });

    // パスパラメータから動画ID取得
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: "Missing video id" });

    const limit = 50; // 取得件数上限（関連動画）

    // 動画情報取得
    const info = await youtube.getInfo(id);
    const details = info.basic_info;

    const videoInfo = {
      title: details.title,
      description: details.description, // 概要欄
      view_count: details.view_count,
      published: details.publish_date
    };

    // 関連動画取得
    let related = info.related_videos ? Array.from(info.related_videos) : [];
    let currentInfo = info;

    while (related.length < limit && currentInfo.has_continuation) {
      const next = await currentInfo.getContinuation();
      related = related.concat(next.related_videos || []);
      currentInfo = next;
    }

    res.json({
      video_info: videoInfo,
      related_videos: related.slice(0, limit)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
