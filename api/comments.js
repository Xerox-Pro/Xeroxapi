import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) {
      console.log("Initializing Innertube for comments API...");
      youtube = await Innertube.create();
      console.log("Innertube initialized for comments API.");
    }

    const id = req.query.id;
    if (!id) {
      console.warn("Comments API: Missing video ID.");
      return res.status(400).json({ error: "Missing video id" });
    }

    const limit = 100;

    const commentsResponse = await youtube.getComments(id);
    if (!commentsResponse) {
      console.warn(`Comments API: youtube.getComments(${id}) returned no response.`);
      return res.status(404).json({ error: "Comments not found or video ID invalid" });
    }

    let allComments = commentsResponse.contents ? Array.from(commentsResponse.contents) : [];
    let currentComments = commentsResponse; // 継続処理のために元のオブジェクトを保持

    console.log(`Comments API: Initial comments found: ${allComments.length}`);

    while (allComments.length < limit && currentComments.has_continuation) {
      const next = await currentComments.getContinuation();
      if (!next || !next.contents) {
        console.warn("Comments API: getContinuation returned no data or contents.");
        break; // 継続が失敗したらループを抜ける
      }
      allComments = allComments.concat(next.contents);
      currentComments = next; // 継続オブジェクトを更新
      console.log(`Comments API: Fetched ${next.contents.length} more comments, total: ${allComments.length}`);
    }

    const mappedComments = allComments.slice(0, limit).map(c => ({
      author: c.author?.name || "Unknown Author",
      text: c.content?.text || "",
      likes: c.vote_count || 0
    }));

    console.log(`Comments API: Returning ${mappedComments.length} comments for video ID: ${id}`);
    res.json({
      comments: mappedComments
    });

  } catch (err) {
    console.error("Comments API Error:", err.message);
    // 詳細なエラー情報を返すか、一般的なエラーメッセージにするかは運用次第
    res.status(500).json({ error: `Failed to fetch comments: ${err.message}` });
  }
}
