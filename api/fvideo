import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    // 急上昇動画を取得
    const trending = await youtube.getTrending();

    // そのまま返す場合
    res.json(trending);

    // 加工して返す場合の例
    /*
    res.json({
      category: trending.title,
      videos: trending.videos.map(v => ({
        id: v.id,
        title: v.title.text,
        views: v.view_count,
        duration: v.duration,
        channel: {
          id: v.author.id,
          name: v.author.name,
        },
        thumbnails: v.thumbnail,
      }))
    });
    */
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
