import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    // YouTubeクライアント初期化（ローカルセッションを生成）
    if (!youtube) youtube = await Innertube.create({ generate_session_locally: true });

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing video id" });

    const limit = 100; // 取得上限

    // 動画情報取得
    const info = await youtube.getInfo(id);

    // 関連動画取得
    let related = info.related_videos ? Array.from(info.related_videos) : [];
    let currentInfo = info; // continuation用に更新する変数

    while (related.length < limit && currentInfo.has_continuation) {
      const next = await currentInfo.getContinuation();
      related = related.concat(next.related_videos || []);
      currentInfo = next; // ← continuation更新
    }

    // そのまま返す
    res.json({
      info,
      related_videos: related.slice(0, limit)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
