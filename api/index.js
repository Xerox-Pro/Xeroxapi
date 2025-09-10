import videoHandler from "./video.js";
import searchHandler from "./search.js";
import commentsHandler from "./comments.js";
import channelHandler from "./channel.js";

export default async function handler(req, res) {
  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);

  // クエリを Express っぽく扱えるようにする
  req.query = Object.fromEntries(searchParams.entries());

  if (pathname.startsWith("/api/video")) {
    return videoHandler(req, res);
  } else if (pathname.startsWith("/api/search")) {
    return searchHandler(req, res);
  } else if (pathname.startsWith("/api/comments")) {
    return commentsHandler(req, res);
  } else if (pathname.startsWith("/api/channel")) {
    return channelHandler(req, res);
  } else {
    res.status(404).json({ error: "Not Found" });
  }
}
