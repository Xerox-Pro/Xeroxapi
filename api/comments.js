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
  comments: allComments.map(c => ({
    text: c.comment.content.text,                // コメント内容
    comment_id: c.comment.comment_id,           // コメントID
    published_time: c.comment.published_time,   // 経過日数
    author: {
      id: c.comment.author.id,                  // アカウントID
      name: c.comment.author.name,              // アカウント名
      thumbnails: c.comment.author.thumbnails,  // アカウント画像
      is_member: c.comment.is_member,           // メンバーかどうか
      member_badge: c.comment.member_badge?.url // バッジアイコン（メンバーの場合）
    },
    like_count: c.comment.like_count,           // 高評価数
    reply_count: c.comment.reply_count,         // 返信数
    is_pinned: c.comment.is_pinned              // ピン留めされているか
  }))
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
