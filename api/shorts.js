import { Innertube } from "youtubei.js";

async function getJPShorts(limit = 100) {
    const youtube = await Innertube.create({ lang: "ja", location: "JP" });

    let shorts = [];
    let nextPage = null;

    do {
        const searchResults = await youtube.search("", {
            type: "video",
            features: ["shorts"],
            continuation: nextPage
        });

        const videos = searchResults.videos || [];
        videos.forEach(video => {
            if (video.url.includes("/shorts/")) {
                shorts.push(video); // そのままオブジェクトを追加
            }
        });

        nextPage = searchResults.continuation || null;
    } while (shorts.length < limit && nextPage);

    return shorts.slice(0, limit); // 最大100件
}

// 実行例
getJPShorts(100).then(res => console.log(res));
