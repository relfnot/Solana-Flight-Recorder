# RPC Fast Focus application — complete field map and draft

Source form inspected on 11 October 2026: https://forms.gle/51MZm3SNwy1KB93CA

The form contains **11 questions, 8 required**. There is no name or wallet question. No personal details, registration, follow, or community membership have been invented. The form has not been submitted.

The form requires a Colosseum project link and says requests outside Colosseum will not be processed. It also asks for an existing RPC Fast account, X follow, Telegram membership, and Discord membership. Its sidetrack introduction says “coming soon”; do not infer the current sidetrack deadline or eligibility from that text alone.

| # | Actual question / meaning | Required | Prepared answer / remaining input |
|---|---|---|---|
| 1 | Project title | Yes | Solana Flight Recorder |
| 2 | Project website, if available | No | Use the deployed project URL only after checking reviewer access. The initial Sites deployment is private. |
| 3 | Project X profile | Yes | Builder must provide a real project X URL. |
| 4 | Link to your Colosseum project | Yes | Not available: registration/project page still needs to be created. |
| 5 | Your account on RPC Fast (email used for registration); Focus upgrade within 24–48 hours if all conditions are met | Yes | Builder must create or identify the real RPC Fast account and provide its registration email. |
| 6 | If you might need gRPC access (TxStream, Shredstream or Yellowstone), describe the request in detail | No | Use the professional draft below. |
| 7 | Point of contact on Telegram or by email (preferred communication method) | Yes | Builder must provide the actual chosen contact. |
| 8 | Follow @rpcfast on X; mention your X account for verification if different from the project account | Yes | Actual X handle and truthful follow status required. |
| 9 | Join RPC Fast Community chat on Telegram; mention your TG handle for verification | Yes | Actual Telegram handle and truthful membership required. |
| 10 | Join RPC Fast on Discord; mention your account for verification | Yes | Actual Discord username and truthful membership required. |
| 11 | Interested in the ST Earn sidetrack to potentially win a free post-hackathon RPC subscription? | No | Yes — this expresses interest, not completed registration. |

## Field 6 — infrastructure request, revised after MVP implementation

Solana Flight Recorder is an evidence-first diagnostics MVP for Solana developers. It captures available transaction metadata and signature status, separates execution outcomes from confirmation state, and presents logs, fees, compute consumption and SOL balance changes in a portable incident report. Builders can export JSON and Markdown, inspect saved evidence locally, and use a local capture CLI. Missing data and provider failures are explicitly distinguished from on-chain execution failures.

I am a solo full-stack developer working fewer than two hours per day with a $0 infrastructure budget. I am requesting complimentary Focus access for the mainnet MVP. Each inspection makes two bounded, read-only RPC calls: getTransaction and getSignatureStatuses. The implementation supports legacy, v0 and v1 transaction reads. Initial usage will be manual, low-volume investigation within the approved plan quotas. No load testing or continuous indexing is planned.

The application supports a server-side RPC Fast endpoint configuration, but RPC Fast access has not yet been granted or validated. Initial live validation used the Solana public RPC endpoint. I intend to submit the project to Colosseum and the RPC Fast infrastructure sidetrack once the required accounts and project registrations are complete; I am not claiming they are already completed.

Yellowstone gRPC is optional for a later phase, subject to complimentary availability and project fit, to capture prospective events for a small set of accounts or programs. TxStream and Shredstream are not required for this MVP. Please confirm any applicable filters, quotas and costs before enabling an upgrade. If gRPC is not available at no cost, I will keep the project RPC-only.

The intended contribution is a reproducible transaction-diagnostics demo and technical write-up documenting the actual RPC Fast integration, observed behavior and limitations. There are no production adoption figures, validated performance improvements or sponsor-usage claims to report yet.

## Pending owner inputs

Real project X URL; Colosseum project URL; existing RPC Fast registration email; contact preference and handle/address; X verification handle; Telegram handle; Discord username; accurate follow/join completion status.

Submission remains a separate final action and requires the user’s explicit approval.
