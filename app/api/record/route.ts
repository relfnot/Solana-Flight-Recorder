import { collectRecording, validSignature } from '@/lib/recorder';
import { env } from 'cloudflare:workers';

const recent = new Map<string, number[]>();
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403, headers });
  if (Number(request.headers.get('content-length') ?? 0) > 1024) return Response.json({ error: 'Request too large.' }, { status: 413, headers });
  const body = await request.text();
  if (body.length > 1024) return Response.json({ error: 'Request too large.' }, { status: 413, headers });
  let signature: unknown;
  try { signature = JSON.parse(body).signature; } catch { return Response.json({ error: 'Invalid JSON request.' }, { status: 400, headers }); }
  if (typeof signature !== 'string' || !validSignature(signature)) return Response.json({ error: 'Enter a valid Solana transaction signature (base58, 64 bytes).' }, { status: 400, headers });
  const key = request.headers.get('oai-authenticated-user-id') ?? request.headers.get('cf-connecting-ip') ?? 'local';
  const now = Date.now();
  if (recent.size > 500) for (const [k,v] of recent) if (v.every(t => now - t > 60000)) recent.delete(k);
  const hits = (recent.get(key) ?? []).filter(t => now - t < 60000);
  if (hits.length >= 10) return Response.json({ error: 'Recording limit reached. Wait one minute before trying again.' }, { status: 429, headers });
  recent.set(key, [...hits, now]);
  const secrets = env as unknown as { RPC_FAST_URL?: string };
  const endpoint = secrets.RPC_FAST_URL || 'https://api.mainnet-beta.solana.com';
  try { const url = new URL(endpoint); if (url.protocol !== 'https:') throw new Error(); } catch { return Response.json({ error: 'Server RPC configuration is invalid.' }, { status: 503, headers }); }
  const result = await collectRecording(signature, endpoint, secrets.RPC_FAST_URL ? 'RPC Fast' : 'Solana public RPC');
  return Response.json(result, { headers });
}

export async function GET() {
  const configured = Boolean((env as unknown as { RPC_FAST_URL?: string }).RPC_FAST_URL);
  return Response.json({ provider: configured ? 'RPC Fast' : 'Solana public RPC', configured, network: 'mainnet-beta' }, { headers: { 'Cache-Control': 'no-store' } });
}
