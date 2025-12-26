import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  socket ??= io(process.env.NEXT_PUBLIC_WS_URL, {
    transports: ["websocket"],
    withCredentials: true,
    path: "/ws/socket.io/",
  });
  return socket;
};
