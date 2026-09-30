# A10 – Unvalidated Redirects and Forwards

## Vulnerability location

- File: `NodeGoat/app/routes/index.js`
- Route: `GET /learn`
- Authentication: the route uses `isLoggedIn`, so reproduction requires a logged-in NodeGoat session.

## Vulnerable code explanation

Before the fix, the route passed a query-string value directly to Express:

```javascript
app.get("/learn", isLoggedIn, (req, res) => {
    return res.redirect(req.query.url);
});
```

The source-to-sink flow was:

```text
req.query.url -> res.redirect()
```

`req.query.url` is attacker-controlled input. `res.redirect()` is the redirect sink. The missing control was validation of the redirect destination.

## Security impact

An authenticated user could be sent from a trusted NodeGoat page to an arbitrary external site. An attacker could use such a redirect in phishing or social-engineering links that initially appear to point to NodeGoat. A protocol-relative value such as `//example.com` could also select an external host.

## Before-fix reproduction procedure

The seeded credentials were confirmed in `NodeGoat/artifacts/db-reset.js`:

- `admin / Admin_123`
- `user1 / User1_123`

After starting NodeGoat and seeding MongoDB:

1. Sign in at `http://127.0.0.1:4101/login` (parent commit `440f64c`, separate worktree).
2. Browse to `http://127.0.0.1:4101/learn?url=https://example.com/`.
3. Confirm that the browser leaves NodeGoat and reaches `https://example.com`.
4. Additional checks can use `/learn?url=/profile` and `/learn?url=//example.com`. These are separate from the captured HTTPS-payload demonstration.

For authenticated curl evidence, the actual login fields are `userName` and `password`. CSRF middleware is disabled in this intentionally vulnerable version, so the hidden `_csrf` value is empty. One reproducible sequence is:

```powershell
curl.exe -sS -c nodegoat-cookies.txt -D - -o NUL -d "userName=user1&password=User1_123" http://127.0.0.1:4101/login
curl.exe -sS -b nodegoat-cookies.txt -D - -o NUL "http://127.0.0.1:4101/learn?url=https://example.com/"
```

### Before-fix expected result

The malicious authenticated request returns an external `Location: https://example.com` and the browser follows it. The internal `/profile` target remains within NodeGoat. A plain unauthenticated request is not valid evidence because middleware redirects it to `/login` first.

Live reproduction completed on 30 September 2026. The isolated parent worktree at `440f64c` ran on port 4101. Login returned `Location: /dashboard`; an authenticated GET to `/learn?url=https://example.com/` returned HTTP 302 with `Location: https://example.com/`. Chrome reached the external destination. The screenshots are listed below.

## Fix

`NodeGoat/app/routes/redirect.js` now contains a small redirect validator. `GET /learn` is the only route changed to use it. A target is accepted only when all of these conditions hold:

- It is a string, preventing arrays, objects, missing values, and other unexpected types from reaching the redirect sink.
- It begins with `/`, restricting accepted targets to local root-relative paths.
- It does not begin with `//`, rejecting protocol-relative external destinations.
- It contains no backslash, preventing browser or platform path-normalization differences from turning a value into an external destination.

Any invalid target becomes `/`, a safe local fallback.

```javascript
const redirectUrl = getSafeRedirect(req.query.url);
return res.redirect(redirectUrl);
```

No other `res.redirect()` call was changed.

## After-fix verification procedure

After rebuilding and starting the application, log in and verify:

| Request target | Expected `Location`/destination |
| --- | --- |
| `/learn?url=/profile` | `/profile` |
| `/learn?url=https://example.com` | `/` |
| `/learn?url=//example.com` | `/` |
| `/learn?url=https://www.google.com` | `/` |

Authenticated curl can reuse the login sequence above. The second command must return a local `Location: /`, never the supplied external URL.

Live verification of fixed commit `00c909b` completed on port 4102. Use a separate login and cookie jar on port 4102 before testing. The same authenticated external payload returned HTTP 302 with `Location: /`, and the browser remained in NodeGoat. The table above also lists additional verification cases; the screenshots specifically demonstrate the HTTPS example.com payload.

## Before vs. after

| Behaviour | Before | After |
| --- | --- | --- |
| `/profile` | Accepted | Accepted |
| `https://example.com` | External redirect | Falls back to `/` |
| `//example.com` | External redirect | Falls back to `/` |
| Backslash-containing value | Not rejected | Falls back to `/` |
| Missing/non-string value | Not validated | Falls back to `/` |

## Docker issue

Initial Docker checks failed because Docker was unavailable. The lab was subsequently executed natively on Windows using Node.js, a portable MongoDB 4.4.31 server bound to 127.0.0.1, and runtime dependencies installed in a separate folder. MongoDB was seeded with the repository's lab users. The vulnerable and fixed applications used ports 4101 and 4102 respectively.

Neither Docker file was changed. Docker builds and Compose execution were not verified; the recorded runtime evidence is from native Windows processes, not containers.

## Screenshot checklist and captions

Seven screenshots are saved under `evidence/A10-Unvalidated-Redirects/`. The before-code image is an actual VS Code capture. Before-payload and external-destination images were captured by the user in Chrome. Both curl images were captured by the user from Windows Command Prompt inside Windows Terminal, running Windows curl.exe. The after-code image is GitHub's code viewer; the after-browser image is an automated Edge page capture. Earlier HTML report images have been replaced.

- `before/A10-before-vulnerable-code.png` — the pre-fix `GET /learn` code showing `req.query.url` passed directly to `res.redirect()`.
- `before/A10-before-payload.png` — the authenticated browser address bar showing the complete localhost malicious URL before navigation.
- `before/A10-before-external-redirect.png` — the resulting browser page and address bar at `example.com`.
- `before/A10-before-curl.png` — authenticated curl output showing the external `Location` header.
- `after/A10-after-secure-code.png` — the `/learn` route calling `getSafeRedirect()` at fixed commit `00c909b`; read `redirect.js` for the validator implementation.
- `after/A10-after-blocked-redirect.png` — the authenticated dashboard reached after the external payload; this page-only capture has no address bar, so use the after-curl Location header as destination evidence.
- `after/A10-after-curl.png` — authenticated curl output showing `Location: /`.

## Files modified

- `NodeGoat/app/routes/index.js`
- `NodeGoat/app/routes/redirect.js`
- `NodeGoat/test/unit/redirect-test.js`
- `docs/A10-Unvalidated-Redirects.md`

## Testing results

- `node --check` passed for the changed route, helper, and unit-test files.
- The focused validator test passed all nine cases: `/profile`, `/dashboard`, `/`, HTTPS URL, HTTP URL, protocol-relative URL, backslash-containing value, `undefined`, and numeric input.
- `npm test` could not start because `node_modules/grunt-cli/bin/grunt` is absent. Dependencies were not broadly installed or upgraded on the host.
- Authenticated live HTTP and browser verification passed for the external HTTPS payload: external redirect before, local fallback after.
- Docker build and container checks remain unverified. No claim is made that other intentional NodeGoat vulnerabilities were fixed or that these focused checks constitute a comprehensive security audit.
