# Architect Memory

## Magic Link Error Handling Review (ADR-003)

### Spec Review: Sound
- **Better Auth Integration:** Correct. Throwing errors in `sendMagicLink` callback propagates via SDK to client. No need for wrapper endpoints.
- **Verify Error Codes:** `INVALID_TOKEN` and `EXPIRED_TOKEN` are native Better Auth codes. Spec correctly identifies need to extract `error.code` from response.
- **requireGuest Removal:** Sound. Replace route-level guard with inline `authClient.useSession()` to enable conditional rendering of warning UI.
- **Security:** Email enumeration accepted and mitigated (global rate limit: 5/60s per IP). Comparable to email/password login flow.

### Code Validation
- `auth.instance.ts:126-153` — `sendMagicLink` callback currently does NOT validate email existence. Throws error approach is correct.
- `verify.tsx:26-54` — `useVerifyMagicLink` hook currently discards error details. Must capture and expose `error.code`.
- `-login-handlers.ts:86-87` — Already handles `mlError`. Frontend can add check for `USER_NOT_FOUND` code.

### Key Risks & Mitigations
1. **Error code shape uncertainty:** Better Auth SDK behavior with thrown errors needs testing. May need to use `APIError` from `better-auth/api` instead of plain `Error`. → Test during implementation; ADR documents this as open question.
2. **Race condition on signOut + reload:** After `authClient.signOut()` in warning state, page reloads. Session cookie must clear before reload reaches verify logic. → Implement with explicit async handling; add browser console logging if race detected.
3. **No per-email rate limit:** Global limit only. Accepted trade-off (user decision). → Revisit only if enumeration becomes an issue.

### Implementation Tier
- **Classification:** Tier F-lite (clear scope, single domain, analysis/spec exist)
- **Phases:** 4 phases, sequential (backend → frontend send handler → frontend verify errors → logged-in warning)
- **Files:** ~5, ~150 lines changed
- **Duration:** ~1 week (from analysis)

### Recommendations
1. **ADR Created:** ADR-003 documents this decision. Scope acceptance before implementation.
2. **Test Matrix:** Create test cases for each error code path (expired, invalid, missing token, unregistered email, logged-in user).
3. **i18n Keys:** 5 new keys per language (EN + FR). Use Paraglide `m.*` pattern.
4. **Verification:** Test error code propagation in isolation before implementing full flow.

## Patterns Observed
- Better Auth plugins are designed to throw errors in callbacks. Error propagation to SDK is idiomatic.
- Frontend error mapping via error code is standard SPA pattern (vs requiring new endpoints).
- Route-level guards cannot render conditional UI; move checks into component for warning UX.
