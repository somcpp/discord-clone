"use client";

import React from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { Badge } from "@/components/ui/badge";

export function SocketIndicator() {
  const { isConnected } = useSocket();

  if (!isConnected) {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-600 text-white border-none text-[11px]"
      >
        Fallback: Polling
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-emerald-600 text-white border-none text-[11px]"
    >
      Live: Real-time
    </Badge>
  );
}
