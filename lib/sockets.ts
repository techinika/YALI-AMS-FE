import { io, Socket } from "socket.io-client";
import { getCookie } from "cookies-next";
import { AUTH_STORED_DATA } from "@/helpers/auth";

let socket: Socket | null = null;

export const getSocket = () => {
  if (socket?.connected) return socket;

  const token = getCookie(AUTH_STORED_DATA?.TOKEN);

  socket ??= io(process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL!, {
    auth: {
      token: token || "",
    },
    transports: ["polling", "websocket"],
    withCredentials: true,
    path: "/ws/socket.io/",
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  if (!socket.hasListeners("connect_error")) {
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
