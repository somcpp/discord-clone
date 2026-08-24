# 🎬 Complete Chat Simulation & Message Lifecycle Flow

An interactive, step-by-step simulation demonstrating how messages move between the **Client UI**, **Next.js Backend**, **Database (PostgreSQL)**, **Socket.io Server**, and **TanStack Query Cache** for both **Server Channels (Rooms)** and **Direct Messages (1-on-1 DMs)**.

---

## 👥 The Characters in Our Simulation

- **Alice** (Sender / Member)
- **Bob** (Receiver / Member)
- **Channel**: `#general` (`channelId = "chan-123"`, `serverId = "serv-456"`)
- **Direct Message**: Private DM between Alice and Bob (`conversationId = "conv-789"`)

---

# 🏢 SCENARIO 1: Server Channel Chat (`#general`)

---

### 📍 Step 1: Initial Page Load (Opening `#general`)

```
Alice & Bob open: http://localhost:3000/servers/serv-456/channels/chan-123
```

1. **Next.js Server Component** (`page.tsx`):
   - Validates Alice's Clerk session (`currentProfile`).
   - Confirms Alice belongs to server `serv-456`.
   - Renders `<ChatMessages />` and `<ChatInput />`.
2. **TanStack Query Initial Fetch** (`useChatQuery.ts`):
   - Calls `GET /api/messages?channelId=chan-123`.
   - Backend queries DB: `db.message.findMany({ take: 10, where: { channelId: "chan-123" } })`.
   - Returns 10 messages + `nextCursor = "msg-010"`.
   - TanStack Query stores this in browser memory under cache key: `["chat:chan-123"]`.
3. **Socket Room Subscription** (`useChatSocket.ts`):
   - Alice and Bob's browsers connect to the standalone socket server on port 3001.
   - Both emit: `socket.emit("join-room", "chat:chan-123:messages")`.
   - Socket server adds both Alice and Bob to room `"chat:chan-123:messages"`.
4. **Scroll Initialization** (`useChatScroll.ts`):
   - Measures viewport and smoothly scrolls to the bottom (newest message).

---

### 📍 Step 2: Alice Sends *"Hey everyone!"*

```
Alice types "Hey everyone!" into ChatInput and presses [Enter]
```

```
[Alice's Browser]
  │ 1. `components/chat/chat-input.tsx`
  │    Calls: axios.post("/api/messages?channelId=chan-123&serverId=serv-456", { content: "Hey everyone!" })
  ▼
[Next.js Backend: /api/messages]
  │ 2. `app/api/messages/route.ts`
  │    • Validates session via Clerk
  │    • Runs Prisma query:
  │      const message = await db.message.create({
  │        data: { content: "Hey everyone!", channelId: "chan-123", memberId: aliceMember.id },
  │        include: { member: { include: { profile: true } } }
  │      });
  │
  │ 3. Triggers Socket broadcast via internal HTTP POST:
  │    await emitSocketEvent({
  │      room: "chat:chan-123:messages",
  │      event: "chat:chan-123:messages",
  │      data: message
  │    });
  ▼
[Socket Server (Port 3001)]
  │ 4. `socket-server/index.ts`
  │    Receives /emit HTTP POST and executes:
  │    io.to("chat:chan-123:messages").emit("chat:chan-123:messages", message);
  ▼
[Broadcasted to All Clients in Room: Alice & Bob]
```

---

### 📍 Step 3: Bob's Screen Receives the Message Instantly

```
Bob is reading #general — his browser receives the WebSocket broadcast
```

```
[Bob's Browser: `hooks/use-chat-socket.ts`]
  │
  ├─► 1. Listener triggered: `socket.on("chat:chan-123:messages", (newMessage) => ...)`
  │
  ├─► 2. Injects message directly into TanStack Query cache:
  │      queryClient.setQueryData(["chat:chan-123"], (oldData) => {
  │        oldData.pages[0].items.unshift(newMessage);
  │        return oldData;
  │      });
  │
  ├─► 3. React detects cache update:
  │      `<ChatMessages />` re-renders with new `<ChatItem />` for Alice's message.
  │
  └─► 4. `useChatScroll.ts` detects Bob is at the bottom (distance <= 100px)
         and smoothly auto-scrolls down to reveal Alice's new message.
```

---

### 📍 Step 4: Alice Edits Her Message to *"Hey everyone! 👋"*

```
Alice hovers over her message -> clicks Edit icon (✏️) -> changes text -> clicks Save / Enter
```

1. **Client Action** (`components/chat/chat-item.tsx`):
   - Sends `PATCH /api/messages/msg-999?channelId=chan-123&serverId=serv-456` with `{ content: "Hey everyone! 👋" }`.
2. **Backend Execution** (`app/api/messages/[messageId]/route.ts`):
   - Verifies Alice is the original message author.
   - Updates PostgreSQL: `db.message.update({ where: { id: "msg-999" }, data: { content: "Hey everyone! 👋" } })`.
   - Calls `emitSocketEvent` to room `"chat:chan-123:messages"` with event `"chat:chan-123:messages:update"`.
3. **Socket Broadcast & Cache Mutation**:
   - Bob's `useChatSocket` receives event `"chat:chan-123:messages:update"`.
   - Searches TanStack cache for `item.id === "msg-999"` and replaces it in-memory.
   - Bob's screen updates immediately to *"Hey everyone! 👋 (edited)"*.

---

### 📍 Step 5: Alice Deletes Her Message

```
Alice hovers over her message -> clicks Trash icon (🗑️) -> confirms in DeleteMessageModal
```

1. **Client Action** (`components/modals/delete-message-modal.tsx`):
   - Sends `DELETE /api/messages/msg-999?channelId=chan-123&serverId=serv-456`.
2. **Backend Execution** (`app/api/messages/[messageId]/route.ts`):
   - Soft deletes in DB:
     ```json
     {
       "id": "msg-999",
       "content": "This message has been deleted.",
       "fileUrl": null,
       "deleted": true
     }
     ```
   - Emits event `"chat:chan-123:messages:update"`.
3. **Real-Time UI Update**:
   - Bob's screen instantly changes the text to italic *"This message has been deleted."* and removes action buttons.

---

# 🔒 SCENARIO 2: 1-on-1 Direct Messaging (DM)

---

### 📍 Step 1: Starting the DM

```
Alice clicks on Bob's name in the member list
```

1. **Navigation**: Alice's browser navigates to `/servers/serv-456/conversations/bob-member-id`.
2. **Conversation Lookup / Creation** (`app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx`):
   - Server runs `getOrCreateConversation(aliceMemberId, bobMemberId)`:
     - Checks PostgreSQL if a `Conversation` record already exists between Alice and Bob.
     - If not, creates a new `Conversation` (`id = "conv-789"`).
3. **DM View Setup**:
   - Loads `<ChatMessages />` configured with:
     - `apiUrl = "/api/direct-messages"`
     - `queryKey = "chat:conv-789"`
     - `addKey = "chat:conv-789:messages"`
     - `updateKey = "chat:conv-789:messages:update"`
   - Alice and Bob join private room `"chat:conv-789:messages"`.

---

### 📍 Step 2: Alice Sends an Image Attachment in DM

```
Alice clicks the [+] button -> selects "design.png" -> clicks [Send]
```

1. **Upload Phase** (`components/modals/message-file-modal.tsx`):
   - `FileUpload` uploads `design.png` to UploadThing storage.
   - UploadThing returns secure CDN URL: `https://utfs.io/f/xyz-design.png`.
   - Modal shows a rectangular media preview card.
2. **Submission**:
   - Submits `POST /api/direct-messages?conversationId=conv-789` with:
     `{ fileUrl: "https://utfs.io/f/xyz-design.png", content: "https://utfs.io/f/xyz-design.png" }`.
3. **Database & Broadcast** (`app/api/direct-messages/route.ts`):
   - Verifies Alice is a participant in conversation `conv-789`.
   - Saves record to PostgreSQL `DirectMessage` table.
   - Emits socket event to private room `"chat:conv-789:messages"`.
4. **Bob's Private Receipt**:
   - Only Bob (the other member in `conv-789`) receives the broadcast.
   - Bob's TanStack Query cache updates and renders the full image preview card in his DM window with Alice!

---

# 📊 State Tracing Table (Channel vs DM)

| Parameter | Channel Room (`#general`) | 1-on-1 DM (Alice ↔ Bob) |
| :--- | :--- | :--- |
| **URL Route** | `/servers/[serverId]/channels/[channelId]` | `/servers/[serverId]/conversations/[memberId]` |
| **API Endpoints** | `/api/messages`<br>`/api/messages/[messageId]` | `/api/direct-messages`<br>`/api/direct-messages/[directMessageId]` |
| **Database Table** | `Message` | `DirectMessage` |
| **TanStack Cache Key** | `["chat:chan-123"]` | `["chat:conv-789"]` |
| **Socket Room Name** | `"chat:chan-123:messages"` | `"chat:conv-789:messages"` |
| **New Message Event** | `"chat:chan-123:messages"` | `"chat:conv-789:messages"` |
| **Edit/Delete Event** | `"chat:chan-123:messages:update"` | `"chat:conv-789:messages:update"` |
| **Who Receives Event?** | All members currently in `#general` | Only Alice & Bob |

---

# 🔄 Lifecycle Summary Diagram

```
                     ┌───────────────────────┐
                     │ User Types & Submits  │
                     └──────────┬────────────┘
                                │
                                ▼
               ┌─────────────────────────────────┐
               │    HTTP POST to Next.js API     │
               │  (/api/messages or /api/dm)     │
               └────────────────┬────────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
       ┌──────────────────┐          ┌──────────────────┐
       │ PostgreSQL (DB)  │          │ Standalone Socket│
       │ Saved via Prisma │          │ Server (Port 3001│
       └──────────────────┘          └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ Room Broadcast   │
                                     │ (Socket.io)      │
                                     └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ useChatSocket    │
                                     │ (All Clients)    │
                                     └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ TanStack Cache   │
                                     │ Injected in 0ms  │
                                     └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ React UI Update  │
                                     │ + Auto-Scroll    │
                                     └──────────────────┘
```
