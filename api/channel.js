import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing channel id" });

    const channel = await youtube.getChannel(id);

    // 基本情報
    const info = {
      channel_name: channel.metadata?.title,
      handle: channel.metadata?.vanity_channel_url?.replace("http://www.youtube.com/", ""),
      subscribers: channel.metadata?.subscriber_count,
      video_count: channel.metadata?.video_count,
      description: channel.metadata?.description,
      avatar: channel.metadata?.avatar?.[0]?.url,
      banner: channel.metadata?.banner?.[0]?.url
    };

    // 動画一覧を取得
    const videosFeed = await channel.getVideos(); // ← これ重要
    const latestVideos = videosFeed.videos
      ?.slice(0, 500) // 最新20件
      ?.map(video => ({
        video_id: video.id,
        title: video.title?.text,
        views: video.view_count,
        published: video.published,
        thumbnail: video.thumbnails?.[0]?.url
      })) || [];

    res.status(200).json({
      ...info,
      videos: latestVideos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
