# Solana Flight Recorder — 3-minute demo

## Positioning

An evidence-first incident recorder for Solana builders. Its practical differentiator is the portable evidence bundle: keep the response, the provider label, the capture timestamp, the RPC observations, and explicit uncertainty together. It does not claim to be the first explorer, a full transaction replay engine, or a guaranteed explanation of why transactions fail.

## Walkthrough

**0:00–0:20 — The problem.** “When a transaction fails, support conversations often start with a screenshot or a signature. Flight Recorder turns the available RPC evidence into a report another developer can inspect.”

**0:20–0:55 — A precise failure.** Open Instruction error. Point out that the transaction is finalized while its execution failed. Open Program logs and filter `failed`. Explain that custom error 6001 has no universal meaning without the program definition. This example is synthetic and clearly labelled.

**0:55–1:20 — Uncertainty matters.** Open Missing evidence. Explain that no returned data does not prove “dropped” or “expired.” A provider error is also separate from a transaction error.

**1:20–2:00 — Real mainnet evidence.** Import `mainnet-v1-evidence.json` supplied with the deliverables. This is a captured mainnet observation, not a synthetic fixture. The UI marks all imported files unverified because an uploaded JSON file can be edited. Show the real error, fee, compute, and log filter. The capture used the public Solana endpoint, not RPC Fast.

**2:00–2:30 — Handoff.** Export the Markdown incident report and JSON bundle. A teammate can import the bundle locally. No account, wallet, signing, or transaction submission is involved in the diagnostics flow.

**2:30–3:00 — Infrastructure fit.** Explain that RPC Fast is integrated through a server-side endpoint setting. A live deployment needs granted RPC Fast access before claiming actual sponsor usage. Two bounded RPC requests per inspection keep the MVP small. Streaming is a potential next phase, not implemented functionality.

## Before recording a submission video

- Obtain the actual RPC Fast access and configure the server secret.
- Verify one live failed transaction and one live successful transaction through RPC Fast; preserve both bundles.
- Avoid displaying endpoint URLs or credentials in the video.
- Make the demo accessible to judges; the initial Sites deployment is private.
- Publish a public source repository only under the builder’s actual account and chosen license.
- Register and submit the project in Colosseum and the applicable sidetrack. None of those steps are completed by this code package.
- Verify current submission deadline and eligibility on the organizers’ live pages; the form’s September 15–November 15 access period is not a submission deadline.

## Short project description

Solana Flight Recorder turns transaction signatures into portable, evidence-based incident reports. Builders can inspect execution outcomes separately from confirmation state, filter program logs, review SOL balance changes, and export or import an evidence bundle. It explicitly distinguishes missing data and provider failures from transaction failures. The MVP supports mainnet read-only RPC inspection, synthetic demos, a local capture CLI, and server-side RPC Fast endpoint configuration.

## Next sessions, each under two hours

1. Accounts and access: Colosseum project, RPC Fast account/application, community requirements.
2. Sponsor validation: configure the endpoint; capture representative live results; document real limitations and observed timings without performance marketing claims.
3. User feedback: ask two Solana builders to investigate a transaction using the report; record where evidence is still missing.
4. Submission: record the walkthrough, verify public judge access, and complete registration with accurate owner details.

Additional development should follow observed feedback. Do not add gRPC, automatic retries, wallet signing, or continuous recording simply to expand the feature list.
