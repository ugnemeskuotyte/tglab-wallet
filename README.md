# Wallet App

A React + TypeScript digital wallet for an online betting platform, built against the [mock-api](https://github.com/MantasBuga/mock-api) backend.

## Prerequisites

- Node.js 18+
- A running instance of mock-api, **with the changes below applied**

## Required mock-api changes

Apply these to `api.js`:

1. **CORS**:
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

- Registration & login 
- Place bets
- List bets (filters + pagination)
- Cancel bets
- Wallet balance display
- Transaction history (filters + pagination)
- Responsive layout
- Public/private route protection
- Euro currency formatting
- Form validation
- Real-time balance updates (WebSocket)
- Light/dark theme toggle
- Multi-language support (English, Lithuanian)
