/**
 * Cloudflare Pages Function: GET /api/tts?text=...&voice=female|male&rate=1.0|0.75
 *
 * Streams real-time Korean neural speech (audio/mpeg). No static mp3 files are stored.
 *  1) Primary: Microsoft Edge "Read Aloud" Neural TTS over WebSocket
 *     (ko-KR-SunHiNeural = female, ko-KR-InJoonNeural = male) – no API key required.
 *  2) Fallback: Google Translate TTS endpoint (tl=ko).
 * Responses are cached at the edge (Cache API) so repeated phrases are instant.
 * The browser additionally falls back to window.speechSynthesis if this endpoint fails.
 */

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM_FULL_VERSION = '130.0.2849.68';
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
const EDGE_WSS =
  'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const VOICES: Record<string, string> = {
  female: 'ko-KR-SunHiNeural',
  male: 'ko-KR-InJoonNeural',
};
const MAX_LEN = 400;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function uuid() {
  return crypto.randomUUID().replace(/-/g, '');
}

/** Sec-MS-GEC token: SHA-256 of (Windows file-time ticks rounded to 5 minutes + client token) */
async function secMsGec(): Promise<string> {
  const WIN_EPOCH = 11644473600n;
  let secs = BigInt(Math.floor(Date.now() / 1000)) + WIN_EPOCH;
  secs -= secs % 300n;
  const ticks = secs * 10_000_000n;
  const data = new TextEncoder().encode(`${ticks.toString()}${TRUSTED_CLIENT_TOKEN}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

async function edgeTts(text: string, voice: string, rate: number): Promise<Uint8Array> {
  const gec = await secMsGec();
  const connId = uuid();
  const url = `${EDGE_WSS}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connId}`;

  const resp = await fetch(url, {
    headers: {
      Upgrade: 'websocket',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0`,
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const ws = resp.webSocket;
  if (!ws) throw new Error(`Edge TTS upgrade failed: ${resp.status}`);
  ws.accept();

  const ratePct = Math.round((rate - 1) * 100);
  const rateStr = `${ratePct >= 0 ? '+' : ''}${ratePct}%`;
  const ts = new Date().toString();
  const requestId = uuid();

  return new Promise<Uint8Array>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const timer = setTimeout(() => {
      try { ws.close(); } catch { /* ignore */ }
      reject(new Error('Edge TTS timeout'));
    }, 12000);

    ws.addEventListener('message', (ev: MessageEvent) => {
      const data = ev.data;
      if (typeof data === 'string') {
        if (data.includes('Path:turn.end')) {
          clearTimeout(timer);
          try { ws.close(); } catch { /* ignore */ }
          const audio = concat(chunks);
          if (audio.byteLength === 0) reject(new Error('Edge TTS returned no audio'));
          else resolve(audio);
        }
        return;
      }
      const buf = new Uint8Array(data as ArrayBuffer);
      if (buf.byteLength < 2) return;
      const headerLen = (buf[0] << 8) | buf[1];
      const header = new TextDecoder().decode(buf.subarray(2, 2 + headerLen));
      if (header.includes('Path:audio')) {
        const audio = buf.subarray(2 + headerLen);
        if (audio.byteLength) chunks.push(audio.slice());
      }
    });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('Edge TTS socket error'));
    });
    ws.addEventListener('close', () => {
      clearTimeout(timer);
      if (chunks.length) resolve(concat(chunks));
      else reject(new Error('Edge TTS closed without audio'));
    });

    ws.send(
      `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`,
    );
    ws.send(
      `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n` +
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ko-KR'>` +
        `<voice name='${voice}'><prosody pitch='+0Hz' rate='${rateStr}' volume='+0%'>${escapeXml(text)}</prosody></voice></speak>`,
    );
  });
}

async function googleTts(text: string, rate: number): Promise<Uint8Array> {
  const speed = rate < 1 ? '0.4' : '1';
  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&ttsspeed=${speed}` +
    `&q=${encodeURIComponent(text.slice(0, 200))}`;
  const r = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      Referer: 'https://translate.google.com/',
    },
  });
  if (!r.ok) throw new Error(`Google TTS ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.byteLength < 100) throw new Error('Google TTS empty');
  return buf;
}

export const onRequestGet: PagesFunction = async (context) => {
  const reqUrl = new URL(context.request.url);
  const text = (reqUrl.searchParams.get('text') || '').trim();
  const voiceKey = reqUrl.searchParams.get('voice') === 'male' ? 'male' : 'female';
  const rate = reqUrl.searchParams.get('rate') === '0.75' ? 0.75 : 1.0;

  if (!text) return json({ error: 'Missing "text" parameter' }, 400);
  if (text.length > MAX_LEN) return json({ error: `Text too long (max ${MAX_LEN})` }, 413);

  // Edge cache lookup (normalized key)
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(
    `${reqUrl.origin}/api/tts?v=2&voice=${voiceKey}&rate=${rate}&text=${encodeURIComponent(text)}`,
  );
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let audio: Uint8Array | null = null;
  let engine = 'edge';
  try {
    audio = await edgeTts(text, VOICES[voiceKey], rate);
  } catch (e) {
    console.warn('Edge TTS failed, falling back to Google:', (e as Error).message);
    try {
      engine = 'google';
      audio = await googleTts(text, rate);
    } catch (e2) {
      return json({ error: 'TTS unavailable', detail: (e2 as Error).message }, 502);
    }
  }

  const response = new Response(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=604800, immutable',
      'X-TTS-Engine': engine,
      'Access-Control-Allow-Origin': '*',
    },
  });
  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
};
