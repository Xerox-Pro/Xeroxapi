import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) {
      console.log("Initializing Innertube for channel API...");
      youtube = await Innertube.create();
      console.log("Innertube initialized for channel API.");
    }

    const id = req.query.id;
    if (!id) {
      console.warn("Channel API: Missing channel ID.");
      return res.status(400).json({ error: "Missing channel id" });
    }

    const limit = 100;

    const channel = await youtube.getChannel(id);
    if (!channel) {
      console.warn(`Channel API: No channel found for ID: ${id}`);
      return res.status(404).json({ error: "Channel not found" });
    }

    const fetchVideos = async (videos) => {
      let list = videos ? Array.from(videos) : [];
      let currentVideos = videos; // 継続処理のために元のオブジェクトを保持
      
      while (list.length < limit && currentVideos?.has_continuation) {
        const next = await currentVideos.getContinuation();
        list = list.concat(next.contents || []);
        currentVideos = next; // 継続オブジェクトを更新
      }
      return list.slice(0, limit).map(v => ({
        id: v.id,
        title: v.title,
        views: v.view_count,
        thumbnail: v.thumbnails?.[v.thumbnails.length-1]?.url || null
      }));
    };

    // Promise.allSettled を使用して、一部の取得が失敗しても全体が落ちないようにする
    const [latestVideosResult, oldestVideosResult, popularVideosResult, shortsResult, playlistsResult] = await Promise.allSettled([
      fetchVideos(channel.videos),
      fetchVideos(channel.videos ? [...channel.videos].sort((a,b)=>a.publish_date-b.publish_date) : []),
      fetchVideos(channel.videos ? [...channel.videos].sort((a,b)=>b.view_count-a.view_count) : []),
      fetchVideos(channel.shorts),
      fetchVideos(channel.playlists)
    ]);

    res.json({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      subscribers: channel.subscriber_count,
      latest_videos: latestVideosResult.status === 'fulfilled' ? latestVideosResult.value : [],
      oldest_videos: oldestVideosResult.status === 'fulfilled' ? oldestVideosResult.value : [],
      popular_videos: popularVideosResult.status === 'fulfilled' ? popularVideosResult.value : [],
      shorts: shortsResult.status === 'fulfilled' ? shortsResult.value : [],
      playlists: playlistsResult.status === 'fulfilled' ? playlistsResult.value : []
    });

  } catch (err) {
    console.error("Channel API Error:", err.message);
    // 詳細なエラー情報を返すか、一般的なエラーメッセージにするかは運用次第
    res.status(500).json({ error: `Failed to fetch channel data: ${err.message}` });
  }
}
