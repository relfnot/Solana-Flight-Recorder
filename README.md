# Solana Flight Recorder

Evidence-first Solana transaction diagnostics. A working hackathon MVP for a solo full-stack builder, scoped to a $0 infrastructure budget.

## What works

- Mainnet signature lookup through a server-side RPC endpoint.
- Separate execution verdict and confirmation state.
- Legacy, v0 and v1 transaction reads using `jsonParsed` and `maxSupportedTransactionVersion: 1`.
- Program logs with filtering; fee, compute and SOL balance inspection.
- JSON evidence and Markdown incident-report export.
- Local JSON import, with schema checks, a 2 MB cap and an explicit unverified-file label.
- Three synthetic examples: failed, successful, and not observed.
- Local Node capture CLI, using the same collector as the web API.
- Up to eight recordings in tab memory; no database or browser persistence.
- RPC endpoint credentials stay server-side. No wallet connection, signing or transaction submission.

## Quick start

Use Node.js 24 LTS and npm. From the project directory:

```sh
npm ci
npm run dev
```

Open the local address printed by the server. Synthetic demos and imported reports work without RPC credentials. Live public RPC calls can be rate-limited or denied from a hosting environment.

For Windows environments where an npm wrapper cannot resolve its own path, invoke npm’s installed JavaScript entrypoint directly, or use `node scripts/run-framework.mjs dev` after dependencies are installed. The code does not require a paid service to run locally.

## RPC Fast configuration

1. Obtain real Focus access; no RPC Fast account or credentials are included.
2. Add `RPC_FAST_URL` as a server-side secret to the deployed Site. Use the complete HTTPS endpoint provided by RPC Fast. Never use a `NEXT_PUBLIC_` variable for it.
3. For local Cloudflare preview, put the same setting in a private `.dev.vars` file, which is ignored by Git. Restart the preview.
4. Confirm that the UI provider changes to RPC Fast, then inspect real signatures and preserve the exported results. A provider label only confirms configuration; successful observations confirm requests worked.

Without that setting, the default is `https://api.mainnet-beta.solana.com`. During local web-runtime validation it returned HTTP 403. The app correctly reports unavailable evidence. The local Node capture CLI successfully obtained real mainnet evidence from that public endpoint. RPC Fast itself remains untested until access is available.

## Capture locally, inspect anywhere

```sh
node scripts/capture.mjs <SOLANA_SIGNATURE> recording.json
```

The command creates `recording.json` and `recording.md`, refusing to overwrite existing files. Import the JSON with **Import evidence**. Set `RPC_FAST_URL` in the CLI process environment to use RPC Fast; do not put credentials in shell arguments or commit them. Exit code 2 means both RPC reads were unavailable; the partial report is still saved.

## Verify and build

```sh
npm test
npm run typecheck
npm run build
```

Tests cover signature validation, error/confirmation separation, null and missing metadata, partial failure, provider errors and redaction, malformed responses, demo labelling, and import validation. See `docs/VALIDATION.md` for the observed checks and limits.

The app uses React, TypeScript and the supplied Vinext/Cloudflare Sites integration. `app/page.tsx` contains the interface; `app/api/record/route.ts` handles bounded reads; `lib/recorder.ts` owns collection, verdicts, import validation and report generation. Deployment output is in `dist/`.

## API

`GET /api/record` returns provider label and configuration status, never the endpoint.

`POST /api/record` accepts `{"signature":"..."}` and returns a schema-v1 evidence bundle. It validates the decoded 64-byte signature, rejects oversized request bodies and cross-origin browser requests, performs exactly two RPC reads with 12-second timeouts, and returns partial evidence when one fails. It does not proxy arbitrary methods or accept client-provided endpoints. A best-effort in-memory limit allows ten inspections per minute per user/IP per runtime instance; this is not a globally coordinated rate limiter. Keep the initial hosted site private.

## Evidence boundaries

- A missing response does not prove dropped, expired, or never submitted.
- Finalized transactions can have execution errors.
- RPC round-trip durations are not transaction landing latency or an infrastructure benchmark.
- On-chain custom error numbers need verified program-specific definitions.
- Imported files are unsigned and may be edited. Schema validation does not authenticate them.
- This MVP captures observation snapshots. It does not replay transactions, record the original send lifecycle, simulate historical state, or use gRPC.
- SOL balance changes include fees and account funding; they are not a token-transfer decoder. Large lamport integers may exceed JavaScript safe-number precision.
- Public RPC service availability and history retention vary. The app does not silently swap providers.

## Hackathon materials

- `docs/DEMO.md`: three-minute walkthrough, positioning and next sessions.
- `docs/RPC-FAST-APPLICATION.md`: all 11 form questions, the eight required fields, accurate infrastructure request, and missing owner details.

This repository does not create Colosseum, RPC Fast, X, Telegram or Discord accounts; it does not submit forms, follow accounts, or join communities. The initial Sites deployment is private. Judge access and actual sponsor usage must be verified before submission. No competition result is guaranteed.

## Primary references

- [getTransaction](https://solana.com/docs/rpc/http/gettransaction)
- [getSignatureStatuses](https://solana.com/docs/rpc/http/getsignaturestatuses)
- [Versioned transactions, including v1 read requirements](https://solana.com/docs/core/transactions/versioned-transactions)
- [RPC Fast introduction](https://docs.rpcfast.com/rpc-fast-saas-solana/introduction)

The transaction-v1 requirement was verified on 11 October 2026 after a live request returned error -32015 with a version-0-only configuration.
