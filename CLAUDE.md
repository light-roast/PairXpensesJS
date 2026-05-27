# CLAUDE.md

Guidance for Claude Code (or any future LLM session) working in this repository.

## Project overview

**PairXpensesJS** is the vanilla-JavaScript frontend for the "PairXpenses" two-couple expense ledger. It's the SPA users actually open. There is no framework — no React, no Vue, no bundler. Plain ES6 modules loaded directly by the browser.

- App: `https://pairxpensesapp.azurewebsites.net`
- API (separate repo `PairExpensesAPI`): `https://pairxpenses.azurewebsites.net/api`
- GitHub: `light-roast/PairXpensesJS`
- Owner: Daniel Echeverri (`lightroast`)
- Primary users: Daniel + Maritza (one of the two pairs). The other pair lives in `pair2`. Real production traffic is two people, on phones, once a month.

## Tech stack

| Layer | Choice |
|---|---|
| Language | Vanilla JavaScript (ES6 modules) |
| Framework | None |
| Bundler | None — browser loads `js/app.js` as `type="module"` and the modules pull each other in via static imports |
| Routing | Hand-rolled hash router in `js/app.js` (`'hashchange'` listener) |
| HTTP | Native `fetch` wrapped by `ApiService` (`js/api.js`) |
| State | Plain `let state = {...}` object in `js/home.js` + `sessionStorage` for cross-route data |
| Auth | JWT bearer token in `localStorage`, decoded client-side to check expiry |
| Styling | Hand-written CSS in `styles/*.css`, no preprocessor |
| Icons | Bootstrap Icons via jsDelivr CDN |
| Fonts | Google Fonts CDN (Expletus Sans + Sono + Chivo Mono) |
| Hosting | Azure App Service Windows + IIS (static files via `web.config`) |
| Local server | `npx serve .` (`npm start`) — `package.json` has no real dependencies |

There is no build step. Edit a file → save → reload. CI does `npm install` (no-op) and uploads the repo verbatim.

## Repository layout

```
index.html                       — single entry point, loads js/app.js as module
js/
  app.js                         — Router class, hashchange listener, route table
  api.js                         — ApiService static class: fetch wrapper, JWT decode/expiry, all endpoint calls
  login.js                       — renderLogin + setupLoginHandlers
  home.js                        — biggest file. State, render, all handlers, buildMonthlyReport,
                                   generateReport, generateFullReport, all modal globals.
                                   Also exposes renderHomeFromCache() for instant back-nav paint.
  cache.js                       — owns sessionStorage.homeState key. Exports saveHomeCache(snapshot),
                                   loadHomeCache(), clearHomeCache(). No imports — breaks the
                                   home.js ↔ api.js cycle that clearing-on-401 would create.
  report.js                      — renderReport (text summary), renderNoReport, renderFullReport
                                   (combined view with per-user tables)
styles/
  main.css                       — CSS variables (--main-color, --primary-dark, --primary-accent,
                                   --accent-hover), reset, body/button/input base styles,
                                   one mobile breakpoint at 768px
  login.css                      — login page only
  home.css                       — home page (two-column layout, nav, charge control, item rows, modals)
  report.css                     — both #report and #full-report views + @media print rules for PDF export
web.config                       — IIS rewrite: any non-file/non-directory URL → /
                                   (needed because we use hash routing but Azure still serves the file)
package.json                     — only meaningful entry is "start": "npx serve ." and the description
.github/workflows/
  main_pairxpensesapp.yml        — Azure App Service deploy on push to main (windows-latest build,
                                   ubuntu-latest deploy via azure/login + webapps-deploy@v3, OIDC, no FTP)
README.md                        — partly stale (see Known issues)
```

## Routing

Hash-based, no library. In `js/app.js`:

| Hash | Handler | Renders |
|---|---|---|
| `` (empty) | `handleLogin` | `renderLogin()` — short-circuits to `#home` if token present |
| `#home` | `handleHome` | Stale-while-revalidate: if `sessionStorage.homeState` exists, hydrate state synchronously via `renderHomeFromCache()` and paint immediately, then re-run `initHome()` in the background and re-render. Cold path (no cache) shows "Loading..." then `initHome()` → `renderHome()`. Requires token, else `→ ''`. |
| `#report` | `handleReport` | `renderReport()` — reads `sessionStorage.report` |
| `#full-report` | `handleFullReport` | `renderFullReport()` — reads `sessionStorage.report` + `sessionStorage.fullReportData` |
| `#no-report` | `handleNoReport` | `renderNoReport()` — empty-state when totals are all 0 |

Auth gate is per-handler (`isAuthenticated()` → `localStorage.token` presence). No central guard.

## Authentication

- Login: `POST /api/Account/Login` returns the JWT body as plain text. Stored in `localStorage.token`.
- Every non-login request goes through `ApiService.request()`:
  1. Decode token (`atob` on the payload segment, then `JSON.parse`).
  2. If `exp` is in the past → call `showExpiredTokenModal()` which builds a DOM modal inline. The OK button removes the token, calls `clearHomeCache()`, and sends the user back to `/`.
  3. If response is `401` → same flow.
  4. Otherwise return the raw `Response` (caller does `.json()` / `.text()`).
- Token is **never** refreshed. 20-minute expiry → modal → relogin.
- JWT role claim is `pair1` or `pair2` — the API uses it for pair boundary; the frontend doesn't read the role at all, it just forwards the token.

## State management

There is one source of truth in `js/home.js`:

```js
let state = {
    users: [],
    userA: { id: 1, name: 'User A' },
    userB: { id: 2, name: 'User B' },
    percentageA: 50,
    isOrderReversed: false,
    paymentsA: [], paymentsB: [],
    debtsA: [], debtsB: []
};
```

- Populated by `initHome()` → `ApiService.getUsers()` then per-user `getPaymentsByUser` + `getDebtsByUser`. `initHome()` ends with a `saveHomeCache()` call so the very first paint of the session lands in cache.
- After any mutation (create/edit/delete payment or debt, edit user name), the code re-fetches the affected user's data and calls `window.renderApp()` to re-render the entire home view from scratch. `window.renderApp` calls `saveHomeCache()` first, so the cache always reflects the latest state. No DOM diffing.
- `state` is module-scoped to `home.js`. Other files reach it via the side effects of `window.renderApp` / `window.openItemModal` etc. that `home.js` attaches to `window`.

For cross-route data we lean on `sessionStorage`:

- `sessionStorage.report` — the 6 monthly summary strings (`report1..5`, `finalReport`) built by `buildMonthlyReport`. Read by both `renderReport` and `renderFullReport`.
- `sessionStorage.fullReportData` — `{userA, userB}` each with `{id, name, payments[], debts[]}`. Written only by `generateFullReport`. Read only by `renderFullReport`.
- `sessionStorage.homeState` — versioned snapshot `{v, savedAt, users, userA, userB, paymentsA, paymentsB, debtsA, debtsB}` used by `renderHomeFromCache()` for instant back-nav. Written by `saveHomeCache()` (called from `initHome` and `window.renderApp`). Cleared on a fresh login (`login.js`) and when the expired-token modal fires (`api.js`). `percentageA` and `isOrderReversed` are **deliberately not cached** — they are local UI knobs that should reset on tab close.

## The monthly report flow

The home page has two report buttons. Both run the same monthly calculation; they diverge in what they save and where they route:

1. `buildMonthlyReport()` (in `home.js`) is the shared helper. One call to `GET /api/Report?percentageA=...`, then it formats the 6 Spanish-COP strings client-side. Returns `{ data, report }` or `null`.
2. `generateReport()` writes only `sessionStorage.report` and routes to `#report`.
3. `generateFullReport()` writes both `sessionStorage.report` and `sessionStorage.fullReportData` (built from the in-memory state, no extra fetch) and routes to `#full-report`.
4. `renderFullReport()` shows summary + per-user Payments + Debts tables + a "Save as PDF" button that calls `window.print()`. Print CSS hides controls, switches to A4, and stacks users in a single column for mobile-friendly PDFs.

If you change the summary wording, change it in `buildMonthlyReport`. It's the single source — both views use it.

## API contract dependencies

The frontend assumes these API shapes. If you change either side, change both.

- `POST /Account/Login` → response body is the raw JWT string (`response.text()`).
- `GET /User` → array of `{id, name}`.
- `PATCH /user/{id}` → body `{id, name}`.
- `GET /Payment/user/{id}` and `GET /Debt/user/{id}` → arrays of `{id, name, value, createDate, updateDate, userId}`. `value` is a `long` (minor units) — the frontend uses `Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 })`, so a value of `908000` renders as `$ 908.000`.
- `POST /Payment` and `POST /Debt` → body `{name, value, userId}`. Server fills `createDate` if absent but the frontend has historically been able to send it too — don't tighten this without checking the API CLAUDE.md.
- `PATCH /Payment/{id}` body is `{name, value}` (no id). `PATCH /Debt/{id}` body is `{id, name, value}` (id is included — yes, this is inconsistent — see Known issues).
- `DELETE /Payment/deleteAll`, `DELETE /Debt/deleteAll` — wipe everything in the caller's pair. Used by the "Reset debts and payments" button.
- `GET /Report?percentageA={0..100}` → returns `{hasData, percentageA, totalExpense, userA, userB, settlement|null}`. `userA` is always the lower-id user in the caller's pair (stable). `settlement` is `{fromUserId, toUserId, amount}` or `null`.

## Local development

```bash
npm start        # → npx serve .
# then open http://localhost:3000 (or whichever port serve picks)
```

- Any static server works. The README mentions Python and `npx http-server`. They all work because there's nothing to build.
- The frontend talks to the **production API** at `https://pairxpenses.azurewebsites.net/api` by default. Change `API_BASE_URL` in `js/api.js` if you want to point at a local API run, and remember to revert before committing.
- The API CORS policy adds `localhost` in `Development` mode only — i.e. you need `dotnet run` (not the deployed prod API) if you want to hit a backend from `localhost`. The deployed API allows only `https://pairxpensesapp.azurewebsites.net`.

## Deployment

- Trigger: `git push origin main`.
- Workflow: `.github/workflows/main_pairxpensesapp.yml`.
- Build step is a no-op (`npm install` on a no-deps `package.json`).
- Deploy uses `azure/webapps-deploy@v3` with OIDC (`azure/login@v2` reads three GitHub secrets: `AZUREAPPSERVICE_CLIENTID_...`, `TENANTID_...`, `SUBSCRIPTIONID_...`). No publish profile, no FTP password.
- Target: App Service `pairxpensesapp`, slot `Production`, Windows host.
- `web.config` is what makes hash-routing-on-IIS work — the rewrite rule sends any non-file URL to `/`, so refreshing on `#full-report` doesn't 404 (the hash isn't sent to the server anyway, but the path before it might be).

## Styling conventions

- All colours go through CSS custom properties in `main.css` `:root`. Don't hard-code `#FF8762` etc.
- One mobile breakpoint: `@media screen and (max-width: 768px)`. `report.css` has its own block at the same breakpoint plus a separate `@media print` block.
- Bootstrap Icons via `<i class="bi bi-...">`.
- Font stacks: `"Expletus Sans"` for headings/buttons, `"Sono"` for body, `"Chivo Mono"` for tabular data in the report.
- Mobile is the primary form factor. Test there.

## Coding conventions

- 4-space indent in JS, no semicolons-optional debate (semicolons are used everywhere — keep doing that).
- `ApiService` is a static class — never instantiated, all methods are `static async`.
- Render functions return template-literal strings. They are inserted with `app.innerHTML = ...`. **Treat all user-supplied strings as untrusted in this codebase** (see Known issues) — but realistically the only attacker would be your partner, who would have to log in first.
- Event handlers are attached fresh after each render via `setupHomeHandlers()`. There is no event delegation — listeners get garbage-collected with the old DOM.
- Globals on `window` are how `home.js` exposes things to inline `onclick=` handlers in template strings. Don't remove them without rewriting the handlers.

## Known issues / smells (leave unless explicitly asked to fix)

1. **XSS in render functions** — `renderPaymentItem`, `renderDebtItem`, and the report templates interpolate `name` straight into HTML. A user could create a payment named `<img src=x onerror=alert(1)>` and have it execute in their partner's session. Threat model is two people who know each other, so this has been deliberately deferred.
2. **Inline `onclick=` with string interpolation** in `renderPaymentItem`/`renderDebtItem`. The `name.replace(/'/g, "\\'")` partial escape is the only defence against a name containing a single quote. Doesn't handle backslashes or double quotes. Same threat-model justification as above.
3. **`home.js` is too big** (~700 lines). State, render, handlers, modal globals, and the report orchestration all live here. Splitting it isn't free — the inline event-handler globals depend on `state` being module-local. Defer.
4. **PATCH body inconsistency** — `PATCH /Payment/{id}` body has no `id`; `PATCH /Debt/{id}` body includes `id`. Both work because the API reads the id from the route either way. Cosmetic.
5. **README.md is partly stale** — it describes a hypothetical migration "from Blazor", lists the wrong API URL (`pairxpensesapi.azurewebsites.net/api` instead of `pairxpenses.azurewebsites.net/api`), and suggests a `webapps-deploy@v2` workflow that doesn't match the v3 one actually in `.github/workflows/`. Don't trust the README; trust `js/api.js` and the workflow YAML.
6. **No build / no minification** — fine for two users on a personal app, but every refresh re-downloads ~40 KB of unminified JS. Don't waste time bundling.
7. **No tests** — `package.json`'s `test` script runs nothing. The CI's `npm run test --if-present` is a no-op by design.
8. **Token decode is naive** — `atob` on the payload, no signature verification, but that's correct for a client (the server is the one that has to verify). Just don't trust anything the decoded token says for security decisions — use it only for the expiry check.

## Things not to do

- Don't introduce a framework (React/Vue/Svelte) or a bundler (Vite/webpack). The whole point of this codebase is "edit, save, refresh."
- Don't add a build step to the deploy workflow. It currently uploads the repo as-is.
- Don't move the API URL out of `js/api.js` into an env var — there's no build step to substitute it.
- Don't switch to path-based routing (`/home` instead of `#home`) without also reworking `web.config`. Hash routing is what makes the IIS rewrite trivial.
- Don't sanitise the rendered output by adding a templating library — if you want to fix the XSS, do it with a small helper (`escapeHtml`) and use it consistently. Don't add `DOMPurify` for two users.
- Don't switch `localStorage` to `sessionStorage` for the auth token. The current behaviour (token survives browser restart, expires after 20 min server-side) is intentional.
- Don't add an offline / service-worker layer. The API is the source of truth and the network is fine.
- Don't store anything sensitive in `sessionStorage.report` / `sessionStorage.fullReportData` — they're cleared on tab close but they're plain text and visible in DevTools. Today they only hold derived totals + names + payment/debt lists that the user just saw, so this is fine.

## History (most recent first)

- **2026-05-27**:
  - Added `sessionStorage`-backed stale-while-revalidate cache for the home view. New module `js/cache.js` owns the `homeState` key. `handleHome` now paints from cache instantly on back-from-report and then revalidates in the background. Cold load is unchanged. Cache cleared on fresh login and on the expired-token modal. `percentageA` / `isOrderReversed` deliberately not cached.

- **2026-05-26**:
  - Moved the monthly report calculation to the API (`GET /api/Report?percentageA=`). Frontend now fetches a structured response and only does presentation. `home.js` shrank a lot.
  - Added `#full-report` route + "Save as PDF" button. Combined view shows the monthly summary plus per-user Payments + Debts tables, with `@media print` rules tuned for mobile PDFs (single-column on print because that's how Daniel and Maritza actually read them).
  - Made the new full-report view responsive at `max-width: 768px` (stacked users, smaller fonts, button row stacks).
  - Earlier: replaced the JS `confirm()` dialog on "Reset debts and payments" with an inline Yes/No prompt; added loading spinners to login + Generate report; added JWT expiry check before each request with a modal redirect to login.
