import { Client } from "youtubei.js";
const youtube = new Client();

export default async function channelHandler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "チャンネルIDを指定してください" });

  try {
    const channel = await youtube.getChannel(id);

    let videos = [];
    if (channel.videos) {
      videos = channel.videos.items.slice(0, 100).map(v => ({
        id: v.id,
        title: v.title,
        views: v.views,
        thumbnails: v.thumbnails
      }));
    }

    res.status(200).json({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      subscribers: channel.subscriberCount,
      thumbnails: channel.thumbnails,
      videos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
