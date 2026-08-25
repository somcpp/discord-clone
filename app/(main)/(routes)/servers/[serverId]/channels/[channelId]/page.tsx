import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChannelType } from "@/generated/prisma/enums";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { RedirectToSignIn } from "@clerk/nextjs";
import { Mic, Video, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

interface ChannelIdPageProps {
  params: Promise<{
    serverId: string;
    channelId: string;
  }>;
}

export default async function ChannelIdPage(props: ChannelIdPageProps) {
  const { channelId, serverId } = await props.params;
  const profile = await currentProfile();

  if (!profile) return <RedirectToSignIn />;

  const channel = await db.channel.findUnique({
    where: {
      id: channelId,
    },
  });

  const member = await db.member.findFirst({
    where: {
      serverId: serverId,
      profileId: profile.id,
    },
  });

  if (!channel || !member) redirect("/");

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        serverId={serverId}
        name={channel.name}
        type="channel"
      />
      {channel.type === ChannelType.TEXT && (
        <>
          <ChatMessages
            member={member}
            name={channel.name}
            chatId={channel.id}
            type="channel"
            apiUrl="/api/messages"
            socketUrl="/api/messages"
            socketQuery={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
            paramKey="channelId"
            paramValue={channel.id}
          />
          <ChatInput
            name={channel.name}
            type="channel"
            apiUrl="/api/messages"
            query={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
          />
        </>
      )}
      {channel.type === ChannelType.AUDIO && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 animate-pulse">
              <Mic className="w-12 h-12 text-indigo-500" />
            </div>
            <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-1.5 shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20 mb-3">
            Phase 5 Feature
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
            Voice Channel Coming Soon
          </h2>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-md">
            Low-latency audio streaming, voice activity detection, and mute/deafen controls powered by LiveKit WebRTC will be available here in Phase 5.
          </p>
        </div>
      )}
      {channel.type === ChannelType.VIDEO && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center border border-rose-500/30 animate-pulse">
              <Video className="w-12 h-12 text-rose-500" />
            </div>
            <div className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1.5 shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 mb-3">
            Phase 5 Feature
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
            Video Channel Coming Soon
          </h2>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-md">
            HD video grid, camera toggle, and real-time screen sharing powered by LiveKit WebRTC will be available here in Phase 5.
          </p>
        </div>
      )}
    </div>
  );
}