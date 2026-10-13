export type RpcStatus = { slot: number; confirmations: number | null; err: unknown; confirmationStatus?: string };
export type Transaction = {
  slot: number; blockTime: number | null; version?: string | number;
  meta: null | { err: unknown; fee: number; computeUnitsConsumed?: number; logMessages: string[] | null; preBalances?: number[]; postBalances?: number[] };
  transaction: { signatures: string[]; message: { accountKeys: (string | { pubkey: string; signer?: boolean; writable?: boolean })[]; instructions?: unknown[] } };
};
export type Observation = { method: string; observedAt: string; durationMs: number; ok: boolean; error?: string };
export type Recording = {
  schemaVersion: 1; signature: string; network: 'mainnet-beta'; source: 'live' | 'demo'; provider: string;
  capturedAt: string; transaction: Transaction | null; status: RpcStatus | null; observations: Observation[]; imported?: boolean;
};
export type Verdict = { kind: 'success' | 'failed' | 'unknown'; title: string; detail: string; next: string; evidence: string };

export function validSignature(value: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(value)) return false;
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let n = BigInt(0);
  for (const char of value) n = n * BigInt(58) + BigInt(alphabet.indexOf(char));
  let bytes = 0;
  while (n > BigInt(0)) { bytes++; n >>= BigInt(8); }
  return bytes + (value.match(/^1*/)?.[0].length ?? 0) === 64;
}

export function diagnose(record: Recording): Verdict {
  const meta = record.transaction?.meta;
  const error = meta?.err ?? record.status?.err;
  if (error != null) {
    const instruction = typeof error === 'object' && error !== null && 'InstructionError' in error ? (error as { InstructionError: unknown }).InstructionError : null;
    return { kind: 'failed', title: 'Execution failed', detail: instruction ? 'The RPC response reports an instruction error. Inspect the error payload and program logs before attributing a root cause.' : 'The RPC response reports a transaction error. The recorded error is evidence; a business-level cause may need additional program context.', next: 'Identify the failing instruction and program. Reproduce with the relevant account state before changing or retrying the transaction.', evidence: JSON.stringify(error) };
  }
  if ((meta && meta.err === null) || (record.status && record.status.err === null)) {
    return { kind: 'success', title: 'Execution succeeded', detail: 'The available RPC response reports no execution error. Confirmation level is shown separately; application-level intent is not verified.', next: 'Check resulting account changes against the intended operation. Export this report to preserve the current evidence.', evidence: meta ? 'getTransaction → meta.err = null' : 'getSignatureStatuses → err = null' };
  }
  const incomplete = record.observations.some(o => !o.ok);
  return { kind: 'unknown', title: incomplete ? 'Evidence incomplete' : record.transaction ? 'Execution metadata unavailable' : 'Not observed', detail: incomplete ? 'At least one RPC request failed. Missing data cannot establish whether the transaction landed.' : record.transaction ? 'The RPC returned a transaction without execution metadata or a usable status.' : 'The provider returned no transaction or signature status. This is not proof of a dropped or expired transaction.', next: 'Verify the signature and cluster. Retry later or consult a provider with sufficient historical coverage. A signature alone cannot establish blockhash expiry.', evidence: incomplete ? 'One or more RPC reads unavailable' : 'No usable execution result returned' };
}

export async function collectRecording(signature: string, endpoint: string, provider: string, fetcher: typeof fetch = fetch): Promise<Recording> {
  if (!validSignature(signature)) throw new Error('Enter a valid 64-byte, base58 Solana transaction signature.');
  const observations: Observation[] = [];
  async function read(method: string, params: unknown[]) {
    const start = Date.now();
    try {
      const response = await fetcher(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }), signal: AbortSignal.timeout(12000), redirect: 'manual' });
      if (!response.ok) throw new Error(response.status === 429 ? 'Provider rate limit reached. Retry later.' : `Provider returned HTTP ${response.status}.`);
      const body = await response.json() as { result?: unknown; error?: { code?: number } };
      if (body.error) throw new Error(`RPC request failed (code ${body.error.code ?? 'unknown'}).`);
      if (!Object.prototype.hasOwnProperty.call(body, 'result')) throw new Error('Provider returned an invalid RPC response.');
      observations.push({ method, observedAt: new Date().toISOString(), durationMs: Date.now() - start, ok: true });
      return body.result;
    } catch (error) {
      const safe = error instanceof Error && /^(Provider |RPC request |Enter )/.test(error.message) ? error.message : 'RPC request unavailable or timed out. Retry later.';
      observations.push({ method, observedAt: new Date().toISOString(), durationMs: Date.now() - start, ok: false, error: safe });
      return undefined;
    }
  }
  const [tx, statusResult] = await Promise.all([
    read('getTransaction', [signature, { encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 1 }]),
    read('getSignatureStatuses', [[signature], { searchTransactionHistory: true }]),
  ]);
  const transaction = isTransaction(tx) && tx.transaction.signatures.includes(signature) ? tx : null;
  const statusValid = object(statusResult) && Array.isArray(statusResult.value) && statusResult.value.length === 1 && (statusResult.value[0] === null || isStatus(statusResult.value[0]));
  const status = statusValid ? (statusResult.value as (RpcStatus | null)[])[0] : null;
  if (tx !== undefined && tx !== null && !transaction) {
    const o = observations.find(o => o.method === 'getTransaction')!; o.ok = false; o.error = 'Provider returned an invalid transaction response.';
  }
  if (statusResult !== undefined && !statusValid) {
    const o = observations.find(o => o.method === 'getSignatureStatuses')!; o.ok = false; o.error = 'Provider returned an invalid status response.';
  }
  return { schemaVersion: 1, signature, network: 'mainnet-beta', source: 'live', provider, capturedAt: new Date().toISOString(), transaction, status: status ?? null, observations: observations.sort((a,b) => a.observedAt.localeCompare(b.observedAt)) };
}

export function demoRecording(kind: 'failed' | 'success' | 'unknown'): Recording {
  const err = kind === 'failed' ? { InstructionError: [0, { Custom: 6001 }] } : null;
  const program = 'DemoProgram111111111111111111111111111111111';
  return {
    schemaVersion: 1, signature: `DEMO-${kind.toUpperCase()}-SYNTHETIC-FIXTURE`, network: 'mainnet-beta', source: 'demo', provider: 'Synthetic demo fixture', capturedAt: '2026-10-11T12:00:00.000Z',
    transaction: kind === 'unknown' ? null : { slot: 370124892, blockTime: 1791719998, version: 0, meta: { err, fee: 5000, computeUnitsConsumed: kind === 'failed' ? 28412 : 17350, preBalances: [2000000000, 1000000000], postBalances: kind === 'failed' ? [1999995000, 1000000000] : [1899995000, 1100000000], logMessages: [`Program ${program} invoke [1]`, 'Program log: Instruction: DemoOperation', ...(kind === 'failed' ? ['Program log: Demo constraint check failed', `Program ${program} consumed 28412 of 200000 compute units`, `Program ${program} failed: custom program error: 0x1771`] : [`Program ${program} consumed 17350 of 200000 compute units`, `Program ${program} success`])] }, transaction: { signatures: [], message: { accountKeys: [{ pubkey: 'DemoSender1111111111111111111111111111111111', signer: true, writable: true }, { pubkey: 'DemoReceiver11111111111111111111111111111111', signer: false, writable: true }], instructions: [{ programId: program }] } } },
    status: kind === 'unknown' ? null : { slot: 370124892, confirmations: null, err, confirmationStatus: 'finalized' },
    observations: [{ method: 'getSignatureStatuses', observedAt: '2026-10-11T12:00:00.000Z', durationMs: 64, ok: true }, { method: 'getTransaction', observedAt: '2026-10-11T12:00:00.000Z', durationMs: 118, ok: true }],
  };
}

function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
const numeric = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
export function isTransaction(value: unknown): value is Transaction {
  if (!object(value) || !numeric(value.slot) || !(value.blockTime === null || numeric(value.blockTime)) || !object(value.transaction) || !object(value.transaction.message)) return false;
  const keys = value.transaction.message.accountKeys;
  if (!Array.isArray(keys) || keys.length > 256 || !keys.every(k => typeof k === 'string' ? k.length < 150 : object(k) && typeof k.pubkey === 'string' && k.pubkey.length < 150)) return false;
  if (!Array.isArray(value.transaction.signatures) || !value.transaction.signatures.every(s => typeof s === 'string')) return false;
  if (value.meta === null) return true;
  if (!object(value.meta) || !('err' in value.meta) || !numeric(value.meta.fee)) return false;
  if (!(value.meta.logMessages === null || Array.isArray(value.meta.logMessages) && value.meta.logMessages.length <= 10000 && value.meta.logMessages.every(l=>typeof l==='string' && l.length <= 100000))) return false;
  if (value.meta.computeUnitsConsumed !== undefined && !numeric(value.meta.computeUnitsConsumed)) return false;
  return ['preBalances','postBalances'].every(k=>value.meta && object(value.meta) && (value.meta[k] === undefined || Array.isArray(value.meta[k]) && value.meta[k].length <= 256 && value.meta[k].every(numeric)));
}
export function isStatus(value: unknown): value is RpcStatus {
  return object(value) && numeric(value.slot) && 'err' in value && (value.confirmations === null || numeric(value.confirmations)) && (value.confirmationStatus === undefined || ['processed','confirmed','finalized'].includes(value.confirmationStatus as string));
}
export function parseRecording(text: string): Recording {
  if (text.length > 2_000_000) throw new Error('Evidence files must be smaller than 2 MB.');
  let r: unknown; try { r = JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
  if (!object(r) || r.schemaVersion !== 1 || r.network !== 'mainnet-beta' || !['live','demo'].includes(r.source as string) || typeof r.signature !== 'string' || !(r.source==='live'?validSignature(r.signature):r.signature.startsWith('DEMO-') && r.signature.length<150) || typeof r.provider !== 'string' || r.provider.length>100 || typeof r.capturedAt !== 'string' || !Number.isFinite(Date.parse(r.capturedAt)) || !(r.transaction === null || isTransaction(r.transaction)) || !(r.status === null || isStatus(r.status)) || !Array.isArray(r.observations) || r.observations.length > 20 || !r.observations.every(o=>object(o) && ['getTransaction','getSignatureStatuses'].includes(o.method as string) && typeof o.ok==='boolean' && numeric(o.durationMs) && typeof o.observedAt==='string' && Number.isFinite(Date.parse(o.observedAt)) && (o.error===undefined || typeof o.error==='string' && o.error.length<500))) throw new Error('This is not a supported Flight Recorder evidence bundle (schema v1).');
  if (r.source==='live' && r.transaction && isTransaction(r.transaction) && !r.transaction.transaction.signatures.includes(r.signature)) throw new Error('The transaction signature does not match this evidence bundle.');
  return { schemaVersion: 1, signature:r.signature, network:'mainnet-beta', source:r.source as Recording['source'], provider:r.provider, capturedAt:r.capturedAt, transaction:r.transaction as Recording['transaction'], status:r.status as Recording['status'], observations:r.observations as Observation[], imported:true };
}

export function reportMarkdown(record: Recording): string {
  const v = diagnose(record);
  return ['# Solana Flight Recorder — incident report', '', `Source: ${record.source === 'demo' ? 'SYNTHETIC DEMO — not a real transaction' : 'Live RPC observation'}`, `Imported: ${record.imported ? 'yes — file contents are not independently verified' : 'no'}`, `Signature: ${record.signature}`, `Network: ${record.network}`, `Provider: ${record.provider}`, `Captured: ${record.capturedAt}`, '', `## ${v.title}`, v.detail, '', `Evidence: ${v.evidence}`, `Confirmation: ${record.status?.confirmationStatus ?? 'unavailable'}`, `Slot: ${record.transaction?.slot ?? record.status?.slot ?? 'unavailable'}`, `Fee (lamports): ${record.transaction?.meta?.fee ?? 'unavailable'}`, `Compute units: ${record.transaction?.meta?.computeUnitsConsumed ?? 'unavailable'}`, '', '## Suggested next step', v.next, '', '## RPC observations', ...record.observations.map(o => `- ${o.method}: ${o.ok ? 'returned' : o.error} (${o.durationMs} ms), observed ${o.observedAt}`), '', '## Program logs', ...(record.transaction?.meta?.logMessages ?? ['No logs available']).map(l => `    ${l}`), '', '## Limits', 'This is an observation snapshot, not a replay or a causal trace. Request durations measure recorder RPC round trips, not transaction landing latency. Null responses do not prove expiry or non-delivery. Historical availability depends on the provider. No wallet access or transaction submission is performed. Exported files are unsigned observations, not cryptographic attestations.', ''].join('\n');
}
