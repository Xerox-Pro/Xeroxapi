import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing video id" });

    const limit = 100;
    let comments = await youtube.getComments(id);
    let allComments = comments.comments || [];

    while (allComments.length < limit && comments.has_continuation) {
      comments = await comments.getContinuation();
      allComments = allComments.concat(comments.comments || []);
    }

    // コメントの構造が c.comment または c にあるケースを両方対応
    const mapped = allComments.slice(0, limit).map(c => {
      const data = c.comment || c;
      return {
        author: data.author?.name || "Unknown",
        text: data.content?.text || "",
        likes: data.vote_count ?? 0
      };
    });

    res.json({ comments: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
