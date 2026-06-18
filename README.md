# Wallet App

A React + TypeScript digital wallet for an online betting platform, built against the [mock-api](https://github.com/MantasBuga/mock-api) backend.

## Prerequisites

- Node.js 18+
- A running instance of mock-api, **with the changes below applied**

## Required mock-api changes

The published mock-api doesn't support CORS or WebSockets, and has a balance bug on bet cancellation. Apply these to `api.js`:

1. **CORS** (needed since the frontend runs on a different origin):
   ```js
   const cors = require("cors");
   app.use(cors());
   ```

2. **WebSocket server for live balance pushes**, mounted on the same HTTP server, authenticated by access token:
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
   Call `broadcastBalance(player)` after `player.balance` changes in the `POST /bet` and `DELETE /my-bet/:id` handlers, and replace `app.listen(port, ...)` with `server.listen(port, ...)`.

3. **Cancel-bet balance fix** — canceling an already-won bet must also claw back the prize, not just refund the stake:
   ```js
   player.balance += bet.amount;
   if (bet.status === "win") player.balance -= bet.winAmount;
   bet.status = "canceled";
   ```

Also add `cors` and `ws` to `package.json` dependencies. These changes are already committed on the [`UM_extras`](https://github.com/ugnemeskuotyte/mock-api/tree/UM_extras) branch of [this fork](https://github.com/ugnemeskuotyte/mock-api).

## Setup

```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL — defaults to http://localhost:3000
npm run dev
```

## Implemented features

### User management
- Registration (`POST /register`) and login (`POST /login`); the JWT is stored and sent as `Authorization: Bearer <token>` on every request. A `401` response clears stored auth and redirects to `/login`.

### Betting
- Place a bet (`POST /bet`): minimum €1.00, capped at the current balance.
- List bets (`GET /my-bets`): ID, date/time, amount, status, prize — with status/ID filters and pagination.
- Cancel a bet (`DELETE /my-bet/:id`); only offered while a bet is pending.

### Wallet
- Euro balance shown in the header on every authenticated page, updated live via WebSocket and optimistically while a bet is pending.
- Transaction history (`GET /my-transactions`): ID, date/time, type, amount — with type/ID filters and pagination.

### Other requirements
- Responsive layout; public/private route guards; Euro formatting (`€10.50`) via a shared `formatEuro` utility; form validation (required fields, type/range checks, translated API error messages).

### Bonus features
- Real-time balance updates via WebSockets (with reconnect), light/dark theme toggle, English/Lithuanian i18n, Framer Motion UI animations.

## Technical decisions

- **`AuthContext` vs `WalletContext`.** Auth (`user`, `login`, `logout`) and wallet state (`balance`, pending bets, the WebSocket) are split: `WalletProvider` nests inside `AuthProvider` and reads the access token from it, since balance/pending-bet logic depends on auth, not vice versa.
- **Optimistic pending bets.** Placing a bet immediately deducts from the displayed balance and marks it "pending"; the real settlement arrives via the WebSocket push, clearing the pending state.
- **Barrel exports.** Each top-level folder (`api`, `components`, `context`, `pages`, `routes`, `utils`) has an `index.ts` re-exporting its public surface.
- **Shared `DataTable`.** The bets and transactions tables had identical loading/error/empty/pagination shells (and CSS); extracted into one `DataTable` component.
- **CSS Modules over inline Tailwind.** Utility classes are composed in `*.module.css` via `@apply`, not written inline in JSX.
