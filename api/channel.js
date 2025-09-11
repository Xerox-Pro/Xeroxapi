import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing channel id" });

    const channel = await youtube.getChannel(id);

    // 整形したデータ
    const data = {
      id: channel.id,
      name: channel.metadata?.title,
      handle: channel.metadata?.vanity_channel_url?.replace("http://www.youtube.com/", ""),
      subscribers: channel.metadata?.subscriber_count,
      video_count: channel.metadata?.video_count,
      description: channel.metadata?.description,
      avatar: channel.metadata?.avatar?.[0]?.url,
      banner: channel.metadata?.banner?.[0]?.url,

      videos: channel.contents?.contents
        ?.filter(c => c.type === "GridVideo") // 動画だけ取り出す
        ?.slice(0, 100) // 最新100件だけ
        ?.map(video => ({
          id: video.id,
          title: video.title?.text,
          views: video.views?.text,
          published: video.published?.text,
          thumbnail: video.thumbnails?.[0]?.url
        }))
    };

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
