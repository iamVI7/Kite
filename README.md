# Kite

**Instant peer-to-peer file & text transfer. No uploads. No cloud. No signup.**

---

## What is Kite?

Kite lets you transfer files and text between any two devices instantly — create a session, scan the QR code on your second device, and drop files. Everything travels directly between devices via WebRTC. The server only handles the initial handshake and never sees your files.

---

## Features

- **P2P File Transfer** — Files transfer directly browser-to-browser via WebRTC RTCDataChannel
- **Text & Link Sharing** — Send messages, URLs, and clipboard content between devices
- **Bidirectional** — Both devices can send and receive simultaneously
- **QR Code Pairing** — Scan to connect instantly, no manual code entry
- **Transfer Cancellation** — Cancel any in-progress transfer on either side
- **Auto Reconnection** — Network drops reconnect automatically (up to 5 attempts)
- **Session Timer** — 30-minute shared countdown, synced from the server for both peers
- **Transfer Duration** — Completed transfers show exactly how long they took
- **No Account Required** — Zero signup, zero login, zero tracking

---

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite 5, TailwindCSS, Framer Motion, Zustand |
| Backend | Node.js, Express, Socket.IO |
| Networking | WebRTC (RTCPeerConnection + RTCDataChannel), STUN |

---

## Architecture

```
Browser A (Host)                   Browser B (Guest)
     │                                   │
     ├── POST /api/rooms ──▶ Server       │
     │◀── { roomId, expiresAt } ──        │
     │                                   │
     │◀─── socket: room-joined ─────────▶│
     │◀─── peer-joined ───────────────────│
     │                                   │
     │── offer / answer / ICE ──▶ Server ▶│
     │                                   │
     │◀══════════ RTCDataChannel ════════▶│
     │     (files & text go here)        │
```

The server is a pure signaling relay — after the WebRTC handshake, all data flows directly between browsers.

---

## Getting Started

Prerequisites: Node.js 18+

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Start the server (Terminal 1)
cd server && npm run dev
# running on :3001

# 3. Start the client (Terminal 2)
cd client && npm run dev
# open http://localhost:5173
```

Always start the server before the client.

---

## Project Structure

```
Kite/
├── client/
│   └── src/
│       ├── components/       # BackButton, DropZone, TransferList, TextShare, ...
│       ├── hooks/            # useWebRTC, useSessionTimer, useQRCode, useDrop
│       ├── pages/            # HomePage, SessionPage, JoinPage
│       ├── store/            # Zustand global state
│       └── utils/            # format.js, socket.js
└── server/
    └── index.js              # Express + Socket.IO signaling server
```

---

## Environment Variables

Create `client/.env` (see `client/.env.example`):

```env
VITE_SERVER_URL=http://localhost:3001
```

Only needed for production — Vite's dev proxy handles it automatically in development.

---

## Security & Privacy

- Files never touch the server
- All WebRTC transfers are DTLS encrypted
- Sessions auto-expire after 30 minutes
- No accounts, no logs, no persistent storage

---

## License

MIT

---

> *"I wanted AirDrop but without buying a MacBook."*
>
> — Built with questionable sleep schedules by **Vishal Yadav**