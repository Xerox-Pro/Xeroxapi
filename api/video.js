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
    const details = info.basic_info;

    // 関連動画取得
    let related = info.related_videos ? Array.from(info.related_videos) : [];
    let currentInfo = info; // continuation用に更新する変数

    while (related.length < limit && currentInfo.has_continuation) {
      const next = await currentInfo.getContinuation();
      related = related.concat(next.related_videos || []);
      currentInfo = next; // ← continuation更新
    }

      // JSON整形して返す
    res.json({
      id: details.id,
      title: details.title,
      description: details.short_description,
      full_description: details.description,
      views: details.view_count,
      likes: details.like_count,
      upload_date: details.publish_date,
      keywords: details.keywords || [],
      duration: details.duration,
      channel: {
        id: details.channel_id,
        name: details.author?.name || details.author,
        thumbnails: details.author?.thumbnails || [],
        subscribers: details.author?.subscriber_count || null
      },
      related_videos: related.slice(0, limit).map(v => ({
        id: v.id,
        title: v.title,
        duration: v.duration?.text,
        channel: v.author?.name,
        views: v.view_count,
        thumbnails: v.thumbnails || []
      }))
    });

  } catch (err) {
    // 取得失敗時に詳細エラーを返す
    res.status(500).json({ error: err.message });
  }
}
