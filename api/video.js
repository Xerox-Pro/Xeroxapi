import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    // YouTubeクライアント初期化
    if (!youtube) youtube = await Innertube.create({ generate_session_locally: true });

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing video id" });

    // 動画情報取得
    const info = await youtube.getInfo(id);
    const details = info.basic_info;

    res.json({
      title: details?.title ?? null,                              // タイトル
      description: details?.short_description ?? null,           // 概要欄
      upload_date: details?.publish_date ?? null,                // 投稿日
      views: details?.view_count ?? 0,                            // 再生数
      channel: {
        id: details?.channel_id ?? null,                          // チャンネルID
        name: details?.author?.name ?? details?.author ?? null,  // チャンネル名
        thumbnails: details?.author?.thumbnails?.map(t => t.url) ?? [], // チャンネルアイコン
        subscribers: details?.author?.subscriber_count ?? 0       // 登録者数
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
