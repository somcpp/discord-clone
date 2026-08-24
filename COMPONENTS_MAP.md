# 🗺️ Discord Clone: Complete Component & Architecture Map

This document provides a complete map of all components, hooks, modals, and API routes in the Discord Clone. It outlines **what they take (Inputs/Props)**, **what they provide (Outputs/Features)**, and **their core responsibility**.

---

## 🌳 Component Hierarchy Tree

```
Page (`/servers/[id]/channels/[id]` or `/servers/[id]/conversations/[id]`)
 ├── ChatHeader (Title, Avatar/Hash, Mobile Drawer, Socket Indicator)
 ├── ChatMessages (The Feed Container)
 │    ├── ChatWelcome (Start of history greeting)
 │    ├── Infinite Scroll Trigger ("Load previous messages" button)
 │    └── ChatItem (Individual message bubble - loop)
 │         ├── UserAvatar (Profile picture)
 │         ├── ActionTooltip (Role badge tooltip & button tooltips)
 │         ├── Inline Edit Form (Input + Save button)
 │         └── Action Bar (Edit & Trash trigger buttons)
 └── ChatInput (Bottom message bar)
      ├── File Attachment (+) button -> Opens MessageFileModal
      ├── Text Input (React Hook Form)
      └── EmojiPicker (Popover + EmojiMart)
```

---

## 💬 1. Chat Components (`components/chat/`)

| Component | What It Takes (Props / Inputs) | What It Provides / Does | Key Files & Dependencies |
| :--- | :--- | :--- | :--- |
| **`ChatHeader`** | • `name`: string<br>• `serverId`: string<br>• `type`: `"channel"` \| `"conversation"`<br>• `imageUrl?`: string | Top channel/DM header with channel hash or user avatar, title, mobile menu toggle button, and live WebSocket connection indicator badge. | • `MobileToggle`<br>• `UserAvatar`<br>• `SocketIndicator` |
| **`ChatWelcome`** | • `name`: string<br>• `type`: `"channel"` \| `"conversation"` | Displayed at the very beginning of message history. Shows the channel hash bubble (*"Welcome to #general"*) or conversation greeting (*"This is the start of your conversation with Alice"*). | • `lucide-react` (`Hash`) |
| **`ChatMessages`** | • `name`: string<br>• `member`: `Member`<br>• `chatId`: string<br>• `apiUrl`: string<br>• `socketUrl`: string<br>• `socketQuery`: Record<br>• `paramKey`: `"channelId"` \| `"conversationId"`<br>• `paramValue`: string<br>• `type`: `"channel"` \| `"conversation"` | The main chat viewport. Combines `useChatQuery`, `useChatSocket`, and `useChatScroll` to render paginated message feeds, loading spinners, errors, and live incoming messages. | • `useChatQuery`<br>• `useChatSocket`<br>• `useChatScroll`<br>• `ChatItem`<br>• `ChatWelcome` |
| **`ChatItem`** | • `id`: string<br>• `content`: string<br>• `member`: `Member & { profile: Profile }`<br>• `timestamp`: string<br>• `fileUrl`: string \| null<br>• `deleted`: boolean<br>• `currentMember`: `Member`<br>• `isUpdated`: boolean<br>• `socketUrl`: string<br>• `socketQuery`: Record | Individual message bubble. Renders user avatar, name, role badge, timestamp, message content, image preview or PDF download link, soft delete text, inline editing form (`Esc`/`Enter`), and edit/delete hover buttons. | • `UserAvatar`<br>• `ActionTooltip`<br>• `useModal`<br>• `next/image` |
| **`ChatInput`** | • `apiUrl`: string<br>• `query`: Record<br>• `name`: string<br>• `type`: `"channel"` \| `"conversation"` | Bottom chat input bar. Handles text input submission via Axios, opens `MessageFileModal` on `+` click, and supports emoji insertion via `EmojiPicker`. | • `EmojiPicker`<br>• `useModal`<br>• `react-hook-form` |

---

## 🪝 2. Custom Hooks (`hooks/`)

| Hook | Parameters (Inputs) | What It Returns (Outputs) | Responsibility |
| :--- | :--- | :--- | :--- |
| **`useChatQuery`** | `{ queryKey, apiUrl, paramKey, paramValue }` | • `data`: Paginated messages<br>• `fetchNextPage`: Function<br>• `hasNextPage`: boolean<br>• `isFetchingNextPage`: boolean<br>• `status`: `"pending"` \| `"error"` \| `"success"` | Fetches messages in batches of 10 using TanStack Query v5 `useInfiniteQuery`. Automatically falls back to 1000ms polling if WebSocket disconnects. |
| **`useChatSocket`** | `{ addKey, updateKey, queryKey }` | *(None - side-effect listener)* | Joins the socket room (`join-room`). Listens to new messages (`addKey`) and edits/deletions (`updateKey`), directly mutating the TanStack Query cache in memory with `queryClient.setQueryData`. |
| **`useChatScroll`** | `{ chatRef, bottomRef, shouldLoadMore, loadMore, count }` | *(None - DOM scroll side-effect)* | Auto-scrolls to bottom on initial load. Auto-scrolls down on new messages only if user is within 100px of the bottom. Automatically triggers `loadMore()` when scrolled to top (`scrollTop === 0`). |
| **`useModal`** | *(Zustand Store)* | • `isOpen`: boolean<br>• `type`: `ModalType`<br>• `data`: `ModalData`<br>• `onOpen(type, data)`<br>• `onClose()` | Global modal state manager (Zustand). Allows any component to trigger any modal dialog across the app with dynamic context data. |
| **`useOrigin`** | *(None)* | • `origin`: string (e.g. `http://localhost:3000`) | Returns the window origin safely avoiding hydration mismatches between Next.js SSR and client. |

---

## 🪟 3. Modals & Dialogs (`components/modals/`)

| Modal | Modal Type Key | Triggered From | Functionality |
| :--- | :--- | :--- | :--- |
| **`MessageFileModal`** | `"messageFile"` | `ChatInput` (`+` button) | Uploads images/PDFs via UploadThing and sends them as chat messages. |
| **`DeleteMessageModal`**| `"deleteMessage"`| `ChatItem` (Trash button) | Confirms and executes soft-deletion of a channel or direct message. |
| **`CreateServerModal`** | `"createServer"` | Initial modal / Server sidebar | Creates a new server with name and image upload. |
| **`EditServerModal`**   | `"editServer"`   | Server header dropdown | Updates server name or image. |
| **`DeleteServerModal`** | `"deleteServer"` | Server header dropdown | Permanently deletes a server (Admin only). |
| **`LeaveServerModal`**  | `"leaveServer"`  | Server header dropdown | Leaves a server (Non-owners). |
| **`CreateChannelModal`**| `"createChannel"`| Server sidebar (+) / dropdown | Creates a new Text, Audio, or Video channel. |
| **`EditChannelModal`**  | `"editChannel"`  | Channel item edit icon | Updates channel name or type. |
| **`DeleteChannelModal`**| `"deleteChannel"`| Channel item trash icon | Deletes a channel. |
| **`MembersModal`**      | `"members"`      | Server header dropdown | Manages member roles (Guest/Mod/Admin) and kicks members. |
| **`InviteModal`**       | `"invite"`       | Server header dropdown | Generates and copies unique server invite links. |

---

## 🛠️ 4. Shared UI Components (`components/`)

| Component | Props / Inputs | What It Provides |
| :--- | :--- | :--- |
| **`UserAvatar`** | • `src?: string`<br>• `className?: string` | Standardized user avatar image with fallback styling and sizing. |
| **`FileUpload`** | • `onChange(url)`<br>• `value: string`<br>• `endpoint: "messageFile" \| "serverImage"` | Drag-and-drop file uploader using UploadThing. Renders circular preview for servers, and rectangular card for chat attachments. |
| **`EmojiPicker`** | • `onChange(emoji: string)` | Popover emoji picker powered by `@emoji-mart/react` matching dark/light themes. |
| **`SocketIndicator`** | *(None)* | Visual badge in header displaying green **Live: Real-time** or yellow **Fallback: Polling**. |
| **`MobileToggle`** | • `serverId: string` | Hamburger button that opens the server sidebar inside a slide-out Sheet on mobile screens. |
| **`ActionTooltip`** | • `label: string`<br>• `children: ReactNode`<br>• `side?: "top"\|"right"\|"bottom"\|"left"`<br>• `align?: "start"\|"center"\|"end"` | Popover tooltip that appears on hover with custom alignment. |
| **`ModeToggle`** | *(None)* | Dark/Light theme dropdown switcher using `next-themes`. |

---

## 🔌 5. API Route Handlers (`app/api/`)

| Route | Method | Query / Body Params | Action Performed |
| :--- | :---: | :--- | :--- |
| **`/api/messages`** | `GET` | `?channelId=...&cursor=...` | Returns 10 paginated channel messages + `nextCursor`. |
| **`/api/messages`** | `POST` | `?channelId=...&serverId=...`<br>Body: `{ content, fileUrl }` | Saves message to DB and emits socket broadcast to `chat:channelId:messages`. |
| **`/api/messages/[id]`** | `PATCH` | `?channelId=...&serverId=...`<br>Body: `{ content }` | Author-only message edit. Updates DB and emits socket update. |
| **`/api/messages/[id]`** | `DELETE` | `?channelId=...&serverId=...` | Soft deletes message (`deleted: true`). Emits socket update. |
| **`/api/direct-messages`** | `GET` | `?conversationId=...&cursor=...` | Returns 10 paginated 1-on-1 direct messages + `nextCursor`. |
| **`/api/direct-messages`** | `POST` | `?conversationId=...`<br>Body: `{ content, fileUrl }` | Saves DM to DB and emits socket broadcast to `chat:conversationId:messages`. |
| **`/api/direct-messages/[id]`** | `PATCH` | `?conversationId=...`<br>Body: `{ content }` | Author-only DM edit. Updates DB and emits socket update. |
| **`/api/direct-messages/[id]`** | `DELETE` | `?conversationId=...` | Soft deletes DM. Emits socket update. |
| **`/api/servers`** | `POST` | Body: `{ name, imageUrl }` | Creates a new server with default `#general` channel. |
| **`/api/servers/[id]`** | `PATCH` / `DELETE` | Body / URL param | Edits server details or deletes server. |
| **`/api/channels`** | `POST` | `?serverId=...`<br>Body: `{ name, type }` | Creates a channel inside the server. |
| **`/api/channels/[id]`** | `PATCH` / `DELETE` | `?serverId=...` | Edits or deletes a channel. |
| **`/api/members/[id]`** | `PATCH` / `DELETE` | `?serverId=...` | Changes member role or kicks member from server. |
| **`/api/uploadthing`** | `GET` / `POST` | Multi-part file upload | UploadThing backend router for authenticated uploads. |

---

## 🌐 6. Providers & Infrastructure (`components/providers/`)

| Provider | File | Responsibility |
| :--- | :--- | :--- |
| **`QueryProvider`** | `components/providers/query-provider.tsx` | Wraps application with TanStack `QueryClientProvider` for in-memory caching and infinite query state. |
| **`SocketProvider`** | `components/providers/socket-provider.tsx` | Establishes and manages the global WebSocket connection (`socket.io-client`) and exports `useSocket()`. |
| **`ModalProvider`** | `components/providers/modal-provider.tsx` | Mounts all modal dialogs at the root after client hydration to prevent SSR mismatch errors. |
| **`ThemeProvider`** | `components/providers/theme-provider.tsx` | Provides dark/light theme switching context via `next-themes`. |
| **`Socket Server`** | `socket-server/index.ts` | Standalone Node.js Socket.io server (port 3001) managing rooms and HTTP `/emit` endpoint. |
| **`Socket Emitter`** | `lib/socket-emit.ts` | Server-side internal fetch function that triggers broadcasts on the socket server. |
