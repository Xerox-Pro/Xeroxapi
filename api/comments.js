import { Client } from "youtubei.js";
const youtube = new Client();

export default async function commentsHandler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "動画IDを指定してください" });

  try {
    const video = await youtube.getVideo(id);
    const comments = await video.getComments();

    res.status(200).json(
      comments.items.slice(0, 100).map(c => ({
        id: c.id,
        text: c.content,
        author: c.author?.name,
        likes: c.likeCount,
        published: c.published
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
