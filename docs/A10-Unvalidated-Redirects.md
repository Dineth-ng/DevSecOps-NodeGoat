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

1. Sign in at `http://localhost:4000/login`.
2. Browse to `http://localhost:4000/learn?url=https://example.com`.
3. Confirm that the browser leaves NodeGoat and reaches `https://example.com`.
4. Browse to `http://localhost:4000/learn?url=/profile` and confirm the internal redirect reaches `/profile`.
5. Browse to `http://localhost:4000/learn?url=//example.com` and record the resulting external navigation.

For authenticated curl evidence, the actual login fields are `userName` and `password`. CSRF middleware is disabled in this intentionally vulnerable version, so the hidden `_csrf` value is empty. One reproducible sequence is:

```powershell
curl.exe -i -c nodegoat-cookies.txt -d "userName=user1&password=User1_123&_csrf=" http://localhost:4000/login
curl.exe -I -b nodegoat-cookies.txt "http://localhost:4000/learn?url=https://example.com"
```

### Before-fix expected result

The malicious authenticated request returns an external `Location: https://example.com` and the browser follows it. The internal `/profile` target remains within NodeGoat. A plain unauthenticated request is not valid evidence because middleware redirects it to `/login` first.

Live before-fix reproduction was not completed in this workspace because the host has no Docker CLI/engine, WSL, or local MongoDB. No before screenshots are claimed.

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

Live after-fix HTTP verification is pending because Docker is unavailable on the host. No after screenshots are claimed.

## Before vs. after

| Behaviour | Before | After |
| --- | --- | --- |
| `/profile` | Accepted | Accepted |
| `https://example.com` | External redirect | Falls back to `/` |
| `//example.com` | External redirect | Falls back to `/` |
| Backslash-containing value | Not rejected | Falls back to `/` |
| Missing/non-string value | Not validated | Falls back to `/` |

## Docker issue

Running `docker --version`, `docker compose version`, and `docker compose config` failed because PowerShell could not find the `docker` command. Checks of the standard Docker Desktop executable locations and the `com.docker.service` service found no installation. WSL and local MongoDB are also absent.

This is a missing host prerequisite rather than an error demonstrated in `Dockerfile` or `docker-compose.yml`. Consequently, neither Docker file was changed. Install/start Docker Desktop (including its Compose plugin), then run the requested build and runtime verification commands before collecting browser or curl evidence.

## Screenshot checklist and captions

No screenshots have been created or claimed. Save manual captures under `evidence/A10-Unvalidated-Redirects/` using these names:

- `before/A10-before-vulnerable-code.png` — the pre-fix `GET /learn` code showing `req.query.url` passed directly to `res.redirect()`.
- `before/A10-before-payload.png` — the authenticated browser address bar showing the complete localhost malicious URL before navigation.
- `before/A10-before-external-redirect.png` — the resulting browser page and address bar at `example.com`.
- `before/A10-before-curl.png` — authenticated curl output showing the external `Location` header.
- `after/A10-after-secure-code.png` — `getSafeRedirect()` and the `/learn` route using its validated result.
- `after/A10-after-blocked-redirect.png` — the malicious localhost request and evidence that the browser remains in NodeGoat at `/`.
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
- Docker build, container status/log checks, and authenticated live HTTP tests remain pending because Docker is not installed.
