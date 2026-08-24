export async function emitSocketEvent({
  room,
  event,
  data
}: {
  room?: string;
  event: string;
  data: any;
}) {
  try {
    const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
    const res = await fetch(`${socketUrl}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room, event, data }),
    });

    if (!res.ok) {
      console.warn(`[SOCKET_EMIT_WARNING] Status ${res.status} when emitting ${event}`);
    }
  } catch (error) {
    // Non-blocking error logging so API calls don't fail if socket server is momentarily offline
    console.error("[SOCKET_EMIT_ERROR]", error);
  }
}
