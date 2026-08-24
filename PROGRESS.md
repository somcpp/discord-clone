# 📋 Development Progress & Architecture Roadmap

This file tracks all completed features, architectural decisions, and the step-by-step roadmap for building the Discord Clone.

---

## 🏗️ Architecture Overview

- **Frontend & API (Port 3000)**: Next.js App Router (React 19, Tailwind CSS v4, Clerk Auth, Prisma ORM, PostgreSQL).
- **Socket Server (Port 3001)**: Standalone Socket.io server (`socket-server/index.ts`) managing rooms and real-time broadcasts.
- **Hybrid Communication Pattern**:
  1. Client sends messages to Next.js API (`/api/messages`).
  2. Next.js validates user session via Clerk (`currentProfile`) and writes to PostgreSQL via Prisma.
  3. Next.js triggers the socket server via internal HTTP POST (`/emit`).
  4. Socket server broadcasts the event to all users connected to the channel/conversation room.

---

## 🚀 How to Run the Project

```bash
# Terminal 1: Run Next.js Frontend & Backend API
npm run dev

# Terminal 2: Run Socket Server
npm run socket
```

---

## 📊 Phase-by-Phase Roadmap

### ✅ Phase 0: Foundation, Auth & Server Management (Completed)
- [x] **Authentication**: Clerk setup with `currentProfile` & `initialProfile` utilities.
- [x] **Database Schema**: Prisma schema configured with PostgreSQL (Profiles, Servers, Channels, Members, Messages, Conversations, DirectMessages).
- [x] **Server Management**: Create Server, Edit Server, Delete Server, Leave Server, and Invite modals.
- [x] **Channel Management**: Create Channel, Edit Channel, and Delete Channel modals.
- [x] **Member Management**: Role management (Guest / Moderator / Admin) & Kick Member actions.
- [x] **Navigation & Layouts**: Server sidebar, Channel/Member list, Action tooltips, and Mobile drawer sheet.
- [x] **Conversation Helpers**: `lib/conversation.ts` for finding/creating 1-on-1 DM conversations.

---

### ✅ Phase 1: Real-Time Infrastructure & Chat Input (Completed)
- [x] **TanStack Query Setup**: Installed `@tanstack/react-query` and created `QueryProvider`.
- [x] **Socket Server Enhancement**: `socket-server/index.ts` with room management (`join-room`, `leave-room`) and `/emit` broadcast endpoint.
- [x] **Socket Client Provider**: `SocketProvider` context tracking `isConnected` status.
- [x] **Socket Status Indicator**: `SocketIndicator` badge in `ChatHeader` (shows **Live: Real-time** or **Fallback: Polling**).
- [x] **Emoji Picker**: `EmojiPicker` popover using `@emoji-mart/react` and theme matching.
- [x] **Chat Input**: `ChatInput` component with message submission, emoji insertion, and upload trigger.
- [x] **Message API Handler**: `app/api/messages/route.ts` supporting `GET` (cursor pagination) and `POST` (saves to DB and emits socket broadcast).

---

### ✅ Phase 2: Message Feed & Infinite Scrolling (Completed)
- [x] **`useChatQuery` hook**: Fetch historical messages in batches of 10 using TanStack `useInfiniteQuery`.
- [x] **`useChatSocket` hook**: Listen for real-time socket events (`addKey`, `updateKey`) and update the Query cache dynamically without page reload.
- [x] **`useChatScroll` hook**: Handle auto-scrolling to bottom on new messages and preserving scroll position when reading past messages.
- [x] **`ChatWelcome` component**: Display channel welcome header (*"Welcome to #general"*).
- [x] **`ChatItem` component**: Render individual message bubbles with user avatar, timestamp, role badge, file preview, edit button, and delete button.
- [x] **`ChatMessages` component**: Combine all hooks and components to render the full message feed in text channels.

---

### ✅ Phase 3: Message Editing, Deletion & File Attachments (Completed)
- [x] **Edit Message**: Inline editing directly inside `ChatItem` with Escape/Enter shortcuts and `/api/messages/[messageId]` PATCH handler.
- [x] **Delete Message**: `DeleteMessageModal` confirmation and `/api/messages/[messageId]` DELETE handler (soft delete).
- [x] **Attachment Upload**: `MessageFileModal` to upload images/PDFs in chat via UploadThing.

---

### ⏳ Phase 4: Direct Messaging (1-on-1 DMs) (Next Up)
- [ ] **DM API Route**: `app/api/direct-messages/route.ts` (cursor-paginated `GET` and authenticated `POST`).
- [ ] **DM Chat View**: Connect `ChatMessages` and `ChatInput` into `servers/[serverId]/conversations/[memberId]/page.tsx`.
- [ ] **DM Editing & Deleting**: Handle update/delete socket broadcasts for direct conversations.

---

### ⏳ Phase 5: Voice & Video Calling (LiveKit WebRTC)
- [ ] **LiveKit Integration**: Token generation API route (`app/api/livekit/route.ts`).
- [ ] **`MediaRoom` component**: Audio/video grid, mute/unmute, screen share, and video toggle button in header.

---

### ⏳ Phase 6: Final Polish & Optimization
- [ ] Mobile responsive layout testing & UX polish.
- [ ] Error handling & loading skeletons.
