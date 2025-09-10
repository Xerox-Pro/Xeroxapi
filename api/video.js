import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    // YouTubeクライアント初期化（ローカルセッション生成で400エラー回避）
    if (!youtube) youtube = await Innertube.create({ generate_session_locally: true });

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing video id" });

    const limit = 50; // 取得件数上限（関連動画）

    // 動画情報取得
    const info = await youtube.getInfo(id);
    const details = info.basic_info;

    // 関連動画取得
    let related = info.related_videos ? Array.from(info.related_videos) : [];
    let currentInfo = info; // continuation用に更新する変数

    while (related.length < limit && currentInfo.has_continuation) {
      const next = await currentInfo.getContinuation();
      related = related.concat(next.related_videos || []);
      currentInfo = next; // continuation 更新
    }

    // そのまま整形せず返す
    res.json({
      video_info: details,
      related_videos: related.slice(0, limit)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
