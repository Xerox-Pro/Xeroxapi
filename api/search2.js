// pages/api/proxy-search.js
export default async function handler(req, res) {
  // CORS for simple testing / frontend calls
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  try {
    // 基本の外部エンドポイント
    const targetBase = 'https://siawaseok.duckdns.org/api/search';

    // incoming のクエリをそのまま転送
    const qs = new URLSearchParams(req.query).toString();
    const targetUrl = qs ? `${targetBase}?${qs}` : targetBase;

    // 外部へフェッチ（メソッドは GET/POST に対応）
    const fetchOptions = {
      method: req.method,
      // 必要最低限のヘッダだけ渡す（例: accept）
      headers: {
        accept: req.headers.accept || '*/*'
      },
      // body は POST のときのみ渡す
      body: ['GET','HEAD','OPTIONS'].includes(req.method) ? undefined : req.body
    };

    const externalRes = await fetch(targetUrl, fetchOptions);

    const contentType = externalRes.headers.get('content-type') || 'application/octet-stream';
    const bodyText = await externalRes.text();

    // クライアントへ返却（ステータス、Content-Type、CORS を維持）
    res.status(externalRes.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(bodyText);
  } catch (err) {
    console.error('proxy error', err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}
