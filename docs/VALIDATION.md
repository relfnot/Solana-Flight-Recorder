# Validation record — 11 October 2026

## Automated

14 tests passed with Node’s test runner. TypeScript checking passed. A production Vinext build completed successfully. Tests are in `tests/recorder.test.mjs`.

## Browser

Verified at a desktop viewport and 390 × 844 mobile viewport:

- Application renders and provider configuration loads.
- Invalid signature is rejected with a useful message.
- Failed, successful, and missing-evidence fixtures render the appropriate verdict.
- Finalization is shown separately from execution failure.
- Account changes show the expected synthetic sender/receiver amounts.
- Real captured mainnet JSON imports successfully and is labelled unverified.
- Its 55 log lines display and filtering `failed` isolates the reported error.
- Export report action reaches its UI completion notice. The browser automation download-event wait timed out, so browser file delivery was not independently inspected; the shared report generator and CLI-written report were verified.
- Mobile layout fits the viewport; sidebar collapses into navigation.

## Live data

Signature: `gDHomHfghAV9FzKg3h3qmicvauXgWqHAqQAKvmxpUwKXkE1ZWQntsxNXuGGx1VCpNMFhk8L5qmb32Ls4qBmGWcu`

Local Node capture at `2026-10-11T15:24:40.074Z` obtained both RPC responses from Solana public mainnet. The result was finalized with an instruction error, fee 19,820 lamports, compute 184,853 units, and 55 log messages. This is a public transaction sample, not a transaction attributed to the builder.

The web development runtime received HTTP 403 from the same public endpoint. This appears as unavailable evidence in the app. No access restriction was bypassed and no paid endpoint was used.

RPC Fast endpoint access is not available yet, so end-to-end RPC Fast integration is unverified. Performance, adoption, scalability and competition eligibility have not been established by these checks.
