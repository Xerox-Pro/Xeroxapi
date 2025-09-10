import { Client } from "youtubei.js";
const youtube = new Client();

export default async function videoHandler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "動画IDを指定してください" });

  try {
    const video = await youtube.getVideo(id);
    const related = await video.getRelated();

    res.status(200).json({
      id: video.id,
      title: video.title,
      description: video.description,
      views: video.views,
      likes: video.likes,
      channel: {
        id: video.channel.id,
        name: video.channel.name
      },
      published: video.uploadDate,
      thumbnails: video.thumbnails,
      related: related.slice(0, 100).map(v => ({
        id: v.id,
        title: v.title,
        views: v.views,
        thumbnails: v.thumbnails
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
