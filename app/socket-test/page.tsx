"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";

export default function SocketTest() {
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <div>Socket Test</div>;
}