import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { RedirectToSignIn } from "@clerk/nextjs";

interface ServerIdPageProps {
    params: Promise<{
        serverId: string;
    }>;
}

export default async function ServerIdPage(props: ServerIdPageProps) {
    const params = await props.params;
    const profile = await currentProfile();

    if (!profile) return <RedirectToSignIn />;

    const server = await db.server.findUnique({
    where: {
      id: params.serverId,
      members: {
        some: {
          profileId: profile.id
        }
      }
    },
    include: {
      channels: {
        where: {
          name: "general"
        },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  const initialChannel = server?.channels[0];

  if (initialChannel?.name !== "general") {
    return null;
  }

  return redirect(`/servers/${params.serverId}/channels/${initialChannel.id}`);
}