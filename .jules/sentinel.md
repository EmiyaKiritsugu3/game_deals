## 2024-06-23 - DOM XSS in OutRedirector via new URL() Protocol Preservation
**Vulnerability:** The `OutRedirector` component checked `targetUrl.hostname` against an allowlist, but did not check `targetUrl.protocol`.
**Learning:** `new URL()` successfully parses payloads like `javascript://store.steampowered.com/%0aalert(1)`. The hostname is correctly identified as `store.steampowered.com` (passing the allowlist check), but the protocol remains `javascript:`. Passing this directly to `location.replace` executes the script. This reveals a gap in how `new URL` handles protocols vs hostnames in security validations.
**Prevention:** Always explicitly check `url.protocol === 'http:' || url.protocol === 'https:'` before using the URL in `location.replace`, `href`, or similar sinks, even if the hostname has been validated.
## 2024-06-24 - [Fix length-leaking side channel in safeEqual]
**Vulnerability:** The `safeEqual` function in `src/lib/cron-auth.ts` returned `false` early if lengths of input strings differed before comparing them with `timingSafeEqual`. This could leak the length of the string `expected` (which contains the secret) leading to timing attacks.
**Learning:** `timingSafeEqual` by itself does not protect against length-leaking if the lengths of the strings are checked beforehand and an early return is made.
**Prevention:** We can prevent this by hashing both inputs with a strong cryptographic hashing algorithm (like SHA-256) using `createHash` from `node:crypto` and comparing the generated hashes instead. Since both hashes will always have the same length regardless of the input strings' lengths, this eliminates the side-channel length leak while preserving constant time equality checks.
## 2026-06-25 - Open Redirect via Path Evasion in safeNext
**Vulnerability:** Open redirect in authentication callback due to inadequate prefix checks.
**Learning:** Validating URL paths strictly with `startsWith('/')` and similar manual checks is insufficient because Node's URL parser and browsers interpret strings differently. A significant issue was that an absolute URL with a malicious protocol like `javascript://...` bypasses the `startsWith` checks, causing the app to redirect to XSS payloads. By parsing with the `URL` constructor using the base origin and verifying `url.origin === origin`, we ensure the redirect stays intra-domain.
**Prevention:** Use the `URL` constructor with the base `origin` and strictly verify the resulting `origin` matches the trusted base, rather than using string matching for redirect destinations.

## 2025-02-28 - [XSS via URL parser bypass]
**Vulnerability:** XSS/Open Redirect bypass in hostname validation via malicious protocols.
**Learning:** When using `new URL()` to check a user-provided URL against an allowlist, attackers can use protocols like `javascript://valid-domain.com/...` to bypass simple hostname checks. The parser will see `valid-domain.com` as the hostname while retaining the malicious protocol.
**Prevention:** Always explicitly validate the URL protocol (e.g. `url.protocol === 'http:' || url.protocol === 'https:'`) in addition to hostname when checking URLs against an allowlist.
