import { useRef, useCallback, useEffect } from "react";
import { useStore } from "../store/useStore";
import { getSocket } from "../utils/socket";
import { generateTransferId } from "../utils/format";
import { saveSession, clearSession } from "../utils/session";

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const CHUNK_SIZE = 64 * 1024;
const MAX_RECONNECT_ATTEMPTS = 10;  // more attempts for mobile
const RECONNECT_DELAY_MS = 1500;

export function useWebRTC() {
  const {
    setConnectionStatus, setRoom,
    addTransfer, updateTransfer, cancelTransfer,
    addMessage,
  } = useStore();

  const pcRef = useRef(null);
  const sendChannelRef = useRef(null);
  const receiveBuffers = useRef({});
  const cancelledTransfers = useRef(new Set());
  const roomIdRef = useRef(null);
  const roleRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const isIntentionalDisconnect = useRef(false);
  const visibilityHandlerRef = useRef(null);

  // ── Incoming message handler ─────────────────────────────────────────────
  const handleChannelMessage = useCallback(
    ({ data }) => {
      if (typeof data === "string") {
        const msg = JSON.parse(data);

        if (msg.type === "text-message") {
          addMessage({ id: msg.id, text: msg.text, direction: "incoming", timestamp: msg.timestamp });
          return;
        }
        if (msg.type === "file-meta") {
          receiveBuffers.current[msg.fileId] = {
            meta: msg, chunks: [], receivedBytes: 0, startTime: Date.now(),
          };
          addTransfer({
            id: msg.fileId, name: msg.name, size: msg.size,
            fileType: msg.fileType, status: "receiving",
            progress: 0, speed: 0, eta: null, direction: "incoming",
          });
        }
        if (msg.type === "file-cancel") {
          cancelTransfer(msg.fileId);
          delete receiveBuffers.current[msg.fileId];
        }
        if (msg.type === "file-done") {
          const buf = receiveBuffers.current[msg.fileId];
          if (!buf) return;
          if (cancelledTransfers.current.has(msg.fileId)) return;
          const blob = new Blob(buf.chunks, { type: buf.meta.fileType });
          const duration = (Date.now() - buf.startTime) / 1000;
          updateTransfer(msg.fileId, { status: "done", progress: 100, blob, duration });
          delete receiveBuffers.current[msg.fileId];
        }
      } else {
        const idBytes = new Uint8Array(data, 0, 36);
        const fileId = new TextDecoder().decode(idBytes).replace(/\0/g, "");
        if (cancelledTransfers.current.has(fileId)) return;
        const payload = data.slice(36);
        const buf = receiveBuffers.current[fileId];
        if (!buf) return;
        buf.chunks.push(payload);
        buf.receivedBytes += payload.byteLength;
        const elapsed = (Date.now() - buf.startTime) / 1000 || 0.001;
        const speed = buf.receivedBytes / elapsed;
        const progress = Math.round((buf.receivedBytes / buf.meta.size) * 100);
        const eta = (buf.meta.size - buf.receivedBytes) / speed;
        updateTransfer(fileId, { progress, speed, eta });
      }
    },
    [addTransfer, updateTransfer, cancelTransfer, addMessage]
  );

  // ── Peer connection factory ──────────────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    if (pcRef.current) pcRef.current.close();
    const pc = new RTCPeerConnection(STUN_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate)
        getSocket().emit("ice-candidate", { roomId: roomIdRef.current, candidate });
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      console.log("[webrtc] state:", s);
      if (s === "connected") {
        reconnectAttemptsRef.current = 0;
        setConnectionStatus("connected");
      }
      if (s === "disconnected" || s === "failed") {
        // 800ms grace — lets peer-left-intentional arrive first
        setTimeout(() => {
          if (!isIntentionalDisconnect.current) handleUnexpectedDisconnect();
        }, 800);
      }
    };

    pc.ondatachannel = ({ channel }) => {
      channel.binaryType = "arraybuffer";
      channel.onmessage = handleChannelMessage;
    };

    return pc;
  }, [setConnectionStatus, handleChannelMessage]);

  // ── Reconnection ─────────────────────────────────────────────────────────
  const handleUnexpectedDisconnect = useCallback(() => {
    if (isIntentionalDisconnect.current) return;
    const attempts = reconnectAttemptsRef.current;
    if (attempts >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionStatus("disconnected");
      clearSession();
      return;
    }
    reconnectAttemptsRef.current += 1;
    setConnectionStatus("reconnecting");
    console.log(`[webrtc] reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);

    // Exponential backoff capped at 8s
    const delay = Math.min(RECONNECT_DELAY_MS * reconnectAttemptsRef.current, 8000);
    reconnectTimerRef.current = setTimeout(() => {
      const socket = getSocket();
      if (!socket.connected) socket.connect();
      socket.emit("join-room", { roomId: roomIdRef.current });
    }, delay);
  }, [setConnectionStatus]);

  // ── Page Visibility API — react when user returns to tab ─────────────────
  const setupVisibilityHandler = useCallback(() => {
    // Remove any existing handler first
    if (visibilityHandlerRef.current) {
      document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
    }

    const handler = () => {
      if (document.visibilityState === "visible") {
        console.log("[visibility] tab became visible — checking connection");
        const pc = pcRef.current;
        const socket = getSocket();

        // Reconnect socket if dropped
        if (!socket.connected) {
          console.log("[visibility] socket disconnected, reconnecting");
          socket.connect();
        }

        // Check WebRTC state — if dead, trigger reconnect immediately
        if (pc) {
          const state = pc.connectionState;
          console.log("[visibility] WebRTC state:", state);
          if (state === "disconnected" || state === "failed" || state === "closed") {
            if (!isIntentionalDisconnect.current) {
              // Reset attempts so we get fresh retries after returning
              reconnectAttemptsRef.current = 0;
              handleUnexpectedDisconnect();
            }
          }
        } else {
          // No peer connection at all — rejoin the room
          if (!isIntentionalDisconnect.current && roomIdRef.current) {
            reconnectAttemptsRef.current = 0;
            handleUnexpectedDisconnect();
          }
        }
      }
    };

    visibilityHandlerRef.current = handler;
    document.addEventListener("visibilitychange", handler);
  }, [handleUnexpectedDisconnect]);

  // ── Send text ────────────────────────────────────────────────────────────
  const sendText = useCallback((text) => {
    const dc = sendChannelRef.current;
    if (!dc || dc.readyState !== "open") return false;
    const id = generateTransferId();
    const payload = { type: "text-message", id, text, timestamp: Date.now() };
    dc.send(JSON.stringify(payload));
    addMessage({ id, text, direction: "outgoing", timestamp: payload.timestamp });
    return true;
  }, [addMessage]);

  // ── Send files ───────────────────────────────────────────────────────────
  const sendFiles = useCallback(async (files) => {
    const dc = sendChannelRef.current;
    if (!dc || dc.readyState !== "open") return;

    for (const file of files) {
      const fileId = generateTransferId().padEnd(36, "0").slice(0, 36);
      addTransfer({
        id: fileId, name: file.name, size: file.size, fileType: file.type,
        status: "sending", progress: 0, speed: 0, eta: null, direction: "outgoing",
      });
      dc.send(JSON.stringify({ type: "file-meta", fileId, name: file.name, size: file.size, fileType: file.type }));

      const buffer = await file.arrayBuffer();
      let offset = 0;
      const startTime = Date.now();
      let wasCancelled = false;

      while (offset < buffer.byteLength) {
        if (cancelledTransfers.current.has(fileId)) {
          wasCancelled = true;
          try { dc.send(JSON.stringify({ type: "file-cancel", fileId })); } catch {}
          break;
        }
        if (dc.bufferedAmount > 4 * 1024 * 1024) await new Promise((r) => setTimeout(r, 50));
        const end = Math.min(offset + CHUNK_SIZE, buffer.byteLength);
        const chunk = buffer.slice(offset, end);
        const idBytes = new TextEncoder().encode(fileId.padEnd(36, "\0"));
        const tagged = new Uint8Array(36 + chunk.byteLength);
        tagged.set(idBytes, 0);
        tagged.set(new Uint8Array(chunk), 36);
        dc.send(tagged.buffer);
        offset = end;
        const elapsed = (Date.now() - startTime) / 1000 || 0.001;
        updateTransfer(fileId, {
          progress: Math.round((offset / buffer.byteLength) * 100),
          speed: offset / elapsed,
          eta: (buffer.byteLength - offset) / (offset / elapsed),
        });
      }

      if (!wasCancelled) {
        dc.send(JSON.stringify({ type: "file-done", fileId }));
        const elapsed = (Date.now() - startTime) / 1000;
        updateTransfer(fileId, { status: "done", progress: 100, duration: elapsed });
      }
    }
  }, [addTransfer, updateTransfer]);

  // ── Cancel transfer ──────────────────────────────────────────────────────
  const cancelFile = useCallback((fileId) => {
    cancelledTransfers.current.add(fileId);
    cancelTransfer(fileId);
    delete receiveBuffers.current[fileId];
    const dc = sendChannelRef.current;
    if (dc?.readyState === "open") {
      try { dc.send(JSON.stringify({ type: "file-cancel", fileId })); } catch {}
    }
  }, [cancelTransfer]);

  // ── Signaling ────────────────────────────────────────────────────────────
  const initSignaling = useCallback((rId) => {
    roomIdRef.current = rId;
    isIntentionalDisconnect.current = false;
    const socket = getSocket();
    const events = ["room-joined","peer-joined","offer","answer","ice-candidate","peer-left","peer-left-intentional","room-full"];
    events.forEach((e) => socket.off(e));
    if (!socket.connected) socket.connect();

    // Set up visibility handler for tab switch / minimize recovery
    setupVisibilityHandler();

    socket.on("room-joined", ({ roomId: rid, role, expiresAt }) => {
      roleRef.current = role;
      setRoom(rid, role, expiresAt);
      // Persist session so tab switches don't lose context
      saveSession({ roomId: rid, role, expiresAt });
      if (reconnectAttemptsRef.current === 0)
        setConnectionStatus(role === "host" ? "waiting" : "connecting");
    });

    socket.on("peer-joined", async () => {
      setConnectionStatus("connecting");
      const pc = createPeerConnection();
      const dc = pc.createDataChannel("host-to-guest", { ordered: true });
      dc.binaryType = "arraybuffer";
      sendChannelRef.current = dc;
      dc.onopen = () => { reconnectAttemptsRef.current = 0; setConnectionStatus("connected"); };
      dc.onclose = () => { if (!isIntentionalDisconnect.current) handleUnexpectedDisconnect(); };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId: roomIdRef.current, offer });
    });

    socket.on("offer", async ({ offer }) => {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(offer);
      const dc = pc.createDataChannel("guest-to-host", { ordered: true });
      dc.binaryType = "arraybuffer";
      sendChannelRef.current = dc;
      dc.onopen = () => { reconnectAttemptsRef.current = 0; setConnectionStatus("connected"); };
      dc.onclose = () => { if (!isIntentionalDisconnect.current) handleUnexpectedDisconnect(); };
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId: roomIdRef.current, answer });
    });

    socket.on("answer", async ({ answer }) => {
      if (pcRef.current) await pcRef.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try { if (pcRef.current) await pcRef.current.addIceCandidate(candidate); }
      catch (e) { console.warn("[ice]", e); }
    });

    socket.on("peer-left", () => {
      if (!isIntentionalDisconnect.current) handleUnexpectedDisconnect();
    });

    socket.on("peer-left-intentional", () => {
      isIntentionalDisconnect.current = true;
      clearSession();
      setConnectionStatus("peer-left");
    });

    socket.on("room-full", () => alert("This session is full."));
    socket.emit("join-room", { roomId: rId });
  }, [createPeerConnection, setConnectionStatus, setRoom, handleUnexpectedDisconnect, setupVisibilityHandler]);

  // ── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback((intentional = true) => {
    isIntentionalDisconnect.current = true;
    clearTimeout(reconnectTimerRef.current);

    // Remove visibility handler
    if (visibilityHandlerRef.current) {
      document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
      visibilityHandlerRef.current = null;
    }

    if (intentional && roomIdRef.current) {
      const socket = getSocket();
      if (socket.connected) socket.emit("peer-leave-intentional", { roomId: roomIdRef.current });
    }

    if (intentional) clearSession();

    sendChannelRef.current?.close();
    pcRef.current?.close();
    pcRef.current = null;
    sendChannelRef.current = null;

    const socket = getSocket();
    ["room-joined","peer-joined","offer","answer","ice-candidate","peer-left","peer-left-intentional","room-full"]
      .forEach((e) => socket.off(e));
    socket.disconnect();
  }, []);

  return { initSignaling, sendFiles, sendText, cancelFile, disconnect };
}