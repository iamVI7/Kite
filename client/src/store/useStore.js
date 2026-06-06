import { create } from "zustand";

export const useStore = create((set) => ({
  // Connection
  connectionStatus: "idle",
  roomId: null,
  role: null,
  sessionStartedAt: null,
  sessionExpiresAt: null,

  // File transfers
  transfers: [],

  // Text messages
  messages: [], // { id, text, direction: "incoming"|"outgoing", timestamp }

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setRoom: (roomId, role, expiresAt) => set({
    roomId,
    role,
    sessionStartedAt: Date.now(),
    sessionExpiresAt: expiresAt,
  }),

  addTransfer: (transfer) =>
    set((s) => ({ transfers: [...s.transfers, transfer] })),

  updateTransfer: (id, patch) =>
    set((s) => ({
      transfers: s.transfers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  cancelTransfer: (id) =>
    set((s) => ({
      transfers: s.transfers.map((t) =>
        t.id === id && (t.status === "sending" || t.status === "receiving")
          ? { ...t, status: "cancelled" }
          : t
      ),
    })),

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  clearTransfers: () => set({ transfers: [] }),

  reset: () =>
    set({
      connectionStatus: "idle",
      roomId: null,
      role: null,
      sessionStartedAt: null,
      sessionExpiresAt: null,
      transfers: [],
      messages: [],
    }),
}));