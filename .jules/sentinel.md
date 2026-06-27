## 2024-06-23 - DOM XSS in OutRedirector via new URL() Protocol Preservation
**Vulnerability:** The `OutRedirector` component checked `targetUrl.hostname` against an allowlist, but did not check `targetUrl.protocol`.
**Learning:** `new URL()` successfully parses payloads like `javascript://store.steampowered.com/%0aalert(1)`. The hostname is correctly identified as `store.steampowered.com` (passing the allowlist check), but the protocol remains `javascript:`. Passing this directly to `location.replace` executes the script. This reveals a gap in how `new URL` handles protocols vs hostnames in security validations.
**Prevention:** Always explicitly check `url.protocol === 'http:' || url.protocol === 'https:'` before using the URL in `location.replace`, `href`, or similar sinks, even if the hostname has been validated.
## 2024-06-24 - [Fix length-leaking side channel in safeEqual]
**Vulnerability:** The `safeEqual` function in `src/lib/cron-auth.ts` returned `false` early if lengths of input strings differed before comparing them with `timingSafeEqual`. This could leak the length of the string `expected` (which contains the secret) leading to timing attacks.
**Learning:** `timingSafeEqual` by itself does not protect against length-leaking if the lengths of the strings are checked beforehand and an early return is made.
**Prevention:** We can prevent this by hashing both inputs with a strong cryptographic hashing algorithm (like SHA-256) using `createHash` from `node:crypto` and comparing the generated hashes instead. Since both hashes will always have the same length regardless of the input strings' lengths, this eliminates the side-channel length leak while preserving constant time equality checks.
## 2024-05-15 - [XSS via Protocol Bypass]
**Vulnerability:** Cross-Site Scripting (XSS) vulnerability in `OutRedirector.tsx` due to missing protocol validation.
**Learning:** The `new URL()` API parses hostnames even for malicious protocols like `javascript:`. For example, `new URL('javascript://store.steampowered.com/%0aalert(1)')` will parse the hostname as `store.steampowered.com`, bypassing simple allowlist checks that only look at the hostname.
**Prevention:** Always explicitly validate the protocol (`url.protocol === 'http:' || url.protocol === 'https:'`) in addition to hostname validation when handling user-provided URLs for redirection.
