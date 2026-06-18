# Wallet App

A React + TypeScript digital wallet for an online betting platform, built against the [mock-api](https://github.com/MantasBuga/mock-api) backend. Users register/log in, place bets against a Euro wallet balance, track bet and transaction history, and see their balance update in real time over a WebSocket connection.

## Tech stack

- **React 19** + **TypeScript**, bundled with **Vite**
- **React Router 7** for routing and route protection
- **React Hook Form** + **Zod 4** for form schemas/validation
- **Axios** for API calls, with a shared instance handling auth headers and 401 redirects
- **Tailwind CSS 4** via CSS Modules (no inline utility classes — each component/page owns a `*.module.css`)
- **i18next** / **react-i18next** for English/Lithuanian translations
- **Framer Motion** for UI transitions (balance pop, page fades, toasts)
- Native **WebSocket** for live balance push updates, with automatic reconnect

## Prerequisites

- Node.js 18+
- A running instance of the [mock-api](https://github.com/MantasBuga/mock-api) backend, **with the modifications described below** (clone it, apply the changes, `npm install`, `npm start`; it serves on `http://localhost:3000` by default)

## Required mock-api changes

The published mock-api doesn't support CORS or WebSockets out of the box, and has a balance bug on bet cancellation. The wallet app needs the following changes applied to `api.js` (and `package.json`) before it will work correctly:

1. **Enable CORS.** The frontend runs on a different origin/port (Vite dev server), so the API needs to allow cross-origin requests:
   ```js
   const cors = require("cors");
   // ...
   app.use(cors());
   ```
   (add `cors` to `package.json` dependencies)

2. **Add a WebSocket server for live balance pushes**, mounted on the same HTTP server, authenticated by the player's access token as a query param:
   ```js
   const http = require("http");
   const { WebSocketServer } = require("ws");

   const server = http.createServer(app);
   const wss = new WebSocketServer({ server, path: "/ws" });
   const balanceSockets = new Map();

   wss.on("connection", (socket, req) => {
     const token = new URL(req.url, "http://localhost").searchParams.get("token");
     const player = players.find((p) => p.accessToken === token);
     if (!player) return socket.close(4001, "Invalid token");

     if (!balanceSockets.has(token)) balanceSockets.set(token, new Set());
     balanceSockets.get(token).add(socket);
     socket.on("close", () => balanceSockets.get(token)?.delete(socket));
   });

   function broadcastBalance(player) {
     const sockets = balanceSockets.get(player.accessToken);
     if (!sockets) return;
     const payload = JSON.stringify({ type: "balance", balance: player.balance });
     for (const socket of sockets) {
       if (socket.readyState === socket.OPEN) socket.send(payload);
     }
   }
   ```
   - Call `broadcastBalance(player)` at the end of the `POST /bet` handler and the `DELETE /my-bet/:id` handler, right after `player.balance` changes.
   - Replace `app.listen(port, ...)` with `server.listen(port, ...)` at the bottom of the file, so Express and the WebSocket server share the same HTTP server/port.
   - Add `ws` to `package.json` dependencies.

3. **Fix the cancel-bet balance bug.** In the `DELETE /my-bet/:id` handler, canceling a bet that already resolved as a win only refunded the original stake (`player.balance += bet.amount`) without clawing back the prize that had already been paid out, leaving the player's balance too high. Subtract the win amount too:
   ```js
   player.balance += bet.amount;
   if (bet.status === "win") player.balance -= bet.winAmount;
   bet.status = "canceled";
   ```

These changes are committed on the [`UM_extras`](https://github.com/ugnemeskuotyte/mock-api/tree/UM_extras) branch of [this fork](https://github.com/ugnemeskuotyte/mock-api) of mock-api — checking that branch out is equivalent to applying the steps above manually.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL if the mock API isn't on localhost:3000
npm run dev
```

The app starts on `http://localhost:5173` (Vite picks the next free port if it's taken).

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the mock-api backend (HTTP and WS share this host) | `http://localhost:3000` |

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Implemented features

### User management
- Registration (`POST /register`) with name, email, password, and confirm-password fields, validated client-side with Zod before submission.
- Login (`POST /login`); the returned JWT is stored and attached as `Authorization: Bearer <token>` on every request via an Axios request interceptor. A response interceptor catches `401`s, clears stored auth, and redirects to `/login`.

### Betting
- Place a bet (`POST /bet`) with live validation: minimum €1.00, capped at the current wallet balance (the cap updates immediately as the balance changes).
- List bets (`GET /my-bets`) showing ID, date/time, amount, status, and prize, with status/ID filters and pagination.
- Cancel a bet (`DELETE /my-bet/:id`); already-canceled or settled bets can't be canceled again (the action is only offered while a bet is pending).

### Wallet
- The Euro balance is shown prominently in the header (visible on every authenticated page) and on the dashboard.
- Balance updates in real time over a WebSocket connection (with automatic reconnect on drop), and also optimistically while a bet is pending.
- Transaction history (`GET /my-transactions`) showing ID, date/time, type (bet/win/cancel), and amount, with type/ID filters and pagination.

### Technical requirements
- Responsive layout (mobile and desktop).
- Public vs. private route guards (`PrivateRoute`/`PublicRoute`) so unauthenticated users can't reach the app shell and authenticated users are redirected away from login/register.
- All currency values formatted as Euros (e.g. `€10.50`) through a single `formatEuro` utility.
- Form validation covers required fields, type checks, and range checks (Zod schemas), plus user-facing error messages translated from API error responses.

### Bonus features
- ✅ Real-time balance updates via WebSockets, with reconnect-on-disconnect.
- ✅ Light/dark theme toggle, persisted to `localStorage` and defaulting to the OS preference.
- ✅ Multi-language support (English, Lithuanian) via i18next, with a language toggle in the header.
- ✅ UI animations (Framer Motion) for balance changes, page transitions, and toasts.

## Technical decisions

- **Two contexts, not one.** Auth (`AuthContext`: `user`, `login`, `logout`, `isAuthenticated`) and wallet state (`WalletContext`: live `balance`, pending-bet tracking, the WebSocket connection) are deliberately split. `WalletProvider` nests inside `AuthProvider` and reads the access token from it — balance/pending-bet logic depends on auth, not the other way around, so splitting them avoids two contexts both trying to own pieces of the same `user` object.
- **Optimistic pending bets.** Placing a bet immediately deducts the amount from the displayed balance and marks the bet "pending" in the UI; the real settlement (win/loss) arrives shortly after via the WebSocket push, at which point the pending state clears.
- **Barrel exports.** Each top-level folder (`api`, `components`, `context`, `pages`, `routes`, `utils`) has an `index.ts`/`index.tsx` re-exporting its public surface, so consumers import from `../api`, `../context`, etc. instead of reaching into individual files.
- **Shared `DataTable`.** The bets and transactions tables had near-identical loading/error/empty/pagination shells (and literally identical CSS). That shell was extracted into a single `DataTable` component; each page only supplies its columns and row content.
- **CSS Modules over inline Tailwind.** Tailwind's utility classes are composed inside `*.module.css` files via `@apply`, rather than written inline in JSX, to keep markup readable and styles colocated per component.
