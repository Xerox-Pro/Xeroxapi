import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    // YouTube API クライアントを初期化（1回だけ）
    if (!youtube) youtube = await Innertube.create();

    // クエリから動画IDを取得
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing video id" });

    const limit = 100; // 関連動画の最大数

    // 動画情報を取得
    const info = await youtube.getInfo(id);
    const details = info.basic_info;

    // 関連動画を取得
    let related = info.related_videos ? Array.from(info.related_videos) : [];

    while (related.length < limit && info.has_continuation) {
      const next = await info.getContinuation();
      related = related.concat(next.related_videos || []);
    }

    // レスポンスとして返すJSONを構築
    res.json({
      id: details.id,                           // 動画ID
      title: details.title,                     // 動画タイトル
      description: details.short_description,   // 概要欄（短い）
      full_description: details.description,    // 概要欄（フル）
      views: details.view_count,                // 再生数
      likes: details.like_count,                // 高評価数
      upload_date: details.publish_date,        // 投稿日
      keywords: details.keywords || [],         // キーワード
      duration: details.duration,               // 再生時間

      // チャンネル情報
      channel: {
        id: details.channel_id,                       // チャンネルID
        name: details.author?.name || details.author, // チャンネル名
        thumbnails: details.author?.thumbnails || [], // チャンネルアイコン
        subscribers: details.author?.subscriber_count // 登録者数
      },

      // 関連動画（最大limit件）
      related_videos: related.slice(0, limit).map(v => ({
        id: v.id,                       // 動画ID
        title: v.title,                  // タイトル
        duration: v.duration?.text,      // 再生時間
        channel: v.author?.name,         // チャンネル名
        views: v.view_count,             // 再生数
        thumbnails: v.thumbnails || []   // サムネイル
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
