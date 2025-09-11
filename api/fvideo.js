// api/trending.js
import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) {
      youtube = await Innertube.create({
        lang: "ja", // 表示言語
        location: "JP" // 地域コード（日本）
      });
    }

    const mtrending = await youtube.getTrending(music);
    const vtrending = await youtube.getTrending();
    const gtrending = await youtube.getTrending(game);

    res.json(
      vtrending.videos.map(v => ({
        id: v.id,
        title: v.title,
        channel: v.author?.name,
        views: v.view_count,
        uploaded: v.published,
      }))
     mtrending.videos.map(v => ({
        id: v.id,
        title: v.title,
        channel: v.author?.name,
        views: v.view_count,
        uploaded: v.published,
      })
gtrending.videos.map(v => ({
        id: v.id,
        title: v.title,
        channel: v.author?.name,
        views: v.view_count,
        uploaded: v.published,
));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
