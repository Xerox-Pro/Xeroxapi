import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing channel id" });

    const limit = 100;

    const channel = await youtube.getChannel(id);

    const fetchVideos = async (videos) => {
      let list = videos || [];
      while (list.length < limit && videos?.has_continuation) {
        const next = await videos.getContinuation();
        list = list.concat(next.contents || []);
      }
      return list.slice(0, limit).map(v => ({
        id: v.id,
        title: v.title,
        views: v.view_count,
        thumbnail: v.thumbnails?.[v.thumbnails.length-1]?.url || null
      }));
    };

    const latestVideos = await fetchVideos(channel.videos);
    const oldestVideos = await fetchVideos(channel.videos?.sort((a,b)=>a.publish_date-b.publish_date));
    const popularVideos = await fetchVideos(channel.videos?.sort((a,b)=>b.view_count-a.view_count));
    const shorts = await fetchVideos(channel.shorts);
    const playlists = await fetchVideos(channel.playlists);

    res.json({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      subscribers: channel.subscriber_count,
      latest_videos: latestVideos,
      oldest_videos: oldestVideos,
      popular_videos: popularVideos,
      shorts: shorts,
      playlists: playlists
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
