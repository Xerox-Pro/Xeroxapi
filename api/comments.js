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
        comment_id: c.comment_id || null,
        text: c.content?.text || "",
        published_time: c.published_time || "",
        author: {
          id: c.author?.id || null,
          name: c.author?.name || "",
          thumbnails: c.author?.thumbnails?.map(t => t.url) || [],
        },
        is_member: c.is_member || false,
        member_badge: c.member_badge?.url || null,
        like_count: c.vote_count || 0,
        reply_count: c.reply_count || 0,
        is_pinned: c.is_pinned || false
      }))
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
