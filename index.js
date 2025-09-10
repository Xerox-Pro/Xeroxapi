import express from "express";
import channel from "./api/channel.js";
import comments from "./api/comments.js";
import search from "./api/search.js";
import video from "./api/video.js";

const app = express();

// ルート設定
app.get("/api/channel", channel);
app.get("/api/comments", comments);
app.get("/api/search", search);
app.get("/api/video", video);

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
