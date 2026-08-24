# 🚀 Modern Real-Time Chat Architecture: Next.js + Socket.io + TanStack Query

A production-grade, highly scalable blueprint for building real-time messaging, infinite scrolling feeds, and collaborative feeds using **Next.js (App Router)**, a **Standalone Socket.io Server**, and **TanStack React Query v5**.

---

## 📐 High-Level System Architecture

```
                                  ┌────────────────────────────────┐
                                  │      Client (Browser/App)      │
                                  │                                │
                                  │  • ChatMessages (UI)           │
                                  │  • useChatQuery (TanStack v5)  │
                                  │  • useChatSocket (Live cache)  │
                                  │  • useChatScroll (Smart scroll)│
                                  └───────▲────────────────┬───────┘
                                          │                │
                             WebSocket    │                │ HTTP POST / GET
                         (socket.io-client)                │ (axios/fetch)
                                          │                │
            ┌─────────────────────────────┴────┐     ┌─────▼────────────────────────┐
            │   Standalone Socket Server       │     │     Next.js Backend API      │
            │   (Port 3001 - Node/Express/TS)  │     │     (Port 3000 - App Router) │
            │                                  │     │                              │
            │  • Rooms (chat:channelId:messages│     │  • /api/messages (GET/POST)  │
            │  • POST /emit endpoint           │     │  • Auth / Session check      │
            │  • Health check                  │     │  • Prisma / DB operations    │
            └───────────────▲──────────────────┘     └──────────────┬───────────────┘
                            │                                       │
                            │        Internal HTTP POST /emit       │
                            └───────────────────────────────────────┘
                                                                    │
                                                             Prisma │
                                                                    ▼
                                                            ┌───────────────┐
                                                            │  PostgreSQL   │
                                                            └───────────────┘
```

---

## 💡 Why This Hybrid Architecture?

In modern serverless/edge environments (like Next.js App Router):
- **Next.js API routes** are stateless and do not hold persistent WebSocket connections.
- A **dedicated lightweight Socket.io server** handles persistent client connections, rooms, and live broadcasts.
- **Next.js** handles business logic, auth validation, and database operations. Once data is saved to the database, Next.js notifies the Socket server via internal HTTP `POST /emit`.
- **TanStack Query** acts as the single source of truth on the client, seamlessly merging initial database fetches and live socket updates into one in-memory cache.

---

## 🔄 End-to-End Lifecycle of a Message

```
[1] User types & submits message in ChatInput
      │
      ▼
[2] Client sends HTTP POST to /api/messages?channelId=xyz
      │
      ▼
[3] Next.js validates user session (Auth) & writes message to Database (Prisma)
      │
      ▼
[4] Next.js makes internal HTTP POST to Socket Server (/emit):
    {
      room: "chat:xyz:messages",
      event: "chat:xyz:messages",
      data: <SavedMessageWithMemberProfile>
    }
      │
      ▼
[5] Socket Server broadcasts the event to all clients currently inside room "chat:xyz:messages"
      │
      ▼
[6] Client's `useChatSocket` receives the event:
    • Injects the new message directly into TanStack Query's cache (`queryKey: ["chat:xyz"]`)
      │
      ▼
[7] React UI automatically re-renders with the new message (0ms reload, no refetch)
      │
      ▼
[8] `useChatScroll` smoothly auto-scrolls down if the user is at the bottom of the feed
```

---

## 🧩 The Core Building Blocks

---

### 1. Standalone Socket Server (`socket-server/index.ts`)

A dedicated Node.js HTTP server running Socket.io with room subscriptions and an internal `/emit` endpoint.

```typescript
import { createServer } from "http";
import { Server } from "socket.io";

const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const PORT = process.env.PORT || 3001;

const httpServer = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  // Health check
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok" }));
  }

  // Internal trigger: Next.js API calls this to broadcast
  if (req.url === "/emit" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const { room, event, data } = JSON.parse(body);
        if (room) {
          io.to(room).emit(event, data);
        } else {
          io.emit(event, data);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Broadcast failed" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGIN, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId: string) => {
    if (roomId) socket.join(roomId);
  });

  socket.on("leave-room", (roomId: string) => {
    if (roomId) socket.leave(roomId);
  });
});

httpServer.listen(PORT, () => console.log(`Socket running on :${PORT}`));
```

---

### 2. Internal Server-Side Emitter (`lib/socket-emit.ts`)

A lightweight helper called inside Next.js API route handlers or Server Actions.

```typescript
export async function emitSocketEvent({
  room,
  event,
  data,
}: {
  room?: string;
  event: string;
  data: any;
}) {
  try {
    const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
    await fetch(`${socketUrl}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, event, data }),
    });
  } catch (error) {
    console.error("[SOCKET_EMIT_ERROR]", error);
  }
}
```

---

### 3. Cursor-Paginated API Route (`app/api/messages/route.ts`)

Supports infinite scrolling via `cursor` (ID of the last message) and triggers real-time socket events on message creation.

```typescript
const MESSAGES_BATCH = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const channelId = searchParams.get("channelId");

  const messages = await db.message.findMany({
    take: MESSAGES_BATCH,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where: { channelId },
    include: { member: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
  });

  let nextCursor = null;
  if (messages.length === MESSAGES_BATCH) {
    nextCursor = messages[MESSAGES_BATCH - 1].id;
  }

  return NextResponse.json({ items: messages, nextCursor });
}

export async function POST(req: Request) {
  const { content, fileUrl } = await req.json();
  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");

  // 1. Create message in DB
  const message = await db.message.create({
    data: { content, fileUrl, channelId, memberId },
    include: { member: { include: { profile: true } } },
  });

  // 2. Broadcast to room
  const channelKey = `chat:${channelId}:messages`;
  await emitSocketEvent({
    room: channelKey,
    event: channelKey,
    data: message,
  });

  return NextResponse.json(message);
}
```

---

### 4. Client Socket Context (`components/providers/socket-provider.tsx`)

Manages client WebSocket connection lifecycle and connection status.

```typescript
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO, Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = ClientIO(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => setIsConnected(true));
    socketInstance.on("disconnect", () => setIsConnected(false));
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
```

---

## 🪝 The 3 Client Hooks Trio

---

### 🪝 Hook 1: `useChatQuery` (Data Fetching & Fallback Polling)

Uses TanStack React Query v5 `useInfiniteQuery` with a cursor:

```typescript
import qs from "query-string";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";

export const useChatQuery = ({ queryKey, apiUrl, paramKey, paramValue }: any) => {
  const { isConnected } = useSocket();

  const fetchMessages = async ({ pageParam = undefined }: { pageParam?: string }) => {
    const url = qs.stringifyUrl({
      url: apiUrl,
      query: { cursor: pageParam, [paramKey]: paramValue },
    }, { skipNull: true });

    const res = await fetch(url);
    return res.json();
  };

  return useInfiniteQuery({
    queryKey: [queryKey],
    queryFn: fetchMessages,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    refetchInterval: isConnected ? false : 1000, // Fallback polling if socket drops
  });
};
```

---

### 🪝 Hook 2: `useChatSocket` (Live Cache Injection)

Listens for new messages and edits, updating TanStack Query cache in-place without triggering full API refetches:

```typescript
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";

export const useChatSocket = ({ addKey, updateKey, queryKey }: any) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit("join-room", addKey);
    if (updateKey !== addKey) socket.emit("join-room", updateKey);

    // Handle updates (edit/delete)
    socket.on(updateKey, (message: any) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData?.pages) return oldData;
        const newData = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: any) => (item.id === message.id ? message : item)),
        }));
        return { ...oldData, pages: newData };
      });
    });

    // Handle new messages (add)
    socket.on(addKey, (message: any) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData?.pages) return { pages: [{ items: [message] }] };
        const exists = oldData.pages[0]?.items.some((item: any) => item.id === message.id);
        if (exists) return oldData;

        const newData = [...oldData.pages];
        newData[0] = { ...newData[0], items: [message, ...newData[0].items] };
        return { ...oldData, pages: newData };
      });
    });

    return () => {
      socket.off(addKey);
      socket.off(updateKey);
      socket.emit("leave-room", addKey);
      if (updateKey !== addKey) socket.emit("leave-room", updateKey);
    };
  }, [queryClient, addKey, queryKey, socket, updateKey]);
};
```

---

### 🪝 Hook 3: `useChatScroll` (Smart Auto-Scroll)

Handles bottom scrolling and history pagination:

```typescript
import { useEffect, useState } from "react";

export const useChatScroll = ({ chatRef, bottomRef, shouldLoadMore, loadMore, count }: any) => {
  const [hasInitialized, setHasInitialized] = useState(false);

  // Trigger loadMore when user scrolls to top
  useEffect(() => {
    const topDiv = chatRef?.current;
    const handleScroll = () => {
      if (topDiv?.scrollTop === 0 && shouldLoadMore) loadMore();
    };
    topDiv?.addEventListener("scroll", handleScroll);
    return () => topDiv?.removeEventListener("scroll", handleScroll);
  }, [shouldLoadMore, loadMore, chatRef]);

  // Auto scroll to bottom on initial load or if user is already near bottom (<=100px)
  useEffect(() => {
    const bottomDiv = bottomRef?.current;
    const topDiv = chatRef?.current;

    const shouldAutoScroll = () => {
      if (!hasInitialized && bottomDiv) {
        setHasInitialized(true);
        return true;
      }
      if (!topDiv) return false;
      const distanceFromBottom = topDiv.scrollHeight - topDiv.scrollTop - topDiv.clientHeight;
      return distanceFromBottom <= 100;
    };

    if (shouldAutoScroll()) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [bottomRef, chatRef, count, hasInitialized]);
};
```

---

## 🖥️ Assembling the Chat Component (`ChatMessages`)

```tsx
export function ChatMessages({ name, member, chatId, apiUrl, socketUrl, socketQuery, paramKey, paramValue, type }) {
  const queryKey = `chat:${chatId}`;
  const addKey = `chat:${chatId}:messages`;
  const updateKey = `chat:${chatId}:messages:update`;

  const chatRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useChatQuery({
    queryKey,
    apiUrl,
    paramKey,
    paramValue,
  });

  useChatSocket({ queryKey, addKey, updateKey });

  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: () => fetchNextPage(),
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  });

  if (status === "pending") return <LoaderSpinner />;
  if (status === "error") return <ErrorState />;

  return (
    <div className="flex-1 flex flex-col py-4 overflow-y-auto" ref={chatRef}>
      {!hasNextPage && <ChatWelcome name={name} type={type} />}
      {hasNextPage && <LoadMoreButton onClick={() => fetchNextPage()} loading={isFetchingNextPage} />}
      
      {/* Reverse column renders messages bottom-to-top naturally */}
      <div className="flex flex-col-reverse mt-auto">
        {data?.pages.map((group, i) => (
          <Fragment key={i}>
            {group?.items?.map((message) => (
              <ChatItem key={message.id} message={message} currentMember={member} socketUrl={socketUrl} socketQuery={socketQuery} />
            ))}
          </Fragment>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
```

---

## 📋 Reusable Checklist for Your Next Real-Time App

When you build another real-time app (chat, notifications, live comments, collaborative board), follow these steps:

- [ ] **Step 1: Standalone Socket Server**: Create `socket-server/index.ts` with CORS, room joins, and `/emit` POST handler.
- [ ] **Step 2: Socket Context**: Build `SocketProvider` wrapping your root layout to maintain the client socket connection.
- [ ] **Step 3: Internal Emit Helper**: Add `emitSocketEvent()` to call `http://localhost:3001/emit` from any backend route.
- [ ] **Step 4: Cursor-Paginated API Route**: Set up `GET` with cursor support and `POST` that creates data + calls `emitSocketEvent()`.
- [ ] **Step 5: TanStack Query Provider**: Wrap app in `QueryProvider` (`QueryClientProvider`).
- [ ] **Step 6: The 3 Hooks**:
  - `useChatQuery`: For loading paginated history.
  - `useChatSocket`: For inserting live events into the cache.
  - `useChatScroll`: For keeping user position smooth.
- [ ] **Step 7: UI Assembly**: Combine them in a flex container with `flex-col-reverse mt-auto`.
