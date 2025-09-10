import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing video id" });

    const limit = 100;

    const comments = await youtube.getComments(id);
    let allComments = comments.contents ? Array.from(comments.contents) : [];

    while (allComments.length < limit && comments.has_continuation) {
      const next = await comments.getContinuation();
      allComments = allComments.concat(next.contents || []);
    }

    res.json({
      comments: allComments.slice(0, limit).map(c => ({
        user: c.comments[].comment.author.name
        text: c.comments[].comment.content.text
        likes: c.comments[].comment.like_count
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
