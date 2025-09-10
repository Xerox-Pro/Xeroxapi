const express = require('express');
const { Client } = require('youtubei.js');
const app = express();
const port = process.env.PORT || 3000; // Vercelは環境変数PORTを設定します

let youtubeClientInstance = null; // YouTubeiクライアントのインスタンスをキャッシュする変数

// YouTubeiクライアントの初期化または既存インスタンスの取得
// Vercelのコールドスタート対策として、各リクエストでクライアントの準備を試みる
async function getYoutubeClient() {
    if (!youtubeClientInstance) {
        console.log('Initializing new YouTubei Client...');
        try {
            youtubeClientInstance = await new Client().init();
            console.log('YouTubei Client initialized successfully.');
        } catch (error) {
            console.error('Failed to initialize YouTubei Client:', error);
            // エラーが発生した場合はnullに戻し、次のリクエストで再試行させる
            youtubeClientInstance = null; 
            throw new Error('Failed to initialize YouTubei client.');
        }
    }
    return youtubeClientInstance;
}

// ヘルスチェックエンドポイント (Vercelのデプロイ時に役立ちます)
app.get('/health', (req, res) => {
    res.status(200).send('API is healthy');
});

// 1. 動画情報取得API
// 例: /api/video/dQw4w9WgXcQ
app.get('/api/video/:id', async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required.' });
    }
    try {
        const youtube = await getYoutubeClient();
        const video = await youtube.getVideo(videoId);
        res.json(video);
    } catch (error) {
        console.error(`Error fetching video ${videoId}:`, error);
        res.status(500).json({ error: 'Failed to fetch video information.', details: error.message });
    }
});

// 2. コメント取得API
// 例: /api/comments/dQw4w9WgXcQ
app.get('/api/comments/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required.' });
    }
    try {
        const youtube = await getYoutubeClient();
        // youtubei.jsのコメント取得APIは、動画オブジェクトから取得することが多いです。
        // ここでは簡単な例として直接getCommentsを呼び出していますが、
        // getVideo(videoId) -> video.getComments() のようなパターンも検討してください。
        // コメント取得数はデフォルトで制限されることが多いため、全量取得は注意が必要です。
        const comments = await youtube.getComments(videoId); // 仮のメソッド
        res.json(comments);
    } catch (error) {
        console.error(`Error fetching comments for video ${videoId}:`, error);
        res.status(500).json({ error: 'Failed to fetch comments.', details: error.message });
    }
});

// 3. チャンネル情報取得API
// 例: /api/channel/UC-lHJZR3Gqxm24_Vd_D_SMw
app.get('/api/channel/:id', async (req, res) => {
    const channelId = req.params.id;
    if (!channelId) {
        return res.status(400).json({ error: 'Channel ID is required.' });
    }
    try {
        const youtube = await getYoutubeClient();
        const channel = await youtube.getChannel(channelId); // 仮のメソッド
        res.json(channel);
    } catch (error) {
        console.error(`Error fetching channel ${channelId}:`, error);
        res.status(500).json({ error: 'Failed to fetch channel information.', details: error.message });
    }
});

// 4. 検索結果取得API
// 例: /api/search?q=nodejs tutorial
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Search query parameter "q" is required.' });
    }
    try {
        const youtube = await getYoutubeClient();
        const searchResults = await youtube.search(query);
        res.json(searchResults);
    } catch (error) {
        console.error(`Error fetching search results for query "${query}":`, error);
        res.status(500).json({ error: 'Failed to fetch search results.', details: error.message });
    }
});

// 未定義のルートに対する404ハンドラ
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

// グローバルエラーハンドラ
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});


// サーバーの起動
// Vercelの環境では、アプリケーションはポートをリッスンする必要がある
// Vercelは自動的にトラフィックをこのポートにルーティング
app.listen(port, () => {
    console.log(`YouTubei API server listening on port ${port}`);
});

// Vercelでの Serverless Functions として公開するために、Express アプリケーションをエクスポートする
// ただし、この設定は従来のExpressサーバーとしてVercelがデプロイする場合に自動で行われるため、
// 明示的に module.exports = app; を書かなくても動作する場合が多い。
// より明示的にServerless Functionとして扱う場合は、以下のように記述することも可能:
// module.exports = app; 
